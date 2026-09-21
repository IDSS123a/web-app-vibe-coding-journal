/**
 * Certificates of completion, storage side (PDL-080, migration 037). A certificate row is created the first time a person's badges
 * show the programme is finished (lazily, when they open /certificates), so no route that earns a badge needs to know about it.
 */
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/db/client";
import { certificateDefinition, earnedKinds, issueDate, makeCertificateCode, type CertificateKind } from "./domain";

function db() {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  return supabaseAdmin;
}

export interface CertificateRow {
  kind: CertificateKind;
  code: string;
  issued_at: string;
}

/** Creates the certificates the person has earned and does not yet have; returns all of theirs. */
export async function ensureCertificates(userId: string): Promise<CertificateRow[]> {
  const { data: badgeRows, error: be } = await db().from("user_badges").select("badge_id, awarded_at").eq("user_id", userId);
  if (be) throw new Error(`Failed to read badges: ${be.message}`);
  const awardedAt = new Map((badgeRows ?? []).map((b) => [b.badge_id as string, b.awarded_at as string]));

  const { data: existing, error: ee } = await db().from("certificates").select("kind, code, issued_at").eq("user_id", userId);
  if (ee) throw new Error(`Failed to read certificates: ${ee.message}`);
  const have = new Set((existing ?? []).map((c) => c.kind as string));

  for (const kind of earnedKinds(awardedAt.keys())) {
    if (have.has(kind)) continue;
    // A code collision is astronomically unlikely (30^10), but the unique constraint makes it a retry, not a wrong answer.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await db()
        .from("certificates")
        .insert({ user_id: userId, kind, code: makeCertificateCode(randomBytes(10)), issued_at: issueDate(kind, awardedAt) ?? new Date().toISOString() });
      if (!error) break;
      // The same person and kind already exists (two tabs at once): fine, it is theirs.
      if (/certificates_user_id_kind_key/.test(error.message)) break;
      if (attempt === 2) throw new Error(`Failed to issue certificate: ${error.message}`);
    }
  }

  const { data, error } = await db().from("certificates").select("kind, code, issued_at").eq("user_id", userId).order("issued_at");
  if (error) throw new Error(`Failed to read certificates: ${error.message}`);
  return (data ?? []) as CertificateRow[];
}

/** For the public verification page: the programme and the date, never the person. */
export async function getCertificateByCode(code: string): Promise<{ title: string; programme: string; issuedAt: string } | null> {
  const { data, error } = await db().from("certificates").select("kind, issued_at").eq("code", code).maybeSingle();
  if (error) throw new Error(`Failed to verify certificate: ${error.message}`);
  if (!data) return null;
  const def = certificateDefinition(data.kind as string);
  if (!def) return null;
  return { title: def.title, programme: def.programme, issuedAt: data.issued_at as string };
}

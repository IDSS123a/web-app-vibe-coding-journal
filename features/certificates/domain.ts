/**
 * Certificates of completion (PDL-080). Pure functions: what earns each certificate, how its code is made and checked, and the
 * wording. No I/O (see repository.ts).
 *
 * A certificate is issued for a whole programme, and only when the badges prove it: Prompt School needs every chapter finished
 * (the graduate badge) AND the three level tests passed; the University needs its three level tests passed. The person's name is
 * typed by the person when printing and is not stored or checked, so the verification page confirms the programme and the date,
 * never a name.
 */
export type CertificateKind = "prompt-school" | "university";

export interface CertificateDefinition {
  kind: CertificateKind;
  title: string;
  programme: string;
  /** The line under the name on the printed certificate. */
  statement: string;
  /** Badge ids that must all be earned. */
  requires: string[];
  /** What is still to do, shown while it is locked. */
  howToEarn: string;
}

export const CERTIFICATES: CertificateDefinition[] = [
  {
    kind: "prompt-school",
    title: "Prompt School Certificate",
    programme: "Prompt School",
    statement:
      "has completed every chapter of Prompt School, with its lessons, exercises and workshops, and has passed the beginner, intermediate and advanced level tests. The course follows the book Mastering Prompt Engineering.",
    requires: ["ps-graduate", "ps-beginner", "ps-intermediate", "ps-advanced"],
    howToEarn: "Finish every chapter of Prompt School and pass its three level tests.",
  },
  {
    kind: "university",
    title: "Vibe-Coding University Certificate",
    programme: "Vibe-Coding University",
    statement: "has completed the Vibe-Coding University, three levels from beginner to expert, and has passed the beginner, intermediate and expert level tests.",
    requires: ["uni-beginner", "uni-intermediate", "uni-expert"],
    howToEarn: "Pass the three level tests of the Vibe-Coding University.",
  },
];

export function certificateDefinition(kind: string): CertificateDefinition | null {
  return CERTIFICATES.find((c) => c.kind === kind) ?? null;
}

/** The kinds whose required badges are all in the earned set. */
export function earnedKinds(earnedBadgeIds: Iterable<string>): CertificateKind[] {
  const have = new Set(earnedBadgeIds);
  return CERTIFICATES.filter((c) => c.requires.every((id) => have.has(id))).map((c) => c.kind);
}

/** The day the last required badge was earned: the certificate's issue date. Null until every required badge is earned. */
export function issueDate(kind: CertificateKind, awardedAt: Map<string, string>): string | null {
  const def = certificateDefinition(kind);
  if (!def) return null;
  const dates = def.requires.map((id) => awardedAt.get(id));
  if (dates.some((d) => !d)) return null;
  return (dates as string[]).reduce((latest, d) => (new Date(d) > new Date(latest) ? d : latest));
}

// A code people can read out or type without mistakes: no 0, 1, I, L, O, U.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_BODY_LENGTH = 10;

/** VBJ-XXXXX-XXXXX from ten random values 0 to 255 (the caller supplies them, so this stays pure and testable). */
export function makeCertificateCode(randomBytes: ArrayLike<number>): string {
  if (randomBytes.length < CODE_BODY_LENGTH) throw new Error("Not enough random values for a certificate code");
  let body = "";
  for (let i = 0; i < CODE_BODY_LENGTH; i++) body += ALPHABET[randomBytes[i]! % ALPHABET.length];
  return `VBJ-${body.slice(0, 5)}-${body.slice(5)}`;
}

const CODE_PATTERN = new RegExp(`^VBJ-[${ALPHABET}]{5}-[${ALPHABET}]{5}$`);

/** A code as typed by a person: trimmed and upper-cased, then checked for shape only. */
export function normalizeCertificateCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

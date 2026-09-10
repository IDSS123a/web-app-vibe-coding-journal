import { NextResponse } from "next/server";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";

export async function GET() {
  ensureAIProviderInitialized();
  const provider = getAIProvider();

  try {
    // A genuine false-positive case: "revolutionary" inside a proper noun.
    const falsePositiveCase = await provider.judgeHoldReason({
      holdReason: "revolutionary",
      reportExcerpt:
        "Iran's Revolutionary Guard Corps (IRGC) asserts it has destroyed an Amazon data center located in Bahrain. This claim requires independent verification.",
    });

    // A genuine hype case: actual marketing language.
    const genuineHypeCase = await provider.judgeHoldReason({
      holdReason: "revolutionary",
      reportExcerpt:
        "This revolutionary new framework will completely change the way you build software forever, disrupting the entire industry overnight.",
    });

    return NextResponse.json({ ok: true, falsePositiveCase, genuineHypeCase });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * Shared layout for the Appendix B workshops: every blueprint in the book has the same four parts (the scenario with
 * its detailed explanation, the Markdown prompt blueprint, the flowchart of the prompt's logic, and the suggested next
 * steps), so each blueprint lesson is built from one structured record. The prompt text is kept whole, because it is
 * the reusable asset of the blueprint. The flowchart cannot be drawn in a lesson, so its logic is given as numbered steps.
 */
export interface Blueprint {
  domain: string;
  scenario: string;
  goal: string;
  objective: string;
  /** Technique name and the book's justification for using it here. */
  techniques: Array<[string, string]>;
  intended: string;
  /** The complete Markdown prompt blueprint, exactly as a learner would paste it (no triple backticks inside). */
  prompt: string;
  /** The flowchart's logic in reading order. */
  flow: string[];
  flowNote: string;
  refinement: string[];
  application: string[];
  integration: string[];
  integrationTitle?: string;
  tryThis: string;
}

export function blueprintBody(bp: Blueprint): string {
  const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
  const steps = bp.flow.map((f, i) => `${i + 1}. ${f}`).join("\n");
  const techniques = bp.techniques.map(([name, why]) => `- **${name}.** ${why}`).join("\n");
  return `**Domain:** ${bp.domain}

## The scenario

${bp.scenario}

**Goal.** ${bp.goal}

## The objective

${bp.objective}

## Techniques used, and why

${techniques}

**Intended achievement.** ${bp.intended}

## The blueprint

Copy it, replace the placeholders and adapt it. Read it as a design: the CONTEXT sets the stage, the INSTRUCTION gives the control, the constraints act as guardrails and the headings are the fences.

\`\`\`
${bp.prompt}
\`\`\`

## How the prompt flows (the book's flowchart, in words)

${steps}

${bp.flowNote}

## Suggested next steps

### Prompt refinement

${list(bp.refinement)}

### Output application

${list(bp.application)}

### ${bp.integrationTitle ?? "Integration (advanced)"}

${list(bp.integration)}

**Try this:** ${bp.tryThis}`;
}

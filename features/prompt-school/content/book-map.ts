/**
 * The whole book "Mastering Prompt Engineering" as a list of sections (its own headings and worked examples),
 * each assigned to the Prompt School chapter that teaches it. This is the enforcement of the Director's rule
 * (2026-09-20): the School covers the COMPLETE book and skips no segment. Every lesson declares the sections it
 * covers (`covers`), and the content test fails when an authored chapter leaves any of its sections uncovered,
 * or when a lesson claims a section that is not in this map or belongs to another chapter.
 *
 * A chapter that is not authored yet keeps its sections here as the to-do list; `provisional` marks entries whose
 * granularity will be refined (split or renamed) when the chapter is written from the source text. Front matter
 * (copyright, ISBN, acknowledgements) and the table of contents are not teaching content and are not listed.
 *
 * Source: C:\DAVOR_PRIVATE\AI\My_Books\Manual - Prompt Engineering ADVANCED\Mastering_Prompt_Engineering.md
 */

export interface BookSection {
  /** Stable id, referenced by lessons. */
  id: string;
  /** Slug of the School chapter that teaches it (see outline.ts). */
  chapter: string;
  /** The book's own wording for the heading or example. */
  title: string;
  provisional?: boolean;
}

function group(chapter: string, prefix: string, items: Array<[string, string]>, provisional = false): BookSection[] {
  return items.map(([id, title]) => ({ id: `${prefix}-${id}`, chapter, title, ...(provisional ? { provisional: true } : {}) }));
}

export const BOOK_MAP: BookSection[] = [
  // ---------- Foreword and chapter 1 ----------
  ...group("craft-of-prompting", "foreword", [["dawn", "The Dawn of the Prompt Engineer"]]),
  ...group("craft-of-prompting", "ch1", [
    ["beyond-basic-questions", "Beyond Basic Questions: from casual user to deliberate designer"],
    ["iterative-heartbeat", "The Iterative Heartbeat: draft, test, analyze, refine"],
    ["goal-definition", "Goal Definition: the crucial first step"],
    ["paper-and-pencil", "The 'Paper and Pencil' Stage: planning your prompt"],
    ["thinking-like-engineer", "Thinking Like an Engineer: anticipating ambiguity and failure modes"],
    ["role-of-experimentation", "The Role of Experimentation: your personal workshop"],
    ["laying-groundwork", "Laying the Groundwork for Mastery"],
  ]),

  // ---------- Chapter 2: The Five Pillars ----------
  ...group("five-pillars", "ch2", [
    ["intro-anatomy", "Anatomy of an Effective Prompt: the five pillars"],
    ["context-setting-the-stage", "1. Context, Setting the Stage: how background turns noise into signal"],
    ["context-why-it-matters", "Why Context Matters for Language Systems"],
    ["context-types", "Types of Contextual Information"],
    ["context-setting-effectively", "Setting the Stage Effectively"],
    ["instructions-control-panel", "2. Instructions, The Control Panel: knobs and levers for precision"],
    ["instructions-characteristics", "Characteristics of Effective Instructions"],
    ["instructions-operating", "Operating the Control Panel"],
    ["examples-apprenticeship", "3. Examples, Apprenticeship by Demonstration: the guild system"],
    ["examples-why-works", "Why Demonstration Works So Well"],
    ["examples-using-effectively", "Using Examples Effectively"],
    ["examples-gold-star", "The Importance of Gold Star Selection"],
    ["constraints-guardrails", "4. Constraints, Guardrails and Speed Limits: keeping outputs on track"],
    ["constraints-why-necessary", "Why Boundaries Are Necessary"],
    ["constraints-types", "Types of Constraints"],
    ["constraints-implementing", "Implementing Guardrails, and finding the right balance"],
    ["delimiters-fences", "5. Delimiters, Semantic Fences: preventing conceptual cattle from straying"],
    ["delimiters-why-crucial", "Why Fencing is Crucial"],
    ["delimiters-building", "Building Clear Fences"],
    ["delimiters-common-choices", "Common Delimiter Choices"],
    ["delimiters-power", "The Power of Clear Fences"],
    ["synergy", "Bringing It All Together: the synergy of the pillars"],
    ["workshop-broken-prompt", "Workshop: the broken prompt and its diagnosis by pillar"],
    ["workshop-repair-steps", "Workshop: the repair process, steps 1 to 5"],
    ["workshop-why-it-works", "Why the Repaired Prompt Works"],
  ]),

  // ---------- Chapter 3: Foundational techniques ----------
  ...group("foundational-techniques", "ch3", [
    ["intro-two-modes", "Direct Instruction and Demonstration: the two foundational methods"],
    ["zero-shot-telegraph", "1. Zero-Shot Prompting, The Telegraph Method"],
    ["zero-shot-when-works", "When Does the Telegraph Method Work Best?"],
    ["zero-shot-why-works", "Why Does it Work? The power of learned patterns"],
    ["zero-shot-examples", "Markdown Examples of Zero-Shot Prompts (four)"],
    ["zero-shot-limitations", "Limitations of the Telegraph Method"],
    ["few-shot-recipe-card", "2. Few-Shot Learning, The Recipe Card Approach"],
    ["few-shot-why-show", "Why Show, Not Just Tell? The power of pattern matching"],
    ["few-shot-structure", "The Structure of a Recipe Card (Few-Shot Prompt)"],
    ["few-shot-examples", "Markdown Examples of Few-Shot Prompts (three)"],
    ["one-shot-vs-few-shot", "One-Shot vs. Few-Shot"],
    ["gold-star-quality-sampling", "3. Quality Sampling, Gold Star Selection"],
    ["gold-star-why", "Why Gold Star Examples Are Non-Negotiable"],
    ["gold-star-criteria", "Criteria for a Gold Star Example"],
    ["gold-star-finding", "Finding or Crafting Your Gold Star Examples"],
    ["practical-exercise", "Practical Exercise: from telegraph to recipe card (steps 1 to 5)"],
    ["why-few-shot-superior", "Why the Few-Shot Prompt is Superior"],
    ["choosing-tool", "Choosing Your Foundational Tool"],
  ]),

  // ---------- Appendix C: Markdown manual (beginner) ----------
  ...group("markdown-for-prompts", "appC", [
    ["intro", "Markdown Manual: formatting for clearer prompts"],
    ["headings", "1. Headings: organizing the blueprint"],
    ["emphasis", "2. Emphasis: highlighting critical instructions"],
    ["lists", "3. Lists: sequencing steps and presenting examples"],
    ["code-blocks", "4. Code Blocks"],
    ["inline-code", "5. Inline Code: highlighting specific terms or snippets"],
    ["blockquotes", "6. Blockquotes: offsetting quoted material"],
    ["horizontal-rules", "7. Horizontal Rules: simple visual separation"],
    ["tables", "8. Tables: requesting or demonstrating tabular data"],
    ["escaping", "9. Escaping Markdown Characters: referring to literals"],
    ["carpenter-tools", "The Carpenter's Marking Tools"],
  ]),

  // ---------- Chapter 4: Advanced techniques ----------
  ...group("reasoning-techniques", "ch4", [
    ["intro", "Advanced Techniques: guiding the reasoning process"],
    ["cot-clockwork", "1. Chain-of-Thought (CoT), The Clockwork Method"],
    ["cot-why-steps-help", "Why Does Detailing the Steps Help?"],
    ["cot-how-to-prompt", "Engaging the Clockwork: how to prompt for CoT"],
    ["cot-value-exposing", "The Value of Exposing the Mechanism"],
    ["cot-limitations", "Limitations of CoT"],
    ["tot-forking-paths", "2. Tree of Thoughts (ToT), The Forking Paths Technique"],
    ["tot-simulating", "Simulating Forking Paths Through Prompting"],
    ["tot-advantages", "Advantages of Exploring the Branches"],
    ["tot-challenges", "Challenges of Managing the Exploration"],
    ["distill-essence", "3. Knowledge Distillation (Prompting), The Essence Extractor"],
    ["distill-process", "The Distillation Process"],
    ["distill-conceptual-example", "Conceptual Example"],
    ["distill-mindset", "The Essence Extractor Mindset"],
    ["case-study-anya", "Case Study: Anya's prompt structure, how it simulated forking paths, outcome"],
    ["expanding-repertoire", "Expanding Your Prompting Repertoire"],
  ], true),

  // ---------- Chapter 5: Structuring interaction ----------
  ...group("structure-and-protection", "ch5", [
    ["intro", "Structuring Interaction"],
    ["tags-dewey", "1. Structuring Output with Tags, The Dewey Decimal System for Machines"],
    ["tagging-concept", "The Concept of Tagging Data"],
    ["prompting-tagged-output", "Prompting for Tagged Output: demonstrating the Dewey system"],
    ["tagged-examples", "Markdown Examples of Prompts Requesting Tagged Output"],
    ["benefits-structure", "Benefits of Imposing Structure"],
    ["considerations", "Considerations"],
    ["delims-defensive", "2. Delimiters as Defensive Boundaries, Semantic Fences Revisited"],
    ["threat", "The Threat: prompt injection"],
    ["why-injection-works", "Why Does Injection Work? Blurring authority"],
    ["building-defenses", "Building the Defenses"],
    ["adversarial-stress-test", "3. Understanding Adversarial Inputs, Stress-Testing the Vault"],
    ["adversarial-strategies", "Common Adversarial Input Strategies (to test against)"],
    ["purpose-stress-testing", "The Purpose of Stress-Testing"],
    ["how-to-stress-test", "How to Stress-Test (Simulated)"],
    ["workshop-scenario", "Workshop: scenario and the vulnerable prompt V1"],
    ["workshop-weakness", "Workshop: the weakness analysis"],
    ["workshop-your-task", "Workshop: your task, and the protected prompt V2 with its explanation"],
    ["conclusion", "Structure for Clarity, Robustness, and Security"],
  ], true),

  // ---------- Chapter 6: Domain-specific prompting ----------
  ...group("code-and-research", "ch6", [
    ["intro", "Domain-Specific Prompting"],
    ["coding-forge", "1. Coding Assistance, The Blacksmith's Forge"],
    ["why-prompt-for-code", "Why Prompt for Code? Leveraging trained patterns"],
    ["essential-techniques", "Essential Prompting Techniques for the Forge"],
    ["common-tasks", "Common Tasks at the Forge and Prompt Strategies"],
    ["debugging-example", "Debugging: analysis and fix, worked examples"],
    ["research-archivist", "2. Research and Analysis, The Archivist's Lens"],
    ["rag-workflow", "The RAG Workflow (Conceptual)"],
    ["markdown-examples", "Markdown Examples: answering from a policy document"],
    ["summarization-workflow", "Workflow: summarizing and finding themes across provided abstracts"],
    ["large-documents", "Handling Large Documents"],
    ["power-of-lens", "The Power of the Archivist's Lens"],
    ["key-considerations", "Key Considerations"],
    ["adapting-craft", "Adapting the Craft to the Material"],
  ], true),

  // ---------- Chapter 7: Optimization and debugging ----------
  ...group("optimize-and-debug", "ch7", [
    ["intro", "Optimization and Debugging"],
    ["iterative-refinement", "1. Iterative Refinement, The Watchmaker's Patience"],
    ["stages", "Stages 1 to 5 of the refinement cycle"],
    ["essence-of-iteration", "The Essence of Iteration"],
    ["ab-testing", "2. A/B Testing, The Double-Blind Taste Test"],
    ["ab-variants", "Create Variants (A and B), and the test steps"],
    ["ab-example", "A/B Testing Example"],
    ["controlled-comparison", "The Value of Controlled Comparison"],
    ["troubleshooting", "3. Troubleshooting Common Failures, Tracing Faulty Wiring"],
    ["problems-1-3", "Problems 1 to 3"],
    ["problems-4-7", "Problems 4 to 7"],
    ["debugging-mindset", "The Debugging Mindset"],
    ["workshop-v0-v1", "Workshop: Version 0 and the first refinement cycle (V0 to V1)"],
    ["workshop-v2-v3", "Workshop: V2, V3 and the workshop conclusion"],
    ["pursuit-of-perfection", "The Pursuit of Prompt Perfection"],
  ], true),

  // ---------- Chapter 8: Ethics and responsibility ----------
  ...group("ethics-and-bias", "ch8", [
    ["intro", "Ethics and Responsibility"],
    ["guiding-principles", "1. Guiding Principles (Constitutional AI concepts), The Hippocratic Oath for Systems"],
    ["prompting-in-alignment", "Prompting in Alignment (conceptual example)"],
    ["bias-lens-grinder", "2. Bias Detection and Mitigation, The Lens Grinder's Test"],
    ["manifestations", "Manifestations of Bias"],
    ["sources-of-distortion", "Sources of Distortion"],
    ["test-kit", "The Lens Grinder's Test Kit"],
    ["mitigation", "Mitigation Through Prompting"],
    ["workshop", "Workshop: scenario, audit steps and the revised prompt V2"],
    ["ethical-compass", "The Prompt Engineer's Ethical Compass"],
  ], true),

  // ---------- Chapter 9: Cutting-edge methods ----------
  ...group("tools-and-multimodal", "ch9", [
    ["intro", "Cutting-Edge Methods: expanding the interaction"],
    ["tool-use", "1. Tool Use and Orchestration (MRKL concepts), The Swiss Army Knife Approach"],
    ["multimodal", "2. Multimodal Prompting, The Theater Director's Craft"],
    ["collaborative-markdown", "3. Collaborative Markdown, A Hybrid Syntax for Human-AI Co-Creation"],
    ["core-ideas", "Core Ideas"],
    ["implications", "Prompt Engineering Implications"],
    ["challenges", "Challenges"],
    ["note", "Note"],
    ["expanding-horizon", "Expanding the Prompt Engineer's Horizon"],
  ], true),

  // ---------- Chapter 10: Real-world case studies ----------
  ...group("case-studies", "ch10", [
    ["intro", "Real-World Case Studies"],
    ["cs1-goal", "Case Study 1: Customer Service Chatbots, The Switchboard Operator's Revival: the goal"],
    ["cs1-iterations", "Case Study 1: the prompt engineering process, iterations 0 to 3"],
    ["cs1-challenges", "Case Study 1: key challenges and learnings in building GadgetHelper"],
    ["cs1-conclusion", "Case Study 1: conclusion"],
    ["cs2-goal", "Case Study 2: Scientific Research, The Lab Assistant Upgrade: the goal"],
    ["cs2-approaches", "Case Study 2: approach 1 and approach 2"],
    ["cs2-iterative-key", "Regardless of approach, Iterative Refinement is Key"],
    ["cs2-conclusion", "Case Study 2: conclusion"],
    ["craft-in-context", "The Craft in Context"],
  ], true),

  // ---------- Chapter 11: The future ----------
  ...group("the-future", "ch11", [
    ["intro", "The Future"],
    ["apprenticeship-loop", "1. How Systems Learn Preferences, The Apprenticeship Loop"],
    ["rlhf", "RLHF in Language Models"],
    ["why-it-matters", "Why This Matters for Your Prompting"],
    ["horizon", "2. Emerging Trends and Possibilities, The Horizon"],
    ["trend-autonomy", "Trend 1: increased autonomy and planning (agentic systems)"],
    ["trend-multimodality", "Trend 2: deeper multimodality"],
    ["trend-personalization", "Trend 3: enhanced personalization and memory"],
    ["trend-interaction", "Trend 4: more fluid interaction modalities"],
    ["trend-grounding", "Trend 5: improved grounding, factuality and uncertainty"],
    ["trend-safety", "Trend 6: co-evolution of capabilities and safety and ethics"],
    ["enduring-principles", "3. The Enduring Principles, Timeless Craft in a Changing World"],
  ], true),

  // ---------- Appendix B: Template library (15 blueprints, three workshops of five) ----------
  ...group("blueprints-1", "appB", [
    ["intro", "Template Library: the workshop blueprints, how to read a blueprint"],
    ["bp01", "Blueprint 1: Sales and Marketing Strategy Analysis (Perfume Launch)"],
    ["bp02", "Blueprint 2: Warehouse Inventory and Dispatch Planning"],
    ["bp03", "Blueprint 3: Production Material Flow Planning (Shift-Based)"],
    ["bp04", "Blueprint 4: Banking Customer Analysis and Service Personalization"],
    ["bp05", "Blueprint 5: Educational Lesson Plan Generation"],
  ], true),
  ...group("blueprints-2", "appB", [
    ["bp06", "Blueprint 6: Retail Inventory Replenishment and Shelf Allocation Strategy"],
    ["bp07", "Blueprint 7: Pharmaceutical Market Analysis (Drug Registration and Potential)"],
    ["bp08", "Blueprint 8: Call Center Interaction Analysis (Quality Assurance)"],
    ["bp09", "Blueprint 9: Personalized Personal Finance Guidance (Authenticated User)"],
    ["bp10", "Blueprint 10: Interactive To-Do List Management and Reporting"],
  ], true),
  ...group("blueprints-3", "appB", [
    ["bp11", "Blueprint 11: Language Learning Center Program and Student Management"],
    ["bp12", "Blueprint 12: Laboratory Sample Analysis Tracking and Reporting"],
    ["bp13", "Blueprint 13: Fitness Center Client Needs Assessment and Program Suggestion"],
    ["bp14", "Blueprint 14: Investigative Journalism Assistance (Information Triage and Analysis)"],
    ["bp15", "Blueprint 15: Scientific Research Paper Writing Assistance"],
  ], true),

  // ---------- Appendix D: Techniques quick reference ----------
  ...group("techniques-reference", "appD", [
    ["intro", "Techniques Quick Reference: advanced prompt engineering methods at a glance"],
    ["table", "The techniques table (each technique with its scenario and application), to be itemized when written"],
  ], true),

  // ---------- Appendix A: Glossary ----------
  ...group("glossary", "appA", [
    ["intro", "Glossary: the Prompt Engineer's Lexicon, from Alignment to Zero-Shot"],
    ["a-to-c", "Terms A to C (A/B Testing to Controller/Router)"],
    ["d-to-f", "Terms D to F (Debugging to Format)"],
    ["g-to-k", "Terms G to K (Gold Star Selection to Knowledge Base)"],
    ["l-to-o", "Terms L to O (Large Language Model to Optimization)"],
    ["p-to-r", "Terms P to R (Persona to Role)"],
    ["s-to-z", "Terms S to Z (Safety to Zero-Shot Prompting)"],
  ], true),

  // ---------- Appendices E and F ----------
  ...group("resources-and-platforms", "appE", [
    ["intro", "Further Reading and Resources: continuing the journey"],
    ["foundational", "1. Foundational Concepts: strengthening the bedrock"],
    ["specialized", "2. Specialized areas and techniques"],
    ["staying-current", "3. Staying Current: navigating the information flow"],
    ["ethics", "4. Ethics, Safety, and Responsibility: the essential compass"],
    ["enduring-craft", "The Enduring Craft"],
  ], true),
  ...group("resources-and-platforms", "appF", [
    ["intro", "Prompting Platforms and Tools: choosing your workbench"],
    ["categories", "1. Categories of platforms and tools"],
    ["choosing", "2. Choosing Your Workbench: key factors to consider"],
    ["free-vs-paid", "3. A Note on Free vs. Paid Tools"],
    ["privacy", "4. Data Privacy and Security: a non-negotiable consideration"],
    ["right-tool", "The Right Tool for the Task"],
  ], true),
];

export function sectionsOfChapter(chapterSlug: string): BookSection[] {
  return BOOK_MAP.filter((s) => s.chapter === chapterSlug);
}

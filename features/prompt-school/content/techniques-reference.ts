/**
 * Chapter "Techniques Quick Reference" (book Appendix D): 4 lessons and 10 exercises, written from the Director's book,
 * which is the only source. The book's table has 48 rows (scenario area, technique, description, example of usage); each
 * row is one entry below and one section in book-map.ts, grouped into four lessons by what the technique is for. The
 * book's chapter numbers in the table (for example "Ch 4") are off by one because they predate the Craft chapter, so
 * they were not copied. No em dashes (writing rule, PDL-057). `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

interface Technique {
  /** Suffix of the book-map id (appD-t-<id>). */
  id: string;
  name: string;
  /** The table's "Scenario Area" column. */
  area: string;
  /** The table's "Description (What it is)" column. */
  what: string;
  /** The table's "Example of Usage" column, as markdown. */
  usage: string;
}

function renderTechniques(items: Technique[]): string {
  return items
    .map((t) => `### ${t.name}\n\n*Scenario area: ${t.area}.*\n\n**What it is.** ${t.what}\n\n${t.usage}`)
    .join("\n\n");
}

const coversOf = (items: Technique[]) => items.map((t) => `appD-t-${t.id}`);

const FOUNDATIONS: Technique[] = [
  {
    id: "zero-shot",
    name: "Zero-Shot Learning (the Telegraph Method)",
    area: "Immediate task execution",
    what: "Asks the model to perform a common task directly, without examples.",
    usage: "**Scenario.** A simple translation. **Application.** Prompt: \"Translate 'Hvala' from Bosnian to English.\"",
  },
  {
    id: "few-shot",
    name: "Few-Shot Learning (the Recipe Card Approach)",
    area: "New task learning",
    what: "Provides a few input to output examples to demonstrate a task or a format.",
    usage: "**Scenario.** Formatting addresses consistently. **Application.** Provide 2 to 3 examples that show an unstructured address as input and the desired formatted output block. Then provide the new unstructured address to format.",
  },
  {
    id: "in-context",
    name: "In-Context Learning (equivalent to few-shot)",
    area: "Quick learning",
    what: "Learns the task from examples provided directly within the prompt context.",
    usage: "See Few-Shot Learning. The term emphasizes learning within the single prompt instance.",
  },
  {
    id: "zero-shot-cot",
    name: "Zero-shot CoT",
    area: "Quick problem solving",
    what: "Uses simple trigger phrases (\"Let's think step by step\") to get reasoning.",
    usage: "**Scenario.** A quick calculation is needed. **Application.** Prompt: \"I have 100 euros, items cost 15, 25 and 30 euros. Can I buy all? Let's think step by step.\"",
  },
  {
    id: "cot",
    name: "Chain-of-Thought, CoT (the Clockwork Method)",
    area: "Problem solving",
    what: "Explicitly guides reasoning by requiring step-by-step output.",
    usage: "**Scenario.** Solving a multi-step logic puzzle or math problem. **Application.** Instruct: \"Solve this: [problem details]. Show your reasoning step-by-step before the final answer.\" It increases accuracy and gives transparency.",
  },
  {
    id: "few-shot-cot",
    name: "Few-shot CoT",
    area: "Teaching by example (CoT)",
    what: "Shows examples that include step-by-step reasoning before the main task.",
    usage: "**Scenario.** Teaching a specific calculation method. **Application.** Provide examples like \"Problem: X, Steps: [show detailed steps for X], Answer: Y\". Then: \"Now solve Problem Z using the same step-by-step method.\"",
  },
  {
    id: "tot",
    name: "Tree of Thoughts, ToT (the Forking Paths)",
    area: "Complex decision making",
    what: "The model explores and evaluates multiple reasoning branches, internally or through prompt simulation.",
    usage: "**Scenario.** Choosing between complex policy options. **Application.** The prompt simulates ToT: \"1. Generate 3 policy options. 2. Evaluate each on cost, impact, feasibility. 3. Recommend the best based on the evaluation.\"",
  },
  {
    id: "self-consistency",
    name: "Self-Consistency",
    area: "Critical analysis",
    what: "Generates multiple outputs or reasoning paths and selects the most common, most consistent result.",
    usage: "**Scenario.** Solving a math problem that could go wrong. **Application.** Instruct (or the system does it internally): \"Solve this problem 3 times using slightly different reasoning paths. Output the answer that appears most consistently across the attempts.\"",
  },
  {
    id: "quality-sampling",
    name: "Quality Sampling (output selection)",
    area: "Optimal output selection",
    what: "Generates multiple outputs for a prompt, then selects the best one based on criteria.",
    usage: "**Scenario.** Needing the best possible headline for an article. **Application.** Instruct: \"Generate 5 potential headlines for this article [text provided]. Then evaluate each for clarity and engagement, and output only the single best one.\"",
  },
  {
    id: "divide",
    name: "Divide and Conquer",
    area: "Managing complexity",
    what: "Breaks a large task into smaller, sequential sub-tasks within the prompt.",
    usage: "**Scenario.** Developing a business plan outline. **Application.** Instruct: \"Let's outline the plan: 1. Define the mission statement. 2. Describe the target market. 3. Outline the product or service. 4. Detail the marketing strategy. 5. Create a basic financial projection overview.\"",
  },
  {
    id: "hierarchical",
    name: "Hierarchical Prompting (conceptual)",
    area: "Strategic planning",
    what: "Uses a high-level prompt to outline stages, potentially feeding the results to later prompts.",
    usage: "**Scenario.** Outlining a large research project. **Application.** Prompt 1 defines the overall goals and phases. Prompt 2 focuses on the Phase 1 tasks, based on the output of Prompt 1. Prompt 3 focuses on Phase 2, and so on. This is manual or semi-automated chaining.",
  },
  {
    id: "chaining",
    name: "Sequential Task Processing (chaining)",
    area: "Workflow automation",
    what: "Links multiple prompts, so that the output of one becomes the input of the next.",
    usage: "**Scenario.** Multi-stage report generation. **Application.** Prompt 1 summarizes the data. Prompt 2 takes the summary and extracts trends. Prompt 3 takes the trends and drafts an executive brief. It can be manual or automated.",
  },
  {
    id: "ensemble",
    name: "Ensemble Methods (conceptual, via prompt)",
    area: "Complex problem solving",
    what: "Combines the outputs of different prompt approaches for better results.",
    usage: "**Scenario.** Getting diverse ideas for a difficult problem. **Application.** Run three separate prompts with different personas or angles (analytical, creative, user-focused). Synthesize the best elements of each output, manually or in a final prompt.",
  },
];

const SHAPING: Technique[] = [
  {
    id: "constrained",
    name: "Constrained Generation (Guardrails)",
    area: "Targeted content creation",
    what: "Sets specific rules (length, format, forbidden content) for the output.",
    usage: "**Scenario.** Generating a product tweet. **Application.** Instruct: \"Write a tweet (under 280 chars) about Product X, highlighting its key benefit [benefit]. Must include the hashtag #ProductX. Do not mention price.\"",
  },
  {
    id: "schema",
    name: "Schema-Based Prompting",
    area: "Structured output",
    what: "Instructs the output to follow a specific predefined structure.",
    usage: "**Scenario.** Extracting customer feedback details. **Application.** Instruct: \"Analyze feedback [text]. Output JSON with keys sentiment (Positive/Negative/Neutral), key_issues (list), suggested_actions (list).\"",
  },
  {
    id: "xml-json",
    name: "XML/JSON Tagging (the Dewey Decimal System)",
    area: "API integration",
    what: "Requests output formatted in structured, machine-readable tags or keys.",
    usage: "**Scenario.** Feeding product review analysis into a database. **Application.** Instruct: \"Analyze review [text]. Output XML: `<review><sentiment>...</sentiment><keywords>...</keywords></review>`.\"",
  },
  {
    id: "markdown",
    name: "Markdown Formatting",
    area: "Documentation",
    what: "Using Markdown syntax in prompts for structure, or requesting it in the output.",
    usage: "**Scenario.** Generating project documentation. **Application.** Instruct: \"Create a CONTRIBUTING.md file using Markdown. Include sections ## How to Contribute and ## Code Style Guide with bullet points.\"",
  },
  {
    id: "template",
    name: "Template Prompting (Blueprints)",
    area: "Reusable prompting",
    what: "Creates prompts with placeholders for easy reuse with different inputs.",
    usage: "**Scenario.** Regularly summarizing articles. **Application.** Create a template like: \"Summarize this article: [Article Text Placeholder]. Keep the summary under [Word Count Placeholder] words.\" Reuse it by filling in the placeholders.",
  },
  {
    id: "context-stuffing",
    name: "Context Stuffing (Grounding, RAG principles)",
    area: "Comprehensive understanding",
    what: "Provides extensive background text or documents within the prompt.",
    usage: "**Scenario.** Answering questions about a specific research paper. **Application.** Provide the paper's abstract and relevant sections as context. Instruct: \"Based only on the provided text excerpts below, answer the user's question...\"",
  },
  {
    id: "rag",
    name: "Retrieval-Augmented Generation, RAG (the Archivist's Lens)",
    area: "Research and analysis",
    what: "Grounds responses by retrieving relevant external information and adding it to the context.",
    usage: "**Scenario.** Answering \"What were the key findings of the 2023 X study?\". **Application.** Retrieve the study abstract and results. Prompt: \"Based only on this retrieved text [paste text], summarize the key findings.\"",
  },
  {
    id: "hypothetical-doc",
    name: "Hypothetical Document Simulation",
    area: "Content generation",
    what: "Asks the model to generate content as if it had access to a specific document.",
    usage: "**Scenario.** Brainstorming content for a user manual that does not exist yet. **Application.** Instruct: \"Imagine a detailed user manual for 'WidgetPro'. Write the 'Troubleshooting' section, anticipating common user problems based on its likely features [feature list provided].\"",
  },
  {
    id: "expert-persona",
    name: "Expert Persona Prompting",
    area: "Domain-specific tasks",
    what: "Instructs the AI to adopt the role and knowledge of a specific expert.",
    usage: "**Scenario.** Explaining a medical concept simply. **Application.** Instruct: \"Act as an experienced pediatric nurse explaining [condition] to the concerned parents of a 5-year-old child. Use simple, reassuring language.\"",
  },
  {
    id: "multi-persona",
    name: "Multi-persona Dialogue",
    area: "Multiple perspectives",
    what: "Prompts the AI to simulate a conversation between different personas.",
    usage: "**Scenario.** Exploring different viewpoints on a design choice. **Application.** Instruct: \"Simulate a brief dialogue between a 'Minimalist Designer' and a 'Functionality-First Engineer' discussing the pros and cons of adding Feature Y.\"",
  },
  {
    id: "simulated-user",
    name: "Simulated User Testing",
    area: "User experience testing",
    what: "Has the AI adopt different user personas to interact with a concept or system.",
    usage: "**Scenario.** Testing a website navigation concept. **Application.** Instruct: \"Simulate a first-time user with low technical skill trying to find the contact page on this described website layout. Describe their likely path and any difficulties.\"",
  },
];

const IMPROVING: Technique[] = [
  {
    id: "ab-testing",
    name: "A/B Testing (the Double-Blind Taste Test)",
    area: "Prompt optimization",
    what: "Systematically compares two prompt variations that differ by one element.",
    usage: "**Scenario.** Deciding between two ways to phrase an instruction for generating marketing slogans. **Application.** Run both prompts (A and B) on the same inputs and have blinded reviewers rate the creativity and effectiveness of the slogans. Choose the variant with statistically better ratings.",
  },
  {
    id: "iterative",
    name: "Iterative Refinement (the Watchmaker's Patience)",
    area: "Content improvement",
    what: "The core process of test, analyze, refine and repeat, to improve prompts.",
    usage: "**Scenario.** A generated summary is too vague. **Application.** Analyze the failure (a lack of specific instruction?). Refine the prompt, for example \"Summarize focusing on key quantitative results\". Test again. Repeat until satisfied.",
  },
  {
    id: "distillation",
    name: "Knowledge Distillation (the Essence Extractor)",
    area: "Simplified instruction",
    what: "Simplifies a complex working prompt down to its essential components.",
    usage: "**Scenario.** A long, complex prompt with many examples works well for style transfer. **Application.** Analyze which examples and instructions are truly critical. Create a shorter prompt with only those essential elements. Test whether the performance is maintained.",
  },
  {
    id: "self-critique",
    name: "Self-Critique",
    area: "Quality assurance",
    what: "Asks the model to evaluate its own work against given criteria.",
    usage: "**Scenario.** Checking generated marketing copy. **Application.** Instruct: \"Draft marketing copy for Product Y. Then critique your draft: Is it persuasive? Is the call-to-action clear? Is the tone appropriate?\"",
  },
  {
    id: "reflexion",
    name: "Reflexion",
    area: "Error correction",
    what: "Prompts the model to critique and improve its own prior output.",
    usage: "**Scenario.** Improving a first draft. **Application.** Instruct: \"1. Write a paragraph about [topic]. 2. Now critique the paragraph you just wrote for clarity and conciseness. 3. Provide a revised paragraph based on your critique.\"",
  },
  {
    id: "devils-advocate",
    name: "Devil's Advocate",
    area: "Argument improvement",
    what: "Prompts the AI to critique its own previously generated arguments.",
    usage: "**Scenario.** Refining a persuasive proposal. **Application.** Instruct: \"1. Write arguments supporting Plan A. 2. Now act as a Devil's Advocate and rigorously critique each argument you just made, identifying weaknesses or counterpoints.\"",
  },
  {
    id: "calibrated-self-eval",
    name: "Calibrated Self-Evaluation",
    area: "Performance evaluation",
    what: "Prompts the model to assess the quality or confidence of its own output.",
    usage: "**Scenario.** Generating a complex technical explanation. **Application.** Instruct: \"After explaining quantum computing, rate your explanation's clarity for a non-expert (1 to 5) and state your confidence in its factual accuracy.\" It helps gauge reliability.",
  },
  {
    id: "metacognitive",
    name: "Metacognitive Prompting",
    area: "Uncertainty management",
    what: "Asks the model to reflect on its own confidence or thought process.",
    usage: "**Scenario.** Getting an analysis of a complex situation. **Application.** Instruct: \"Analyze the potential geopolitical impact of Event Z. Explicitly state areas where your analysis is speculative or based on limited information.\"",
  },
  {
    id: "factuality",
    name: "Factuality Verification Prompts",
    area: "Information verification",
    what: "Asks the model to check its claims or state its confidence.",
    usage: "**Scenario.** Generating a historical summary. **Application.** Instruct: \"Write a summary of Event Y. After writing, review each factual claim made and add a confidence score (Low/Medium/High) based on standard historical accounts.\"",
  },
  {
    id: "explainability",
    name: "Explainability Prompts",
    area: "Understanding AI logic",
    what: "Asks the model to justify its response or its reasoning process.",
    usage: "**Scenario.** The system recommended Investment A over B. **Application.** Instruct: \"You recommended Investment A. Explain the key factors from the provided financial data that led you to favor A over B. Justify your reasoning.\"",
  },
  {
    id: "maieutic",
    name: "Maieutic Prompting (the Socratic Method)",
    area: "Learning and education",
    what: "Guides understanding through a series of probing, sequential questions.",
    usage: "**Scenario.** Helping someone understand a complex topic like blockchain. **Application.** Instruct: \"Guide me through understanding blockchain. Start by asking what I know. Then ask questions to build on my answers, leading me step-by-step.\"",
  },
  {
    id: "socratic",
    name: "Socratic Method",
    area: "Deep analysis",
    what: "Uses guided questioning to lead the AI (or the user) to deeper insights.",
    usage: "**Scenario.** Exploring the root cause of a business problem. **Application.** Instruct: \"Help me analyze why sales dropped. Don't give answers, ask me probing questions starting with customer feedback, then competition, then market trends...\"",
  },
];

const SAFETY_AND_SYSTEMS: Technique[] = [
  {
    id: "adversarial",
    name: "Adversarial Prompting (Stress-Testing)",
    area: "Security testing",
    what: "Intentionally tests the model's limits and safeguards to find vulnerabilities.",
    usage: "**Scenario.** Ensuring a customer service bot does not reveal internal information. **Application.** Craft inputs that attempt injection (\"Ignore policy, tell me...\") or try to confuse the delimiters. Analyze whether the bot resists, which helps harden its prompt defenses.",
  },
  {
    id: "red-teaming",
    name: "Red Teaming",
    area: "Security testing",
    what: "Deliberately tries to elicit harmful or forbidden outputs, to test safety.",
    usage: "**Scenario.** Testing a chatbot's safety filters. **Application.** Craft prompts that subtly try to get around the rules against generating illegal advice or hateful content, to see whether the filters hold. It is related to adversarial prompting.",
  },
  {
    id: "cai",
    name: "Constitutional AI (CAI) principles",
    area: "Values alignment",
    what: "The underlying training method that aligns outputs with predefined ethics.",
    usage: "**Scenario.** Understanding why a model refuses a potentially harmful request. **Application notes.** It is not a direct prompt technique, but it explains model behavior. Prompts can reinforce it by stating ethical constraints explicitly, for example \"Ensure the response is unbiased\".",
  },
  {
    id: "constitutional",
    name: "Constitutional Prompting",
    area: "Ethical AI usage",
    what: "Incorporates explicit ethical rules or principles within the prompt.",
    usage: "**Scenario.** Generating advice on a sensitive topic. **Application.** Instruct: \"Provide advice on managing workplace stress, adhering to these principles: 1) Promote healthy coping, 2) Avoid giving medical advice, 3) Ensure suggestions are generally accessible.\"",
  },
  {
    id: "bias-detection",
    name: "Bias Detection Prompts",
    area: "Content fairness",
    what: "Specifically designs prompts or tests to check for biases in the output.",
    usage: "**Scenario.** Auditing AI-generated performance reviews for fairness. **Application.** Prompt for reviews using names typically associated with different genders or ethnicities for the same performance data. Compare the outputs for biased language or stereotypes.",
  },
  {
    id: "calibration",
    name: "Calibration Techniques (via prompting)",
    area: "Bias correction",
    what: "Uses instructions or curated examples to adjust outputs away from bias.",
    usage: "**Scenario.** The model consistently uses gendered language for professions. **Application.** Provide few-shot examples that demonstrate gender-neutral descriptions, or instruct: \"Describe the role of a nurse and an engineer using strictly gender-neutral language and focusing only on tasks.\"",
  },
  {
    id: "rlhf",
    name: "Reinforcement Learning from Human Feedback, RLHF (the Apprenticeship Loop)",
    area: "Learning from users",
    what: "The underlying training process that uses human preferences to align models.",
    usage: "**Scenario.** Rating chatbot responses. **Application notes.** It explains model alignment. Users contribute through thumbs up or down or ratings, which inform future RLHF cycles run by developers.",
  },
  {
    id: "ape",
    name: "Automatic Prompt Engineering, APE",
    area: "AI-assisted prompting",
    what: "Uses AI itself to help generate or refine effective prompts.",
    usage: "**Scenario.** Struggling to find the best prompt for a complex summarization task. **Application.** Use an APE tool or prompt to generate several candidate prompts, then test and refine the most promising ones manually. This is an advanced external tool concept.",
  },
  {
    id: "prompt-tuning",
    name: "Prompt Tuning (technical)",
    area: "Advanced prompt development",
    what: "Automated (often gradient-based) optimization of prompt wording.",
    usage: "**Scenario notes.** It typically requires specialized tools or APIs beyond manual prompt engineering. The conceptual idea is automated refinement based on performance data.",
  },
  {
    id: "mrkl",
    name: "MRKL Systems (the Swiss Army Knife Approach)",
    area: "Knowledge integration",
    what: "The underlying architecture that coordinates language models with specialized tools.",
    usage: "**Scenario.** Asking \"What's 15% of $580 plus the current temperature in Banja Luka?\". **Application notes.** The user does not prompt for it directly, but the system architecture might call a calculator tool and then a weather API tool, orchestrated by a language model.",
  },
  {
    id: "react",
    name: "ReAct (Reason + Act)",
    area: "Task automation",
    what: "A framework in which the model alternates reasoning steps and actions (tool use).",
    usage: "**Scenario.** Booking travel. **Application notes.** It is an agent framework. The conceptual flow: Think: I need a flight from B&H to Germany. Act: search flights tool. Observe: results received. Think: find the best price and time. Act: select flight tool. This is an advanced agent concept.",
  },
  {
    id: "multimodal",
    name: "Multimodal Prompting (the Theater Director)",
    area: "Visual content",
    what: "Combines text instructions with image (or other modality) inputs.",
    usage: "**Scenario.** Describing a fashion item. **Application.** Provide [IMAGE: photo of dress] and instruct: \"Write an engaging description for this dress, highlighting the neckline detail visible in the image and the fabric type 'silk blend'.\"",
  },
];

export const TECHNIQUES_LESSONS: LessonContent[] = [
  {
    slug: "the-expanded-toolkit-foundations-and-reasoning",
    title: "The expanded toolkit: foundations and reasoning",
    minutes: 10,
    covers: ["appD-intro", ...coversOf(FOUNDATIONS)],
    body: `This appendix is a quick-reference map to the diverse landscape of prompt engineering techniques in the manual. Think of it as an inventory of the more specialized tools in your workshop, complementing the fundamental five pillars and the basic methods. Each entry gives a concise reminder of the technique's purpose and a practical scenario that shows how it is applied.

Remember that these techniques are not isolated tricks but interconnected approaches. Often the most effective prompts blend several methods: perhaps few-shot examples that clarify a chain of thought process, or retrieval principles applied inside a persona-driven interaction. Use the table to identify quickly the tools that fit the challenge in front of you, and always go back to the main chapters for the nuances, the limitations and the iterative refinement that these techniques need. Mastery lies not just in knowing the tools, but in knowing when and how to combine them with skill and care.

## How the book's table is laid out

Every row of the book's table has four columns:

1. **Scenario area:** the kind of job the technique serves.
2. **Technique or method:** its name, often with the workshop metaphor used in the chapters.
3. **Description:** what it is, in one line.
4. **Example of usage:** an illustrative scenario and how and why the technique is applied.

The book lists 48 rows in alphabetical order of scenario area. In this School they are regrouped into four lessons by what they are for: foundations and reasoning, shaping input and output, improving and checking, and safety and how the systems work underneath. Nothing was left out.

## The foundations and reasoning group

The first group holds the basic ways to ask (zero-shot, few-shot, in-context learning), the reasoning techniques (chain of thought in its zero-shot and few-shot forms, tree of thoughts, self-consistency, quality sampling) and the ways to organize a large task (divide and conquer, hierarchical prompting, chaining, ensemble methods).

${renderTechniques(FOUNDATIONS)}

**Try this:** choose one big task of yours and split it three ways: as a single prompt with numbered steps (divide and conquer), as three chained prompts, and as three prompts with different personas that you then combine.`,
  },
  {
    slug: "the-expanded-toolkit-shaping-input-and-output",
    title: "The expanded toolkit: shaping input and output",
    minutes: 10,
    covers: coversOf(SHAPING),
    body: `The second group is about what goes into the prompt and what comes out: the rules for the output (constraints, schemas, tags, Markdown, templates), the material you give the system (context, retrieval, an imagined document) and the voices you ask it to take (an expert, several personas, a simulated user).

${renderTechniques(SHAPING)}

**Try this:** take a prompt you reuse and turn it into a template with placeholders, then add one constraint (a length) and one output rule (a heading structure).`,
  },
  {
    slug: "the-expanded-toolkit-improving-and-checking",
    title: "The expanded toolkit: improving and checking",
    minutes: 10,
    covers: coversOf(IMPROVING),
    body: `The third group is about quality. Some techniques improve the prompt itself (A/B testing, iterative refinement, knowledge distillation). Some make the model check its own work (self-critique, reflexion, the devil's advocate, calibrated self-evaluation, metacognitive and factuality prompts, explainability). And two guide understanding through questions (the maieutic and the Socratic methods).

${renderTechniques(IMPROVING)}

**Try this:** ask for a short paragraph on a topic you know, then run reflexion on it (write, critique, revise) and note what the critique caught that you would have missed.`,
  },
  {
    slug: "the-expanded-toolkit-safety-and-systems",
    title: "The expanded toolkit: safety, ethics and how the systems work",
    minutes: 10,
    covers: [...coversOf(SAFETY_AND_SYSTEMS), "appD-closing"],
    body: `The last group covers testing and protecting (adversarial prompting, red teaming), values and fairness (constitutional AI and prompting, bias detection and calibration) and the machinery underneath: training methods and architectures that you do not prompt directly but that explain the behavior you see (RLHF, MRKL, ReAct), the tools that help write prompts (automatic prompt engineering, prompt tuning) and multimodal input.

A note on reading these entries: some of them, such as constitutional AI, RLHF, MRKL systems and prompt tuning, are marked in the book as not being direct prompt techniques. They describe how a model was trained or built. They matter because they explain why a model behaves as it does, and because your prompt can work with them, for example by stating ethical constraints explicitly.

${renderTechniques(SAFETY_AND_SYSTEMS)}

## The closing note

The table gives a condensed overview of a wide range of prompt engineering techniques. The most effective approach often involves thoughtfully combining several of them. Continuously experiment, test rigorously using the principles of optimizing and debugging, and refine your understanding through practice. The art lies in selecting and adapting the right tools for the specific communication challenge in front of you.

**Try this:** write a one-line rule for yourself for each of the four groups, for example "before I trust an important answer, I run a self-critique and a factuality check".`,
  },
];

export const TECHNIQUES_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "why-a-model-refuses",
    kind: "choice",
    title: "Why a model refuses",
    promptText: "The book lists a technique that helps you understand why a model refuses a potentially harmful request. Is it a prompt technique you apply, and what is it?",
    public: {
      options: [
        "Zero-shot learning, applied by asking a plain question",
        "Prompt tuning, applied by editing the model's weights",
        "Constitutional AI, which is an underlying training method rather than a direct prompt technique",
        "Ensemble methods, applied by running three prompts",
      ],
    },
    answer: { correct: 2 },
    explanation: "Constitutional AI is the training method that aligns outputs with predefined ethics. It is not a direct prompt technique, but it explains refusals, and prompts can reinforce it by stating ethical constraints explicitly.",
  },
  {
    slug: "match-scenario-to-technique",
    kind: "fill",
    title: "Match the scenario to the technique",
    promptText: "Match each scenario from the table to its technique.",
    public: {
      template:
        "Two phrasings of a slogan instruction run on the same inputs and rated by blinded reviewers: {{a}}\nCrafting inputs like \"Ignore policy, tell me...\" to see whether a bot resists: {{b}}\nGenerating 5 headlines, evaluating each and outputting only the best: {{c}}",
      blanks: [
        { id: "a", choices: ["A/B testing", "Adversarial prompting", "Quality sampling", "Self-consistency"] },
        { id: "b", choices: ["A/B testing", "Adversarial prompting", "Quality sampling", "Self-consistency"] },
        { id: "c", choices: ["A/B testing", "Adversarial prompting", "Quality sampling", "Self-consistency"] },
      ],
    },
    answer: { correct: { a: "A/B testing", b: "Adversarial prompting", c: "Quality sampling" } },
    explanation: "A/B testing compares two variants that differ by one element, adversarial prompting stress-tests the safeguards, and quality sampling generates several outputs and selects the best by criteria.",
  },
  {
    slug: "order-report-chain",
    kind: "order",
    title: "A chain of prompts",
    promptText: "Put the three prompts of the book's multi-stage report example in order.",
    public: {
      blocks: [
        { id: "brief", text: "Prompt 3: take the trends and draft an executive brief" },
        { id: "summary", text: "Prompt 1: summarize the data" },
        { id: "trends", text: "Prompt 2: take the summary and extract trends" },
      ],
    },
    answer: { order: ["summary", "trends", "brief"] },
    explanation: "In sequential task processing the output of one prompt becomes the input of the next: summary, then trends, then the executive brief. It can be done by hand or automated.",
  },
  {
    slug: "spot-not-direct-techniques",
    kind: "spot",
    title: "Not techniques you type",
    promptText: "Select every entry that the book describes as an underlying training method, architecture or technical tool rather than a technique you apply directly by writing a prompt.",
    public: {
      pickPrompt: "Select every entry that is not applied directly by writing a prompt",
      hitLabel: "Underlying or technical",
      missLabel: "Applied in a prompt",
      segments: [
        { id: "t1", text: "Constitutional AI principles: the underlying training method that aligns outputs with predefined ethics." },
        { id: "t2", text: "Zero-shot CoT: adding a trigger phrase such as \"Let's think step by step\"." },
        { id: "t3", text: "RLHF: the training process that uses human preferences to align models." },
        { id: "t4", text: "Devil's advocate: asking the AI to critique its own arguments." },
        { id: "t5", text: "MRKL systems: an architecture that coordinates language models with specialized tools." },
        { id: "t6", text: "Prompt tuning: automated, often gradient-based optimization of prompt wording." },
      ],
    },
    answer: { flawed: ["t1", "t3", "t5", "t6"] },
    explanation: "Constitutional AI, RLHF, MRKL systems and prompt tuning are training methods, architectures or specialized tooling. They explain or extend model behavior, while zero-shot CoT and the devil's advocate are instructions you write.",
  },
  {
    slug: "self-consistency-vs-sampling",
    kind: "choice",
    title: "Two ways to use several outputs",
    promptText: "Self-consistency and quality sampling both produce several outputs. How do they choose the result?",
    public: {
      options: [
        "Self-consistency outputs the answer that appears most consistently across attempts, while quality sampling selects the best output by given criteria",
        "Both always pick the first output",
        "Self-consistency picks the longest answer, quality sampling picks the shortest",
        "Self-consistency asks a human, quality sampling asks the model to guess",
      ],
    },
    answer: { correct: 0 },
    explanation: "Self-consistency looks for the most common, consistent result across reasoning paths (good for problems with one right answer). Quality sampling evaluates several outputs against criteria such as clarity and engagement and outputs the best.",
  },
  {
    slug: "self-checking-instructions",
    kind: "fill",
    title: "Instructions that make the model check itself",
    promptText: "Match each instruction to the technique it shows.",
    public: {
      template:
        "\"Write a paragraph. Now critique it for clarity and conciseness and provide a revised paragraph.\": {{a}}\n\"After explaining, rate your clarity for a non-expert from 1 to 5 and state your confidence in its accuracy.\": {{b}}\n\"Write a summary, then add a confidence score of Low, Medium or High to each factual claim.\": {{c}}",
      blanks: [
        { id: "a", choices: ["Reflexion", "Calibrated self-evaluation", "Factuality verification", "Ensemble methods"] },
        { id: "b", choices: ["Reflexion", "Calibrated self-evaluation", "Factuality verification", "Ensemble methods"] },
        { id: "c", choices: ["Reflexion", "Calibrated self-evaluation", "Factuality verification", "Ensemble methods"] },
      ],
    },
    answer: { correct: { a: "Reflexion", b: "Calibrated self-evaluation", c: "Factuality verification" } },
    explanation: "Reflexion critiques and revises prior output, calibrated self-evaluation rates quality and confidence, and factuality verification checks each claim and states confidence in it.",
  },
  {
    slug: "zero-shot-cot-trigger",
    kind: "choice",
    title: "The trigger phrase",
    promptText: "What does zero-shot CoT add to a prompt to get step-by-step reasoning without any examples?",
    public: {
      options: [
        "Three worked examples with their steps",
        "A role such as pediatric nurse",
        "A JSON schema",
        "A simple trigger phrase such as \"Let's think step by step\"",
      ],
    },
    answer: { correct: 3 },
    explanation: "Zero-shot CoT uses a simple trigger phrase. Few-shot CoT is the version that shows worked examples including their steps.",
  },
  {
    slug: "order-react-loop",
    kind: "order",
    title: "The ReAct loop",
    promptText: "Put the book's travel booking flow in order.",
    public: {
      blocks: [
        { id: "act2", text: "Act: select flight tool" },
        { id: "observe", text: "Observe: results received" },
        { id: "think1", text: "Think: I need a flight from B&H to Germany" },
        { id: "think2", text: "Think: find the best price and time" },
        { id: "act1", text: "Act: search flights tool" },
      ],
    },
    answer: { order: ["think1", "act1", "observe", "think2", "act2"] },
    explanation: "ReAct alternates reasoning and action: think, act, observe the result, think again, act again. It is an agent framework rather than something a user writes in a single prompt.",
  },
  {
    slug: "maieutic-opening",
    kind: "choice",
    title: "Which method starts by asking what you know?",
    promptText: "Which technique fits a request like \"Guide me through understanding blockchain. Start by asking what I know, then ask questions that build on my answers\"?",
    public: {
      options: [
        "Zero-shot learning",
        "Maieutic prompting, the Socratic method for learning",
        "Prompt tuning",
        "Hypothetical document simulation",
      ],
    },
    answer: { correct: 1 },
    explanation: "Maieutic prompting guides understanding through a series of probing, sequential questions that build on the learner's answers.",
  },
  {
    slug: "repair-constrained-tweet",
    kind: "repair",
    title: "Add guardrails to a request",
    promptText: "Rewrite this request as constrained generation: a length limit, the key benefit to highlight, a required element, and something that must not be mentioned.",
    public: {
      starter: "Write a tweet about our new product.",
      hint: "State a maximum length, name the benefit, require a hashtag, and forbid something such as the price.",
    },
    answer: {
      criteria: [
        { id: "length", label: "Sets a length limit", weight: 2, anyOf: ["\\b(under|max\\w*|no more than|at most|up to)\\b[\\s\\S]*\\b(chars?|characters?|words?)\\b", "\\b\\d+\\s*(chars?|characters?|words?)\\b"], hint: "Say how long it may be, for example under 280 characters." },
        { id: "benefit", label: "Names the key benefit to highlight", weight: 2, anyOf: ["\\b(benefit|highlight\\w*|emphasi[sz]\\w*|focus on)\\b"], hint: "Tell the system which benefit to highlight." },
        { id: "required", label: "Requires a specific element", weight: 2, anyOf: ["\\b(must include|include|hashtag|#\\w+)\\b"], hint: "Require an element such as a hashtag." },
        { id: "forbidden", label: "Forbids something", weight: 2, anyOf: ["\\b(do not|don't|must not|never|without|avoid)\\b"], hint: "Add a forbidden element, for example do not mention the price." },
      ],
      model:
        "Write a tweet (under 280 characters) about our new product, highlighting its key benefit: it saves an hour a day. It must include the hashtag #ProductX. Do not mention the price.",
    },
    explanation: "Constrained generation sets specific rules for the output: length, format and forbidden content. Each rule removes a way for the answer to go wrong, and each one can be checked afterwards.",
    samples: {
      good: [
        "Write a tweet of at most 200 characters about our product. Highlight the benefit of saving time and include the hashtag #Fast. Avoid any mention of price.",
      ],
      bad: ["Write a tweet about our new product.", "Write a great tweet about our new product and make it exciting."],
    },
  },
];

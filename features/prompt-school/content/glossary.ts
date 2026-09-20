/**
 * Chapter "The Prompt Engineer's Lexicon" (book Appendix A, the glossary): 7 lessons and 10 exercises, written from the
 * Director's book, which is the only source. The glossary has 91 terms; each is one entry below and one section in
 * book-map.ts, taught in alphabetical groups that follow the book. The glossary's chapter references use the book's
 * current numbering and are kept as "book chapter N". No em dashes (writing rule, PDL-057). `samples` on repair
 * exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

interface Term {
  /** Suffix of the book-map id (appA-<id>). */
  id: string;
  term: string;
  definition: string;
  /** The glossary's "See Chapter N" pointer, in words. */
  ref?: string;
}

function renderTerms(items: Term[]): string {
  return items
    .map((t) => `### ${t.term}\n\n${t.definition}${t.ref ? `\n\n*In the book: ${t.ref}.*` : ""}`)
    .join("\n\n");
}

const coversOf = (items: Term[]) => items.map((t) => `appA-${t.id}`);

const A_TO_C: Term[] = [
  { id: "ab-testing", term: "A/B Testing (the Double-Blind Taste Test)", definition: "A methodical process for objectively comparing two versions of a prompt (Variant A and Variant B) that differ in only one specific element, such as an instruction's wording or the number of examples. The outputs of both variants, generated from the same test inputs, are evaluated against a predefined, measurable goal (the success metric). This taste test shows empirically which design choice gives demonstrably better results, and moves optimization beyond guesswork.", ref: "chapter 7" },
  { id: "accuracy", term: "Accuracy", definition: "The factual correctness, logical soundness, or faithfulness of the generated output to any provided source material. Ensuring accuracy is a primary goal, often challenged by the risk of hallucination. Techniques like grounding prompts in specific context (RAG) are crucial for improving accuracy, but human verification remains essential for critical applications." },
  { id: "action-verbs", term: "Action-Oriented Verbs", definition: "Clear, direct verbs (Summarize, List, Generate, Compare, Explain, Extract) used at the start of the instructions in a prompt. Strong action verbs clarify the primary task required of the system, reduce ambiguity and form the core of precise commands.", ref: "chapter 2, Instructions" },
  { id: "adversarial", term: "Adversarial Prompting (Stress-Testing)", definition: "The practice of intentionally crafting prompts or inputs designed to probe the limits, expose weaknesses or bypass the safety mechanisms of a computational system. Like stress-testing a bridge or a vault, it helps identify vulnerabilities (such as susceptibility to prompt injection or bias generation) so that more robust prompts and safeguards can be developed.", ref: "chapter 5" },
  { id: "agent", term: "Agent (Agentic System)", definition: "A more advanced computational system that can do more than respond to single prompts: it can autonomously understand a higher-level goal, formulate a plan with multiple steps, possibly use various tools (such as search or code execution) and execute that plan to achieve the goal. It represents a shift toward more independent problem solving.", ref: "chapter 11" },
  { id: "alignment", term: "Alignment", definition: "The crucial process and ongoing goal of ensuring that a computational system's behavior and outputs correspond reliably to human intentions, preferences and ethical values (helpfulness, honesty within its knowledge, and harmlessness). Techniques like RLHF are key methods developers use to achieve alignment, making the system's instincts safer and more cooperative. Understanding alignment helps explain why systems behave as they do.", ref: "chapters 8 and 11" },
  { id: "analogy", term: "Analogy (Metaphor)", definition: "A core pedagogical tool used throughout the book. By comparing complex computational concepts to more familiar, tangible mechanisms or processes (the clockwork, the recipe card, the Swiss Army knife, the lens grinder), analogies serve as bridges to understanding for a non-technical audience and make abstract ideas more concrete." },
  { id: "anthropic", term: "Anthropic", definition: "An AI research company noted for its focus on safety and for its development of large language models and of alignment techniques like Constitutional AI. Its work is relevant to discussions on building safer, more ethical AI systems." },
  { id: "api", term: "API (Application Programming Interface)", definition: "A technical specification that allows different software programs to communicate and exchange data in a structured way. Interacting with language models programmatically often involves sending prompts and receiving responses through an API, which enables their integration into websites, applications or automated workflows." },
  { id: "archivists-lens", term: "Archivist's Lens (the metaphor for RAG)", definition: "The analogy the book uses for Retrieval-Augmented Generation. It highlights the two-stage process: first, retrieving relevant documents or data snippets (like an archivist finding specific files), and second, using the prompt to focus the language system's analysis only on that retrieved context (the lens concentrating on the material found).", ref: "chapter 6" },
  { id: "bias", term: "Bias (in AI outputs)", definition: "A systematic pattern of unfair or prejudiced treatment in generated text, often reflecting stereotypes or historical inequities present in the system's training data. Bias can show up as stereotypical associations, underrepresentation, skewed sentiment or harmful generalizations. Detecting and mitigating bias through careful prompting and testing is a critical ethical responsibility.", ref: "chapter 8" },
  { id: "blacksmiths-forge", term: "Blacksmith's Forge (the metaphor for coding assistance)", definition: "The analogy for using prompts to assist with programming tasks. It compares the prompt engineer to a blacksmith who uses specific tools (prompt techniques) and controlled force (instructions, examples) to shape raw material (a coding requirement or existing code) into a desired, functional outcome (a code snippet, an explanation or a bug fix).", ref: "chapter 6" },
  { id: "blueprint", term: "Blueprint (Prompt Template)", definition: "A pre-designed, reusable structure for a prompt that outlines the key sections (Context, Instructions, Examples, Constraints, Delimiters) and often includes placeholders for specific information. Blueprints provide a consistent starting point for common tasks, which can then be customized.", ref: "Appendix B" },
  { id: "cot", term: "Chain-of-Thought (CoT) Prompting (the Clockwork Method)", definition: "An advanced technique in which the prompt explicitly instructs the system to generate its reasoning process step by step before giving the final answer. It often improves accuracy significantly for tasks that involve multiple logical steps, calculations or deductions, by forcing a more structured, sequential generation process.", ref: "chapter 4" },
  { id: "chatbot", term: "Chatbot (Conversational Agent)", definition: "An application designed to simulate conversation with humans, often used for customer service, information retrieval or companionship. Modern chatbots frequently use large language models, and need sophisticated prompt engineering to manage the dialogue flow, keep context, access information, express personality and handle user interactions effectively and safely.", ref: "chapter 10" },
  { id: "clockwork", term: "Clockwork Method (the metaphor for Chain-of-Thought)", definition: "The analogy for Chain-of-Thought prompting. It compares the explicit, step-by-step reasoning the system generates to the precise, sequential meshing of the gears in a mechanical clock, where each step enables the next.", ref: "chapter 4" },
  { id: "code-generation", term: "Code Generation", definition: "The specific task of prompting a computational system to write computer programming code (in Python, JavaScript, SQL and so on) from a description, given in natural language, of the desired logic or functionality.", ref: "chapter 6" },
  { id: "code-interpreter", term: "Code Interpreter Tool", definition: "A specialized capability or external tool (possibly part of a MRKL system) that allows a language model system to execute generated computer code securely and use the results. It enables tasks like calculations based on generated formulas, data analysis with generated scripts, or visualizing data.", ref: "chapter 9" },
  { id: "constraint", term: "Constraint (Guardrails and Speed Limits)", definition: "One of the five pillars. An explicit rule within the prompt that limits or restricts the system's output. Examples include setting word counts, defining forbidden topics or words, mandating a specific tone, or specifying output formatting rules. Constraints help channel the system's generative capabilities within desired boundaries.", ref: "chapter 2" },
  { id: "context", term: "Context (Setting the Stage)", definition: "One of the five pillars. The background information, situational framing, source material or persona definition provided within the prompt before the main instructions. Context tunes the system to the specific situation, reduces ambiguity and guides it toward a relevant response by narrowing down the possibilities from its vast training data.", ref: "chapter 2" },
  { id: "context-window", term: "Context Window", definition: "The technical limit on the amount of text (measured in tokens) that a specific language model can process at one time, covering both the input prompt and the generated output. Exceeding the limit can make the system ignore parts of the input or truncate the output. Strategies for handling large documents are needed when the source material exceeds the window.", ref: "chapter 6, for strategies" },
  { id: "controller", term: "Controller/Router (in MRKL systems)", definition: "In systems that use multiple tools (the Swiss Army knife approach), the Controller is the central component, often a language model, that is responsible for understanding the user's overall query, decomposing it into sub-tasks, selecting the appropriate specialized tool for each sub-task, coordinating their execution and integrating the results into a final response.", ref: "chapter 9" },
];

const D_TO_F: Term[] = [
  { id: "debugging", term: "Debugging (Prompt Debugging)", definition: "The systematic process of identifying why a prompt fails to produce the desired output, and then fixing the issue. It involves testing, analyzing the flaws in the output, diagnosing the likely cause by examining the prompt's components (Context, Instructions, Examples, Constraints, Delimiters) and making targeted refinements.", ref: "chapter 7" },
  { id: "delimiter", term: "Delimiter (Semantic Fences)", definition: "One of the five pillars. Specific characters, symbols (###), tags (`<input>...</input>`) or formatting (code blocks) used to separate distinct sections within a prompt clearly. Delimiters prevent confusion between instructions, context, examples and user input, and are essential for security when handling untrusted input.", ref: "chapters 2 and 5" },
  { id: "dewey", term: "Dewey Decimal System for Machines (the metaphor for tagged output)", definition: "The analogy for instructing systems to generate output structured with tags (XML or JSON). Tagging data elements is compared to assigning library call numbers, which makes the output organized, self-describing and easy for other software to process.", ref: "chapter 5" },
  { id: "double-blind", term: "Double-Blind Taste Test (the metaphor for A/B testing)", definition: "The analogy for A/B testing prompts. It compares the objective evaluation of two prompt variants (where the evaluator does not know which prompt produced which output) to a scientific taste test designed to reveal genuine preferences or performance differences based on data.", ref: "chapter 7" },
  { id: "essence-extractor", term: "Essence Extractor (the metaphor for prompt distillation)", definition: "The analogy for simplifying a complex but effective prompt down to its core, essential components without losing performance. It is like distilling a large volume of raw material to extract a small amount of potent essence.", ref: "chapter 4" },
  { id: "ethics", term: "Ethics (in prompt engineering)", definition: "The crucial practice of considering moral principles, potential harms, fairness, bias, safety and societal impact when designing and using prompts. Ethical prompt engineering aims for beneficial and responsible outcomes, not just functional ones.", ref: "chapter 8" },
  { id: "example", term: "Example (Apprenticeship by Demonstration, the Recipe Card)", definition: "One of the five pillars, crucial for few-shot learning. An example provides a concrete input to output pair that demonstrates the exact transformation, format or style desired. Showing is often more effective than telling for complex or nuanced requirements.", ref: "chapters 2 and 3" },
  { id: "fairness", term: "Fairness", definition: "A key ethical goal: ensuring that AI systems and their outputs avoid creating or perpetuating unjust discrimination or disadvantage toward individuals or groups. It requires active bias detection and mitigation.", ref: "chapter 8" },
  { id: "few-shot", term: "Few-Shot Learning (the Recipe Card Approach)", definition: "The technique of providing a small number (usually 1 to 5, called one-shot or few-shot) of explicit input to output examples within the prompt to demonstrate the desired task. The system learns the pattern from these examples. It is highly effective for controlling format, style and specific transformations.", ref: "chapter 3" },
  { id: "five-pillars", term: "Five Pillars (of an effective prompt)", definition: "The core framework of the book, defining the essential anatomical components of a well-structured prompt: Context, Instructions, Examples, Constraints and Delimiters. Understanding them aids systematic prompt construction and debugging.", ref: "chapter 2" },
  { id: "forking-paths", term: "Forking Paths Technique (the metaphor for Tree of Thoughts)", definition: "The analogy for guiding systems through complex reasoning that involves multiple possibilities (inspired by Tree of Thoughts research). It compares the process to exploring and evaluating different branching paths in a maze or garden to find the best route.", ref: "chapter 4" },
  { id: "format", term: "Format", definition: "The specific structure or layout of text (a paragraph, bullet points, a numbered list, a JSON object, an XML structure, a Markdown table). Prompts often need to instruct or demonstrate the desired output format explicitly." },
];

const G_TO_K: Term[] = [
  { id: "gold-star", term: "Gold Star Selection (Quality Sampling)", definition: "The critical principle in few-shot learning that the provided examples must be of the highest quality: accurate, clear, consistent and relevant. Flawed examples (recipes) lead to flawed outputs (dishes).", ref: "chapter 3" },
  { id: "grounding", term: "Grounding", definition: "The technique of ensuring that a language model's response is based on specific, provided information (usually within the prompt's context, often through RAG) rather than solely on its generalized internal training data. Grounding significantly reduces hallucinations and improves factual accuracy for knowledge-based tasks.", ref: "chapter 6" },
  { id: "guardrails", term: "Guardrails and Speed Limits (the metaphor for constraints)", definition: "The analogy for prompt constraints. It compares them to physical guardrails that prevent catastrophic deviation and to speed limits that keep the output within defined parameters (such as length or topic).", ref: "chapter 2" },
  { id: "hallucination", term: "Hallucination", definition: "The tendency of language models to generate text that sounds plausible, confident and grammatically correct but is factually wrong, nonsensical or not based on the provided context. It is a consequence of their pattern-matching, predictive nature. Grounding techniques (RAG) help mitigate it." },
  { id: "hippocratic", term: "Hippocratic Oath for Prompts (the metaphor for Constitutional AI)", definition: "The analogy that compares the ethical principles embedded in well-aligned AI systems (such as those trained with Constitutional AI methods) to the core tenet of the medical oath: first, do no harm.", ref: "chapter 8" },
  { id: "instruction", term: "Instruction (the Control Panel)", definition: "One of the five pillars. The part of the prompt that contains the specific commands or directives telling the system what action to perform (Summarize, Translate, Analyze). Clear, precise instructions are the primary driver of the system's response.", ref: "chapter 2" },
  { id: "interpretability", term: "Interpretability (Explainability)", definition: "The extent to which the reasoning or decision-making process of an AI system can be understood by humans. Techniques like Chain-of-Thought aim to increase interpretability by making the reasoning steps explicit." },
  { id: "iterative-refinement", term: "Iterative Refinement (the Watchmaker's Patience)", definition: "The fundamental, cyclical process of improving a prompt: draft, test with inputs, analyze the outputs for flaws, refine the prompt based on the analysis, and repeat. This methodical, patient approach is the key to optimizing prompt performance.", ref: "introduced in chapter 1, detailed in chapter 7" },
  { id: "json", term: "JSON (JavaScript Object Notation)", definition: "A common, text-based standard for structuring data using key-value pairs (\"name\": \"Sarajevo\") and nested objects or arrays. It is often used for data exchange through APIs. Prompts can instruct systems to generate output in valid JSON.", ref: "chapter 5" },
  { id: "knowledge-base", term: "Knowledge Base", definition: "A collection of information, often domain-specific (company policies, product documentation, scientific articles), used as a source of truth. In RAG-style prompting, relevant information is retrieved from a knowledge base and provided as context." },
  { id: "knowledge-distillation", term: "Knowledge Distillation (prompting context: the Essence Extractor)", definition: "The process of analyzing a complex but effective prompt and simplifying it by removing redundant elements and refining the core components, aiming for a shorter, more efficient prompt that keeps the original's high performance.", ref: "chapter 4" },
];

const L_TO_O: Term[] = [
  { id: "llm", term: "Large Language Model (LLM)", definition: "The underlying type of AI model, trained on vast amounts of text data, that powers most advanced conversational AI and text generation systems. (The book generally uses alternative phrasing such as computational language system.)" },
  { id: "lens-grinder", term: "Lens Grinder's Test (the metaphor for bias detection)", definition: "The analogy that compares the careful, critical examination of AI-generated text for biases, stereotypes and unfairness to a lens grinder meticulously inspecting a lens for flaws that would distort the final image.", ref: "chapter 8" },
  { id: "markdown", term: "Markdown", definition: "A simple markup language that uses plain text formatting syntax (`*italic*`, `**bold**`, `# Heading`, `- list item`) to add structure and style to text. It is widely used for formatting prompts and sometimes for requesting formatted output.", ref: "Appendix C" },
  { id: "mitigation", term: "Mitigation (of bias or harm)", definition: "Taking active steps, often through careful prompt design (adding anti-bias instructions, using fair examples), to reduce the frequency or impact of biased or harmful outputs generated by an AI system.", ref: "chapter 8" },
  { id: "mrkl", term: "MRKL (Modular Reasoning, Knowledge, and Language) Systems (the Swiss Army Knife Approach)", definition: "An architectural concept in which a central system (the Controller) intelligently coordinates multiple specialized tools (a calculator, a search engine, a code interpreter and so on) to handle complex queries that need capabilities beyond the core language model alone.", ref: "chapter 9" },
  { id: "multimodal", term: "Multimodal Prompting (the Theater Director's Craft)", definition: "Prompting techniques that involve inputs from multiple modalities (formats) at the same time, such as giving both an image and text instructions to guide the system's response based on understanding both.", ref: "chapter 9" },
  { id: "negative-constraint", term: "Negative Constraint", definition: "An instruction that states explicitly what the system should not do (Do not use jargon, Avoid mentioning specific dates, Never provide medical advice). It is powerful for preventing specific unwanted outputs.", ref: "chapter 2" },
  { id: "objective-subjective", term: "Objective vs. Subjective", definition: "Objective statements are factual and verifiable, independent of personal feelings (\"Mostar's bridge was rebuilt in 2004\"). Subjective statements express opinions, beliefs or feelings (\"Mostar is the most beautiful city in BiH\"). Prompts often need to guide the system toward objectivity for factual tasks, or manage subjectivity carefully for creative ones." },
  { id: "one-shot", term: "One-Shot Learning", definition: "Providing exactly one input to output example in a prompt to demonstrate the desired task. It is a specific case of few-shot learning.", ref: "chapter 3" },
  { id: "optimization", term: "Optimization (Prompt Optimization)", definition: "The process of systematically improving a prompt's performance against specific, measurable goals (increasing accuracy, improving format adherence, reducing bias, enhancing tone). Key techniques include iterative refinement and A/B testing.", ref: "chapter 7" },
];

const P_TO_R: Term[] = [
  { id: "persona", term: "Persona (Role-Playing)", definition: "Assigning a specific character, role or viewpoint for the language system to adopt in its response (\"Act as a historian\", \"Respond as a cheerful chatbot\", \"Write from the perspective of a skeptical scientist\"). It is a powerful context-setting technique to control tone, style and perspective.", ref: "chapter 2" },
  { id: "placeholder", term: "Placeholder", definition: "Bracketed text (`[Your Name Here]`, `<insert_text>`) within a prompt template that shows where specific, variable information needs to be inserted before the prompt is used.", ref: "Appendix B" },
  { id: "prompt", term: "Prompt", definition: "The input text, images or other information provided to a computational language system to instruct it and elicit a desired response. A well-designed prompt typically includes context, instructions and possibly examples, constraints and delimiters." },
  { id: "prompt-engineering", term: "Prompt Engineering", definition: "The craft of designing, writing, testing and refining prompts to guide computational language systems effectively and reliably toward the desired outputs, while avoiding undesired ones such as errors, bias or harmful content.", ref: "defined throughout, introduced in chapter 1" },
  { id: "prompt-injection", term: "Prompt Injection (Hijacking)", definition: "A security attack in which malicious instructions hidden within user input trick the system into ignoring the original prompt's directives and executing the attacker's commands. It is defended against with strong delimiters and explicit handling instructions.", ref: "chapter 5" },
  { id: "recipe-card", term: "Recipe Card Approach (the metaphor for few-shot learning)", definition: "The analogy that compares few-shot learning (providing input to output examples) to giving someone a detailed recipe card that clearly demonstrates the ingredients and process (input) and the expected result (output).", ref: "chapter 3" },
  { id: "rl", term: "Reinforcement Learning (RL)", definition: "A type of machine learning in which an agent learns by trial and error, receiving rewards or penalties for its actions in an environment, aiming to maximize its cumulative reward." },
  { id: "rlhf", term: "Reinforcement Learning from Human Feedback, RLHF (the Apprenticeship Loop)", definition: "A key technique for aligning language models with human preferences. It involves training a Reward Model on human rankings of different model outputs, then using RL to fine-tune the language model to generate responses that maximize the score predicted by the Reward Model.", ref: "chapter 11" },
  { id: "rag", term: "Retrieval-Augmented Generation, RAG (the Archivist's Lens)", definition: "A technique that improves language model outputs by first retrieving relevant information from an external knowledge source and then providing it as context within the prompt, instructing the model to base its answer on the retrieved data. It improves factuality and allows the use of specific or recent knowledge.", ref: "chapter 6" },
  { id: "reward-model", term: "Reward Model (RM)", definition: "In RLHF, the model trained to predict human preferences between different potential responses to a prompt. It provides the guidance signal for the RL fine-tuning phase.", ref: "chapter 11" },
  { id: "robustness", term: "Robustness", definition: "A prompt's ability to produce consistently good results even when it meets slightly varied, noisy or unexpected inputs." },
  { id: "role", term: "Role (Persona)", definition: "See Persona.", ref: "chapter 2" },
];

const S_TERMS: Term[] = [
  { id: "safety", term: "Safety (AI Safety)", definition: "The multidisciplinary field focused on ensuring that advanced AI systems operate reliably, beneficially and without causing harm. It includes technical alignment, bias mitigation, security against misuse, and addressing potential long-term risks.", ref: "related concepts in chapter 8" },
  { id: "schema", term: "Schema", definition: "A defined structure or plan for organizing data. When structured output (XML or JSON) is requested, the prompt implicitly or explicitly defines the required schema: the tags or keys and their relationships.", ref: "chapter 5" },
  { id: "semantic-fences", term: "Semantic Fences (the metaphor for delimiters)", definition: "The analogy that compares delimiters (`###` or `<tags>`) used to separate prompt sections to physical fences that organize a pasture and prevent intermingling.", ref: "defined in chapter 2, security aspects in chapter 5" },
  { id: "shot", term: "Shot (in few-shot learning)", definition: "A single input to output example pair used in a prompt.", ref: "chapter 3" },
  { id: "specificity", term: "Specificity", definition: "The quality of being precise, detailed and unambiguous in instructions, context or constraints. High specificity generally leads to more predictable and controlled outputs." },
  { id: "stereotype", term: "Stereotype", definition: "An oversimplified, often fixed and inaccurate belief or image about a particular group of people. Relying on or generating stereotypes is a key form of bias to avoid in prompt engineering.", ref: "chapter 8" },
  { id: "structured-output", term: "Structured Output", definition: "Output generated in a predefined, machine-readable format (XML, JSON, tables) rather than free-form natural language text, typically achieved through specific instructions and few-shot examples that demonstrate the format.", ref: "chapter 5" },
  { id: "style", term: "Style", definition: "The characteristic manner of expression in writing, covering tone, formality, word choice, sentence structure and so on. Prompts can guide the desired output style." },
  { id: "summarization", term: "Summarization", definition: "The task of reducing a longer text to its essential points while preserving the core meaning. Prompts control the length, focus and style of the summary." },
  { id: "swiss-army", term: "Swiss Army Knife Approach (the metaphor for MRKL systems)", definition: "The analogy that compares MRKL systems (which coordinate multiple specialized tools) to a versatile Swiss Army knife, where different implements are used for different specific tasks to achieve an overall goal.", ref: "chapter 9" },
  { id: "system-prompt", term: "System Prompt (Meta Prompt)", definition: "High-level instructions or context, often set at the beginning of an interaction (sometimes through a separate interface field), that define the AI's overall role, persona or fundamental operating principles for the entire conversation or task session." },
];

const T_TO_Z: Term[] = [
  { id: "tag", term: "Tag (XML Tag)", definition: "Markup (`<name>`, `</name>`) used to label and structure data elements, commonly used when requesting machine-readable output formats.", ref: "chapter 5" },
  { id: "telegraph", term: "Telegraph Method (the metaphor for zero-shot prompting)", definition: "The analogy that compares zero-shot prompting (direct instruction without examples) to sending a clear, concise message by telegraph, relying on the receiver's existing knowledge of the code.", ref: "chapter 3" },
  { id: "temperature", term: "Temperature", definition: "An optional parameter (often in APIs) that controls the randomness of a language model's output. Lower values (about 0.1 to 0.3) yield more deterministic, focused results. Higher values (about 0.7 to 1.0) increase creativity and diversity but risk incoherence. It affects output variability." },
  { id: "template", term: "Template (Prompt Template, Blueprint)", definition: "A reusable prompt structure with placeholders for variable information, providing a consistent starting point for specific tasks.", ref: "Appendix B" },
  { id: "theater-director", term: "Theater Director's Craft (the metaphor for multimodal prompting)", definition: "The analogy that compares multimodal prompting (inputs like images plus text) to a theater director coordinating various elements (script, visuals, sound) to create a unified scene.", ref: "chapter 9" },
  { id: "token", term: "Token", definition: "The fundamental unit of text processed by language models (often a word or part of a word). Prompt length limits (context windows) and usage costs are typically measured in tokens." },
  { id: "tone", term: "Tone", definition: "The emotional quality or attitude conveyed in writing (formal, empathetic, humorous, objective). It can be controlled through persona definition, instructions and examples." },
  { id: "tool", term: "Tool (in MRKL systems)", definition: "A specialized computational module or API (a calculator, a search engine, a code runner) that a MRKL system's controller can invoke to perform specific sub-tasks.", ref: "chapter 9" },
  { id: "training-data", term: "Training Data", definition: "The enormous corpus of text (and possibly other data) used to train a large language model initially. The patterns, knowledge and biases within this data fundamentally shape the model's capabilities and behavior." },
  { id: "tot", term: "Tree of Thoughts, ToT (the Forking Paths Technique)", definition: "An advanced reasoning paradigm in which the system explores multiple potential lines of thought or solution paths concurrently or sequentially, often generating alternatives, evaluating them and selectively expanding the most promising branches. It can be simulated through prompting.", ref: "chapter 4" },
  { id: "watchmaker", term: "Watchmaker's Patience (the metaphor for iterative refinement)", definition: "The analogy that compares the meticulous, step-by-step process of testing, diagnosing and refining prompts to a watchmaker patiently making tiny adjustments to achieve perfect timekeeping.", ref: "introduced in chapter 1, detailed in chapter 7" },
  { id: "xml", term: "XML (Extensible Markup Language)", definition: "A standard markup language that uses tags to define structured data in a way that is both human- and machine-readable. It is often used as inspiration for the structured output formats requested through prompts.", ref: "chapter 5" },
  { id: "zero-shot", term: "Zero-Shot Prompting (the Telegraph Method)", definition: "The technique of prompting a language model to perform a task using only instructions and context, without giving any specific input to output examples (zero shots). It relies entirely on the model's pre-existing capabilities learned during training.", ref: "chapter 3" },
];

export const ALL_GLOSSARY_TERMS: Term[] = [...A_TO_C, ...D_TO_F, ...G_TO_K, ...L_TO_O, ...P_TO_R, ...S_TERMS, ...T_TO_Z];

export const GLOSSARY_LESSONS: LessonContent[] = [
  {
    slug: "the-lexicon-a-to-c",
    title: "The lexicon, A to C",
    minutes: 12,
    covers: ["appA-intro", ...coversOf(A_TO_C)],
    body: `This lexicon is your companion reference. It clarifies the key terms and concepts of the whole manual. The definitions aim for simplicity and practical relevance, and they often connect back to the core analogies that demystify the craft of prompt engineering. Think of it as a guide to the essential vocabulary you need to navigate and master the art of communicating effectively with computational language systems.

The glossary has 91 terms. In this School it is taught in seven short lessons that follow the book's alphabetical order: A to C, D to F, G to K, L to O, P to R, S, and T to Z. Read each entry, then use the practice at the end of the chapter to check that the vocabulary sticks. Where the book points to a chapter, the pointer is kept as a note under the term.

A few patterns make the list easier to remember:

- Many terms come in pairs: a technical name and a workshop metaphor (chain of thought and the clockwork method, retrieval-augmented generation and the archivist's lens).
- The five pillars appear as their own entries: context, instruction, example, constraint and delimiter.
- Several entries are about people and systems around the prompt: the agent, the controller, the chatbot, the API.

${renderTerms(A_TO_C)}

**Try this:** pick five terms from this group that you could not have defined yesterday, and say each one aloud in your own words.`,
  },
  {
    slug: "the-lexicon-d-to-f",
    title: "The lexicon, D to F",
    minutes: 8,
    covers: coversOf(D_TO_F),
    body: `This group holds debugging, the delimiter and its fences, the ethics terms and the first pillars with their metaphors: the examples, the constraints, the format and the five pillars themselves.

${renderTerms(D_TO_F)}

**Try this:** name the five pillars from memory, then find each one in a prompt you wrote recently.`,
  },
  {
    slug: "the-lexicon-g-to-k",
    title: "The lexicon, G to K",
    minutes: 9,
    covers: coversOf(G_TO_K),
    body: `This group covers grounding and hallucination (the pair you will use most when checking output), the instruction pillar, interpretability, iterative refinement, JSON and the knowledge terms.

${renderTerms(G_TO_K)}

**Try this:** write one sentence that uses both grounding and hallucination correctly.`,
  },
  {
    slug: "the-lexicon-l-to-o",
    title: "The lexicon, L to O",
    minutes: 8,
    covers: coversOf(L_TO_O),
    body: `This group covers the language model itself, the lens grinder's test, Markdown, mitigation, MRKL and multimodal prompting, negative constraints, the difference between objective and subjective, one-shot learning and optimization.

${renderTerms(L_TO_O)}

**Try this:** write one negative constraint for a prompt of your own, and one sentence that a system should treat as objective and one as subjective.`,
  },
  {
    slug: "the-lexicon-p-to-r",
    title: "The lexicon, P to R",
    minutes: 10,
    covers: coversOf(P_TO_R),
    body: `This group covers the persona, the placeholder, the prompt and prompt engineering themselves, prompt injection, the recipe card, and the reinforcement learning family: RL, RLHF, the reward model, and retrieval-augmented generation, robustness and role.

${renderTerms(P_TO_R)}

**Try this:** explain RLHF to a friend in three sentences, using the words human ranking, reward model and fine-tune.`,
  },
  {
    slug: "the-lexicon-s",
    title: "The lexicon, S",
    minutes: 8,
    covers: coversOf(S_TERMS),
    body: `The letter S is the longest single stretch: safety, schema, semantic fences, shot, specificity, stereotype, structured output, style, summarization, the Swiss Army knife and the system prompt.

${renderTerms(S_TERMS)}

**Try this:** write a system prompt of two sentences that defines a role and one operating principle for a helper you would like to have.`,
  },
  {
    slug: "the-lexicon-t-to-z",
    title: "The lexicon, T to Z",
    minutes: 10,
    covers: coversOf(T_TO_Z),
    body: `The last group covers tags and the telegraph method, temperature, templates, the theater director, tokens and tone, tools, training data, tree of thoughts, the watchmaker, XML and zero-shot prompting.

${renderTerms(T_TO_Z)}

**Try this:** choose one term from each of the seven lessons and write a seven-line personal lexicon in your own words.`,
  },
];

const METAPHOR_CHOICES = ["Chain-of-thought prompting", "Zero-shot prompting", "Few-shot learning", "Retrieval-Augmented Generation"];
const PILLAR_METAPHOR_CHOICES = ["Delimiters", "Constraints", "Structured (tagged) output", "Iterative refinement"];

export const GLOSSARY_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "metaphors-for-techniques",
    kind: "fill",
    title: "Metaphor to technique",
    promptText: "Match each of the book's metaphors to the technique it stands for.",
    public: {
      template:
        "The Clockwork Method: {{a}}\nThe Telegraph Method: {{b}}\nThe Recipe Card Approach: {{c}}\nThe Archivist's Lens: {{d}}",
      blanks: [
        { id: "a", choices: METAPHOR_CHOICES },
        { id: "b", choices: METAPHOR_CHOICES },
        { id: "c", choices: METAPHOR_CHOICES },
        { id: "d", choices: METAPHOR_CHOICES },
      ],
    },
    answer: { correct: { a: "Chain-of-thought prompting", b: "Zero-shot prompting", c: "Few-shot learning", d: "Retrieval-Augmented Generation" } },
    explanation: "The clockwork is step-by-step reasoning, the telegraph is a direct instruction without examples, the recipe card shows input to output examples and the archivist's lens retrieves documents and focuses the analysis on them.",
  },
  {
    slug: "metaphors-for-structure",
    kind: "fill",
    title: "Metaphor to concept",
    promptText: "Match each metaphor to the concept it stands for.",
    public: {
      template:
        "Semantic Fences: {{a}}\nGuardrails and Speed Limits: {{b}}\nDewey Decimal System for Machines: {{c}}\nWatchmaker's Patience: {{d}}",
      blanks: [
        { id: "a", choices: PILLAR_METAPHOR_CHOICES },
        { id: "b", choices: PILLAR_METAPHOR_CHOICES },
        { id: "c", choices: PILLAR_METAPHOR_CHOICES },
        { id: "d", choices: PILLAR_METAPHOR_CHOICES },
      ],
    },
    answer: { correct: { a: "Delimiters", b: "Constraints", c: "Structured (tagged) output", d: "Iterative refinement" } },
    explanation: "Fences separate the sections of a prompt (delimiters), guardrails and speed limits restrict the output (constraints), library call numbers are the tags of structured output, and the watchmaker's small adjustments are iterative refinement.",
  },
  {
    slug: "grounding-defined",
    kind: "choice",
    title: "What grounding does",
    promptText: "According to the glossary, what does grounding do?",
    public: {
      options: [
        "It lowers the model's temperature to zero",
        "It ensures the response is based on specific, provided information rather than solely on the model's general training data, which reduces hallucinations",
        "It removes bias from the training data",
        "It shortens the prompt to fit the context window",
      ],
    },
    answer: { correct: 1 },
    explanation: "Grounding, usually through the context in the prompt and often through RAG, keeps the response tied to provided information. This reduces hallucinations and improves factual accuracy for knowledge-based tasks.",
  },
  {
    slug: "temperature-defined",
    kind: "choice",
    title: "Reading the temperature",
    promptText: "A colleague wants focused, deterministic results from a language model API. Which temperature setting fits, according to the glossary?",
    public: {
      options: [
        "A low value, about 0.1 to 0.3",
        "A high value, about 0.7 to 1.0",
        "Temperature only changes the length of the output",
        "Temperature cannot be set through an API",
      ],
    },
    answer: { correct: 0 },
    explanation: "Lower values give more deterministic, focused results. Higher values increase creativity and diversity but risk incoherence.",
  },
  {
    slug: "spot-not-pillars",
    kind: "spot",
    title: "Not one of the five pillars",
    promptText: "Select every term that is NOT one of the five pillars of an effective prompt.",
    public: {
      pickPrompt: "Select every term that is not one of the five pillars",
      hitLabel: "Not a pillar",
      missLabel: "A pillar",
      segments: [
        { id: "k1", text: "Context: the background information provided before the instructions." },
        { id: "k2", text: "Temperature: a parameter that controls the randomness of the output." },
        { id: "k3", text: "Delimiter: markers that separate the sections of a prompt." },
        { id: "k4", text: "Token: the fundamental unit of text processed by a language model." },
        { id: "k5", text: "Constraint: an explicit rule that limits the output." },
        { id: "k6", text: "Hallucination: plausible text that is factually wrong." },
      ],
    },
    answer: { flawed: ["k2", "k4", "k6"] },
    explanation: "The five pillars are Context, Instructions, Examples, Constraints and Delimiters. Temperature, token and hallucination are useful vocabulary, but they are not parts of a prompt's anatomy.",
  },
  {
    slug: "order-rlhf",
    kind: "order",
    title: "RLHF in order",
    promptText: "Put the stages of RLHF in the order the glossary and the book describe.",
    public: {
      blocks: [
        { id: "rl", text: "Reinforcement learning fine-tunes the language model to maximize the reward model's score" },
        { id: "generate", text: "A base language model generates several responses to prompts" },
        { id: "reward", text: "A reward model is trained on the human preference comparisons" },
        { id: "rank", text: "Human reviewers rank the different outputs" },
      ],
    },
    answer: { order: ["generate", "rank", "reward", "rl"] },
    explanation: "Outputs are generated and ranked by people, the reward model learns their preferences, and RL then fine-tunes the language model toward responses the reward model scores highly.",
  },
  {
    slug: "shots-counted",
    kind: "choice",
    title: "Counting shots",
    promptText: "A prompt gives the system exactly one input to output example. What does the glossary call this?",
    public: {
      options: ["Zero-shot prompting", "Few-shot learning with five shots", "One-shot learning, a specific case of few-shot learning", "Chain-of-thought prompting"],
    },
    answer: { correct: 2 },
    explanation: "One-shot learning provides exactly one input to output example and is a specific case of few-shot learning. Each example pair is called a shot.",
  },
  {
    slug: "controller-role",
    kind: "choice",
    title: "The controller's job",
    promptText: "In a MRKL system (the Swiss Army knife approach), what is the Controller responsible for?",
    public: {
      options: [
        "Storing the training data",
        "Rating the answers of human reviewers",
        "Generating images from text",
        "Understanding the overall query, decomposing it into sub-tasks, selecting a tool for each, coordinating them and integrating the results",
      ],
    },
    answer: { correct: 3 },
    explanation: "The controller, often a language model, plans and routes: it decomposes the query, chooses the right specialized tool for each sub-task, coordinates execution and integrates the results into one response.",
  },
  {
    slug: "define-the-risks",
    kind: "fill",
    title: "Three terms about risk and limits",
    promptText: "Match each term to its glossary definition.",
    public: {
      template:
        "Hallucination: {{a}}\nPrompt injection: {{b}}\nContext window: {{c}}",
      blanks: [
        { id: "a", choices: ["Plausible, confident text that is factually wrong or not based on the provided context", "Malicious instructions hidden in user input that hijack the prompt's directives", "The limit on the amount of text a model can process at one time", "A parameter that controls randomness"] },
        { id: "b", choices: ["Plausible, confident text that is factually wrong or not based on the provided context", "Malicious instructions hidden in user input that hijack the prompt's directives", "The limit on the amount of text a model can process at one time", "A parameter that controls randomness"] },
        { id: "c", choices: ["Plausible, confident text that is factually wrong or not based on the provided context", "Malicious instructions hidden in user input that hijack the prompt's directives", "The limit on the amount of text a model can process at one time", "A parameter that controls randomness"] },
      ],
    },
    answer: { correct: { a: "Plausible, confident text that is factually wrong or not based on the provided context", b: "Malicious instructions hidden in user input that hijack the prompt's directives", c: "The limit on the amount of text a model can process at one time" } },
    explanation: "Hallucination is about wrong but plausible content, prompt injection is a security attack on the prompt's instructions, and the context window is a size limit that covers both input and output.",
  },
  {
    slug: "repair-with-vocabulary",
    kind: "repair",
    title: "Use the vocabulary to fix a prompt",
    promptText: "Rewrite this prompt using the lexicon: start with an action verb, set a tone, add a negative constraint, and name the output format.",
    public: {
      starter: "Some thoughts on our refund policy.",
      hint: "Begin with a verb such as Summarize, say who it is for and what tone to use, add something that must not appear, and ask for bullet points or another format.",
    },
    answer: {
      criteria: [
        { id: "verb", label: "Starts with an action verb", weight: 2, anyOf: ["^\\s*(summari[sz]e|list|explain|write|compare|extract|generate|draft|describe)\\b", "\\n\\s*(summari[sz]e|list|explain|write|compare|extract|generate|draft|describe)\\b"], hint: "Start the instruction with a clear verb such as Summarize or Explain." },
        { id: "tone", label: "Sets a tone or audience", weight: 2, anyOf: ["\\b(tone|formal|friendly|empathetic|professional|audience|for (a|an|our) \\w+)\\b"], hint: "Say who the text is for and what tone it should have." },
        { id: "negative", label: "Adds a negative constraint", weight: 2, anyOf: ["\\b(do not|don't|never|avoid|must not)\\b"], hint: "Add something that must not appear, for example do not use legal jargon." },
        { id: "format", label: "Names the output format", weight: 2, anyOf: ["\\b(bullet\\w*|numbered|table|json|paragraphs?|list|headings?|words|sentences)\\b"], hint: "Name the format, for example three bullet points." },
      ],
      model:
        "Summarize our refund policy for customers in a friendly, professional tone. Do not use legal jargon. Give the answer as three bullet points.",
    },
    explanation: "The lexicon turns into working parts: an action verb reduces ambiguity, a tone shapes style, a negative constraint prevents a specific unwanted output, and naming the format removes guesswork.",
    samples: {
      good: [
        "Explain the refund policy to new customers in an empathetic tone. Avoid technical terms. Answer in a short numbered list.",
      ],
      bad: ["Some thoughts on our refund policy.", "Please think about our refund policy and tell me what you think."],
    },
  },
];

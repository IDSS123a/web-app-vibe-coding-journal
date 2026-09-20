/**
 * Chapter "The Future of Prompting" (book chapter 11, "The Future: Towards More Capable and Collaborative Systems", and the
 * "Appendices" introduction that follows it): 4 lessons and 10 exercises, written from the Director's book, which is the
 * only source. Every section is covered (see book-map.ts). No em dashes (writing rule, PDL-057).
 * `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const FUTURE_LESSONS: LessonContent[] = [
  {
    slug: "towards-more-capable-systems-the-apprenticeship-loop",
    title: "Towards more capable systems: the apprenticeship loop",
    minutes: 9,
    covers: ["ch11-intro", "ch11-apprenticeship-loop", "ch11-rlhf", "ch11-why-it-matters"],
    body: `Your journey through the craft is nearing its end. You began by dissecting the prompt itself, understanding its anatomy like the components of an intricate machine. You learned the foundational techniques of direct instruction and demonstration, like mastering the basic controls of that machine. You progressed to advanced methods for guiding complex reasoning, structuring interactions for clarity and security, optimizing through iteration and testing, and applying your skills responsibly in specific domains. You now hold a robust toolkit for communicating with the remarkable language systems of today.

But the landscape is not static. It is dynamic, evolving at a pace that can feel breathtaking. The capabilities of these systems, and the methods we use to interact with them, are under constant development. To conclude, lift your gaze from today's workshop practices toward the horizon. Where is this path leading? What fundamental shifts in capability and interaction might we anticipate?

Predicting the future of technology with certainty is a fool's errand. But by understanding the mechanisms that shape current systems, and by observing the directions of active research, we can form educated hypotheses. This final chapter considers:

1. **How systems learn preferences, "the apprenticeship loop: understanding learning from expert corrections (RLHF insights)".** A crucial training process that makes current systems more aligned with human intentions, and explains why they often strive for helpfulness and safety.
2. **Emerging trends and possibilities, "the horizon: autonomy, multimodality, personalization and the road ahead".** Potential advances: systems that act more autonomously, perceive several modalities, remember personal context and interact through new interfaces.
3. **The enduring principles, "timeless craft in a changing world".** A reaffirmation of the core communication and structuring skills that stay essential whatever the technology.

The aim is not to offer definitive forecasts but to give context for the ongoing evolution of the field, and to encourage thoughtful consideration of the remarkable possibilities and the profound responsibilities ahead.

## 1. How systems learn preferences: the apprenticeship loop

A recurring theme of this course has been the importance of clarity and specificity in prompts. Have you ever wondered why these systems seem predisposed to be helpful, to follow clearly stated instructions diligently, and to avoid harmful or nonsensical content even when a prompt is ambiguous? That alignment with human intent is not accidental. It is often the result of a sophisticated training process that follows the initial massive data ingestion, and one key component of it is **Reinforcement Learning from Human Feedback (RLHF)**.

Understanding RLHF is like understanding how an apprentice learns not only the basic skills of a craft but also the preferences and standards of quality that the master values. It helps explain the behaviour of the systems you prompt. Imagine, again, an apprentice blacksmith learning to forge horseshoes:

1. **Initial skill (base training).** The apprentice learns the basics: how to heat metal, basic hammer techniques, the general shape required, perhaps from manuals and by watching others. This is like a language model's initial training on vast text data. The early attempts might be functional but clumsy or inconsistent.
2. **Multiple attempts (generation).** The apprentice produces several horseshoes (outputs A, B and C) for a request.
3. **The master's feedback (human ranking).** The master examines the attempts. They do not assign a number. They give comparative judgments: "B has a better curve than A", "C's nail holes are cleaner than B's", "A is too thick here". Humans rank the outputs by their expert criteria for a good horseshoe.
4. **Learning the master's taste (reward modeling).** From thousands of such rankings, an astute observer, or a computational system, the **reward model**, learns to predict which horseshoe the master is likely to prefer. It builds a model of the master's preferences, capturing the nuances of desired shape, finish and function.
5. **Guided practice (reinforcement learning).** The apprentice now practices with a new objective: not just to make a horseshoe but to make one that maximizes the predicted approval score from the learned preference model. They try slightly different techniques (hammer angle, heating time) and internally check whether the variation is likely to earn a higher score. Actions that lead to higher predicted scores are reinforced, those that lead to lower scores are discouraged. This trial and error, guided by the learned preference model, is reinforcement learning.

This **apprenticeship loop** (attempt, human feedback, learn a preference model, guided practice, repeat) lets the apprentice, the language model, refine its output progressively so that it aligns better with the qualitative judgments and preferences of the master, the human reviewers.

## RLHF in language models

- **Generation.** A base language model generates several responses to various prompts.
- **Human ranking.** Human labelers compare pairs of responses and indicate which is better by criteria such as helpfulness, honesty (within the model's capability), harmlessness and adherence to instructions.
- **Reward modeling.** A separate reward model (RM) is trained on millions of these human preference comparisons. It learns to predict the probability that humans would prefer one response over another for a given prompt.
- **RL fine-tuning.** The original language model is further tuned with reinforcement learning. Its goal is to generate responses that maximize the positive score from the reward model. It learns to generate text that looks like the responses humans consistently preferred.

## Why this matters for your prompting

- **It explains alignment.** RLHF is a core reason many modern systems seem aligned: trying to be helpful, refusing harmful requests, following instructions. They were specifically rewarded for these traits during the reinforcement learning phase.
- **Sensitivity to phrasing.** The model becomes highly attuned to prompt phrasing that correlated with high reward scores during RLHF. That explains why small wording changes can sometimes change output quality significantly: they may better activate the learned preferred-response pathways.
- **Leveraging alignment.** You can tap into this training by stating desired qualities in your prompts: "Be helpful and concise", "Ensure the answer is factually accurate based on context", "Adopt an empathetic tone", "Avoid biased language". These match behaviours likely rewarded during RLHF. Negative constraints ("Do not provide illegal advice") also reinforce learned safety boundaries.
- **Understanding refusals.** When an aligned model refuses a seemingly simple request, it is often because the learned reward model predicts that any potential response would strongly violate safety or harmlessness principles reinforced during training. Refusal becomes the highest-reward action in that context.
- **Bias can persist.** The alignment is only as unbiased as the human reviewers who gave the feedback. If the reviewers share biases, these can be embedded in the reward model and reinforced in the final language model. Ethical vigilance remains necessary.

The RLHF process, this intricate apprenticeship loop, is a key factor shaping the helpfulness and safety characteristics of the systems you use every day. Invisible to the end user, its existence gives crucial context for interpreting model behaviour and for writing prompts that make effective use of the system's alignment training.

**Try this:** take a refusal you once got and rewrite the prompt so that its legitimate purpose is stated up front. Compare the two responses.`,
  },
  {
    slug: "the-horizon-autonomy-multimodality-and-memory",
    title: "The horizon: autonomy, multimodality and memory",
    minutes: 8,
    covers: ["ch11-horizon", "ch11-trend-autonomy", "ch11-trend-multimodality", "ch11-trend-personalization"],
    body: `## 2. Emerging trends and possibilities: the horizon

Looking beyond current practice and refinements like RLHF, what fundamental shifts might shape the future of prompt engineering and of our interaction with computational systems? Specific predictions are speculative, but several clear trends and research directions suggest that the capabilities and nature of these interactions are poised for significant evolution. The book invites you to consider what the pioneers who grappled with the foundations of computation and communication might find compelling on today's horizon.

## Trend 1: increased autonomy and planning (agentic systems)

- **Trend.** A move from systems that execute single, explicit prompts to **agents** that can understand higher-level goals, independently formulate multi-step plans, carry them out (often using tools, extending the MRKL concept), adapt to obstacles and report on progress.
- **Historical resonance (Turing).** Alan Turing explored the potential for machines to exhibit intelligent behaviour beyond mere calculation. Agentic systems that plan and act toward goals are a step closer to machines showing more complex forms of problem solving.
- **Prompting shift.** Prompting may evolve from detailed step-by-step instructions toward **defining goals, constraints, available tools and ethical boundaries** for autonomous execution. We might delegate complex tasks rather than micromanage them through prompts.
- **Challenges.** Ensuring the reliability, safety, control and transparency of autonomous actions.

## Trend 2: deeper multimodality, beyond text and images

- **Trend.** Expanding beyond text and still images (the theater director's craft) to understanding and reasoning about video, audio streams, sensor data (the internet of things), 3D environments and perhaps even more abstract data representations. Systems that truly integrate the perception of the dynamic world with language understanding.
- **Historical resonance (von Neumann).** John von Neumann's work touched on self-replication and the link between computation and physical embodiment. Systems that integrate diverse sensory data bridge the digital and the physical, in line with that broad vision.
- **Prompting shift.** Prompts could become dynamic, multi-layered inputs that combine text instructions with live video feeds, real-time sensor readings or interactive 3D models, enabling tasks like real-time process monitoring, spatially aware guidance, or interaction based on complex environmental context.
- **Challenges.** Fusing vastly different data types effectively, real-time processing demands, interpreting noisy sensor data, and privacy concerns with continuous monitoring.

## Trend 3: enhanced personalization and memory

- **Trend.** A move beyond largely stateless interactions toward systems with **persistent memory** and deep personalization: systems that learn and remember individual user preferences, interaction history and personal context (projects, relationships, goals), and possibly integrate securely with personal knowledge bases such as notes, emails and calendars.
- **Historical resonance (Lovelace).** Ada Lovelace foresaw machines manipulating symbols that represent more than numbers. Systems that build dynamic symbolic models of a user's personal world embody this potential for deeper symbolic reasoning applied to individual context.
- **Prompting shift.** Prompting could become more implicit for routine tasks ("Schedule my usual project check-in"). The focus might shift to managing the system's memory and context ("Update Project Alpha status to 'delayed'", "Forget information related to my old address"). Explicit prompting remains crucial for novel or complex requests that go beyond the established personal context.
- **Challenges.** Privacy and user control over personal data are paramount. Also: preventing intrusive personalization, ensuring data security, managing context without confusion, and avoiding filter bubbles.

**Try this:** pick one of the three trends and write, in two sentences, how your own prompting would change if it became normal.`,
  },
  {
    slug: "the-horizon-interfaces-grounding-and-safety",
    title: "The horizon: interfaces, grounding and safety",
    minutes: 7,
    covers: ["ch11-trend-interaction", "ch11-trend-grounding", "ch11-trend-safety"],
    body: `## Trend 4: more fluid interaction modalities

- **Trend.** Text prompting remains foundational, but interfaces will likely become more diverse and natural. Voice interaction will improve significantly in understanding conversational nuance. Research continues into gestural control and possibly **brain-computer interfaces** for more direct signalling of intent.
- **Historical resonance (Morse).** Samuel Morse sought an efficient encoding for communication. The drive toward more intuitive, higher-bandwidth interfaces continues this quest to bridge the human mind and machine processing more seamlessly.
- **Prompting shift.** The core principles remain, but the form changes. Voice prompting requires designing for conversational flow and spoken ambiguity. Other modalities would demand entirely new interaction design paradigms.
- **Challenges.** Achieving reliable interpretation of voice, gesture and brain-computer input, accessibility, and the unique privacy concerns of capturing biometric or neural data.

## Trend 5: improved grounding, factuality and uncertainty

- **Trend.** Addressing the critical issue of hallucinations by strengthening the mechanisms that ground outputs in verifiable evidence: tighter RAG integration, proactive source citation, built-in fact-checking, and models better calibrated to express uncertainty when appropriate.
- **Historical resonance.** The pursuit of verifiable truth is fundamental to scientific and rational thought, echoed by all serious intellectual pioneers.
- **Prompting shift.** It may involve more explicit control over the desired level of factuality, for example "Answer using only cited sources" or "Distinguish clearly between established facts and speculation". Interfaces might offer more built-in verification features.
- **Challenges.** Building comprehensive knowledge sources for grounding, handling conflicting information reliably, and expressing nuanced uncertainty effectively.

## Trend 6: co-evolution of capabilities and safety and ethics

- **Trend.** As systems become more autonomous, multimodal and personalized, the potential risks increase. Research into AI safety, alignment, bias mitigation, explainability and responsible governance must advance in lockstep with capabilities. It is not optional. It is foundational for trustworthy deployment.
- **Historical resonance.** The recognition that powerful tools bring responsibilities is a timeless theme.
- **Prompting shift.** The prompt engineer's role will increasingly include explicit safety and ethical considerations. Designing prompts that are robust against misuse, mitigate bias, respect safety constraints and possibly even engage in ethical reasoning (depending on system capability) will become standard practice.
- **Challenges.** Defining complex ethical rules computationally, ensuring robustness in diverse situations, reaching global alignment on standards, and maintaining safety in adaptive systems.

## The horizon in one view

The horizon suggests a future where our interactions with computational systems become more like collaborations with versatile, context-aware and increasingly capable assistants. The specific technologies will change, but the fundamental challenge remains: **how do we clearly and effectively communicate our intent, to use these capabilities productively and responsibly?**

| Trend | Prompting may shift toward |
| --- | --- |
| Autonomy and planning | Defining goals, constraints, tools and ethical boundaries |
| Deeper multimodality | Multi-layered inputs: text plus live video, sensors, 3D |
| Personalization and memory | Managing the system's memory and context |
| Fluid interaction | Conversational flow and spoken ambiguity |
| Grounding and factuality | Controlling the desired level of factuality and sources |
| Safety and ethics | Explicit safety and ethical design as standard practice |

**Try this:** for a task you would like to delegate to an agent, write down the goal, two constraints, the tools it may use and one ethical boundary.`,
  },
  {
    slug: "the-enduring-principles-and-your-reference-toolkit",
    title: "The enduring principles, and your reference toolkit",
    minutes: 8,
    covers: ["ch11-enduring-principles", "ch11-appendices-intro"],
    body: `## 3. The enduring principles: timeless craft in a changing world

A future of potentially autonomous agents, multimodal perception and deep personalization may feel daunting. Will the techniques you have learned become obsolete overnight? While specific implementations will undoubtedly evolve, the fundamental principles of effective communication with complex computational systems have an **enduring quality**.

Consider the pioneers whose work laid the groundwork. Morse needed structure and unambiguous encoding for the telegraph. Babbage required precise, sequential instructions for his engines. Lovelace envisioned the manipulation of symbols according to rules. Turing explored the foundations of computation and intelligent behaviour through process and logic. Von Neumann considered the architecture linking computation to action. Their challenges, at their core, were about translating human intent into a form a machine could process reliably.

That fundamental challenge persists. Whether you type text, speak commands, interact with images or define high-level goals for an autonomous agent, these principles remain central to the craft:

- **Clarity of intent.** You must first understand precisely what you want to achieve. Vague goals lead to vague results.
- **Understanding the machine.** Deep technical knowledge is not required for non-coders, but a conceptual model of how the system works (pattern matching, context dependence, potential biases, available tools and modalities) is crucial for effective interaction.
- **Providing sufficient context.** The system needs the right background information, whatever its form (text, image, user history, sensor data), to interpret requests correctly.
- **Precision in instruction.** Whether expressed as text commands, voice instructions or goal definitions, the directions must be specific and unambiguous.
- **Structure and organization.** Breaking down complexity, separating distinct components with delimiters or other structural cues, and organizing information logically are essential for reliable processing.
- **The power of demonstration (examples).** Showing the system what you want, through few-shot examples, visual demonstrations and so on, remains a powerful technique, especially for nuanced tasks like style, format or complex patterns.
- **Setting boundaries (constraints).** Defining limits, exclusions and operational rules is vital for controlling output and ensuring safety.
- **Iteration and refinement.** The process of testing, analyzing failures and making targeted improvements is timeless. No complex system works perfectly on the first try.
- **Ethical responsibility.** Considering the potential impact, ensuring fairness, mitigating bias and promoting safety are not trends but fundamental obligations when wielding powerful technology.

The specific tools and interfaces will undoubtedly change. We may move from typing prompts in Markdown to orchestrating multimodal inputs, or to defining goals for agents through conversation. But the underlying craft, the thoughtful process of analyzing a need, designing a clear communication strategy, structuring information effectively, testing rigorously, refining methodically and acting responsibly, will endure.

The skills you have built, thinking structurally, communicating precisely, testing critically and considering the context, are not only about mastering today's language models. They are fundamental skills for interacting effectively with complex computational systems, and a durable foundation for the exciting and rapidly evolving future of human-machine collaboration. **The craft endures, even as the medium transforms.**

## Appendices: your reference toolkit and continuing guide

You have travelled through the core landscape of prompt engineering: from the essential anatomy of a prompt, like learning the parts of a complex engine, to techniques both foundational and advanced, like learning to operate and fine-tune that engine, and on to structure, security, optimization and ethics. You now have a solid framework and a set of powerful conceptual tools.

Think of the appendices as the indispensable companion volumes in a master craftsperson's library: the detailed reference manuals, the collections of proven designs, the guides to essential tools and the pointers toward ongoing learning that support the day-to-day practice of the craft. In the book they are:

- **Appendix A, glossary: the prompt engineer's lexicon.** A quick guide to the language of the craft, making key terms clear and accessible.
- **Appendix B, template library: the workshop blueprints.** A collection of ready-to-adapt starting points for common prompting tasks, designed to speed up work across many fields.
- **Appendix C, Markdown manual: formatting for clearer prompts.** A practical reference for simple text formatting, a surprisingly crucial tool for bringing structure and clarity to prompts. (You have already worked through it in the beginner level.)
- **Appendix D, techniques quick reference: methods at a glance.** A concise table summarizing the prompt engineering techniques discussed, perfect for quick review or for finding the right approach.
- **Appendix E, further reading and resources: continuing the journey.** Curated suggestions for reliable sources to deepen your understanding and stay informed in a fast-moving field.
- **Appendix F, prompting platforms and tools: choosing your workbench.** Guidance on the different environments where prompt engineering happens, from simple chats to sophisticated platforms.

Do not treat the appendices as add-ons to glance at once. Use them actively. Refer back to the glossary when a term is unclear. Adapt the blueprints for your own projects. Consult the Markdown manual when structuring complex prompts. Review the techniques table when brainstorming approaches. Check the further reading when you are ready to go deeper. These resources are here to support you as you move from understanding the principles to confidently applying them, refining your skills and truly mastering the art of guiding computational systems effectively, efficiently and responsibly.

The next chapters of this School are those companion volumes: the fifteen blueprints as hands-on workshops, the techniques quick reference, the glossary, and the guides to further reading and to platforms and tools.

**Try this:** write your own list of the three principles you find hardest to keep, and one habit that would help with each.`,
  },
];

export const FUTURE_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "order-the-apprenticeship-loop",
    kind: "order",
    title: "The apprenticeship loop",
    promptText: "Put the five stages of the blacksmith's apprenticeship in the order the book gives.",
    public: {
      blocks: [
        { id: "rl", text: "Guided practice: try variations to maximize the predicted approval (reinforcement learning)" },
        { id: "attempts", text: "Multiple attempts: produce several horseshoes, outputs A, B and C" },
        { id: "reward", text: "Learning the master's taste: a model learns to predict which the master prefers (reward modeling)" },
        { id: "base", text: "Initial skill: learn the basics from manuals and observation (base training)" },
        { id: "ranking", text: "The master's feedback: comparative judgments rank the attempts (human ranking)" },
      ],
    },
    answer: { order: ["base", "attempts", "ranking", "reward", "rl"] },
    explanation: "Base training, then generation, human ranking, reward modeling, and finally reinforcement learning guided by the reward model. The loop repeats, refining the output toward the master's preferences.",
  },
  {
    slug: "rlhf-in-language-models",
    kind: "fill",
    title: "RLHF in a language model",
    promptText: "Match each description to the RLHF stage it belongs to.",
    public: {
      template:
        "Humans compare pairs of responses and say which is better: {{a}}\nA separate model learns to predict which response humans prefer: {{b}}\nThe language model is tuned to maximize that model's score: {{c}}",
      blanks: [
        { id: "a", choices: ["Human ranking", "Reward modeling", "RL fine-tuning", "Base training"] },
        { id: "b", choices: ["Human ranking", "Reward modeling", "RL fine-tuning", "Base training"] },
        { id: "c", choices: ["Human ranking", "Reward modeling", "RL fine-tuning", "Base training"] },
      ],
    },
    answer: { correct: { a: "Human ranking", b: "Reward modeling", c: "RL fine-tuning" } },
    explanation: "Human labelers rank, the reward model learns their preferences from millions of comparisons, and reinforcement learning fine-tunes the language model to produce responses that score well.",
  },
  {
    slug: "why-wording-matters-rlhf",
    kind: "choice",
    title: "Why small wording changes matter",
    promptText: "According to the book, why can small wording changes sometimes change output quality significantly?",
    public: {
      options: [
        "The model counts the letters in the prompt",
        "Longer prompts are always ignored",
        "The model is attuned to phrasing that correlated with high reward during RLHF, so some wording better activates the preferred-response pathways",
        "Every wording change resets the model",
      ],
    },
    answer: { correct: 2 },
    explanation: "After RLHF the model is highly sensitive to phrasing that matched high reward scores in training, which is one reason iteration and testing of wording pay off.",
  },
  {
    slug: "spot-what-rlhf-means-for-you",
    kind: "spot",
    title: "What RLHF means for prompting",
    promptText: "Select every statement the book agrees with.",
    public: {
      pickPrompt: "Select every statement the book agrees with",
      hitLabel: "The book agrees",
      missLabel: "The book disagrees",
      segments: [
        { id: "a1", text: "RLHF is a core reason many modern systems seem aligned and refuse harmful requests." },
        { id: "a2", text: "A refusal can be the highest-reward action when every response would strongly violate safety principles." },
        { id: "a3", text: "RLHF removes all bias from a model." },
        { id: "a4", text: "If the human reviewers share biases, these can become embedded in the reward model." },
        { id: "a5", text: "Negative constraints never reinforce anything the model learned." },
      ],
    },
    answer: { flawed: ["a1", "a2", "a4"] },
    explanation: "Alignment comes from rewarding helpful, harmless behaviour, refusals can be the best-scoring action, and the alignment is only as unbiased as its reviewers. Negative constraints do reinforce learned safety boundaries.",
  },
  {
    slug: "trend-to-prompting-shift",
    kind: "fill",
    title: "How prompting may shift",
    promptText: "Match each trend to the shift in prompting the book expects.",
    public: {
      template:
        "Agentic systems: prompting shifts toward {{a}}.\nPersistent memory: prompting shifts toward {{b}}.\nVoice interfaces: prompting requires designing for {{c}}.\nBetter grounding: prompts may control {{d}}.",
      blanks: [
        { id: "a", choices: ["defining goals, constraints, tools and boundaries", "managing the system's memory and context", "conversational flow and spoken ambiguity", "the desired level of factuality and sources"] },
        { id: "b", choices: ["defining goals, constraints, tools and boundaries", "managing the system's memory and context", "conversational flow and spoken ambiguity", "the desired level of factuality and sources"] },
        { id: "c", choices: ["defining goals, constraints, tools and boundaries", "managing the system's memory and context", "conversational flow and spoken ambiguity", "the desired level of factuality and sources"] },
        { id: "d", choices: ["defining goals, constraints, tools and boundaries", "managing the system's memory and context", "conversational flow and spoken ambiguity", "the desired level of factuality and sources"] },
      ],
    },
    answer: { correct: { a: "defining goals, constraints, tools and boundaries", b: "managing the system's memory and context", c: "conversational flow and spoken ambiguity", d: "the desired level of factuality and sources" } },
    explanation: "Delegation means specifying goals, limits, tools and ethics. Memory means managing what the system keeps. Voice means designing for conversation. Grounding means asking for cited sources and separating fact from speculation.",
  },
  {
    slug: "lockstep",
    kind: "choice",
    title: "Advancing in lockstep",
    promptText: "Which trend does the book say must advance in lockstep with capabilities, as foundational rather than optional?",
    public: {
      options: [
        "Faster typing",
        "The co-evolution of safety and ethics, including alignment, bias mitigation and governance",
        "Shorter prompts",
        "Fewer modalities",
      ],
    },
    answer: { correct: 1 },
    explanation: "As systems become more autonomous, multimodal and personalized, risks grow. Safety research, alignment, bias mitigation, explainability and governance must advance alongside capabilities.",
  },
  {
    slug: "match-the-pioneer",
    kind: "fill",
    title: "The pioneers on the horizon",
    promptText: "The book links each trend to a pioneer. Match them.",
    public: {
      template:
        "Turing: {{a}}\nVon Neumann: {{b}}\nLovelace: {{c}}\nMorse: {{d}}",
      blanks: [
        { id: "a", choices: ["Increased autonomy and planning", "Deeper multimodality", "Enhanced personalization and memory", "More fluid interaction modalities"] },
        { id: "b", choices: ["Increased autonomy and planning", "Deeper multimodality", "Enhanced personalization and memory", "More fluid interaction modalities"] },
        { id: "c", choices: ["Increased autonomy and planning", "Deeper multimodality", "Enhanced personalization and memory", "More fluid interaction modalities"] },
        { id: "d", choices: ["Increased autonomy and planning", "Deeper multimodality", "Enhanced personalization and memory", "More fluid interaction modalities"] },
      ],
    },
    answer: { correct: { a: "Increased autonomy and planning", b: "Deeper multimodality", c: "Enhanced personalization and memory", d: "More fluid interaction modalities" } },
    explanation: "Turing's machines that act intelligently resonate with agents, von Neumann's link between computation and the physical world with multimodality, Lovelace's symbols for a personal world with memory, and Morse's efficient encoding with fluid interfaces.",
  },
  {
    slug: "spot-the-enduring-principles",
    kind: "spot",
    title: "What endures",
    promptText: "Select every principle the book lists as enduring.",
    public: {
      pickPrompt: "Select every enduring principle",
      hitLabel: "Enduring",
      missLabel: "Not listed",
      segments: [
        { id: "p1", text: "Clarity of intent: know precisely what you want to achieve." },
        { id: "p2", text: "Structure and organization: separate distinct components and organize information logically." },
        { id: "p3", text: "Memorize the exact syntax of today's interfaces." },
        { id: "p4", text: "Ethical responsibility: consider impact, fairness, bias and safety." },
        { id: "p5", text: "Trust the first output and skip testing." },
      ],
    },
    answer: { flawed: ["p1", "p2", "p4"] },
    explanation: "The enduring principles include clarity of intent, structure, context, precise instruction, examples, constraints, iteration and ethical responsibility. Tools and interfaces change, and testing never goes away.",
  },
  {
    slug: "obsolete-overnight",
    kind: "choice",
    title: "Will it become obsolete?",
    promptText: "Will the techniques of this course become obsolete overnight, according to the book?",
    public: {
      options: [
        "Specific implementations will evolve, but the fundamental principles of communicating with complex systems have an enduring quality",
        "Yes, every technique will be replaced within a year",
        "No change is expected at all",
        "Only the ethics will remain",
      ],
    },
    answer: { correct: 0 },
    explanation: "The book's closing thought: the tools and interfaces will change, but the craft of analyzing a need, designing clear communication, structuring, testing, refining and acting responsibly endures.",
  },
  {
    slug: "repair-the-agent-prompt",
    kind: "repair",
    title: "Delegate to an agent",
    promptText: "The book expects prompting for agents to shift from step-by-step instructions to defining goals, constraints, available tools and ethical boundaries. Rewrite this request that way, and say how the agent should report and when it must ask you first.",
    public: {
      starter: "Plan my team offsite.",
      hint: "State the goal, add constraints such as a budget, name the tools it may use, set an ethical or privacy boundary, and ask for progress reports and approval before it books anything.",
    },
    answer: {
      criteria: [
        { id: "goal", label: "States the goal", weight: 2, anyOf: ["\\b(goal|objective)\\b"], hint: "State the goal clearly, for example: plan a two-day offsite for 12 people." },
        { id: "constraints", label: "Sets constraints", weight: 2, anyOf: ["\\b(constraints?|budget|deadline|must not|do not|limit)\\b"], hint: "Add limits such as a budget or a rule that it must not exceed." },
        { id: "tools", label: "Names the tools it may use", weight: 1, anyOf: ["\\b(tools?|calendar|search|you (may|can) use|available)\\b"], hint: "Say which tools the agent may use." },
        { id: "ethics", label: "Sets an ethical or privacy boundary", weight: 2, anyOf: ["\\b(priva\\w*|ethic\\w*|confidential\\w*|fair\\w*|consent|do not share|safe\\w*)\\b"], hint: "Add a boundary such as respecting participants' privacy." },
        { id: "report", label: "Asks for reports and approval before acting", weight: 2, anyOf: ["\\b(report|progress|ask (me|for approval)|confirm|approv\\w*|before (booking|acting|you))\\b"], hint: "Ask it to report progress and to confirm with you before booking." },
      ],
      model:
        "### GOAL ###\nPlan a two-day team offsite for 12 people in June.\n\n### CONSTRAINTS ###\n- Budget: 3,000 EUR. Do not book anything above 500 EUR without asking me.\n\n### TOOLS ###\nYou may use the calendar and the web search tool.\n\n### ETHICAL BOUNDARIES ###\nRespect participants' privacy: do not share personal details with vendors, and keep the plan accessible and fair to everyone.\n\n### REPORTING ###\nReport your plan and progress after each step and ask for my approval before you book.",
    },
    explanation: "Delegating to an agent means defining the goal, the limits, the tools and the ethical boundaries, and keeping a human in control through reporting and approvals. It is the timeless craft applied to autonomous execution.",
    samples: {
      good: [
        "Your goal: organize a team lunch for 8. Budget 400 euros, do not exceed it. You can use the calendar. Keep participants' data private and confirm with me before booking.",
      ],
      bad: ["Book a venue and plan everything yourself.", "Plan the team offsite and make it good."],
    },
  },
];

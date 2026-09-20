/**
 * Chapter "Making the Model Think" (book chapter 4, "Advanced Techniques: Guiding Complex Reasoning"): 6 lessons and
 * 10 exercises, written from the Director's book, which is the only source. Every section of the chapter is covered
 * (see book-map.ts): chain of thought, tree of thoughts, knowledge distillation, the Anya case study and the closing.
 * No em dashes (writing rule, PDL-057). `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const REASONING_LESSONS: LessonContent[] = [
  {
    slug: "beyond-simple-commands-the-clockwork-method",
    title: "Beyond simple commands: the clockwork method",
    minutes: 7,
    covers: ["ch4-intro", "ch4-cot-clockwork", "ch4-cot-why-steps-help"],
    body: `You now have the foundational methods: direct instruction (the telegraph, zero-shot) and teaching by demonstration (the recipe card, few-shot). They work remarkably well when the path from input to output is fairly straightforward. But what happens when the task needs several stages of calculation, logical deduction, or the exploration of different possibilities before a conclusion can be reached?

Simple commands or single examples often fall short here. Asking a system to solve a multi-step word problem, or to weigh the subtle pros and cons of a complex strategy, takes more than stating the final goal. You need ways to guide the system through the **intermediate steps**, to encourage **exploration**, or even to **simplify** your own complex instructions once you have found a working, if convoluted, approach.

## Three advanced techniques

This chapter moves from directing the output to shaping the **process** by which the system reaches it. It is like graduating from operating simple levers to building more sophisticated mechanisms.

1. **The Clockwork Method (chain of thought):** guide the system through sequential reasoning steps, so that each logical gear engages correctly.
2. **The Forking Paths Technique (tree of thoughts):** enable the exploration and evaluation of several possible lines of reasoning or solutions.
3. **The Essence Extractor (knowledge distillation for prompts):** refine complex, working prompts into simpler, more potent forms.

Together they unlock more demanding analytical and problem-solving tasks, used with greater precision.

## 1. Chain of thought, the clockwork method

Think of a mechanical clock. Its accuracy comes not from magic but from the precise, **sequential** interaction of gears, springs and levers. The mainspring drives one gear, which turns another at a calculated ratio, which engages the escapement, which finally moves the hands. It works only because every component does its role in the right order, building on the one before. If a single gear jams, the whole chain reaction breaks down.

**Chain-of-thought (CoT) prompting** brings this principle of meticulous, sequential operation to the reasoning of a language system. Many problems, especially arithmetic, logical deduction (A leads to B, B leads to C), planning or tracking the steps of a process, are hard for these systems to solve reliably if you ask only for the final answer. They may "jump" to a conclusion from surface patterns in their training data, skip crucial intermediate steps, and land on a wrong result.

CoT changes how we ask. Instead of demanding only the final output ("What time is it?"), we instruct the system to reveal the workings of the mechanism, to **show its work**. We prompt it to generate the intermediate steps, the sequence of calculations or the logical deductions that lead to the conclusion, laying its reasoning path out step by step, like detailing how each gear turns the next.

## Why detailing the steps helps

Language systems predict text sequences. Asking for intermediate steps encourages the system to produce text for each logical stage of the problem, and that often improves accuracy for three reasons:

- **Sequential guidance.** Generating step 1 gives better context for predicting step 2, and so on. The complex problem becomes a series of smaller, more manageable prediction tasks.
- **Pattern activation.** The system was trained on huge amounts of text with explanations and step-by-step derivations, such as textbooks and tutorials. CoT nudges it toward those more structured patterns of explanation and reasoning.
- **Fewer leaps.** It discourages flawed intuitive jumps straight to an answer and forces a more grounded, traceable path.

In effect, by asking "How did you get there?" rather than only "Where did you end up?", you guide the system along a more reliable pathway.

**Try this:** find a problem where an AI gave you a wrong final answer with no explanation. Ask it again and add "Explain your reasoning step by step". Compare.`,
  },
  {
    slug: "prompting-for-chain-of-thought",
    title: "Prompting for chain of thought",
    minutes: 8,
    covers: ["ch4-cot-zero-shot", "ch4-cot-few-shot", "ch4-cot-value-exposing", "ch4-cot-limitations"],
    body: `There are two main ways to engage the clockwork.

## 1. Instruction-based (zero-shot CoT)

The simplest way is to add a directive phrase to your main instruction. Common phrases:

- "Think step-by-step."
- "Show your work."
- "Explain your reasoning process clearly before giving the final answer."
- "Let's break this down logically."
- "Work through this problem one step at a time."

**Markdown example: an arithmetic word problem**

\`\`\`
### QUESTION ###
Amira bought 4 boxes of Bosnian lokum. Each box contains 12 pieces. She gave 7
pieces to her neighbor. How many pieces of lokum does Amira have left? Explain
your calculation step-by-step.

### SOLUTION STEPS ###
\`\`\`

Expected output: a numbered or bulleted list showing 1. Total pieces = 4 boxes x 12 pieces per box = 48 pieces. 2. Pieces left = 48 - 7 = 41 pieces. 3. Final answer: 41 pieces.

**Markdown example: simple logic and planning**

\`\`\`
### SCENARIO ###
I need to prepare for a meeting tomorrow morning at 9 AM. The meeting is online.
Today is Tuesday evening. What key things should I do tonight and tomorrow morning
to be ready? Think step-by-step.

### PREPARATION PLAN ###
\`\`\`

Expected output: a logical sequence such as: 1. Tonight: review the meeting agenda and notes. 2. Tonight: prepare any materials I need to present. 3. Tonight: check the computer and internet connection. 4. Tomorrow morning: wake up with enough time. 5. Tomorrow morning: briefly review the notes again. 6. Tomorrow morning: log into the meeting link 5 to 10 minutes early.

## 2. Few-shot CoT

Provide examples that explicitly include the step-by-step reasoning inside the desired output format. This is powerful when you need a very specific style or structure for the reasoning steps.

**Markdown example: explaining decisions with a rationale**

\`\`\`
### INSTRUCTION ###
Analyze the simple customer scenarios below. Decide whether a full refund is
warranted based on the stated policy. Explain your decision step-by-step using
the format shown.

### POLICY ###
Full refunds given within 14 days with receipt, item unused. No refunds on sale items.

### EXAMPLES ###
**Input Scenario 1:** Customer bought a full-price shirt 5 days ago, has receipt,
hasn't worn it.
**Output Reasoning 1:**
* Step 1: Check purchase date: 5 days ago is within 14 days. (OK)
* Step 2: Check receipt: Receipt is present. (OK)
* Step 3: Check item condition: Item is unused. (OK)
* Step 4: Check if sale item: Item was full-price. (OK)
* Step 5: Conclusion: All conditions met.
**Output Decision 1:** Full refund warranted.

**Input Scenario 2:** Customer bought shoes on sale 20 days ago.
**Output Reasoning 2:**
* Step 1: Check purchase date: 20 days ago is outside 14 days. (Fail)
* Step 2: Check if sale item: Item was on sale. (Fail)
* Step 3: Conclusion: Multiple conditions not met.
**Output Decision 2:** Refund not warranted based on policy.

### ACTUAL TASK ###
**Input Scenario 3:** Customer bought a full-price jacket 10 days ago, has receipt,
but wore it once briefly.
**Output Reasoning 3:**
\`\`\`

Expected output: reasoning steps that analyze the conditions, noting that "worn once" violates the "unused" condition, leading to the decision that a refund is likely not warranted based strictly on the policy shown.

## The value of exposing the mechanism

- **Improved accuracy.** CoT significantly boosts reliability for tasks that need sequential steps, reducing errors from skipped logic or faulty calculations.
- **Transparency.** The output shows how the answer was derived, so people can follow the logic, build trust in correct answers and spot flaws in incorrect ones. The black box becomes more transparent.
- **Easier debugging.** When a CoT response is wrong, the error is often located in one specific step, which makes it much easier to diagnose the faulty reasoning and refine the prompt.

## Limitations

- **Unnecessary for simple tasks.** If a direct zero-shot prompt works reliably, adding CoT only adds verbosity and computation.
- **Not infallible.** CoT improves reliability but guarantees nothing. The system can still make mistakes inside the reasoning steps, so careful verification is always needed.
- **Computational cost.** Generating intermediate steps takes more time and resources.

The Clockwork Method is a vital technique for accuracy and transparency when a problem needs careful navigation through several logical stages.

**Try this:** take a small rule-based decision from your work, write two example scenarios with numbered reasoning steps, and ask for a third.`,
  },
  {
    slug: "tree-of-thoughts-the-forking-paths",
    title: "Tree of thoughts: the forking paths",
    minutes: 9,
    covers: ["ch4-tot-forking-paths", "ch4-tot-alternatives-evaluation", "ch4-tot-self-correction", "ch4-tot-few-shot-exploration", "ch4-tot-advantages", "ch4-tot-challenges"],
    body: `The clockwork method guides reasoning along **a single, sequential path**. Many real-world problems are not linear. They involve choices, uncertainties and several possible avenues. Planning a complex project, writing a persuasive argument or finding your way in an unfamiliar city: you often reach points where several options seem possible. Do you fund feature A or feature B first? Should your argument stress economic benefits or ethical considerations? Do you turn left or right at the unknown intersection?

A purely linear approach forces you to commit to one path. If it ends in a dead end you must backtrack. A better strategy is often to explore several possibilities, consider the likely outcome of turning left, then of turning right, evaluate which looks more promising given your destination, and then commit. You explore the **forking paths**.

## The Forking Paths Technique

Inspired by research on **Tree of Thoughts (ToT)**, the technique aims to give a system the ability to explore and evaluate several lines of reasoning. Instead of one chain, you prompt it to:

1. **Generate multiple possibilities.** At key decision points, produce several different potential next steps, ideas, arguments or intermediate thoughts (the branches of the tree).
2. **Evaluate them.** Assess the quality, viability or promise of each branch against the overall goal, constraints or available information.
3. **Select and expand.** Choose one or more of the most promising branches for further development, possibly branching again from there.
4. **Explore systematically.** Continue branching, evaluating and selectively expanding, searching through a tree of possibilities until a satisfactory solution is identified or composed.

The single chain becomes a branching structure, like an explorer mapping several routes through a forest instead of following one trail.

## Simulating the forking paths through prompting

A fully automated ToT search needs sophisticated control mechanisms. But as prompt engineers we can structure a prompt so that the system **simulates** the exploration and evaluation. The prompt itself orchestrates the branching and the assessment.

**Strategy 1: generate alternatives, then evaluate them explicitly.**

\`\`\`
### SCENARIO ###
Our community library wants to increase engagement among teenagers.

### INSTRUCTION ###
1. **Brainstorm Options:** Generate three distinct program ideas aimed at
   increasing library engagement for teenagers (13-18 years old). Briefly
   describe each idea.
2. **Evaluate Options:** For each of the three ideas, analyze its potential
   effectiveness based on these criteria:
   * Likely Appeal to Teenagers (Low/Medium/High)
   * Required Resources/Budget (Low/Medium/High)
   * Ease of Implementation (Low/Medium/High)
3. **Recommendation:** Based on your evaluation, which idea seems most promising
   overall, considering a balance of appeal and feasibility? Justify your choice
   briefly.

### LIBRARY PROGRAM ANALYSIS ###
\`\`\`

This structure forces the generation of several branches (the program ideas) and includes an explicit evaluation step before any conclusion.

**Strategy 2: a simulated self-correction and refinement loop.** Prompt the system to produce a first draft, critique its own work against specific criteria, and then write an improved second draft.

\`\`\`
### TASK ###
Write a short (about 150 words) description of the historical significance of
Sarajevo's City Hall (Vijećnica) for a tourist brochure.

### PROCESS ###
1. **Generate Draft 1:** Write an initial draft of the description.
2. **Self-Critique Draft 1:** Review Draft 1. Is it engaging? Does it clearly
   state the building's significance? Is the language accessible to tourists?
   Is it accurate? Identify at least one specific area for improvement.
3. **Generate Draft 2:** Write a revised and improved description based on the
   critique identified in step 2.

### OUTPUT AREA ###
\`\`\`

This guides the system through generating one path, evaluating it, and then generating a refined path.

**Strategy 3: few-shot examples of exploration.** Possible in principle, but creating few-shot examples that clearly demonstrate generating and discarding several intermediate thoughts is very challenging and often makes the prompt extremely long. The two simulation methods above are usually more practical.

## Advantages of exploring the branches

- **Better problem solving** for complex problems with no single obvious path, such as strategic planning, design brainstorming or diagnosing an ambiguous failure.
- **Higher quality solutions.** Considering alternatives makes the system less likely to settle for the first adequate but not optimal answer. Comparison surfaces stronger options.
- **More creativity and diversity.** Several initial branches often produce more varied and novel output than linear generation.
- **Robustness.** If one line of reasoning proves flawed during evaluation, the system can shift to a more promising branch identified earlier.

## Challenges of managing the exploration

- **Prompt complexity.** A prompt that reliably guides generate, evaluate and select needs more intricate design than basic CoT.
- **Computational cost.** Exploring several branches uses more resources and time.
- **Maintaining focus.** Stopping the exploration from becoming too broad or wandering off needs careful instruction and constraints.
- **Evaluation reliability.** Success hinges on the system's ability to evaluate the possibilities against your criteria. Simulating reliable self-evaluation purely through prompts can be difficult.

Even in its simulated forms, the Forking Paths Technique is a significant advance: it introduces exploration and evaluation, and moves from following a single track to actively searching for the best route through a landscape of possibilities.

**Try this:** pick a decision you face, write a prompt with a brainstorm step, an evaluation step with three criteria, and a recommendation step.`,
  },
  {
    slug: "knowledge-distillation-the-essence-extractor",
    title: "Knowledge distillation: the essence extractor",
    minutes: 8,
    covers: ["ch4-distill-essence", "ch4-distill-why-simplify", "ch4-distill-process", "ch4-distill-conceptual-example", "ch4-distill-mindset"],
    body: `Imagine a master chef who, after years of perfecting a complex sauce with dozens of ingredients and intricate steps, wants a simplified version for home cooks. They do not just remove ingredients at random. They analyze the recipe, identify the essential components, the key spices, the crucial technique, the foundational flavor base, and **distill** that understanding into a shorter, simpler recipe that captures the essence without the complexity.

## Distillation for prompts

In technical language, knowledge distillation usually means training a smaller AI model to mimic a larger one. Here it names something practical: taking a **complex, working prompt** (perhaps developed through long iterative refinement, with intricate instructions, many examples, or simulated CoT or ToT) and systematically simplifying it to its core elements while keeping it effective. The goal is to extract the **active ingredients**, the crucial instructions, the most potent examples and the essential context, into a leaner, more efficient and often more maintainable prompt. It is about removing the noise to reveal the signal.

## Why simplify a prompt that already works?

- **Efficiency.** Shorter prompts are quicker to write, read and change. They typically use fewer computational resources (tokens), giving faster responses and potentially lower cost with paid services.
- **Maintainability.** Simpler prompts are easier to understand and debug later, or to adapt by someone else.
- **Robustness.** Removing redundant or overly specific elements can make the prompt less brittle and more adaptable to slight variations in input.
- **Understanding.** Distilling forces you to understand why the original worked, and which components were truly essential rather than merely helpful.

## The distillation process: finding the essence

It is an iterative process of analysis, careful removal and rigorous testing.

1. **Identify the successful complex prompt.** Start with your master recipe: the prompt that works well but feels overly long or convoluted.
2. **Analyze the active ingredients,** using the five pillars as a guide:
   - *Context:* is all the background truly necessary? Can some be inferred?
   - *Instructions:* are there redundant commands? Can steps be combined? Is the language as concise as possible?
   - *Examples:* are all the few-shot examples necessary? Do they illustrate distinct points, or are some redundant? Could fewer, better gold star examples suffice? Are they overly complex?
   - *Constraints:* is each one actively helping? Are any too strict or conflicting?
   - *Delimiters:* can the structure be simplified with fewer delimiters?
   - *Key phrasing:* did specific words or phrases seem crucial? Note them.
3. **Hypothesize and simplify.** Form specific hypotheses about what can go, and make a simpler version (V-distilled-1). Two examples from the book: "The detailed description of the audience in the context seems less important than the few-shot examples for controlling tone" leads to removing the audience description and keeping the examples. "Examples 3 and 4 demonstrate the same formatting point as example 1" leads to removing examples 3 and 4.
4. **Test rigorously.** Compare the simplified prompt with the original on the same set of diverse test inputs, using your key success metrics (accuracy, format adherence, style match and so on). Does it still perform acceptably?
5. **Iterate.**
   - *Success:* performance is maintained, so you have distilled. You can even try simplifying further, returning to step 3.
   - *Failure:* performance degrades significantly, so your hypothesis was wrong and you removed an essential ingredient. Revert that specific change. Try simplifying a different element, or find a more concise way to express the one you removed. Continue until you find the simplest prompt that meets your quality requirements.

## A conceptual example: distilling a style prompt

- **Original:** a 500-word prompt with five long few-shot examples that make the output sound like a "19th-century naturalist exploring Bosnia", with detailed persona context and complex instructions on vocabulary.
- **Analysis:** the system nails the style mainly when the examples show specific archaic phrasing ("Upon cresting the ridgeline...") and avoidance of modern terms. The long persona description matters less than the demonstrated phrasing. Two examples capture this best.
- **Distillation:** a shorter prompt. Keep a brief role ("Act as a 19th-century naturalist"). Remove most persona details. Keep only the two strongest examples of the key phrasing and vocabulary. Simplify the instruction to "Write in the style shown in the examples."
- **Testing:** if the shorter prompt still produces the wanted style effectively, the distillation worked.

## The essence extractor mindset

The principle is valuable even when you write prompts from scratch:

- **Start lean.** Begin with the simplest possible prompt for the task.
- **Add only what is needed.** Introduce complexity (more context, examples, constraints) step by step, only when testing shows the simpler version is insufficient.
- **Focus on the core.** What is the absolute minimum the system needs to understand and execute the task correctly?
- **Refine continuously.** Now and then review your working prompts: can they be made more efficient now that you understand the interaction better?

Deliberately stripping away unnecessary complexity gives prompts that are more robust, more maintainable and often more effective, and that capture the core logic needed to guide the system.

**Try this:** take your longest working prompt, remove one element you suspect is redundant, and run both versions on the same three inputs.`,
  },
  {
    slug: "case-study-mapping-the-maze",
    title: "Case study: mapping the maze",
    minutes: 7,
    covers: ["ch4-case-study-anya-challenge-prompt", "ch4-case-study-how-simulated", "ch4-case-study-outcome"],
    body: `**Mapping the maze: how a journalist used tree-of-thoughts principles for debate analysis.** This case shows the forking paths principles working in practice, without any complex automated system.

## The challenge

Anya, a political journalist, had to analyze a heated, complex televised debate about a controversial proposed economic policy, "Proposal X". Different factions made conflicting claims about its effect on national debt, job creation and small businesses. A simple summary would miss the nuance, and her editor required a **balanced analysis** exploring the core arguments and their foundations.

Anya decided to use structured prompting, inspired by the forking paths approach, to guide a language system in dissecting the debate transcript she provided. The prompt was designed to force a systematic exploration of the different viewpoints. The task: analyze the claims about the impact of Proposal X on (a) national debt, (b) job creation and (c) small businesses, **based only on the debate transcript**.

## Anya's prompt structure

\`\`\`
### CONTEXT ###
You are an objective political analyst summarizing arguments from the debate
transcript provided below. Base your analysis strictly on the text.
[Insert Full Transcript Here...]

### TASK ###
Analyze the core arguments presented FOR and AGAINST Proposal X regarding its
impact on national debt, job creation, and small businesses, referencing specific
claims from the transcript.

### INSTRUCTIONS ###
**Part 1: National Debt Impact**
1a. **Identify & Summarize Pro-Argument:** Extract the main argument(s) made
    *favoring* Proposal X regarding national debt. Reference speaker/quote briefly.
1b. **Identify & Summarize Con-Argument:** Extract the main argument(s) made
    *against* Proposal X regarding national debt. Reference speaker/quote briefly.
1c. **Potential Assumption/Evidence Check:** For arguments in 1a & 1b, briefly
    state the *apparent basis* cited in the transcript (e.g., specific model,
    historical data, principle). Note if the opposing side directly challenged
    this basis.

**Part 2: Job Creation Impact**
2a. **Identify & Summarize Pro-Argument:** Extract argument(s) suggesting Proposal
    X will *boost* jobs. Reference speaker/quote.
2b. **Identify & Summarize Con-Argument:** Extract argument(s) suggesting Proposal
    X will *harm* jobs. Reference speaker/quote.
2c. **Potential Assumption/Evidence Check:** State the apparent basis for job
    claims (pro/con). Note any direct challenges.

**Part 3: Small Business Impact**
3a. **Identify & Summarize Pro-Argument:** Extract argument(s) that Proposal X will
    *benefit* small businesses. Reference speaker/quote.
3b. **Identify & Summarize Con-Argument:** Extract argument(s) that Proposal X will
    *harm* small businesses. Reference speaker/quote.
3c. **Potential Assumption/Evidence Check:** State the apparent basis for small
    business claims (pro/con). Note any direct challenges.

**Part 4: Synthesis**
4. Briefly summarize the main points of contention for each area (debt, jobs, small
   businesses) based *only* on the arguments explored above.

### ANALYSIS OUTPUT ###
\`\`\`

## How it simulated the forking paths

- **Exploring branches.** The prompt mandated distinct branches for each topic: the pro-argument path and the con-argument path.
- **Generating thoughts.** Each sub-step (1a, 1b and so on) produced a specific thought summarizing the arguments for that branch.
- **Evaluation and critique.** The assumption and evidence checks (1c, 2c, 3c) added a crucial evaluation layer. They examined the foundation of the arguments and found the direct clashes, simulating the evaluation of different paths.
- **Structured exploration.** The prompt enforced a systematic mapping rather than a haphazard summary.
- **Synthesis.** The final part required integrating the insights from the explored branches.

## The outcome

The system gave Anya a structured breakdown: opposing arguments side by side for each key issue, references to the transcript, notes on the basis of each claim, and the points of direct conflict highlighted. This organized output was an invaluable, unbiased foundation for her article. It let her quickly grasp the core disagreements, verify claims and structure her narrative fairly. By using prompt structure to simulate the exploratory and evaluative principles of the forking paths technique, she turned a tangled debate into a clear map of competing arguments.

**Try this:** choose a topic with two sides. Write a prompt with a pro-argument step and a con-argument step for each sub-topic, an evidence check, and a synthesis step.`,
  },
  {
    slug: "expanding-your-prompting-repertoire",
    title: "Expanding your prompting repertoire",
    minutes: 5,
    covers: ["ch4-expanding-repertoire"],
    body: `The three techniques of this chapter give you more sophisticated ways to direct language systems:

- the **sequential guidance** of the Clockwork Method (chain of thought),
- the **exploratory** Forking Paths Technique (tree-of-thoughts principles),
- the **simplifying power** of the Essence Extractor (knowledge distillation for prompts).

## What they let you do

They let you move beyond single commands or simple demonstrations to tackle tasks that involve intricate reasoning, comparative analysis, strategic exploration and process optimization.

## What they ask of you

These advanced methods usually need more careful design and testing than the foundational techniques. In return they unlock the potential to use these systems for significantly more complex and nuanced work. They let you build more elaborate mechanisms with language, guiding the system's internal processing more deliberately toward sophisticated and reliable outcomes. Mastering these approaches marks a significant step toward true proficiency in the craft of prompt engineering.

## A way to choose

- Reach for **chain of thought** when the answer depends on steps that must follow one another: arithmetic, deduction, planning, checking a policy. Skip it when a direct prompt already works reliably.
- Reach for **forking paths** when there is no single obvious route: strategy, design, ambiguous diagnosis, balanced analysis. Expect a longer, more carefully constrained prompt.
- Reach for **distillation** when a prompt works but has grown long and brittle, and whenever you want to understand what really matters in it.

## In one line

Advanced prompt engineering techniques include the Clockwork Method (CoT) for guiding sequential reasoning, the Forking Paths Technique (ToT simulation) for exploring multiple options, and the Essence Extractor (distillation) for simplifying complex prompts.

**Try this:** for your next real task, decide before writing which of the three you need, and write one sentence saying why.`,
  },
];

export const REASONING_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "when-cot-helps",
    kind: "choice",
    title: "When chain of thought helps most",
    promptText: "For which kind of task is chain-of-thought prompting most useful?",
    public: {
      options: [
        "Looking up a simple fact",
        "Writing a slogan with no rules",
        "Multi-step arithmetic, logical deduction or planning",
        "Translating a common phrase",
      ],
    },
    answer: { correct: 2 },
    explanation: "CoT helps when the answer depends on intermediate steps that must follow one another. For simple, common tasks a direct zero-shot prompt already works and CoT only adds verbosity.",
  },
  {
    slug: "the-cot-phrase",
    kind: "choice",
    title: "The magic phrase",
    promptText: "Which instruction turns a plain question into a zero-shot chain-of-thought prompt?",
    public: {
      options: [
        "Think step-by-step and show your work before the final answer.",
        "Answer in one word.",
        "Be as brief as possible.",
        "Give only the final number.",
      ],
    },
    answer: { correct: 0 },
    explanation: "A directive such as \"Think step-by-step\" or \"Show your work\" asks the system to write out the intermediate steps. The others ask for less reasoning, not more.",
  },
  {
    slug: "order-the-forking-paths",
    kind: "order",
    title: "Order the forking paths",
    promptText: "The Forking Paths Technique works in four moves. Put them in the order the book gives.",
    public: {
      blocks: [
        { id: "explore", text: "Explore systematically: keep branching, evaluating and expanding until a satisfactory solution is found" },
        { id: "evaluate", text: "Evaluate the possibilities against the goal and constraints" },
        { id: "generate", text: "Generate several possibilities at a key decision point" },
        { id: "select", text: "Select the most promising branches and expand them" },
      ],
    },
    answer: { order: ["generate", "evaluate", "select", "explore"] },
    explanation: "Generate several possibilities, evaluate them, select and expand the most promising, and continue systematically. The single chain becomes a branching structure.",
  },
  {
    slug: "spot-the-cot-limitations",
    kind: "spot",
    title: "Limitations, not benefits",
    promptText: "Some of these statements are limitations of chain of thought and some are benefits. Select every limitation.",
    public: {
      pickPrompt: "Select every limitation",
      hitLabel: "Limitation",
      missLabel: "Benefit",
      segments: [
        { id: "c1", text: "It is unnecessary for simple tasks a direct prompt already handles" },
        { id: "c2", text: "It shows how the answer was derived, so people can follow the logic" },
        { id: "c3", text: "It is not infallible, the system can still err inside the steps" },
        { id: "c4", text: "When it is wrong, the error is often in one specific step" },
        { id: "c5", text: "Generating the intermediate steps takes more time and resources" },
      ],
    },
    answer: { flawed: ["c1", "c3", "c5"] },
    explanation: "The limitations are: needless verbosity for simple tasks, no guarantee of perfection, and extra computational cost. Transparency and easier debugging are benefits.",
  },
  {
    slug: "complete-the-refund-reasoning",
    kind: "fill",
    title: "Finish the reasoning",
    promptText: "The policy: full refunds within 14 days with receipt, item unused, and no refunds on sale items. Complete the reasoning for a full-price jacket bought 10 days ago, with receipt, worn once.",
    public: {
      template:
        "Step 1: Check purchase date: {{a}}\nStep 2: Check receipt: {{b}}\nStep 3: Check item condition: {{c}}\nStep 4: Check if sale item: Item was full-price. (OK)\nStep 5: Conclusion: {{d}}",
      blanks: [
        { id: "a", choices: ["10 days ago is within 14 days. (OK)", "10 days ago is outside 14 days. (Fail)"] },
        { id: "b", choices: ["Receipt is present. (OK)", "No receipt. (Fail)"] },
        { id: "c", choices: ["Item is unused. (OK)", "Item was worn once, so it is not unused. (Fail)"] },
        { id: "d", choices: ["All conditions met, full refund warranted.", "A condition is not met, refund likely not warranted."] },
      ],
    },
    answer: { correct: { a: "10 days ago is within 14 days. (OK)", b: "Receipt is present. (OK)", c: "Item was worn once, so it is not unused. (Fail)", d: "A condition is not met, refund likely not warranted." } },
    explanation: "Each step checks one condition of the policy. Ten days is within 14 and the receipt is there, but wearing the jacket once breaks the \"unused\" condition, so the refund is likely not warranted.",
  },
  {
    slug: "cot-versus-tot",
    kind: "choice",
    title: "One chain or many branches",
    promptText: "What distinguishes the Forking Paths Technique from plain chain of thought?",
    public: {
      options: [
        "It asks for a shorter answer",
        "It generates several options, evaluates them and selects the most promising",
        "It removes all examples from the prompt",
        "It works only for arithmetic",
      ],
    },
    answer: { correct: 1 },
    explanation: "Chain of thought follows a single sequential path. Forking paths branches, evaluates the branches against criteria and then selects, which suits problems with several possible routes.",
  },
  {
    slug: "which-prompt-forks",
    kind: "choice",
    title: "Which prompt simulates forking paths?",
    promptText: "Which of these prompts simulates the Forking Paths Technique?",
    public: {
      options: [
        "Solve this step by step.",
        "Generate three distinct ideas, evaluate each against stated criteria, then recommend the best and justify it.",
        "Answer in one line.",
        "Repeat your answer three times.",
      ],
    },
    answer: { correct: 1 },
    explanation: "It forces several branches (three ideas), an explicit evaluation against criteria, and a selection. That generate, evaluate and select structure is what simulates the tree.",
  },
  {
    slug: "order-the-distillation",
    kind: "order",
    title: "Order the distillation process",
    promptText: "Put the steps of prompt distillation in the order the book gives.",
    public: {
      blocks: [
        { id: "test", text: "Test rigorously: compare the simplified prompt with the original on the same diverse inputs" },
        { id: "identify", text: "Identify the successful complex prompt" },
        { id: "iterate", text: "Iterate: keep the simplification if it holds, revert the change if it fails" },
        { id: "hypothesize", text: "Hypothesize and simplify: create a simpler version" },
        { id: "analyze", text: "Analyze the active ingredients, pillar by pillar" },
      ],
    },
    answer: { order: ["identify", "analyze", "hypothesize", "test", "iterate"] },
    explanation: "Start from a working prompt, analyze its ingredients, form a hypothesis and simplify, test against the original, then iterate: keep what holds and revert what breaks.",
  },
  {
    slug: "distillation-went-wrong",
    kind: "choice",
    title: "The simplified prompt got worse",
    promptText: "You removed a paragraph from a working prompt and the output quality dropped a lot. According to the book, what do you do next?",
    public: {
      options: [
        "Remove even more, to force the system to adapt",
        "Give up on the prompt entirely",
        "Keep the change because shorter is always better",
        "Revert that specific change, then try simplifying a different element or word the removed one more concisely",
      ],
    },
    answer: { correct: 3 },
    explanation: "A drop in performance means the hypothesis was wrong and you removed an essential ingredient. Revert that change and continue with a different element or a more concise wording, until you reach the simplest prompt that meets your quality needs.",
  },
  {
    slug: "repair-into-forking-paths",
    kind: "repair",
    title: "Turn a plain question into forking paths",
    promptText: "Rewrite this plain question so that it simulates the Forking Paths Technique: several options, an evaluation against criteria, and a recommendation.",
    public: {
      starter: "Which program should our library start for teenagers?",
      hint: "Ask for a number of distinct ideas first, then an evaluation against named criteria, then a recommendation with a short justification.",
    },
    answer: {
      criteria: [
        { id: "options", label: "Asks for several distinct options", weight: 2, anyOf: ["\\b(three|3|several|multiple|distinct)\\b[^.\\n]{0,40}\\b(ideas?|options?|programs?|alternatives?)\\b"], hint: "Ask for a number of distinct ideas, for example three program ideas." },
        { id: "evaluate", label: "Asks for an evaluation", weight: 2, anyOf: ["\\b(evaluate|assess|compare|analy[sz]e)\\b"], hint: "Add a step that evaluates or compares the ideas." },
        { id: "criteria", label: "Names the criteria", weight: 2, anyOf: ["\\b(criteria|appeal|budget|cost|feasib\\w*|ease|effectiveness|resources)\\b"], hint: "Name what to judge them on, such as appeal, budget and ease." },
        { id: "recommend", label: "Asks for a recommendation", weight: 2, anyOf: ["\\b(recommend\\w*|most promising|best option|best idea|choose)\\b"], hint: "End by asking which idea is most promising and why." },
        { id: "steps", label: "Lays the steps out in order", weight: 1, anyOf: ["(^|\\n)\\s*1\\.[\\s\\S]*?\\n\\s*2\\."], hint: "Number the steps 1, 2, 3." },
      ],
      model:
        "### SCENARIO ###\nOur community library wants to increase engagement among teenagers (13-18).\n\n### INSTRUCTION ###\n1. Brainstorm: generate three distinct program ideas and describe each briefly.\n2. Evaluate: for each idea, assess likely appeal, required budget and ease of implementation (Low, Medium or High).\n3. Recommendation: say which idea is most promising overall and justify your choice briefly.",
    },
    explanation: "The forking paths pattern is generate, evaluate, select. Several branches, an evaluation against named criteria and a recommendation replace a single unexamined answer.",
    samples: {
      good: [
        "Our library wants more teenage visitors. First list three different program ideas. Then compare them on cost and appeal. Finally recommend the best one and explain why.",
      ],
      bad: ["Give me three ideas for the library.", "Suggest something good for teens at the library."],
    },
  },
];

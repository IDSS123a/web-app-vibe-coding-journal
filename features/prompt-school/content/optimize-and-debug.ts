/**
 * Chapter "Optimizing and Debugging Prompts" (book chapter 7, "Optimization and Debugging: Refining for Reliability"):
 * 7 lessons and 10 exercises, written from the Director's book, which is the only source. Every section of the chapter
 * is covered (see book-map.ts): iterative refinement in five stages, A/B testing, seven common failures, the debugging
 * mindset, the three-cycle blog workshop and the closing. No em dashes (writing rule, PDL-057).
 * `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const OPTIMIZE_LESSONS: LessonContent[] = [
  {
    slug: "refining-for-reliability-the-watchmakers-patience",
    title: "Refining for reliability: the watchmaker's patience",
    minutes: 8,
    covers: ["ch7-intro", "ch7-iterative-refinement", "ch7-stage-1-draft", "ch7-stage-2-test"],
    body: `You now hold a considerable toolkit: the five pillars, the foundational techniques, methods for guiding complex reasoning, the effect of structure on clarity and security, and domain tailoring for coding or research. In theory you can build effective prompts.

But theory and practice often diverge. An engineer who builds a bridge from sound calculations still runs load tests and inspections. A chef who follows a proven recipe still tastes and adjusts the seasoning. The first version of a prompt, however carefully built, **rarely performs perfectly at once**. It may give generally acceptable results but stumble on certain inputs, capture the core idea but fail on a formatting requirement, or work most of the time and occasionally produce nonsensical or biased output.

Consistent, high-quality results, especially for critical or repetitive tasks, demand two processes:

- **Optimization:** deliberately improving the prompt's performance against specific goals.
- **Debugging:** systematically finding and fixing the root causes of failures or shortcomings.

This is not optional polishing. It is an essential part of the craft, and it turns a temperamental tool into a reliable instrument.

## Three methods in this chapter

1. **Iterative refinement, the watchmaker's patience:** the meticulous, cyclical process of observing outputs, diagnosing flaws, making targeted adjustments and testing again.
2. **A/B testing, the double-blind taste test:** a structured way to compare prompt variants objectively against clear metrics.
3. **Troubleshooting common failures, tracing faulty wiring:** a diagnostic guide that links common problems back to weaknesses in the foundational pillars.

Mastering them lifts prompt engineering from guesswork to a disciplined practice.

## 1. Iterative refinement: the watchmaker's patience

A master watchmaker peers through a loupe at the movement of a newly assembled watch. The gears mesh, the balance wheel oscillates, the hands sweep. It works. But perhaps it gains a few seconds a day, or hangs slightly at one point. The watchmaker does not discard it. They **observe** closely, **hypothesize** about the cause (mainspring tension slightly off? friction in the gear train? the balance wheel's timing?), make **one minuscule adjustment**, perhaps turning a regulating screw by a fraction of a millimetre, reassemble, and **observe again**. Observe, diagnose, adjust, observe again, until the watch is accurate. Incremental, targeted improvement based on careful observation.

Iterative refinement is the prompt engineer's version. Your first draft (**version 0**) is rarely perfect. It is a **hypothesis** about how to communicate your intent, and the refinement cycle is the empirical method you use to test and improve it:

**1. Draft, 2. Test, 3. Analyze, 4. Refine, then repeat.**

## Stage 1: draft, the initial assembly (V0)

Create the first version, applying everything you have learned: define the goal, establish clear context, write precise instructions, include high-quality examples if needed, set the necessary constraints and use unambiguous delimiters. Build the best mechanism you can from your understanding of the task and the five pillars.

## Stage 2: test, observing the mechanism in action

A prompt on paper is only potential. You need to see how it performs with the system.

- **Use diverse, representative inputs.** Do not rely on a single easy case. Prepare a set that reflects the variety the prompt will meet in real use, including:
  - typical scenarios;
  - edge cases: unusual but valid inputs, such as very short or very long texts for summarization, or inputs near the boundaries of defined rules;
  - potentially challenging inputs: ambiguous queries, topics close to constrained exclusions;
  - if relevant, adversarial inputs to test robustness.
- **Execute the prompt.** Run V0 with each input in your test set.
- **Collect outputs systematically.** Save or carefully record the exact response for each test input.

**Try this:** for a prompt you use often, write a test set of five inputs: two typical, two edge cases and one hard one.`,
  },
  {
    slug: "analyze-refine-and-repeat",
    title: "Analyze, refine and repeat",
    minutes: 8,
    covers: ["ch7-stage-3-analyze", "ch7-stage-4-refine", "ch7-stage-5-repeat", "ch7-essence-of-iteration"],
    body: `## Stage 3: analyze, diagnosing the performance flaws

This is where critical observation happens. Put on the watchmaker's loupe and scrutinize the collected outputs against your original goals and requirements.

- **Compare to the goal.** Did the output achieve the fundamental task?
- **Check accuracy.** Was the information factually correct? Were the calculations right? (Crucial, especially without RAG grounding.)
- **Assess completeness.** Was all required information included? Was anything important left out?
- **Verify format.** Did the output strictly follow the specified format (lists, tags, tables)? Any deviations?
- **Evaluate tone and style.** Did it match the requested persona or style? Was it appropriately formal or informal, empathetic or objective?
- **Review constraints.** Were length limits and content exclusions respected?
- **Judge clarity and conciseness.** Was it easy to understand? Too wordy? Too brief?
- **Examine consistency.** Did performance vary significantly across inputs? Were failures random or linked to specific types of input?
- **Pinpoint specific failures.** Do not just conclude "it's not good". Identify the precise nature of the shortcoming: "failed to extract dates in YYYY-MM-DD format", "tone became too casual in response to input X", "reasoning step 2 was logically flawed", "summary exceeded the word count by 50 words".

### Connecting flaws to pillars: root cause diagnosis

Trace the observed problems back to weaknesses in the prompt's construction:

- **Output irrelevant or off-topic?** Check context, instructions and constraints.
- **Wrong format or structure?** Check instructions, the clarity and quality of examples, and the consistency of delimiters.
- **Incorrect information or hallucination?** Check whether context (source data, RAG) was provided and sufficient, whether the instructions forbade guessing, and whether the constraints required a factual basis.
- **Wrong tone or style?** Check the context (persona definition) and the quality and relevance of the examples.
- **Inconsistent performance?** Look for ambiguity in the instructions or examples, check whether the system's temperature setting might be too high (if applicable), and investigate problematic delimiters.
- **Reasoning errors?** Consider adding chain-of-thought instructions, and check the clarity of the problem statement in the context or instructions.

## Stage 4: refine, making targeted adjustments (V0 to V1)

Based on your diagnosis, make specific, focused changes to address the identified flaws. Resist the urge to rewrite everything at random.

- **Targeted fixes.** Adjust the pillar you diagnosed as the likely cause:
  - fixing verbosity: add or tighten a word-count constraint;
  - fixing bad format: clarify the format rules in the instructions **and** provide better examples;
  - fixing reasoning: add a chain-of-thought instruction;
  - fixing bad tone: refine the persona context **or** improve the stylistic examples;
  - fixing confusion or injection: strengthen the delimiters **and** add explicit handling instructions.
- **Incremental changes.** Adjust one element, or a small group of related elements, at a time, so that you can isolate the effect of your change in the next test. Think small, precise adjustments.
- **Document your changes.** Keep brief notes on each version (V1, V2 and so on) about what you changed and why, for example: "V1: added a specific format example to fix inconsistent list output. Tightened the word-count constraint."

## Stage 5: repeat the cycle

Take the refined prompt (V1) back to stage 2. Test it with the **same core set** of test inputs (you may add new ones that target the fix), and collect the new outputs. Analyze again. Did the change work? Did it introduce new problems? What flaws remain? On the basis of this new analysis, refine to create V2. Continue the loop until the prompt consistently meets your requirements across all test cases.

## The essence of iteration

Iterative refinement demands patience, a methodical approach, critical analysis, targeted adjustments and consistent testing. It is the most fundamental process for improving prompt performance, turning initial drafts into reliable tools through gradual, evidence-based improvement, much like the meticulous work needed to perfect a fine mechanical instrument.

**Try this:** run your test set on a prompt of yours and write, for the worst output, one sentence that names the precise flaw and one that names the pillar you suspect.`,
  },
  {
    slug: "ab-testing-the-double-blind-taste-test",
    title: "A/B testing: the double-blind taste test",
    minutes: 8,
    covers: ["ch7-ab-testing", "ch7-ab-steps", "ch7-ab-example", "ch7-controlled-comparison"],
    body: `Iterative refinement is superb for fixing known flaws and gradually climbing toward better performance. But sometimes the challenge is different. You have two or more plausible but different ideas for how to phrase an instruction, which set of examples might be better, or what exact constraint value is best. Iterating may lead you to one solution, but how do you know an alternative would not have been even better? Or how do you choose between two refined prompts that seem about equal in informal testing?

Relying on gut feeling ("this phrasing feels clearer") can be deceptive. You need a more objective method. That is **A/B testing**, borrowed from scientific experimentation and widely used in web design and marketing.

## The double-blind taste test

Imagine developing a new flavour of Bosnian coffee, with two promising blends, A and B. To learn which one people genuinely prefer, you run a taste test. Ideally it is **double-blind**: neither the person tasting nor the person serving knows which cup holds A and which holds B. Participants taste both and state a preference or rate them on attributes such as aroma, bitterness and body. By analyzing the preferences of many participants, the company can objectively decide which blend performs better on its chosen success metric.

A/B testing for prompts applies the same logic of controlled comparison.

## The seven steps

1. **Isolate ONE variable.** This is the cardinal rule. An A/B test compares the effect of changing only one element between two prompts. If you change several things you cannot know which change caused the difference. Decide exactly what single variable to test: instruction wording A versus B, 3 examples versus 5, constraint X versus Y, persona description A versus B.
2. **Create variants A and B.**
   - *Variant A (control):* your current best version, the baseline.
   - *Variant B (challenger):* identical to A in every respect except the single variable under test.
3. **Define a measurable success metric.** How will you objectively pick the winner? It must be quantifiable. Examples:
   - **Accuracy:** the percentage of correct answers or extractions.
   - **Format compliance:** a score for following rules, such as 0 to 5 points for correct tagging.
   - **Human rating (blinded):** evaluators rate outputs on scales (for example 1 to 5 for clarity, relevance, tone) without knowing which prompt produced which output. Compare the average scores.
   - **Task completion:** for code, does it compile or pass the tests? For instructions, did they lead to the correct action?
   - **Conciseness:** word or token count, if brevity is a goal alongside quality.
   - **Subjective preference (blinded):** simply ask blinded reviewers "which response is better?" and tally the preferences.
4. **Prepare consistent test data.** Use exactly the same set of diverse inputs for both variants. The set must be large enough to give meaningful results, more than just a few inputs.
5. **Run the controlled test.** Execute both prompts on all the test inputs under identical conditions. Collect and meticulously organize the outputs for each variant.
6. **Analyze results objectively.** Apply your predefined metric to compare the two sets of outputs. Calculate averages or percentages, or tally preferences, and look for statistically meaningful differences where applicable. Did one variant consistently outperform the other on your metric across the test set?
7. **Implement or iterate.**
   - If B demonstrably beats A on your objective metric, it becomes the new standard.
   - If there is no significant difference, the change probably did not matter much (stick with A, since simpler is often better when performance is equal), or your metric was not sensitive enough.
   - If B performs worse, revert to A.

## A/B test example: optimizing an instruction for tone

- **Goal:** make a chatbot's refusal message (when it cannot answer) sound maximally helpful and polite.
- **Variable:** the exact wording of the refusal instruction inside the prompt.
- **Variant A (control):** "If the answer is not in the knowledge base, state that the information is unavailable."
- **Variant B (challenger):** "If the answer is not in the knowledge base, politely explain you couldn't find the specific information in your resources and offer to escalate to a human agent."
- **Metric:** blinded human rating (1 to 5) of the perceived helpfulness of the refusal messages produced for unanswerable questions.
- **Test:** run both prompts with 20 unanswerable questions, collect the refusals, and have reviewers rate the helpfulness of each without knowing which prompt version wrote it.
- **Analysis:** compare the average scores. If B scores significantly higher (for example 4.2 versus 3.1), its instruction is objectively better for the wanted tone, so implement B.

## The value of controlled comparison

A/B testing gives objectivity, isolates the impact of specific changes, builds confidence in improvements and helps you tell apart options that seem subjectively similar. It is particularly valuable when optimizing prompts for critical applications, or when you need to justify design choices with data. It is the prompt engineer's method for running controlled experiments to scientifically validate improvements.

**Try this:** choose one instruction in a prompt you use, write a variant B that changes only its wording, and decide on a metric before you run either.`,
  },
  {
    slug: "tracing-faulty-wiring-part-1",
    title: "Tracing faulty wiring, part 1: four common failures",
    minutes: 9,
    covers: ["ch7-troubleshooting", "ch7-problem-1", "ch7-problem-2", "ch7-problem-3", "ch7-problem-4"],
    body: `Despite your best efforts in design and refinement, prompts sometimes fail. The output may be irrelevant, nonsensical, badly formatted, biased or simply inconsistent. Then you must shift into **debugging mode**. Like an electrician tracing faulty wiring in a complex circuit, you need systematic ways to find the root cause.

Knowing that a prompt failed is not enough. You need to understand **why** in order to fix it. Most prompt failures trace back to weaknesses or misuse of the five pillars. Here is the diagnostic guide, problem by problem, each with its symptom, its possible causes (the faulty wiring) and diagnostic questions.

## Problem 1: irrelevant or off-topic output

- **Symptom.** The system generates text that does not address the core request or wanders into unrelated areas.
- **Possible causes.**
  - *Weak context:* not enough background or framing for the system to understand the domain or goal (pillar 1).
  - *Ambiguous instructions:* the core task was not clearly defined, leaving too much room for interpretation (pillar 2).
  - *Missing constraints:* no rules to keep the system focused or to exclude irrelevant topics (pillar 4).
  - *If using RAG:* the retrieved context itself may have been irrelevant to the actual query.
- **Diagnostic questions.** Is the goal clearly stated? Is the necessary background provided? Are there explicit instructions to stay on topic? Are there constraints preventing discussion of X, Y or Z?

## Problem 2: incorrect formatting

- **Symptom.** The output does not follow the desired structure: paragraphs instead of bullet points, wrong tags, broken JSON or XML, inconsistent list formatting.
- **Possible causes.**
  - *Unclear formatting instructions:* the prompt did not explicitly say how to format the output (pillar 2).
  - *Missing or poor few-shot examples:* none demonstrated the exact target format, or the ones provided were flawed, inconsistent or did not represent the wanted structure (pillar 3 is critical here).
  - *Conflicting instructions or examples:* different parts of the prompt implicitly suggest different formats.
  - *Complexity overload:* the requested format may be too complex to follow reliably without extremely clear examples or without breaking the task down.
- **Diagnostic questions.** Did I explicitly instruct the system on the format? Did I provide clear, consistent examples of the exact format? Are my examples truly gold star? Is the format overly complex?

## Problem 3: factual errors and hallucinations

- **Symptom.** The system confidently states information that is incorrect, nonsensical or not based on the provided reality or context.
- **Possible causes.**
  - *Lack of grounding context (missing RAG):* the prompt asked about a topic that needs specific or recent knowledge but supplied no source documents, so the system fell back on possibly flawed patterns from its training (pillar 1 and the RAG principles).
  - *No instruction to stick to the context:* even where context was provided, nothing strongly told the system to answer only from it (pillar 2).
  - *Missing constraint against fabrication:* no explicit rule such as "Do not make up information if you don't know the answer" (pillar 4).
  - *Prompting for speculation:* the prompt may implicitly encourage guessing, for example "Predict what might happen...".
- **Diagnostic questions.** Does this question require specific knowledge unlikely to be in general training data? Did I provide that knowledge as context? Did I explicitly instruct the system to use only that context? Did I forbid guessing?

## Problem 4: undesired tone or style

- **Symptom.** The output is too formal or too casual, lacks the requested persona, sounds robotic or does not match the desired voice.
- **Possible causes.**
  - *Missing or vague persona context:* the role or persona was not clearly defined (pillar 1).
  - *No explicit tone instruction:* the target tone was not specified, for example "Use an empathetic tone" (pillar 2).
  - *Ineffective or missing few-shot examples:* none demonstrated the target style, or those provided did not capture the wanted nuance (pillar 3 is often key for subtle styles).
- **Diagnostic questions.** Did I clearly define the persona? Did I explicitly describe the desired tone? Would examples of the target style be more effective? Are my current examples good representations of the style?

**Try this:** take a prompt that recently disappointed you, match its symptom to one of these four problems and answer that problem's diagnostic questions.`,
  },
  {
    slug: "tracing-faulty-wiring-part-2",
    title: "Tracing faulty wiring, part 2: three more failures and the debugging mindset",
    minutes: 8,
    covers: ["ch7-problem-5", "ch7-problem-6", "ch7-problem-7", "ch7-debugging-mindset"],
    body: `## Problem 5: inconsistent output quality

- **Symptom.** The prompt works well sometimes and poorly at other times, even with similar inputs.
- **Possible causes.**
  - *Ambiguity:* unrecognized ambiguity in the instructions, context or examples lets the system interpret the prompt differently each time.
  - *High temperature setting (if applicable):* when you use an API, a high temperature increases randomness and therefore variability. Lowering it often increases consistency for analytical tasks.
  - *Subtle input variations:* the prompt may be sensitive to minor, unnoticed differences in the phrasing or structure of the input.
  - *Weak examples:* the few-shot examples may not be strong or consistent enough to lock the system onto the pattern every time.
- **Diagnostic questions.** Could my instructions be read in more than one way? Are my examples perfectly consistent? Is the randomness setting appropriate? Does the failure correlate with specific types of input variation?

## Problem 6: bias or unfairness in the output

- **Symptom.** The output contains stereotypes or harmful generalizations, underrepresents someone, or treats different groups unfairly. (The Advanced level has a full chapter on this.)
- **Possible causes.**
  - *Inherited data bias:* the system replicates biases present in its training data. This is the most common cause.
  - *Biased prompting:* the prompt itself used loaded language, gave biased examples, lacked fairness constraints or asked subjective questions prone to biased answers (pillars 1, 2, 3 and 4).
- **Diagnostic questions.** Does my prompt use neutral language? Are my examples diverse and fair? Did I explicitly instruct against bias or stereotypes? Am I asking for objective facts or for subjective judgments?

## Problem 7: prompt injection success

- **Symptom.** The system ignores its original instructions and follows commands embedded in user input. (You met this in the chapter on structure and protection.)
- **Possible causes.**
  - *Weak or missing delimiters:* no clear limits separating trusted instructions from untrusted user input (pillar 5).
  - *Missing handling instructions:* no explicit command telling the system to disregard instructions found inside the delimited user input section (a specific kind of instruction or constraint, pillars 2 and 4).
- **Diagnostic questions.** Is the user input clearly fenced off? Did I explicitly instruct the system not to execute commands inside that fenced area?

## The debugging mindset

Troubleshooting prompts calls for a systematic approach. When you face a failure:

1. **Reproduce the error.** Can you reliably get the bad output with a specific input?
2. **Isolate the problem.** Temporarily simplify the prompt. Remove sections one by one (examples, constraints, parts of the context) to see whether the problem disappears, which helps pinpoint the faulty component.
3. **Analyze against the pillars.** Use the diagnostic questions above to hypothesize which pillar or pillars are weak.
4. **Make targeted changes.** Refine the suspected weak component or components.
5. **Test again.** See whether the fix worked and did not introduce new problems.

Like tracing faulty wiring, debugging prompts involves patience, systematic testing and connecting the observed symptoms back to the underlying structure and components of your instructions.

**Try this:** pick a prompt whose output varies from run to run. Write down two ambiguities you can find in its instructions, and fix one.`,
  },
  {
    slug: "workshop-from-draft-to-dependable",
    title: "Workshop part 1: from draft to dependable",
    minutes: 8,
    covers: ["ch7-workshop-v0-v1", "ch7-workshop-v2"],
    body: `Let us apply the iterative refinement process, the watchmaker's patience, to improve a prompt that generates draft blog posts on productivity topics for busy young professionals. The goal is an encouraging, practical, actionable post of about 500 words with a clear structure.

## Starting point: version 0 (V0), the bare minimum

\`\`\`
### INSTRUCTION ###
Write a blog post about [Topic].
Goal: Generate a ~500-word blog post draft on topics like "Time Management,"
"Beating Procrastination," "Organizing Workspace." Tone: encouraging, practical,
actionable for young professionals. Structure: Intro, main points/tips, conclusion.
\`\`\`

Test inputs (topics): 1. Time Management Tips, 2. Beating Procrastination, 3. Organizing Your Workspace.

## Refinement cycle 1: adding foundational structure (V0 to V1)

1. **Test V0.** The outputs are unstructured, tonally inconsistent, of variable length and lack actionable advice. It fails on almost every criterion.
2. **Analyze V0.** Diagnosis: core components are missing: context (role, audience, tone), specific instructions (structure, content type) and constraints (length).
3. **Refine V0 to V1.** Add the essential pillars.

**Prompt V1**

\`\`\`
### CONTEXT ###
Role: You are a helpful productivity coach writing a blog post.
Audience: Busy young professionals looking for practical advice.
Tone: Encouraging, practical, actionable, slightly informal but professional.

### INSTRUCTION ###
Write a blog post draft on the topic: "[Topic]". Include:
1. Engaging introduction.
2. 3-5 main points/tips (practical focus).
3. Motivating conclusion.

### CONSTRAINTS ###
- Target word count: Approx. 500 words.
- Avoid jargon. Ensure tips are concrete.

### BLOG POST DRAFT ###
\`\`\`

## Refinement cycle 2: enhancing actionability and relevance (V1 to V2)

1. **Test V1.** The outputs have structure and a better tone, and the length is closer to the target. But the tips are still somewhat vague ("manage energy"), the introduction is generic, the flow could improve, and the posts lack specific relevance to young professionals' challenges.
2. **Analyze V1.** Diagnosis: the instructions need more specificity on how to make tips actionable, and the context could be more specific to the audience's challenges.
3. **Refine V1 to V2.** Demand examples and how-to steps inside the tips, tailor the context, and add chain-of-thought-like guidance for elaboration.

**Prompt V2**

\`\`\`
### CONTEXT ###
Role: Helpful productivity coach writing a blog post.
Audience: Busy young professionals often juggling multiple projects and digital tools.
Tone: Encouraging, practical, actionable, slightly informal but professional.

### INSTRUCTION ###
Write a blog post draft on "[Topic]", addressing challenges common to young
professionals. Include:
1. **Introduction:** Hook reader by relating topic to a common young professional
   challenge (e.g., overwhelm, digital distractions). State post's goal.
   (Approx. 50-75 words)
2. **Main Body (3-5 Tips):** Present 3-5 practical tips.
   * For each tip: Clearly state it. **Explain *how* to implement it step-by-step or
     provide a concrete example** relevant to their workflow/environment. Ensure
     smooth transitions. (Approx. 350-400 words total).
3. **Conclusion:** Summarize benefit, end with motivating call to action.
   (Approx. 50-75 words)

### CONSTRAINTS ###
- Target word count: 450-550 words total.
- Use clear language. Ensure tips have specific actions/examples. Maintain tone.

### BLOG POST DRAFT ###
\`\`\`

Notice the pattern in both cycles: test, name the precise weakness, connect it to a pillar, and change only what the diagnosis points to.

**Try this:** write V0 of a prompt you need, then list what V1 should add and to which pillar each addition belongs.`,
  },
  {
    slug: "workshop-polishing-and-the-pursuit-of-perfection",
    title: "Workshop part 2: polishing V3, and the pursuit of prompt perfection",
    minutes: 7,
    covers: ["ch7-workshop-v3", "ch7-pursuit-of-perfection"],
    body: `## Refinement cycle 3: polishing voice, examples and structure (V2 to V3)

1. **Test V2.** The tips are much more actionable and the connection to the audience is stronger. The structure is good. But the examples are sometimes simplistic, the voice is slightly robotic, and subheadings would make the post easier to scan.
2. **Analyze V2.** Diagnosis: the instructions for examples need more emphasis on specificity and insight. The tone needs a final polish by instruction (or by few-shot examples if needed). The requirement for subheadings is missing.
3. **Refine V2 to V3.** Explicitly require subheadings, demand specific, relatable examples, and refine the persona and tone instruction for more personality.

**Prompt V3, the final version from the workshop**

\`\`\`
### CONTEXT ###
Role: Friendly, insightful productivity coach writing a blog post. Think helpful mentor.
Audience: Ambitious but often overwhelmed young professionals navigating busy
careers and digital workplaces.
Tone: Encouraging, practical, actionable, empathetic, clear, engaging. Inject
relatable personality.

### INSTRUCTION ###
Write a blog post draft on "[Topic]", focusing on challenges/solutions highly
relevant to young professionals. Include:
1. **Engaging Introduction:** Hook reader via specific audience struggle related to
   [Topic]. State reader gain. (Approx. 50-75 words)
2. **Actionable Main Body (3-5 Tips):**
   * Present 3-5 distinct tips. **Use clear, benefit-oriented subheadings for each tip.**
   * For each tip: State it clearly. **Explain *how* to implement step-by-step or
     provide a concrete, specific example** illustrating its use in a typical young
     professional context (e.g., managing digital tools, communication overload).
     Make examples creative and insightful.
   * Ensure logical flow/smooth transitions. (Approx. 350-400 words total)
3. **Motivating Conclusion:** Summarize core benefit. End with strong, encouraging
   call to action or memorable thought. (Approx. 50-75 words)

### CONSTRAINTS ###
- Target word count: 450-550 words total.
- Avoid jargon; use clear language.
- Prioritize specific actions and relatable examples.
- Maintain engaging/empathetic tone throughout. Sound like a human mentor.

### BLOG POST DRAFT ###
\`\`\`

## Workshop conclusion

This exercise shows the iterative refinement process. Starting from a bare-bones V0, each cycle identified specific weaknesses by analyzing the outputs against the goal and the five pillars. Targeted refinements to context, instructions and constraints progressively improved the prompt, leading to a V3 far more likely to generate high-quality, relevant, well-structured blog post drafts that meet every requirement. This watchmaker's patience is key to developing truly dependable prompts.

## The pursuit of prompt perfection

Designing a prompt is often just the beginning. Achieving consistently high-quality results means embracing the ongoing processes of optimization and debugging. Like maintaining any precision instrument, keeping your prompts reliable takes methodical attention.

- The **watchmaker's patience of iterative refinement** gives the fundamental cycle for improvement: test the performance, diagnose the flaws by tracing them back to the prompt's core components, make targeted adjustments and observe the results again. This gradual, evidence-based approach is essential for fixing errors and raising quality.
- For more objective comparisons between specific design choices, the **double-blind taste test of A/B testing** offers a structured, data-driven method to find out which prompt variations produce measurably better outcomes against defined goals.
- And when prompts inevitably fail or underperform, knowing how to **troubleshoot common failures**, diagnosing the issue systematically like tracing faulty wiring back to weaknesses in context, instructions, examples, constraints or delimiters, allows effective repair.

By integrating these refinement and debugging techniques into your workflow, you move beyond simply writing prompts to actively **engineering** them for optimal performance, reliability and safety. This disciplined approach to continuous improvement is what distinguishes casual use from the true craft of mastering prompt engineering.

In one line: the cyclical watchmaker's patience of iterative refinement for gradual improvement, the objective comparison of A/B testing (the double-blind taste test), and systematic troubleshooting for diagnosing common failures (tracing faulty wiring).

**Try this:** take one prompt through one full cycle today: test it on five inputs, name the worst flaw, change one thing, test again, and write down what changed.`,
  },
];

export const OPTIMIZE_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "what-a-test-set-includes",
    kind: "choice",
    title: "A good test set",
    promptText: "What should the test inputs of a refinement cycle include?",
    public: {
      options: [
        "One easy case, run several times",
        "A varied set: typical scenarios, edge cases and challenging inputs, plus adversarial ones where relevant",
        "Only inputs that the prompt already handles well",
        "As many random words as possible",
      ],
    },
    answer: { correct: 1 },
    explanation: "A single easy case proves little. Test typical scenarios, edge cases such as very short or very long texts, challenging or ambiguous inputs and, where relevant, adversarial ones.",
  },
  {
    slug: "name-the-problem",
    kind: "fill",
    title: "Name the failure",
    promptText: "Match each symptom to the common failure it describes.",
    public: {
      template:
        "The output wanders into unrelated areas: {{a}}\nParagraphs appear where you asked for bullet points: {{b}}\nThe system confidently states things that are simply wrong: {{c}}\nThe voice sounds robotic instead of the persona you wanted: {{d}}\nThe prompt works well sometimes and poorly at other times: {{e}}",
      blanks: [
        { id: "a", choices: ["Irrelevant output", "Incorrect formatting", "Factual errors", "Undesired tone", "Inconsistent quality"] },
        { id: "b", choices: ["Irrelevant output", "Incorrect formatting", "Factual errors", "Undesired tone", "Inconsistent quality"] },
        { id: "c", choices: ["Irrelevant output", "Incorrect formatting", "Factual errors", "Undesired tone", "Inconsistent quality"] },
        { id: "d", choices: ["Irrelevant output", "Incorrect formatting", "Factual errors", "Undesired tone", "Inconsistent quality"] },
        { id: "e", choices: ["Irrelevant output", "Incorrect formatting", "Factual errors", "Undesired tone", "Inconsistent quality"] },
      ],
    },
    answer: { correct: { a: "Irrelevant output", b: "Incorrect formatting", c: "Factual errors", d: "Undesired tone", e: "Inconsistent quality" } },
    explanation: "Each symptom points to a different family of causes: weak context or constraints for off-topic output, missing examples for wrong format, missing grounding for hallucination, missing persona or style examples for tone, and ambiguity or randomness for inconsistency.",
  },
  {
    slug: "why-injection-succeeded",
    kind: "choice",
    title: "When the injection worked",
    promptText: "A hidden command in the user's text made the system ignore its instructions. Which two weaknesses does the book name as the likely causes?",
    public: {
      options: [
        "Too many examples and too few headings",
        "A temperature that is too low",
        "A prompt that is too polite",
        "Weak or missing delimiters, and missing instructions to disregard commands inside the fenced user input",
      ],
    },
    answer: { correct: 3 },
    explanation: "The wiring to check is pillar 5 (delimiters separating trusted from untrusted input) and the explicit handling instruction telling the system not to execute commands found inside that fenced area.",
  },
  {
    slug: "order-the-ab-test",
    kind: "order",
    title: "Order the A/B test",
    promptText: "Put the seven steps of an A/B test of two prompt variants in the order the book gives.",
    public: {
      blocks: [
        { id: "analyze", text: "Analyze the results objectively with the predefined metric" },
        { id: "data", text: "Prepare the same diverse test inputs for both variants" },
        { id: "implement", text: "Implement the winner, or iterate" },
        { id: "isolate", text: "Isolate ONE variable" },
        { id: "run", text: "Run the controlled test under identical conditions" },
        { id: "metric", text: "Define a measurable success metric" },
        { id: "variants", text: "Create variant A (control) and variant B (challenger)" },
      ],
    },
    answer: { order: ["isolate", "variants", "metric", "data", "run", "analyze", "implement"] },
    explanation: "Decide the single variable, build the control and the challenger, define the metric before you look at results, prepare the same test data, run both, analyze with the predefined metric, and then adopt or iterate.",
  },
  {
    slug: "the-cardinal-rule",
    kind: "choice",
    title: "The cardinal rule of A/B testing",
    promptText: "What is the cardinal rule of an A/B test?",
    public: {
      options: [
        "Change as many things as possible in variant B",
        "Test with only two inputs",
        "Change only one specific element between the two prompts",
        "Let the author of the prompt judge the winner",
      ],
    },
    answer: { correct: 2 },
    explanation: "If you change several things you cannot know which change caused the difference. Variant B must be identical to A in every respect except the single variable under test.",
  },
  {
    slug: "spot-the-weak-metrics",
    kind: "spot",
    title: "Which metrics are not objective enough?",
    promptText: "An A/B test needs a measurable success metric. Select every metric that is not objective enough.",
    public: {
      pickPrompt: "Select every weak metric",
      hitLabel: "Not objective enough",
      missLabel: "Measurable",
      segments: [
        { id: "m1", text: "The percentage of extractions that are correct" },
        { id: "m2", text: "Blinded ratings of clarity from 1 to 5, averaged" },
        { id: "m3", text: "It feels clearer to me" },
        { id: "m4", text: "Whether the generated code passes the tests" },
        { id: "m5", text: "The author's unblinded impression of which output sounds nicer" },
      ],
    },
    answer: { flawed: ["m3", "m5"] },
    explanation: "Gut feeling can be deceptive, and an unblinded judgement is influenced by knowing which prompt wrote which output. Percentages, blinded ratings and tests that pass or fail are measurable.",
  },
  {
    slug: "order-the-debugging-mindset",
    kind: "order",
    title: "Order the debugging steps",
    promptText: "Put the five steps of the debugging mindset in order.",
    public: {
      blocks: [
        { id: "targeted", text: "Make targeted changes to the suspected weak component" },
        { id: "reproduce", text: "Reproduce the error with a specific input" },
        { id: "test", text: "Test again, checking that the fix did not create new problems" },
        { id: "analyze", text: "Analyze against the pillars to hypothesize which is weak" },
        { id: "isolate", text: "Isolate the problem by simplifying the prompt" },
      ],
    },
    answer: { order: ["reproduce", "isolate", "analyze", "targeted", "test"] },
    explanation: "Reproduce it reliably, isolate the faulty component by removing parts, analyze against the pillars, change only what you suspect, and test again.",
  },
  {
    slug: "one-change-at-a-time",
    kind: "choice",
    title: "How to refine",
    promptText: "Your analysis shows two flaws in a prompt. What does the book advise for the refinement step?",
    public: {
      options: [
        "Make targeted, incremental changes to the pillar you diagnosed, one element or a small related group at a time, and note what you changed and why",
        "Rewrite the whole prompt from scratch",
        "Change everything at once to save time",
        "Keep the prompt and blame the model",
      ],
    },
    answer: { correct: 0 },
    explanation: "Resist the urge to rewrite everything at random. Small, targeted changes let you isolate the effect in the next test, and short version notes keep your reasoning traceable.",
  },
  {
    slug: "what-v1-added",
    kind: "choice",
    title: "The workshop's first cycle",
    promptText: "In the blog workshop, V0's outputs were unstructured, tonally inconsistent and of variable length. What did the diagnosis add in V1?",
    public: {
      options: [
        "Delimiters against prompt injection",
        "A chain-of-thought instruction",
        "Context (role, audience, tone), structured instructions and a length constraint",
        "A large set of few-shot blog posts",
      ],
    },
    answer: { correct: 2 },
    explanation: "The diagnosis was missing core components: context, specific instructions and a constraint on length. V1 added exactly those pillars. Later cycles then targeted actionability, examples and voice.",
  },
  {
    slug: "repair-v0-into-v1",
    kind: "repair",
    title: "Refine V0 into V1",
    promptText: "Apply the workshop's first cycle: add role and audience, a tone, a structure for the post, and a length constraint, under headings.",
    public: {
      starter: "Write a blog post about [Topic].",
      hint: "Put the role, audience and tone under a context heading, list the parts of the post in the instruction, and add a word-count constraint.",
    },
    answer: {
      criteria: [
        { id: "role", label: "Gives a role or an audience", weight: 2, anyOf: ["\\b(you are|act as|role:)\\b", "\\baudience\\b"], hint: "Say who the writer is and who the readers are." },
        { id: "tone", label: "Sets a tone", weight: 1, anyOf: ["\\b(tone|encouraging|practical|friendly|informal|empathetic)\\b"], hint: "Name the tone, for example encouraging and practical." },
        { id: "structure", label: "Lists the structure of the post", weight: 2, anyOf: ["\\b(introduction|intro)\\b[\\s\\S]*\\bconclusion\\b"], hint: "Name the parts: an introduction, the main tips and a conclusion." },
        { id: "tips", label: "Says how many tips", weight: 1, anyOf: ["\\b(3-5|3 to 5|three to five|\\d+)\\s*(main\\s+)?(points|tips)\\b"], hint: "Ask for a number of tips, for example 3 to 5." },
        { id: "length", label: "Constrains the length", weight: 2, anyOf: ["\\b\\d{3}\\s*words?\\b", "\\b(approx\\w*|about|around|target|maximum|under)\\b[^.\\n]{0,20}\\b\\d{3}\\b"], hint: "Add a word count such as about 500 words." },
        { id: "delimiters", label: "Separates the parts with delimiters", weight: 1, anyOf: ["###", "<[a-z_]+>"], hint: "Use headings such as ### CONTEXT ### and ### INSTRUCTION ###." },
      ],
      model:
        "### CONTEXT ###\nRole: You are a helpful productivity coach writing a blog post.\nAudience: Busy young professionals looking for practical advice.\nTone: Encouraging, practical and actionable.\n\n### INSTRUCTION ###\nWrite a blog post draft on the topic \"[Topic]\". Include:\n1. An engaging introduction.\n2. 3-5 main tips.\n3. A motivating conclusion.\n\n### CONSTRAINTS ###\n- Target word count: approx. 500 words.\n- Avoid jargon and keep the tips concrete.",
    },
    explanation: "V1 adds the pillars that V0 lacked: context (role, audience, tone), specific instructions for the structure, and a constraint on length, separated with delimiters. The next cycles then refine actionability and voice.",
    samples: {
      good: [
        "You are a productivity coach. Audience: busy young professionals. Write a friendly blog post with an introduction, 3 to 5 tips and a conclusion, about 500 words.",
      ],
      bad: ["Write a good blog post about productivity for me please.", "### TASK ###\nWrite a blog post about time management."],
    },
  },
];

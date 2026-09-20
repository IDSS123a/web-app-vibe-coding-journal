/**
 * Chapter "The Prompt Engineer's Craft" (book chapter 1, "Mindset and Workflow"): 4 lessons and 8 exercises,
 * condensed from the Director's book, which is the only source. No em dashes (writing rule, PDL-057).
 * `samples` on repair exercises exist only for the content test; they are never stored.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const CRAFT_LESSONS: LessonContent[] = [
  {
    slug: "casual-user-to-deliberate-designer",
    title: "From casual user to deliberate designer",
    minutes: 5,
    body: `Almost everyone starts the same way. You ask a question, the system answers fluently, and it feels almost too easy. Then comes the other side: the reply that misses the point, the output that ignores half of your request, the complex task that never works twice in a row.

The gap between those hit-or-miss results and consistently good ones is rarely the model. It is the **method** of the person guiding it. Prompt engineering is a craft, and a craft needs two things: a mindset and a workflow. This chapter gives you both.

## Two ways to use the same tool

- **The casual user** treats the system like a search engine or a chat partner. They ask a natural question, sometimes an ambiguous one, and accept the answer largely as given. If it fails, they rephrase a little. The interaction is reactive.
- **The deliberate designer** treats the system as a powerful but **literal-minded tool**. It does not truly understand your intent; it follows the patterns and structure of what you write. So the designer does not just ask, they design: the context, the precision of the instructions, the examples, the limits and the structure that keeps it all apart. They expect misreadings and build safeguards. The interaction is proactive.

## The blueprint idea

Think of a napkin sketch next to an architect's blueprint. The sketch conveys an idea. The blueprint gives the exact instructions to build something reliably and to specification. A good prompt is a blueprint for a piece of language work.

## What changes in practice

1. You decide what you want **before** you type.
2. You pick the parts your prompt needs (the five pillars from the next chapter).
3. You test it on more than one input.
4. You treat the first version as a draft, not a verdict.

**Try this:** take the last prompt you sent and label it honestly. Was it a napkin sketch or a blueprint? Write down one part you would add to make it a blueprint.`,
  },
  {
    slug: "the-iterative-heartbeat",
    title: "The iterative heartbeat: draft, test, analyze, refine",
    minutes: 5,
    body: `No complex design is perfect on its first try. An architect redraws plans, a writer revises drafts, an engineer tests prototypes. Prompts are no different, and probably need it more: language is nuanced, and the inner workings of these models are not fully visible to you. For any non-trivial task you usually cannot predict the exact output in advance.

So the core of the workflow is a loop.

## The five steps

1. **Draft.** Write the best first version you can, using what you know about the five pillars. This is your V1, a prototype.
2. **Test.** Run it on realistic and varied inputs. One easy case proves very little. Watch what comes back.
3. **Analyze.** Compare the result with your goal. What worked? What failed? Most important: **why**? Was an instruction ambiguous, was context missing, did an example mislead?
4. **Refine.** Make a targeted change that addresses the flaw you diagnosed. Do not shuffle words at random: adjust the specific pillar that caused the problem. That gives you V2.
5. **Repeat.** Test V2, analyze again, refine again (V3, V4 and so on) until it does the job.

## Iteration is the process, not a sign of failure

Expecting a perfect first prompt for a real task is unrealistic. Plan time for testing and refinement, and treat every prompt as a **hypothesis** to be tested. This turns prompting from a guessing game into a system of improvement based on what you observe.

## A tiny example

- V1: "Summarize this report."
- Test: one run gives two pages, another gives a single line.
- Analyze: the length is unspecified, and so is the audience.
- V2: "Summarize this report in five bullet points for a busy manager."
- Test again on three different reports, and refine further only if something still breaks.

**Try this:** pick a prompt that gave you an uneven result and run one full loop. Write down what you changed and why.`,
  },
  {
    slug: "define-success-and-plan-on-paper",
    title: "Define success first, then plan on paper",
    minutes: 6,
    body: `A watchmaker knows exactly what they are building before they touch a gear. An architect understands the purpose of the building before drawing a line. The most important step in prompting also happens **before you write a single word of the prompt**: defining your goal with absolute clarity.

## A goal you can check

Compare these two.

- "Write something about marketing." A poor goal: it says nothing about the type, size, audience or purpose of the output.
- "Generate three distinct marketing email subject lines for small business owners, highlighting a time-saving benefit of our software, in an urgent but professional tone." A good goal.

The second is **specific** (type, quantity, audience, message, tone), **checkable** (you can count the lines and judge the tone), **achievable** for a language model, and **relevant** to a real need.

## Five questions to answer before drafting

- What is the exact task? (Summarize, translate, analyze, generate, classify, extract or rewrite?)
- What output format do you want? (Paragraph, list, table, JSON, specific tags?)
- Who is the output for? (This drives tone, complexity and style.)
- What must be included or left out?
- What are the criteria for success? (Accuracy, brevity, completeness, tone, format?)

These answers are also the benchmark you will test against in the loop from the previous lesson.

## The paper and pencil stage

For anything beyond a simple request, sketch the prompt before writing it, on paper, in a text editor or on a whiteboard. Ask:

- **Which pillars do I need?** Background knowledge means context. A multi-step task means detailed, sequenced instructions. A very specific format or style means examples. Limits on length, topic or tone mean constraints. Mixing parts or including user input means delimiters.
- **What goes where?** Which headings, which facts in the context, which verbs in the instructions, which input and output pairs as examples, which limits are non-negotiable.
- **What is the logical order?** Does step B depend on the result of step A?
- **How will I present context and examples?** Pasted text, a described persona, crafted pairs, and how they will be fenced off.

A few minutes of sketching saves a lot of time in refinement, and gives you a much stronger V1.

**Try this:** answer the five questions for a task you actually need to do this week, then sketch the sections of the prompt as a short list of headings.`,
  },
  {
    slug: "think-like-an-engineer",
    title: "Think like an engineer, work like a scientist",
    minutes: 6,
    body: `Good engineers do not design only for ideal conditions. They think about stress, wear, mistakes and misuse, and they build in safety margins. A skilled prompt writer does the same, with a slightly skeptical eye: language is ambiguous, and the model does not truly grasp your intent the way a colleague would.

## Design defensively

- **Find the ambiguous words.** "Summarize briefly": how brief? "Use a friendly tone": friendly by whose standard? Replace vague terms with exact ones, or pin them down with a definition or an example.
- **Think about edge cases.** How does the prompt behave with a very short or very long text, a typo-filled query, a record with missing fields? Say what should happen.
- **Read it literally.** Imagine a very knowledgeable but completely literal assistant. Where are the loopholes? If you ask for arguments "for and against", make sure the model does not start arguing with itself.
- **Plan for missing information.** If the model may not have a fact, tell it how to behave: "If the date is not mentioned, write 'Date not specified'." That is far better than a confident guess or an invented answer.
- **Assume outside input can be hostile.** If your prompt includes text from users, someone may try to smuggle instructions into it. Build defenses from the start (the Intermediate level covers this in depth).

## Experimentation: your personal workshop

Every prompt you write is an experiment.

1. **Hypothesis:** "Adding one example will make the format more consistent."
2. **Design:** create the variation that tests exactly that.
3. **Run:** use appropriate inputs.
4. **Observe and analyze:** did the result support the hypothesis, and why?
5. **Learn and adapt:** carry the lesson into the next version.

Change **one** thing at a time, so you know what caused the difference. Try different phrasings, different numbers of examples, different limits, different delimiters, and combinations.

## Keep your own notebook

Write down what works for which kind of task and model. Over time you build a personal library of patterns and templates, and that library is where speed comes from. The best prompt writers are curious, systematic and willing to learn from every result.

**Try this:** take one prompt and list three ambiguous words or missing-information cases in it. Rewrite it so each one is handled.`,
  },
];

export const CRAFT_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "designer-or-casual",
    kind: "choice",
    title: "Which one is the designer?",
    promptText: "Which description fits the deliberate designer rather than the casual user?",
    public: {
      options: [
        "Asks a natural question and accepts the first answer",
        "Treats the system as a powerful but literal tool and designs each part of the prompt",
        "Rephrases only when the answer comes back empty",
        "Copies prompts found online without changing them",
      ],
    },
    answer: { correct: 1 },
    explanation: "The designer expects literal reading, so they design context, instructions, examples, constraints and structure on purpose and anticipate misreadings. The casual user reacts to whatever comes back.",
  },
  {
    slug: "order-the-loop",
    kind: "order",
    title: "Put the loop in order",
    promptText: "These are the steps of the prompting workflow, shuffled. Put them in the order of the cycle.",
    public: {
      blocks: [
        { id: "refine", text: "Refine: make a targeted change to the pillar that caused the flaw, giving V2." },
        { id: "draft", text: "Draft: write the best first version (V1) using the five pillars." },
        { id: "repeat", text: "Repeat: test the new version and go around again until it does the job." },
        { id: "analyze", text: "Analyze: compare the result with the goal and diagnose why it failed." },
        { id: "test", text: "Test: run it on realistic and varied inputs and observe." },
      ],
    },
    answer: { order: ["draft", "test", "analyze", "refine", "repeat"] },
    explanation: "Draft, test, analyze, refine, repeat. Diagnosing the reason (analyze) comes before changing anything (refine), otherwise you are only shuffling words.",
  },
  {
    slug: "spot-the-vague-goals",
    kind: "spot",
    title: "Spot the vague goals",
    promptText: "Some of these goal statements are too vague to design a prompt from. Select every vague one.",
    public: {
      pickPrompt: "Select every vague goal",
      hitLabel: "Vague",
      missLabel: "Clear",
      segments: [
        { id: "g1", text: "Write something about marketing." },
        { id: "g2", text: "Generate three distinct marketing email subject lines for small business owners, highlighting a time-saving benefit, in an urgent but professional tone." },
        { id: "g3", text: "Make a good summary." },
        { id: "g4", text: "Summarize this report in five bullet points for a busy manager, in plain language." },
        { id: "g5", text: "Help me with my email." },
      ],
    },
    answer: { flawed: ["g1", "g3", "g5"] },
    explanation: "A good goal names the type, quantity, audience, message and tone, so you can check the result. \"Something about marketing\", \"a good summary\" and \"help with my email\" define none of that.",
  },
  {
    slug: "goal-checklist",
    kind: "fill",
    title: "Complete the goal checklist",
    promptText: "Before drafting, answer five questions. Choose the word that completes each one.",
    public: {
      template:
        "What is the exact {{a}}?\nWhat output {{b}} do I want?\nWho is the {{c}} for the output?\nWhat must be included or {{d}}?\nWhat are the {{e}} for success?",
      blanks: [
        { id: "a", choices: ["task", "model", "budget", "deadline"] },
        { id: "b", choices: ["format", "language", "price", "length of time"] },
        { id: "c", choices: ["audience", "author", "editor", "vendor"] },
        { id: "d", choices: ["excluded", "repeated", "translated", "billed"] },
        { id: "e", choices: ["criteria", "rumors", "holidays", "passwords"] },
      ],
    },
    answer: { correct: { a: "task", b: "format", c: "audience", d: "excluded", e: "criteria" } },
    explanation: "The five questions are the exact task, the output format, the target audience, what to include or exclude, and the criteria for success. The last one is the benchmark you test against.",
  },
  {
    slug: "fix-the-ambiguous-word",
    kind: "choice",
    title: "Remove the ambiguity",
    promptText: "The instruction \"Summarize briefly\" is ambiguous, because nobody knows how brief. Which rewrite removes the ambiguity best?",
    public: {
      options: [
        "Summarize very briefly.",
        "Summarize, but keep it short.",
        "Summarize in exactly three bullet points of no more than 15 words each.",
        "Give a short summary please.",
      ],
    },
    answer: { correct: 2 },
    explanation: "Replace a vague word with something you can measure: a count of bullet points and a word limit. \"Very briefly\", \"short\" and \"keep it short\" only restate the same vagueness.",
  },
  {
    slug: "plan-for-missing-info",
    kind: "choice",
    title: "Plan for missing information",
    promptText: "Your prompt extracts the meeting date from texts, but some texts contain no date. What should the prompt add?",
    public: {
      options: [
        "Nothing, the model will work it out",
        "Always give the most likely date",
        "If the date is not mentioned, write \"Date not specified\" instead of guessing.",
        "Skip any text that has no date, without saying so",
      ],
    },
    answer: { correct: 2 },
    explanation: "Tell the model how to behave when information is missing. Otherwise it may guess with confidence or invent an answer, which is worse than an honest \"not specified\".",
  },
  {
    slug: "repair-the-vague-goal",
    kind: "repair",
    title: "Turn a vague goal into a precise prompt",
    promptText: "Rewrite this vague goal so that it names the task, the quantity, the audience, the key message and the tone.",
    public: { starter: "Write something about marketing.", hint: "What exactly should be produced, how many, for whom, saying what, and in what voice?" },
    answer: {
      criteria: [
        { id: "task", label: "Uses a clear task verb", weight: 1, anyOf: ["\\b(write|generate|create|draft|list|compose)\\b"], hint: "Start with a verb such as Generate or Write." },
        { id: "quantity", label: "Says how many and what kind of item", weight: 2, anyOf: ["\\b(one|two|three|four|five|six|\\d+)\\b[^.]{0,40}\\b(subject lines?|headlines?|emails?|slogans?|posts?|ideas?|taglines?|options?|versions?|variants?)\\b"], hint: "Name a number and a type, for example three email subject lines." },
        { id: "audience", label: "Names the audience", weight: 2, anyOf: ["\\b(for|targeting|aimed at|audience)\\b[^.]{0,60}\\b(owners?|customers?|managers?|beginners?|students?|professionals?|users?|readers?|seniors?|parents?)\\b"], hint: "Say who it is for, for example small business owners." },
        { id: "message", label: "States the key message", weight: 2, anyOf: ["\\b(highlight\\w*|focus\\w*|emphasi[sz]\\w*|benefit\\w*|key message|selling point\\w*)\\b"], hint: "Say what it must stress, for example a time-saving benefit." },
        { id: "tone", label: "Sets the tone", weight: 1, anyOf: ["\\b(tone|urgent|professional|friendly|formal|playful|warm|serious)\\b"], hint: "Describe the voice, for example urgent but professional." },
      ],
      model: "Generate three distinct marketing email subject lines targeting small business owners, highlighting a time-saving benefit of our software, in an urgent but professional tone.",
    },
    explanation: "A precise goal answers the five questions: task, format and quantity, audience, message and tone. Each detail removes a way the model could go wrong and gives you something to check.",
    samples: {
      good: [
        "Generate three distinct marketing email subject lines targeting small business owners, highlighting a time-saving benefit of our software, in an urgent but professional tone.",
        "Write five short social media posts for busy parents, focusing on how our app saves time, in a warm and friendly tone.",
      ],
      bad: ["Write a marketing post please.", "Write something about marketing for everyone, make it good."],
    },
  },
  {
    slug: "test-one-change",
    kind: "choice",
    title: "Run a proper experiment",
    promptText: "You believe that adding an example would make the output format more consistent. What is the best next step?",
    public: {
      options: [
        "Rewrite the whole prompt from scratch",
        "Add five random examples at once",
        "Trust the belief and stop testing",
        "Add that one example, run the same test inputs again and compare the results",
      ],
    },
    answer: { correct: 3 },
    explanation: "Change one thing at a time and re-run the same inputs, so any difference can be traced to that change. That is what turns a hunch into a tested hypothesis.",
  },
];

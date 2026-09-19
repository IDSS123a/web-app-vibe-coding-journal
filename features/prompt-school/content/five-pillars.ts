/**
 * Chapter "The Five Pillars" (book chapter 2, "Anatomy of an Effective Prompt"): 6 lessons and 8
 * exercises. Authored from the Director's book; the book is the only source. Lesson text is condensed
 * and in plain language. No em dashes (writing rule, PDL-057). `samples` on repair exercises exist only
 * for the content test that proves each rubric accepts a good rewrite and rejects a bad one; they are
 * never stored.
 */
import type { ExerciseContent } from "../domain";

export interface LessonContent {
  slug: string;
  title: string;
  minutes: number;
  body: string;
}

export type ExerciseWithSamples = ExerciseContent & { samples?: { good: string[]; bad: string[] } };

export const FIVE_PILLARS_LESSONS: LessonContent[] = [
  {
    slug: "why-prompts-have-an-anatomy",
    title: "Why a prompt has an anatomy",
    minutes: 5,
    body: `Picture an old calculating engine or an elaborate automaton clock. Looking at the finished machine tells you very little. To understand how it works you take it apart piece by piece: each gear, each lever, each connection. A pile of parts does no useful work. The structure and the interplay of the parts is what makes it function.

Talking to a language system is similar. The exchange feels like conversation, but throwing words at the system is like tossing parts into a box. These systems respond to the patterns and structure of the instructions you give them, so for anything beyond a simple question you have to build the prompt with the care of an engineer.

## The five pillars

Every effective prompt is made of five parts:

1. **Context**: the background and framing the model needs.
2. **Instructions**: the specific commands that drive the action.
3. **Examples**: demonstrations that show instead of only telling.
4. **Constraints**: the limits and things to avoid.
5. **Delimiters**: markers that define structure and separate the parts.

## What this gives you

Knowing the pillars does two things. It lets you **diagnose** a prompt that fails, because you can ask which pillar is weak or missing. And it gives you **building blocks** to construct a prompt that turns your intent into the result you want, instead of hoping for a lucky answer.

In the next five lessons you meet each pillar through a simple analogy, then you practise them together.

**Try this:** take a prompt you wrote recently and name which of the five pillars it contained. Most casual prompts contain only one.`,
  },
  {
    slug: "pillar-1-context",
    title: "Pillar 1: Context, setting the stage",
    minutes: 6,
    body: `Imagine stepping into a conversation halfway through. People refer to earlier points and people you do not know. You hear the words but the meaning is broken. You are missing **context**, the background that turns noise into signal.

Context is everything you provide before the main command: the background, circumstances and viewpoint the model needs to read your request correctly. The model has broad general knowledge, but it does not know your situation, your goal or the perspective you need. Context is like tuning a radio: out of all the possible answers in its training, it tunes the model to the one you care about.

A prompt with no context forces the model to fill the gaps with statistical averages of its training data, and those averages rarely match what you need.

## Types of context

- **Role or persona.** "You are a helpful librarian." or "Act as a skeptical historian." A role guides tone, vocabulary and focus. "Explain photosynthesis" may give a dry answer. "Explain photosynthesis as if you were teaching enthusiastic fifth graders, using simple analogies" changes the whole answer.
- **Source material.** The text or data the model must work on. "Based only on the following excerpt: \`<excerpt>...</excerpt>\`, answer the question." This keeps the answer tied to your document instead of general knowledge.
- **Goal and audience.** Why you are asking and who the output is for. "Describe this product's features" is weaker than "Describe this product's features for a brochure aimed at non-technical senior citizens, focusing on ease of use and safety."
- **Relevant facts.** Deadlines, budget, location: "The deadline is next Friday." "Assume a budget of 500 euros."
- **Previous turns.** In a conversation, what was said before is part of the context.

## Setting the stage well

Before writing the instruction, ask: what does the model need to know to understand this precisely, and what am I assuming it already knows? Make the hidden context explicit. Give the role, the material, the goal and the facts up front, so that everything after it acts on a clear signal.

**Try this:** rewrite "Summarize this article" three times, each time adding one different kind of context, and compare the results.`,
  },
  {
    slug: "pillar-2-instructions",
    title: "Pillar 2: Instructions, the control panel",
    minutes: 6,
    body: `Once the stage is set, you direct the performance. **Instructions** are the active commands: the verbs of the prompt, the knobs and levers on a control panel. On a printing press, pulling the wrong lever smudges the page. Vague instructions are like pressing buttons at random. You may get a useful result by chance, but usually you get errors or something unexpected.

## What makes an instruction effective

- **Start with a clear verb.** Use direct commands: List, Summarize, Explain, Generate, Translate, Compare, Extract, Rewrite. Avoid passive phrasing such as "Information needed on...".
- **Be specific and unambiguous.** Leave little room for interpretation.
  - Vague: "Write about Bosnia."
  - Specific: "List five major historical sites in Mostar from the Ottoman period. Give a one-sentence description for each."
- **Break complex tasks into steps.** "Summarize this report, extract the recommendations, list the authors and suggest a title" is confusing in one breath. Sequence it: first summarize, then extract, then identify, then suggest. Numbered steps or words like first, then, finally keep the model on track.
- **Specify parameters.** Say what criteria to use, the length or the format (constraints and examples reinforce this).

## Four families of levers

- **Extraction:** Extract, List, Identify. Pull specific data out.
- **Transformation:** Translate, Summarize, Rewrite, Reformat. Change the form of the input.
- **Generation:** Write, Create, Generate, Brainstorm. Produce something new.
- **Analysis:** Compare, Analyze, Evaluate, Explain. Reason about the material.

Choosing the right family, and stating it precisely, is what moves you from simple requests to directing real work reliably.

**Try this:** take a vague request of your own and rewrite it with one clear verb, one specific object and a numbered sequence.`,
  },
  {
    slug: "pillar-3-examples",
    title: "Pillar 3: Examples, learning by demonstration",
    minutes: 6,
    body: `Try to learn sculpting or a musical instrument only from written descriptions. You may grasp the theory, but the feel of the clay and the exact fingering are very hard to get without watching a master and copying. That is **apprenticeship**, and **examples** bring the same idea into a prompt.

Instructions tell the model what to do. Examples show exactly **how** you want it done. This is the idea behind few-shot prompting, and it matters most when the format, style or reasoning pattern is subtle or hard to describe.

## Why demonstration works

Language models are pattern machines. When you give a clear input and output pair, or several pairs, they see a strong pattern: when the input looks like this, the output should look like that. For structured formats such as tables, JSON or tagging, for a specific voice, or for a specific transformation such as classifying sentiment, matching a shown pattern is usually more reliable than a long abstract description.

## What examples are good for

- **Format.** The clearest way to get a precise structure is to show it. The model copies the shape.
- **Style and tone.** A sample of the voice you want beats adjectives.
- **Patterns.** Classification, simple reasoning and text transformations become obvious from a pair.
- **Ambiguity.** "Summarize briefly" could mean one sentence or one paragraph. An example settles it.

## The gold star rule

An apprentice copies the master's flaws as faithfully as the strengths. If your examples are inaccurate, inconsistent, badly formatted or biased, the model will repeat those errors. Keep your examples:

- **Accurate:** facts and logic are correct.
- **Consistent:** every example follows exactly the same format and style.
- **Relevant:** close to the real task and input.
- **Clear:** easy to understand on their own.

**Try this:** ask for a product description in a very particular voice, first with only instructions and then with one short example. Compare how close each gets.`,
  },
  {
    slug: "pillar-4-constraints",
    title: "Pillar 4: Constraints, guardrails and speed limits",
    minutes: 6,
    body: `Driving a powerful car on a narrow cliff road feels free, until you realize that guardrails and speed limits are what make the trip safe. **Constraints** play that role in a prompt. Language systems are highly generative: given an instruction they can produce a lot of text, wander into tangents or pick a different tone. Instructions say what to do. Constraints say what to avoid and set the limits within which to do it.

Think of building codes. The blueprints are the instructions. The codes set maximum height and required safety features. They do not design the building, but they make sure the result is safe and fits the conditions.

## Why boundaries are needed

Without constraints, even a clear instruction can produce far more text than you wanted, stray off topic, use an unsuitable tone, include things you want left out, or invent information when the model does not know.

## Types of constraints

- **Length limits:** "under 150 words", "three bullet points", "a single paragraph".
- **Format rules:** "valid JSON only", "no headings", "asterisks for list items".
- **Content exclusions:** "do not mention brand names", "avoid technical jargon", "no financial advice".
- **Style and tone:** "neutral and objective", "third person only", "understandable to a 10th grader".
- **Negative instructions:** "do not invent facts", "do not ask follow-up questions", "no closing summary".

Put constraints inside the instruction block or in their own \`### CONSTRAINTS ###\` section, and state them clearly.

## The balance

Compare "Describe the benefits of using our software" with "Describe the top 3 benefits of our software for small business owners. Focus on time saving and cost. Under 200 words. Avoid jargon. Encouraging tone." The second is far easier to get right.

Too many or conflicting constraints make a useful answer impossible. Too few leave it unfocused. Start with the essential ones, test the output and adjust for the problem you actually see.

**Try this:** take one of your own prompts and add exactly one length limit, one exclusion and one tone rule, then check what changed.`,
  },
  {
    slug: "pillar-5-delimiters-and-synergy",
    title: "Pillar 5: Delimiters, and putting the pillars together",
    minutes: 8,
    body: `A farmer keeps cattle, sheep and horses in different zones with fences so they do not mix or wander. **Delimiters** are the fences of a prompt: special characters, symbols or tags that mark clear limits between Context, Instructions, Examples, Constraints and above all any outside input such as a user's question or a source text.

Without them the model can mistake an instruction for part of the text to summarize, or treat an example's output as a new command. Compare:

Act as a helpful librarian. Find books related to Bosnian history. The user asked: Tell me about books on Bosnian history, focus on the medieval period.

Is "focus on the medieval period" the user's words or a new instruction? With fences the answer is clear:

\`\`\`
### ROLE ###
Act as a helpful librarian specializing in Balkan history.
### INSTRUCTION ###
Answer the user's query below based on typical library resources.
### USER QUERY ###
<user_query>
Tell me about books on Bosnian history, focus on the medieval period.
</user_query>
### RESPONSE ###
\`\`\`

## Choosing delimiters

Pick markers that are consistent and unlikely to appear inside your content: triple hashes such as \`### SECTION ###\`, XML-like tags such as \`<user_input>...</user_input>\`, or Markdown fenced blocks. Tags and titled hashes are excellent for complex prompts.

Clear fences reduce ambiguity, improve accuracy, make outputs more predictable and improve **security**: separating untrusted user input from your trusted instructions is the cornerstone of defending against prompt injection, which the Intermediate level covers.

## The pillars working together

Context sets the stage. Instructions direct the action. Examples show the format. Constraints set the limits. Delimiters hold it all together. They rarely work alone. Real prompt engineering is choosing, combining and refining them, then using them as a checklist to find out why an output failed.

## The repair workshop

The book repairs the vague prompt "Tell me about travel in Bosnia and Herzegovina" in five steps: add **context** (two adults, 14 days, September, mid-range budget, interests, rental car), sharpen the **instruction** (suggest a 14-day driving itinerary around named regions), add an **example** of one region formatted exactly as wanted, add **constraints** (follow the format, brief justifications, no hotel names, 600 to 800 words) and assemble it with **delimiters**. A vague sentence becomes a precise specification. You will do this yourself in the practice.`,
  },
];

export const FIVE_PILLARS_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "which-pillar-role",
    kind: "choice",
    title: "Name the pillar",
    promptText: "A prompt begins: \"Act as a skeptical historian.\" Which pillar does this sentence belong to?",
    public: { options: ["Constraints", "Context", "Delimiters", "Examples"] },
    answer: { correct: 1 },
    explanation: "Assigning a role is a form of context. It frames who the model should be, which shapes its tone, vocabulary and focus before any instruction is given.",
  },
  {
    slug: "strongest-instruction",
    kind: "choice",
    title: "Pick the strongest instruction",
    promptText: "Which instruction is the most effective?",
    public: {
      options: [
        "Some information about Mostar, please.",
        "Tell me about Mostar.",
        "List five historic sites in Mostar from the Ottoman period and give a one-sentence description of each.",
        "Mostar history, make it good.",
      ],
    },
    answer: { correct: 2 },
    explanation: "It starts with a clear verb, names the object and the period, sets a count and states the format of each item. The others leave the model to guess what you want.",
  },
  {
    slug: "complete-the-sections",
    kind: "fill",
    title: "Label the sections",
    promptText: "Complete the section markers of this prompt by choosing the right label for each blank.",
    public: {
      template:
        "### {{a}} ###\nYou are a helpful librarian who knows Balkan history.\n\n### {{b}} ###\nRecommend three books that match the reader's request.\n\n### {{c}} ###\nDo not recommend more than three books. Keep each note under 20 words.\n\n### {{d}} ###\n<user_query>\nBooks about medieval Bosnia\n</user_query>",
      blanks: [
        { id: "a", choices: ["CONTEXT", "CONSTRAINTS", "EXAMPLE", "INSTRUCTION"] },
        { id: "b", choices: ["CONTEXT", "CONSTRAINTS", "EXAMPLE", "INSTRUCTION"] },
        { id: "c", choices: ["CONTEXT", "CONSTRAINTS", "EXAMPLE", "INSTRUCTION"] },
        { id: "d", choices: ["USER QUERY", "ROLE", "OUTPUT", "TITLE"] },
      ],
    },
    answer: { correct: { a: "CONTEXT", b: "INSTRUCTION", c: "CONSTRAINTS", d: "USER QUERY" } },
    explanation: "The role sets the stage (context), the verb Recommend directs the action (instruction), the limits on number and length are constraints, and the reader's words are the outside input the tags fence in.",
  },
  {
    slug: "define-the-pillars",
    kind: "fill",
    title: "Complete the definitions",
    promptText: "Choose the pillar that fits each part of the sentence.",
    public: {
      template: "{{a}} sets the stage, {{b}} directs the action, {{c}} shows the exact format, {{d}} sets the limits, and {{e}} separates the parts.",
      blanks: [
        { id: "a", choices: ["Context", "Instructions", "Examples", "Constraints", "Delimiters"] },
        { id: "b", choices: ["Context", "Instructions", "Examples", "Constraints", "Delimiters"] },
        { id: "c", choices: ["Context", "Instructions", "Examples", "Constraints", "Delimiters"] },
        { id: "d", choices: ["Context", "Instructions", "Examples", "Constraints", "Delimiters"] },
        { id: "e", choices: ["Context", "Instructions", "Examples", "Constraints", "Delimiters"] },
      ],
    },
    answer: { correct: { a: "Context", b: "Instructions", c: "Examples", d: "Constraints", e: "Delimiters" } },
    explanation: "Context frames the situation, instructions are the commands, examples demonstrate the format, constraints are the guardrails and delimiters are the fences.",
  },
  {
    slug: "assemble-the-itinerary-prompt",
    kind: "order",
    title: "Assemble the prompt",
    promptText: "These parts of the book's repaired travel prompt are shuffled. Put them in the order the book uses.",
    public: {
      blocks: [
        { id: "constraints", text: "### CONSTRAINTS ###  Follow the format above. Keep justifications to one sentence. Do not name hotels. About 600 to 800 words." },
        { id: "output", text: "### ITINERARY SUGGESTION OUTPUT ###" },
        { id: "context", text: "### CONTEXT ###  Two adults, 14 days, early September, mid-range budget, interested in history, nature and food." },
        { id: "example", text: "### EXAMPLE OUTPUT FORMAT ###  One region shown with historic sites, food and drink, and nature, each with a short justification." },
        { id: "instruction", text: "### INSTRUCTION ###  Suggest a 14-day driving itinerary around Sarajevo, Konjic and Mostar, in the format shown below." },
      ],
    },
    answer: { order: ["context", "instruction", "example", "constraints", "output"] },
    explanation: "The stage is set first, then the action is directed, then the format is demonstrated, then the limits are stated, and finally the marker shows where the model's answer should begin.",
  },
  {
    slug: "spot-the-vague-lines",
    kind: "spot",
    title: "Spot the flaws",
    promptText: "This prompt has some weak lines. Select every line that leaves the model guessing.",
    public: {
      segments: [
        { id: "s1", text: "Tell me about travel in Bosnia and Herzegovina." },
        { id: "s2", text: "Make it really good and detailed." },
        { id: "s3", text: "Keep it under 200 words." },
        { id: "s4", text: "Write for two adults who love history and hiking and travel in September." },
        { id: "s5", text: "Do it however you like." },
      ],
    },
    answer: { flawed: ["s1", "s2", "s5"] },
    explanation: "\"Tell me about\" names no task, \"really good and detailed\" defines no quality, and \"however you like\" gives no guidance. The word limit is a constraint and the traveler description is context, and both are useful.",
  },
  {
    slug: "repair-the-travel-prompt",
    kind: "repair",
    title: "Repair the prompt with all five pillars",
    promptText: "Rewrite this vague prompt so that it uses context, a specific instruction, an example, constraints and delimiters.",
    public: { starter: "Tell me about travel in Bosnia and Herzegovina.", hint: "Who is travelling, when and what do they like? What exactly should the model produce, in what format, within what limits, and how will you separate the parts?" },
    answer: {
      criteria: [
        { id: "context", label: "Gives context (who, when, interests or budget)", weight: 2, anyOf: ["\\b(two|couple|family|solo|adults?|we are|i am|we're|traveler|travellers?)\\b", "\\b(budget|days?|week|weeks|september|summer|interests?|prefer)\\b"], hint: "Add who is travelling, for how long and what they like." },
        { id: "instruction", label: "Uses a clear, specific instruction", weight: 2, anyOf: ["\\b(suggest|list|plan|recommend|create|write|propose|design)\\b[^.]{0,80}\\b(itinerary|route|plan|places|sites|days?)\\b"], hint: "Start with a verb such as Suggest or Plan and name what you want, for example an itinerary." },
        { id: "example", label: "Shows an example of the format", weight: 1, anyOf: ["\\b(example|for instance|format|like this|structure)\\b"], hint: "Show one sample entry so the model can copy the format." },
        { id: "constraints", label: "Sets constraints (length, exclusions or tone)", weight: 2, anyOf: ["\\b(under|at most|no more than|maximum|up to|about \\d+|\\d+\\s*words)\\b", "\\b(do not|don't|avoid|without|exclude)\\b"], hint: "Add at least a length limit or something to avoid." },
        { id: "delimiters", label: "Separates the parts with delimiters", weight: 1, anyOf: ["###", "<[a-z_]+>", "```", "^---$", "\\*\\*\\*"], hint: "Mark the sections, for example with ### CONTEXT ### or with tags." },
      ],
      model:
        "### CONTEXT ###\nTwo adults, 14 days in early September, mid-range budget, interested in history, nature and regional food, driving a rental car.\n\n### INSTRUCTION ###\nSuggest a 14-day driving itinerary through Bosnia and Herzegovina. For each region give one historic site, one food experience and one scenic spot, in the format shown below.\n\n### EXAMPLE OUTPUT FORMAT ###\n**Mostar area (3 days)** - Historic: Old Bridge. Food: local grilled meats. Nature: Kravica waterfalls.\n\n### CONSTRAINTS ###\nKeep each justification to one sentence. Do not name specific hotels. About 600 to 800 words.",
    },
    explanation: "A strong rewrite frames the travelers (context), asks for a specific deliverable with a verb (instruction), shows one entry (example), limits length and content (constraints) and fences the sections (delimiters).",
    samples: {
      good: [
        "### CONTEXT ###\nTwo adults, 14 days in September, mid-range budget, love history and hiking.\n### INSTRUCTION ###\nSuggest a 14-day driving itinerary in Bosnia and Herzegovina in the format of the example below.\n### EXAMPLE ###\nMostar area (3 days): Old Bridge, local food, Kravica falls.\n### CONSTRAINTS ###\nUnder 700 words. Do not name hotels.",
      ],
      bad: ["Tell me all about Bosnia and Herzegovina travel please.", "Tell me about travel in Bosnia and Herzegovina."],
    },
  },
  {
    slug: "repair-with-constraints",
    kind: "repair",
    title: "Repair the prompt with constraints",
    promptText: "This prompt has no boundaries. Rewrite it so the output has a clear audience, a number of items, a length limit, and something to avoid or a tone.",
    public: { starter: "Describe the benefits of using our software.", hint: "Who is the reader? How many benefits? How long may the answer be? What should it avoid?" },
    answer: {
      criteria: [
        { id: "verb", label: "Keeps a clear instruction verb", weight: 1, anyOf: ["\\b(describe|list|write|explain|summarize|outline)\\b"], hint: "Begin with a verb such as Describe or List." },
        { id: "audience", label: "Names the audience", weight: 2, anyOf: ["\\b(for|aimed at|audience|readers?)\\b[^.]{0,60}\\b(owners?|beginners?|customers?|managers?|users?|teams?|students?)\\b"], hint: "Say who will read it, for example small business owners." },
        { id: "count", label: "Limits the number of items", weight: 1, anyOf: ["\\b(top|three|3|five|5|two|2|four|4)\\b"], hint: "Ask for a specific number of benefits." },
        { id: "length", label: "Sets a length limit", weight: 2, anyOf: ["\\b(under|at most|no more than|maximum|up to|within)\\b[^.]{0,20}\\b\\d+\\b", "\\b\\d+\\s*(words|sentences|paragraphs)\\b"], hint: "State a limit such as under 200 words." },
        { id: "avoid", label: "Says what to avoid or sets the tone", weight: 2, anyOf: ["\\b(avoid|do not|don't|without|exclude)\\b", "\\b(tone|encouraging|plain|simple|friendly|formal)\\b"], hint: "Add a tone rule or something the answer must avoid." },
      ],
      model: "Describe the top 3 benefits of our software for small business owners. Focus on time saving and cost. Keep it under 200 words, avoid technical jargon and use an encouraging tone.",
    },
    explanation: "The rewrite keeps a verb but adds boundaries: an audience, a count, a length limit and a tone or exclusion. Each one removes a way the model could go wrong.",
    samples: {
      good: ["Describe the top 3 benefits of our software for small business owners. Under 200 words. Avoid jargon and keep an encouraging tone."],
      bad: ["Describe the benefits of using our software, please be thorough.", "Describe the benefits of using our software."],
    },
  },
];

/**
 * Chapter "Foundational Techniques" (book chapter 3, "Direct Instruction and Demonstration"): 5 lessons and
 * 10 exercises, written from the Director's book, which is the only source. No em dashes (writing rule,
 * PDL-057). `samples` on repair exercises exist only for the content test; they are never stored.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const FOUNDATIONAL_LESSONS: LessonContent[] = [
  {
    slug: "zero-shot-the-telegraph-method",
    title: "Zero-shot: the telegraph method",
    minutes: 6,
    covers: ["ch3-intro-two-modes", "ch3-zero-shot-telegraph", "ch3-zero-shot-when-works", "ch3-zero-shot-why-works", "ch3-zero-shot-limitations"],
    body: `You now know the parts of a prompt. This chapter is about how to **operate** them. There are two fundamental ways to guide a language system:

1. **Direct instruction (zero-shot prompting):** you give a clear command and rely on what the system already knows.
2. **Demonstration (few-shot learning):** you show the result you want with examples.

Nearly every prompt you write uses one of them, or a mix. We begin with the direct one.

## The telegraph

In the age of the telegraph, operators could not ramble. They squeezed a thought into a short, precise message, and the receiver, trained in the shared code, decoded it and acted. Nobody attached samples of Morse code to each telegram, because the receiver's baseline skill was assumed.

That is **zero-shot prompting**. "Zero" means you give **zero examples** of the input and output behaviour inside your prompt. You send one clear instruction and count on the system's general education from training. It is like asking a well-informed person "What is the main function of the human heart?" You do not first show them what the lungs or kidneys do.

## When the telegraph works best

- **Common, unambiguous tasks:** basic translation, simple definitions, standard text changes. Example: translate the phrase "Dobar dan" from Bosnian to English.
- **Tasks fully described by instructions and constraints:** for example, list the cantons of the Federation of Bosnia and Herzegovina in alphabetical order.
- **General knowledge:** history, basic science, literature, geography.
- **Standard formats:** paragraphs, bullet points, numbered lists.

## Why it works

These systems learn statistical patterns from a huge amount of text. A clear instruction strongly triggers a well-learned pattern: "What year was the Dayton Agreement signed?" activates the strong link between the agreement and 1995. The clearer your instruction, the more precisely you activate the right pattern.

## Where the telegraph falls short

- **Complex or custom formats,** such as an unusual nested JSON layout, are hard to get right from words alone.
- **A very specific voice or tone.** "Friendly" and "formal" are subjective.
- **Novel tasks** the system has rarely seen.
- **Ambiguous instructions** that can be read in more than one valid way.
- **Knowledge the system lacks,** such as niche facts or events after its training.

When your telegrams keep missing, it is time to stop only telling and start **showing**.

**Try this:** write one zero-shot prompt for a task you do often, then note which of the five weaknesses above could hit it.`,
  },
  {
    slug: "few-shot-the-recipe-card",
    title: "Few-shot: the recipe card approach",
    minutes: 7,
    covers: ["ch3-few-shot-recipe-card", "ch3-few-shot-why-show", "ch3-few-shot-structure", "ch3-one-shot-vs-few-shot"],
    body: `Try to teach someone to make perfect Bosnian coffee from written instructions only. You can describe the džezva, the fine grind, the gentle heat and the ritual of serving. But would the reader truly know how the foam should look just before the pot leaves the heat? For subtle crafts, a demonstration, or at least a detailed recipe card with pictures, works far better.

## Few-shot learning

**Few-shot learning** means you give the system a small number of concrete examples that demonstrate the task. Each example shows an **input** and the exact **output** you want for it. You move from issuing commands to being a teacher.

You met examples as the third pillar. Here they become a deliberate technique, used when instructions alone cannot carry the precision, format, style or pattern you need.

## Why showing works

Language systems are pattern machines. Given input and output pairs they lock onto the pattern: "for input like this, the output looks like that", and they apply it to your new input. This is usually more reliable than describing a complex pattern in words, especially for:

- **Specific output formats** (JSON, XML, custom tables, code in a particular style).
- **Nuanced tone, style or persona,** best shown by examples written in exactly that voice.
- **Pattern recognition and classification,** such as sorting feedback into Positive, Negative or Neutral.
- **Resolving ambiguity,** since an example of the right length settles what "concise" means.
- **Simple reasoning analogies.**

## The structure of a recipe card prompt

1. **Instruction** (optional but recommended): a short statement of the goal, such as "Classify the following text".
2. **Demonstration examples** (the core): usually 2 to 5 pairs of an example input and its exact example output, clearly labelled.
3. **Actual input:** the new item to process, in the same format and label as the example inputs.
4. **Output prompt:** a label such as \`Output:\` showing where the system should write its answer.

Here is a small one.

\`\`\`
### INSTRUCTION ###
Format the address into a standard block, one part per line.

### EXAMPLES ###
Input: Street=Maršala Tita 5, City=Sarajevo, ZIP=71000, Country=BiH
Output:
Maršala Tita 5
71000 Sarajevo
Bosnia and Herzegovina

### ACTUAL TASK ###
Input: ZIP=88000, Street=Braće Fejića 22, Country=BiH, City=Mostar
Output:
\`\`\`

## One-shot or few-shot?

- **One-shot** is a single example. It can be enough when the pattern is very simple or consistent, but it is less robust.
- **Few-shot** uses several examples. It confirms the pattern, shows how to handle slight variations and helps with nuanced formats. The best number depends on the task and on the quality of your examples: start with one or two and add more if needed.

The recipe card is a cornerstone technique for control over format and style. Its success depends entirely on the quality of the examples, which is the next lesson.

**Try this:** take a task where a zero-shot prompt gave you the wrong format and add two input and output examples. Compare.`,
  },
  {
    slug: "seven-worked-examples-in-markdown",
    title: "Seven worked examples in Markdown",
    minutes: 8,
    covers: ["ch3-zero-shot-examples", "ch3-few-shot-examples"],
    body: `Seeing a technique at work makes it stick. Here are the book's seven worked examples, four zero-shot and three few-shot, each laid out with Markdown headings. After each one you see what the model is expected to return.

## Four zero-shot prompts, the telegraph method

**Example 1: factual recall**

\`\`\`
### INSTRUCTION ###
What year was the Dayton Agreement signed, formally ending the Bosnian War?
\`\`\`

Expected output: a direct answer, most likely "1995."

**Example 2: simple text generation (a list)**

\`\`\`
### INSTRUCTION ###
List three common ingredients found in traditional Bosnian ćevapi. Use a simple bulleted list.
\`\`\`

Expected output: a short list such as minced meat (beef, lamb or veal), salt, and garlic (often).

**Example 3: basic explanation**

\`\`\`
### INSTRUCTION ###
Explain the basic concept of "sevdah" music in one or two sentences.
\`\`\`

Expected output: a concise definition relating to Bosnian folk music that expresses melancholy or longing.

**Example 4: simple command**

\`\`\`
### INSTRUCTION ###
Convert the following sentence to the past tense: "The tourist visits the Baščaršija market."
\`\`\`

Expected output: "The tourist visited the Baščaršija market."

In all four cases you rely solely on clear instructions and the model's existing knowledge. You give no examples of how to answer a history question, list ingredients, define a term or change a tense. You send a clear telegram and expect an accurate decoding.

## Three few-shot prompts, the recipe card approach

**Example 1: formatting addresses**

\`\`\`
### INSTRUCTION ###
Format the following address components into a standard Bosnian address block,
placing each part on a new line.

### EXAMPLES ###
Input: Street=Maršala Tita 5, City=Sarajevo, ZIP=71000, Country=BiH
Output:
Maršala Tita 5
71000 Sarajevo
Bosnia and Herzegovina

Input: City=Banja Luka, Street=Kralja Petra I Karađorđevića 10, Country=Bosnia and Herzegovina, ZIP=78000
Output:
Kralja Petra I Karađorđevića 10
78000 Banja Luka
Bosnia and Herzegovina

### ACTUAL TASK ###
Input: ZIP=88000, Street=Braće Fejića 22, Country=BiH, City=Mostar
Output:
\`\`\`

Expected output: a correctly formatted address block for Mostar, following the pattern shown. Notice that the components arrive in a different order each time, and the examples teach the model to reorder them.

**Example 2: extracting information into a bulleted list**

\`\`\`
### INSTRUCTION ###
Read the event description and extract the Event Name, Date, and Location into a
bulleted list using the format shown.

### EXAMPLES ###
Input: The Sarajevo Film Festival starts on August 15th and takes place at various venues across Sarajevo.
Output:
* Event Name: Sarajevo Film Festival
* Date: August 15th onwards
* Location: Sarajevo

Input: Join us for the Mostar Bridge Diving competition on July 28th, right at the Stari Most in Mostar!
Output:
* Event Name: Mostar Bridge Diving competition
* Date: July 28th
* Location: Stari Most, Mostar

### ACTUAL TASK ###
Input: Experience the Una Regatta, a multi-day kayaking event on the Una River near Bihać, typically held in late July.
Output:
\`\`\`

Expected output: a bulleted list with the event name, an approximate date and the location.

**Example 3: simple translation with a contextual tone**

\`\`\`
### INSTRUCTION ###
Translate the English phrase into Bosnian, adopting a polite, slightly formal tone
suitable for addressing an elder.

### EXAMPLES ###
Input: Hello, how are you?
Output: Dobar dan, kako ste?

Input: Thank you very much.
Output: Hvala Vam lijepa.

### ACTUAL TASK ###
Input: Excuse me, can you help me?
Output:
\`\`\`

Expected output: a polite translation such as "Izvinite, možete li mi pomoći?", which follows the formal "Vi" form the examples demonstrate.

## What to notice

The examples directly demonstrate the required structure or stylistic nuance, often more effectively than lengthy instructions could. In the third example, no instruction explains the difference between the informal "ti" and the formal "Vi". The two example pairs show it.

**Try this:** pick one of the seven and change the actual task to something new. Predict the output before you run it.`,
  },
  {
    slug: "gold-star-selection",
    title: "Gold star selection: only the best examples",
    minutes: 6,
    covers: ["ch3-gold-star-quality-sampling", "ch3-gold-star-why", "ch3-gold-star-criteria", "ch3-gold-star-finding"],
    body: `Imagine learning woodworking from a master whose joints are crooked and whose finishes are rough. You would learn to make crooked joints. The demonstration sets the ceiling of the skill.

The same applies to few-shot prompts. The system copies the patterns it sees. If your examples contain errors, inconsistencies, bias or a poor match to the task, the output will repeat those flaws. Choosing or writing only the best examples is called **quality sampling**, and the book calls it the **Gold Star Selection**: like a teacher who puts up only the papers that follow the instructions perfectly.

## What bad examples do

1. **Error propagation.** A mistake in an example output is learned and reproduced. Garbage in, garbage out.
2. **Conflicting signals.** If one example writes a date as 05.03.2024 and another as 03/05/24, the system cannot know which to follow.
3. **Bias replication.** Examples that all reinforce a stereotype teach the stereotype.
4. **Ignored edge cases.** Only easy examples teach only easy handling.
5. **Poor style imitation.** Weakly written sample text produces weak imitation.

## The gold star criteria

- **Accuracy:** the facts, the logic and the transformation are correct.
- **Clarity:** the link between input and output is immediately understandable, and the format is clean.
- **Consistency:** every example follows exactly the same rules, format, style and logic. Even small differences, such as capitalization of a label or a slight change of tone, degrade the result.
- **Relevance:** the examples resemble the real task and input.
- **Representativeness** (ideal, optional): include common variations or edge cases, for instance addresses with and without an apartment number.

## Where to get gold star examples

- **Real data** you can verify.
- **Manual creation:** write ideal pairs yourself, simple first, clear and correct.
- **Iterative refinement:** run a first prompt, then carefully correct the almost-right output into a perfect one and use it as an example in the next version.
- **Start small, build up:** begin with one or two excellent examples, test, and add another one **strategically** to fix a specific failure, never at random.

**Try this:** look at a few-shot prompt you have written and check each example against the five criteria. Fix the weakest one first.`,
  },
  {
    slug: "workshop-from-telegraph-to-recipe-card",
    title: "Workshop: from telegraph to recipe card",
    minutes: 8,
    covers: ["ch3-practical-exercise", "ch3-why-few-shot-superior", "ch3-choosing-tool"],
    body: `Let us do the whole journey on one task: getting key facts about historical events, clearly and consistently.

## Step 1: the telegraph draft

\`\`\`
### INSTRUCTION ###
Provide historical information about the assassination of Archduke Franz Ferdinand in Sarajevo.
\`\`\`

## Step 2: find the weaknesses

This will give you something, but probably:

- **Unstructured:** the key facts are buried in paragraphs.
- **Inconsistent:** ask about several events and the level of detail will vary.
- **Too wordy or off topic:** extra background nobody asked for.
- **Uncontrolled format:** no guarantee how it is presented.

## Step 3: design the output you want

Decide on the exact fields, in a clear list:

- Event
- Date
- Location
- Key figures involved
- Outcome or immediate result
- Historical significance

## Step 4: craft gold star examples

Write two accurate, identically formatted examples of different events. Each one uses the same six labels, the same style of bullet and the same level of detail. That consistency is what the system will copy.

\`\`\`
Example 1 Input: Signing of the Dayton Agreement
Example 1 Output:
* **Event:** Signing of the General Framework Agreement for Peace in Bosnia and Herzegovina (Dayton Agreement)
* **Date:** Initialed November 21, 1995; formally signed December 14, 1995
* **Location:** Initialed at Wright-Patterson AFB, Dayton, Ohio, USA; signed in Paris, France
* **Key Figures Involved:** Alija Izetbegović (Bosnia), Slobodan Milošević (Serbia/FR Yugoslavia), Franjo Tuđman (Croatia), US mediators (e.g., Richard Holbrooke)
* **Outcome/Immediate Result:** Officially ended the Bosnian War (1992-1995); established the political structure of post-war Bosnia and Herzegovina (two entities: Federation of BiH and Republika Srpska)
* **Historical Significance:** Brought an end to intense conflict in the Balkans; created a complex political framework still in place today

Example 2 Input: 1984 Winter Olympics Opening Ceremony
Example 2 Output:
* **Event:** Opening Ceremony of the XIV Olympic Winter Games
* **Date:** February 8, 1984
* **Location:** Koševo Stadium (now Asim Ferhatović Hase Stadium), Sarajevo, Yugoslavia (now Bosnia and Herzegovina)
* **Key Figures Involved:** Skier Jure Franko (Olympic Oath), figure skater Sanda Dubravčić (lit the Olympic Flame), President Mika Špiljak (opened the Games)
* **Outcome/Immediate Result:** Officially opened the 1984 Winter Olympics
* **Historical Significance:** Major international event showcasing Sarajevo and Yugoslavia; a symbol of unity and achievement before the conflicts of the 1990s
\`\`\`

## Step 5: assemble and assess

\`\`\`
### INSTRUCTION ###
Provide key historical facts for the specified event using the structured
format demonstrated in the examples below.

### EXAMPLES ###
Example 1 Input: Signing of the Dayton Agreement
Example 1 Output: (the six labelled facts shown above)

Example 2 Input: 1984 Winter Olympics Opening Ceremony
Example 2 Output: (the six labelled facts shown above)

### ACTUAL TASK ###
Input: Assassination of Archduke Franz Ferdinand
Output:
\`\`\`

Compared with the telegraph draft, this version is far more likely to give what you want: the **format is unambiguous**, the examples guide the **level of detail**, the pattern is **consistent**, and there is **less guesswork**.

## Choosing your foundational tool

- Use the **telegraph (zero-shot)** when the task is simple, unambiguous, relies on common knowledge, or can be fully defined by instructions and constraints. It is quick and direct.
- Use the **recipe card (few-shot)**, with gold star examples, when you need precise control over format, style or tone, when the task is about recognizing or applying a pattern, or when instructions alone could be read in more than one way. It costs more effort up front and gives more precision.

Often the best prompt **blends both**: a clear instruction sets the stage and a few well-chosen examples pin down the details. With these two tools you are ready for methods that guide reasoning itself.

**Try this:** choose a topic you know well, such as a type of place, product or event, design the six fields and write two gold star examples.`,
  },
];

export const FOUNDATIONAL_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "best-fit-for-zero-shot",
    kind: "choice",
    title: "Pick the zero-shot task",
    promptText: "Which of these tasks suits a plain zero-shot instruction best?",
    public: {
      options: [
        "Reply in the exact voice of our brand, which is a witty blend that has no written definition",
        "Translate the phrase \"Dobar dan\" from Bosnian to English",
        "Output data in a custom nested JSON layout the model has never seen",
        "Classify feedback with our own private labels that are only in a spreadsheet",
      ],
    },
    answer: { correct: 1 },
    explanation: "Translating a common phrase is a common, unambiguous task the model has met countless times, so the instruction alone is enough. The other three depend on style, format or labels that are hard to convey without showing examples.",
  },
  {
    slug: "spot-the-tasks-needing-examples",
    kind: "spot",
    title: "Which tasks need examples?",
    promptText: "Instructions alone are likely to fall short for some of these tasks. Select every task where you would add examples.",
    public: {
      pickPrompt: "Select every task that needs examples",
      hitLabel: "Needs examples",
      missLabel: "Instructions are enough",
      segments: [
        { id: "t1", text: "Produce output in a custom nested JSON structure with our own field names" },
        { id: "t2", text: "Define the word photosynthesis" },
        { id: "t3", text: "Answer in the exact tone of our company's support team" },
        { id: "t4", text: "Convert the sentence \"The tourist visits the market\" to the past tense" },
        { id: "t5", text: "Sort customer comments into our three internal categories, using our own wording" },
      ],
    },
    answer: { flawed: ["t1", "t3", "t5"] },
    explanation: "Custom formats, a specific voice and your own labels are exactly what is hard to describe in words and easy to demonstrate. A definition and a standard tense change are common tasks that a direct instruction handles well.",
  },
  {
    slug: "label-the-recipe-card",
    kind: "fill",
    title: "Label the recipe card",
    promptText: "This few-shot prompt has three unlabelled sections. Choose the right label for each.",
    public: {
      template:
        "### {{a}} ###\nClassify the sentiment of each review as Positive, Negative or Neutral.\n\n### {{b}} ###\nInput: The coffee was superb.\nOutput: Positive\n\nInput: Delivery took three weeks.\nOutput: Negative\n\n### {{c}} ###\nInput: The package arrived on Tuesday.\nOutput:",
      blanks: [
        { id: "a", choices: ["INSTRUCTION", "EXAMPLES", "ACTUAL TASK", "CONSTRAINTS"] },
        { id: "b", choices: ["INSTRUCTION", "EXAMPLES", "ACTUAL TASK", "CONSTRAINTS"] },
        { id: "c", choices: ["INSTRUCTION", "EXAMPLES", "ACTUAL TASK", "CONSTRAINTS"] },
      ],
    },
    answer: { correct: { a: "INSTRUCTION", b: "EXAMPLES", c: "ACTUAL TASK" } },
    explanation: "A few-shot prompt states the goal (instruction), shows worked input and output pairs (examples), then gives the new input in the same format with an empty output for the model to fill (actual task).",
  },
  {
    slug: "assemble-the-few-shot-prompt",
    kind: "order",
    title: "Assemble the few-shot prompt",
    promptText: "These parts of a few-shot prompt are shuffled. Put them in the order the book uses.",
    public: {
      blocks: [
        { id: "ex2", text: "Example 2 Input: 1984 Winter Olympics Opening Ceremony. Example 2 Output: the same six labelled facts." },
        { id: "actual", text: "### ACTUAL TASK ###  Input: Assassination of Archduke Franz Ferdinand" },
        { id: "instruction", text: "### INSTRUCTION ###  Provide key historical facts for the event, using the format shown in the examples." },
        { id: "output", text: "Output:" },
        { id: "ex1", text: "Example 1 Input: Signing of the Dayton Agreement. Example 1 Output: six labelled facts." },
      ],
    },
    answer: { order: ["instruction", "ex1", "ex2", "actual", "output"] },
    explanation: "State the goal first, then show the demonstrations in one consistent format, then give the new input, and end with the output label so the model knows where to write its answer.",
  },
  {
    slug: "spot-the-bad-examples",
    kind: "spot",
    title: "Find the examples that break the gold star rules",
    promptText: "This prompt teaches the model to write dates as DD.MM.YYYY. Some of its examples are inaccurate or inconsistent. Select every example that breaks a rule.",
    public: {
      pickPrompt: "Select every example that breaks a gold star rule",
      hitLabel: "Breaks a rule",
      missLabel: "Good example",
      segments: [
        { id: "d1", text: "Input: 5 March 2024   Output: 05.03.2024" },
        { id: "d2", text: "Input: 17 July 2023   Output: 07/17/23" },
        { id: "d3", text: "Input: 1 January 2022   Output: 01.01.2022" },
        { id: "d4", text: "Input: 30 June 2021   Output: 30.07.2021" },
        { id: "d5", text: "Input: 12 October 2020   Output: 12.10.2020" },
      ],
    },
    answer: { flawed: ["d2", "d4"] },
    explanation: "The second example uses a different date format (a consistency error) and the fourth gives the wrong month (an accuracy error). The model would copy both flaws.",
  },
  {
    slug: "custom-json-needs-examples",
    kind: "choice",
    title: "Choose the technique",
    promptText: "You need the answer in a custom JSON layout that the model has probably rarely seen, and your written description keeps producing slightly different structures. What is the best approach?",
    public: {
      options: [
        "Make the written description longer and stricter, and keep it zero-shot",
        "Show two or three examples of the exact layout (few-shot), then give the real input",
        "Ask the model to guess the layout",
        "Switch to a longer conversation and hope it remembers",
      ],
    },
    answer: { correct: 1 },
    explanation: "Custom or complex formats are best demonstrated. Two or three consistent examples of the layout give the model a pattern to copy, which words alone struggle to do.",
  },
  {
    slug: "name-the-broken-criterion",
    kind: "choice",
    title: "Name the broken criterion",
    promptText: "In one prompt, an example writes a date as 05.03.2024 and another writes it as 03/05/24. Which gold star criterion is broken?",
    public: {
      options: ["Accuracy", "Clarity", "Consistency", "Relevance"],
    },
    answer: { correct: 2 },
    explanation: "Consistency: every example must follow exactly the same format, style and logic. Mixed date formats send conflicting signals, so the model cannot tell which one to use for a new input.",
  },
  {
    slug: "repair-telegraph-to-recipe-card",
    kind: "repair",
    title: "Turn a telegraph into a recipe card",
    promptText: "Rewrite this zero-shot prompt as a few-shot prompt: an instruction, at least two worked examples in one identical format, then the actual task with an empty output.",
    public: { starter: "Tell me about the Siege of Sarajevo.", hint: "Decide the fields you want (for example Event, Date, Location), write two consistent examples of other events, then give this event as the actual task." },
    answer: {
      criteria: [
        { id: "instruction", label: "States the task with a clear instruction", weight: 1, anyOf: ["\\b(provide|list|give|extract|write|summari[sz]e|format|describe)\\b"], hint: "Start with an instruction such as Provide key facts for the event." },
        { id: "examples", label: "Shows at least two worked input and output examples", weight: 3, anyOf: ["(input|example)[\\s\\S]{0,500}?output[\\s\\S]{0,900}?(input|example)[\\s\\S]{0,500}?output"], hint: "Write two examples, each with an Input and an Output, before the real task." },
        { id: "fields", label: "Uses the same structured fields in the examples", weight: 2, anyOf: ["(event|date|location|key figures|outcome|significance)[\\s\\S]*(event|date|location|key figures|outcome|significance)[\\s\\S]*(event|date|location|key figures|outcome|significance)"], hint: "Give every example the same labelled fields, such as Event, Date and Location." },
        { id: "actual", label: "Marks the actual task", weight: 1, anyOf: ["(actual task|actual input|your task|now do)"], hint: "Mark where the real task starts, for example ### ACTUAL TASK ###." },
        { id: "delimiters", label: "Separates the parts with delimiters", weight: 1, anyOf: ["###", "<[a-z_]+>", "```"], hint: "Fence the sections, for example with ### INSTRUCTION ### and ### EXAMPLES ###." },
      ],
      model:
        "### INSTRUCTION ###\nProvide key facts for the specified event in the format shown in the examples.\n\n### EXAMPLES ###\nInput: Signing of the Dayton Agreement\nOutput:\n* Event: Signing of the Dayton Agreement\n* Date: December 14, 1995\n* Location: Paris, France\n\nInput: 1984 Winter Olympics Opening Ceremony\nOutput:\n* Event: Opening Ceremony of the 1984 Winter Olympics\n* Date: February 8, 1984\n* Location: Koševo Stadium, Sarajevo\n\n### ACTUAL TASK ###\nInput: Siege of Sarajevo\nOutput:",
    },
    explanation: "A recipe card states the goal, shows two or more consistent worked examples, then presents the actual task in the same format and leaves the output empty. The fields and the labels must be identical in every example.",
    samples: {
      good: [
        "### INSTRUCTION ###\nGive key facts for the event using the same fields as the examples.\n### EXAMPLES ###\nInput: Signing of the Dayton Agreement\nOutput: Event: Dayton Agreement. Date: 14 December 1995. Location: Paris.\nInput: Opening of the 1984 Winter Olympics\nOutput: Event: Olympic opening. Date: 8 February 1984. Location: Sarajevo.\n### ACTUAL TASK ###\nInput: Siege of Sarajevo\nOutput:",
      ],
      bad: [
        "Please give me the key facts about the siege of Sarajevo in a nice structured list with date and location.",
        "Tell me about the Siege of Sarajevo.",
      ],
    },
  },
  {
    slug: "complete-the-extraction-example",
    kind: "fill",
    title: "Complete the extraction pattern",
    promptText: "This few-shot prompt extracts event details. Following the pattern of the example, choose the right value for each blank in the actual task.",
    public: {
      template:
        "### INSTRUCTION ###\nRead the event description and extract the Event Name, Date and Location into a bulleted list using the format shown.\n\n### EXAMPLES ###\nInput: The Sarajevo Film Festival starts on August 15th and takes place at various venues across Sarajevo.\nOutput:\n* Event Name: Sarajevo Film Festival\n* Date: {{a}}\n* Location: {{b}}\n\n### ACTUAL TASK ###\nInput: Experience the Una Regatta, a multi-day kayaking event on the Una River near Bihać, typically held in late July.\nOutput:\n* Event Name: Una Regatta\n* Date: {{c}}\n* Location: {{d}}",
      blanks: [
        { id: "a", choices: ["August 15th onwards", "August 15th to 31st", "Various venues", "Film"] },
        { id: "b", choices: ["Sarajevo", "Sarajevo, Bosnia", "August 15th", "Festival"] },
        { id: "c", choices: ["Late July", "Multi-day", "July 28th", "Kayaking"] },
        { id: "d", choices: ["Una River near Bihać", "Bihać, Sarajevo", "Stari Most, Mostar", "Late July"] },
      ],
    },
    answer: { correct: { a: "August 15th onwards", b: "Sarajevo", c: "Late July", d: "Una River near Bihać" } },
    explanation: "The example keeps the date as the source states it (\"August 15th onwards\") and the location short and clean. Following the same pattern, the regatta is dated \"Late July\", the approximate time in the text, and located at the Una River near Bihać.",
  },
  {
    slug: "pick-the-polite-translation",
    kind: "choice",
    title: "Continue the pattern",
    promptText: "The examples translate \"Hello, how are you?\" as \"Dobar dan, kako ste?\" and \"Thank you very much.\" as \"Hvala Vam lijepa.\" Which output best continues the pattern for \"Excuse me, can you help me?\"",
    public: {
      options: [
        "Izvini, možeš li mi pomoći?",
        "Pomoć!",
        "Excuse me, can you help me?",
        "Izvinite, možete li mi pomoći?",
      ],
    },
    answer: { correct: 3 },
    explanation: "Both examples use the polite, formal \"Vi\" form (\"ste\", \"Vam\"). The instruction only asks for a polite, slightly formal tone, and the examples show what that means. \"Izvinite, možete li mi pomoći?\" continues it, while the informal \"ti\" form breaks the pattern.",
  },
];

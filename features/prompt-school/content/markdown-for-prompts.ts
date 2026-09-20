/**
 * Chapter "Formatting Prompts Clearly" (book Appendix C, "Markdown Manual: Formatting for Clearer Prompts"):
 * 5 lessons and 9 exercises, written from the Director's book, which is the only source. Every element of the
 * appendix is covered (see book-map.ts). No em dashes (writing rule, PDL-057). `samples` on repair exercises
 * exist only for the content test; they are never stored.
 *
 * Syntax examples are shown inside fenced blocks so that they display as typed instead of being rendered.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const MARKDOWN_LESSONS: LessonContent[] = [
  {
    slug: "simple-tools-for-precise-construction",
    title: "Simple tools for precise construction",
    minutes: 5,
    covers: ["appC-intro"],
    body: `In any workshop, next to the complex machinery, you find essential hand tools: the ruler, the square, the scribe, the clamp. They do not perform the core transformation themselves, but they are indispensable for accuracy, structure and clarity. Without them even the most powerful machine produces chaos.

**Markdown is the prompt engineer's equivalent of those tools.** It is a remarkably simple system for adding formatting, such as headings, lists, emphasis and code blocks, to plain text using easy-to-remember symbols. You have already seen it throughout the examples in this School. Its power is not in fancy visual effects but in its ability to impose **order, clarity and unambiguous structure** on your prompts.

## Why it is a practical necessity

For a non-coder who wants to master communication with these systems, Markdown is not a nice-to-have. The book gives five reasons.

1. **Structuring complexity.** As prompts grow to include several components (context, instructions, examples and so on), headings and lists organize the parts logically. Your prompts become far easier to read, understand, debug and maintain.
2. **Ensuring clarity.** Emphasis (bold, italics) lets you highlight critical instructions or constraints, guiding your own attention and potentially the system's processing.
3. **Building robust boundaries.** Code blocks and horizontal rules act as powerful semantic fences. They clearly separate trusted instructions from untrusted user input or from distinct contextual elements, which matters for both reliability and security.
4. **Demonstrating precise formats.** Markdown inside your few-shot examples shows the system the exact output structure you require, such as bullet points, specific tagging or code formatting.
5. **Readability and collaboration.** The underlying plain text stays highly readable, so it is easy to share, discuss and keep under version control.

## What this chapter is, and is not

It is not an exhaustive Markdown specification. It is a practical guide to the elements that matter most for crafting effective prompts. For each one you learn the **how** (the syntax) and, more importantly, the **why** (its use in prompt engineering). The next lessons cover nine elements: headings, emphasis, lists, code blocks, inline code, blockquotes, horizontal rules, tables and escaping.

**Try this:** open a prompt you wrote recently and count how many of the five reasons it would benefit from. Mark one place where a heading or a fence would have made it clearer.`,
  },
  {
    slug: "headings-and-emphasis",
    title: "Headings and emphasis",
    minutes: 6,
    covers: ["appC-headings", "appC-emphasis"],
    body: `## 1. Headings: organizing the blueprint

**Purpose.** Headings are like section titles in an architectural blueprint, or chapter titles in a book. They break a long, complex prompt into distinct, labelled sections such as \`### CONTEXT ###\`, \`### INSTRUCTION ###\`, \`### EXAMPLES ###\`, \`### CONSTRAINTS ###\` or \`### SECURITY PROTOCOL ###\`. This organization is vital for prompts that combine several of the five pillars.

**Syntax.** Put hash symbols (#) at the start of a line, followed by a space. The number of hashes sets the level. Two or three hashes are usually the most useful for the major sections of a prompt.

\`\`\`
## Major Section (for example, Instructions)
### Subsection (for example, Step 1, Context Details)
#### Finer Point (less common, for sub-subsections)
\`\`\`

**Prompt engineering example: structuring a detailed prompt.**

\`\`\`
### ROLE ###
You are an objective data analyst.

### CONTEXT: Provided Data ###
<data> [Input data here] </data>

### INSTRUCTION: Analysis Tasks ###
Perform the following analysis based ONLY on the provided data:
#### Task 1: Calculate Averages ####
[Instruction for calculating averages...]
#### Task 2: Identify Trends ####
[Instruction for identifying trends...]

### CONSTRAINTS ###
- Output format: JSON
- Do not use external knowledge.

### OUTPUT ###
\`\`\`

**Workshop note.** Use headings consistently to create a clear visual hierarchy. Three hashes are often a good level for the main pillars inside your prompt. They make navigating and editing complex prompts much easier.

## 2. Emphasis: highlighting critical instructions

**Purpose.** Emphasis (bold or italics) draws attention to crucial words or phrases in your instructions or constraints. It is like underlining a key tolerance on a blueprint or highlighting a critical safety warning. Use it to stress requirements, negations and key terms.

**Syntax.**

\`\`\`
Italics:        *single asterisks*  or  _single underscores_
Bold:           **double asterisks**  or  __double underscores__
Bold + italic:  ***triple asterisks***  or  ___triple underscores___
\`\`\`

**Prompt engineering example: stressing important conditions and negations.**

\`\`\`
### INSTRUCTION ###
Generate a summary based **only** on the provided text. The summary *must* be
presented as bullet points. **DO NOT** exceed three bullet points. Ensure you
capture the _main conclusion_ accurately.
\`\`\`

**Workshop note.** Use emphasis judiciously, because overusing it diminishes its impact. Reserve bold, especially something like **DO NOT**, for the absolutely critical constraints or instructions the system must not miss. Italics suit specific terms or areas of focus.

**Try this:** take a prompt of yours and find the single most critical constraint. Make only that one bold, and check that nothing else competes with it.`,
  },
  {
    slug: "lists-and-code-blocks",
    title: "Lists and fenced code blocks",
    minutes: 8,
    covers: ["appC-lists", "appC-code-blocks"],
    body: `## 3. Lists: sequencing steps and presenting examples

**Purpose.** Lists are indispensable for structuring a sequence of instructions, outlining the steps of a process (such as chain of thought), presenting few-shot examples clearly, or requesting output as a list. They impose order and clarity.

**Syntax.**

- **Unordered (bullets):** start lines with \`*\`, \`-\` or \`+\` followed by a space. Indent, usually by 2 or 4 spaces, for nested lists.
- **Ordered (numbers):** start lines with \`1.\`, \`2.\`, \`3.\` followed by a space. Markdown usually renumbers automatically, but sequential numbers are clearest. Indent for nested lists.

**Prompt engineering example: multi-step instructions and a few-shot structure.**

\`\`\`
### INSTRUCTION ###
Follow these steps to generate the report:
1. Analyze the data in \`<input_data>\`.
2. Calculate the following metrics:
   * Metric A (definition)
   * Metric B (definition)
3. Present the results using the format shown in the examples.

### EXAMPLES ###
* **Input Record 1:** [Data...]
  **Output Report 1:** [Formatted report...]
* **Input Record 2:** [Data...]
  **Output Report 2:** [Formatted report...]

### REPORT OUTPUT ###
\`\`\`

**Workshop note.** Ordered lists (1., 2.) are ideal for sequential instructions, such as chain-of-thought steps or workflow guidance. Unordered lists (\`*\`, \`-\`) are excellent for sets of criteria or examples, or for requesting bulleted output. Consistent indentation is the key for nested lists.

## 4. Code blocks (fenced): the essential container and delimiter

**Purpose.** This is arguably the most versatile Markdown tool for prompt engineering. A fenced code block, opened and closed with three backticks, serves two crucial functions.

1. **Presenting literal text.** It displays multi-line text exactly as written, preserving spacing, indentation and special characters. That is essential for code snippets (Python, SQL and so on), for examples of structured data (XML, JSON), and for any text where exact formatting matters.
2. **Robust delimitation.** It acts as an extremely clear and unambiguous semantic fence, isolating blocks of text such as user input, source documents given as context, or detailed examples from the surrounding instructions. This stops the system from confusing different parts of the prompt and is vital for security.

**Syntax.** Start the block with three backticks on a line of their own, optionally followed at once by a language identifier such as \`python\`, \`json\`, \`xml\` or \`text\`. End the block with three backticks on a line of their own. Here is what you type, shown inside a wider fence so that it displays as written:

\`\`\`\`
\`\`\`python
# This Python code is shown literally
def example(x):
    return x * 2
\`\`\`
\`\`\`\`

**Prompt engineering example: isolating user input and showing code context.**

\`\`\`\`
### INSTRUCTION ###
Debug the Python code provided in the <original_code> block based on the user's
description of the error in the <error_report> block. Explain the bug and provide
the corrected code in a Python code block.

### CONTEXT: ORIGINAL PYTHON CODE ###
<original_code>
\`\`\`python
[Paste buggy Python code here]
\`\`\`
</original_code>

### CONTEXT: USER ERROR REPORT ###
<error_report>
[Paste user's description of the problem here]
</error_report>

### DEBUGGING OUTPUT ###
Explanation of Bug:
[System explains bug here]
Corrected Code:
[System provides corrected code here]
\`\`\`\`

**Workshop note.** Get comfortable with fenced code blocks. They are your primary tool for providing verbatim text, code and structured-data examples, and for securely isolating user input. Always try to name the language after the opening backticks (python, json, xml, text, markdown) for maximum clarity, even if your interface does not colour the syntax. Treat them as essential containers and fences.

**Try this:** take a prompt that includes pasted text and put that text inside a fenced block with the identifier \`text\`. Then add one sentence telling the system to treat the block as data, not as instructions.`,
  },
  {
    slug: "inline-code-blockquotes-and-rules",
    title: "Inline code, blockquotes and horizontal rules",
    minutes: 6,
    covers: ["appC-inline-code", "appC-blockquotes", "appC-horizontal-rules"],
    body: `## 5. Inline code: highlighting specific terms or snippets

**Purpose.** When you need to refer to a specific variable name, function name, tag, filename, command or short snippet inside an ordinary sentence of your instructions, inline code formatting makes it stand out clearly from the surrounding text.

**Syntax.** Surround the term with single backticks.

\`\`\`
Extract the value from the \`<price>\` tag. Call the \`calculate_discount()\`
function. Ensure the \`user_id\` variable is used. Follow the \`STRICTLY DO NOT\`
instruction.
\`\`\`

**Prompt engineering example: referencing specific elements in instructions.**

\`\`\`
### INSTRUCTION ###
Analyze the input text in \`<source>\`. Identify all instances where the function
\`process_record()\` is called. For each call, extract the value passed as the
\`record_id\` argument. Format the output as JSON, using \`record_id\` as the key.
Ignore calls where \`status\` is \`'pending'\`.
\`\`\`

**Workshop note.** Use inline code for precision when you refer to literal code elements, tags, filenames or keywords inside natural-language instructions. It significantly improves clarity and reduces the chance of misinterpretation.

## 6. Blockquotes: offsetting quoted material

**Purpose.** A blockquote gives a clear visual indentation to text that is quoted or referenced from an external source: a user's query, an excerpt from a document, or a policy statement you want the system to consider.

**Syntax.** Start each line of the quoted text with a greater-than sign followed by a space.

\`\`\`
The user reported the following issue:
> My login stopped working this morning. I get an 'invalid credentials'
> error, but I'm sure the password is correct.
Please respond based on this report and our standard troubleshooting steps.
\`\`\`

**Prompt engineering example: including a user query clearly.**

\`\`\`
### CONTEXT: USER QUERY ###
> Can you explain the difference between RAG and fine-tuning? I find it confusing.

### INSTRUCTION ###
Answer the user's query above clearly and concisely, using simple analogies
suitable for a non-coder.
\`\`\`

**Workshop note.** Blockquotes are a good alternative or supplement to code blocks for visually setting apart external text, such as user input, inside the flow of your prompt, especially for shorter excerpts.

## 7. Horizontal rules: simple visual separation

**Purpose.** Horizontal rules are simple visual dividers. They create a clean break between major sections without the structural weight of a heading, and they work as straightforward semantic fences.

**Syntax.** Put three or more hyphens, asterisks or underscores on a line by themselves.

\`\`\`
### CONTEXT ###
[Background information goes here...]
---
### INSTRUCTIONS ###
[Main task instructions go here...]
***
### EXAMPLES ###
[Few-shot examples go here...]
\`\`\`

**Workshop note.** Use horizontal rules for quick, clean visual separation between logical blocks of your prompt, especially when a full heading feels like overkill.

**Try this:** rewrite one instruction that names a tag or a variable so that the name is in inline code, then put a short quoted customer message in a blockquote.`,
  },
  {
    slug: "tables-escaping-and-the-carpenters-tools",
    title: "Tables, escaping and the carpenter's marking tools",
    minutes: 6,
    covers: ["appC-tables", "appC-escaping", "appC-carpenter-tools"],
    body: `## 8. Tables: requesting or demonstrating tabular data

**Purpose.** Tables are less common for putting complex data into a prompt (a code block with a structured format such as CSV or JSON is often better). They are excellent, however, for instructing the system to **generate its output** in a clear tabular format, or for demonstrating such a format in few-shot examples.

**Syntax.** Use pipes to separate columns, and hyphens for the header separator line (at least three per column). Colons in the separator line control alignment.

\`\`\`
| Feature       | Benefit                           | Implementation Status |
| :------------ | :-------------------------------- | :-------------------: |
| Auto-Save     | Prevents data loss                |       Complete        |
| Collaboration | Allows team editing               |      In Progress      |
| Offline Mode  | Enables work without connectivity |        Planned        |
\`\`\`

**Prompt engineering example: instructing the system to generate a comparison table.**

\`\`\`
### INSTRUCTION ###
Compare Option A and Option B based on the criteria: Cost, Ease of Use, and Key
Advantage. Present the comparison as a Markdown table with columns:
'Criterion', 'Option A', 'Option B'.

### CONTEXT ###
Option A Details: [Details...]
Option B Details: [Details...]

### COMPARISON TABLE OUTPUT ###
\`\`\`

**Workshop note.** Clearly instruct the system to generate a Markdown table and name the required columns in the instruction. A few-shot example showing the table structure is the most reliable way to get correct formatting when the structure is critical.

## 9. Escaping Markdown characters: referring to literals

**Purpose.** Occasionally you need to include a literal asterisk, backtick, hash, underscore or backslash in your prompt's text without Markdown reading it as a formatting command. The backslash is the escape character.

**Syntax.** Put a backslash immediately before the character you want to display literally: \`\\*\`, \`\\_\`, a backslash before a backtick, \`\\#\` and \`\\\\\`.

**Prompt engineering example: asking about specific syntax.**

\`\`\`
### INSTRUCTION ###
Explain the difference between using single asterisks (\\*italic\\*) and double
asterisks (\\*\\*bold\\*\\*) for emphasis in standard Markdown syntax.
\`\`\`

**Workshop note.** You will mostly need this when you write instructions about Markdown itself, or when you need these special characters literally in text outside a code block. Inside code blocks these characters are usually treated literally anyway.

## The carpenter's marking tools

Think of Markdown as the marking and layout tools of your prompt engineering workshop: the pencil, the square, the chalk line. They do not build the structure themselves, but they let you lay out your design clearly, mark components accurately, define boundaries precisely, and make sure all the parts of a complex instruction fit together.

Mastering these simple elements gives you crucial control over a prompt's **structure, clarity and delimitation**. Consistent use of headings, lists, emphasis and above all fenced code blocks turns a potentially confusing stream of text into well-organized, unambiguous instructions. It is a simple syntax that enables sophisticated communication, and an indispensable skill for the advanced prompt engineer. Use these tools wisely and consistently, and the quality and reliability of your prompt constructions will improve significantly.

**Try this:** ask a system for a comparison of two options as a Markdown table with named columns, then repeat with one example row and compare the two results.`,
  },
];

export const MARKDOWN_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "which-tool-isolates-input",
    kind: "choice",
    title: "The most versatile fence",
    promptText: "Which Markdown element does the book call arguably the most versatile tool for prompt engineering, both to show literal text and to isolate user input from your instructions?",
    public: {
      options: ["Headings", "Emphasis", "Fenced code blocks", "Tables"],
    },
    answer: { correct: 2 },
    explanation: "Fenced code blocks preserve text exactly as written and act as clear, unambiguous fences around user input, documents and examples. That separation matters for reliability and for security.",
  },
  {
    slug: "syntax-recall",
    kind: "fill",
    title: "Recall the syntax",
    promptText: "Choose the markup that produces each element.",
    public: {
      template: "Italics: {{a}}\nBold: {{b}}\nA heading of level three: {{c}}\nA line of blockquote: {{d}}\nA fenced code block opens with: {{e}}",
      blanks: [
        { id: "a", choices: ["*text*", "**text**", "> text", "### text"] },
        { id: "b", choices: ["*text*", "**text**", "> text", "### text"] },
        { id: "c", choices: ["*text*", "**text**", "> text", "### text"] },
        { id: "d", choices: ["*text*", "**text**", "> text", "### text"] },
        { id: "e", choices: ["```", "---", "***", "___"] },
      ],
    },
    answer: { correct: { a: "*text*", b: "**text**", c: "### text", d: "> text", e: "```" } },
    explanation: "One asterisk for italics, two for bold, three hashes for a level three heading, a greater-than sign for a blockquote, and three backticks to open a fenced code block. Three hyphens, asterisks or underscores alone on a line make a horizontal rule instead.",
  },
  {
    slug: "order-a-structured-prompt",
    kind: "order",
    title: "Order the headings",
    promptText: "These headed sections come from the book's example of a structured analysis prompt. Put them in the order it uses.",
    public: {
      blocks: [
        { id: "constraints", text: "### CONSTRAINTS ###  Output format: JSON. Do not use external knowledge." },
        { id: "output", text: "### OUTPUT ###" },
        { id: "role", text: "### ROLE ###  You are an objective data analyst." },
        { id: "instruction", text: "### INSTRUCTION: Analysis Tasks ###  Perform the following analysis based ONLY on the provided data." },
        { id: "context", text: "### CONTEXT: Provided Data ###  <data> [Input data here] </data>" },
      ],
    },
    answer: { order: ["role", "context", "instruction", "constraints", "output"] },
    explanation: "Role first, then the data as context, then the instructions, then the constraints, and finally the output marker where the system's answer begins. Consistent headings give the prompt a clear visual hierarchy.",
  },
  {
    slug: "spot-the-emphasis-misuse",
    kind: "spot",
    title: "Emphasis, used well or overused?",
    promptText: "Emphasis works only when it is used judiciously. Select every line where emphasis is overused.",
    public: {
      pickPrompt: "Select every line that overuses emphasis",
      hitLabel: "Overused",
      missLabel: "Well used",
      segments: [
        { id: "m1", text: "Generate a summary based **only** on the provided text." },
        { id: "m2", text: "**Please** **write** **a** **nice** **summary** **of** **this** **text**." },
        { id: "m3", text: "**DO NOT** exceed three bullet points." },
        { id: "m4", text: "Make **everything** in this prompt **bold** so **nothing** is **missed**." },
        { id: "m5", text: "Ensure you capture the _main conclusion_ accurately." },
      ],
    },
    answer: { flawed: ["m2", "m4"] },
    explanation: "Overusing emphasis diminishes its impact. Reserve bold for the absolutely critical constraints, such as a single DO NOT or the word only, and use italics for specific terms or areas of focus.",
  },
  {
    slug: "list-for-sequential-steps",
    kind: "choice",
    title: "The right list",
    promptText: "You are writing instructions that must be followed in a fixed sequence, such as the steps of a chain of thought. Which kind of list fits best?",
    public: {
      options: [
        "A table with one column",
        "A horizontal rule between the steps",
        "A blockquote for each step",
        "An ordered list with numbers 1., 2., 3.",
      ],
    },
    answer: { correct: 3 },
    explanation: "Ordered lists are ideal for sequential instructions. Unordered bullets suit sets of criteria or examples, where order does not matter.",
  },
  {
    slug: "escape-a-literal-asterisk",
    kind: "choice",
    title: "Show a literal asterisk",
    promptText: "In ordinary prompt text outside a code block, how do you display a literal asterisk without Markdown reading it as formatting?",
    public: {
      options: [
        "Put a backslash directly before it",
        "Write it twice",
        "Wrap it in bold",
        "Put a hash sign before it",
      ],
    },
    answer: { correct: 0 },
    explanation: "The backslash is the escape character. Inside a code block such characters are treated literally anyway.",
  },
  {
    slug: "match-need-to-element",
    kind: "fill",
    title: "Match the need to the element",
    promptText: "Choose the Markdown element that fits each need.",
    public: {
      template:
        "Refer to a variable name inside a sentence: {{a}}\nKeep a customer's message visually apart from your instructions: {{b}}\nMake a quick, clean break between blocks without a heading: {{c}}\nAsk for a comparison in rows and columns: {{d}}",
      blanks: [
        { id: "a", choices: ["Inline code", "Blockquote", "Horizontal rule", "Table"] },
        { id: "b", choices: ["Inline code", "Blockquote", "Horizontal rule", "Table"] },
        { id: "c", choices: ["Inline code", "Blockquote", "Horizontal rule", "Table"] },
        { id: "d", choices: ["Inline code", "Blockquote", "Horizontal rule", "Table"] },
      ],
    },
    answer: { correct: { a: "Inline code", b: "Blockquote", c: "Horizontal rule", d: "Table" } },
    explanation: "Inline code marks literal names inside a sentence, a blockquote offsets quoted material, a horizontal rule separates blocks lightly, and a table is best for requesting or demonstrating tabular output.",
  },
  {
    slug: "why-markdown-matters",
    kind: "choice",
    title: "Why Markdown, in the book's words",
    promptText: "The appendix says code blocks and horizontal rules act as semantic fences. What do they separate?",
    public: {
      options: [
        "Long sentences from short sentences",
        "Trusted instructions from untrusted user input and distinct contextual elements",
        "Bold text from italic text",
        "One language model from another",
      ],
    },
    answer: { correct: 1 },
    explanation: "Fences clearly separate trusted instructions from untrusted input and from other context. That boundary is crucial for reliability and for security.",
  },
  {
    slug: "repair-with-markdown",
    kind: "repair",
    title: "Structure a messy prompt with Markdown",
    promptText: "Rewrite this run-on prompt using Markdown: headings for the sections, numbered steps, bold for the one critical constraint, and a fenced block that isolates the customer's email.",
    public: {
      starter: "Summarize the customer email and list the action items and dont go over three bullet points here is the email: Hi I would like to reset my password but the link does not work please help",
      hint: "Give the instruction and the email their own headings, number the steps, bold the limit, and put the email inside a fenced block.",
    },
    answer: {
      criteria: [
        { id: "headings", label: "Uses headings for the sections", weight: 2, anyOf: ["###", "(^|\\n)\\s*#{1,4}\\s"], hint: "Give each section a heading such as ### INSTRUCTION ### and ### CUSTOMER EMAIL ###." },
        { id: "emphasis", label: "Bolds the critical constraint", weight: 2, anyOf: ["\\*\\*[^*\\n]+\\*\\*", "__[^_\\n]+__"], hint: "Wrap the one critical limit in double asterisks." },
        { id: "steps", label: "Numbers the steps", weight: 2, anyOf: ["(^|\\n)\\s*1\\.[^\\n]*\\n\\s*2\\."], hint: "Start lines with 1. and 2. for the steps." },
        { id: "fence", label: "Isolates the email in a fence", weight: 2, anyOf: ["```", "(^|\\n)>\\s", "<[a-z_]+>"], hint: "Put the email inside a fenced block with three backticks, or quote it." },
        { id: "limit", label: "States the limit of three bullet points", weight: 1, anyOf: ["\\b(three|3)\\b[^.\\n]{0,20}\\b(bullet|points|items)\\b", "\\b(do not|don't|no more than|at most|maximum)\\b"], hint: "Say clearly that there must be no more than three bullet points." },
      ],
      model:
        "### INSTRUCTION ###\nFollow these steps:\n1. Summarize the customer email in the block below.\n2. List the action items.\n**DO NOT** exceed three bullet points.\n\n### CUSTOMER EMAIL ###\n```text\nHi I would like to reset my password but the link does not work please help\n```",
    },
    explanation: "A structured prompt separates the instruction from the data with headings, numbers the steps, stresses the single critical constraint in bold and isolates the customer's text in a fence, so the system cannot mistake it for instructions.",
    samples: {
      good: [
        "## Task\n1. Summarize the email below.\n2. List the action items, no more than three bullet points.\n\n## Email\n> Hi I would like to reset my password but the link does not work please help\n\n**Never** invent details.",
      ],
      bad: ["Summarize this email please and keep it short.", "### TASK ###\nSummarize this email."],
    },
  },
];

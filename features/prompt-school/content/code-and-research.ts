/**
 * Chapter "Prompting for Code and Research" (book chapter 6, "Domain-Specific Prompting: Tailoring the Craft"): 7 lessons
 * and 10 exercises, written from the Director's book, which is the only source. Every section of the chapter is covered
 * (see book-map.ts): coding assistance at the Blacksmith's Forge, and research and analysis through the Archivist's Lens
 * (RAG principles). Code examples are shown in fenced blocks. No em dashes (writing rule, PDL-057).
 * `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const CODE_RESEARCH_LESSONS: LessonContent[] = [
  {
    slug: "tailoring-the-craft-the-blacksmiths-forge",
    title: "Tailoring the craft: the blacksmith's forge",
    minutes: 7,
    covers: ["ch6-intro", "ch6-coding-forge", "ch6-why-prompt-for-code"],
    body: `You now know the anatomy of a prompt, the foundational techniques, the methods for guiding complex reasoning and the importance of structure for clarity and security. The next stage is to **adapt the craft to specific domains of application**.

Think of a skilled woodworker. They know the properties of wood, they are proficient with saws, planes and chisels, and they know how to join and finish. But building a delicate violin needs a different focus, different tolerances and specialized variations of technique compared with building a sturdy timber-framed house. The core principles remain, but their application is tailored to the demands of the domain.

Effective prompt engineering is the same. The five pillars and the methods you have learned form a universal toolkit. But leveraging language systems for specialized work, such as helping with programming or doing in-depth research analysis, means adapting your approach. Each domain has its own conventions, types of complexity, criteria for success and pitfalls.

## Two domains in this chapter

1. **Coding assistance, "The Blacksmith's Forge: hammering out code snippets."** How to use prompts to generate, explain, debug and translate code, treating the system as a powerful but often imprecise tool that needs careful guidance, much as a blacksmith shapes metal with specific tools and controlled force.
2. **Research and analysis, "The Archivist's Lens: augmenting analysis with retrieved knowledge (RAG principles)."** How prompts help navigate, summarize and interpret large bodies of text, particularly academic literature and technical reports, by aiming the system's comprehension at specific documents.

The point is not just new tricks but learning to think strategically about applying your foundations to the challenges of different kinds of complex work.

## 1. Coding assistance: the blacksmith's forge

A blacksmith stands before a glowing forge, tongs in hand, ready to shape raw iron. The iron holds potential: a tool, a hinge, a decorative scroll. But it needs skill to realize it. The smith applies **heat** (understanding the context and preparing the material), uses specific **tools** (hammers of different weights, forms, punches), and applies **controlled force** (instructions and techniques) to transform the metal gradually. It is iterative: heat, hammer, observe the shape, perhaps reheat and adjust, quench to finalize. Success depends on a clear goal, the right techniques, and an understanding of the material's properties and limits.

Working with a language system on code looks strikingly similar. These systems were trained on vast repositories of public code (think GitHub, technical documentation, programming forums), so they hold extensive raw knowledge of languages, syntax, common libraries and standard algorithms. They can often produce plausible snippets, explain existing code or suggest fixes. But that capability is like the smith's raw iron: it needs precise shaping through skillful prompting.

Your prompt is the blacksmith's toolkit and technique:

- **Context is the heat.** Specify the programming language (Python, JavaScript, C++), the libraries or frameworks involved (React, Pandas) and the overall goal or environment.
- **Instructions are the hammer blows.** "Write a function to...", "Explain this code block...", "Find the bug causing...", "Translate this snippet to...".
- **Few-shot examples are the shaping forms.** They demonstrate required styles, output formats or specific logic patterns.
- **Tags** request structured explanations.
- **Iterative refinement is the inspection of the cooling metal.** Test the generated code, analyze its flaws, adjust the prompt and regenerate until the result is forged.

## Why prompt for code? Leveraging trained patterns

The system's ability comes from pattern recognition. It has learned the statistical likelihood of code sequences in Python, the common structure of HTML documents, the syntax of SQL queries, and how developers typically explain code in comments and documentation. A well-crafted prompt activates those learned patterns effectively.

**Try this:** think of a small script you would like to have. Write down its language, its inputs and its expected output before you read the next lesson.`,
  },
  {
    slug: "four-techniques-for-the-forge",
    title: "Four techniques for the forge",
    minutes: 7,
    covers: ["ch6-technique-context", "ch6-technique-instructions", "ch6-technique-few-shot", "ch6-technique-structured-explanations"],
    body: `## 1. Context is non-negotiable: setting the heat

- **Language is paramount.** Always state the programming language(s). "Write code" is useless. "Write a Python function" is the starting point.
- **Libraries and frameworks matter.** Saying "using the requests library in Python" or "within a React component" drastically focuses the output.
- **Environment and goal.** Where will this run? What should it accomplish? Compare "Generate HTML for a button" with "Generate the HTML and JavaScript for a button that submits form data via AJAX".
- **Surrounding code.** When you ask about part of a program, provide the relevant surrounding context (function definitions, variable declarations) using delimiters.

## 2. Precision in instructions: the hammer blows

- **Action verbs.** Use clear commands: Write, Explain, Debug, Optimize, Translate, Refactor, Document, Generate.
- **Define requirements.** Be explicit about inputs (arguments, data types), expected outputs (return values, side effects), data structures, algorithms if specific, error handling and style preferences.
  - Vague: "Make a list unique."
  - Precise: "Write a Python function \`remove_duplicates\` that takes a list \`my_list\` as input and returns a *new* list containing only the unique elements from \`my_list\` in their original order. Do not modify the original list."

## 3. Few-shot examples: shaping forms for code

Crucial for controlling subtleties:

- **Coding style and conventions.** Demonstrate the indentation, naming (camelCase or snake_case), commenting style, use of specific language features or object-oriented patterns you need. Systems tend to default to the most common style in their training data, which may not match your project.
- **Specific data transformations.** Show exactly how to parse input strings into the wanted data structures, or how to format output data.
- **Complex logic patterns.** Illustrate a tricky algorithmic pattern or specific API usage you want followed.

## 4. Structured explanations: the Dewey Decimal System again

Use tagging to request organized explanations about code, separating purpose, parameters, logic steps and return values. This is invaluable for understanding generated or unfamiliar code. It applies exactly what you learned about tagged output.

## Putting the four together

A strong coding prompt states the language and libraries (context), names an action verb and the exact inputs, outputs and error handling (instructions), shows one small example when style matters (few-shot), and asks for an explanation in labelled parts (tags). Each element removes one way the system could guess wrong.

**Try this:** take a vague coding request of yours, such as "make a list unique", and rewrite it with language, inputs, outputs and one rule about what must not change.`,
  },
  {
    slug: "common-tasks-at-the-forge",
    title: "Common tasks at the forge",
    minutes: 9,
    covers: ["ch6-task-code-generation", "ch6-task-code-explanation", "ch6-task-debugging", "ch6-task-translation", "ch6-task-documentation"],
    body: `Five common tasks, each with its prompt strategy and the book's example.

## Code generation: forging new tools

**Prompt.** A detailed natural-language description of the desired function or script. Specify the language and the inputs and outputs clearly. Start simple, and build complexity iteratively if needed. **Techniques:** clear instructions and context, with few-shot for style.

\`\`\`
### INSTRUCTION ###
Write a Python function calculate_bmi(weight_kg, height_m) that takes weight in
kilograms and height in meters.
It should calculate the Body Mass Index (BMI) using the formula:
weight / (height * height).
The function must return the calculated BMI rounded to one decimal place.
Include basic error handling: if height_m is zero or negative, return None.
Provide only the function code block.

### PYTHON CODE ###
\`\`\`

## Code explanation: understanding the craftsmanship

**Prompt.** Provide the snippet inside Markdown code fences with the language name, and ask for an explanation at a specific level of detail or for a specific audience ("explain simply", "line by line", "explain the algorithm"). **Techniques:** context (the code), clear instructions, and tagging for structured output.

\`\`\`\`
### INSTRUCTION ###
Explain the purpose and main logic flow of the following JavaScript code snippet.
Target audience is someone familiar with basic programming but new to JavaScript
Promises.

### JAVASCRIPT CODE ###
\`\`\`javascript
function fetchData(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Data received:', data);
      return data;
    })
    .catch(error => {
      console.error('Fetch error:', error);
      // Maybe return a default value or re-throw
      return null;
    });
}
\`\`\`

### CODE EXPLANATION ###
\`\`\`\`

## Debugging: finding flaws in the metal

**Prompt.** Provide the buggy code. Describe the symptom clearly (what it should do versus what it does). Provide example inputs with expected and actual outputs. Ask the system to identify the potential bug, explain the error and suggest a fix. **Techniques:** rich context (code, symptoms, examples), clear instructions, and chain of thought ("Think step-by-step...") which can help the system trace the logic.

\`\`\`\`
### CONTEXT ###
The following Python function aims to return a list of even numbers from an input
list.
Input: [1, 2, 3, 4, 5, 6]   Expected Output: [2, 4, 6]   Actual Output: [6]

### BUGGY PYTHON CODE ###
\`\`\`python
def get_evens(numbers):
    evens = []
    for num in numbers:
        if num % 2 == 0:
            evens = [num]  # <--- Suspected BUG: Resets list each time
    return evens
\`\`\`

### INSTRUCTION ###
1. Identify the bug in the provided Python code causing it to return only the
   last even number.
2. Explain why this bug occurs.
3. Provide the corrected Python code.

### DEBUGGING ANALYSIS AND FIX ###
\`\`\`\`

## Code translation: recasting the metal

**Prompt.** Provide the source snippet. State the source and target languages clearly. Ask to translate or convert. **Techniques:** context (the code and languages), clear instructions. Few-shot examples help a lot when specific library mappings or syntactic idioms need to be demonstrated for an accurate translation.

\`\`\`\`
### INSTRUCTION ###
Convert the following Java code snippet to its functional equivalent in Python 3.

### JAVA CODE ###
\`\`\`java
int sum = 0;
for (int i = 1; i <= 10; i++) {
    sum += i;
}
System.out.println("Sum is: " + sum);
\`\`\`

### PYTHON 3 EQUIVALENT CODE ###
\`\`\`\`

## Documentation and commenting: polishing the work

**Prompt.** Provide the code. Ask to add documentation comments (such as Python docstrings or Javadoc) or inline comments explaining specific parts. **Techniques:** context (the code), clear instructions. Few-shot examples are almost essential for enforcing a specific documentation style, format and level of detail.

\`\`\`\`
### INSTRUCTION ###
Add standard Python docstrings to the function below. The docstring should explain
the function's purpose, its parameters (data and threshold), and what it returns.
Follow PEP 257 conventions.

### PYTHON FUNCTION (Undocumented) ###
\`\`\`python
def filter_data(data, threshold):
    results = []
    for item in data:
        if item > threshold:
            results.append(item)
    return results
\`\`\`

### FUNCTION WITH DOCSTRING ###
\`\`\`\`

**Try this:** pick the task that matches something you actually need and adapt the example by changing the language, the inputs and one rule.`,
  },
  {
    slug: "working-the-forge-responsibly",
    title: "Working the forge responsibly",
    minutes: 5,
    covers: ["ch6-forge-considerations"],
    body: `The blacksmith's forge gives powerful leverage. By setting the context carefully (heating the metal), applying precise instructions and shaping examples (hammering and forming), and iteratively refining the results, you can guide a system to assist in the complex craft of software development. But there are important considerations when working the forge.

## Important considerations

- **Generated code requires verification.** This cannot be stressed enough. AI-generated code can look correct but contain subtle logical errors, inefficiencies or critical security vulnerabilities. Always treat generated code as a **draft**. It must be rigorously reviewed, understood and tested by a competent human developer before use in any real application. Never deploy AI-generated code blindly.
- **Style and idiomatic usage.** The system may generate code that works but breaks common style guidelines or the idioms of a language or project. Use few-shot examples to guide style.
- **Security is paramount.** Be extremely cautious when prompting for code related to authentication, encryption, input validation or any security-sensitive area. Assume generated code may be insecure unless security experts have verified it.
- **Training data limitations.** The system only knows what was in its training data. It may be unaware of very recent language features, new libraries or highly specialized algorithms unless you provide that information as context, for example by pasting relevant documentation snippets.
- **Assistant, not replacement.** These tools augment developer productivity. They do not replace the need to understand programming fundamentals, design principles and careful testing. Use them to overcome blocks, generate boilerplate, get explanations or brainstorm solutions, not as an infallible coding oracle.

## Who is responsible

The final responsibility for quality, correctness and security always rests with the human craftsperson. You may not write the code yourself, but you own the decision to use it.

**Try this:** for the last piece of generated code you used, write down how you checked it. If the answer is "I did not", schedule the check today.`,
  },
  {
    slug: "the-archivists-lens-retrieve-then-analyze",
    title: "The archivist's lens: retrieve, then analyze",
    minutes: 8,
    covers: ["ch6-research-archivist", "ch6-rag-workflow", "ch6-simulating-rag"],
    body: `Shift from the forge to the quiet, ordered stacks of a vast archive or research library. Imagine you must answer a highly specific question based on the latest findings in the scientific literature, or analyze a legal case from dozens of court filings and statutes. Your own memory and general knowledge, however broad, are not enough. The answer is not something you inherently know. It lives in the specific documents housed in that archive.

## Retrieve, then analyze

A meticulous researcher or archivist does not simply start writing from vague recollections. Their first, crucial step is **retrieval**: using catalogs, search indexes or databases to find the documents most likely to contain the information, for example several research papers from the last year, the specific legal precedents, or the pertinent sections of technical manuals. Only after retrieving this focused set of sources do they begin the second stage, **analysis and synthesis**. They read only the retrieved documents, compare findings, extract key evidence, and form their answer directly from those sources. They augment their reasoning with targeted information from the archive.

This two-stage process is the core of a powerful technique called **Retrieval-Augmented Generation (RAG)**. It addresses three fundamental limits of standard language models:

1. **Knowledge cutoffs.** Their training data is a snapshot in time. They know nothing about events or publications after it was completed.
2. **No specific or private access.** They were not trained on your company's internal reports, the newest niche papers, specific legal case details or your personal records.
3. **Risk of hallucination.** On topics outside their reliable knowledge, or when up-to-the-minute information is needed, they may generate plausible but factually wrong statements.

RAG mitigates these problems by grounding the generation in specific, relevant and often timely information provided when you prompt.

## The RAG workflow (conceptual)

1. **Retrieval stage.** For a query or task, a separate system, the retriever (often a sophisticated search algorithm or database query), searches a designated knowledge source (documents, a database, web pages) and retrieves the snippets or whole documents judged most relevant. This is the archivist finding the right files.
2. **Augmentation stage.** The retrieved text is injected as context into the prompt sent to the main language model.
3. **Generation stage.** The model receives the original query plus the retrieved context. Crucially, its instructions stress that it should answer or perform its task (summarize, analyze, extract) based primarily or solely on that context.

The prompt acts as the **archivist's lens**, focusing the model's powerful comprehension and generation onto the relevant information pulled from the shelves, instead of letting it rely only on its vast but possibly outdated or irrelevant internal knowledge.

## Simulating RAG through prompting: the non-coder's approach

Full RAG systems have automated retrieval components. But you can apply the core principle by hand for many research and analysis tasks:

1. **Identify the information need.** Define your question or analysis goal clearly.
2. **Manual retrieval.** You act as the archivist. Use external tools (web search, academic databases, internal company search) or your own knowledge to find the text passages or documents that hold the information. Copy the relevant text.
3. **Construct the augmented prompt.** Include:
   - **Clear instructions:** state the task (answer a question, summarize findings, compare arguments) and, critically, an instruction to base the response **only** on the provided context.
   - **The retrieved context:** paste the gathered text into the prompt, with clear delimiters (\`<document id="1">...</document>\`, or \`### SOURCE TEXT A ### ... ### END SOURCE TEXT A ###\`) to separate several pieces of context and set them apart from the instructions.
   - **The original query or task:** restate clearly the question you want answered or the analysis to perform.

**Try this:** pick a question your work depends on that you could answer from one document. Find the document and note which paragraphs matter.`,
  },
  {
    slug: "applying-the-archivists-lens",
    title: "Applying the archivist's lens: three examples",
    minutes: 8,
    covers: ["ch6-example-policy", "ch6-example-abstracts", "ch6-example-climate"],
    body: `Three worked examples show the augmented prompt in action.

## Example 1: answering a question from a specific policy document

\`\`\`
### INSTRUCTION ###
You are an assistant explaining company policy. Answer the user's question below
based **strictly and solely** on the official 'Work From Home Policy - 2024 Update'
provided in the <policy_doc> tags. If the policy text doesn't cover the specific
question, state that the information is not available in this document. Do not use
any other knowledge.

### CONTEXT: POLICY DOCUMENT ###
<policy_doc>
**Work From Home Policy - 2024 Update**
... (excerpt) Employees approved for remote work must maintain a dedicated,
safe workspace. Internet connectivity costs up to 50 BAM/month may be reimbursed
with receipts. Company equipment (laptop, monitor) must be used for all work
activities; personal device use for company work is prohibited... (rest of
relevant policy section) ...
</policy_doc>

### USER QUESTION ###
<user_query>
Can I get reimbursed for buying a new ergonomic chair for my home office if I
work remotely?
</user_query>

### ANSWER (Based ONLY on Policy Document) ###
\`\`\`

Expected output: based solely on the provided text, the policy mentions reimbursement for internet costs but not for chairs, so the answer should say that chair reimbursement is not covered in this excerpt. Notice the instruction that tells the system what to do when the document is silent. That is what prevents a made-up answer.

## Example 2: summarizing findings from several research abstracts

\`\`\`
### INSTRUCTION ###
You are a research assistant summarizing recent findings. Read the following three
abstracts on the topic of using AI for medical image analysis, provided within
<abstract> tags.
Generate a concise summary (approx. 3-4 sentences) highlighting the main approaches
or key results mentioned across these specific abstracts. Base your summary **only**
on the information present within these three provided texts.

### CONTEXT: PROVIDED ABSTRACTS ###
<abstract id="MedImgAI_1">
[Text of Abstract 1, e.g., focuses on using CNNs for tumor detection in scans,
reports high accuracy...]
</abstract>
<abstract id="MedImgAI_2">
[Text of Abstract 2, e.g., discusses using transformers for segmenting organs in
MRIs, mentions challenges with limited data...]
</abstract>
<abstract id="MedImgAI_3">
[Text of Abstract 3, e.g., explores federated learning approach to train models on
hospital data without sharing raw images, reports promising privacy-preserving
results...]
</abstract>

### TASK ###
Summarize the main AI techniques or findings described in these three abstracts for
medical image analysis.

### SUMMARY OF PROVIDED ABSTRACTS ###
\`\`\`

Expected output: a brief summary that mentions CNNs for detection, transformers for segmentation and federated learning for privacy, reflecting only the content of the provided abstracts. Each abstract carries an id, which makes it easy to trace a claim back to its source.

## Example 3: extracting climate trends from abstracts (refined)

This builds on the concept with the manual retrieval plus augmented prompt approach.

**Workflow.**

1. *Manual retrieval:* the researcher uses a database to find five recent abstracts on "Arctic sea ice melt pond impact modeling" and copies their text.
2. *Prompt construction:* the researcher writes this prompt.

\`\`\`
### INSTRUCTION ###
You are an AI climate science research assistant. Analyze the following five abstracts
(from 2022-2024) concerning the impact of melt ponds on Arctic sea ice modeling,
provided within <abstract> tags below.
Identify and list key recurring challenges, emerging modeling techniques, or
significant findings mentioned across **multiple** of these specific abstracts. Your
analysis must be based **solely** on the information contained within these five
provided texts. List each identified trend/challenge as a bullet point.

### CONTEXT: PROVIDED ABSTRACTS ###
<abstract paper_id="Paper1_2023"> [Text of Abstract 1...] </abstract>
<abstract paper_id="Paper2_2022"> [Text of Abstract 2...] </abstract>
<abstract paper_id="Paper3_2024"> [Text of Abstract 3...] </abstract>
<abstract paper_id="Paper4_2023"> [Text of Abstract 4...] </abstract>
<abstract paper_id="Paper5_2024"> [Text of Abstract 5...] </abstract>

### TASK ###
List the recurring themes, challenges, or trends in modeling melt pond impacts found
across these abstracts.

### IDENTIFIED THEMES/CHALLENGES ###
\`\`\`

Expected output: a bulleted list identifying themes such as challenges in parameterizing albedo, the use of remote sensing data, coupling with ocean models and so on, if these appear across several of the provided abstracts. Note the word **multiple** in the instruction: it asks for recurring themes, not a summary of one paper.

**Try this:** adapt example 1 to a document of yours, keeping the sentence that says what to do when the document does not cover the question.`,
  },
  {
    slug: "large-documents-and-adapting-the-craft",
    title: "Large documents, the power of the lens and adapting the craft",
    minutes: 8,
    covers: ["ch6-large-documents", "ch6-power-of-lens", "ch6-key-considerations", "ch6-adapting-craft"],
    body: `## Handling large documents: strategies for extensive context

A significant practical challenge with manual RAG is the model's **context window limit**. You often cannot paste a whole 30-page report, or several full research papers, into one prompt. Four strategies help.

1. **Manual pre-summarization or selection.** Read the large document first and identify only the sections or paragraphs relevant to your specific question. Paste only those key excerpts into the context section. It takes more human effort but makes sure the most critical information fits.
2. **Chunking and sequential prompting.** Break the document into smaller, logically coherent chunks (by section, chapter or group of paragraphs).
   - Process each chunk with a focused prompt, such as "Summarize the key findings in this chunk" or "Extract any mention of [topic] from this chunk".
   - Then use a final prompt to synthesize the results: "Based on the following summaries of each section [paste section summaries], provide an overall conclusion." This mimics the chunking strategies of automated RAG.
3. **Focused prompts.** Instead of analyzing the whole document at once, ask very specific questions likely answerable from smaller portions of text, and run several focused prompts rather than one large analytical prompt.
4. **More advanced tools.** Very large documents often need dedicated RAG software that automates retrieval, chunking, embedding and context injection. We focus on prompting principles here, but such tools exist for large-scale tasks.

The key is to make sure the information most relevant to your specific question is present in the context you give the model, even if that means manually selecting or summarizing parts of a larger source first.

## The power of the archivist's lens

- **Factual grounding.** It dramatically reduces the risk of hallucination by forcing reliance on the provided text.
- **Timeliness and specificity.** It enables reasoning about information that is not in the original training data, such as recent publications or private documents.
- **Trust and verifiability.** It makes it easier to trace answers back to the source material provided in the prompt.

## Key considerations

- **Retrieval quality is paramount.** The whole process hinges on retrieving the correct, relevant information first. If your manual retrieval pulls irrelevant documents, the augmented prompt will fail.
- **Context limits.** Always be aware of the model's context window size.
- **Conflicting information.** If the retrieved documents contradict each other, your prompt must say how to handle it, for example "Note any disagreements found" or "Prioritize the most recent source".
- **Prompting still matters.** Even with perfect context, clear instructions and possibly examples for the analysis part are still needed for high-quality output.

The archivist's lens approach, embodying RAG principles, is a cornerstone technique for reliable, evidence-based interaction with language systems, especially in research, analysis and any situation that demands high factual accuracy or the use of specific knowledge sources. By consciously retrieving relevant information and carefully prompting the system to reason from that context, you turn a potentially unreliable generalist into a focused, document-grounded analytical assistant.

## Adapting the craft to the material

This chapter showed the necessity and effectiveness of tailoring prompt engineering to specific domains. Like a master craftsperson choosing the right tools and methods for different materials and projects, the skilled prompt engineer adapts to the unique demands of the task.

- At **the forge of coding assistance**, precision is key. Clear context (language, libraries), highly specific instructions and illustrative few-shot examples, especially for style, are essential for functional, correct snippets or explanations. Yet the output must always be treated as a draft requiring rigorous human verification, because of the potential for subtle errors or security flaws.
- Through **the archivist's lens**, the focus shifts to grounding the system in specific evidence. Retrieving relevant documents and instructing the system to base its analysis solely on that context is crucial for factual accuracy, for working with specialized or recent information and for mitigating hallucinations. Strategies for large documents become important practical considerations.

Across both domains, and in any specialized application, the foundations stay constant: clear **context**, precise **instructions**, well-chosen **examples**, appropriate **constraints** and unambiguous **delimiters**. Advanced techniques such as chain of thought or simulated tree of thoughts can be applied inside these domains to guide more complex reasoning when needed. The art lies in skillfully selecting and combining these elements, informed by an understanding of both the prompt engineering techniques and the requirements of the domain itself.

In one line: two domain-specific applications, coding assistance using the blacksmith's forge techniques (context, instructions, examples), and research analysis using the archivist's lens RAG method for grounded insights.

**Try this:** choose one domain you work in and list its conventions, its typical pitfalls and its criteria for success. Those three lists are what your prompts must carry.`,
  },
];

export const CODE_RESEARCH_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "the-precise-coding-prompt",
    kind: "choice",
    title: "The precise coding request",
    promptText: "Which of these requests gives a coding assistant the best starting point?",
    public: {
      options: [
        "Write code that removes duplicates.",
        "Make my list unique, thanks.",
        "Write a function for lists.",
        "Write a Python function remove_duplicates(my_list) that returns a new list of the unique elements in their original order, without modifying the original list.",
      ],
    },
    answer: { correct: 3 },
    explanation: "It names the language, the function, the input, the output, the ordering rule and what must not change. \"Write code\" is useless, and \"write a Python function\" is only the starting point.",
  },
  {
    slug: "match-the-coding-task",
    kind: "fill",
    title: "Match the task to its prompt",
    promptText: "Each line describes how a prompt for a common coding task is built. Choose the task.",
    public: {
      template:
        "{{a}}: give the buggy code, describe the symptom, and add the expected versus the actual output.\n{{b}}: state the source and the target language and ask to convert.\n{{c}}: ask for docstrings that follow a named convention such as PEP 257.\n{{d}}: describe the function in words, with the language, the inputs and the outputs.\n{{e}}: paste the code in a fenced block and name the audience and the level of detail.",
      blanks: [
        { id: "a", choices: ["Debugging", "Code translation", "Documentation", "Code generation", "Code explanation"] },
        { id: "b", choices: ["Debugging", "Code translation", "Documentation", "Code generation", "Code explanation"] },
        { id: "c", choices: ["Debugging", "Code translation", "Documentation", "Code generation", "Code explanation"] },
        { id: "d", choices: ["Debugging", "Code translation", "Documentation", "Code generation", "Code explanation"] },
        { id: "e", choices: ["Debugging", "Code translation", "Documentation", "Code generation", "Code explanation"] },
      ],
    },
    answer: { correct: { a: "Debugging", b: "Code translation", c: "Documentation", d: "Code generation", e: "Code explanation" } },
    explanation: "Each task has its own context: a debugging prompt needs symptoms and examples, a translation names both languages, documentation names a convention, generation needs a precise specification, and an explanation needs the code and an audience.",
  },
  {
    slug: "spot-the-responsible-statements",
    kind: "spot",
    title: "What the book says about generated code",
    promptText: "Select every statement the book agrees with.",
    public: {
      pickPrompt: "Select every statement the book agrees with",
      hitLabel: "The book agrees",
      missLabel: "The book disagrees",
      segments: [
        { id: "g1", text: "Treat generated code as a draft that a competent human must review and test." },
        { id: "g2", text: "If the code runs once without an error, it is safe to deploy." },
        { id: "g3", text: "Be extremely cautious with code for authentication and encryption." },
        { id: "g4", text: "The system knows every new library, so there is no need to paste documentation." },
        { id: "g5", text: "These tools are assistants, not replacements for understanding programming fundamentals." },
      ],
    },
    answer: { flawed: ["g1", "g3", "g5"] },
    explanation: "Generated code can look right and hide subtle errors or security flaws, so it needs review and testing. Security-sensitive code deserves extra caution. The system only knows its training data, so recent libraries need context, and the tools augment developers rather than replace them.",
  },
  {
    slug: "order-the-rag-stages",
    kind: "order",
    title: "The three stages of RAG",
    promptText: "Put the stages of Retrieval-Augmented Generation in order.",
    public: {
      blocks: [
        { id: "generation", text: "Generation: the model answers from the query plus the retrieved context" },
        { id: "retrieval", text: "Retrieval: a retriever finds the most relevant snippets or documents" },
        { id: "augmentation", text: "Augmentation: the retrieved text is injected as context into the prompt" },
      ],
    },
    answer: { order: ["retrieval", "augmentation", "generation"] },
    explanation: "The archivist first finds the right files, then places them in front of the model, which then answers grounded in them.",
  },
  {
    slug: "the-key-rag-instruction",
    kind: "choice",
    title: "The crucial instruction",
    promptText: "What is the crucial instruction in an augmented, RAG-style prompt?",
    public: {
      options: [
        "Answer as fast as possible",
        "Use as many outside sources as you can find",
        "Base the response only on the provided context documents",
        "Ignore the documents if you know better",
      ],
    },
    answer: { correct: 2 },
    explanation: "Grounding is the point. The instruction to rely only on the provided text is what reduces hallucination and keeps answers traceable to the sources.",
  },
  {
    slug: "order-manual-rag",
    kind: "order",
    title: "Manual RAG for a non-coder",
    promptText: "Put the three steps of simulating RAG by hand in order.",
    public: {
      blocks: [
        { id: "construct", text: "Construct the augmented prompt: instructions, delimited context, the original question" },
        { id: "need", text: "Identify the information need" },
        { id: "retrieve", text: "Retrieve manually: find and copy the relevant passages" },
      ],
    },
    answer: { order: ["need", "retrieve", "construct"] },
    explanation: "Know what you need, act as the archivist to find the passages, then build the prompt with instructions, delimited context and the question.",
  },
  {
    slug: "the-chair-question",
    kind: "choice",
    title: "The document is silent",
    promptText: "The policy excerpt covers reimbursement of internet costs only. A user asks whether a new ergonomic chair can be reimbursed. What should a correctly grounded answer say?",
    public: {
      options: [
        "Yes, most companies reimburse chairs",
        "The provided policy does not cover chairs, so that information is not available in this document",
        "No, and the company never reimburses anything",
        "Yes, up to 50 BAM a month",
      ],
    },
    answer: { correct: 1 },
    explanation: "A grounded answer reports what the document says, and says so when it is silent. The instruction to state that the information is not available prevents an invented answer.",
  },
  {
    slug: "spot-large-document-strategies",
    kind: "spot",
    title: "A 30-page report and a small context window",
    promptText: "The report does not fit into one prompt. Select every strategy the book recommends.",
    public: {
      pickPrompt: "Select every recommended strategy",
      hitLabel: "Recommended",
      missLabel: "Not recommended",
      segments: [
        { id: "l1", text: "Read it first and paste only the sections relevant to your question." },
        { id: "l2", text: "Split it into chunks, summarize each, then synthesize the summaries." },
        { id: "l3", text: "Paste it all anyway and hope the model copes." },
        { id: "l4", text: "Ask several very specific questions, each answerable from a small portion." },
        { id: "l5", text: "Ask the model to guess the parts that did not fit." },
      ],
    },
    answer: { flawed: ["l1", "l2", "l4"] },
    explanation: "Manual selection, chunking with a final synthesis, and focused prompts all keep the relevant information inside the context window. Pasting everything or asking for guesses breaks the grounding.",
  },
  {
    slug: "conflicting-sources",
    kind: "choice",
    title: "Two sources disagree",
    promptText: "Two retrieved documents contradict each other. What should your prompt do?",
    public: {
      options: [
        "Tell the system how to handle it, for example note any disagreements or prioritize the most recent source",
        "Nothing, the system will pick the right one",
        "Delete both documents",
        "Ask the system to average the two",
      ],
    },
    answer: { correct: 0 },
    explanation: "Even with perfect context, prompting still matters. If sources conflict you must say how to handle it, for instance by noting disagreements or preferring the most recent source.",
  },
  {
    slug: "repair-grounded-prompt",
    kind: "repair",
    title: "Ground the question in the document",
    promptText: "Rewrite this question as an augmented prompt: fence the policy document and the user's question, tell the system to answer only from the document, and say what to do when the document does not cover it.",
    public: {
      starter: "Can I get money back for a new office chair?",
      hint: "Add the document inside tags, put the question in its own tags, say to answer strictly from the document, and add a rule for when the document is silent.",
    },
    answer: {
      criteria: [
        { id: "only", label: "Tells the system to answer only from the provided document", weight: 3, anyOf: ["\\b(only|solely|strictly)\\b[^.\\n]{0,80}\\b(provided|policy|document|context|text)\\b"], hint: "Say to answer strictly and solely from the provided document." },
        { id: "fence", label: "Fences the document", weight: 2, anyOf: ["<policy[a-z_]*>", "<document[^>]*>", "<context>", "###\\s*(context|source|policy)"], hint: "Put the document inside tags such as <policy_doc> or under a clear heading." },
        { id: "silent", label: "Says what to do when the document does not cover the question", weight: 2, anyOf: ["\\bdoes(n't| not) (cover|say|mention|address)\\b", "\\b(is not|isn't|not) (covered|available|mentioned)\\b", "\\bstate that\\b", "\\btell me\\b[^.\\n]{0,40}\\b(not|isn't)\\b"], hint: "Add a rule such as: if the document does not cover it, state that the information is not available." },
        { id: "question", label: "Fences the question", weight: 1, anyOf: ["<user[a-z_]*>", "<question>", "###\\s*(user\\s+)?question"], hint: "Mark the question with its own tags or heading." },
        { id: "noother", label: "Forbids outside knowledge", weight: 1, anyOf: ["\\b(do not|don't|never)\\b[^.\\n]{0,40}\\b(use|rely|add)\\b[^.\\n]{0,40}\\b(other|outside|general|external|own)\\b"], hint: "Add: do not use any other knowledge." },
      ],
      model:
        "### INSTRUCTION ###\nAnswer the question below based strictly and solely on the policy document in the <policy_doc> tags. If the policy does not cover the question, state that the information is not available in this document. Do not use any other knowledge.\n\n### POLICY DOCUMENT ###\n<policy_doc>\n[paste the policy excerpt here]\n</policy_doc>\n\n### USER QUESTION ###\n<user_query>\nCan I get reimbursed for buying a new ergonomic chair for my home office?\n</user_query>",
    },
    explanation: "A grounded prompt separates the evidence from the question, makes the document the only source, and defines the behaviour when the evidence is silent. That is the archivist's lens: retrieve first, then analyze only what was retrieved.",
    samples: {
      good: [
        "Answer only from the document between the <document> tags. If it doesn't say, tell me it isn't covered.\n<document>\n[policy excerpt]\n</document>\n<question>Can I get an office chair reimbursed?</question>",
      ],
      bad: ["Answer from the policy.", "Use only the policy to answer: can I get a chair?"],
    },
  },
];

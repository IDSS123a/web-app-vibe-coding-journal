/**
 * Chapter "Tools, Multimodal and Co-Creation" (book chapter 9, "Cutting-Edge Methods: Expanding the Interaction"):
 * 5 lessons and 10 exercises, written from the Director's book. NOTE ON THE SOURCE: in the manuscript file and in the
 * corrected Word version, the detailed text of sections 1 (tool use, MRKL) and 2 (multimodal prompting, with the
 * museum case study) is replaced by the editorial placeholder "the previously approved detailed text ... should be
 * inserted here". That approved text exists in the earlier draft Prirucnik_Prompt_Engineering_B.docx, and the lessons
 * use it for those two sections, so the School teaches the full material. Every section is covered (see book-map.ts).
 * No em dashes (writing rule, PDL-057). `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const TOOLS_LESSONS: LessonContent[] = [
  {
    slug: "expanding-the-interaction-the-swiss-army-knife",
    title: "Expanding the interaction: the Swiss Army knife approach",
    minutes: 9,
    covers: ["ch9-intro", "ch9-tool-use-swiss-army", "ch9-tool-why-needed", "ch9-tool-architecture"],
    body: `You have learned the core mechanics of prompt engineering, from foundational techniques to advanced reasoning and practical matters such as structure, security and optimization. You can craft prompts as deliberate instructions that guide a language system through increasingly complex text-based tasks.

But the technological frontier keeps moving. The nature of our interaction with these systems is expanding beyond the simple exchange of text. Researchers and engineers are developing new architectures and protocols for more integrated, versatile and context-aware collaboration. Just as networked computers opened possibilities far beyond standalone calculators, these methods suggest a future where language models act less like isolated text processors and more like components inside broader, more capable systems.

Understanding these directions matters for anticipating future capabilities and for appreciating the current boundaries of text-only models and the ways those boundaries are being pushed. This chapter covers three areas:

1. **Tool use and orchestration (MRKL concepts), "the Swiss Army knife approach":** systems that coordinate several specialized software tools alongside the language model to overcome its inherent limitations.
2. **Multimodal prompting, "the theater director's craft":** interactions that include non-text data such as images, so that systems can perceive and reason about visual information together with language.
3. **Collaborative Markdown, "a hybrid syntax for human-AI co-creation":** a proposed structured notation that streamlines iterative feedback and co-creation.

These methods hint at a future where prompts become richer, more integrated instructions that direct systems using diverse tools and perceiving several facets of information.

## 1. Tool use and orchestration: the Swiss Army knife approach

Imagine you are out camping with a series of small tasks: whittle a point on a stick, tighten a loose screw on the lantern, open a can of beans and uncork a bottle of wine. You could try everything with one large knife blade, scraping wood with the edge, wedging the tip into the screw slot, puncturing the can and dangerously prying at the cork. It would be inefficient, clumsy and likely give poor results.

A much better solution is the classic **Swiss Army knife**. It does not rely on one blade for everything. It holds several specialized implements: a sharp blade for whittling, a screwdriver bit, a dedicated can opener and a corkscrew, each optimized for its task. The user, who understands the overall goal (prepare camp, have dinner), picks the right tool for each step.

**MRKL systems** (Modular Reasoning, Knowledge, and Language, pronounced "miracle") apply the same principle. Instead of relying on one enormous general-purpose language system, the single giant blade, to handle every part of a complex query, a MRKL system acts as an **orchestrator or controller**. It intelligently breaks a complex problem into parts and routes each sub-task to the specialized tool or module best equipped to handle it. It then integrates the results into the final answer.

## Why specialized tools are needed

Large language models, despite impressive capabilities, have inherent limits:

- **Arithmetic.** They can often do basic math but struggle with complex calculations or precision, sometimes making surprising errors.
- **Real-time knowledge.** Their knowledge is generally frozen at the end of training. They do not know breaking news, current stock prices or live weather.
- **Specific knowledge bases.** They have no access to proprietary databases, your personal calendar or internal company documents unless these are provided, for example through RAG.
- **Executing code.** They can write code but typically cannot run it to see the real output or debug it dynamically.
- **Logical rigor.** Complex logical deduction or symbolic reasoning can sometimes lead them astray.

Forcing one language model to overcome all of these limits at once is like using only the main blade for every job: inefficient and error-prone.

## The MRKL architecture, conceptually

- **The controller or router, the hand holding the knife.** Often a powerful language model itself. It receives the user's overall query, understands it, breaks it into sub-tasks and decides which tool each one needs. It may need to plan a sequence of tool uses.
- **The toolkit, the implements.** A collection of specialized modules or connections to external services (APIs). It might include:
  - a **calculator tool** for precise mathematics;
  - a **search engine tool**, an API connection to a web search engine to retrieve current information;
  - a **database query tool** that queries specific structured databases (a company product catalog, a scientific database) with languages such as SQL;
  - a **code interpreter tool**, a secure environment where the system can actually run generated code (for example Python) to get results, test functions or analyze data;
  - **specialized language models**, perhaps smaller models fine-tuned for translation, summarizing legal documents or creative styles;
  - **calendar and API tools** for calendars, weather, stock markets and similar services.
- **The integrator, putting it all together.** When a tool returns a result (the calculator a number, the search engine relevant snippets), the controller integrates it into the overall process. It might feed one tool's output into another, or combine several results with its own language generation to formulate the final response.

**Try this:** list three tasks you give AI systems that involve a number, a current fact or a private document. Which tool would each one need?`,
  },
  {
    slug: "tool-use-in-action",
    title: "Tool use in action, and prompting with tools in mind",
    minutes: 8,
    covers: ["ch9-tool-interaction-flow", "ch9-tool-prompting", "ch9-tool-benefits-challenges"],
    body: `## An example interaction flow: the user's experience

Imagine asking a system built on MRKL principles: "What is the current population of France, and what is that number multiplied by 3?"

1. **User query received.** The main controller model receives the query.
2. **Decomposition and planning.** The controller sees that it needs two pieces of information and one calculation: Task A, find the current population of France (needs up-to-date knowledge), and Task B, multiply the result of Task A by 3 (needs calculation).
3. **Tool selection for task A.** Finding the current population needs external, real-time knowledge, so it selects the **search engine tool** and formulates a query such as "current population of France".
4. **Tool execution for task A.** The search tool runs the search and returns results, for example snippets from official sources giving about 68.1 million.
5. **Integration and tool selection for task B.** The controller receives "68.1 million". It now needs a multiplication, so it selects the **calculator tool**, interprets the number as 68,100,000 and formulates "68100000 * 3".
6. **Tool execution for task B.** The calculator returns "204,300,000".
7. **Final synthesis.** The controller has both results and uses its language generation to compose the answer: "According to recent sources, the approximate population of France is 68.1 million. Multiplying this by 3 gives 204,300,000."

The user sees only the final answer, but behind the scenes the system acted like a skilled operator picking the right implement, search engine or calculator, for each part of the job.

## Prompting in a world with tool use

Even if you never build MRKL systems yourself, understanding the concept shapes how you prompt systems that may have these capabilities, and how you can structure complex prompts to simulate the logic.

- **Be clear about task needs.** If your query implicitly needs a calculation, up-to-date information or a specific data lookup, say so clearly. That may help the system recognize the need to use a specialized tool, if one is available.
- **Structure complex queries.** Break a complex query into steps inside your prompt, mimicking the controller's planning phase. This can help even a single large model by guiding its processing sequentially.

\`\`\`
### GOAL ###
Calculate the estimated travel time for a 300-mile road trip assuming an average
speed of 60 mph, and check the current weather forecast for the destination city,
'Exampleville'.

### INSTRUCTIONS ###
Perform the following steps:
1. **Calculate Travel Time:** Determine the time in hours needed to travel 300
   miles at an average speed of 60 mph. Show the calculation.
2. **Check Weather:** Look up the current weather forecast for Exampleville.
3. **Combine Results:** Present the calculated travel time and the weather forecast
   clearly.

### OUTPUT ###
\`\`\`

The prompt explicitly guides a sequential process that could involve a calculator step and a weather or search step.

- **Request specific tool actions (if aware).** In some advanced interfaces users may be able to suggest or request specific tools, for example "Use the web search tool to find...".
- **Use RAG as a form of tool use.** Retrieval-augmented generation is conceptually a knowledge retrieval tool: you supply the text retrieved from a specific source as context, augmenting the base model.

## Benefits of the Swiss Army knife approach

- **Overcomes model limitations.** It addresses weak math, knowledge cutoffs and the lack of real-time data by delegating to tools specialized in those areas.
- **More accuracy and reliability.** Calculations come from calculators and web data from search engines, giving more factual and dependable results.
- **Access to proprietary and live data.** It enables interaction with specific databases, APIs and the live internet.
- **Extensibility.** New tools can be added to the toolkit over time without retraining the massive controller model.
- **Efficiency, potentially.** Smaller specialized tools can be cheaper to run than forcing a giant model to do tasks it is not suited for.

## Challenges and considerations

- **Complexity.** Building and managing the orchestrator, the tools and the interfaces between them is a significant engineering challenge.
- **Error handling.** What happens if a tool fails, for example the API is down or the calculator hits an error? The controller needs robust error handling and planning.
- **Tool selection.** The controller must understand the query and reliably choose the correct tools in the right sequence. Mistakes here give incorrect results.
- **Cost.** Using several specialized models or external API calls can also cost money.
- **Transparency.** It can be harder for the end user to see how an answer was derived if several opaque tools worked behind the scenes, unless the system exposes its reasoning and tool-use steps, similar to chain of thought.

The MRKL, or Swiss Army knife, approach is a powerful shift from monolithic AI toward modular, collaborative systems. By combining the broad language understanding of large models with the specific strengths of specialized tools, these systems can tackle a wider range of complex real-world problems with greater accuracy and reliability. Understanding the concept helps you appreciate what may power increasingly capable assistants, and guides you in structuring complex prompts even for systems without explicit tool use.

**Try this:** take a question that needs both a fact lookup and a calculation, and write it as a three-step prompt like the road trip example.`,
  },
  {
    slug: "multimodal-prompting-the-theater-directors-craft",
    title: "Multimodal prompting: the theater director's craft",
    minutes: 9,
    covers: ["ch9-multimodal-theater", "ch9-multimodal-how-understand", "ch9-multimodal-examples", "ch9-multimodal-power"],
    body: `## 2. Multimodal prompting: coordinating text, images and sound

Imagine directing a scene in a play. Your main guide may be the written script, the text with dialogue and basic stage directions. But bringing the scene to life means orchestrating much more than words. You work with:

- **Actors** (visual, embodied): expressions, gestures, posture, blocking.
- **Set design** (visual context): the backdrop, furniture and props that establish the environment.
- **Lighting** (visual mood): bright or shadowy, warm or cool, conveying time of day or emotional tone.
- **Costumes** (visual character): what the actors wear, signalling period, status or personality.
- **Sound effects** (auditory cues): a ringing phone, distant thunder, creaking doors.
- **Music** (auditory mood): underscoring tension, romance or transition.

The director's craft is to weave these modalities, text, visuals and sound, into one coherent, impactful experience. Relying on the text alone would give a flat, lifeless performance.

**Multimodal prompting** brings a similar orchestrating capability to our interactions with computational systems. Traditional language models work mainly in the realm of text: text in, text out. Multimodal systems can process information in several formats beyond text, most commonly **images**, but potentially also audio, video and other data types. Multimodal prompting means crafting prompts that include these non-text inputs alongside text instructions, to guide the output. Instead of only a script, the prompt engineer acting as a theater director provides a combination of inputs, perhaps an image plus text instructions, and asks for a response that considers both.

## How do systems understand several modalities?

Multimodal systems need sophisticated architectures and training. Conceptually they must learn a shared understanding space where information from different modalities can be related:

- **Specialized encoders.** Different modules process each modality: a text encoder for language, an image encoder (often based on computer vision) for visual features, an audio encoder for sound waves.
- **Learning cross-modal relationships.** The system is trained on massive datasets of linked multimodal data: images paired with detailed captions (millions of web images with their alt text), videos paired with transcripts or descriptions, audio paired with transcriptions.
- **Fusing information.** The information from the different encoders is combined so the system can reason about relationships between modalities. It learns, for example, that the word "cat" corresponds to certain visual features, or that the transcript "loud bang" corresponds to a certain sound pattern.
- **Generating output.** The system produces output from the fused understanding: usually text (describing an image, answering a question about a video), and potentially another modality such as an image generated from a description.

## The theater director's prompt: examples with multimodal inputs

We cannot embed real images or audio in a Markdown prompt, so we use placeholders such as \`[IMAGE: description]\` and \`[AUDIO: description]\` for the non-text parts.

**Example 1: image description (basic)**

\`\`\`
### INSTRUCTION ###
Describe the following image in one sentence.

### IMAGE INPUT ###
[IMAGE: Photograph of a golden retriever puppy sleeping peacefully on a blue sofa.]

### OUTPUT DESCRIPTION ###
\`\`\`

Expected output: a sentence such as "A golden retriever puppy is sleeping soundly on a blue couch."

**Example 2: image interpretation (more complex)**

\`\`\`
### INSTRUCTION ###
Analyze the provided image. What is the main subject, what is the likely setting,
and what mood or emotion does the image evoke? Explain your reasoning briefly.

### IMAGE INPUT ###
[IMAGE: Black and white photo of an elderly man sitting alone on a park bench,
looking downcast, on a foggy autumn day.]

### IMAGE ANALYSIS ###
\`\`\`

Expected output: text identifying the subject (an elderly man), the setting (a park, likely autumn and foggy) and interpreting the mood (somber, lonely, reflective) from visual cues such as posture, expression, the black and white format and the fog.

**Example 3: image plus text instruction for creative writing**

\`\`\`
### INSTRUCTION ###
Write a short fictional story opening (around 100 words) inspired by the provided
image. The story should feature the main object in the image and have a mysterious tone.

### IMAGE INPUT ###
[IMAGE: Close-up of an old, ornate, slightly rusty key lying on weathered wooden planks.]

### STORY OPENING ###
\`\`\`

Expected output: a story opening, perhaps of someone finding the key and wondering about the lock it opens, with a mysterious atmosphere suggested by the visual elements.

**Example 4: image plus text data for information extraction**

\`\`\`
### INSTRUCTION ###
Analyze the provided product image and accompanying text details. Extract the
product name, primary color visible in the image, and listed material. Format as
key-value pairs.

### IMAGE INPUT ###
[IMAGE: Studio photograph of a bright red ceramic coffee mug with a white handle.]

### TEXT INPUT ###
Accompanying Text Data: "Introducing the 'Morning Ritual' Mug. Made from
high-quality stoneware. Capacity: 12oz."

### EXTRACTED DETAILS ###
\`\`\`

Expected output: Product Name: Morning Ritual Mug. Primary Color (from image): Red. Material (from text): Stoneware. The color comes from the image, the name and material from the text: the system fuses both sources.

**Example 5 (conceptual): audio tone plus transcript**

\`\`\`
### INSTRUCTION ###
Analyze the provided audio clip and its transcript. Based on both the words spoken
and the speaker's tone (e.g., happy, angry, sad, sarcastic), what is the speaker's
likely underlying sentiment?

### AUDIO INPUT ###
[AUDIO: Recording of someone saying "Oh, that's just great!" in a clearly dripping
sarcastic tone.]

### TEXT TRANSCRIPT ###
"Oh, that's just great!"

### SENTIMENT ANALYSIS ###
\`\`\`

Expected output: identification that, despite the positive words, the sarcastic tone indicates a negative sentiment.

## The power of orchestrating modalities

- **Richer context.** Images, sounds and video give far richer, more nuanced context than text alone: visual details, environmental cues, emotional expressions, tonal inflections.
- **Grounding in reality.** Connecting generation to visual or auditory input can ground the system's responses in concrete observation, potentially reducing hallucination and overly abstract descriptions.
- **New applications.** Tasks impossible with text alone: visual question answering, image captioning, describing scenes, generating text from a product's appearance, analyzing sentiment from tone of voice.
- **Enhanced understanding.** Requests that inherently involve visual or auditory elements, such as "What type of bird is in this picture?" or "Summarize the main points of this podcast episode".

## Directorial challenges

- **System capabilities.** Multimodal prompting depends entirely on the system having been trained for it. A text-only model will ignore or fail to process non-text input, and capability varies greatly between systems.
- **Input format.** How non-text data is actually fed in (image files, links to audio, specific encodings) depends on the platform or API and often needs technical steps beyond simple text prompting. Our placeholders simulate the idea for non-coders.
- **Complexity of fusion.** Reasoning across several modalities at once is harder than text-only reasoning. Systems may misread visual cues, struggle to connect instructions to image elements, or be confused by conflicting information across modalities.
- **Ambiguity.** Visuals and sounds can be even more ambiguous than text. An image is open to interpretation and a tone of voice can be misread. Clear text instructions remain vital.
- **Accessibility.** Relying solely on visual or auditory information can create barriers. Text alternatives and descriptions remain important.

Multimodal prompting is a significant leap toward systems that perceive and reason about the world in a way that mirrors human experience more closely. By acting as the theater director, coordinating the visual scene, the spoken dialogue and the ambient sound, you guide these systems to richer, more grounded and more context-aware outputs, unlocking a wide range of powerful new applications.

**Try this:** describe an image you have in words, then write a prompt with an [IMAGE: ...] placeholder and one clear instruction about what to extract from it.`,
  },
  {
    slug: "case-study-the-museum-exhibit-descriptions",
    title: "Case study: how a museum used multimodal prompts",
    minutes: 8,
    covers: ["ch9-museum-case-study"],
    body: `## The scenario

The "Metropolis Museum of History" was digitizing its collection and wanted engaging online exhibit pages for key artifacts. It had high-resolution photographs of each artifact and existing catalog data (object name, culture or origin, date, materials, accession number). But the existing catalog descriptions were dry, technical and unsuitable for a general public browsing the website, and writing engaging descriptions for hundreds of artifacts by hand was a daunting task.

## The goal

To generate automatically short (about 75 to 125 words), engaging and informative descriptions for the artifacts, suitable for a general online audience. The descriptions had to be factually accurate from the catalog data and also include visually interesting details observable in the photographs.

## The approach: the theater director's craft

The museum's digital team used a multimodal system that processes both images and text. They designed a prompt structure that acted as the **director's notes** for each description. For each artifact they combined:

- **Visual input, the actor and set:** a high-quality photograph, represented here as \`[IMAGE: ...]\`.
- **Textual data input, the fact sheet:** key information from the catalog database, with simple labels, represented here as \`[DATA: ...]\`.
- **Textual instructions, the director's script:** clear guidance on the desired output, including audience, tone, length and the elements to focus on.

## An example prompt: a Roman glass flask

\`\`\`
### INSTRUCTION ###
Generate an engaging exhibit description for the artifact shown in the image, using
the provided catalog data.
*   **Target Audience:** General public visiting the museum website (assume minimal
    prior knowledge).
*   **Tone:** Intriguing, accessible, educational. Briefly highlight its purpose and
    craftsmanship.
*   **Length:** Approximately 75-125 words.
*   **Content Requirements:**
    1. Identify the object using its name and origin/date from the data.
    2. Briefly explain its likely function or purpose (e.g., holding liquids).
    3. Describe at least one interesting visual feature clearly visible in the
       **IMAGE** (e.g., shape, color, iridescence, decoration).
    4. Mention the material from the data.
    5. Ensure factual accuracy based ONLY on the provided image and data. Do not add
       speculative information.

### VISUAL INPUT ###
[IMAGE: Photograph of an ancient Roman glass flask, roughly teardrop-shaped, pale
green glass, with visible iridescence on the surface due to age and burial.]

### DATA INPUT ###
[DATA: Object Name: Glass Unguentarium (Flask); Origin: Roman Empire (Syria-Palestine
region); Date: c. 1st - 2nd Century CE; Material: Blown Glass; Accession#: MH-123.45]

### EXHIBIT DESCRIPTION OUTPUT ###
\`\`\`

## How the system generated the output, conceptually

- **Image understanding.** The system analyzed the image input. It identified the object's shape (teardrop, flask-like), its color (pale green) and, importantly, the visually striking surface **iridescence**, the rainbow-like sheen common on ancient glass.
- **Text understanding.** It processed the data input and extracted the name ("Glass Unguentarium"), origin ("Roman Empire"), date ("1st to 2nd century CE") and material ("Blown Glass").
- **Instruction following.** The audience and tone shaped word choice (using "intriguing" and "ancient Romans", avoiding jargon). The length constraint was respected. Each content requirement was met: it identified the object from the data, gave the likely function ("to hold precious liquids like oils or perfumes", inferred from the object type), described the iridescence visible in the image, used the material from the data, and stuck to the provided information.

## A sample generated output (illustrative)

> Step back in time with this delicate glass flask, known as an unguentarium, crafted by artisans in the Roman Empire around the 1st or 2nd century CE. Ancient Romans likely used containers like this to hold precious scented oils or perfumes. Notice the beautiful rainbow-like sheen, called iridescence, shimmering across its pale green surface, a captivating effect created by chemical changes during centuries spent buried underground. This exquisite example of Roman blown glass offers a glimpse into daily life nearly two thousand years ago.

## Benefits realized by the museum

- **Engaging content.** Descriptions much more engaging than the dry catalog data, directly referencing visual details visitors can see in the photos.
- **Efficiency.** Automating the drafting saved curators significant time compared with writing hundreds of descriptions from scratch. Human review and editing were still necessary, but the initial generation was vastly accelerated.
- **Consistency.** A template gave a relatively consistent tone, length and structure across artifacts.
- **Improved accessibility.** The descriptive text next to each image made the online exhibit more accessible to users who rely on screen readers or have difficulty interpreting images alone.

This case shows the power of the theater director's craft: by combining visual input (the image) with factual data and clear text instructions (the script), the museum guided the system to produce rich, informative, visually grounded descriptions, improving the experience for its audience and streamlining its content workflow. It shows how moving beyond text-only prompts opens new possibilities for communication and information sharing.

**Try this:** design the same three-part prompt (image, data, script) for something you own or manage, such as a product, a room or a document.`,
  },
  {
    slug: "collaborative-markdown-and-the-principles-that-last",
    title: "Collaborative Markdown, and the principles that last",
    minutes: 9,
    covers: ["ch9-collaborative-markdown", "ch9-cmd-implications", "ch9-note", "ch9-expanding-horizon"],
    body: `## 3. Collaborative Markdown: a hybrid syntax for human-AI co-creation

MRKL concepts integrate external tools. Multimodality integrates different data types. Another cutting edge refines the very language we use to interact with the AI during iterative development and co-creation, especially in complex projects such as writing, coding or design.

Standard Markdown (the appendix you have studied) is excellent for basic formatting, and natural language conveys intent. But the back-and-forth of giving feedback, requesting specific revisions, managing constraints and tracking changes over a long collaborative session can become cumbersome and ambiguous with purely natural language feedback or simple edits.

Imagine a screenwriter and a director collaborating on a script. They do not talk vaguely. They use specific notations: "CUT scene 3", "INSERT dialogue here", "SFX: Footsteps approaching", "Revise tone, more suspenseful". This shared, concise notation streamlines communication.

**Collaborative Markdown**, as presented conceptually in the book, aims to be a similar specialized syntax: a hybrid notation system designed for the turn-by-turn interaction between a human creator and an AI assistant during a project. It blends the readability of Markdown with the precision of command-line interfaces or programming conventions, optimized on principles of cognitive science to make the iterative feedback loop faster, clearer and less error-prone.

## Core ideas

1. **Dual-use syntax.** The notation is designed to be easily written and understood by the human user and reliably parsed by the AI system.
2. **Action commands (slash commands).** Prefixes like \`/\`, similar to chat or command-line interfaces, signal specific actions: \`/generate\`, \`/revise\`, \`/add_example\`, \`/fact_check\`. Parameters may follow in an assignment syntax, such as \`section="Introduction"\` or \`tone=formal\`.
3. **Feedback notation (+, -, ≈, !).** Simple symbols as prefixes show the type of feedback or change requested:
   - \`- /remove_section\`: a clear instruction for deletion.
   - \`+ /add_detail level=high\`: a clear instruction for addition or elaboration.
   - \`≈ /rephrase style=concise\`: a clear instruction for refinement.
   - \`! /check_consistency URGENT\`: a clear instruction for priority action.

   This visual scaffolding allows rapid scanning and understanding of feedback.
4. **Context and metadata markers.** Short tags such as \`[Type:Note]\` add metadata or comments about the process or content without being part of the main instruction, for example \`[TODO: Verify this statistic]\` or \`[STYLE_REMINDER: Maintain formal tone]\`.
5. **Clear content boundaries.** Distinct multi-character markers such as \`"""START"""\` and \`"""END"""\` unambiguously enclose specific blocks of content being referenced or modified, potentially stronger than standard Markdown fences for complex nesting.
6. **Phase signaling.** Commands such as \`/draft -> /feedback -> /finalize\` signal transitions between stages of the collaborative workflow and help manage the process state.
7. **Tone modifiers (^^, !!).** Simple prefixes add an emotional or intentional layer to instructions or feedback: \`^^ Suggestion: Consider adding an analogy here\` versus \`!! Instruction: You MUST correct this factual error\`.

## Why aim for a hybrid syntax? Cognitive and practical benefits

- **Reduced ambiguity.** Structured commands (\`/generate section=X\`) are less prone to misreading than natural language requests ("Could you write the next section?").
- **Efficiency.** Concise symbols (+, -, ≈) convey intent faster than full sentences of feedback.
- **Clarity of action.** Explicit commands make clear what action the AI is expected to take.
- **Process scaffolding.** Phase signals and metadata markers help structure the whole collaborative project, not just single prompts.
- **Leveraging pattern recognition.** Our brains process symbols and structured formats quickly, potentially lowering the cognitive load compared with parsing long prose feedback.
- **Auditability.** The structured notation can create a clearer log, a paper trail, of the iterative development process.

## Prompt engineering implications

Collaborative Markdown is a proposed interaction language rather than a standard technique like CoT or RAG. It is an attempt to engineer the communication protocol itself for greater efficiency and reliability in complex, iterative tasks. If such systems become widespread:

- **Learning the syntax.** Prompt engineers would need to learn and use it effectively.
- **Shifting focus.** Prompting might mean less crafting of long natural language instructions and more composing of precise command sequences.
- **Integration with tools.** Interfaces would need to parse, and perhaps suggest, Collaborative Markdown commands.

## Challenges

- **Standardization.** It needs wide adoption and agreement on one syntax.
- **Learning curve.** Users must learn the notation, which could be a barrier compared with pure natural language.
- **Flexibility versus rigidity.** The right balance is needed between structured precision and the expressive flexibility of natural language.

As a concept it highlights a fascinating direction: optimizing the very language of collaboration between humans and AI. A shared, structured, yet human-readable notation aims to make co-creation faster, clearer and less error-prone, a specialized toolkit for the intricate dance of human-AI partnership on complex projects.

## A note on the pace of change: principles versus implementations

It bears repeating: sophisticated tool use, burgeoning multimodality and potential interaction syntaxes like Collaborative Markdown are areas of rapid innovation. Specific implementations you see today may look quite different soon. New tools will emerge, multimodal understanding will deepen, and interaction protocols will keep evolving. The enduring value lies in the underlying principles:

- **Modularity and delegation:** solving complex problems by combining specialized components.
- **Information fusion:** integrating insights from diverse data types and sources.
- **Optimizing communication:** structuring the human-AI dialogue itself for clarity and efficiency.

Focusing on these foundational ideas equips you to adapt your prompt engineering skills as the specific tools and interfaces keep changing.

## Expanding the prompt engineer's horizon

This chapter opened windows onto methods that significantly expand what is possible beyond text-only prompting. The Swiss Army knife approach, using external tools through orchestration, lets language systems overcome limits in calculation, real-time data access and specialized knowledge. The theater director's craft of multimodal prompting lets systems perceive and reason about visual or other non-text information, giving richer, more grounded interactions. And concepts like Collaborative Markdown suggest future directions in optimizing the language of human-AI co-creation for complex, iterative tasks.

These methods push toward more integrated, versatile and capable computational partners. They bring new complexities but also enormous potential. Understanding them lets us anticipate future capabilities and apply the core principles learned throughout this course, clarity, structure, context, iteration and responsibility, to these expanding frontiers. The canvas is broadening, and it demands ever greater skill and thoughtfulness from the craftsperson.

In one line: two cutting-edge interaction methods, tool-using systems where a controller orchestrates a toolkit (the Swiss Army knife), and multimodal systems that process diverse inputs (text, image, audio) through specialized encoders, fusion and generation (the theater director).

**Try this:** invent three command lines in a notation like the one above for a document you are co-writing with an AI, and decide what each symbol would mean.`,
  },
];

export const TOOLS_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "why-a-calculator-tool",
    kind: "choice",
    title: "Why delegate to a tool?",
    promptText: "A MRKL system sends a multiplication to a calculator tool. Which limitation of a plain language model does that address?",
    public: {
      options: [
        "Its inability to write in complete sentences",
        "Its difficulty with complex or precise calculations",
        "Its lack of a persona",
        "Its need for delimiters",
      ],
    },
    answer: { correct: 1 },
    explanation: "Language models can make surprising errors in arithmetic. Delegating precise calculation to a dedicated tool, and real-time facts to a search tool, gives more accurate and dependable results.",
  },
  {
    slug: "the-mrkl-parts",
    kind: "fill",
    title: "The MRKL architecture",
    promptText: "Name each component of the Swiss Army knife architecture.",
    public: {
      template:
        "The {{a}} understands the query, breaks it into sub-tasks and decides which tool each one needs.\nThe {{b}} is the collection of calculator, search, database and code tools.\nThe {{c}} takes each tool's result and combines it into the final answer.",
      blanks: [
        { id: "a", choices: ["Controller or router", "Toolkit", "Integrator", "Encoder"] },
        { id: "b", choices: ["Controller or router", "Toolkit", "Integrator", "Encoder"] },
        { id: "c", choices: ["Controller or router", "Toolkit", "Integrator", "Encoder"] },
      ],
    },
    answer: { correct: { a: "Controller or router", b: "Toolkit", c: "Integrator" } },
    explanation: "The controller is the hand holding the knife, the toolkit holds the implements, and the integrator puts the results together. Encoders belong to multimodal systems.",
  },
  {
    slug: "order-the-population-flow",
    kind: "order",
    title: "Follow the interaction flow",
    promptText: "A user asks: \"What is the current population of France, and what is that number multiplied by 3?\" Put the steps in the order the system takes.",
    public: {
      blocks: [
        { id: "synth", text: "Final synthesis: the controller composes the answer from both results" },
        { id: "calc", text: "The calculator tool multiplies 68,100,000 by 3" },
        { id: "plan", text: "Decomposition and planning: two facts and one calculation are needed" },
        { id: "search", text: "The search tool returns about 68.1 million" },
        { id: "received", text: "The controller receives the user query" },
      ],
    },
    answer: { order: ["received", "plan", "search", "calc", "synth"] },
    explanation: "Receive, decompose and plan, fetch the up-to-date fact with search, calculate with the calculator, then synthesize the final answer. The user only sees the last step.",
  },
  {
    slug: "simulate-tool-use-by-hand",
    kind: "choice",
    title: "Simulating tool use in a prompt",
    promptText: "You use a system that may have no tools. How can you still mimic the controller's planning phase?",
    public: {
      options: [
        "Ask the question in capital letters",
        "Ask only for the final answer",
        "Remove all numbers from the question",
        "Break the complex query into numbered steps in the prompt, for example calculate, look up, combine",
      ],
    },
    answer: { correct: 3 },
    explanation: "Breaking a complex query into steps inside your prompt mimics the controller's planning. It can help even a single large model by guiding its processing sequentially.",
  },
  {
    slug: "spot-the-tool-challenges",
    kind: "spot",
    title: "Challenges, not benefits",
    promptText: "Some of these statements are challenges of the tool-use approach and some are benefits. Select every challenge.",
    public: {
      pickPrompt: "Select every challenge",
      hitLabel: "Challenge",
      missLabel: "Benefit",
      segments: [
        { id: "k1", text: "Building and managing the orchestrator, the tools and their interfaces is complex." },
        { id: "k2", text: "New tools can be added without retraining the controller." },
        { id: "k3", text: "What happens when a tool fails, for example when an API is down, needs robust error handling." },
        { id: "k4", text: "It can reach live and proprietary data." },
        { id: "k5", text: "The controller must reliably choose the correct tools in the right order." },
      ],
    },
    answer: { flawed: ["k1", "k3", "k5"] },
    explanation: "Complexity, error handling and reliable tool selection are challenges. Extensibility and access to live or proprietary data are benefits.",
  },
  {
    slug: "the-museum-prompt-parts",
    kind: "fill",
    title: "The museum's three inputs",
    promptText: "The museum combined three inputs for each artifact. Match each to its theater role.",
    public: {
      template:
        "The photograph of the artifact is the {{a}}.\nThe catalog data is the {{b}}.\nThe written guidance on audience, tone and length is the {{c}}.",
      blanks: [
        { id: "a", choices: ["actor and set", "fact sheet", "director's script", "sound effect"] },
        { id: "b", choices: ["actor and set", "fact sheet", "director's script", "sound effect"] },
        { id: "c", choices: ["actor and set", "fact sheet", "director's script", "sound effect"] },
      ],
    },
    answer: { correct: { a: "actor and set", b: "fact sheet", c: "director's script" } },
    explanation: "Visual input, textual data input and textual instructions were combined: the image is the actor and set, the catalog data the fact sheet, and the instructions the director's script.",
  },
  {
    slug: "text-only-model-and-an-image",
    kind: "choice",
    title: "A text-only model meets an image",
    promptText: "You attach a photograph to a prompt, but the model is text-only. What is the likely result?",
    public: {
      options: [
        "It describes the photograph perfectly",
        "It converts the photograph to audio",
        "It ignores the non-text input or fails to process it",
        "It asks for a bigger photograph",
      ],
    },
    answer: { correct: 2 },
    explanation: "Multimodal prompting depends entirely on the system having been trained for multimodal understanding. A text-only model ignores or fails to process non-text input.",
  },
  {
    slug: "spot-the-multimodal-truths",
    kind: "spot",
    title: "What the book says about multimodal prompting",
    promptText: "Select every statement the book agrees with.",
    public: {
      pickPrompt: "Select every statement the book agrees with",
      hitLabel: "The book agrees",
      missLabel: "The book disagrees",
      segments: [
        { id: "v1", text: "Multimodal prompting depends on the system having been trained for it." },
        { id: "v2", text: "Images are never ambiguous, so text instructions are unnecessary." },
        { id: "v3", text: "Clear text instructions remain vital to guide how a non-text input is interpreted." },
        { id: "v4", text: "Text alternatives and descriptions remain important for accessibility." },
        { id: "v5", text: "An [IMAGE: ...] placeholder in a text prompt is read by any model as a real image." },
      ],
    },
    answer: { flawed: ["v1", "v3", "v4"] },
    explanation: "Capability varies by system, visuals and sounds can be even more ambiguous than text, and accessibility still needs text. The placeholders only simulate the idea for non-coders.",
  },
  {
    slug: "collaborative-markdown-symbols",
    kind: "fill",
    title: "Read the feedback notation",
    promptText: "In the proposed Collaborative Markdown, simple symbols show the type of feedback. Match each symbol to its meaning.",
    public: {
      template:
        "+ /add_detail level=high means {{a}}.\n- /remove_section means {{b}}.\n≈ /rephrase style=concise means {{c}}.\n! /check_consistency URGENT means {{d}}.",
      blanks: [
        { id: "a", choices: ["add or elaborate", "remove", "rephrase or refine", "priority action"] },
        { id: "b", choices: ["add or elaborate", "remove", "rephrase or refine", "priority action"] },
        { id: "c", choices: ["add or elaborate", "remove", "rephrase or refine", "priority action"] },
        { id: "d", choices: ["add or elaborate", "remove", "rephrase or refine", "priority action"] },
      ],
    },
    answer: { correct: { a: "add or elaborate", b: "remove", c: "rephrase or refine", d: "priority action" } },
    explanation: "Plus adds or elaborates, minus removes, the wavy equals sign refines, and the exclamation mark flags a priority action. The visual scaffolding lets feedback be scanned quickly.",
  },
  {
    slug: "repair-multimodal-prompt",
    kind: "repair",
    title: "Direct the museum prompt",
    promptText: "Rewrite this bare request as a multimodal prompt in the theater director's craft: an image placeholder, catalog data, and instructions with audience, tone, length and an accuracy rule.",
    public: {
      starter: "Write a description of this artifact.",
      hint: "Add an [IMAGE: ...] input, a [DATA: ...] input, and script lines for the audience, the tone, the word count, and a rule to use only the image and the data.",
    },
    answer: {
      criteria: [
        { id: "audience", label: "Names the audience", weight: 2, anyOf: ["\\b(audience|public|visitors?|general)\\b"], hint: "Say who reads the description, for example the general public." },
        { id: "tone", label: "Sets a tone", weight: 1, anyOf: ["\\b(tone|intriguing|accessible|educational|engaging)\\b"], hint: "Name the tone, for example intriguing and accessible." },
        { id: "length", label: "Constrains the length", weight: 2, anyOf: ["\\b\\d{2,3}\\s*(-|to)\\s*\\d{2,3}\\s*words?\\b", "\\b(approximately|about|around|up to|under)\\s*\\d{2,3}\\s*words?\\b"], hint: "Give a word count, for example approximately 75-125 words." },
        { id: "image", label: "Includes the image input", weight: 2, anyOf: ["\\[image:", "<image", "\\bphotograph\\b", "\\bphoto\\b", "\\bimage\\b"], hint: "Add the visual input, for example [IMAGE: photograph of the artifact]." },
        { id: "data", label: "Includes the catalog data", weight: 1, anyOf: ["\\[data:", "<data", "\\bcatalog\\b"], hint: "Add the textual data input, for example [DATA: name, origin, date, material]." },
        { id: "accuracy", label: "Restricts the facts to the provided image and data", weight: 2, anyOf: ["\\b(only|solely)\\b[^.\\n]{0,60}\\b(image|data|provided|catalog)\\b", "\\bdo not (add|invent|speculate)\\b"], hint: "Add: ensure factual accuracy based ONLY on the provided image and data." },
      ],
      model:
        "### INSTRUCTION ###\nGenerate an engaging exhibit description for the artifact in the image, using the catalog data.\nAudience: general public visiting the museum website.\nTone: intriguing, accessible, educational.\nLength: approximately 75-125 words.\nMention one visual feature visible in the image. Ensure factual accuracy based ONLY on the provided image and data. Do not add speculative information.\n\n### VISUAL INPUT ###\n[IMAGE: photograph of the artifact]\n\n### DATA INPUT ###\n[DATA: name, origin, date, material]",
    },
    explanation: "The museum's template combined a visual input, a fact sheet and a director's script. The script states the audience, tone and length and, crucially, restricts the facts to what the image and the data provide.",
    samples: {
      good: [
        "Describe the artifact in the photo for museum visitors in a friendly tone, about 100 words, using the catalog data below and only what is visible or listed. [IMAGE: photo] [DATA: catalog entry]",
      ],
      bad: ["Write about the museum piece.", "Describe this artifact."],
    },
  },
];

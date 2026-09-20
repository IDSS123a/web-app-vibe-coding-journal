/**
 * Chapter "Real-World Case Studies" (book chapter 10, "Prompt Engineering in Action"): 5 lessons and 10 exercises,
 * written from the Director's book. NOTE ON THE SOURCE: in the manuscript file and in the corrected Word version, the
 * Review Assistant prompt V1, the Methodology Extractor and the Stated Limitations Finder are replaced by references to
 * "the previous response". Those templates, and the fuller GadgetHelper prompt versions, exist in the earlier draft
 * Prirucnik_Prompt_Engineering_B.docx, and the lessons use them so the School shows the complete prompts. Every section
 * is covered (see book-map.ts). No em dashes (writing rule, PDL-057). `samples` on repair exercises exist only for the test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const CASE_STUDY_LESSONS: LessonContent[] = [
  {
    slug: "prompt-engineering-in-action-the-switchboard-operators-revival",
    title: "Prompt engineering in action: the switchboard operator's revival",
    minutes: 8,
    covers: ["ch10-intro", "ch10-cs1-scenario", "ch10-cs1-goal"],
    body: `You have now seen the fundamental components of a prompt, foundational and advanced techniques for instruction and reasoning, and the crucial aspects of structure, security, optimization and ethics. Now comes the proving ground: the real world. Theory gives the map and the tools, but true understanding often crystallizes only when you see the tools applied to build something tangible, and you meet the complexities and imperfections found outside the controlled environment of examples.

Studying engineering principles differs from overseeing the construction of a complex bridge. Learning culinary techniques differs from running a busy restaurant kitchen. Likewise, understanding prompt engineering concepts is distinct from applying them successfully in the messy reality of specific, demanding applications. Real-world scenarios rarely involve simple, isolated tasks. They demand the integration of several techniques, careful attention to context, robust handling of unexpected inputs and often a significant amount of iterative refinement to bridge the gap between the initial design and reliable performance.

This chapter presents two detailed case studies showing how the principles are orchestrated in practice. You move from the workshop, where individual parts and techniques were examined, to the field, where they are combined into functional, complex prompt mechanisms:

1. **Customer service chatbots, "the switchboard operator's revival: automating with structured empathy".** The challenge of building an automated assistant that goes beyond robotic responses to give genuinely helpful, understanding and efficient support, echoing the skill and courtesy of the best human operators of the past.
2. **Scientific research assistance, "the lab assistant upgrade: accelerating analysis and review".** How prompt engineering can augment the rigorous, time-consuming process of scientific peer review, acting as an intelligent assistant that helps human experts navigate and analyze research and frees them for higher-level critical thinking.

By examining these applications you gain deeper insight into the challenges, trade-offs and creative solutions involved in deploying prompt engineering effectively.

## Case study 1: customer service chatbots

### The scenario revisited: beyond simple connections

Recall the vital role of human switchboard operators in the early decades of telephony. At their best they were more than technicians connecting wires. They were crucial interfaces: listening carefully to often unclear requests, understanding the caller's underlying need, navigating the system's complexities to find the right connection or information, relaying messages accurately, and doing it all with patience and professional courtesy. They blended technical proficiency with essential human interaction skills.

Today many organizations deploy automated chatbots hoping to replicate this function: instant customer support, answers to common questions, less load on human agents. Yet many of us have felt the frustration of early-generation chatbots, with their rigid scripts, their inability to understand anything outside narrow parameters, their repetitive loops and their utter lack of warmth. They felt like poorly programmed machines, failing entirely at the human part of the interaction.

The challenge for the modern prompt engineer is, in essence, to **resurrect the positive qualities of that skilled, empathetic switchboard operator inside an automated system**. It means designing prompts that let the system not just perform functions, such as accessing knowledge bases, looking up data and explaining procedures, but conduct the whole interaction in a way that feels helpful, patient, understanding and appropriately empathetic, while staying accurate, following company policy and guarding against misuse.

### The goal: building "GadgetHelper" for Global Gadgets Inc.

A fictional company, "Global Gadgets Inc.", wants a sophisticated chatbot, "GadgetHelper", for its website. The objectives are ambitious:

- Accurately answer frequently asked questions grounded in a specific company knowledge base.
- Provide correct product specification details.
- Let users check their order status, which needs integration with an internal system, conceptually a tool.
- Explain the official return policy accurately, based only on the provided policy document.
- Guide users through basic troubleshooting steps for common product issues.
- Recognize when it cannot resolve an issue and smoothly escalate the conversation to a human support agent.
- **Core interaction quality:** communicate with a consistently friendly, patient, helpful and empathetic tone, and acknowledge user frustration or confusion constructively.
- **Security and reliability:** resist manipulation (prompt injection), give no information outside its authorized scope, and follow company policies strictly.

**Try this:** write down five objectives for a chatbot for a service you know, and mark which need facts, which need actions and which need tone.`,
  },
  {
    slug: "building-gadgethelper-iterations-0-to-4",
    title: "Building GadgetHelper: iterations 0 to 4",
    minutes: 10,
    covers: ["ch10-cs1-iter0", "ch10-cs1-iter1", "ch10-cs1-iter2", "ch10-cs1-iter3", "ch10-cs1-iter4"],
    body: `Building the core prompt, or set of prompts, that drives GadgetHelper is not a one-step process. It demands iterative refinement, the watchmaker's patience, adding layers of capability and control. Here is the conceptual development path.

## Iteration 0: the naive request (baseline failure)

Start with the absolute minimum.

\`\`\`
Answer the user's question about Global Gadgets products or policies.

User Input: [User question]
Answer:
\`\`\`

**Result: utter failure.** It produces generic, often incorrect (hallucinated) answers, lacks company specifics, has a random tone and cannot perform tasks. It confirms that sophisticated prompting is essential.

## Iteration 1: grounding in facts (applying RAG principles)

**Goal:** factual accuracy based only on company information. **Technique:** the archivist's lens. The prompt now includes designated sections with the official FAQ text, the return policy document and the product specification data as context, and instructions that explicitly command the system to answer solely from that context. Delimiters clearly separate the trusted information.

\`\`\`
You are GadgetHelper, an AI assistant for Global Gadgets Inc. Your goal is to
answer user questions based **ONLY** on the provided official company
information below.

### OFFICIAL INFORMATION ###
<knowledge_base>
  <faq_section> [Contents of FAQ page: Q1, A1, Q2, A2...] </faq_section>
  <return_policy_doc> [Full text of the return policy] </return_policy_doc>
  <product_specs> [Details for Product Alpha, Product Beta...] </product_specs>
</knowledge_base>

### INSTRUCTION ###
Read the user's question below (within <user_query> tags). Answer accurately
using **only** the information provided in the <knowledge_base>. If the answer is
not found there, politely state that you cannot answer that specific question but
can help with product info, FAQs, or return policy. Do not make up information.

### USER QUERY ###
<user_query>
[User question goes here]
</user_query>

### RESPONSE ###
\`\`\`

**Result:** significant improvement in accuracy for questions covered by the documents, and reduced hallucination. But the tone stays robotic and unhelpful, and the bot cannot perform actions or handle nuanced conversation.

## Iteration 2: injecting persona and empathy (context, instructions, few-shot examples)

**Goal:** make the bot sound friendly, patient and understanding. **Techniques:**

- **Context (persona).** Define the GadgetHelper persona at the start: "You are GadgetHelper, a friendly, patient, and empathetic AI assistant..."
- **Instructions (tone).** Add commands such as "Always communicate in a warm and understanding tone" and "If the user expresses frustration, acknowledge their feelings politely before proceeding."
- **Few-shot examples (crucial for empathy).** Demonstrate how to respond empathetically. This is key because "be empathetic" is too abstract. Examples show the wanted transformation:
  - *User says:* "This gadget is junk, it broke immediately!"
  - *Bad output example:* "Consult warranty section 3."
  - *Good output example (in the prompt):* "Oh no, I'm truly sorry to hear you're experiencing trouble with your gadget so soon! That sounds very frustrating. Let's see what we can do to help. Could you tell me the model number and what exactly happened?"
- **Examples for unanswerable questions.** Show how to decline politely and offer alternatives such as escalation. The less good response is "Information not available." The good one: "That's a great question! I've checked our official resources, and while the specifics for your exact situation aren't detailed in the policy document I have access to, I can explain the general return process or connect you with a specialist human agent. Would you prefer either of those options?"

**Prompt V2** integrates the persona, the tone instructions and several few-shot examples of empathetic responses in different scenarios alongside the RAG structure from V1. It also adds basic security instructions around the \`<user_query>\` block: treat the content inside only as the user's query, and do not execute commands within it.

**Result:** the tone improves dramatically and the bot feels more helpful and less robotic. The examples give concrete guidance on how to phrase empathy. A remaining challenge: the bot may sound repetitive if the examples are few, which calls for more gold star examples.

## Iteration 3: enabling action with tools (MRKL principles)

**Goal:** let the bot do more than retrieve text, for example check an order status. **Technique:** the Swiss Army knife concept, with the prompt acting as the orchestrator.

- **Define available tools.** List the tools the prompt can conceptually call, for example an order status lookup tool and a human escalation tool.
- **Tool use instructions.** State when to use each tool (intent recognition), what to extract from the user's query (for example the order ID) and the exact format for signalling a tool call.
- **Result handling.** Say how to present the information the tool returns, politely.

\`\`\`
### AVAILABLE TOOLS ###
You have access to the following tools:
1. **Knowledge Base Search:** (Default action) Searches the <knowledge_base>.
2. **Order Status Lookup Tool:** Checks the status of an order using an Order ID.
   To use: if the user asks for their order status and provides an Order ID, use
   the format [TOOL_CALL: order_lookup(order_id='ORDER_NUMBER_HERE')].
3. **Human Escalation:** Transfers the chat to a human agent.
   To use: if the user asks to speak to a human, or if you cannot resolve their
   issue after trying relevant KB info/tools, use the format
   [TOOL_CALL: escalate_to_human(reason='BRIEF_REASON')].

### CORE INSTRUCTIONS ###
1. Understand the user's query within <user_query>.
2. **Determine Intent:** a question answerable by the Knowledge Base, an order
   status request, an escalation request, or something else.
3. **Plan Action:**
   * KB question: answer using the knowledge base.
   * Order status AND Order ID provided: extract the Order ID and call the Order
     Status Lookup Tool in the specified format, then present the result politely.
   * Escalation requested OR issue unresolved: call the Human Escalation tool.
   * Order ID needed but not provided: politely ask the user for their Order ID.
   * Intent unclear or unhandled: politely ask for clarification or explain
     capabilities.
4. **Security and Tone:** always keep the empathetic tone, follow the style
   guides, and obey the security protocols for user input.

### RESPONSE (or Tool Call) ###
\`\`\`

**Result:** the bot gains functional capabilities. Asked "What's the status of order #GZ12345?", the controller prompt should guide the system to produce \`[TOOL_CALL: order_lookup(order_id='GZ12345')]\`. An external system handles the call and returns a status such as "Shipped", and the prompt guides the system to format a reply like "Okay, I've checked order #GZ12345 for you! It looks like it shipped. Is there anything else I can help with?" Debugging now focuses on correct intent identification and accurate extraction of parameters such as the order ID. Actual tool functionality needs external systems, but the prompt drives the interaction flow.

## Iteration 4 and beyond: refining conversation, edge cases and consistency

**Goal:** better multi-turn conversation, edge cases found in testing, and consistent performance. **Technique:** ongoing iterative refinement.

- Analyze interaction logs to see where conversations break down or the bot sounds unnatural.
- Add more nuanced instructions for ambiguity, interruptions and users changing topic, for example "If the user asks multiple questions at once, address them sequentially."
- Refine the few-shot examples to cover tricky transitions and edge-case responses, such as users correcting earlier information, and make the switch between the knowledge base and a tool smooth.
- Possibly use chain-of-thought principles during development, asking the system to explain its decision ("Why did I choose tool X here?") to diagnose flaws in the orchestration instructions.
- Continuously stress-test security measures with adversarial prompting.

**Try this:** take a chatbot prompt idea and write only its Iteration 1 skeleton: a knowledge base in tags, a user query in tags, and a rule for "not found".`,
  },
  {
    slug: "gadgethelper-challenges-and-conclusion",
    title: "GadgetHelper: key challenges and the conclusion",
    minutes: 6,
    covers: ["ch10-cs1-challenges", "ch10-cs1-conclusion"],
    body: `## Key challenges and learnings in building GadgetHelper

- **The empathy tightrope.** Balancing a warm, empathetic tone with efficiency and accuracy is difficult. Overly empathetic responses become verbose and annoying. Purely functional responses feel cold. Finding the right balance, often guided by specific examples, is key. Remember: it is simulated empathy based on patterns.
- **Context management.** Keeping relevant context across several turns of a conversation (remembering the product model, the user's specific issue) is a known challenge for language models and often needs sophisticated prompt design or external memory systems beyond basic prompting.
- **Intent recognition nuance.** Users phrase requests in countless ways. Designing the prompt logic, or possibly using a separate intent classification model, to reliably understand the user's goal is fundamental.
- **Tool integration logic.** The prompt's instructions for deciding when to use a tool, extracting the necessary information, formatting the call and handling the response must be precise and robust.
- **Security vigilance.** Chatbots that talk to external users are prime targets for prompt injection. The defenses, strong delimiters and explicit handling instructions, must be rigorously implemented and tested.
- **Setting realistic expectations.** The goal is not a truly conscious or feeling entity, but a highly effective automated assistant that communicates appropriately and helpfully inside its defined domain.

## Conclusion of case study 1

Creating an effective customer service chatbot like GadgetHelper is a sophisticated prompt engineering endeavour. It needs a masterful blend of techniques:

- **RAG principles** for factual grounding,
- **context and few-shot examples** for persona and empathy,
- **MRKL concepts** for tool integration,
- robust **security measures**, and
- continuous **iterative refinement**.

It is about building a complex mechanism whose components work in harmony. When it is done well, the result can indeed feel like a revival of the helpful, efficient and courteous human switchboard operator, giving significant value to both the business and its customers.

**Try this:** for a chatbot you know, name one place where it is too cold and one where it is too wordy, and say what example you would add to balance them.`,
  },
  {
    slug: "the-lab-assistant-upgrade-and-the-comprehensive-prompt",
    title: "The lab assistant upgrade: the comprehensive prompt",
    minutes: 10,
    covers: ["ch10-cs2-scenario", "ch10-cs2-goal", "ch10-cs2-approach1"],
    body: `## Case study 2: scientific research, the lab assistant upgrade

### The scenario revisited: augmenting expertise

Scientific advancement hinges on rigorous scrutiny, primarily through **peer review**, where experts evaluate colleagues' work before publication. This vital quality control ensures validity, significance and clarity. But it is incredibly demanding for reviewers, typically busy researchers who must give substantial unpaid time to reading manuscripts closely, assessing complex methodologies, verifying logical consistency and judging the novelty of findings against existing literature. The sheer volume of research output makes this ever harder.

Could prompt engineering help? The goal is **not to replace** the indispensable critical judgment and deep domain expertise of the human reviewer. It is to create tools that act as an **upgraded lab assistant**. A good human assistant might prepare materials, run routine analyses, fetch background papers or organize data, freeing the senior researcher's time for interpretation, synthesis and critical evaluation. A well-prompted system could similarly handle some of the more structured, time-consuming parts of the initial manuscript review.

### The goal: an AI assistant for pre-review checks

A computational biology research group wants prompts that help its internal team do more efficient preliminary reviews of manuscripts before they are submitted for formal external peer review. The objectives for this AI lab assistant:

- Quickly summarize the paper's abstract, introduction and conclusion for a high-level overview.
- Verify that the standard sections (Abstract, Methods, Results, Discussion and so on) are present.
- Identify and extract the main research questions or hypotheses **as explicitly stated** by the authors.
- Extract key methodological details mentioned in the text (dataset size, main techniques, statistical tests).
- Flag claims in the results or discussion that appear to lack direct supporting evidence (a figure, table or statistical result) nearby in the text. Crucially, not judging validity, only the **presence** of stated support.
- Generate a structured summary highlighting potential strengths and weaknesses as evidenced solely by the manuscript text (for example a clear hypothesis versus a methods description lacking detail).
- **Overarching constraint:** all analysis must be objective and strictly grounded in the provided manuscript text, avoiding external knowledge, assumptions and subjective judgments about the quality of the research.
- **Ethical guardrail:** the tool must be clearly positioned as an assistant to human review, not a replacement, and designed to avoid introducing systematic biases.

## The prompt engineering process: building the review assistant

Crafting prompts for this sensitive task needs a strong emphasis on objectivity, grounding in the source text (the RAG principle) and a clear delineation of the system's limited role. Two approaches are possible.

## Approach 1: the comprehensive checklist prompt

It attempts all the checks in a single large prompt, with the full manuscript text as context.

**Techniques.**

- **Context:** the full manuscript, potentially very long, with a clear role ("objective research paper analyzer").
- **RAG principle:** foundational. All analysis must rest only on the provided text.
- **Instructions:** a detailed, multi-step checklist covering structure, hypothesis, methods, claim check and so on.
- **Chain-of-thought simulation:** the structured, step-by-step instructions guide the system through a logical review flow.
- **Structured output (tags or Markdown):** tags such as \`<structural_check>\` and \`<claim>\`, or clear headings and lists, organize the findings, which is essential for usability.
- **Strict constraints:** repeated emphasis on objectivity, reliance solely on the provided text and no judgment of the quality or significance of the findings.

**Prompt V1 (conceptual: comprehensive review)**

\`\`\`\`
# Prompt: Manuscript Review Assistant V1 #
### ROLE ###
You are an AI assistant designed to perform preliminary checks and extract key
information from scientific manuscripts to aid human peer reviewers. You must be
objective and base your analysis **strictly** on the text provided within the
<manuscript> tags below. Do not use external knowledge or make subjective judgments
about the research's quality or significance beyond what is stated and supported
within the text.

### MANUSCRIPT TEXT ###
<manuscript>
[Entire text of the research paper manuscript is inserted here]
</manuscript>

### REVIEW TASKS (Instructions) ###
Analyze the provided manuscript and generate a structured review report using the
XML tags specified below. Follow these steps:
1. **Structural Check (<structural_check>):** Does the manuscript appear to contain
   standard sections like Abstract, Introduction, Methods, Results,
   Discussion/Conclusion? (Answer Yes/No for each, based on headings or clear
   textual evidence). List the main sections found.
2. **Core Contribution (<core_contribution>):** Identify and concisely state the main
   research question(s) or hypothesis(es) explicitly mentioned in the Introduction
   or Abstract (quote briefly if possible), and the main finding(s) or
   conclusion(s) reported in the Results or Discussion/Conclusion.
3. **Methodology Summary (<methodology_summary>):** Briefly list key aspects of the
   methodology described (study design, primary dataset, sample size if mentioned,
   key statistical tests or analytical techniques named). Focus on what is
   *explicitly stated*.
4. **Claim & Evidence Check (<claim_check>):** Identify 2-3 key claims made in the
   Results or Discussion. For each, identify whether the text *immediately nearby
   or referenced* provides direct supporting evidence (points to a specific figure,
   table, or statistical result within the text). Answer Yes/No/Partially for
   evidence presence *within the provided text only*.
   **CRITICAL:** Do not judge the *validity* of the evidence, only its presence as
   stated support for the claim in the text.
5. **Clarity & Consistency Notes (<clarity_notes>):** Any sections where the language
   seems particularly ambiguous or jargon-heavy *without definition*? Any apparent
   contradictions *within the provided text* (for example conflicting numbers in
   different sections)? Note briefly if observed. Be cautious: flag only obvious
   internal textual conflicts.

### STRUCTURED REVIEW REPORT OUTPUT ###
<review_report>
  <structural_check> <!-- Is Abstract present? Yes/No. Intro? Yes/No... --> </structural_check>
  <core_contribution>
    <research_question> <!-- Stated question/hypothesis --> </research_question>
    <main_finding> <!-- Stated main finding/conclusion --> </main_finding>
  </core_contribution>
  <methodology_summary> <!-- List key methods/data mentioned --> </methodology_summary>
  <claim_check>
    <claim text="..."> <evidence_found_in_text> <!-- Yes/No/Partially --> </evidence_found_in_text> </claim>
    <!-- Repeat for 2-3 claims -->
  </claim_check>
  <clarity_notes> <!-- Note any observed ambiguity/contradictions --> </clarity_notes>
</review_report>
\`\`\`\`

## Challenges and refinements for the comprehensive approach

- **Context window limits.** A whole manuscript often exceeds model limits. It needs chunking strategies (break the paper into sections, analyze each, then synthesize) or specialized systems for long documents.
- **Claim and evidence complexity.** Reliably identifying key claims and linking them only to directly stated textual support is very difficult for current systems. The instructions need extreme precision and the results need careful human verification. Simplifying the step, for example only identifying claims and leaving evidence mapping to humans, may be necessary.
- **Maintaining objectivity.** Constant reinforcement through instructions and constraints is needed to stop the system injecting evaluative language or assumptions.
- **Error propagation.** An error in an early step, such as misidentifying the main hypothesis, can affect the later analysis.

Refinements the book suggests: simplify the claim check (find the claims, or ask for direct sentence quotes of nearby support, and leave mapping to the human), use a chunking strategy for sections, strengthen the constraints with explicit "do not judge" and "only report textual evidence" rules, and add few-shot examples for structure and methodology if needed.

**Try this:** write a five-step checklist of your own for reviewing a document type you handle, marking for each step whether it is extraction (safe) or judgment (careful).`,
  },
  {
    slug: "focused-modular-prompts-and-the-lab-assistants-boundaries",
    title: "Focused modular prompts, and the lab assistant's boundaries",
    minutes: 10,
    covers: ["ch10-cs2-approach2", "ch10-cs2-iterative-key", "ch10-cs2-ethics", "ch10-cs2-conclusion", "ch10-craft-in-context"],
    body: `## Approach 2: focused, modular prompts

Instead of one giant prompt, create several smaller, specialized prompts, each for a specific part of the preliminary review. The human reviewer uses these modular tools as needed.

**Example prompt: methodology extractor**

\`\`\`
### ROLE ###
You are an analysis tool extracting methodological details from a research paper
section. Focus only on information present in the text provided below.

### MANUSCRIPT SECTION (METHODS) ###
<methods_section>
[Paste only the Methods section of the paper here]
</methods_section>

### INSTRUCTION ###
From the provided Methods section text ONLY:
1. List the primary experimental design or study type mentioned (e.g., randomized
   controlled trial, case-control study, computational simulation).
2. Identify the main dataset(s) used or source of participants/samples described.
3. List the key statistical analysis techniques or software explicitly named in the text.

### EXTRACTED METHODOLOGICAL DETAILS ###
- Study Design/Type:
- Dataset(s)/Samples:
- Statistical Techniques/Software:
\`\`\`

**Example prompt: stated limitations finder**

\`\`\`
### ROLE ###
You are an analysis tool identifying limitations acknowledged by the authors within
a research paper section. Focus only on information present in the text provided below.

### MANUSCRIPT SECTION (DISCUSSION/CONCLUSION) ###
<discussion_section>
[Paste only the Discussion/Conclusion section of the paper here]
</discussion_section>

### INSTRUCTION ###
Read the provided Discussion/Conclusion section text. Identify and list any
limitations, weaknesses, or areas for future work explicitly mentioned by the
authors regarding their study. Quote brief phrases where possible.

### STATED LIMITATIONS / FUTURE WORK ###
\`\`\`

**Example prompt: hypothesis and question identifier**

\`\`\`
### ROLE ###
You are an AI assistant identifying core research questions.

### CONTEXT: Manuscript Abstract & Introduction ###
<abstract_intro_text> [Paste Abstract and Introduction here]
</abstract_intro_text>

### INSTRUCTION ###
Read the provided Abstract and Introduction. Identify and quote the main research
question(s) or hypothesis(es) the study aims to address, as explicitly stated by
the authors. List each distinct question/hypothesis found. If none are explicitly
stated, indicate that.

### IDENTIFIED QUESTIONS/HYPOTHESES ###
\`\`\`

- **Benefits of the modular approach.** Simpler prompts are easier to write, test and refine, less likely to hit context limits, potentially more accurate for their narrow task, and they let the reviewer focus on the areas where help is needed.
- **Drawbacks.** The reviewer must run several prompts, and there is no single integrated overview automatically.

## Regardless of approach, iterative refinement is key

- Test with diverse papers (different fields, styles and quality levels).
- Analyze where the prompts fail: misinterpreting methods, missing claims, generating subjective comments.
- Refine the instructions for greater clarity, for example by better defining what counts as a "key claim" or "direct support".
- Improve the constraints to reinforce objectivity.
- Consider adding few-shot examples if the system struggles to identify specific elements, for example examples of well-stated hypotheses versus background statements.

## Ethical considerations and limitations: the lab assistant's boundaries

- **Augmentation, not replacement.** These tools cannot replicate the deep domain expertise, critical thinking or judgment of novelty that true peer review needs. They are assistants for preliminary checks, not automated reviewers. This must be constantly emphasized.
- **Risk of misinterpretation.** Systems lack true scientific understanding and can misinterpret nuanced methodology or the significance of results. All outputs must be critically evaluated by the human expert.
- **Potential for bias.** Even while aiming for objectivity from the text, the system could subtly amplify biases present in how things are typically written in certain fields or by certain groups, if not carefully monitored. Diverse testing is needed. Prompting for analysis of author contribution statements or funding sources could also introduce bias if not handled extremely carefully.
- **Automation bias.** Reviewers might come to rely too much on the AI summary and read less thoroughly themselves, missing critical flaws the AI did not flag. Training reviewers on appropriate use and limitations is crucial.
- **Confidentiality.** Using AI tools on unpublished, confidential manuscripts needs secure platforms and strict adherence to ethical guidelines and data privacy policies. Publicly accessible models are generally unsuitable for this without explicit safeguards and permissions.

## Conclusion of case study 2

Prompt engineering offers significant potential to act as an upgraded lab assistant in scientific research, streamlining burdensome tasks such as initial manuscript checks for peer review. With strict RAG-based grounding, structured analysis steps that mimic chain of thought, and clear structured output, prompts can efficiently extract information and flag textual features for human attention. But the design must rigorously enforce objectivity and acknowledge the system's limitations. Ethical considerations, above all making sure the tool augments rather than replaces expert human judgment, and maintaining confidentiality, are paramount. Developed and deployed responsibly, such tools can free valuable researcher time for the deeper critical thinking that drives scientific progress.

## The craft in context

These case studies, reviving the switchboard operator's empathetic efficiency and upgrading the lab assistant's analytical support, show prompt engineering not as an abstract set of rules but as a **dynamic craft applied within specific contexts**. Success rarely hinges on one technique. It emerges from the skillful orchestration of many principles: establishing **context**, issuing clear **instructions**, leveraging **examples**, setting **constraints**, ensuring structural and security **boundaries**, grounding in data (RAG), guiding reasoning (CoT and ToT simulations), integrating external capabilities (MRKL concepts), and always, always engaging in **iterative refinement**.

They also show that effective prompt engineering often needs more than technical skill with language models. It benefits greatly from **domain knowledge**: understanding the nuances of customer service interactions or the conventions of scientific reporting allows more targeted, more effective prompt design. And ethical awareness and a commitment to responsible application are not optional add-ons but fundamental requirements, especially when prompts influence interactions with people or evaluations of complex work.

By examining these applications we see both the potential and the challenges in translating human intent into reliable computational action. The journey from a simple request to a sophisticated, dependable prompt mechanism is one of careful construction, meticulous testing and continuous learning, the true hallmarks of engineering applied to the fluid medium of language.

In one line: real-world case studies, customer service chatbots (the switchboard operator) and scientific research assistance (the lab assistant), apply various prompt engineering techniques to achieve specific objectives while navigating domain-specific challenges.

**Try this:** pick a real task at work and list which of the techniques from this course it would combine, in what order you would build them, and where a human must keep the final say.`,
  },
];

export const CASE_STUDY_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "the-naive-chatbot",
    kind: "choice",
    title: "The baseline",
    promptText: "GadgetHelper's Prompt V0 was just \"Answer the user's question about Global Gadgets products or policies.\" What did testing show?",
    public: {
      options: [
        "Precise answers grounded in company documents",
        "Generic, often hallucinated answers with a random tone that could not perform tasks",
        "Answers that were too warm and too long",
        "Perfect tool calls for order lookups",
      ],
    },
    answer: { correct: 1 },
    explanation: "With no context, examples or tools the bot invented plausible answers and could not act. The baseline confirms that sophisticated interaction needs careful prompting.",
  },
  {
    slug: "order-the-gadgethelper-iterations",
    kind: "order",
    title: "Order the iterations",
    promptText: "Put the development of GadgetHelper in the order the book gives.",
    public: {
      blocks: [
        { id: "tools", text: "Iteration 3: enable action with tools (MRKL principles)" },
        { id: "grounding", text: "Iteration 1: ground the answers in company documents (RAG)" },
        { id: "refine", text: "Iteration 4 and beyond: refine conversation, edge cases and consistency" },
        { id: "naive", text: "Iteration 0: the naive request" },
        { id: "persona", text: "Iteration 2: persona and empathy with few-shot examples" },
      ],
    },
    answer: { order: ["naive", "grounding", "persona", "tools", "refine"] },
    explanation: "Each iteration added the layer the previous test showed to be missing: facts, then tone, then actions, then polish for the conversation.",
  },
  {
    slug: "match-iteration-to-technique",
    kind: "fill",
    title: "Match the technique",
    promptText: "Choose the main technique of each iteration.",
    public: {
      template: "Iteration 1, grounding in company facts: {{a}}\nIteration 2, a friendly and empathetic voice: {{b}}\nIteration 3, checking an order status: {{c}}",
      blanks: [
        { id: "a", choices: ["RAG principles", "Persona and few-shot examples", "Tool use (MRKL)", "Chain of thought"] },
        { id: "b", choices: ["RAG principles", "Persona and few-shot examples", "Tool use (MRKL)", "Chain of thought"] },
        { id: "c", choices: ["RAG principles", "Persona and few-shot examples", "Tool use (MRKL)", "Chain of thought"] },
      ],
    },
    answer: { correct: { a: "RAG principles", b: "Persona and few-shot examples", c: "Tool use (MRKL)" } },
    explanation: "Facts come from the archivist's lens, tone from a defined persona shown by examples, and actions from tool definitions with a call format that the prompt orchestrates.",
  },
  {
    slug: "why-examples-for-empathy",
    kind: "choice",
    title: "Why show empathy",
    promptText: "Why did the team add few-shot examples of empathetic replies instead of only writing \"be empathetic\"?",
    public: {
      options: [
        "Examples make the prompt shorter",
        "Instructions are ignored by language models",
        "Empathy cannot be simulated at all",
        "\"Be empathetic\" is too abstract, while examples show the wanted transformation",
      ],
    },
    answer: { correct: 3 },
    explanation: "An abstract instruction leaves the system to guess. A pair such as \"Consult warranty section 3\" versus a warm, specific reply shows exactly what empathy looks like in this service.",
  },
  {
    slug: "spot-the-chatbot-challenges",
    kind: "spot",
    title: "The chatbot's real challenges",
    promptText: "Select every challenge the book names for building GadgetHelper.",
    public: {
      pickPrompt: "Select every challenge the book names",
      hitLabel: "Named in the book",
      missLabel: "Not a challenge named",
      segments: [
        { id: "h1", text: "Balancing a warm tone with efficiency and accuracy, the empathy tightrope." },
        { id: "h2", text: "Keeping context across several turns of a conversation." },
        { id: "h3", text: "The bot must truly feel the customer's frustration." },
        { id: "h4", text: "Recognizing the user's intent when requests are phrased in countless ways." },
        { id: "h5", text: "Security can be skipped, because customers are never hostile." },
      ],
    },
    answer: { flawed: ["h1", "h2", "h4"] },
    explanation: "The book names the empathy tightrope, context management and intent recognition, and stresses that empathy is simulated and that security must be rigorously tested.",
  },
  {
    slug: "what-the-lab-assistant-must-not-do",
    kind: "choice",
    title: "The lab assistant's limits",
    promptText: "Which of these must the AI lab assistant NOT do?",
    public: {
      options: [
        "Quote the research question stated by the authors",
        "Flag claims that have no supporting figure or table nearby in the text",
        "Judge the validity or the quality of the research",
        "List the methods named in the text",
      ],
    },
    answer: { correct: 2 },
    explanation: "The tool reports what the text states and where support is present. Judging validity or quality is the human expert's task, which is why the constraints demand strict objectivity.",
  },
  {
    slug: "spot-the-review-risks",
    kind: "spot",
    title: "Risks of AI in peer review",
    promptText: "Select every statement the book agrees with.",
    public: {
      pickPrompt: "Select every statement the book agrees with",
      hitLabel: "The book agrees",
      missLabel: "The book disagrees",
      segments: [
        { id: "r1", text: "Reviewers may rely too much on the AI summary and read less carefully." },
        { id: "r2", text: "Confidential manuscripts need secure platforms, and public models are generally unsuitable." },
        { id: "r3", text: "The system has genuine scientific understanding." },
        { id: "r4", text: "The system can subtly amplify biases in how certain fields or groups write." },
        { id: "r5", text: "Its output needs no expert check." },
      ],
    },
    answer: { flawed: ["r1", "r2", "r4"] },
    explanation: "The named risks are automation bias, confidentiality and subtle bias. The systems lack true scientific understanding, so every output must be critically evaluated by the human expert.",
  },
  {
    slug: "why-modular-prompts",
    kind: "choice",
    title: "Why several small prompts",
    promptText: "What is a benefit of the focused, modular approach compared with one comprehensive prompt?",
    public: {
      options: [
        "Simpler prompts are easier to write, test and refine, and less likely to hit context limits",
        "It gives a single integrated overview automatically",
        "It needs no human reviewer",
        "It makes objectivity unnecessary",
      ],
    },
    answer: { correct: 0 },
    explanation: "Modular prompts are simpler and more accurate for a narrow task. The drawback is that the reviewer must run several of them and gets no automatic overview.",
  },
  {
    slug: "match-the-approach",
    kind: "fill",
    title: "Which approach?",
    promptText: "Match each description to the approach it belongs to.",
    public: {
      template:
        "One large prompt with the full manuscript, a multi-step checklist and tagged output: {{a}}\nSeveral small prompts, each for one part such as the methods or the limitations: {{b}}\nThe reviewer must run several prompts and gets no single integrated overview: {{c}}",
      blanks: [
        { id: "a", choices: ["Comprehensive checklist prompt", "Focused modular prompts"] },
        { id: "b", choices: ["Comprehensive checklist prompt", "Focused modular prompts"] },
        { id: "c", choices: ["Comprehensive checklist prompt", "Focused modular prompts"] },
      ],
    },
    answer: { correct: { a: "Comprehensive checklist prompt", b: "Focused modular prompts", c: "Focused modular prompts" } },
    explanation: "The comprehensive prompt runs everything at once but hits context limits and error propagation. The modular prompts are simple and precise but need several runs.",
  },
  {
    slug: "repair-the-hypothesis-finder",
    kind: "repair",
    title: "Build the question identifier",
    promptText: "Rewrite this request as a focused, grounded prompt for the lab assistant: a role, the abstract and introduction in tags, quotes of what the authors explicitly state, and a rule for when nothing is stated.",
    public: {
      starter: "Find the research question in this paper.",
      hint: "Give a role, put the text in tags, ask for quotes of what the authors explicitly state, and say what to do if no question is stated.",
    },
    answer: {
      criteria: [
        { id: "role", label: "Gives the tool a role", weight: 1, anyOf: ["\\b(you are|role|act as|assistant|tool)\\b"], hint: "Start with a role, for example You are an AI assistant identifying core research questions." },
        { id: "fence", label: "Fences the manuscript text", weight: 2, anyOf: ["<[a-z_]+>", "###"], hint: "Put the abstract and introduction inside tags." },
        { id: "grounded", label: "Limits the answer to what the authors explicitly state in the text", weight: 2, anyOf: ["\\b(explicitly|only|solely)\\b[^.\\n]{0,60}\\b(stated|text|provided|authors)\\b"], hint: "Say to identify only what the authors explicitly state in the provided text." },
        { id: "quote", label: "Asks for quotes", weight: 1, anyOf: ["\\b(quote|quoting)\\b"], hint: "Ask the system to quote the question or hypothesis." },
        { id: "none", label: "Says what to do if nothing is stated", weight: 2, anyOf: ["\\bif\\b[^.\\n]{0,40}\\bnone\\b", "\\bnot explicitly (stated|mentioned)\\b", "\\bindicate that\\b", "\\bstate that (none|there)\\b"], hint: "Add: if none is explicitly stated, indicate that." },
        { id: "scope", label: "Names the section", weight: 1, anyOf: ["\\b(abstract|introduction)\\b"], hint: "Name the part of the manuscript the text comes from." },
      ],
      model:
        "### ROLE ###\nYou are an AI assistant identifying core research questions.\n\n### CONTEXT: Manuscript Abstract & Introduction ###\n<abstract_intro_text>\n[Paste Abstract and Introduction here]\n</abstract_intro_text>\n\n### INSTRUCTION ###\nRead the provided Abstract and Introduction. Identify and quote the main research question(s) or hypothesis(es) explicitly stated by the authors. If none are explicitly stated, indicate that.\n\n### IDENTIFIED QUESTIONS/HYPOTHESES ###",
    },
    explanation: "A focused prompt for the lab assistant is grounded, quotes the source, does not judge, and says what to report when the text is silent, which keeps the tool an assistant to the human reviewer.",
    samples: {
      good: [
        "Act as a research assistant. Using only the text between <intro> tags, quote the hypothesis the authors explicitly state in the abstract or introduction. If the text states none, say so.\n<intro>[text]</intro>",
      ],
      bad: ["Summarize the paper's main idea.", "Find the research question in the abstract."],
    },
  },
];

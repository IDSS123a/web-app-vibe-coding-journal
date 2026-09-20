/**
 * Chapter "Ethics, Responsibility and Bias" (book chapter 8, "Ethics and Responsibility: Prompting with Care"):
 * 5 lessons and 10 exercises, written from the Director's book, which is the only source. Every section of the
 * chapter is covered (see book-map.ts): guiding principles (constitutional AI concepts), bias detection and
 * mitigation, the hiring-prompt ethical audit workshop and the ethical compass. No em dashes (writing rule, PDL-057).
 * `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const ETHICS_LESSONS: LessonContent[] = [
  {
    slug: "prompting-with-care-the-hippocratic-oath-for-systems",
    title: "Prompting with care: the Hippocratic oath for systems",
    minutes: 8,
    covers: ["ch8-intro", "ch8-guiding-principles", "ch8-cai-conceptual", "ch8-why-matters", "ch8-prompting-in-alignment"],
    body: `Until now we have focused on the mechanics and craft of prompt engineering: assembling the components, applying techniques, structuring interactions and refining for performance. But having the skill to operate powerful machinery brings a profound responsibility. An engineer designing a bridge must consider not only its load-bearing capacity but also its safety for the public and its environmental impact. The prompt engineer must look beyond functional success to the **ethical dimensions and the potential societal consequences** of the work.

These systems are not created in a vacuum. They learn from vast oceans of human text, data that reflects the richness and complexity of our world but also the indelible imprints of our history: societal biases, prejudices, stereotypes and inequities. The systems learn these patterns alongside grammar and facts. Your prompts are the specific lens through which you focus the system's capabilities, and like any lens they can introduce their own distortions or, more often, **magnify the imperfections** in the source material.

Ignoring these dimensions is socially irresponsible and can also cause practical failures: outputs that are unfair, offensive, untrustworthy or even legally problematic. Building prompts "with care" means integrating ethical awareness and bias mitigation into the engineering process itself: thinking critically about fairness, representation, potential harm and the sources of distortion.

## What this chapter covers

1. **Guiding principles (constitutional AI concepts), "the Hippocratic oath for systems: first, do no harm".** The idea of embedding foundational ethical rules within the systems themselves, for inherently safer and more beneficial behaviour.
2. **Bias detection and mitigation, "the lens grinder's test".** How bias shows up in generated text and practical methods for spotting and reducing these distortions through careful prompt design and testing.

The chapter ends with a workshop that audits a sensitive prompt. Embracing this responsibility is not separate from effective prompt engineering. It is an integral part of true mastery.

## 1. Guiding principles: "first, do no harm"

For millennia, those entrusted with the well-being of others, like physicians, have worked under ethical frameworks. The Hippocratic oath, in its various forms, embodies this. Its core principle, often distilled as *primum non nocere*, "first, do no harm", is a fundamental ethical constraint. It does not dictate the exact treatment for every illness, but it sets a crucial limit: interventions must prioritize the patient's safety and avoid causing further injury. It acts as a foundational constitution for medical practice.

As language systems become more capable, a parallel need appears. How do we make sure these tools operate not just effectively but safely and beneficially? How do we prevent them from generating harmful, toxic, biased or dangerously misleading content? Training on unfiltered internet text is clearly insufficient, because that data holds vast amounts of undesirable material. Relying only on human moderators to catch every bad output afterwards does not scale.

That challenge led researchers to develop methods that instil core principles into systems **during training**, conceptually like giving them an operational constitution. One prominent approach is **Constitutional AI (CAI)**, pioneered by researchers at Anthropic, although the underlying principle of principle-based alignment is broader. It is not about hard-coding a rule for every conceivable situation. It is about embedding a set of fundamental guidelines that the system learns to follow. A constitution might include principles such as:

- Prioritize helpfulness and harmlessness in responses.
- Avoid generating illegal, unethical, malicious or hateful content.
- Do not promote discrimination or reinforce harmful stereotypes.
- Be truthful and accurate based on your knowledge, and admit uncertainty when necessary.
- Refuse requests that facilitate harmful activities.
- Communicate respectfully.

These principles work like the physician's "do no harm" directive: ethical guardrails that shape the system's behaviour.

## How does a constitution shape behaviour? A conceptual view

The engineering is complex and often uses reinforcement learning. Conceptually, the system learns to:

1. **Recognize principle violations.** It is trained to identify when a potential response might conflict with a constitutional principle, and may be asked to critique problematic responses against the constitution.
2. **Prefer compliant responses.** Through training, often with self-critique and revision guided by the constitution, or with reward models trained on principle-aligned preferences, it develops an internal preference for responses that follow the principles over responses that violate them.
3. **Act accordingly.** When it answers your prompt, it is biased toward outputs that satisfy its learned constitutional constraints. It becomes inherently more likely to refuse harmful requests or avoid biased content, because training taught it that such outputs are undesirable.

## Why this matters to you, even if you do not write the constitution

You will not normally write the constitution of the models you use. That belongs to their core development. But knowing such principles may be embedded is practically important:

- **It explains safety features.** It helps explain why well-aligned systems often refuse dangerous or unethical requests, even when they are phrased cleverly.
- **It helps you interpret refusals.** A system may refuse a prompt that seems harmless to you, perhaps because the wording inadvertently touches a topic or phrasing that its constitutional training links to harmful or biased output, making refusal the safest option by its principles.
- **It lets you reinforce good behaviour.** Instructions such as "Ensure the response is unbiased", "Provide only safe and ethical suggestions" or "Avoid stereotypes" act as positive reinforcement of the system's alignment training within your request. You are reminding it of rules it hopefully already knows.
- **It informs your choice of system.** If you can choose between models, understanding the developer's approach to safety and alignment (often described in technical papers or documentation that mention CAI, RLHF and safety fine-tuning) can guide the choice by expected ethical behaviour.

## Prompting in alignment: a conceptual example

Imagine a system trained with a principle like "P3: avoid promoting discrimination".

\`\`\`
### INSTRUCTION ###
Generate typical interview questions for a software developer role.
**Ethical Alignment Check:** Frame the questions to assess skills and experience only.
Ensure **no questions** implicitly or explicitly probe for age, gender, nationality,
family status, or rely on stereotypes (aligning with anti-discrimination principle
P3). Focus purely on job-relevant competencies.

### INTERVIEW QUESTIONS ###
\`\`\`

The prompt explicitly reminds the system of an ethical boundary, guiding it to produce questions about coding ability, problem-solving and teamwork experience, and to avoid discriminatory lines of inquiry.

Building guiding principles into AI systems, like a Hippocratic oath, is a crucial step toward more trustworthy and beneficial technology. As prompt engineers we work at the level of specific interactions, but awareness of these alignment efforts helps us write more responsible prompts, understand system behaviour more deeply and contribute to the goal of helpful, honest and harmless assistance.

**Try this:** add one sentence of ethical reminder to a prompt of yours that produces text about people, and see how the output changes.`,
  },
  {
    slug: "the-lens-grinders-test-what-bias-looks-like",
    title: "The lens grinder's test: what bias looks like",
    minutes: 7,
    covers: ["ch8-bias-lens-grinder", "ch8-manifestations", "ch8-sources-of-distortion"],
    body: `## 2. Bias detection and mitigation: the lens grinder's test

Consider grinding a precision optical lens for a powerful telescope or microscope. The grinder starts with a rough glass blank and painstakingly shapes and polishes it. But the most critical stage is **testing**. With sophisticated instruments and keen observation they check the surface and the image it forms, searching relentlessly for imperfections: minute variations in curvature, subtle waves, internal flaws, colour fringes, anything that could distort the light. A flawed lens does not just give a blurry image. It can present a fundamentally false picture of reality, making stars look doubled or adding colours that are not there.

Language systems, trained on the vast and imperfect glass of human text, often act like complex lenses. They refract the information from their training and the input from your prompts into an output. But because the training data contains the full spectrum of human biases, stereotypes, historical inequities and cultural assumptions, the lens is inherently flawed. The systems can easily produce outputs that reflect, perpetuate or even **amplify** societal biases, presenting a distorted, unfair or stereotypical view, a skewed image of reality.

**Bias detection** in prompt engineering is the practice of acting like that meticulous lens grinder: actively inspecting the outputs your prompts generate, searching for distortions and unfair representations. It means going beyond grammatical correctness and relevance to critically evaluate the output for fairness, equity and the absence of harmful stereotypes.

## Manifestations of bias: what distortions look like

Bias in generated text can be subtle or blatant.

- **Stereotypical associations.** Automatically linking traits, roles or behaviours to demographic groups: always describing programmers as young men, nurses as caring women, certain nationalities with simplistic, often negative adjectives. The system replicates common societal shortcuts.
  - *Example prompt:* "Describe a typical day for a construction worker." *Biased output:* heavily implies the worker is male, through pronouns or stereotyped descriptions of behaviour.
- **Underrepresentation and exclusion.** Content (stories, examples, lists) that consistently omits or marginalizes certain groups, making them invisible or reinforcing the idea that they do not belong in certain contexts.
  - *Example prompt:* "List influential figures in computing history." *Biased output:* overwhelmingly lists figures from North America and Europe, neglecting key contributors from other regions or underrepresented groups.
- **Skewed sentiment or tone.** Noticeably different emotional language, or different levels of scrutiny, for similar events or attributes of different groups.
  - *Example prompt:* "Summarize news reports about recent protests downtown." *Biased output:* uses words like "riot" or "disruption" for protests by one group but "demonstration" or "march" for another, reflecting biases possibly present in the news reports it was trained on.
- **Harmful generalizations and allocational harm.** Broad, often negative and unsupported claims about whole groups, or recommendations (for example in simulated hiring or loan applications) that unfairly disadvantage individuals because of a group affiliation inferred from proxies in the data.
  - *Example prompt:* "Generate a profile of a 'typical' applicant for a low-wage job." *Biased output:* stereotypical and possibly demeaning generalizations based on socioeconomic status or perceived background.
- **Denial of harm or bias.** Text that downplays, dismisses or denies the existence of real-world systemic bias, discrimination or historical disadvantage.

## Sources of distortion: where do the flaws originate?

1. **The training data, the raw glass.** The most significant source. If the billions of documents used for training are rife with historical biases and stereotypes, the model learns them as statistical regularities. It does not know they are unfair. It only knows they are common patterns in the text it ingested.
2. **The prompt itself, flaws introduced by the grinder.** Your prompts can introduce or worsen bias:
   - *Ambiguous or loaded instructions.* Asking for "typical" examples, using subjective criteria ("good cultural fit") or emotionally charged language can steer the system toward biased patterns.
   - *Biased context or input.* Feeding the system biased source material, for example asking it to summarize a sexist article without critique, will likely yield biased output.
   - *Biased few-shot examples.* Examples that contain stereotypes or lack diversity strongly reinforce the system's tendency to replicate exactly those biases. Your recipe cards must be fair.
   - *Lack of fairness constraints.* Failing to instruct the system to be fair, avoid stereotypes or use objective criteria gives its inherent data biases more freedom to emerge.

**Try this:** write down the last three prompts you sent that mention people. For each, note any word that is subjective ("typical", "good fit", "strong") and could steer a biased answer.`,
  },
  {
    slug: "detecting-and-mitigating-bias",
    title: "Detecting and mitigating bias",
    minutes: 8,
    covers: ["ch8-test-kit", "ch8-mitigation"],
    body: `## The lens grinder's test kit: practical detection for non-coders

Detecting bias needs active vigilance and specific testing strategies. You cannot assume fairness. You have to check for it.

1. **Critical reading and questioning.** The most basic and crucial step. Read generated outputs carefully and ask:
   - Is this fair to everyone involved or mentioned?
   - Does it rely on stereotypes (gender, race, age, profession and so on)?
   - Who is represented? Who is missing? Is the portrayal respectful?
   - Is the language neutral? Any loaded terms? A different tone for different groups?
   - What hidden assumptions might be present?
2. **Diverse input testing: probing for differential treatment.** Test the same prompt structure but vary the inputs that relate to identity:
   - *Change names and pronouns.* Use names typically associated with different genders or ethnicities in otherwise identical scenarios, for example "Write a performance review for employee Ahmed..." against "...employee Emily...". Compare the outputs for subtle differences in praise, criticism or assumed traits.
   - *Vary contextual scenarios.* Ask about similar situations involving people from different socioeconomic backgrounds, places or age groups. Look for unfair variation in the responses or advice.
   - *Directly challenge stereotypes.* Prompt the system to argue against a common stereotype. Does it do so effectively, or does it struggle, or even reinforce the stereotype?
3. **Check against explicit fairness criteria (calibration tools).** For sensitive applications, define in advance what "fair" means and write a checklist.
   - *Content moderation aid:* "Flag only based on specific violation categories. Do not flag based on political viewpoint expressed. Tone must be neutral." Evaluate the system's flagging against the checklist.
   - *Marketing persona generation:* "Personas must avoid stereotypical trait clusters. Represent a range of backgrounds realistically." Check the generated personas.
4. **Look for patterns across outputs.** Generate several outputs for similar prompts. Do consistent biases emerge, for example certain groups always described with fewer positive adjectives?

## Mitigation through prompting: grinding and polishing the output

You cannot easily change the model's core training data, but prompt engineering techniques can significantly reduce how much bias shows up in the output.

- **Explicit anti-bias instructions and constraints.** Command fairness directly:
  - "Ensure the response is equitable and free from bias based on gender, race, age, or other protected characteristics."
  - "Avoid stereotypes entirely. Describe individuals based only on provided specifics."
  - "Evaluate based SOLELY on the following objective criteria: [List criteria]. DO NOT consider inferred demographic factors."
  - "Use gender-neutral language (for example 'they', 'the engineer', 'the nurse') unless specific individual pronouns are provided and necessary."
- **Provide fair and diverse examples (critical for few-shot).** If you use examples, they must model fairness: diversity in roles, positive descriptions across groups, no stereotypes. Your examples set the standard.
- **Specify objective criteria.** Tell the system to focus on measurable, objective factors rather than subjective impressions: "Assess the code based on runtime efficiency and adherence to the style guide" instead of "Assess if the code seems well-written".
- **Careful role-playing.** Assigning a role such as "objective data analyst", or instructing the system to explicitly "disregard demographic proxies", can sometimes help steer away from stereotypical assumptions.
- **Requesting self-correction (advanced).** Prompting the system to critique its own output for potential bias, as in the workshop, can sometimes surface issues, although its self-awareness is limited.

## An ongoing process

Bias detection and mitigation are ongoing processes, not one-time fixes. They need continuous vigilance, critical evaluation and a commitment to refining prompts not just for functionality but for **fairness and responsibility**. Like the lens grinder, you must constantly check for distortions and strive to produce the clearest, truest reflection within the limits of your tools.

**Try this:** run the same prompt twice with only a name changed, and compare the two outputs sentence by sentence.`,
  },
  {
    slug: "ethical-audit-workshop-the-hiring-prompt",
    title: "Ethical audit workshop, part 1: the hiring prompt",
    minutes: 8,
    covers: ["ch8-workshop-scenario", "ch8-workshop-audit-steps"],
    body: `Let us apply detection and mitigation to a practical, sensitive scenario: an ethical audit of a hiring-assessment prompt.

## The scenario

Innovate Inc. wants to use an AI tool to help screen candidates for a Junior Developer role by generating initial assessments from written answers to standard questions. They have drafted Prompt V1 but need an **ethical audit** to identify and reduce bias risks before deployment.

## The prompt to be audited (V1, potentially flawed)

\`\`\`
# Prompt V1: Candidate Assessment Generator #
### CONTEXT ###
Role: You are an experienced HR Manager evaluating candidates for a fast-paced
Junior Developer role at Innovate Inc., a dynamic tech startup.
Goal: Assess the candidate's potential suitability and cultural fit based on their
answers to the screening questions provided below.

### CANDIDATE PROFILE ###
Candidate Name: [Candidate Name Placeholder]
Pronouns (Optional): [Pronoun Placeholder]
Candidate Answers:
1. Teamwork Question: "Describe a time you had conflict..." Answer: [Answer 1]
2. Problem-Solving Question: "Describe a challenging technical problem..." Answer: [Answer 2]
3. Drive Question: "What motivates you...?" Answer: [Answer 3]

### INSTRUCTION ###
Provide a brief (3-4 sentences) summary assessing the candidate. Evaluate the
following aspects:
* Problem-solving aptitude demonstrated.
* Teamwork and conflict resolution skills shown.
* Apparent level of drive and ambition.
* Communication style (clarity, conciseness).
* Overall potential 'fit' for Innovate Inc.'s energetic and collaborative culture.

### ASSESSMENT SUMMARY ###
\`\`\`

## Audit steps: applying the lens grinder's test

**1. Goal and stakes.** The goal is initial candidate screening. The stakes are high: biased assessments can lead to unfair hiring practices, discrimination, loss of diverse talent and potential legal issues.

**2. Subjectivity analysis.** Identify the terms prone to biased interpretation.

- *Potential suitability, cultural fit:* highly subjective, often encodes **affinity bias** (favouring people similar to the existing team) and can penalize candidates from different backgrounds or with different communication styles. What defines "fit"?
- *Apparent level of drive and ambition:* subjective interpretation. Stereotypes about how different genders or cultures express ambition could bias the assessment. Directness might be rewarded while collaborative or community-focused motivation is undervalued.
- *Communication style (clarity, conciseness):* seemingly objective, but standards of "clarity" can be culturally biased. Indirect communication styles might be unfairly penalized, and a focus on conciseness might disadvantage candidates who give detailed context.
- *Energetic and collaborative culture:* vague terms open to biased interpretation based on stereotypes about age, personality or background.

**3. Input variation risks.**

- *Communication differences:* candidates who use indirect language, different levels of formality, or focus on group rather than individual achievements might be unfairly assessed on "style", "drive" or "fit".
- *Name and pronoun influence:* even if optional, demographic cues alongside subjective evaluation criteria raise the risk that the system activates learned biases and subtly shapes its assessment of traits like "ambition" or "fit".

**4. Potential biases identified.**

- *Gender bias:* "ambition", "assertiveness" or "leadership potential" (related to "fit") may be evaluated differently based on gender stereotypes.
- *Cultural and linguistic bias:* non-native speakers or people from different cultural communication norms might be penalized on "communication style" or "cultural fit", and different expressions of teamwork or motivation might be misread.
- *Affinity bias:* "cultural fit" strongly risks favouring candidates who resemble the existing team or the implicit biases of the evaluator reflected in the training data.
- *Subjectivity bias:* overall reliance on inferred traits rather than demonstrated skills opens the door wide to the biases learned from the data.

**5. Mitigation strategy brainstorm.**

- *Shift focus:* from assessing subjective traits (fit, ambition, style) to extracting objective **evidence** of specific skills demonstrated in the answers.
- *Remove subjective keywords:* eliminate terms like "cultural fit", "potential", "apparent" and "style".
- *Use objective language:* instruct the system to describe observed behaviours from the text, not to make character judgments.
- *Add explicit anti-bias constraints:* forbid inference based on demographics or subjective impressions, and mandate a focus on the text content only.
- *Optional but recommended:* remove names and pronouns from the input to this automated step if the workflow allows, to reduce bias triggers further. Use a candidate ID instead.

The next lesson shows the revised prompt. In the practice you will write your own.

**Try this:** pick any prompt that evaluates a person and run the subjectivity analysis: list every word in it that two reviewers could read differently.`,
  },
  {
    slug: "ethical-audit-workshop-the-revised-prompt-and-the-compass",
    title: "Ethical audit workshop, part 2: the revised prompt and the ethical compass",
    minutes: 7,
    covers: ["ch8-workshop-v2", "ch8-ethical-compass"],
    body: `## The revised prompt proposal (V2, mitigation applied)

\`\`\`
# Prompt V2: Candidate Skill Evidence Extractor (Revised for Objectivity) #
### CONTEXT ###
Role: You are an objective analysis tool extracting specific skill evidence from
candidate responses.
Goal: Identify concrete examples of Teamwork, Problem-Solving, and Initiative
demonstrated *within* the candidate's written answers provided below.

### CANDIDATE PROFILE ###
Candidate Identifier: [Unique ID or Placeholder]
Candidate Answers:
1. Teamwork Question: "Describe conflict resolution..." Answer: [Answer 1]
2. Problem-Solving Question: "Describe technical challenge..." Answer: [Answer 2]
3. Initiative Question: "Describe taking initiative..." Answer: [Answer 3]
   *(Question revised)*

### INSTRUCTION ###
Analyze the candidate's answers provided above **solely based on the text content**.
Generate a structured summary listing concrete evidence for each skill:
1. **Evidence of Teamwork/Conflict Resolution:** Quote/list specific
   actions/statements from Answer 1 demonstrating collaboration, communication, or
   resolution strategies.
2. **Evidence of Problem-Solving:** Quote/list specific steps/techniques/reasoning
   from Answer 2 demonstrating analytical thinking or solution implementation.
3. **Evidence of Initiative:** Quote/list specific examples from Answer 3
   demonstrating proactive behavior or improvement efforts.

### CRITICAL CONSTRAINTS & ETHICAL GUIDELINES ###
* **Strict Objectivity:** Base summary **exclusively** on statements/examples
  *within the answers*.
* **No Inferences:** **DO NOT** infer personality, ambition, style, potential, fit,
  demographics, or traits not explicitly demonstrated through described actions.
* **Focus on Behavior:** Extract *what the candidate wrote*, not interpretations of
  character.
* **Neutral Language:** Use neutral, descriptive language. Avoid evaluative adjectives.

### SKILL EVIDENCE SUMMARY ###
\`\`\`

## Workshop conclusion

The audit shows how easily subjective criteria in prompts can create pathways for bias. Prompt V1 risked unfair assessments based on potentially biased readings of "fit", "drive" and "style". Prompt V2 significantly reduces these risks by shifting the task from **subjective evaluation to objective evidence extraction**. It tells the system to act as a tool that surfaces relevant information from the text, and leaves the human reviewer to make the actual judgments from that extracted evidence, guided by their own expertise and bias awareness training.

That demonstrates a core principle of responsible AI use in sensitive areas: use the tool for objective information processing, and reserve subjective judgment and the final decision for accountable humans.

## The prompt engineer's ethical compass

Mastering prompt engineering goes beyond technical proficiency. It demands an ethical compass. The remarkable power of language systems to generate text that reflects human knowledge and interaction patterns carries the inherent risk of reflecting human flaws, particularly bias and potential harm.

- Understanding concepts like Constitutional AI helps us recognize that efforts are under way to bake safety and ethical principles, a Hippocratic oath for systems, into their core design, guiding them toward helpful and harmless behaviour. As prompt engineers we can work in alignment with those principles through careful instruction.
- Still, proactive **bias detection and mitigation** remains our direct responsibility. Like the lens grinder ensuring optical purity, we must diligently examine generated outputs for distortions, stereotypes and unfairness. By understanding the sources of bias (data and prompts), using testing strategies and, crucially, designing prompts with explicit fairness instructions, objective criteria, unbiased examples and clear constraints, we can actively reduce harmful outputs.
- The practical application, auditing the hiring prompt, underlines that responsible prompt design often means shifting from requesting subjective judgments to extracting objective evidence, which minimizes the avenues for bias to appear.

Ultimately, ethical considerations are not a separate checklist but an integral part of the craft. They need ongoing vigilance, critical self-reflection, a commitment to fairness and the integration of ethical thinking into every stage of prompt design, testing and refinement. As we guide these powerful systems, making sure they operate beneficially and equitably is not just good practice. It is our fundamental responsibility.

In one line: prompting with care by applying ethical guiding principles (the Hippocratic oath) and systematically addressing bias (the lens grinder's test) through understanding its sources and manifestations and using specific detection and mitigation techniques.

**Try this:** choose one prompt that judges people or content, and rewrite it as an evidence-extraction prompt with a "no inference" constraint.`,
  },
];

export const ETHICS_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "what-is-cai",
    kind: "choice",
    title: "Constitutional AI, conceptually",
    promptText: "What is the idea behind Constitutional AI, in the book's conceptual terms?",
    public: {
      options: [
        "Hard-coding a rule for every conceivable situation",
        "Hiring more human moderators to check every output",
        "Embedding a set of fundamental guidelines during training so the system learns to prefer principle-aligned responses",
        "Filtering the user's prompt before it reaches the model",
      ],
    },
    answer: { correct: 2 },
    explanation: "It is not a rule for every situation but a set of guiding principles that the system learns to follow, through stages such as recognizing violations and preferring compliant responses. It scales better than moderating every output afterwards.",
  },
  {
    slug: "order-how-a-constitution-works",
    kind: "order",
    title: "How a constitution shapes behaviour",
    promptText: "Put the three conceptual stages in the order the book gives.",
    public: {
      blocks: [
        { id: "act", text: "Act accordingly: lean toward refusing harmful requests and avoiding biased content" },
        { id: "prefer", text: "Prefer compliant responses: develop an internal preference for principle-aligned answers" },
        { id: "recognize", text: "Recognize principle violations: identify when a response might conflict with a principle" },
      ],
    },
    answer: { order: ["recognize", "prefer", "act"] },
    explanation: "The system first learns to recognize conflicts with the principles, then to prefer compliant responses, and as a result acts in line with them when it answers.",
  },
  {
    slug: "an-innocent-prompt-is-refused",
    kind: "choice",
    title: "An unexpected refusal",
    promptText: "A system refuses a prompt that seems harmless to you. What could explain it, according to the book?",
    public: {
      options: [
        "Your wording may touch a topic or phrasing that its constitutional training links to potentially harmful or biased output, so refusal is the safest option",
        "The system is broken and should be restarted",
        "Refusals never happen with well-aligned systems",
        "You must have been typing too fast",
      ],
    },
    answer: { correct: 0 },
    explanation: "Understanding that principles may be embedded helps you interpret refusals. Rephrasing to make the legitimate purpose clear is often the right response.",
  },
  {
    slug: "spot-biased-outputs",
    kind: "spot",
    title: "Which outputs are biased?",
    promptText: "Some of these outputs show bias and some do not. Select every biased output.",
    public: {
      pickPrompt: "Select every biased output",
      hitLabel: "Biased",
      missLabel: "Not biased",
      segments: [
        { id: "b1", text: "A profile that describes every programmer as a young man." },
        { id: "b2", text: "A list of computing pioneers from many regions and backgrounds." },
        { id: "b3", text: "A news summary that calls one group's protest a riot and another group's protest a demonstration." },
        { id: "b4", text: "A description of an engineer that uses \"they\" when no pronoun was given." },
        { id: "b5", text: "A \"typical\" low-wage applicant described with demeaning generalizations." },
      ],
    },
    answer: { flawed: ["b1", "b3", "b5"] },
    explanation: "A stereotypical association, a skewed sentiment for similar events and a harmful generalization are three manifestations of bias. A diverse list and neutral language are what you want to see.",
  },
  {
    slug: "name-the-manifestation",
    kind: "fill",
    title: "Name the manifestation",
    promptText: "Match each description to the manifestation of bias it describes.",
    public: {
      template:
        "Automatically linking roles or traits to demographic groups: {{a}}\nConsistently leaving some groups out of lists and examples: {{b}}\nDifferent emotional words for similar events depending on the group: {{c}}\nBroad, unsupported claims about a whole group: {{d}}\nDismissing real systemic discrimination: {{e}}",
      blanks: [
        { id: "a", choices: ["Stereotypical associations", "Underrepresentation or exclusion", "Skewed sentiment or tone", "Harmful generalizations", "Denial of harm"] },
        { id: "b", choices: ["Stereotypical associations", "Underrepresentation or exclusion", "Skewed sentiment or tone", "Harmful generalizations", "Denial of harm"] },
        { id: "c", choices: ["Stereotypical associations", "Underrepresentation or exclusion", "Skewed sentiment or tone", "Harmful generalizations", "Denial of harm"] },
        { id: "d", choices: ["Stereotypical associations", "Underrepresentation or exclusion", "Skewed sentiment or tone", "Harmful generalizations", "Denial of harm"] },
        { id: "e", choices: ["Stereotypical associations", "Underrepresentation or exclusion", "Skewed sentiment or tone", "Harmful generalizations", "Denial of harm"] },
      ],
    },
    answer: { correct: { a: "Stereotypical associations", b: "Underrepresentation or exclusion", c: "Skewed sentiment or tone", d: "Harmful generalizations", e: "Denial of harm" } },
    explanation: "These are the five manifestations the book lists: stereotypical associations, underrepresentation and exclusion, skewed sentiment or tone, harmful generalizations (with allocational harm), and denial of harm or bias.",
  },
  {
    slug: "which-prompt-invites-bias",
    kind: "choice",
    title: "Which request invites bias?",
    promptText: "Which request is the most likely to invite a biased answer?",
    public: {
      options: [
        "Assess this code on runtime efficiency and adherence to the style guide.",
        "Describe a typical nurse and say whether they would be a good cultural fit.",
        "List the skills demonstrated in the answers below, quoting the text.",
        "Summarize the three arguments given in this article.",
      ],
    },
    answer: { correct: 1 },
    explanation: "Asking for a \"typical\" person and for subjective \"fit\" invites the system to fall back on stereotypes. Objective criteria and evidence extraction from given text leave far less room for bias.",
  },
  {
    slug: "order-the-test-kit",
    kind: "order",
    title: "The lens grinder's test kit",
    promptText: "Put the four detection methods in the order the book gives.",
    public: {
      blocks: [
        { id: "patterns", text: "Look for patterns across several outputs" },
        { id: "critical", text: "Critical reading and questioning" },
        { id: "criteria", text: "Check against explicit fairness criteria (a checklist)" },
        { id: "diverse", text: "Diverse input testing: vary names, scenarios, stereotypes" },
      ],
    },
    answer: { order: ["critical", "diverse", "criteria", "patterns"] },
    explanation: "Start with careful reading, then probe for differential treatment by varying inputs, then check against criteria you defined in advance, and finally look for patterns across outputs.",
  },
  {
    slug: "the-name-swap",
    kind: "choice",
    title: "Ahmed and Emily",
    promptText: "You run the same performance review prompt twice, once for \"employee Ahmed\" and once for \"employee Emily\", then compare the outputs. Which detection method is this?",
    public: {
      options: [
        "Critical reading only",
        "Checking against a fairness checklist",
        "Looking for patterns in a single output",
        "Diverse input testing, probing for differential treatment",
      ],
    },
    answer: { correct: 3 },
    explanation: "Changing names or pronouns in otherwise identical scenarios and comparing praise, criticism and assumed traits is the book's example of probing for differential treatment.",
  },
  {
    slug: "spot-the-mitigations",
    kind: "spot",
    title: "Which instructions reduce bias?",
    promptText: "Select every instruction that helps reduce bias in the output.",
    public: {
      pickPrompt: "Select every instruction that helps",
      hitLabel: "Reduces bias",
      missLabel: "Does not help",
      segments: [
        { id: "t1", text: "Ensure the response is equitable and free from bias based on gender, race, age or other protected characteristics." },
        { id: "t2", text: "Evaluate based SOLELY on the following objective criteria, and do NOT consider inferred demographic factors." },
        { id: "t3", text: "Describe the candidate's cultural fit and apparent drive." },
        { id: "t4", text: "Use gender-neutral language unless specific pronouns are provided and necessary." },
        { id: "t5", text: "Give examples that all show the same type of person in the same role." },
      ],
    },
    answer: { flawed: ["t1", "t2", "t4"] },
    explanation: "Explicit fairness instructions, objective criteria and gender-neutral language reduce bias. Subjective terms like \"fit\" and \"drive\" and examples that lack diversity invite it.",
  },
  {
    slug: "repair-the-hiring-prompt",
    kind: "repair",
    title: "Audit and repair the hiring prompt",
    promptText: "Rewrite this prompt as the audit recommends: extract objective evidence instead of judging fit, forbid inference, use a candidate identifier and neutral language, and base the summary only on the text of the answers.",
    public: {
      starter: "You are an HR manager. Assess the candidate's potential and cultural fit and apparent drive from the answers below. Candidate Name: [Name]. Answers: [Answers]. Write a 3-sentence assessment.",
      hint: "Turn the task into listing concrete evidence for named skills, forbid inferring personality or demographics, replace the name by an identifier, and require neutral, descriptive language.",
    },
    answer: {
      criteria: [
        { id: "evidence", label: "Asks for concrete evidence, not a judgment", weight: 3, anyOf: ["\\b(evidence|concrete examples?|specific (actions|statements|examples))\\b"], hint: "Ask for concrete evidence of named skills, quoting the answers." },
        { id: "noinfer", label: "Forbids inferring personality, fit or demographics", weight: 3, anyOf: ["\\b(do not|don't|no|never|avoid)\\b[^.\\n]{0,40}\\b(infer\\w*|assum\\w*|judg\\w*)\\b[^.\\n]{0,80}\\b(personality|ambition|fit|demographics?|traits?|potential|style)\\b"], hint: "Add: DO NOT infer personality, ambition, fit or demographics." },
        { id: "textonly", label: "Bases the summary only on the text of the answers", weight: 2, anyOf: ["\\b(solely|only|exclusively)\\b[^.\\n]{0,60}\\b(text|answers?|content|written)\\b"], hint: "Say to use solely the text of the answers." },
        { id: "id", label: "Replaces the name with an identifier", weight: 1, anyOf: ["\\bcandidate (id|identifier)\\b", "\\b(unique )?id\\b"], hint: "Use a candidate identifier instead of the name." },
        { id: "neutral", label: "Requires neutral, descriptive language", weight: 1, anyOf: ["\\b(neutral|descriptive|objective)\\b"], hint: "Ask for neutral, descriptive language without evaluative adjectives." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an objective analysis tool extracting skill evidence from candidate answers.\n\n### CANDIDATE ###\nCandidate Identifier: [ID]\nAnswers: [Answers]\n\n### INSTRUCTION ###\nBased solely on the text of the answers, list concrete evidence of teamwork, problem-solving and initiative, quoting specific actions.\n\n### CONSTRAINTS ###\n- DO NOT infer personality, ambition, style, potential, fit or demographics.\n- Use neutral, descriptive language with no evaluative adjectives.",
    },
    explanation: "The audit's core move is from subjective evaluation to objective evidence extraction: the tool surfaces what the candidate wrote, and accountable humans make the judgment. The constraints forbid inference, the identifier removes demographic cues, and neutral language avoids loaded terms.",
    samples: {
      good: [
        "Act as an analysis tool. Candidate ID: 17. Using only the written answers, list specific actions that show teamwork or problem solving. Never infer personality or demographics. Keep the language neutral.",
      ],
      bad: ["Summarize the candidate fairly and without bias.", "Rate the candidate. Do not be biased."],
    },
  },
];

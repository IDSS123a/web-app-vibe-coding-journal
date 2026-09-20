/**
 * Chapter "Resources, Platforms and Tools" (book Appendix E, further reading and resources, and Appendix F, prompting
 * platforms and tools): 4 lessons and 10 exercises, written from the Director's book, which is the only source. The book
 * names no specific reading list (it points to kinds of sources) and names product families only as examples, so this
 * chapter does the same and adds no titles or links of its own. No em dashes (writing rule, PDL-057). `samples` on repair
 * exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";

export const RESOURCES_LESSONS: LessonContent[] = [
  {
    slug: "beyond-the-workshop-foundations-and-craftsmanship",
    title: "Beyond the workshop: foundations and craftsmanship",
    minutes: 8,
    covers: ["appE-intro", "appE-foundational", "appE-practical"],
    body: `The manual has laid out the foundational principles and practical techniques of prompt engineering, equipping you, the advanced non-coder, with the tools and understanding to guide today's powerful computational language systems. The journey ran from the basic anatomy of a prompt, through methods for instruction, demonstration and reasoning, to the crucial considerations of structure, security, optimization and ethics: a comprehensive workshop for an emerging craft.

The field, however, is characterized by dynamic change. The capabilities of language models, the interfaces we use and the very techniques for effective interaction are evolving at a remarkable pace. True mastery therefore needs more than the knowledge in the book. It demands an ongoing commitment to learning, critical observation and thoughtful adaptation.

Appendix E is a curated guidepost: avenues for deepening your understanding and for staying informed as the landscape keeps shifting. It focuses on resources that emphasize fundamental principles, practical application, ethical awareness and navigating the rapid currents of information, rather than transient technical details. Note that it points to kinds of sources, not to a fixed list of titles, so it does not go out of date. Consider it your starting map for continued exploration.

## 1. Foundational concepts: strengthening the bedrock

The book focuses on the practical craft without deep technical dives, but a richer conceptual grasp of how information, language and computation interact can significantly strengthen your intuition for prompt engineering. Understanding the why behind the how often leads to more effective problem solving. Three areas are recommended:

- **Accessible explainers of computation and information.** Seek out high-quality resources (articles, books, reputable online courses, documentaries) that explain the fundamental concepts of computation and information theory in an intuitive, non-mathematical way. Ideas like how instructions lead to actions, the nature of algorithms (even described simply) or how information can be structured and encoded provide mental models that are relevant to prompt design. Look for authors and creators known for their clarity in demystifying complex topics for a broad audience.
- **An introduction to linguistics or the philosophy of language.** A basic appreciation of how human language works (its structure, its ambiguity, its dependence on context, and the relationship between words and meaning) sharpens your ability to write precise prompts and to anticipate how a language-focused system might interpret them. Introductory materials on these subjects show the inherent complexities you are navigating.
- **Logic and critical thinking.** The ability to structure thoughts logically, identify assumptions, evaluate arguments and break down complex problems is paramount in prompt engineering. Resources dedicated to improving critical thinking or to the basics of logical reasoning directly improve your ability to design clear, coherent and effective prompts.

## 2. Practical prompting techniques: communities and craftsmanship

Specific prompts for specific models can quickly become outdated, but the techniques and patterns shared among practitioners have enduring value. Learning from the collective experience of others is crucial.

- **Reputable AI lab and research blogs.** Major organizations that drive AI development often publish articles that explain new techniques, safety approaches or notable system capabilities. They are often aimed at a technically aware but broad audience, and they give insight into best practices and emerging methods. Focus on how the techniques work conceptually.
- **Curated online communities.** Take part discerningly in well-moderated forums or groups focused on prompt engineering methodology. Look for discussions that analyze why certain prompt structures work, strategies for specific tasks (summarization, coding assistance, creative writing), debugging techniques and comparisons of different approaches. Prioritize communities that emphasize analysis and technique over simply sharing generated outputs without context, and use critical judgment about the quality and reliability of the advice that is shared.
- **Hands-on experimentation platforms.** The most effective way to build practical skill remains direct experimentation. Use the interfaces ("playgrounds") provided by language model developers and treat them as your personal workshop: systematically test different instruction phrasings, context variations, example structures and constraint combinations. Observe the results directly. Note what works and what fails, and try to understand why. This empirical learning is invaluable.

**Try this:** choose one book, course or documentary on how language or computation works, and one community you would join, and write down what you would want to learn from each.`,
  },
  {
    slug: "staying-current-ethics-and-the-enduring-craft",
    title: "Staying current, the ethical compass and the enduring craft",
    minutes: 8,
    covers: ["appE-staying-current", "appE-ethics", "appE-enduring-craft"],
    body: `## 3. Staying current: navigating the information flow

The rapid evolution of AI needs strategies for staying informed without being submerged in noise. Focus on understanding significant trends and principles rather than chasing every incremental model update.

- **High-quality AI summaries and newsletters.** Identify and subscribe to reputable sources that curate, summarize and analyze the key developments in AI research, applications, ethics and policy. Look for those known for giving context, balanced perspectives and clear explanations, which filter the signal from the noise.
- **Major AI conference overviews.** Leading AI research conferences (such as NeurIPS, ICML, ACL and FAccT) are venues where significant advances are often first presented. Individual papers are highly technical, but reading high-level summaries, trend analyses or keynote reports from these conferences can give valuable insight into the directions the field is heading.
- **The arXiv pre-print server (cs.CL and cs.AI sections).** For those who want to see research very early, arXiv.org hosts papers before formal peer review. The Computation and Language (cs.CL) and Artificial Intelligence (cs.AI) categories are the most relevant. Approach it with caution: arXiv content is not peer-reviewed and its quality varies immensely. Look for papers that propose novel prompting techniques, alignment methods or rigorous capability evaluations, and keep a critical skepticism.

## 4. Ethics, safety and responsibility: the essential compass

Technical proficiency in prompt engineering must be accompanied by a strong ethical compass. Understanding the potential societal impacts and risks is non-negotiable.

- **Dedicated AI ethics and safety resources.** Follow the work of established independent research institutes, university centers and non-profit organizations that focus specifically on AI ethics, fairness, accountability, transparency, safety and societal implications. They publish crucial reports, frameworks and analyses. (The book suggests you search for the current leading organizations in AI ethics and governance.)
- **Studies on AI bias.** Seek out foundational research and reports that explain how biases (gender, racial, cultural and others) show up in language models and other AI systems, and that discuss technical and procedural mitigation strategies. Understanding the mechanisms of bias helps you detect and reduce it.
- **Discussions on AI alignment.** Engage with thoughtful material (articles, podcasts, books, debates) that explores the complex challenge of ensuring that powerful AI systems consistently act in line with human values and intentions. Prioritize sources that grapple with the nuances and difficulties involved.

## The enduring craft

The tools change, the interfaces evolve, the capabilities expand: that is the nature of technology. The specific syntax of Markdown or the optimal phrasing for today's models might be refined or replaced in the coming years. The fundamental principles of effective communication and structured thinking that underpin successful prompt engineering, however, have a timeless quality.

The ability to define intent clearly, provide the necessary context, structure information logically, instruct with precision, demonstrate through examples, set appropriate boundaries, test assumptions rigorously, learn from failures and act with ethical consideration: these are enduring skills that apply to any complex interaction, human or computational.

The manual aimed to give a solid grounding in these principles, applied to the craft of guiding modern language systems. The resources above offer pathways for continued learning. But true, lasting mastery will come from your own persistent practice, your critical engagement with the technology, your thoughtful adaptation to new developments and your unwavering commitment to using these powerful tools responsibly. The craft continues. May your journey in mastering it be both productive and principled.

**Try this:** write your own three-line learning plan: one source for staying current, one for ethics and one habit of hands-on practice, each with a day of the week.`,
  },
  {
    slug: "where-the-craft-happens-four-kinds-of-workbench",
    title: "Where the craft happens: four kinds of workbench",
    minutes: 10,
    covers: ["appF-intro", "appF-cat-web", "appF-cat-playground", "appF-cat-api", "appF-cat-integrated"],
    body: `Throughout the manual the focus has been the craft of prompt engineering: the principles, the techniques and the mindset needed to communicate effectively with computational language systems. The prompt itself was treated as the intricate mechanism or the detailed blueprint. But just as a skilled artisan needs a suitable workshop and the right tools, whether a simple sturdy table for sketching or a fully equipped studio with specialized machinery, the prompt engineer needs a place to practice. Where do you actually write, test and refine these prompts?

The landscape of tools and platforms for interacting with language models is diverse and changes rapidly. There is no single best place. The ideal environment depends heavily on your goals, your technical comfort level, your budget and the nature of your tasks. Choosing a platform is like choosing a workbench: do you need a simple, accessible surface for quick tasks, a highly configurable station for precision work, or the components to build a custom setup that is integrated into a larger system?

Appendix F gives a conceptual overview of the main types of platforms and tools, to help you understand the trade-offs. It focuses on types of environments rather than on specific, potentially short-lived product names, which gives you a framework for evaluation.

## 1. Types of prompting environments: from simple chat to complex integration

### a) Simple web interfaces and chatbots (the ready-made hand tool)

**Description.** The most common and accessible entry points: public-facing websites (the book names ChatGPT, Claude and Gemini) where you interact through a conversational chat interface.

**How you prompt.** You type your prompt directly into the chat box, often building on previous turns in the conversation. System instructions might be set implicitly by the platform, or sometimes be customizable through settings or initial instructions.

**Pros.** Extremely easy to use, no technical setup, often free tiers, great for brainstorming, quick questions, basic text generation and initial experimentation.

**Cons.** Limited control over the underlying model parameters (like temperature), often less visibility into system instructions, context window limits that can be unclear or restrictive for very long prompts or conversations, and major concerns about data privacy and usage policies. Assume that public interactions may be used for training unless explicitly stated otherwise.

**Best for.** Casual use, learning basic prompting, idea generation, and tasks where strict control and data privacy are not paramount.

### b) Developer playgrounds and studios (the well-equipped workbench)

**Description.** Web-based interfaces provided by AI model developers (the book names the OpenAI Playground, Google AI Studio and the Anthropic Console), designed for more serious prompt development and testing.

**How you prompt.** They offer more granular control. You can often set a system prompt that defines the AI's role and core instructions separately from the user prompt (your specific request). You can frequently select different model versions, adjust parameters like temperature (randomness) or max tokens (output length), and test prompt variations easily.

**Pros.** Much greater control over prompts and parameters, support for systematic testing and iterative refinement, often a display of token usage, a clearer separation of system and user roles, and sometimes the ability to save and share prompts.

**Cons.** A slightly steeper learning curve than simple chat, often an account and possibly an API key, usage that may cost money (though free tiers or credits are common at first), and data privacy policies that still need careful review.

**Best for.** Serious prompt engineering, iterative refinement cycles, testing prompt variations (A/B testing in concept), developing prompts intended for later API integration, and tasks that need fine control over output style or consistency. This is often the preferred workbench for dedicated prompt crafting.

### c) APIs (the raw components and wiring)

**Description.** Interacting with the language model programmatically by sending structured requests and receiving structured responses, typically with code. For the advanced non-coder this may seem daunting, but it is important to understand, because APIs are how language models are integrated into other software and tools. Increasingly, low-code and no-code platforms (the book names Zapier, Make and specialized AI workflow builders) provide graphical interfaces to these APIs without traditional code.

**How you prompt (indirectly).** You define the prompt content (system prompt, user message, context) within the structure the API or the low-code tool's interface requires.

**Pros.** Maximum flexibility and control, automation and integration into custom workflows or applications, and complex logic such as chaining prompts or integrating external data sources dynamically.

**Cons.** Some technical setup, even with low-code tools. Usually direct costs based on usage (pay per token). Understanding basic concepts like API keys and structured data (JSON) is often necessary, and debugging requires understanding the interaction flow.

**Best for.** Automating repetitive prompting tasks, integrating AI capabilities into websites or business processes, complex workflows with several steps or data sources, and situations that need maximum control (reached through low-code tools or simple scripts).

### d) Integrated tools and applications (the specialized power tool)

**Description.** Software applications that have language model capabilities built in for specific purposes: AI writing assistants embedded in word processors, AI features within CRM software, specialized data analysis tools with natural language querying, and so on.

**How you prompt.** Interaction is usually mediated through the application's own user interface. You might fill in specific fields, use predefined commands or talk to a constrained chat window inside the tool. Your ability to craft arbitrary prompts may be limited by the application's design.

**Pros.** Often highly optimized for a specific task, seamless integration into an existing workflow, and potentially a simpler interface than a general playground.

**Cons.** Prompting capabilities may be limited or constrained by the application's design ("prompting on rails"), less control over the underlying model or parameters, and functionality tied to the specific software subscription or features.

**Best for.** Using AI for specific tasks within a tool you already use, and situations where ease of use within a workflow matters more than maximum prompting flexibility.

| Environment | Metaphor | Control | Best for |
| --- | --- | --- | --- |
| Web chat | Ready-made hand tool | Low | Casual use, learning, ideas |
| Playground or studio | Well-equipped workbench | High | Serious prompt crafting and testing |
| API and low-code | Raw components and wiring | Maximum | Automation and integration |
| Integrated tool | Specialized power tool | Limited by the app | Tasks inside a tool you already use |

**Try this:** for three tasks you do this month, say which of the four environments fits each and why.`,
  },
  {
    slug: "choosing-your-workbench-cost-and-privacy",
    title: "Choosing your workbench: control, cost and privacy",
    minutes: 9,
    covers: ["appF-choosing", "appF-free-vs-paid", "appF-privacy", "appF-right-tool"],
    body: `## 2. Choosing your workbench: key factors to consider

Selecting the right platform or platforms depends on your specific needs and context.

- **Task complexity and goal.** Are you just brainstorming ideas? A web chat might suffice. Or are you developing a complex, multi-step analysis that needs precise formatting and strict grounding? Then a playground, or an API through a low-code tool, is likely needed. Match the tool's capability to the task's demands.
- **Need for control.** Do you need to fine-tune parameters like temperature for creativity versus predictability? Do you need to separate system and user prompts explicitly? Do you need to select specific model versions? Playgrounds and APIs offer more control than simple web chats or highly integrated tools.
- **Technical comfort level.** Be realistic about your willingness to work with interfaces beyond a simple chat box. Playgrounds are a good step up. APIs through low-code tools offer more power but require learning that tool's interface.
- **Budget.** Free tiers on web chats and playgrounds are great for learning and experimentation, but heavy use or API integration almost always involves costs (pay per token or subscription fees). Factor this in if you scale up.
- **Data sensitivity and privacy (critical).** This is often the deciding factor for professional or sensitive work.
  - **Public web chats:** assume data may be used for training unless the provider explicitly guarantees otherwise through user settings or terms of service. They are generally unsuitable for confidential company data, personally identifiable information (PII) or sensitive intellectual property.
  - **Playgrounds and studios:** check the provider's data usage policy carefully. Some explicitly state that playground data is not used for training (especially for paid accounts and API users), but verify.
  - **APIs:** data sent through APIs often has stronger privacy guarantees (typically not used for training by default), but always read the terms of service. The responsibility for securing API keys is yours.
  - **Enterprise solutions:** for highly sensitive corporate data, dedicated enterprise versions of these platforms or privately hosted models might be necessary, offering greater security and privacy assurances, usually at a higher cost.
- **Collaboration.** Do you need to share, version and collaborate on prompts with team members easily? Some playgrounds or specialized prompt management tools offer features for this.
- **Required features.** Does your task need specific capabilities such as tool use (MRKL), multimodal input (image processing) or access to the very latest experimental models? Platform capabilities vary significantly.

## 3. A note on free versus paid tools

Free tools are invaluable for learning, experimentation and many casual tasks. Be aware of the common trade-offs:

- **Data usage.** Free services often subsidize their costs by using interaction data to improve their models. Check the privacy policies.
- **Limited control.** Fewer options to control model behavior, parameters or system prompts.
- **Rate limits and availability.** Free tiers may have stricter usage limits or slower response times during peak periods.
- **Older models.** Free tiers sometimes use slightly older or less capable model versions than paid API access.

Paid options (API usage, subscriptions) generally offer more control, better performance, stronger privacy assurances (usually) and higher usage limits, but they require budget management.

## 4. Data privacy and security: a non-negotiable consideration

Regardless of the platform, you are responsible for the data you put into prompts.

- **Read the terms.** Always understand the data usage and privacy policy of any platform you use. Where does your data go? Who can access it? Is it used for training?
- **Avoid sensitive data on public tools.** Never paste confidential company information, personal secrets, PII, sensitive client data or unpublished intellectual property into public web chat interfaces or free playgrounds, unless you have explicit confirmation that the data is private and not used for training.
- **Anonymize or summarize.** If you analyze sensitive data, try to anonymize it, or use summarized, non-identifiable versions in your prompts, whenever possible.
- **Secure API keys.** If you use APIs, treat your API keys like passwords: keep them confidential and secure.
- **Consider enterprise or private options.** For work with highly sensitive data, investigate enterprise-grade solutions or platforms that offer dedicated private instances or stronger contractual guarantees.

## The right tool for the task

There is no single best platform for prompt engineering. The simple web chat is like a convenient pocketknife, excellent for quick, simple tasks. The developer playground is the well-equipped workbench, ideal for careful crafting and refinement. APIs and low-code tools provide the components for building custom automated solutions. Integrated tools offer specialized convenience within existing workflows.

The skilled prompt engineer understands the strengths and limits of each type of environment. They choose their workbench by the specific requirements of the task at hand, balancing ease of use, control, cost and the crucial considerations of data privacy and security. The principles of crafting effective prompts remain constant, but choosing the appropriate platform gives you the right environment to apply them effectively and responsibly. Choose your workbench wisely.

**Try this:** list the last three things you pasted into an AI tool, and for each one say whether it would still be safe if it were anonymized.`,
  },
];

const ENVIRONMENT_CHOICES = ["Simple web chat", "Developer playground or studio", "API and low-code tools", "Integrated tool inside an application"];

export const RESOURCES_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "arxiv-caution",
    kind: "choice",
    title: "Reading arXiv",
    promptText: "The book recommends the arXiv sections cs.CL and cs.AI for seeing research early. What caution does it attach?",
    public: {
      options: [
        "Every paper there has been peer-reviewed, so it can be trusted",
        "Only papers from big companies are allowed",
        "It is not peer-reviewed and quality varies immensely, so keep a critical skepticism",
        "It only contains papers about prompt injection",
      ],
    },
    answer: { correct: 2 },
    explanation: "arXiv hosts papers before formal peer review. Look for papers that propose novel prompting techniques, alignment methods or rigorous capability evaluations, and read them critically.",
  },
  {
    slug: "environments-and-metaphors",
    kind: "fill",
    title: "The four workbenches",
    promptText: "Match each metaphor from Appendix F to the environment it describes.",
    public: {
      template:
        "The ready-made hand tool: {{a}}\nThe well-equipped workbench: {{b}}\nThe raw components and wiring: {{c}}\nThe specialized power tool: {{d}}",
      blanks: [
        { id: "a", choices: ENVIRONMENT_CHOICES },
        { id: "b", choices: ENVIRONMENT_CHOICES },
        { id: "c", choices: ENVIRONMENT_CHOICES },
        { id: "d", choices: ENVIRONMENT_CHOICES },
      ],
    },
    answer: { correct: { a: "Simple web chat", b: "Developer playground or studio", c: "API and low-code tools", d: "Integrated tool inside an application" } },
    explanation: "The web chat is the simple, accessible hand tool, the playground is the workbench for careful crafting, APIs are the raw components for custom automation, and integrated tools are power tools for one job inside an application.",
  },
  {
    slug: "pick-the-playground",
    kind: "choice",
    title: "Which environment for iterative refinement?",
    promptText: "You want to run an A/B test of two prompt versions, set the system prompt separately, adjust the temperature and see token usage. Which environment does the book recommend as the preferred workbench?",
    public: {
      options: [
        "A simple web chat",
        "A developer playground or studio",
        "An integrated tool inside a word processor",
        "None, this cannot be done outside code",
      ],
    },
    answer: { correct: 1 },
    explanation: "Playgrounds and studios offer granular control: a separate system prompt, selectable model versions, temperature and max tokens, and token usage. That is what serious prompt engineering and iterative refinement need.",
  },
  {
    slug: "spot-unsafe-privacy",
    kind: "spot",
    title: "Unsafe with data",
    promptText: "Select every practice that breaks the book's rules for data privacy and security.",
    public: {
      pickPrompt: "Select every practice that breaks the rules",
      hitLabel: "Unsafe",
      missLabel: "Safe",
      segments: [
        { id: "u1", text: "Pasting a client's full contract and personal details into a free public chat to get a quick summary." },
        { id: "u2", text: "Keeping API keys confidential and secure, like passwords." },
        { id: "u3", text: "Sending unpublished intellectual property to a free playground without confirming how the data is used." },
        { id: "u4", text: "Replacing names and identifiers with placeholders before analyzing a sensitive case." },
        { id: "u5", text: "Putting an API key in a shared screenshot to show colleagues how it works." },
      ],
    },
    answer: { flawed: ["u1", "u3", "u5"] },
    explanation: "Never paste confidential or personal data into public tools without explicit confirmation that it is private and not used for training, and treat API keys like passwords. Anonymizing and keeping keys secret are what the book asks for.",
  },
  {
    slug: "order-experimentation",
    kind: "order",
    title: "Hands-on experimentation",
    promptText: "Put the steps of the book's advice on hands-on experimentation in order.",
    public: {
      blocks: [
        { id: "understand", text: "Try to understand why, and learn from what worked and what failed" },
        { id: "use", text: "Use a playground provided by a model developer as your personal workshop" },
        { id: "observe", text: "Observe the results directly" },
        { id: "test", text: "Systematically test instruction phrasings, context variations, example structures and constraint combinations" },
      ],
    },
    answer: { order: ["use", "test", "observe", "understand"] },
    explanation: "Open the workshop, test systematically, observe the results, and then learn from what worked and what failed. This empirical learning is the most effective way to build practical skill.",
  },
  {
    slug: "free-tools-tradeoff",
    kind: "choice",
    title: "Trade-offs of free tools",
    promptText: "Which is a common trade-off of free tools, according to the book?",
    public: {
      options: [
        "Free services often subsidize their costs by using interaction data to improve their models",
        "Free tools never have usage limits",
        "Free tiers always use the newest models",
        "Free tools give more control over parameters than paid ones",
      ],
    },
    answer: { correct: 0 },
    explanation: "The trade-offs are data usage, limited control, rate limits and availability, and sometimes older models. Paid options generally offer more control, performance, privacy assurances and higher usage limits.",
  },
  {
    slug: "sources-to-purposes",
    kind: "fill",
    title: "Staying current",
    promptText: "Match each source of information to what it is good for.",
    public: {
      template:
        "Reputable newsletters and summaries: {{a}}\nConference overviews such as NeurIPS, ICML, ACL and FAccT: {{b}}\nThe arXiv cs.CL and cs.AI sections: {{c}}",
      blanks: [
        { id: "a", choices: ["Curating and analyzing key developments with context, filtering the signal from the noise", "Insight into the directions the field is heading, through summaries and trend analyses", "Very early research before peer review, read with skepticism", "Guaranteed instructions for every model"] },
        { id: "b", choices: ["Curating and analyzing key developments with context, filtering the signal from the noise", "Insight into the directions the field is heading, through summaries and trend analyses", "Very early research before peer review, read with skepticism", "Guaranteed instructions for every model"] },
        { id: "c", choices: ["Curating and analyzing key developments with context, filtering the signal from the noise", "Insight into the directions the field is heading, through summaries and trend analyses", "Very early research before peer review, read with skepticism", "Guaranteed instructions for every model"] },
      ],
    },
    answer: { correct: { a: "Curating and analyzing key developments with context, filtering the signal from the noise", b: "Insight into the directions the field is heading, through summaries and trend analyses", c: "Very early research before peer review, read with skepticism" } },
    explanation: "Newsletters filter the noise, conference overviews show where the field is heading without the technical depth of individual papers, and arXiv gives the earliest, least vetted view.",
  },
  {
    slug: "public-chat-suitability",
    kind: "choice",
    title: "Where confidential data does not belong",
    promptText: "Which environment does the book call generally unsuitable for confidential company data, personal identifiable information or sensitive intellectual property?",
    public: {
      options: [
        "A privately hosted enterprise model",
        "API access with terms of service you have read",
        "A paid playground with a policy that says data is not used for training",
        "Public web chats, where data may be used for training unless the provider guarantees otherwise",
      ],
    },
    answer: { correct: 3 },
    explanation: "Public web chats should be assumed to use data for training unless the provider explicitly guarantees otherwise. Playgrounds and APIs need a policy check, and enterprise solutions exist for highly sensitive data.",
  },
  {
    slug: "enduring-skills",
    kind: "spot",
    title: "The enduring skills",
    promptText: "Select every skill the book lists as enduring, applicable to any complex interaction with human or computational partners.",
    public: {
      pickPrompt: "Select every skill the book lists as enduring",
      hitLabel: "Enduring",
      missLabel: "Not listed",
      segments: [
        { id: "e1", text: "Define intent clearly." },
        { id: "e2", text: "Memorize the current syntax of every interface." },
        { id: "e3", text: "Test assumptions rigorously and learn from failures." },
        { id: "e4", text: "Set appropriate boundaries and act with ethical consideration." },
        { id: "e5", text: "Always use the newest model regardless of the task." },
      ],
    },
    answer: { flawed: ["e1", "e3", "e4"] },
    explanation: "The enduring skills are clear intent, the necessary context, logical structure, precise instruction, demonstration through examples, boundaries, rigorous testing, learning from failures and ethical consideration. Interfaces and models change.",
  },
  {
    slug: "repair-anonymize-a-prompt",
    kind: "repair",
    title: "Anonymize before you paste",
    promptText: "The starter contains personal data that should not go into a public tool. Rewrite it as a safe prompt: an action verb, anonymized placeholders instead of real names and identifiers, a rule not to identify anyone, and an output format.",
    public: {
      starter: "Summarize this: Amra Hodzic, personal ID 0101990123456, owes 12,400 BAM to Company X and has missed three payments.",
      hint: "Replace the name, the ID and the company with placeholders such as Client A, tell the system not to try to identify anyone, and ask for a short format like three bullet points.",
    },
    answer: {
      criteria: [
        { id: "verb", label: "Starts with an action verb", weight: 1, anyOf: ["\\b(summari[sz]e|list|explain|analy[sz]e|describe)\\b"], hint: "Use a clear verb such as Summarize." },
        { id: "placeholder", label: "Uses anonymized placeholders", weight: 3, anyOf: ["\\[[^\\]]+\\]", "\\bclient [a-z]\\b", "\\banonymi[sz]ed\\b", "\\bplaceholder\\w*\\b"], hint: "Replace names and identifiers with placeholders such as Client A or [NAME]." },
        { id: "noident", label: "Says not to identify anyone", weight: 2, anyOf: ["\\bdo not (try to )?(identify|guess|reveal|infer)\\b", "\\b(never|don't) (identify|guess|reveal)\\b"], hint: "Add a rule such as: do not try to identify any person or company." },
        { id: "format", label: "Names an output format", weight: 2, anyOf: ["\\b(bullet\\w*|numbered|table|paragraph|sentences?|list)\\b"], hint: "Ask for a format such as three bullet points." },
      ],
      model:
        "Summarize the following case in three bullet points. The person is anonymized as Client A, the creditor is [COMPANY] and the amount is [AMOUNT]. Client A has missed three payments. Do not try to identify anyone.",
    },
    explanation: "Appendix F says to anonymize or summarize sensitive data before using it in prompts, and never to paste personal or confidential data into public tools without confirmation. The rewrite keeps the task and drops the identifying details.",
    samples: {
      good: [
        "Summarize the case below as a short list. Use placeholders: the debtor is [CLIENT] and the company is [CREDITOR]. The debtor missed three payments. Do not try to guess who they are.",
      ],
      bad: ["Summarize this: Amra Hodzic, personal ID 0101990123456, owes 12,400 BAM to Company X and has missed three payments.", "Give me a quick overview of this client's situation."],
    },
  },
];

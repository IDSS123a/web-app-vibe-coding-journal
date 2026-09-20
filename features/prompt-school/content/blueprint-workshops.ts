/**
 * Capstone workshops (specs/prompt-school/, phase C): the book's Appendix B ends by saying that a blueprint is a
 * foundation, and that the craft lies in customizing it for your own case. Each blueprint chapter already had one or
 * two repair exercises; this file gives EVERY one of the 15 blueprints its own hands-on workshop, so the learner
 * writes a version of each blueprint for a case of their own, graded by a rubric of what makes that blueprint work.
 * Twelve are new here (the three that already existed are the warehouse, call center and scientific writing ones).
 * Written from the same book text as the lessons. No em dashes (writing rule, PDL-057). `samples` exist only for
 * the content test.
 */
import type { ExerciseWithSamples } from "./five-pillars";

export const WORKSHOP_1_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "workshop-market-analysis",
    kind: "repair",
    title: "Workshop: your own market analysis",
    promptText: "Adapt the perfume launch blueprint to a product and a city of your own. The starter is only a wish. Give it a role, a target audience, numbered analysis steps, an honest data instruction and headings for the report.",
    public: {
      starter: "Tell me about the market for our new coffee shop in Tuzla.",
      hint: "Start with a role and the target audience. Split the work into steps (market size, competitors, communication). Tell the system to use its most current data or simulate a lookup and to state its confidence. Ask for Markdown headings.",
    },
    answer: {
      criteria: [
        { id: "role", label: "Gives a role", weight: 1, anyOf: ["\\b(you are|role)\\b"], hint: "Start with a role, for example: You are an AI market analyst." },
        { id: "steps", label: "Splits the work into numbered steps", weight: 2, anyOf: ["\\b(step 1|1\\.|first)\\b[\\s\\S]*\\b(step 2|2\\.|second|then)\\b"], hint: "Number the steps: Step 1 market size, Step 2 competitors, Step 3 communication." },
        { id: "headings", label: "Asks for headings in the report", weight: 2, anyOf: ["(^|\\n)\\s*#{1,3}\\s+\\S"], hint: "Ask for the report under Markdown headings, one per step." },
        { id: "data", label: "Handles the data dependency honestly", weight: 2, anyOf: ["\\b(simulate|current (data|available)|state your confidence|cite sources|estimate)\\b"], hint: "Tell the system to use current data or simulate a lookup, and to state its confidence." },
        { id: "target", label: "Names the target audience or market", weight: 1, anyOf: ["\\b(target|audience|aged?)\\b"], hint: "Name who the product is for." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Market Analyst.\nProduct: a new coffee shop. Target audience: students and office workers aged 20 to 45. Target market: Tuzla.\n\n### INSTRUCTION ###\nStep 1: estimate the local market size and the share of the target audience. Use your most current data or simulate a lookup, and state your confidence.\nStep 2: identify 3 competitors and their positioning.\nStep 3: suggest 2 channels and 2 message themes.\n\n### OUTPUT FORMAT ###\n## 1. Market\n## 2. Competitors\n## 3. Communication",
    },
    explanation: "The perfume blueprint works because it decomposes a broad request into steps, is honest that it needs outside data, and fixes the shape of the report. Those are the parts to keep when you change the product and the city.",
    samples: {
      good: ["You are a market analyst for a new coffee shop in Tuzla, target audience students. Step 1: estimate the market size, simulate a lookup and state your confidence. Step 2: name 3 competitors. Step 3: suggest channels.\n## Market\n## Competitors\n## Channels"],
      bad: ["Tell me about the market for our new coffee shop in Tuzla.", "You are an analyst. Analyze the market for a coffee shop."],
    },
  },
  {
    slug: "workshop-material-flow",
    kind: "repair",
    title: "Workshop: your own material flow plan",
    promptText: "Adapt the shift-based production blueprint to a factory or a kitchen of your own. The plan must carry the inventory and the plan as data, follow the projected stock from one shift to the next, flag shortages and have a headed output.",
    public: {
      starter: "Plan the materials for tomorrow's production.",
      hint: "Provide inventory and a production plan for each shift. Ask for each shift to be compared with the projected inventory after the previous one, for shortages to be flagged, and for headings per shift.",
    },
    answer: {
      criteria: [
        { id: "data", label: "Provides the inventory and the production plan", weight: 2, anyOf: ["\\binventory\\b[\\s\\S]*\\b(plan|shift)\\b", "\\b(plan|shift)\\b[\\s\\S]*\\binventory\\b"], hint: "Include the current inventory and the plan for each shift." },
        { id: "projected", label: "Follows the projected stock from shift to shift", weight: 3, anyOf: ["\\bprojected\\b", "\\bremaining (stock|inventory)\\b", "\\bafter (the )?(previous )?shift\\b"], hint: "Say each shift is compared with the projected inventory after the previous shift." },
        { id: "shortage", label: "Flags shortages", weight: 2, anyOf: ["\\bshortages?\\b"], hint: "Ask for shortages to be flagged with the amount needed and available." },
        { id: "headings", label: "Asks for a headed output", weight: 1, anyOf: ["(^|\\n)\\s*#{1,3}\\s+\\S"], hint: "Ask for a heading for each shift." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Production Material Planner.\nInventory: Oak 500 m3, Pine 200 m3, Varnish 150 L.\nPlan: Shift 1 makes 100 m2 of oak decking (1.1 m3 oak and 0.1 L varnish per m2). Shift 2 makes 50 m2 of pine decking (1.0 m3 pine per m2).\n\n### INSTRUCTION ###\nFor each shift in order: calculate the material needs, compare them with the projected inventory after the previous shift, list the transfers and flag any shortage with the amount needed against available. Then calculate the projected inventory after the shift.\n\n### OUTPUT FORMAT ###\n## Shift 1\n## Shift 2",
    },
    explanation: "The heart of the blueprint is the running stock: each shift is planned against what the previous one leaves, and shortages are flagged before they stop the line. Everything else is bookkeeping around that idea.",
    samples: {
      good: ["Role: production planner. Inventory: Oak 500 m3, Pine 200 m3. Plan: Shift 1 makes 100 m2 of decking (1.1 m3 oak per m2), Shift 2 makes 50 m2. For each shift calculate the needs, compare with the projected inventory after the previous shift and flag any shortage.\n## Shift 1\n## Shift 2"],
      bad: ["Plan the materials for tomorrow's production.", "Inventory: 500 m3 oak. Plan: 100 m2 decking. Tell me what to move."],
    },
  },
  {
    slug: "workshop-ethical-segments",
    kind: "repair",
    title: "Workshop: your own ethical customer analysis",
    promptText: "Adapt the banking blueprint to customers of your own (a shop, a gym, a bank). Keep what makes it safe: a purpose limit, a ban on protected characteristics, anonymized data, categories instead of individuals and a justification.",
    public: {
      starter: "Which products should we offer to these customers?",
      hint: "Say the analysis is for outreach, not credit decisions. Forbid age, gender and ethnicity. Use anonymized segments, ask for product categories and a justification for each.",
    },
    answer: {
      criteria: [
        { id: "purpose", label: "Limits the purpose", weight: 2, anyOf: ["\\bnot (for|a) (credit|approval|scoring)\\b", "\\bno credit decisions\\b", "\\bnot (be )?used (for|to make) credit\\b"], hint: "State that the analysis is not for credit decisions." },
        { id: "nondiscrimination", label: "Forbids protected characteristics", weight: 3, anyOf: ["\\b(do not|don't|never|must not)\\b[\\s\\S]*\\b(age|gender|ethnic\\w*|religion|protected|marital)\\b"], hint: "Say that age, gender and ethnicity must not be used." },
        { id: "anonymized", label: "Uses anonymized data", weight: 1, anyOf: ["\\b(anonymi[sz]ed|segments?|permission\\w*)\\b"], hint: "Work with anonymized segments." },
        { id: "justification", label: "Asks for a justification", weight: 1, anyOf: ["\\b(justif\\w+|compliance|ethical (check|filter))\\b"], hint: "Ask the system to justify each suggestion." },
        { id: "categories", label: "Asks for categories, not individuals", weight: 1, anyOf: ["\\bcategor\\w+\\b"], hint: "Ask for product categories." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Customer Needs Analyst under strict ethical guidelines. This analysis is not for credit decisions.\n\n### GUIDELINES ###\nBase the analysis only on the anonymized segments below. Do not use or infer age, gender, ethnicity or any protected characteristic.\n\n### INSTRUCTION ###\nFor each segment identify the financial pattern, suggest 1 to 2 product categories for outreach and justify each from the pattern. Confirm that the suggestions follow the guidelines.",
    },
    explanation: "In a sensitive domain the ethics are part of the design, not an afterthought: a limited purpose, forbidden characteristics, anonymized data and a justification that can be audited. That is what the banking blueprint adds to an ordinary analysis prompt.",
    samples: {
      good: ["Analyze the anonymized customer segments below and suggest product categories for outreach, not for credit decisions. Do not use age, gender or ethnicity. Justify each suggestion with the financial pattern."],
      bad: ["Which products should we offer to these customers? Do not be biased.", "Suggest loans for each customer based on their age and income."],
    },
  },
  {
    slug: "workshop-lesson-plan",
    kind: "repair",
    title: "Workshop: your own lesson plan",
    promptText: "Adapt the lesson plan blueprint to a topic you would really teach. Give the grade, the duration and the objectives, and ask for a plan with timings, assessment and differentiation.",
    public: {
      starter: "Make me a lesson about photosynthesis.",
      hint: "State the grade, the length of the lesson and two objectives, and name the sections: activities with timings, assessment and differentiation.",
    },
    answer: {
      criteria: [
        { id: "grade", label: "States the grade level", weight: 1, anyOf: ["\\b(grade|year \\d+|class)\\b"], hint: "Say which grade the lesson is for." },
        { id: "duration", label: "States the duration", weight: 2, anyOf: ["\\b\\d+[- ]?(min|minute)\\w*\\b"], hint: "Say how long the lesson is, for example one 45-minute class." },
        { id: "objectives", label: "Gives learning objectives", weight: 2, anyOf: ["\\b(objectives?|students will)\\b"], hint: "State what students should be able to do afterwards." },
        { id: "sections", label: "Names assessment and differentiation", weight: 2, anyOf: ["\\bassessment\\b[\\s\\S]*\\bdifferentiat\\w+\\b", "\\bdifferentiat\\w+\\b[\\s\\S]*\\bassessment\\b"], hint: "Ask for assessment methods and differentiation strategies." },
        { id: "structure", label: "Asks for a structured plan with timings", weight: 1, anyOf: ["(^|\\n)\\s*#{1,3}\\s+\\S", "\\btimings?\\b"], hint: "Ask for headings or for timings for each activity." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Curriculum Assistant.\nTopic: photosynthesis. Grade: 7th grade. Duration: one 45-minute class.\nObjectives: students will be able to name the inputs and outputs of photosynthesis and explain why plants need light.\n\n### INSTRUCTION ###\nDraft a lesson plan with these headings:\n## Materials\n## Activities (with timings for the hook, the main activity and the wrap-up)\n## Assessment\n## Differentiation",
    },
    explanation: "A lesson plan prompt is only as good as its parameters: grade, duration and objectives set the size of every activity, and naming the sections keeps assessment and differentiation from being forgotten.",
    samples: {
      good: ["You are a curriculum assistant. Lesson: photosynthesis, 7th grade, one 45-minute class. Objectives: students will explain the inputs and outputs. Draft a plan with materials, activities with timings, assessment and differentiation.\n## Activities"],
      bad: ["Make me a lesson about photosynthesis.", "Make me a lesson about photosynthesis for 7th grade."],
    },
  },
];

export const WORKSHOP_2_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "workshop-replenishment-rule",
    kind: "repair",
    title: "Workshop: your own replenishment report",
    promptText: "Adapt the retail blueprint to a category of your own. The prompt needs the stock and sales data, the reorder rule, the store formats, a table for the strategy and a rule to stay with the data.",
    public: {
      starter: "What should we order for the cereal shelf?",
      hint: "Provide stock, sales and minimum stock per format. State the rule (stock below minimum plus a week of sales means order), ask for a table and say to use only the data.",
    },
    answer: {
      criteria: [
        { id: "data", label: "Provides stock and sales data", weight: 2, anyOf: ["\\bstock\\b[\\s\\S]*\\bsales\\b", "\\bsales\\b[\\s\\S]*\\bstock\\b"], hint: "Include stock and sales data for each SKU." },
        { id: "rule", label: "States the reorder rule", weight: 3, anyOf: ["\\b(below|less than|<)\\b[\\s\\S]*\\b(minimum|min stock)\\b", "\\bminimum\\b[\\s\\S]*\\bsales\\b"], hint: "State the rule: order when stock is below the minimum plus expected sales." },
        { id: "formats", label: "Names the store formats", weight: 1, anyOf: ["\\b(format|large|small|medium)\\b"], hint: "Say which store formats the analysis covers." },
        { id: "table", label: "Asks for a table", weight: 1, anyOf: ["\\btable\\b"], hint: "Ask for the shelf strategy in a table." },
        { id: "grounding", label: "Stays with the data", weight: 1, anyOf: ["\\b(only|strictly)\\b[\\s\\S]*\\b(data|provided)\\b"], hint: "Say to base everything strictly on the provided data." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Retail Category Analyst.\nData per SKU and format (large, medium, small): weekly sales, current stock, minimum stock. Assume a one-week lead time.\n\n### INSTRUCTION ###\nFor each SKU and format, check whether current stock is below minimum stock plus weekly sales. If it is, calculate an order quantity. Then rank the SKUs by total sales and put the shelf priority for each format in a table.\n\nBase every recommendation strictly on the provided data.",
    },
    explanation: "The retail blueprint turns a vague ordering question into a rule that can be checked cell by cell, plus a table for the human decision. The rule and the grounding are the two parts that must survive any adaptation.",
    samples: {
      good: ["Role: retail analyst. For each SKU and store format, compare stock with minimum stock plus weekly sales. If stock is below that, calculate an order quantity. Put the shelf priority for large, medium and small formats in a table. Base everything strictly on the data provided."],
      bad: ["What should we order for the cereal shelf?", "Tell me which cereal SKUs sell best in large stores."],
    },
  },
  {
    slug: "workshop-preliminary-assessment",
    kind: "repair",
    title: "Workshop: your own preliminary assessment",
    promptText: "Adapt the pharmaceutical blueprint to a product or a technology you must assess before a decision. Keep its honesty: preliminary, sourced, no exact figures, no advice.",
    public: {
      starter: "Is Drug X worth buying?",
      hint: "Say the assessment is preliminary and informational. Provide the source data or mark general knowledge for verification. Ask for registration status, hurdles and cost categories without exact figures, and forbid medical advice.",
    },
    answer: {
      criteria: [
        { id: "preliminary", label: "Says it is preliminary and not advice", weight: 2, anyOf: ["\\b(preliminary|informational)\\b", "\\bnot (definitive |medical |regulatory |financial )?advice\\b"], hint: "State that the assessment is preliminary and informational." },
        { id: "sources", label: "Handles sources and general knowledge", weight: 2, anyOf: ["\\b(source|general knowledge|verif\\w+)\\b"], hint: "Say to use the source data, and to mark general knowledge as needing verification." },
        { id: "nofigures", label: "Asks for categories, not exact figures", weight: 2, anyOf: ["\\bdo not (provide|give)[\\s\\S]*\\b(monetary|exact|figures?|values?)\\b", "\\bcost categor\\w+\\b", "\\bno exact\\b"], hint: "Ask for cost categories and no exact figures." },
        { id: "sections", label: "Names the parts of the analysis", weight: 2, anyOf: ["\\b(registration|hurdles?|regulatory)\\b[\\s\\S]*\\b(cost|penetration|market)\\b"], hint: "Name the parts: registration status, hurdles, costs, market factors." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Pharmaceutical Analyst. This is a preliminary, informational assessment, not regulatory or financial advice.\n\n### SOURCE DATA ###\n[Paste the trial summary here, or state that the analysis relies on general knowledge that needs verification.]\n\n### INSTRUCTION ###\nSummarize the registration status, list 2 to 4 regulatory hurdles, list the cost categories without exact figures, and brainstorm 3 to 5 market penetration factors. Do not give medical advice.",
    },
    explanation: "The pharmaceutical blueprint is a lesson in humility: it asks for a structured landscape, marks what is known and what is not, and refuses to invent numbers or give advice. Those limits are what make the output usable for due diligence.",
    samples: {
      good: ["Prepare a preliminary, informational assessment of Drug X. Base it on the source data below, and if you use general knowledge say so and mark it for verification. Cover registration status, regulatory hurdles and cost categories, with no exact figures. Do not give medical advice."],
      bad: ["Is Drug X worth buying?", "Give me the exact cost and registration timeline of Drug X."],
    },
  },
  {
    slug: "workshop-guide-for-a-logged-in-user",
    kind: "repair",
    title: "Workshop: your own guide for a logged-in user",
    promptText: "Adapt the authenticated finance blueprint to another sensitive area, for example health habits or study planning. Keep the authenticated context, the informational-only rule, a disclaimer, cautious wording and privacy.",
    public: {
      starter: "Give me money advice.",
      hint: "Say the user is authenticated and give a profile summary. Say the answer is informational and not advice, end with a disclaimer, use cautious wording and do not repeat sensitive numbers.",
    },
    answer: {
      criteria: [
        { id: "context", label: "Sets the authenticated context", weight: 2, anyOf: ["\\b(authenticated|logged in|profile summary|profile)\\b"], hint: "Say that the user is authenticated and give a profile summary." },
        { id: "informational", label: "Says it is informational, not advice", weight: 3, anyOf: ["\\b(informational|educational|general)\\b[\\s\\S]*\\b(not|no)\\b[\\s\\S]*\\badvice\\b", "\\bnot (regulated )?(financial )?advice\\b"], hint: "State that the guidance is informational and not advice." },
        { id: "disclaimer", label: "Requires a disclaimer", weight: 1, anyOf: ["\\bdisclaimer\\b"], hint: "Require a disclaimer at the end." },
        { id: "cautious", label: "Asks for cautious wording", weight: 1, anyOf: ["\\b(you might consider|non-prescriptive|cautious|avoid (commands|prescriptive))\\b"], hint: "Ask for cautious wording such as you might consider." },
        { id: "privacy", label: "Protects sensitive numbers", weight: 1, anyOf: ["\\b(do not repeat|privacy|categories and trends)\\b"], hint: "Say not to repeat sensitive numbers from the profile." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Financial Literacy Guide. The user is authenticated and their profile summary is below.\n\n### CONSTRAINTS ###\nThis is informational guidance, not financial advice. Do not recommend specific products. Use cautious wording such as \"you might consider\". Do not repeat sensitive numbers from the profile, use categories and trends. End with a clear disclaimer.\n\n### INSTRUCTION ###\nGive 2 to 3 general tips based only on the profile summary and the user's question.",
    },
    explanation: "The prompt does not handle login. It operates on top of it, so it states that the user is authenticated, keeps to education, and carries its own disclaimer and privacy rule. Those constraints matter more than the tips.",
    samples: {
      good: ["The user is authenticated and their profile summary is below. Give 2 to 3 general tips based only on it. This is informational guidance, not financial advice, and you must end with a disclaimer. Use cautious wording such as you might consider, and do not repeat sensitive numbers."],
      bad: ["Give me money advice.", "The user is authenticated. Tell them which fund to buy."],
    },
  },
  {
    slug: "workshop-list-assistant",
    kind: "repair",
    title: "Workshop: your own data assistant",
    promptText: "Adapt the to-do list blueprint to another small dataset: a shopping list, a reading list, a course roster. The assistant must work only on the data in the prompt, ask when a request is unclear and refuse unrelated questions.",
    public: {
      starter: "Manage my tasks.",
      hint: "Put the data in tags or a table, give today's date, say to act only on it, to ask a clarifying question when a request is ambiguous and not to answer general knowledge questions.",
    },
    answer: {
      criteria: [
        { id: "data", label: "Provides the data in a clear structure", weight: 2, anyOf: ["<[a-z_]+>", "\\|\\s*task", "\\btask id\\b"], hint: "Put the data in tags or a table." },
        { id: "only", label: "Restricts the assistant to the data", weight: 2, anyOf: ["\\b(only|strictly)\\b[\\s\\S]*\\b(list|data|provided)\\b"], hint: "Say to act only on the provided data." },
        { id: "clarify", label: "Asks for clarification when unclear", weight: 2, anyOf: ["\\b(clarif\\w+|ambiguous)\\b"], hint: "Say to ask a clarifying question when a request is ambiguous." },
        { id: "date", label: "Gives the date for overdue checks", weight: 1, anyOf: ["\\b(today'?s? date|assume today|overdue)\\b"], hint: "Give today's date so overdue can be calculated." },
        { id: "scope", label: "Refuses unrelated requests", weight: 1, anyOf: ["\\b(do not|don't)\\b[\\s\\S]*\\b(general knowledge|unrelated)\\b", "\\bonly perform\\b"], hint: "Say not to answer general knowledge or unrelated requests." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI assistant managing my to-do list.\n<todo_list_data>\n| Task ID | Description | Due Date | Status |\n| T001 | Draft proposal | 2024-11-10 | In Progress |\n</todo_list_data>\nAssume today's date is 2024-10-27.\n\n### INSTRUCTION ###\nAct only on the list data: list or filter tasks, confirm status updates and add notes. If a request is ambiguous, ask a clarifying question. Do not answer general knowledge questions or perform unrelated tasks.",
    },
    explanation: "A data assistant is safe because its world is small and stated: the data in the prompt, a fixed date, and clear rules for ambiguity and for things outside its job. The model interprets, and an external system would save any change.",
    samples: {
      good: ["You manage my to-do list. <todo_list_data>| Task ID | Description | Due |</todo_list_data> Assume today's date is 2024-10-27. Act only on the list data. If a request is ambiguous, ask a clarifying question. Do not answer general knowledge questions."],
      bad: ["Manage my tasks.", "Here is my task list: buy milk. Mark it done."],
    },
  },
];

export const WORKSHOP_3_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "workshop-private-records-assistant",
    kind: "repair",
    title: "Workshop: your own records assistant",
    promptText: "Adapt the language center blueprint to records of your own (a club, a clinic front desk, a library). Keep the privacy rules: identifiers instead of names, answers only from the data, and a plain statement when the information is missing.",
    public: {
      starter: "Answer questions about our students.",
      hint: "Say to use student IDs and not reveal names, to answer only from the provided schedule and student table, to say so when the information is not there, and to format lists or tables.",
    },
    answer: {
      criteria: [
        { id: "privacy", label: "Protects identities", weight: 3, anyOf: ["\\b(do not|don't|never)\\b[\\s\\S]*\\b(names?|reveal)\\b", "\\buse (student )?ids?\\b", "\\banonymi[sz]ed\\b"], hint: "Say to use IDs and not to reveal names." },
        { id: "only", label: "Answers only from the data", weight: 2, anyOf: ["\\b(only|strictly)\\b[\\s\\S]*\\b(provided|data|context|below)\\b"], hint: "Say to answer only from the provided data." },
        { id: "both", label: "Covers program and student data", weight: 1, anyOf: ["\\bschedule\\b[\\s\\S]*\\bstudent\\b", "\\bstudent\\b[\\s\\S]*\\bschedule\\b"], hint: "Provide both the program information and the student data." },
        { id: "missing", label: "Says what to do when information is missing", weight: 1, anyOf: ["\\bnot found\\b", "\\bnot available\\b", "\\bsay (so|that)\\b", "\\bif (the )?information\\b"], hint: "Say to state clearly when the information is not in the data." },
        { id: "format", label: "Asks for a list or a table", weight: 1, anyOf: ["\\b(list|table)\\b"], hint: "Ask for lists or tables for schedules and rosters." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Administrative Assistant for a language school.\nProgram schedule and an anonymized student table are provided below.\n\n### CONSTRAINTS ###\nAnswer only from the provided data. Refer to students by ID and do not reveal names. If the information is not in the data, say so clearly.\n\n### INSTRUCTION ###\nUnderstand the query, find the relevant rows, and answer briefly, using a list or a table for schedules and student lists.",
    },
    explanation: "A records assistant is trusted because of what it will not do: it does not reveal names, it does not guess, and it says so when the data does not contain the answer. The same skeleton fits any small organization.",
    samples: {
      good: ["You are an admin assistant. Answer only from the program schedule and the anonymized student table below. Refer to students by ID and do not reveal names. If the information is not there, say so. Use a list or a table for answers."],
      bad: ["Answer questions about our students.", "Tell me all about student Amra and her payments."],
    },
  },
  {
    slug: "workshop-status-lookup",
    kind: "repair",
    title: "Workshop: your own status lookup",
    promptText: "Adapt the laboratory blueprint to another tracking table (parcels, repairs, orders). The assistant needs the data in the prompt, must use only it, keep clients confidential, say clearly when nothing matches and answer in a set format.",
    public: {
      starter: "What's happening with the samples?",
      hint: "Put the table in tags, say to use only the provided data, to keep client information confidential, to say when no record matches, and to present lists as a table.",
    },
    answer: {
      criteria: [
        { id: "data", label: "Puts the tracking data in the prompt", weight: 2, anyOf: ["<[a-z_]+>", "\\blims\\b", "\\bdata\\b[\\s\\S]*\\btable\\b"], hint: "Put the tracking data in tags or a table." },
        { id: "only", label: "Uses only the provided data", weight: 2, anyOf: ["\\b(only|strictly)\\b[\\s\\S]*\\b(provided|data)\\b"], hint: "Say to answer only from the provided data." },
        { id: "confidential", label: "Keeps information confidential", weight: 2, anyOf: ["\\bconfidential\\w*", "\\bdo not reveal\\b"], hint: "Say to keep client information confidential." },
        { id: "nomatch", label: "Says what to do when nothing matches", weight: 1, anyOf: ["\\bnot found\\b", "\\bno (samples?|records?|matches?) (found|match)", "\\bno match\\w*"], hint: "Say to state clearly when no record matches." },
        { id: "format", label: "Sets an output format", weight: 1, anyOf: ["\\b(table|list|bullet)\\b"], hint: "Ask for lists as a table or bullets." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Laboratory Information Assistant.\n<lims_data>\n| Sample ID | Stage | Urgent | Report Due |\n| FS-24-102 | Testing | Y | 2024-10-29 |\n</lims_data>\n\n### CONSTRAINTS ###\nAnswer using only the provided LIMS data. Keep client information confidential: do not reveal client codes unless asked. If no sample matches, say that no samples were found.\n\n### INSTRUCTION ###\nFilter the data by the query, extract the requested details and present lists as a table.",
    },
    explanation: "A status lookup is only as reliable as its refusal to guess. The data sits in the prompt, the answer comes only from it, and a missing record is reported as missing. Confidentiality and a fixed format make it safe to hand to colleagues.",
    samples: {
      good: ["<lims_data>| Sample | Stage |</lims_data> Answer using only the provided LIMS data. Keep client information confidential: do not reveal client codes unless asked. If no sample matches, say no samples found. Present lists as a table."],
      bad: ["What's happening with the samples?", "Tell me which samples are late and who ordered them."],
    },
  },
  {
    slug: "workshop-safe-suggestions",
    kind: "repair",
    title: "Workshop: your own safe suggestions",
    promptText: "Adapt the fitness blueprint to another advisory setting (a spa, a language school, a bookshop). Suggestions must come from your own offerings, stay clear of medical or expert claims, use cautious wording and end with a disclaimer.",
    public: {
      starter: "Tell this client what to do to lose weight.",
      hint: "Use only the center's offerings, forbid medical advice, diagnosis and prescribed diets, ask for cautious wording and end with a disclaimer that recommends a professional.",
    },
    answer: {
      criteria: [
        { id: "scope", label: "Forbids medical or prescriptive advice", weight: 3, anyOf: ["\\b(do not|don't|never)\\b[\\s\\S]*\\b(medical|diagnos\\w+|diet|calorie)\\b"], hint: "Say not to give medical advice, diagnose or prescribe diets." },
        { id: "offerings", label: "Draws on the center's own offerings", weight: 2, anyOf: ["\\b(offerings|classes|our center|our studio)\\b"], hint: "Say suggestions come only from your own classes and offerings." },
        { id: "disclaimer", label: "Ends with a disclaimer to consult a professional", weight: 2, anyOf: ["\\b(disclaimer|consult)\\b"], hint: "Require a disclaimer that advises consulting a professional." },
        { id: "cautious", label: "Uses cautious wording", weight: 1, anyOf: ["\\b(you might|consider|suggest\\w*|cautious)\\b"], hint: "Ask for suggestions phrased cautiously." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Fitness Advisor assistant.\nClient profile and the center's offerings (classes, training, nutrition workshops) are below.\n\n### CONSTRAINTS ###\nDo not give medical advice, diagnose conditions, prescribe diets or promise results. Suggest only from our offerings, in cautious wording such as \"you might enjoy\". End with a disclaimer that the client should consult a professional.\n\n### INSTRUCTION ###\nSuggest 2 to 3 activities and 1 to 2 general nutrition topics that fit the profile.",
    },
    explanation: "The fitness blueprint is helpful because it is bounded: it recommends from a known catalog, in tentative language, and leaves anything medical to a professional. The disclaimer is part of the output, not an afterthought.",
    samples: {
      good: ["Using only our center's classes and offerings, suggest 2 to 3 activities for this client profile. Do not give medical advice, diagnose injuries or prescribe diets. Use cautious wording and end with a disclaimer to consult a professional."],
      bad: ["Tell this client what to do to lose weight.", "Tell this client which diet with 1200 calories to follow."],
    },
  },
  {
    slug: "workshop-evidence-triage",
    kind: "repair",
    title: "Workshop: your own evidence triage",
    promptText: "Adapt the investigative blueprint to a set of documents of your own (reviews, meeting notes, contracts). Ask only for what the documents state, name the extraction task, keep the analysis to the provided text and stay neutral.",
    public: {
      starter: "Tell me what really happened from these emails.",
      hint: "Say to analyze only the provided documents, to list entities and stated interactions, not to infer motives or relationships, and to stay neutral because a person will verify.",
    },
    answer: {
      criteria: [
        { id: "stated", label: "Asks for stated facts only, no inference", weight: 3, anyOf: ["\\b(stated|explicitly|only what)\\b[\\s\\S]*\\b(not|do not)\\b", "\\bdo not infer\\b", "\\bnot infer\\b"], hint: "Say to list only what the documents explicitly state and not to infer motives." },
        { id: "corpus", label: "Keeps the analysis to the provided text", weight: 2, anyOf: ["\\b(only|strictly)\\b[\\s\\S]*\\b(provided|text|documents?|emails?)\\b"], hint: "Say to analyze only the provided documents." },
        { id: "task", label: "Names the extraction task", weight: 2, anyOf: ["\\b(entities|timeline|connections?|interactions?)\\b"], hint: "Name the task: entities, interactions or a timeline." },
        { id: "neutral", label: "Stays neutral and leaves verification to a person", weight: 1, anyOf: ["\\b(neutral|objective|verif\\w+)\\b"], hint: "Ask for a neutral tone and say a person will verify." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Investigative Assistant.\nInvestigation focus: communications about Project Aquila.\n<email id=\"E001\">...</email>\n\n### STANDARDS ###\nAnalyze only the provided email excerpts. Identify only what the emails explicitly state. Do not infer relationships or motives. Stay neutral and objective.\n\n### INSTRUCTION ###\nList the key entities, and list the stated interactions between them. The journalist will verify every lead.",
    },
    explanation: "An evidence triage prompt produces leads, not conclusions. Restricting it to what the text states, and to a named extraction task, keeps the analysis checkable, and the verification stays with the human.",
    samples: {
      good: ["Analyze only the provided email excerpts. List the entities and the interactions that the emails explicitly state. Do not infer motives or relationships. Stay neutral; the journalist verifies every lead."],
      bad: ["Tell me what really happened from these emails.", "Read these emails and tell me who is guilty."],
    },
  },
];

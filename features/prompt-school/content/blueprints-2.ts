/**
 * Chapter "Blueprint Workshop 2" (book Appendix B, the template library, blueprints 6 to 10): 5 lessons and 10 exercises,
 * written from the Director's book, which is the only source. Every blueprint keeps the book's four parts (scenario and
 * explanation, the Markdown prompt, the flowchart, the next steps). No em dashes (writing rule, PDL-057). `samples` on
 * repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";
import { blueprintBody, type Blueprint } from "./blueprint-lesson";

const RETAIL: Blueprint = {
  domain: "Retail, inventory management, merchandising",
  scenario:
    "A retail chain with different store formats (large superstores, medium neighborhood stores, small convenience stores) must manage inventory replenishment for one product category, for example breakfast cereals, and needs guidance on how the products in that category should be allocated shelf space by store format and sales data.",
  goal: "Generate a report that (1) identifies the items needing replenishment from current stock and sales velocity, and (2) suggests a prioritized shelf allocation strategy for key items across the different store formats.",
  objective:
    "Help retail category managers and inventory planners by automating the first analysis for replenishment orders, and provide a data-informed starting point for shelf space allocation (planogramming) across diverse store types.",
  techniques: [
    ["Context setting (pillar 1)", "Needs rich, structured context: the product list (SKU, name, pack size), the current stock per SKU for each store format, the recent sales velocity (units per week) per SKU and format, the minimum or safety stock per SKU and format, and a short definition of the Large, Medium and Small store formats (shelf space for the category, typical customer)."],
    ["Structured input data", "The data is assumed to be clear, at this level summarized by store format (for example average stock and sales for medium stores). Real use needs database connections."],
    ["Instructions and logic (pillar 2, chain of thought simulation)", "Three clear steps. Replenishment calculation: for each SKU and format compare current inventory with minimum stock plus the expected sales until the next delivery, identify the SKUs below the threshold and calculate the suggested order quantity. Prioritization: identify the top sellers overall and per format, and one or two niche or slow items. Shelf allocation guidance: from the prioritization and the store format characteristics, suggest premium, secondary or minimal placement in each format."],
    ["Calculation (simulated tool use)", "The prompt guides the model through the replenishment arithmetic: is stock lower than minimum plus velocity times lead time, and if so, order equals target minus stock."],
    ["Structured output", "Distinct sections for Replenishment Orders Needed and Shelf Allocation Strategy by Store Format make the output actionable. A table is ideal for the allocation strategy."],
    ["Retrieval principle", "All recommendations must be grounded only in the provided inventory, sales and store format data."],
    ["Constraints", "Sales data and stock levels constrain the answer implicitly. Explicit constraints, such as an overall budget for replenishment orders, can be added."],
  ],
  intended:
    "Give category managers an automated first draft of the necessary replenishment orders and a data-driven rationale for allocating shelf space strategically across store types, improving both stock availability and sales potential.",
  prompt: `### CONTEXT ###
Role: You are an AI Retail Category Analyst specializing in inventory and
merchandising strategy.
Goal: Generate a replenishment needs report and a shelf allocation strategy for the
'Breakfast Cereals' category across Large, Medium, and Small store formats.

**Product & Sales Data (Breakfast Cereals Category - Simplified Averages by Format):**
* SKU-C01 (Brand A Flakes 500g): Sales/Wk(L:100, M:40, S:15), Stock(L:150, M:50, S:10),
  MinStock(L:200, M:80, S:30)
* SKU-C02 (Brand A Choco Puffs 375g): Sales/Wk(L:120, M:60, S:25), Stock(L:100, M:30, S:5),
  MinStock(L:240, M:120, S:50)
* SKU-C03 (Brand B Healthy Granola 750g): Sales/Wk(L:80, M:35, S:5), Stock(L:200, M:70, S:15),
  MinStock(L:160, M:70, S:10)
* SKU-C04 (StoreBrand Corn Flakes 1kg): Sales/Wk(L:150, M:70, S:30), Stock(L:400, M:150, S:50),
  MinStock(L:300, M:140, S:60)
* SKU-C05 (Kids Sugary Hoops 300g): Sales/Wk(L:90, M:50, S:20), Stock(L:110, M:40, S:8),
  MinStock(L:180, M:100, S:40)
(L=Large, M=Medium, S=Small store format. Assume a 1-week replenishment lead time
for calculations)

**Store Format Characteristics:**
* **Large Superstore:** Ample shelf space for category, wide variety expected,
  caters to families, stock-up trips.
* **Medium Neighborhood:** Moderate shelf space, focuses on popular items and
  convenience, caters to weekly shoppers.
* **Small Convenience:** Very limited shelf space, stocks only bestsellers and
  impulse buys, caters to immediate needs.

### INSTRUCTION ###
Analyze the provided data to generate a report with two main sections:

**1. Replenishment Orders Needed:**
- For each SKU and Store Format (L, M, S), calculate if replenishment is needed
  (Current Stock < Minimum Stock + Sales/Week).
- If needed, calculate the Suggested Order Quantity (e.g., Minimum Stock +
  2*Sales/Week - Current Stock, rounded up).
- List only the SKUs/Formats requiring orders and their suggested quantities.

**2. Shelf Allocation Strategy Guidance:**
- Identify the Top 2-3 Bestselling SKUs overall based on total Sales/Week across
  all formats.
- Identify any particularly Slow-Moving SKUs (e.g., lowest total Sales/Week).
- Based on sales velocity and store format characteristics, suggest shelf placement
  priority for key SKUs in each format (Large, Medium, Small). Use categories like
  'Premium Placement (Eye-Level/High Traffic)', 'Standard Placement',
  'Minimal/Bottom Shelf Placement'.
- Present this strategy in a Markdown table with columns: 'Store Format',
  'Premium Placement SKUs', 'Standard Placement SKUs', 'Minimal Placement SKUs'.

**Output Format:**
Use clear Markdown headings (## 1. Replenishment Orders Needed, ## 2. Shelf
Allocation Strategy Guidance). Use bullet points for orders and a table for the
allocation strategy. Base all recommendations strictly on the provided data.

### RETAIL CATEGORY REPORT (Breakfast Cereals) ###`,
  flow: [
    "Start the retail analysis request. Two inputs arrive: the product list with sales, stock and minimum stock data by SKU and format, and the store format characteristics.",
    "Replenishment branch: for each SKU and format, calculate whether current stock is below minimum plus sales per week. If yes, calculate the suggested order quantity. If no, no order is needed for that SKU and format. Compile the replenishment order list.",
    "Shelf allocation branch: identify the top selling SKUs overall and the slow moving SKUs overall.",
    "Combine those with the store format characteristics to determine the placement priority by format: premium, standard and minimal SKUs for Large, Medium and Small stores.",
    "Compile the allocation strategy table.",
    "Format the output report and provide the replenishment and allocation report.",
  ],
  flowNote: "The flowchart shows the two main analysis branches: calculating replenishment from stock and sales data, and determining the shelf allocation strategy from sales velocity and store characteristics.",
  refinement: [
    "Incorporate promotional activity into the context and tell the system to adjust suggested stock levels or shelf placement for items on promotion.",
    "Add product dimensions and shelf capacity constraints for more realistic allocation (this becomes much more complex and likely needs specialized planogramming logic).",
    "Use few-shot examples if the format of the replenishment list or allocation table is highly specific or needs non-standard codes.",
    "Instruct the system to suggest delisting extremely slow-moving items, especially in smaller formats.",
  ],
  application: [
    "The replenishment list feeds directly into the ordering system, by manual input or automatically.",
    "The allocation strategy is used by the merchandising team to create or update planograms (visual shelf layouts) for the different store formats.",
    "The analysis helps category managers negotiate shelf space and positioning with suppliers.",
  ],
  integration: [
    "Connect the prompt through an API to live point-of-sale and inventory management systems for real-time data.",
    "Integrate the output with planogramming software.",
    "Develop prompts that simulate the impact of different allocation strategies on overall category sales (this needs predictive modeling capabilities).",
  ],
  tryThis: "Check one cell by hand: for SKU-C01 in Small stores, is 10 units below 30 plus 15, and what order does the book's formula suggest?",
};

const PHARMA: Blueprint = {
  domain: "Pharmaceuticals, regulatory affairs, market analysis, medicine",
  scenario:
    "A pharmaceutical company is considering licensing or acquiring a new drug candidate ('Drug X') for a specific condition, for example rheumatoid arthritis. Before committing significant resources, they need a preliminary analysis of the registration status of its active substance in key markets, the potential regulatory hurdles, the expected cost categories and the challenges of market penetration.",
  goal: "Generate a structured preliminary report that summarizes the known registration status of the drug's active substance, identifies potential regulatory challenges, outlines the expected cost categories of registration and launch and lists the factors that influence market penetration, based on the provided context and on general knowledge available to the AI, with appropriate caveats.",
  objective:
    "Give pharmaceutical strategists, regulatory affairs teams and marketing managers an initial overview for early-stage decisions about a drug candidate, by synthesizing regulatory information, cost factors and market dynamics. Crucially, this is NOT definitive regulatory advice or a precise financial forecast. It structures known information and common considerations.",
  techniques: [
    ["Context setting (pillar 1)", "Needs the drug candidate information (name or code, active pharmaceutical ingredient, therapeutic area), the target markets (for example the EU, the USA, Japan), the source information and an ethical constraint. The source information is highly recommended for retrieval: excerpts from regulatory databases (EMA, FDA public sections), summaries of completed clinical trial phases or internal assessment notes. If the system relies only on its general knowledge, this must be stated explicitly and the output treated with extreme caution. The ethical constraint: avoid specific medical advice and definitive claims about efficacy beyond the provided context."],
    ["Instructions and decomposition (pillar 2, chain of thought simulation)", "The complex analysis is split into four parts: summarize the known registration status of the API in the target markets (from the context or general knowledge, stating source limitations), identify potential common regulatory hurdles for this type of drug and area, list the typical cost categories of late-stage registration and launch (Phase III trials, filing fees, marketing setup), and brainstorm the key factors influencing market penetration (existing competition, prescriber habits, reimbursement, patient advocacy)."],
    ["Retrieval principle and grounding", "Relying on the provided source information is strongly preferred for accuracy about registration status and trial data. If the system uses general knowledge, the prompt must make it state the limitation clearly, for example: based on general knowledge up to a date, the status appears to be so, and this requires verification."],
    ["Structured output", "Clear headings for Registration Status, Hurdles, Cost Categories and Market Factors make the complex information digestible."],
    ["Constraints (pillar 4)", "Emphasize potential hurdles and typical cost categories, not definitive predictions. Forbid medical advice. Add disclaimers about the preliminary nature of the analysis."],
    ["Expert persona (optional)", "A role such as AI Regulatory Affairs Analyst may help focus the output."],
  ],
  intended:
    "Rapidly assemble a preliminary landscape analysis for a drug candidate that highlights the key areas needing deeper investigation by human experts in regulatory affairs, clinical development and marketing. It is an organized starting point for due diligence.",
  prompt: `### CONTEXT ###
Role: You are an AI Pharmaceutical Analyst providing a preliminary assessment.
Goal: Generate a structured overview regarding the registration status, potential
hurdles, cost considerations, and market factors for 'Drug X' targeting 'Rheumatoid
Arthritis' in key markets. This is a preliminary analysis for informational purposes
only, not definitive regulatory/financial advice.

**Drug Candidate Information:**
* Name/Code: Drug X
* Active Pharmaceutical Ingredient (API): [Specify API Name, e.g., 'SpecificMab-alpha']
* Therapeutic Area: Rheumatoid Arthritis
* Target Markets: EU (via EMA), USA (via FDA)

**Source Information (Provide relevant excerpts or state reliance on general knowledge):**
<source_data>
[Paste relevant data here, e.g., "Phase II trial summary shows positive efficacy
signal...", "API 'SpecificMab-alpha' currently approved for unrelated indication Y in
EU...", "FDA guidelines for RA drugs require extensive safety data..." OR state:
"Analysis based on general knowledge up to [AI Knowledge Cutoff Date] - verification
required."]
</source_data>

**Ethical Constraint:** Do not provide medical advice or make definitive claims about
efficacy/safety beyond summarizing provided source data. Avoid comparisons implying
superiority unless explicitly supported by data.

### INSTRUCTION ###
Analyze the provided information and generate a preliminary report covering the
following points. Base your analysis primarily on <source_data> if provided; clearly
state reliance on general knowledge otherwise.

**1. API Registration Status Summary (Target Markets):**
- Based on available information, briefly summarize the known approval or development
  status of the API '[API Name]' for any indication in the EU and USA. Note limitations
  of the information source.

**2. Potential Regulatory Hurdles (Rheumatoid Arthritis):**
- List 2-4 common or potential regulatory challenges faced when seeking approval for a
  new Rheumatoid Arthritis drug in the EU/USA (e.g., demonstrating comparative
  efficacy, long-term safety data requirements, specific biomarker needs).

**3. Estimated Cost Categories (Late Stage & Launch):**
- List major categories of costs typically associated with Phase III clinical trials,
  regulatory filing, and initial market launch for a drug in this therapeutic area (e.g.,
  Clinical trial operations, Manufacturing scale-up, Regulatory agency fees, Marketing
  & Sales force setup, Market access/reimbursement efforts). Do NOT provide specific
  monetary values.

**4. Key Market Penetration Factors:**
- Brainstorm 3-5 key factors typically influencing the market uptake of a new
  Rheumatoid Arthritis drug (e.g., Clinical differentiation vs. existing treatments,
  Prescriber acceptance/familiarity, Payer reimbursement policies, Patient support
  programs, Competitor activities).

**Output Format:**
Present the report using clear Markdown headings for each of the four sections above.
Maintain a professional, objective, and cautious tone, reflecting the preliminary
nature of the analysis.

### PRELIMINARY DRUG X ASSESSMENT ###`,
  flow: [
    "Start the drug candidate assessment request. Three inputs arrive: the drug information (name, API, indication, markets), the source data (trials, registration status, guidelines, or the general knowledge caveat) and the ethical constraints.",
    "The instruction sets four analysis steps.",
    "Step 1, summarize the API registration status: consult the source data or general knowledge, and note the information limitations.",
    "Step 2, identify the potential regulatory hurdles for rheumatoid arthritis: consult the source data or general knowledge of RA drug development.",
    "Step 3, list the typical cost categories of late stage and launch, from general knowledge of pharma costs.",
    "Step 4, brainstorm the market penetration factors for RA, from general knowledge of pharma marketing and access.",
    "Assemble and format the output into a structured preliminary report.",
  ],
  flowNote: "The flowchart shows the distinct analytical steps and stresses the consultation of either the provided source data (the preferred retrieval approach) or the AI's general knowledge, followed by a structured report.",
  refinement: [
    "Provide more detailed source information through retrieval for higher accuracy, especially on specific trial results or known regulatory feedback.",
    "Add few-shot examples if a highly specific report structure or phrasing style is required.",
    "Refine the instructions to ask for analysis specific to biologic drugs versus small molecules, if relevant.",
    "Add a step that compares Drug X's known attributes (from the source data) with the identified market factors or competitor profiles.",
    "Strengthen the disclaimers about the preliminary, non-advisory nature of the output.",
  ],
  application: [
    "Business development teams use it for the initial screening of licensing or acquisition opportunities.",
    "Regulatory affairs teams use it as a checklist of areas needing deep investigation for the specific drug.",
    "Early-stage marketing teams use it to brainstorm positioning and market access challenges.",
    "Crucially, the output is a starting point for expert human analysis, not a replacement for it.",
  ],
  integration: [
    "Connect the prompt through an API to internal databases of clinical trial results or to regulatory intelligence platforms (this requires secure, specialized data access).",
    "Use the output to populate sections of internal due diligence reports or checklists automatically, always flagged as AI-generated preliminary analysis that needs expert validation.",
  ],
  tryThis: "Fill the source_data block with three facts of your own, and rewrite the ethical constraint for a domain you know.",
};

const CALL_CENTER: Blueprint = {
  domain: "Customer service, call center operations, quality assurance (QA)",
  scenario:
    "A call center wants to improve the quality and consistency of its agents' interactions, both inbound calls and outbound sales or service calls. It needs an automated way to analyze call transcripts against predefined quality criteria and the agent's adherence to scripts or guidelines.",
  goal: "Generate a structured quality assessment report for a call transcript: adherence to protocols, politeness and empathy where applicable, deviations noted and a summary of the call outcome, with actionable feedback points for agent coaching.",
  objective:
    "Give call center managers and QA specialists an automated first-pass analysis of agent interactions, for more efficient monitoring, identification of training needs and consistent evaluation against quality standards.",
  techniques: [
    ["Context setting (pillar 1)", "Needs four inputs: the call transcript (the verbatim customer and agent text); the call type (inbound or outbound and the purpose, for example technical support, sales inquiry, billing question or service follow-up), which sets the expectations for required protocols; the agent guidelines or script points (the greeting script, verification steps, required disclosures, specific troubleshooting questions, upselling attempts for outbound sales, empathy statements for support); and the quality criteria, the metrics for evaluation (script adherence, politeness and tone, resolution accuracy, efficiency)."],
    ["Retrieval principle", "The analysis MUST be grounded strictly in the provided transcript and evaluated against the provided guidelines and criteria. No external assumptions about the call are allowed."],
    ["Specific instructions and decomposition (pillar 2, chain of thought simulation)", "The prompt guides the system through a structured process: summarize the main reason for the call and the overall outcome, check adherence to the key points of the guidelines (noting which points were covered or missed), evaluate politeness, professionalism and empathy (if relevant to the call type) from the language used in the transcript only, and identify significant deviations or areas for agent improvement."],
    ["Structured output", "A standardized report (headings for Summary, Script Adherence, Tone Evaluation, Areas for Improvement) makes the QA process consistent and allows easy comparison across calls."],
    ["Few-shot examples (optional)", "Show how to evaluate specific criteria, for example transcript snippets rated Polite versus Abrupt, or how to spot a missed verification step."],
    ["Constraints (pillar 4)", "Stress objectivity, findings based only on the transcript and guidelines, and no overly harsh or subjective personal judgments about the agent. Focus on observable behaviors reflected in the text."],
  ],
  intended:
    "A consistent, objective and scalable method for preliminary call quality assessment: flag the calls that may need human review, identify patterns in agent performance and generate specific feedback points for coaching and training.",
  prompt: `### CONTEXT ###
Role: You are an AI Call Center Quality Assurance Analyst.
Goal: Analyze the provided call transcript against defined guidelines and quality
criteria to generate a structured QA assessment report.

**Call Details:**
* **Call Type:** [Specify: e.g., Inbound - Technical Support, Outbound - Sales Follow-up]
* **Call Transcript:** (Provided below within <transcript> tags)
* **Key Agent Guidelines/Script Points Expected:**
  * [Guideline 1: e.g., Standard Greeting Used?]
  * [Guideline 2: e.g., Customer Verification Steps Completed?]
  * [Guideline 3: e.g., Required Legal Disclosure Read?]
  * [Guideline 4: e.g., Specific Troubleshooting Question X Asked?]
  * [Guideline 5: e.g., Upsell Attempt Made (for Outbound Sales)?]
  * ... (List key required elements) ...
* **Quality Criteria for Evaluation:**
  * **Script Adherence:** Did the agent cover the key guidelines listed above?
  * **Clarity & Professionalism:** Was the agent's language clear, professional, and
    easy to understand?
  * **Tone/Empathy (If Inbound Support):** Did the agent demonstrate appropriate
    politeness and empathy based on the customer's issue/tone?
  * **Resolution (If applicable):** Was the customer's issue apparently resolved, or
    was escalation appropriate/handled correctly?

### CALL TRANSCRIPT ###
<transcript>
[Paste the full call transcript here. Indicate speaker turns clearly if possible,
e.g., Agent: ..., Customer: ...]
</transcript>

### INSTRUCTION ###
Analyze the provided call transcript based only on the text and the defined
guidelines/criteria. Generate a QA Assessment Report structured with the following
Markdown headings:

**1. Call Summary & Outcome:**
- Briefly describe the main reason for the call and the apparent final outcome (e.g.,
  issue resolved, escalated, sale made/not made, information provided).

**2. Script/Guideline Adherence:**
- For each 'Key Agent Guideline' listed in the context, state whether it was **Met**,
  **Not Met**, or **Partially Met** based on evidence in the transcript. Briefly quote
  or reference the transcript part supporting your assessment for points 'Not Met' or
  'Partially Met'.

**3. Tone & Professionalism Assessment:**
- Based only on the agent's language in the transcript, provide a brief assessment of
  their Clarity & Professionalism.
- If applicable for the call type (e.g., Inbound Support), assess the demonstrated
  Tone/Empathy, noting specific examples of polite/empathetic language used or missed
  opportunities. Be objective.

**4. Areas for Coaching/Improvement:**
- Based only on the adherence and tone assessments above, identify 1-2 specific,
  actionable areas where the agent could potentially improve (e.g., "Ensure all
  verification steps are completed," "Use more empathetic phrasing when customer
  expresses frustration," "Follow closing script more closely"). Focus on behaviors
  reflected in the transcript.

Maintain an objective and constructive tone throughout the report.

### QA ASSESSMENT REPORT ###`,
  flow: [
    "Start the call QA request. Four inputs arrive: the call transcript, the call type and purpose, the agent guidelines or script, and the quality criteria.",
    "Analyze the transcript and summarize the call reason and outcome.",
    "Check adherence to each guideline. For each one decide Met, Not Met or Partial, and for Not Met or Partial note the evidence or a quote from the transcript. Compile the script adherence section.",
    "Assess tone and professionalism: evaluate clarity and professionalism from the agent's language, and evaluate empathy and tone from the agent's language if applicable. Compile the tone and professionalism section.",
    "Identify the areas for improvement from the adherence and tone findings, and compile the coaching points section.",
    "Format the output report and generate the structured QA assessment.",
  ],
  flowNote: "The flowchart shows the process of analyzing the transcript against several criteria (guidelines, tone, resolution) and compiling structured feedback.",
  refinement: [
    "Add few-shot examples showing call snippets and the desired assessment language or scoring for specific criteria, especially subjective ones such as empathy, to improve consistency.",
    "Incorporate sentiment analysis as a separate instruction step: assess the overall customer sentiment trend during the call as improving, declining or neutral.",
    "Develop separate templates optimized for specific call types. A sales call QA prompt might focus more on persuasion techniques and closing attempts.",
    "Add constraints on the length or detail level of each report section.",
  ],
  application: [
    "QA specialists use the report as a starting point, quickly seeing which calls need closer human review and which issues to focus on.",
    "Aggregated reports across many calls can identify systemic training needs or common script adherence problems.",
    "The specific feedback points are used directly in coaching sessions with agents.",
    "It can help score agent performance objectively against defined criteria, with human oversight.",
  ],
  integration: [
    "Connect the prompt through an API to the call center's recording and transcription platform to analyze calls automatically as they complete.",
    "Feed the structured QA scores into agent performance dashboards or workforce management systems.",
    "Use the insights to trigger specific training modules for agents based on the identified weaknesses.",
  ],
  tryThis: "Write five guidelines for a call type you know, then mark each as something that can be checked from the transcript text alone or not.",
};

const FINANCE_GUIDE: Blueprint = {
  domain: "Personal finance, financial advisory (informational), secure applications",
  scenario:
    "A user logs into a secure financial wellness platform with a username and password. Once authenticated, they can talk to an AI assistant that gives personalized guidance on managing their finances, based on profile information they have previously and securely provided (or that the system can securely access after login). The interaction must be highly secure, personalized and strictly informational, not regulated financial advice.",
  goal: "Provide personalized, actionable tips and insights on budgeting, saving or debt management based on the authenticated user's securely accessed financial profile summary, while keeping strict security, privacy and ethical boundaries.",
  objective:
    "Offer users tailored financial literacy guidance and suggestions relevant to their situation (income range, savings goals, debt levels) after they have securely logged in. This requires access to user-specific context and responsible, non-prescriptive advice.",
  techniques: [
    ["Security context (critical, an external system prerequisite)", "The template assumes a secure login mechanism outside the prompt itself. The prompt's context includes confirmation that the user is authenticated. This is vital: the prompt does not handle login, it operates conditional upon it."],
    ["Context setting (pillar 1)", "Several pieces of secure context, presumably fetched after a successful login: the authentication status; a user financial profile summary (anonymized or summarized key data such as income bracket, savings goal progress, debt-to-income category, recent spending trend summary, without sensitive details like full account numbers, using summaries or categories); the user's specific query or goal; and the ethical and regulatory constraints (no regulated financial advice, no specific product recommendations unless permitted and clearly labeled, promoting general financial literacy)."],
    ["Retrieval principle", "The guidance is grounded in the provided profile summary and possibly linked to a trusted financial literacy knowledge base, also provided as context, holding general principles."],
    ["Instructions and logic (pillar 2)", "Acknowledge the user's authenticated status implicitly or explicitly, analyze the profile summary in light of the query, identify relevant financial literacy principles or common strategies (from the knowledge base or general training), tailor general tips to the profile (if savings goal progress is low, suggest relevant savings strategies) and filter the suggestions through the ethical and regulatory constraints."],
    ["Constitutional prompting and ethical constraints", "Extremely important. Give informational guidance ONLY, state clearly that it is NOT financial advice, avoid specific product endorsements unless explicitly allowed and sourced, focus on education and general best practice and avoid overly prescriptive language."],
    ["Structured output (optional)", "Headings such as Observations based on your Profile, General Tips, Potential Next Steps to Consider and Disclaimer."],
    ["Persona (pillar 1)", "A helpful, cautious and objective Financial Literacy Guide."],
  ],
  intended:
    "Give authenticated users personalized and relevant financial education tips that help them make better decisions, delivered securely and responsibly within strict ethical and regulatory boundaries.",
  prompt: `### CONTEXT ###
Role: You are an AI Financial Literacy Guide for authenticated users of the
'MyFinanceWellness' platform.
Goal: Provide personalized, informational guidance and general tips related to the
user's query, based only on their provided profile summary and general financial
literacy principles. This is NOT regulated financial advice.

**Authentication Status:** User "[UserID/Username]" - AUTHENTICATED

**User Financial Profile Summary (Securely retrieved post-login):**
<user_profile_summary>
* Income Bracket: [e.g., Medium]
* Primary Savings Goal: [e.g., 'House Down Payment' - 30% funded]
* Debt Load Category: [e.g., Moderate - Student Loan, Low Credit Card]
* Recent Spending Trend: [e.g., 'Slight increase in Dining Out category last month']
* Risk Tolerance Indication (If available): [e.g., Moderate]
</user_profile_summary>

**Financial Literacy Knowledge Base (Excerpts - Optional but helpful):**
<knowledge_base>
* Principle 1: Budgeting - Track income vs. expenses (e.g., 50/30/20 rule).
* Principle 2: Emergency Fund - Aim for 3-6 months of living expenses.
* Principle 3: Debt Management - Prioritize high-interest debt (Avalanche) or
  smallest balances (Snowball).
* Principle 4: Savings Goals - Define goal, set timeline, automate savings.
* ... (Include relevant general principles) ...
</knowledge_base>

**User Query/Goal:**
<user_query>
[User asks their question here, e.g., "I feel like I'm not saving enough for my house
down payment, any general tips?"]
</user_query>

**CRITICAL ETHICAL & REGULATORY CONSTRAINTS:**
1. **Informational Only:** Provide general tips, education, and guidance based on
   profile/knowledge base. DO NOT provide specific financial advice, investment
   recommendations, or product endorsements (unless linking to pre-approved internal
   bank resources, clearly labeled).
2. **Disclaimer Required:** MUST include a clear disclaimer at the end stating this is
   informational guidance, not financial advice, and users should consult qualified
   professionals for specific advice.
3. **Privacy:** Do not repeat sensitive numerical data from the profile unless
   essential and directly relevant to illustrate a general principle. Focus on
   categories and trends.
4. **Non-Prescriptive:** Use cautious language (e.g., "You might consider...", "A
   common strategy is...", "Some people find it helpful to...") rather than direct
   commands ("You must...").

### INSTRUCTION ###
1. Acknowledge the authenticated user's query.
2. Analyze the <user_profile_summary> in relation to the <user_query> and the general
   principles in the <knowledge_base>.
3. Provide 2-3 personalized, actionable, general tips or insights relevant to the
   user's situation and query. Connect tips back to their profile summary where
   appropriate (e.g., "Given your goal progress is at 30%...").
4. Ensure all tips align strictly with the Ethical & Regulatory Constraints.
5. Conclude with the mandatory disclaimer.

**Output Format:**
Use a friendly, supportive, and educational tone. Structure the response clearly,
perhaps with bullet points for tips.

### PERSONALIZED FINANCIAL GUIDANCE ###`,
  flow: [
    "Start when the user logs in successfully. The system confirms authentication and securely retrieves the user profile summary.",
    "The user submits a query or goal. Optional inputs: product or service information and the financial literacy knowledge base. Always present: the CRITICAL ethical and regulatory constraints.",
    "The AI analyzes the query and the profile and identifies relevant patterns or needs.",
    "It consults the knowledge base or general principles and generates potential tips and insights.",
    "Apply the ETHICAL AND REGULATORY FILTER. A tip that violates a constraint is discarded or modified. A compliant one is kept.",
    "Select 2 to 3 personalized, compliant tips and format the response.",
    "Add the MANDATORY disclaimer, generate the personalized guidance and display it to the authenticated user.",
  ],
  flowNote: "The flowchart highlights the secure context retrieval after authentication and the critical ethical filtering step before the final guidance is generated.",
  refinement: [
    "Develop more granular few-shot examples that show how to tailor specific tips to different profile summaries while respecting the constraints, for example how to discuss debt strategies differently for low and high income brackets responsibly.",
    "Incorporate chain of thought for more complex analyses, if the prompt needs to explain why a tip is relevant based on several data points.",
    "Add instructions to ask clarifying questions if the user's query is ambiguous.",
    "Refine the persona to be even more encouraging or educational.",
  ],
  application: [
    "Displayed directly to the authenticated user within the secure platform.",
    "Used as conversation starters for human financial advisors during scheduled consultations, with the user's permission.",
    "Aggregated, anonymized analysis of common query types can inform the bank about customer education needs.",
  ],
  integrationTitle: "Integration (advanced and highly sensitive)",
  integration: [
    "Crucial security: the whole concept relies on robust external authentication and secure data handling before the prompt is even invoked. The prompt itself cannot manage login security.",
    "The API connects securely to fetch the minimal necessary profile summary data for the authenticated user on request. Sensitive raw data should ideally not pass through the prompt layer.",
    "Potentially link the suggested tips to approved internal educational resources or tools within the platform.",
    "Implement rigorous logging and auditing of the AI's suggestions and the data used, to ensure compliance and to allow review of ethical adherence.",
  ],
  tryThis: "Rewrite the four constraints for another sensitive domain, for example health information, keeping the disclaimer and the cautious language.",
};

const TODO: Blueprint = {
  domain: "Productivity, task management, personal information management",
  scenario:
    "A user keeps a simple to-do list with tasks, deadlines, statuses (Not Started, In Progress, Completed) and optional notes. They want to interact with the list in natural language to get summaries, find overdue items, update statuses and add notes.",
  goal: "Process natural language requests about a structured to-do list: provide accurate summaries, identify tasks by criteria (overdue, due today), update task statuses and add notes, based only on the provided list data.",
  objective:
    "Create a prompt structure that lets a language model act as an intelligent interface to a user's to-do list data, enabling natural language queries and updates while keeping the data intact.",
  techniques: [
    ["Context setting (pillar 1)", "The current to-do list data, in a clear structured format, is the primary context the system operates on. The user's natural language request is the secondary context."],
    ["Structured input data", "The list must be presented consistently, for example as a Markdown table, a numbered list with metadata or tagged blocks, so the system can parse it reliably."],
    ["Instructions and intent recognition (pillar 2, tool-using controller simulation)", "The instructions tell the model to parse the request to understand the intent (summarize, find overdue, update status, add note), to perform the required action on the list data (searching, filtering or identifying specific tasks) and to generate an appropriate response: the requested summary or list, a confirmation of an update or a request for clarification if the request is ambiguous. This simulates a tool-using system where the model is the controller interpreting the request and operating on a database, here the list in the context."],
    ["Retrieval principle", "All operations and responses are strictly grounded in the provided to-do list data. The system must not invent tasks or assume statuses."],
    ["Structured output (optional but helpful)", "A consistent format, such as a table or list, for summary requests, and clear update confirmations."],
    ["Constraints (pillar 4)", "Perform only actions related to the to-do list and do not answer general knowledge questions. Ask for clarification if a request is ambiguous, for example: which task do you want to mark as completed?"],
  ],
  intended:
    "Let users manage their to-do list more fluidly with natural language queries and commands, getting quick summaries and making updates without working through a rigid interface.",
  prompt: `### CONTEXT ###
Role: You are an AI assistant managing a user's To-Do List.
Goal: Process the user's request regarding the To-Do list provided below, performing
actions like summarizing, filtering, updating status, or adding notes based only on the
provided list data.

**Current To-Do List Data:**
(Represented here as a Markdown table for clarity. Could also be JSON or tagged blocks)
<todo_list_data>
| Task ID | Description                | Due Date   | Status      | Notes                                |
| :------ | :------------------------- | :--------- | :---------- | :----------------------------------- |
| T001    | Draft project proposal     | 2024-11-10 | In Progress | Waiting for input from Finance team. |
| T002    | Schedule team meeting      | 2024-10-28 | Not Started | Coordinate availability via email.   |
| T003    | Review Q3 financial report | 2024-10-25 | Completed   | Sent feedback on Oct 24th.           |
| T004    | Prepare presentation slides| 2024-11-05 | Not Started |                                      |
| T005    | Submit expense report      | 2024-10-26 | In Progress | Need to find restaurant receipt.     |
</todo_list_data>
(Assume today's date is 2024-10-27 for overdue calculation)

**User Request:**
<user_request>
[User types their natural language request here, e.g., "Show me all tasks that are
overdue", "Mark T002 as Completed", "Add a note to T001: Finance feedback received
today", "What tasks are due next week?"]
</user_request>

### INSTRUCTION ###
1. **Analyze Request:** Determine the user's intent based on the <user_request> (e.g.,
   list/filter tasks, update status, add note).
2. **Process Based on Data:** Perform the requested action using only the information
   in <todo_list_data>.
   * For filtering/listing (e.g., overdue, due soon, specific status): Identify matching
     tasks based on their data and the current date (assume 2024-10-27). List the Task
     ID, Description, and Due Date.
   * For status updates: Identify the specified Task ID. Confirm the update (e.g.,
     "Okay, I've marked Task T002 as Completed.").
   * For adding notes: Identify the specified Task ID. Confirm the note has been added
     (conceptually) and state the new note.
3. **Handle Ambiguity:** If the user's request is unclear (e.g., doesn't specify Task ID
   for an update, uses vague filter terms), ask a clarifying question (e.g., "Which task
   ID are you referring to?", "Could you specify the date range for 'soon'?").
4. **Constraint:** Only perform actions related to viewing or modifying the provided
   To-Do list. Do not answer general knowledge questions or perform unrelated tasks.
5. **Output:** Provide the requested list/summary or a confirmation message.

### RESPONSE / ACTION CONFIRMATION ###`,
  flow: [
    "Start when the user interacts with the to-do list. Two inputs arrive: the current to-do list data and the user's natural language request.",
    "Analyze the intent of the request. Five branches follow.",
    "Intent list or filter tasks: identify the filter criteria (overdue, a date range, a status), search and filter the list data, then format and output the list of matching tasks.",
    "Intent update task status: identify the target task ID and the new status, conceptually update the status in the data and output a confirmation message.",
    "Intent add a note: identify the target task ID and the note content, conceptually add the note and output a confirmation message.",
    "Intent ambiguous or unclear: generate a clarifying question and output it.",
    "Intent unrelated task: generate a refusal message and output it. Every branch ends at the end of the interaction.",
  ],
  flowNote: "The flowchart shows the intent recognition branching to different actions (filtering and listing, updating status, adding notes, asking for clarification or refusing unrelated requests), all based on the to-do list data.",
  refinement: [
    "Add few-shot examples that show how to handle different types of natural language requests, for example What is overdue, Finish task T001, or Remind me about the proposal.",
    "Incorporate more complex filtering, for example tasks assigned to a person, or high-priority tasks due this week (this needs Assignee and Priority fields in the data).",
    "Add instructions for deleting tasks or setting reminders, which needs careful confirmation steps.",
    "Define the behavior for conflicting requests, for example when a user tries to add a note to a task ID that does not exist.",
  ],
  application: [
    "The primary output is the direct response to the user: a list or a confirmation.",
    "Conceptually, the updated list data must be saved outside the model, because the model does not permanently change its context. The prompt simulates the update and generates the confirmation, and an external system handles saving the change.",
  ],
  integration: [
    "Connect the prompt through an API to an actual task management application or database. The prompt interprets the user's natural language and determines the action, and the API call then executes the real change (add a task, update a status) in the external system. The model acts as the natural language interface to the task manager.",
    "Integrate with a calendar API to cross-reference deadlines or schedule reminders based on to-do items.",
  ],
  tryThis: "Apply the book's date of 2024-10-27 to the table and list by hand which tasks the overdue request should return, and why the others are excluded.",
};

export const BLUEPRINTS_2_LESSONS: LessonContent[] = [
  {
    slug: "blueprint-6-retail-replenishment-and-shelf-allocation",
    title: "Blueprint 6: retail replenishment and shelf allocation",
    minutes: 11,
    covers: ["appB-bp06-explained", "appB-bp06-prompt", "appB-bp06-flowchart", "appB-bp06-next-steps"],
    body: blueprintBody(RETAIL),
  },
  {
    slug: "blueprint-7-pharmaceutical-market-analysis",
    title: "Blueprint 7: pharmaceutical market analysis",
    minutes: 12,
    covers: ["appB-bp07-explained", "appB-bp07-prompt", "appB-bp07-flowchart", "appB-bp07-next-steps"],
    body: blueprintBody(PHARMA),
  },
  {
    slug: "blueprint-8-call-center-quality-assurance",
    title: "Blueprint 8: call center interaction analysis",
    minutes: 11,
    covers: ["appB-bp08-explained", "appB-bp08-prompt", "appB-bp08-flowchart", "appB-bp08-next-steps"],
    body: blueprintBody(CALL_CENTER),
  },
  {
    slug: "blueprint-9-personal-finance-guidance",
    title: "Blueprint 9: personal finance guidance for an authenticated user",
    minutes: 12,
    covers: ["appB-bp09-explained", "appB-bp09-prompt", "appB-bp09-flowchart", "appB-bp09-next-steps"],
    body: blueprintBody(FINANCE_GUIDE),
  },
  {
    slug: "blueprint-10-interactive-to-do-list",
    title: "Blueprint 10: interactive to-do list management",
    minutes: 11,
    covers: ["appB-bp10-explained", "appB-bp10-prompt", "appB-bp10-flowchart", "appB-bp10-next-steps"],
    body: blueprintBody(TODO),
  },
];

export const BLUEPRINTS_2_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "retail-replenishment-rule",
    kind: "choice",
    title: "When does the retail blueprint order stock?",
    promptText: "According to the retail blueprint, when is replenishment needed for a SKU and store format?",
    public: {
      options: [
        "When sales last week were higher than the week before",
        "When current stock is below the minimum stock plus the sales per week",
        "Whenever the SKU is a bestseller",
        "When the shelf is empty on Monday",
      ],
    },
    answer: { correct: 1 },
    explanation: "The check is Current Stock < Minimum Stock + Sales/Week. Only SKUs and formats that meet it are listed with a suggested order quantity.",
  },
  {
    slug: "order-retail-logic",
    kind: "order",
    title: "The retail analysis in order",
    promptText: "Put the steps of the retail blueprint in a logical order, from data to report.",
    public: {
      blocks: [
        { id: "placement", text: "Suggest premium, standard and minimal placement by store format" },
        { id: "calc", text: "For each SKU and format, test whether stock is below minimum plus weekly sales, and calculate the order quantity" },
        { id: "rank", text: "Identify the top selling SKUs overall and the slow-moving ones" },
        { id: "table", text: "Present the allocation strategy in a table and the orders as bullet points" },
      ],
    },
    answer: { order: ["calc", "rank", "placement", "table"] },
    explanation: "The replenishment calculation comes first, then the sales ranking that feeds the placement decisions, and finally the formatted report with a table for the allocation.",
  },
  {
    slug: "pharma-source-handling",
    kind: "choice",
    title: "Where the pharma facts come from",
    promptText: "How does the pharmaceutical blueprint handle the source of its facts about registration status?",
    public: {
      options: [
        "It trusts the model's memory and never mentions its limits",
        "It relies primarily on the provided source data, and if it uses general knowledge it must say so and mark the result as needing verification",
        "It refuses to summarize any registration status",
        "It asks the model to invent plausible approvals",
      ],
    },
    answer: { correct: 1 },
    explanation: "The provided source information is strongly preferred for accuracy. Reliance on general knowledge has to be stated clearly, with the note that verification is required.",
  },
  {
    slug: "spot-pharma-limits",
    kind: "spot",
    title: "What the pharma report must not do",
    promptText: "Select every instruction that breaks the limits of the pharmaceutical blueprint.",
    public: {
      pickPrompt: "Select every instruction that breaks the blueprint's limits",
      hitLabel: "Breaks the limits",
      missLabel: "Fits the blueprint",
      segments: [
        { id: "p1", text: "List typical cost categories and give exact monetary values for each." },
        { id: "p2", text: "Summarize the API's registration status and note the limitations of the information source." },
        { id: "p3", text: "Tell the reader that Drug X is safer than existing treatments, without support in the source data." },
        { id: "p4", text: "Give patients advice on whether to take the drug." },
        { id: "p5", text: "Brainstorm 3 to 5 factors that influence market uptake, such as reimbursement and prescriber habits." },
      ],
    },
    answer: { flawed: ["p1", "p3", "p4"] },
    explanation: "The blueprint forbids specific monetary values, superiority claims that the source data does not support, and medical advice. Summarizing status with its limits and brainstorming market factors are exactly what it asks for.",
  },
  {
    slug: "qa-report-sections",
    kind: "fill",
    title: "Sections of the QA report",
    promptText: "Match each section of the call center QA report to what it contains.",
    public: {
      template:
        "Call Summary and Outcome: {{a}}\nScript and Guideline Adherence: {{b}}\nAreas for Coaching: {{c}}",
      blanks: [
        { id: "a", choices: ["The main reason for the call and the apparent final outcome", "Met, Not Met or Partially Met for each guideline, with evidence", "One or two specific, actionable behaviors to improve", "The agent's personal character"] },
        { id: "b", choices: ["The main reason for the call and the apparent final outcome", "Met, Not Met or Partially Met for each guideline, with evidence", "One or two specific, actionable behaviors to improve", "The agent's personal character"] },
        { id: "c", choices: ["The main reason for the call and the apparent final outcome", "Met, Not Met or Partially Met for each guideline, with evidence", "One or two specific, actionable behaviors to improve", "The agent's personal character"] },
      ],
    },
    answer: { correct: { a: "The main reason for the call and the apparent final outcome", b: "Met, Not Met or Partially Met for each guideline, with evidence", c: "One or two specific, actionable behaviors to improve" } },
    explanation: "The report summarizes the call, rates each guideline with a quote for the ones not fully met, and closes with one or two coachable behaviors. It judges observable behavior in the text, not the person.",
  },
  {
    slug: "order-finance-instruction",
    kind: "order",
    title: "The finance guide's instruction sequence",
    promptText: "Put the five instruction steps of the authenticated finance blueprint in order.",
    public: {
      blocks: [
        { id: "tips", text: "Provide 2 to 3 personalized, actionable, general tips connected to the profile" },
        { id: "disclaimer", text: "Conclude with the mandatory disclaimer" },
        { id: "ack", text: "Acknowledge the authenticated user's query" },
        { id: "check", text: "Ensure all tips align strictly with the ethical and regulatory constraints" },
        { id: "analyze", text: "Analyze the profile summary against the query and the knowledge base principles" },
      ],
    },
    answer: { order: ["ack", "analyze", "tips", "check", "disclaimer"] },
    explanation: "Acknowledge, analyze, tip, check the tips against the constraints, and finish with the disclaimer that the constraints require.",
  },
  {
    slug: "spot-finance-constraints",
    kind: "spot",
    title: "Lines the finance guide must never produce",
    promptText: "Select every line that would break the constraints of the personal finance blueprint.",
    public: {
      pickPrompt: "Select every line that breaks the constraints",
      hitLabel: "Breaks the constraints",
      missLabel: "Acceptable",
      segments: [
        { id: "f1", text: "You must move your savings into Fund Z this week." },
        { id: "f2", text: "You might consider setting up an automatic transfer toward your down payment goal." },
        { id: "f3", text: "Your exact account balance is 18,432.10 and your card number is 4111 1111 1111 1111." },
        { id: "f4", text: "A common strategy is the 50/30/20 rule for budgeting." },
        { id: "f5", text: "(The answer ends without any disclaimer.)" },
      ],
    },
    answer: { flawed: ["f1", "f3", "f5"] },
    explanation: "The blueprint forbids prescriptive commands and product endorsements, repeating sensitive numbers, and leaving out the disclaimer. Cautious wording and general principles are what it asks for.",
  },
  {
    slug: "todo-overdue",
    kind: "choice",
    title: "Which task is overdue?",
    promptText: "Using the book's table and today's date of 2024-10-27, which task should a request for overdue tasks return? (T001 is due 2024-11-10, In Progress. T002 is due 2024-10-28, Not Started. T003 is due 2024-10-25, Completed. T004 is due 2024-11-05, Not Started. T005 is due 2024-10-26, In Progress.)",
    public: {
      options: ["T001", "T002", "T003", "T005"],
    },
    answer: { correct: 3 },
    explanation: "T005 is due before today and is not completed. T003 was also due before today but is Completed, and T001, T002 and T004 are not yet due.",
  },
  {
    slug: "todo-who-saves",
    kind: "choice",
    title: "Who saves the update?",
    promptText: "In the to-do blueprint the model confirms that a task was marked as Completed. What actually makes the change permanent?",
    public: {
      options: [
        "The model, because it permanently changes its context",
        "An external system, because the prompt only simulates the update and generates the confirmation",
        "Nothing, updates are never saved",
        "The user's browser cache",
      ],
    },
    answer: { correct: 1 },
    explanation: "The model does not permanently change its context. The prompt simulates the update, and an external task management system connected through an API executes and saves the real change.",
  },
  {
    slug: "repair-call-qa-prompt",
    kind: "repair",
    title: "Turn a vague request into a QA prompt",
    promptText: "Rewrite this request as a call center QA prompt: a role, the transcript in tags, the guidelines, an adherence rating with evidence, a rule to judge only from the text, and coaching points.",
    public: {
      starter: "Check if this call was good.",
      hint: "Give a role, put the transcript in tags, list the guidelines, ask for Met, Not Met or Partially Met with a quote, say to use only the text, and ask for one or two coaching points.",
    },
    answer: {
      criteria: [
        { id: "role", label: "Gives a role", weight: 1, anyOf: ["\\b(you are|role)\\b"], hint: "Start with a role, for example: You are an AI call center quality assurance analyst." },
        { id: "transcript", label: "Puts the transcript inside tags", weight: 2, anyOf: ["<transcript>[\\s\\S]*</transcript>", "###\\s*call transcript"], hint: "Wrap the transcript in tags such as <transcript> so it is clearly separated." },
        { id: "guidelines", label: "Rates each guideline as Met, Not Met or Partially Met", weight: 2, anyOf: ["\\bnot met\\b[\\s\\S]*\\bpartially met\\b", "\\bpartially met\\b[\\s\\S]*\\bnot met\\b", "\\bmet\\b[\\s\\S]*\\bnot met\\b"], hint: "Ask for a Met, Not Met or Partially Met rating for each guideline, with a quote for the ones not fully met." },
        { id: "only", label: "Restricts the judgment to the transcript and guidelines", weight: 2, anyOf: ["\\b(only|solely|strictly)\\b[\\s\\S]*\\b(transcript|text|guidelines)\\b"], hint: "Say to base the analysis only on the transcript and the guidelines." },
        { id: "coaching", label: "Asks for one or two coaching points", weight: 1, anyOf: ["\\bcoaching\\b", "\\bimprove\\w*\\b"], hint: "Ask for one or two specific areas for coaching or improvement." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Call Center Quality Assurance Analyst.\nCall type: Inbound, technical support.\nGuidelines: 1. Standard greeting used. 2. Customer verification completed. 3. Troubleshooting question X asked.\n\n### CALL TRANSCRIPT ###\n<transcript>\n[Paste the transcript here]\n</transcript>\n\n### INSTRUCTION ###\nAnalyze the call based only on the transcript and the guidelines above. For each guideline state Met, Not Met or Partially Met, and quote the transcript for those Not Met or Partially Met. Then give a brief, objective note on tone and professionalism, and end with 1 to 2 specific coaching points based only on your findings.",
    },
    explanation: "The prompt is the blueprint in miniature: a role, the evidence isolated in tags, explicit criteria with evidence, a grounding rule and a constructive output. Being restricted to the text keeps the judgment objective.",
    samples: {
      good: [
        "You are a QA analyst. Guidelines: greeting, ID check, closing script. <transcript>Agent: Hello... Customer: ...</transcript> Using only the transcript, rate each guideline Met, Not Met or Partially Met with a short quote when it is not fully met, and add two coaching points.",
      ],
      bad: ["Check if this call was good.", "You are a QA analyst. Tell me how the agent did and be honest about their attitude."],
    },
  },
];

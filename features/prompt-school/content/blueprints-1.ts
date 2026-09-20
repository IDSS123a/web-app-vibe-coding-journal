/**
 * Chapter "Blueprint Workshop 1" (book Appendix B, the template library, blueprints 1 to 5): 6 lessons and 10 exercises,
 * written from the Director's book, which is the only source. Every blueprint keeps the book's four parts (scenario and
 * explanation, the Markdown prompt, the flowchart, the next steps). No em dashes (writing rule, PDL-057). `samples` on
 * repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";
import { blueprintBody, type Blueprint } from "./blueprint-lesson";

const PERFUME: Blueprint = {
  domain: "Sales, marketing, market research",
  scenario:
    "A well-known luxury brand is planning to launch a new, sophisticated unisex fragrance aimed at middle-aged professionals (35 to 55) in Paris, France. They need an initial market and competitor analysis, plus strategic communication pointers to inform the launch campaign.",
  goal: "Generate a structured preliminary analysis covering the Paris market potential (demographics focused on the target group), the key competitors for this segment in Paris, and the foundations of a communication strategy.",
  objective:
    "The aim is not to write the final marketing campaign but to provide the strategic foundation for it: structured intelligence on the size and nature of the target market, the competitive environment and first communication angles. The output should let marketing strategists make informed decisions about positioning, messaging and channels.",
  techniques: [
    ["Context setting (pillar 1)", "Frames the whole request: the product (a new luxury unisex fragrance), the specific market (Paris, 35 to 55 year old professionals) and the objective (inform the launch strategy). Without it any analysis would be generic and useless."],
    ["Decomposition and sequential processing", "The request holds three distinct analytical tasks (market size, competitors, communication). The prompt breaks them into numbered steps, which makes the request manageable and ensures every component is addressed. It simulates how a tool-using controller would plan sub-tasks."],
    ["Specific instructions (pillar 2)", "Each step says exactly what to find or generate: population size, the demographic breakdown for the 35 to 55 group, key competitor brands, communication channels, message themes."],
    ["Retrieval principle and simulated tool use", "The prompt admits that it needs external or current data (population, demographics, active competitors). By telling the system to use its most current data or simulate access to demographic databases and market reports, it steers the system toward the type of information needed and shows the data dependency. In a real tool-using system this would trigger actual calls."],
    ["Structured output", "The output must sit under clear Markdown headings that match the analysis steps, so a multi-part analysis is easy to read, navigate and use for planning."],
    ["Constraints (implicit)", "Focusing solely on Paris and the specified group is a constraint in itself. An explicit tone constraint, for example a professional analytical tone, can be added."],
  ],
  intended:
    "Use the system's ability to synthesize information, from its training or simulated external sources, into a structured, actionable preliminary market analysis. It gives the human strategist initial data gathering and brainstorming, saves time and provides a solid base for deeper work.",
  prompt: `### CONTEXT ###
Role: You are an AI Marketing Analyst providing preliminary strategic insights.
Product: A new luxury unisex fragrance from an established brand.
Target Audience: Professionals aged 35-55 (both men and women).
Target Market: Paris, France.
Goal: Generate an initial analysis to inform the product launch strategy in Paris.

### INSTRUCTION ###
Perform the following analysis steps based on the defined context. Use your most
current available data or simulate accessing relevant demographic databases and
market intelligence reports for Paris.

**Step 1: Paris Market Potential Analysis**
* Provide the estimated total population of Paris.
* Provide an estimated demographic breakdown, focusing specifically on the
  percentage and approximate number of residents aged 35-55.
* Briefly comment on the general suitability of this demographic in Paris for a
  luxury fragrance launch, considering factors like disposable income potential or
  cultural affinity (based on general knowledge).

**Step 2: Competitive Landscape Analysis (Paris)**
* Identify 3-5 key competitor *brands* already active in the Parisian market that
  strongly target the 35-55 professional demographic with similar (luxury unisex or
  distinct male/female) fragrances.
* For each competitor brand identified, briefly mention their perceived market
  positioning or key strength in this segment (e.g., classic/established,
  modern/niche, celebrity-endorsed).

**Step 3: Communication Strategy Foundation**
* Suggest 3-4 potentially effective communication *channels* to reach the target
  audience in Paris (e.g., specific types of magazines, social media platforms,
  physical locations, event types). Justify briefly why each channel is relevant.
* Propose 2-3 potential *message themes* or angles for the launch campaign that
  would likely resonate with this demographic (e.g., sophistication, escape,
  individuality, modern elegance, connection to Parisian lifestyle).

### OUTPUT FORMAT ###
Present the analysis clearly under the following Markdown headings:
## 1. Paris Market Potential (35-55 Professionals)
## 2. Key Competitor Brands in Paris
## 3. Communication Strategy Foundation (Channels & Themes)
Maintain a professional and analytical tone throughout the report. Base findings
on plausible data and logical reasoning.`,
  flow: [
    "Start with the perfume launch analysis request and define the context: the product, the target market Paris and the 35 to 55 demographic.",
    "The instruction sets the work in three steps.",
    "Step 1, market potential: request or simulate a lookup of Paris population and demographic data, analyze it with a focus on the 35 to 55 group, and assess the suitability for a luxury fragrance.",
    "Step 2, competitive landscape: request or simulate a lookup of competitor brands in Paris that target the 35 to 55 group, identify 3 to 5 key competitors and analyze their positioning and strengths.",
    "Step 3, communication: brainstorm the channels that reach the target demographic in Paris, then propose the message themes that would resonate.",
    "Format the output, then generate the structured report on market, competitors and communication.",
  ],
  flowNote: "The three steps run as separate branches that are gathered into one formatted report at the end.",
  refinement: [
    "Add constraints for the desired length or depth of each section.",
    "Provide few-shot examples if a very specific style of competitive analysis or message theme generation is required.",
    "Refine the demographic requests, for example ask about income brackets or professions if data access is plausible.",
    "Ask the system to state its confidence level or cite sources when it uses simulated data lookup.",
  ],
  application: [
    "Use the market potential data to estimate initial sales targets.",
    "Use the competitor analysis to inform product positioning and pricing strategy.",
    "Use the channels and themes as input for detailed creative briefs and media plans.",
    "Feed the output into later prompts that generate specific ad copy, social media posts or PR angles.",
  ],
  integration: [
    "In a true tool-using system, replace the simulated lookup instructions with real API calls to demographic databases (INSEE for France, though access may be complex), to market research firms (Euromonitor) or to social media analytics tools for live competitor data.",
  ],
  tryThis: "Rewrite the context block for a product and city of your own, and add one constraint on the length of each section.",
};

const WAREHOUSE: Blueprint = {
  domain: "Logistics, supply chain management, warehouse operations",
  scenario:
    "A central warehouse supplies several retail stores. The system must check current stock levels against the stores' replenishment requests (their needs) and produce a prioritized dispatch plan, considering stock availability and possibly delivery route efficiency.",
  goal: "Generate a daily dispatch plan that prioritizes store orders by stock availability, fulfils requests efficiently and highlights potential shortages.",
  objective:
    "Automate the first draft of the daily dispatch plan: match store needs against current inventory, prioritize fulfillable orders and flag the items that cannot be dispatched because of stock shortages. The result is a clear list for the dispatch team.",
  techniques: [
    ["Context setting (pillar 1)", "Crucial, because it provides the state of the world: the current warehouse inventory (ideally structured) and the incoming store requests (also structured). Without this data, planning is impossible."],
    ["Structured input data", "The prompt shows simple lists, but in real life the data would come from databases or spreadsheets. The prompt assumes a clear, parseable format, which shows how much depends on well-structured input."],
    ["Specific instructions and logic (pillar 2, chain of thought simulation)", "The prompt states the logic to follow: compare each request with stock, determine the fulfillable quantities per store, prioritize (here by processing in order), generate a dispatch list for what can be sent and a separate shortage list for what cannot. This needs sequential reasoning."],
    ["Structured output", "Two distinct lists, a Dispatch Plan and a Shortage Report, under clear headings, so the information is immediately actionable for two different teams: dispatch, and procurement or inventory management."],
    ["Constraints (implicit and explicit)", "Available stock is an implicit constraint. Explicit constraints could add vehicle capacity, route order, or a rule such as fulfilling Store A first."],
    ["Grounding (retrieval principle)", "The whole process rests only on the provided inventory and request data. The system must not invent stock or assume availability."],
  ],
  intended:
    "An automated first pass of the dispatch plan that saves significant manual effort in cross-referencing stock and requests, and gives immediate visibility of fulfillable orders and critical shortages.",
  prompt: `### CONTEXT ###
Role: You are an AI Warehouse Dispatch Planner.
Goal: Generate a daily dispatch plan and shortage report based on current inventory
and store requests.

**Current Warehouse Inventory:**
* Item SKU-101 (Bosnian Coffee 250g): 50 units
* Item SKU-102 (Lokum Rose 500g): 25 units
* Item SKU-201 (Woven Rug Small): 10 units
* Item SKU-202 (Copper Dzezva Set): 5 units
* Item SKU-301 (Sarajevo Guidebook): 100 units

**Today's Store Replenishment Requests:**
* **Store A (Sarajevo - Bascarsija):**
  * SKU-101: 20 units
  * SKU-102: 15 units
  * SKU-301: 30 units
* **Store B (Mostar - Old Town):**
  * SKU-101: 35 units (Exceeds remaining stock after Store A)
  * SKU-201: 8 units
  * SKU-202: 3 units
* **Store C (Banja Luka - Centre):**
  * SKU-102: 15 units (Exceeds remaining stock after Store A)
  * SKU-202: 4 units (Exceeds remaining stock after Store B)
  * SKU-301: 50 units

### INSTRUCTION ###
Analyze the current inventory and today's store requests provided above. Generate
two lists:
1. **Dispatch Plan:** List items and quantities that CAN be dispatched to each
   store based on available stock. Process requests sequentially (Store A, then B,
   then C) and update available stock after each allocation.
2. **Shortage Report:** List items and quantities requested by each store that
   CANNOT be fully dispatched due to insufficient stock. Note the requested amount
   and the shortfall.

**Output Format:**
Use clear Markdown headings for each section (## Dispatch Plan and ## Shortage
Report) and bullet points for each store and item within those sections. Be precise
with quantities. Base calculations strictly on the provided data.

### DISPATCH & SHORTAGE OUTPUT ###`,
  flow: [
    "Start the dispatch planning request. Two inputs arrive: the warehouse inventory levels and the store replenishment requests.",
    "Process the requests sequentially: Store A, then B, then C.",
    "Store A: check availability of each item. SKU-101 (20 requested, 50 available) is allocated and the inventory becomes 30. SKU-102 (15 of 25) is allocated and becomes 10. SKU-301 (30 of 100) is allocated and becomes 70.",
    "Store B: SKU-101 requests 35 but only 30 are available, so it is a shortage (requested 35, available 30). SKU-201 (8 of 10) is allocated and becomes 2. SKU-202 (3 of 5) is allocated and becomes 2. The shortage information carries forward.",
    "Store C: SKU-102 requests 15 but only 10 are available (shortage). SKU-202 requests 4 but only 2 are available (shortage). SKU-301 (50 of 70) is allocated and becomes 20.",
    "Compile the allocations into the Dispatch Plan list and the shortages into the Shortage Report list, format the output and end with both lists.",
  ],
  flowNote: "This flowchart details the core logic the prompt instructs the system to follow: sequential checking, allocation, inventory update and shortage identification.",
  refinement: [
    "Add more complex prioritization rules, for example prioritize high-volume stores, or items with the lowest stock first to avoid a complete stockout. This needs more detailed instructions.",
    "Include inventory locations within the warehouse and optimize picking paths (much more complex, likely needing specialized logic or tools beyond a basic language model).",
    "Add constraints on delivery truck capacity or route planning.",
    "Use few-shot examples if the output format must be highly specific, for example CSV or specific codes instead of item names.",
  ],
  application: [
    "The Dispatch Plan is used directly by warehouse pickers and drivers.",
    "The Shortage Report goes straight to procurement and inventory managers to trigger reordering or stock reallocation.",
    "The data can feed a dashboard for real-time visibility.",
  ],
  integration: [
    "Connect the prompt through an API to live inventory systems (for example SAP or Oracle SCM) to pull real-time stock instead of pasting it by hand.",
    "Connect to order management systems to pull the store requests automatically.",
    "Feed the generated dispatch plan into routing software or directly into warehouse management systems. This moves toward a fully automated workflow element.",
  ],
  tryThis: "Check the book's numbers yourself: after Store A, how many units of SKU-101 remain, and how large is Store B's shortage?",
};

const PRODUCTION: Blueprint = {
  domain: "Manufacturing, production planning, operations management",
  scenario:
    "A factory producing high-quality wooden decking works in three shifts. Production plans dictate the amount and type of raw lumber needed per shift, based on customer orders and target output. The system must check raw material inventory, anticipate needs for the next 24 hours (three shifts) and generate material requisitions or transfer plans from the main warehouse to the production line for each shift.",
  goal: "Generate a clear, shift-based plan for moving the required raw lumber (specified types and quantities) from the warehouse to the production floor, ensuring continuous operation and flagging potential material shortages before they hit production.",
  objective:
    "Automate the planning of raw material flow from warehouse storage to the point of use on the line, synchronized with the planned production schedule of each upcoming shift over 24 hours, while accounting for the current stock levels.",
  techniques: [
    ["Context setting (pillar 1)", "Absolutely critical. Three pieces of context are needed: the current raw material inventory (for example Oak Grade A, Beech Select), the production plan for the next 24 hours (the products each shift makes and the lumber needed per unit or shift), and optionally the delivery lead times, which say how long it takes to get more material if stock is low."],
    ["Structured input data", "As in the warehouse blueprint, inventory and production plan are supplied in a clear structure (lists, tables or tagged blocks). Real use would pull them from ERP or manufacturing execution systems."],
    ["Decomposition and sequential logic (chain of thought simulation, divide and conquer)", "The task is broken down by shift: calculate the total material needed for Shift 1, compare it with current inventory, determine the transfers and note any immediate shortages, update the projected inventory after Shift 1's consumption, then repeat for Shift 2 using the projected inventory from Shift 1, and for Shift 3 using the projection from Shift 2. Considering the impact of one shift on the next is the key."],
    ["Calculation (simulated tool use)", "The prompt requires calculations (material needed equals units to produce times material per unit), which the model performs from the supplied data and instructions."],
    ["Structured output", "The output is formatted by shift with separate sections for material transfers and potential shortages, so it is actionable for warehouse and production teams."],
    ["Retrieval principle", "All calculations and plans are grounded strictly in the provided inventory and production plan."],
    ["Constraints", "Inventory levels are the implicit constraints. Explicit ones could be minimum stock levels to maintain or batch sizes for transfers."],
  ],
  intended:
    "Give production supervisors and warehouse managers a clear, forward-looking plan for material movement over the next 24 hours, preventing line stoppages caused by shortages and enabling proactive management of raw material inventory.",
  prompt: `### CONTEXT ###
Role: You are an AI Production Material Planner for a wooden decking factory.
Goal: Generate a material transfer plan from the warehouse to the production line
for the next 24 hours (covering Shifts 1, 2, and 3), based on the production
schedule and current raw material inventory. Flag potential shortages.

**Current Raw Material Inventory (Warehouse):**
* Oak Lumber - Grade A: 500 m3
* Oak Lumber - Grade B: 1200 m3
* Beech Lumber - Select: 800 m3
* Pine Lumber - Standard: 2000 m3
* Special Varnish - Type SV-01: 150 Liters

**Production Plan & Material Requirements (Next 24 Hours):**
* **Shift 1 (06:00 - 14:00):**
  * Product: "Oak Premium Decking" - 1000 m2 output planned.
  * Requires: 1.1 m3 Oak Grade A per m2; 0.1 L Varnish SV-01 per m2.
* **Shift 2 (14:00 - 22:00):**
  * Product: "Beech Standard Decking" - 1500 m2 output planned.
  * Requires: 1.2 m3 Beech Select per m2.
* **Shift 3 (22:00 - 06:00):**
  * Product: "Oak Economy Decking" - 1800 m2 output planned.
  * Requires: 1.2 m3 Oak Grade B per m2.
  * Product: "Pine Basic Decking" - 500 m2 output planned.
  * Requires: 1.0 m3 Pine Standard per m2.

### INSTRUCTION ###
Analyze the inventory and production plan. Create a material requirements and
transfer plan, broken down by shift for the next 24 hours. Follow these steps
sequentially:
1. **Calculate Shift 1 Needs:** Determine the total amount of each raw material
   required for Shift 1's planned production.
2. **Plan Shift 1 Transfers & Shortages:** Compare Shift 1 needs to current
   inventory. List materials and quantities to be transferred to the production
   line. If any material is insufficient, clearly flag it as a SHORTAGE with the
   amount needed vs. available.
3. **Calculate Projected Inventory After Shift 1:** Determine the remaining
   inventory levels after fulfilling (or attempting to fulfill) Shift 1's needs.
4. **Repeat for Shift 2:** Calculate Shift 2 needs based on its plan. Compare these
   needs against the projected inventory after Shift 1. List Shift 2 transfers and
   flag any new shortages based on this projected availability. Calculate
   projected inventory after Shift 2.
5. **Repeat for Shift 3:** Calculate Shift 3 needs. Compare against projected
   inventory after Shift 2. List Shift 3 transfers and flag any new shortages.

**Output Format:**
Present the plan using clear Markdown headings for each shift (## Shift 1 Plan,
## Shift 2 Plan, ## Shift 3 Plan). Within each shift, use subheadings
(### Material Requirements, ### Warehouse Transfer Actions, ### Potential
Shortages). List materials and quantities clearly. Highlight shortages prominently.

### 24-HOUR MATERIAL FLOW PLAN ###`,
  flow: [
    "Start the material flow plan request. Two inputs arrive: the current inventory and the production plan by shift.",
    "Calculate the Shift 1 material needs and compare them with the current inventory.",
    "If stock is sufficient, plan the Shift 1 transfers. If it is insufficient, identify and flag the Shift 1 shortages.",
    "Calculate the projected inventory after Shift 1.",
    "Calculate the Shift 2 needs and compare them with the projected inventory after Shift 1. Plan the transfers or flag the shortages, then calculate the projected inventory after Shift 2.",
    "Calculate the Shift 3 needs, compare them with the projected inventory after Shift 2, and plan the transfers or flag the shortages.",
    "Compile the transfer plan and the shortage report by shift, format the output and provide the shift-based material plan.",
  ],
  flowNote: "The flowchart shows the core sequential logic: calculate the needs of a shift, check them against available stock (which changes after each shift), plan transfers, flag shortages, update the stock projection and repeat for the next shift.",
  refinement: [
    "Add constraints for minimum buffer stock levels that must remain in the warehouse.",
    "Incorporate lead times from the context to estimate when shortages become critical if replenishment is not started.",
    "Use few-shot examples if the output needs very specific table structures or codes.",
    "Add instructions on optimal transfer batch sizes (for example forklift capacity) if that data is available.",
    "Prompt for alternative actions when a shortage occurs, for example suggest substituting Oak Grade B if Grade A runs out, noting the quality difference.",
  ],
  application: [
    "The warehouse team uses the Transfer Actions list of each shift to move materials.",
    "Production supervisors use the plan to confirm material availability before starting a shift.",
    "The procurement team uses the Potential Shortages list to prioritize ordering raw materials.",
    "The data can feed an overall production dashboard.",
  ],
  integration: [
    "Connect the prompt through an API to live ERP and manufacturing execution systems for real-time inventory and production schedule data.",
    "Automatically generate material transfer requests in the warehouse management system from the prompt's output.",
    "Trigger automated alerts to procurement when shortages are predicted.",
  ],
  tryThis: "Calculate Shift 1 by hand: how much Oak Grade A does 1000 m2 need, and how much remains for the rest of the day?",
};

const BANKING: Blueprint = {
  domain: "Banking, financial services, customer relationship management (CRM)",
  scenario:
    "A bank wants to analyze its existing customer database to identify potential needs for specific financial products (investment advice, mortgages, credit line increases) and personalize its outreach. The analysis must consider various customer data points while adhering strictly to privacy regulations and ethical guidelines.",
  goal: "Analyze anonymized or permissioned customer data segments to identify potential financial needs or milestones, and suggest appropriate, ethically sound product or service categories for personalized communication, without making definitive credit decisions or using discriminatory factors.",
  objective:
    "Use AI to analyze patterns in customer data (spending habits, income, life stage indicators inferred from the data if permissible) to identify potential financial needs and suggest categories of relevant products or advice for personalized outreach, strictly within ethical and privacy boundaries. This is NOT for automated credit approval. It is for identifying potential customer interest or suitability for outreach.",
  techniques: [
    ["Context setting (pillar 1)", "Needs structured, anonymized (or properly permissioned) customer data segments, and the bank's available product categories (mortgages, investment services, credit cards, personal loans, financial planning). Above all it needs the ethical guidelines as context."],
    ["Retrieval principle", "The analysis is grounded strictly in the provided customer data and the defined product categories. No external assumptions about individuals are made."],
    ["Specific instructions and logic (pillar 2, chain of thought simulation)", "Analyze the data points of a segment (income level, spending patterns, loan history), identify life-stage indicators or financial patterns (a high savings rate, a large recurring payment that suggests rent or a mortgage, high travel spending), match the patterns to predefined product categories (high savings to investment advice, paying rent to mortgage information), and filter the suggestions through the explicit ethical rules."],
    ["Constitutional prompting and ethical constraints (critical)", "The prompt MUST forbid the use of protected characteristics (race, gender, religion and so on, even if they could be inferred) and discriminatory suggestions. It enforces fairness and focuses on financial behavior and needs, not demographic profiling, for example: do not use age, gender, location or inferred ethnicity, focus only on financial data patterns, and ensure suggestions are equitable and avoid predatory targeting."],
    ["Structured output", "A structured list (segment ID, identified patterns, suggested product categories, justification) makes the analysis clear and auditable."],
    ["Few-shot examples (optional but recommended)", "Examples that link financial patterns to product categories while respecting the ethical rules improve quality and safety. Show examples that explicitly avoid discriminatory links."],
  ],
  intended:
    "Give relationship managers and marketing teams ethically screened suggestions for personalized outreach, improving relevance and customer experience without discriminatory practices or automated decisions that affect creditworthiness.",
  prompt: `### CONTEXT ###
Role: You are an AI Banking Customer Needs Analyst operating under strict ethical
guidelines.
Goal: Analyze provided customer data segments to identify potential financial
needs/patterns and suggest RELEVANT and ETHICALLY APPROPRIATE banking
product/service CATEGORIES for personalized outreach consideration. This analysis
is NOT for credit scoring or approval decisions.

**Available Banking Product Categories:**
* Mortgage & Home Loans
* Investment & Wealth Management Services
* Credit Cards (Standard, Rewards, Low Interest)
* Personal Loans (Debt Consolidation, Major Purchase)
* Small Business Banking Services
* Financial Planning & Advisory
* Savings Accounts & Term Deposits

**CRITICAL ETHICAL & PRIVACY GUIDELINES (Must be followed strictly):**
1. **Data Privacy:** Base analysis ONLY on the anonymized financial data points
   provided for each segment below.
2. **Non-Discrimination:** DO NOT use or infer age, gender, ethnicity, religion,
   location, marital status, or any protected characteristic in your analysis or
   suggestions. Your analysis must be blind to these factors.
3. **Fairness:** Ensure suggested product categories are based on potential
   financial need or behavior patterns only, not on demographic profiling. Avoid
   suggesting potentially predatory products (e.g., high-interest loans for
   segments showing financial distress, unless specifically framed as
   consolidation options).
4. **Purpose Limitation:** Remember, the goal is suggesting categories for
   outreach/information, not making credit decisions.

**Customer Data Segment(s) for Analysis:**
(Provide anonymized/permissioned data, ideally structured. Example format below)
<customer_segment id="SEGMENT-001">
  <data point="avg_monthly_income_range">High (e.g., >10,000 BAM)</data>
  <data point="avg_monthly_spending_cc">Moderate</data>
  <data point="spending_categories_cc">High % on Travel, Dining</data>
  <data point="savings_balance_range">High (>50,000 BAM)</data>
  <data point="existing_loans">None</data>
  <data point="business_owner_flag">No</data>
</customer_segment>
<customer_segment id="SEGMENT-002">
  <data point="avg_monthly_income_range">Medium (e.g., 3,000-6,000 BAM)</data>
  <data point="avg_monthly_spending_cc">High</data>
  <data point="spending_categories_cc">High % on Retail, Groceries; Regular large
  payment labeled 'Rent'</data>
  <data point="savings_balance_range">Low (<5,000 BAM)</data>
  <data point="existing_loans">Personal Loan (Moderate Balance)</data>
  <data point="business_owner_flag">No</data>
</customer_segment>
(Add more segments as needed)

### INSTRUCTION ###
For each provided customer data segment:
1. **Analyze Financial Patterns:** Briefly identify key financial behaviors or
   situations suggested ONLY by the provided data points (e.g., 'High savings
   balance', 'Regular rent payment indicated', 'High credit card usage').
2. **Suggest Relevant Product Categories:** Based only on the analyzed patterns
   and the available product list, suggest 1-2 banking product categories that
   might be relevant to explore in outreach communication.
3. **Provide Justification:** Briefly explain why each suggested category is
   relevant based only on the identified financial pattern and ethical guidelines
   (e.g., "High savings suggests potential interest in Investment Services",
   "Regular rent payment suggests potential future interest in Mortgage
   Information").
4. **Ethical Compliance Check:** Confirm that your suggestions adhere strictly to
   the non-discrimination and fairness guidelines.

**Output Format:**
Present the analysis for each segment clearly, perhaps using Markdown subheadings
or a list structure:
### Segment ID: [Segment ID]
- Identified Patterns: [List patterns]
- Suggested Categories: [List categories]
- Justification: [Provide justification]
- Ethical Compliance Confirmed: Yes

### CUSTOMER NEEDS ANALYSIS OUTPUT ###`,
  flow: [
    "Start the customer analysis request with three inputs: the available product categories, the CRITICAL ethical guidelines and the anonymized customer data segments.",
    "Process each customer segment in turn.",
    "Analyze the financial patterns from the segment data only, and identify potential needs and life stage indicators, fact-based.",
    "Match the patterns to relevant product categories.",
    "Apply the ETHICAL FILTERING. A suggestion that violates a guideline is discarded or modified. A compliant one is selected.",
    "Formulate the justification from the pattern and the ethics, format the output for the segment and explicitly confirm the ethical compliance.",
    "If there are more segments, repeat. When there are none, compile the full analysis report of ethically screened outreach suggestions.",
  ],
  flowNote: "The flowchart emphasizes the crucial ethical filtering step, applied after potentially relevant categories are identified purely from financial patterns.",
  refinement: [
    "Add more sophisticated pattern recognition if needed, for example debt-to-income ratios linked to consolidation loan information, or business spending patterns linked to small business services.",
    "Include few-shot examples of both appropriate pattern-to-category links and inappropriate links that violate the ethical guidelines, so the system sees what not to do.",
    "Refine the product category definitions for more nuance.",
    "Add a step that suggests specific communication angles for the identified need, for example focus on long-term growth for investment suggestions.",
  ],
  application: [
    "Relationship managers use it to personalize conversations and offer relevant information, not automated decisions.",
    "Marketing teams use it to create segmented outreach campaigns with appropriate product information.",
    "It supports internal reporting on potential customer base needs, aggregated and anonymized.",
  ],
  integrationTitle: "Integration (advanced and sensitive)",
  integration: [
    "Connect the prompt, through a secure API with strict access controls and logging, to an anonymized or permissioned data warehouse of customer financial aggregates. NEVER raw personal data directly, unless fully compliant with GDPR, CCPA and similar rules.",
    "Feed the suggestions into a CRM system that flags customer profiles for specific types of outreach, always requiring human review and approval before any customer contact.",
    "Crucial: any integration with real customer data demands extreme focus on data security, privacy compliance, anonymization techniques and robust ethical oversight. This is a high-risk application area.",
  ],
  tryThis: "Write one few-shot example that shows a forbidden link (a suggestion that uses a protected characteristic) and the corrected, behavior-only version.",
};

const LESSON_PLAN: Blueprint = {
  domain: "Education, curriculum development, teaching assistance",
  scenario:
    "A teacher, for example a middle school history teacher, needs a detailed lesson plan for a specific topic within their curriculum, incorporating modern teaching practices and aligned with stated learning objectives.",
  goal: "Generate a structured, comprehensive and engaging lesson plan draft for a specific topic, grade level and duration, including objectives, activities, materials and assessment methods, drawing on best practice in pedagogy.",
  objective:
    "Help educators by automating the first draft of a well-structured lesson plan. This saves time and gives a framework with diverse activities and assessment strategies, which the teacher then refines and customizes.",
  techniques: [
    ["Context setting (pillar 1)", "Absolutely essential. The prompt needs the target topic (for example the causes of World War I), the grade level (which tailors complexity, activities and language), the lesson duration (for example one 50 minute class period), the learning objectives (given, or the system can be asked to suggest them) and, optionally but recommended, the desired teaching practices (group work, primary source analysis, a short video discussion, inquiry-based learning)."],
    ["Specific instructions (pillar 2, chain of thought simulation)", "The prompt outlines the required sections of a standard lesson plan and asks for content for each in sequence: state or refine the objectives, list the materials, outline the activities (introduction or hook, main activities, conclusion or wrap-up) with approximate timings, suggest assessment methods (formative and summative) and include differentiation strategies for diverse learners."],
    ["Structured output", "Clear headings for each section (Learning Objectives, Materials and so on) make the plan immediately usable for the teacher."],
    ["Retrieval principle and knowledge base (implicit)", "The system's training data includes pedagogy, possibly curriculum standards and the subject itself, acting as an implicit knowledge base. Explicit context, such as specific curriculum standards, can be added."],
    ["Few-shot examples (optional)", "If instructions are clear they are not strictly needed, but one example of a well-formatted section, for instance a sample Activities section, can enforce a very specific structure or style."],
    ["Constraints", "The time allocated per activity is a constraint. Explicit constraints could forbid certain types of activities or set the level of student interaction."],
  ],
  intended:
    "A high-quality draft lesson plan that is pedagogically sound, well structured, engaging and aligned with the teacher's requirements: a significant time-saver and a source of teaching ideas.",
  prompt: `### CONTEXT ###
Role: You are an AI Curriculum Assistant specializing in creating engaging and
effective lesson plans based on modern pedagogical practices.
Goal: Generate a detailed lesson plan draft for the specified topic, grade level,
and duration.

**Lesson Parameters:**
* **Topic:** [Specify the exact lesson topic, e.g., "Introduction to the
  Pythagorean Theorem", "The Role of Sarajevo in the Start of WWI", "Analyzing
  Poetic Devices in Shakespeare's Sonnets"]
* **Grade Level:** [Specify target grade, e.g., "8th Grade", "10th Grade English",
  "Grade 5 Science"]
* **Lesson Duration:** [Specify time, e.g., "One 50-minute class period",
  "90-minute block"]
* **Key Learning Objectives (What students should know/be able to do):**
  * [Objective 1, e.g., "Students will be able to define the Pythagorean Theorem
    in their own words."]
  * [Objective 2, e.g., "Students will be able to identify the hypotenuse and legs
    of a right triangle."]
  * [Objective 3, e.g., "Students will be able to apply the theorem (a2+b2=c2) to
    solve for a missing side length in simple examples."]
  (Provide 2-4 clear objectives. Alternatively, ask the system to SUGGEST
  objectives based on the topic/grade)
* **Desired Teaching Approaches (Optional):** [Mention preferences, e.g., "Include
  a hands-on activity," "Emphasize group discussion," "Use a short video clip,"
  "Incorporate primary source analysis"]

### INSTRUCTION ###
Generate a detailed lesson plan draft based on the parameters above. Structure the
plan using the following Markdown headings and include relevant details for each
section:

**1. Learning Objectives:**
- Restate or refine the provided objectives to be clear, measurable, and
  appropriate for the grade level.

**2. Materials & Resources:**
- List all materials needed for the teacher and students (e.g., whiteboard,
  markers, worksheets, computers, specific software, video link, physical objects,
  art supplies).

**3. Lesson Activities (with approximate timings):**
- **Introduction / Hook (~ [e.g., 5-10] mins):** Describe an activity to capture
  student interest and connect to prior knowledge (e.g., posing a question,
  showing an image, brief story).
- **Instruction / Main Activities (~ [e.g., 30-35] mins):** Detail the core
  teaching and learning activities. Describe what the teacher does and what the
  students do. Incorporate desired teaching approaches if specified. Break into
  logical steps if appropriate (e.g., explanation, guided practice, group work,
  independent activity).
- **Conclusion / Wrap-up (~ [e.g., 5-10] mins):** Describe how to summarize the
  key learning points, check for understanding, and preview the next steps or
  assign homework.

**4. Assessment Methods:**
- Suggest 1-2 ways to check for student understanding during the lesson
  (formative assessment, e.g., quick checks, observation, group work output)
  and/or at the end (summative assessment, e.g., exit ticket question, short quiz
  problem, brief written reflection).

**5. Differentiation:**
- Suggest 1-2 specific strategies to support diverse learners (e.g., providing
  sentence starters for discussion, offering extension activities for advanced
  learners, visual aids for visual learners).

Ensure the activities are engaging, logically sequenced, and directly support the
learning objectives within the specified duration.

### LESSON PLAN DRAFT ###`,
  flow: [
    "Start the lesson plan request. Three inputs arrive: topic, grade and duration; the learning objectives; and the desired teaching approaches (optional).",
    "The instruction asks for the plan sections.",
    "Refine or state the learning objectives.",
    "List the required materials and resources.",
    "Outline the lesson activities in sequence: design the introduction or hook, then the main instruction and activities (incorporating the approaches), then the conclusion or wrap-up.",
    "Suggest the assessment methods (formative and summative) and the differentiation strategies.",
    "Assemble and format the output as a structured lesson plan draft.",
  ],
  flowNote: "The flowchart outlines the structured generation process, moving from the inputs through each required section of a standard lesson plan.",
  refinement: [
    "Provide few-shot examples of specific activity types if the generated activities are too generic, for example a creative hook or a well-described group task.",
    "Add constraints on specific curriculum standards that must be addressed.",
    "Request alignment with specific pedagogical theories, for example activities that follow constructivist learning principles.",
    "Prompt for alternative activities for different learning styles.",
  ],
  application: [
    "The teacher reviews the draft, editing and customizing activities, materials and timings for their own students and classroom.",
    "Use the generated assessment ideas to create actual quizzes, exit tickets or observation checklists.",
    "Extract the materials list for preparation.",
    "Share the refined plans within a department or professional learning community.",
  ],
  integration: [
    "Connect the prompt through an API to a learning management system or curriculum database to pull topic context or standards automatically.",
    "Build an interface where teachers can easily enter parameters (topic, grade, objectives) and receive draft plans.",
    "Use prompts to generate the supplementary materials named in the plan, for example draft worksheet questions and discussion prompts.",
  ],
  tryThis: "Fill in the lesson parameters for a lesson you would really teach, and ask the system to suggest the objectives instead of providing them.",
};

export const BLUEPRINTS_1_LESSONS: LessonContent[] = [
  {
    slug: "starting-with-sound-structures",
    title: "Starting with sound structures: how to use a blueprint",
    minutes: 7,
    covers: ["appB-intro"],
    body: `Welcome to the prompt engineer's workshop. Appendix B of the book is your collection of essential blueprints: meticulously designed starting points for common yet crucial prompt engineering tasks. Like an experienced architect providing foundational plans for various structures, these templates offer reliable frameworks built on the core principles of the whole course: the five pillars, foundational and advanced techniques, structural integrity, security awareness and ethical consideration.

They are not rigid formulas but adaptable designs. Their true power appears when you, the prompt engineer, apply your understanding and skill to customize them. Analyze their structure and notice how each pillar shows up:

- **Context** sets the stage.
- **Instructions** provide precise control.
- **Examples** demonstrate the desired craft (the recipe card approach).
- **Constraints** act as necessary guardrails.
- **Delimiters** ensure structural clarity (the semantic fences).

## Four steps to use a blueprint

Use these blueprints as springboards:

1. **Select** the template that best matches your objective.
2. **Understand** its design logic and the core concepts it employs.
3. **Customize** it thoughtfully: replace the placeholders, refine the instructions to match your specific goal, tailor the context and craft high-quality ("gold star") examples if needed.
4. **Test and iterate** relentlessly (the watchmaker's patience): analyze the results and make targeted adjustments until the prompt performs reliably and remarkably.

The library provides the starting schemas. Your skill in adaptation and refinement brings them to life.

## How each blueprint is laid out

All fifteen blueprints in the book follow the same pattern, and so do the lessons of the three workshops:

1. **The scenario, with a detailed explanation:** the domain, the situation, the goal, the objective, the techniques used with their justification, and what the prompt intends to achieve.
2. **The Markdown prompt blueprint:** the actual prompt, ready to copy and adapt.
3. **The flowchart:** the logic of the prompt as a diagram. In this School each flowchart is given as numbered steps in reading order.
4. **Suggested next steps:** prompt refinement, output application and integration (advanced).

Reading the explanation before you copy the prompt is the habit that turns a template into a tool: you learn why every block is there, so you know what you may safely change.

## What the three workshops hold

- **Workshop 1:** a perfume launch analysis, warehouse dispatch planning, shift-based production material flow, banking customer analysis under strict ethical rules, and an educational lesson plan.
- **Workshop 2:** retail replenishment and shelf allocation, a pharmaceutical market analysis, call center quality assurance, personal finance guidance for an authenticated user, and an interactive to-do list.
- **Workshop 3:** a language learning center, laboratory sample tracking, fitness client assessment, investigative journalism assistance, scientific paper writing, and the closing on turning blueprints into bespoke tools.

**Try this:** choose the blueprint closest to a task you do every week and note which part of it you would have to change first.`,
  },
  {
    slug: "blueprint-1-perfume-launch-analysis",
    title: "Blueprint 1: sales and marketing analysis (perfume launch)",
    minutes: 10,
    covers: ["appB-bp01-explained", "appB-bp01-prompt", "appB-bp01-flowchart", "appB-bp01-next-steps"],
    body: blueprintBody(PERFUME),
  },
  {
    slug: "blueprint-2-warehouse-dispatch-planning",
    title: "Blueprint 2: warehouse inventory and dispatch planning",
    minutes: 11,
    covers: ["appB-bp02-explained", "appB-bp02-prompt", "appB-bp02-flowchart", "appB-bp02-next-steps"],
    body: blueprintBody(WAREHOUSE),
  },
  {
    slug: "blueprint-3-production-material-flow",
    title: "Blueprint 3: production material flow planning (shift-based)",
    minutes: 11,
    covers: ["appB-bp03-explained", "appB-bp03-prompt", "appB-bp03-flowchart", "appB-bp03-next-steps"],
    body: blueprintBody(PRODUCTION),
  },
  {
    slug: "blueprint-4-banking-customer-analysis",
    title: "Blueprint 4: banking customer analysis and service personalization",
    minutes: 12,
    covers: ["appB-bp04-explained", "appB-bp04-prompt", "appB-bp04-flowchart", "appB-bp04-next-steps"],
    body: blueprintBody(BANKING),
  },
  {
    slug: "blueprint-5-educational-lesson-plan",
    title: "Blueprint 5: educational lesson plan generation",
    minutes: 11,
    covers: ["appB-bp05-explained", "appB-bp05-prompt", "appB-bp05-flowchart", "appB-bp05-next-steps"],
    body: blueprintBody(LESSON_PLAN),
  },
];

export const BLUEPRINTS_1_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "blueprints-are-designs",
    kind: "choice",
    title: "A blueprint is a design, not a formula",
    promptText: "How does the book say the blueprints should be used?",
    public: {
      options: [
        "Paste them unchanged and trust the result",
        "As starting designs: understand the logic, customize the placeholders and instructions, then test and iterate",
        "Only in the domain each one names",
        "Only by prompt engineers who write code",
      ],
    },
    answer: { correct: 1 },
    explanation: "The blueprints are adaptable designs. Their power appears when you understand their structure, customize them for your goal and refine them through testing.",
  },
  {
    slug: "order-using-a-blueprint",
    kind: "order",
    title: "Four steps to use a blueprint",
    promptText: "Put the four steps of using a blueprint in the order the book gives.",
    public: {
      blocks: [
        { id: "customize", text: "Customize it: replace placeholders, refine instructions, tailor context, craft gold star examples" },
        { id: "test", text: "Test and iterate, analyzing results and making targeted adjustments" },
        { id: "select", text: "Select the template that best matches your objective" },
        { id: "understand", text: "Understand its design logic and the core concepts it employs" },
      ],
    },
    answer: { order: ["select", "understand", "customize", "test"] },
    explanation: "Select, understand, customize, then test and iterate. Understanding comes before customizing, because you cannot safely change what you do not understand.",
  },
  {
    slug: "perfume-techniques",
    kind: "fill",
    title: "The techniques inside the perfume blueprint",
    promptText: "Match each part of the perfume blueprint with the technique it uses.",
    public: {
      template:
        "Three numbered steps for market, competitors and communication: {{a}}\nUse your most current data or simulate accessing market reports: {{b}}\nHeadings for each of the three analysis parts: {{c}}",
      blanks: [
        { id: "a", choices: ["Decomposition and sequential processing", "Retrieval principle and simulated tool use", "Structured output", "Few-shot examples"] },
        { id: "b", choices: ["Decomposition and sequential processing", "Retrieval principle and simulated tool use", "Structured output", "Few-shot examples"] },
        { id: "c", choices: ["Decomposition and sequential processing", "Retrieval principle and simulated tool use", "Structured output", "Few-shot examples"] },
      ],
    },
    answer: { correct: { a: "Decomposition and sequential processing", b: "Retrieval principle and simulated tool use", c: "Structured output" } },
    explanation: "Numbered steps break the request down, the data instruction acknowledges the dependency on external data (real tool calls would replace it), and Markdown headings give the report its structure.",
  },
  {
    slug: "warehouse-grounding",
    kind: "choice",
    title: "What the dispatch plan rests on",
    promptText: "In the warehouse blueprint, what must the plan and calculations be based on?",
    public: {
      options: [
        "The model's general knowledge of typical stock levels",
        "Only the provided inventory and store request data, without inventing stock or assuming availability",
        "The stores' past complaints",
        "Whatever quantity each store asks for",
      ],
    },
    answer: { correct: 1 },
    explanation: "The process is grounded only in the provided data. The prompt says to base calculations strictly on it, so the system does not invent stock.",
  },
  {
    slug: "order-shift-logic",
    kind: "order",
    title: "The shift by shift logic",
    promptText: "Put the steps of the production material flow blueprint in order for the first shift and the handover to the next.",
    public: {
      blocks: [
        { id: "compare", text: "Compare Shift 1 needs with current inventory, list the transfers and flag any shortage" },
        { id: "repeat", text: "Repeat for Shift 2 against the projected inventory after Shift 1" },
        { id: "needs", text: "Calculate the total raw material Shift 1 needs" },
        { id: "project", text: "Calculate the projected inventory after Shift 1" },
      ],
    },
    answer: { order: ["needs", "compare", "project", "repeat"] },
    explanation: "Each shift is compared with the inventory left by the previous one, so the projection after a shift has to be calculated before the next shift is planned.",
  },
  {
    slug: "spot-banking-ethics",
    kind: "spot",
    title: "Guidelines the banking blueprint must not break",
    promptText: "Select every instruction that breaks the ethical guidelines of the banking blueprint.",
    public: {
      pickPrompt: "Select every instruction that breaks the ethical guidelines",
      hitLabel: "Breaks the guidelines",
      missLabel: "Allowed",
      segments: [
        { id: "s1", text: "Use the customer's inferred ethnicity to choose the product category." },
        { id: "s2", text: "Base every suggestion only on the anonymized financial data points of the segment." },
        { id: "s3", text: "Suggest a high-interest loan to a segment showing financial distress, without framing it as consolidation." },
        { id: "s4", text: "Use the customer's marital status to guess a life stage." },
        { id: "s5", text: "Suggest categories for outreach and information, not credit decisions." },
      ],
    },
    answer: { flawed: ["s1", "s3", "s4"] },
    explanation: "The prompt is blind to protected characteristics such as ethnicity and marital status, avoids predatory products for segments in distress, and uses only financial behavior. Suggesting categories for outreach is exactly its purpose.",
  },
  {
    slug: "banking-purpose",
    kind: "choice",
    title: "What the banking analysis is not for",
    promptText: "The banking blueprint states its purpose limitation. What is the analysis NOT for?",
    public: {
      options: [
        "Identifying possible interest in mortgage information",
        "Suggesting categories for personalized outreach",
        "Credit scoring or approval decisions",
        "Helping relationship managers prepare conversations",
      ],
    },
    answer: { correct: 2 },
    explanation: "The analysis suggests categories for outreach and information. It is not for credit scoring or approval, and any real integration needs human review before customer contact.",
  },
  {
    slug: "lesson-plan-parts",
    kind: "fill",
    title: "Parts of the lesson plan blueprint",
    promptText: "Match each part of the lesson plan to what it contains.",
    public: {
      template:
        "Introduction or hook: {{a}}\nAssessment methods: {{b}}\nDifferentiation: {{c}}",
      blanks: [
        { id: "a", choices: ["Capture interest and connect to prior knowledge", "Ways to check understanding, formative and summative", "Strategies for diverse learners such as sentence starters", "A list of worksheets and a video link"] },
        { id: "b", choices: ["Capture interest and connect to prior knowledge", "Ways to check understanding, formative and summative", "Strategies for diverse learners such as sentence starters", "A list of worksheets and a video link"] },
        { id: "c", choices: ["Capture interest and connect to prior knowledge", "Ways to check understanding, formative and summative", "Strategies for diverse learners such as sentence starters", "A list of worksheets and a video link"] },
      ],
    },
    answer: { correct: { a: "Capture interest and connect to prior knowledge", b: "Ways to check understanding, formative and summative", c: "Strategies for diverse learners such as sentence starters" } },
    explanation: "The hook opens the lesson, assessment checks understanding during or at the end of the lesson, and differentiation supports diverse learners. The materials list is a separate section.",
  },
  {
    slug: "perfume-real-integration",
    kind: "choice",
    title: "Simulated lookup versus real tools",
    promptText: "In the perfume blueprint, what would a true tool-using system do instead of the instruction to simulate a lookup?",
    public: {
      options: [
        "Remove the market analysis step",
        "Make actual API calls to demographic databases, market research firms or social media analytics tools",
        "Ask the user to type the data by hand every time",
        "Switch to a longer prompt with more adjectives",
      ],
    },
    answer: { correct: 1 },
    explanation: "The simulated lookup only guides the system toward the type of data needed. In a real tool-using system it would trigger actual calls, for example to demographic databases or market research firms.",
  },
  {
    slug: "repair-dispatch-request",
    kind: "repair",
    title: "Turn a vague request into a dispatch blueprint",
    promptText: "Rewrite this request in the shape of the warehouse blueprint: a role, the data as context, sequential instructions, two lists as output, and a rule to use only the provided data.",
    public: {
      starter: "Tell me what to send to the stores today.",
      hint: "Give the system a role, paste the inventory and the requests, say to process the stores in order and update stock, ask for a dispatch list and a shortage list, and forbid inventing stock.",
    },
    answer: {
      criteria: [
        { id: "role", label: "Gives a role", weight: 1, anyOf: ["\\b(you are|role)\\b"], hint: "Start with a role, for example: You are an AI warehouse dispatch planner." },
        { id: "context", label: "Supplies the inventory and store requests as context", weight: 2, anyOf: ["\\b(inventory|stock)\\b[\\s\\S]*\\b(requests?|orders?)\\b", "\\b(requests?|orders?)\\b[\\s\\S]*\\b(inventory|stock)\\b"], hint: "Provide the current inventory and the store requests inside the prompt." },
        { id: "sequence", label: "Says to process stores sequentially and update the stock", weight: 2, anyOf: ["\\b(sequential\\w*|in order|one by one|then store|store a,? then)\\b", "\\bupdate\\b[\\s\\S]*\\b(stock|inventory)\\b"], hint: "Say to process the stores in order and update the available stock after each allocation." },
        { id: "lists", label: "Asks for a dispatch plan and a shortage report", weight: 2, anyOf: ["\\bdispatch (plan|list)\\b[\\s\\S]*\\bshortage\\b", "\\bshortage\\b[\\s\\S]*\\bdispatch (plan|list)\\b"], hint: "Ask for two lists: a dispatch plan and a shortage report." },
        { id: "grounding", label: "Restricts the answer to the provided data", weight: 2, anyOf: ["\\b(only|strictly|solely)\\b[\\s\\S]*\\b(provided|given|data)\\b", "\\bdo not invent\\b", "\\bnot (invent|assume)\\b"], hint: "Add a constraint: base everything only on the provided data and do not invent stock." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Warehouse Dispatch Planner.\nCurrent inventory: SKU-101: 50 units, SKU-102: 25 units.\nToday's store requests: Store A: SKU-101 20, SKU-102 15. Store B: SKU-101 35.\n\n### INSTRUCTION ###\nProcess the requests sequentially, Store A then Store B, and update the available stock after each allocation. Produce two lists: a Dispatch Plan with what CAN be sent to each store, and a Shortage Report with the requested amount and the shortfall for what cannot.\n\n### CONSTRAINTS ###\nBase all calculations strictly on the provided data. Do not invent stock. Use headings and bullet points, and be precise with quantities.",
    },
    explanation: "The blueprint works because the system gets the state of the world (inventory and requests), a defined sequence, two actionable outputs for two teams, and a grounding rule that prevents invented stock.",
    samples: {
      good: [
        "You are a dispatch planner. Inventory: SKU-1 has 40 units. Requests: Store A wants 30, Store B wants 20. Go through the stores in order, update the stock, and give me a dispatch plan and a shortage report. Use only the data above and do not invent stock.",
      ],
      bad: ["Tell me what to send to the stores today, be smart about it.", "Plan the dispatch and make it efficient."],
    },
  },
];

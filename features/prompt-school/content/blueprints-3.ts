/**
 * Chapter "Blueprint Workshop 3" (book Appendix B, the template library, blueprints 11 to 15, and the closing "From
 * Blueprints to Bespoke Tools"): 6 lessons and 10 exercises, written from the Director's book, which is the only source.
 * Every blueprint keeps the book's four parts (scenario and explanation, the Markdown prompt, the flowchart, the next
 * steps). No em dashes (writing rule, PDL-057). `samples` on repair exercises exist only for the content test.
 */
import type { ExerciseWithSamples, LessonContent } from "./five-pillars";
import { blueprintBody, type Blueprint } from "./blueprint-lesson";

const LANGUAGE_CENTER: Blueprint = {
  domain: "Education, administration, customer relationship management (CRM)",
  scenario:
    "A language learning center offers courses in several languages (for example English, German and Bosnian) at different proficiency levels (A1, A2, B1, B2, C1, C2). It needs a way to query its program information and (permissioned) student registration data in natural language, to find class schedules quickly, check student progress or identify the students who are eligible for the next course level.",
  goal: "Generate informative summaries and lists from queries about course schedules, program structure and student registration or progress data, ensuring data privacy and giving accurate information derived solely from the provided context.",
  objective:
    "Help administrators and advisors with a natural language interface to structured program and student data, so quick lookups do not need complex database queries. Crucially, access to student data requires strict permissioning or anonymization and adherence to privacy regulations.",
  techniques: [
    ["Context setting (pillar 1)", "Needs well-structured context: the program information (languages offered, proficiency levels such as CEFR A1 to C2, the course structure per level, and the current class schedules with language, level, days and times, and instructor); the student registration data, anonymized or permissioned (a table with student identifiers, enrolled language, current level, completed levels, possibly the last assessment score and the payment status as categories like Paid or Pending, with real names and sensitive details beyond what the query needs excluded or masked); the administrator's query; and a privacy constraint: handle student data carefully and reveal nothing sensitive beyond what the query legitimately requires."],
    ["Structured input data", "Both the program information and the student data must come in a clear, consistent format (tables, tagged lists, JSON) so the system can parse them reliably."],
    ["Instructions and intent recognition (pillar 2, tool-using controller simulation)", "The system must understand the query intent (find the schedule for German B1, list students who completed English A2, check the payment status for a student ID), identify which data is needed (program information, student data or both), filter and retrieve the requested information from the provided context only, and format the response clearly as a list or a summary sentence."],
    ["Retrieval principle", "All answers MUST be grounded strictly in the provided program information and student registration data."],
    ["Structured output", "Tables and bullet points present schedules and lists of students or courses clearly."],
    ["Constraints (pillar 4)", "Besides privacy, constraints can specify date ranges for schedules or filter students by completion dates."],
  ],
  intended:
    "Give language center staff a quick, efficient way to reach key operational information in natural language, improving administrative efficiency and responsiveness while strictly maintaining data privacy.",
  prompt: `### CONTEXT ###
Role: You are an AI Administrative Assistant for the 'LinguaPro' Language Learning
Center.
Goal: Answer administrative queries accurately based ONLY on the provided Program
Information and Student Registration Data below. Adhere strictly to data privacy
principles.

**Program Information (LinguaPro):**
* **Languages Offered:** English, German, Bosnian
* **Levels:** CEFR A1, A2, B1, B2, C1 (C2 by special arrangement)
* **Course Structure:** Each level typically 12 weeks, 2 sessions/week. Covers
  Grammar, Vocab, Speaking, Listening.
* **Current Schedule (Example Snippets):**
  * English B1: Mon & Wed 18:00-19:30, Instructor: J. Smith
  * German A2: Tue & Thu 19:00-20:30, Instructor: H. Muller
  * Bosnian A1 (Beginner): Sat 10:00-13:00, Instructor: A. Petrovic
  * ... (More schedule details) ...

**Student Registration Data (Anonymized/Permissioned Summary):**
(Example using Markdown Table - Use secure, minimal data)
<student_data>
| Student ID | Enrolled Language | Current Level | Completed Levels | Payment Status | Last Assessment Score (%) |
| :--------- | :---------------- | :------------ | :--------------- | :------------- | :------------------------ |
| STU-001    | English           | B1            | A1, A2           | Paid           | 88 (A2 Exam)              |
| STU-002    | German            | A2            | A1               | Paid           | 92 (A1 Exam)              |
| STU-003    | English           | A2            | A1               | Pending        | 75 (A1 Exam)              |
| STU-004    | Bosnian           | A1            | None             | Paid           | N/A                       |
| STU-005    | German            | B1            | A1, A2           | Paid           | 85 (A2 Exam)              |
</student_data>

**Admin User Query:**
<admin_query>
[Administrator types their natural language query here, e.g., "What times does the
German A2 course run?", "List students who completed English A2 and are eligible for
B1", "What's the payment status for STU-003?"]
</admin_query>

**PRIVACY & ACCURACY CONSTRAINT:** Answer only what is asked, using only the data
provided above. Do not reveal student names (use IDs). Do not provide information not
present in the context. Be precise and factual.

### INSTRUCTION ###
1. **Analyze Query:** Determine the administrator's specific information need from
   <admin_query>.
2. **Locate Data:** Identify whether the query relates to Program Information, Student
   Registration Data, or both.
3. **Retrieve & Filter:** Extract the specific information requested from the relevant
   context data provided above. Filter based on criteria in the query (e.g., specific
   language, level, student ID, completion status).
4. **Format Response:** Present the answer clearly and concisely. Use lists or tables if
   appropriate for schedules or student lists. If information is not found, state that
   clearly.
5. **Adhere to Constraints:** Strictly follow the Privacy & Accuracy constraint.

### ADMINISTRATIVE RESPONSE ###`,
  flow: [
    "Start when an admin query is received. Four inputs arrive: the program information, the student registration data (anonymized or permissioned), the privacy and accuracy constraints, and the admin's query.",
    "Analyze the query intent. Three branches follow.",
    "Intent query program information: search the program data. If found, format the response (for example a schedule). If not found, state that the program information is not available.",
    "Intent query student data: apply the privacy filter and search the student data. If the information is found and permissible, format the response (for example a list of IDs or a status). If it is not found or is restricted, state that the student information is not available or restricted.",
    "Intent ambiguous or other: ask for clarification or state the limitation.",
    "Every branch ends by providing the response.",
  ],
  flowNote: "The flowchart shows how the query intent directs the system to search either the program or the student data, with a crucial privacy filter applied before student information is accessed or revealed.",
  refinement: [
    "Add few-shot examples showing how to format complex schedule queries or student eligibility lists correctly.",
    "Include instructions for more complex queries with several criteria, for example list German B1 students who are marked Paid.",
    "Refine the error handling for queries about non-existent students, courses or levels.",
    "Add the capability to suggest the next course level from the completion and assessment scores, with clear justifications.",
  ],
  application: [
    "Administrators, advisors or teachers (with the appropriate access level) use it directly for quick information retrieval.",
    "It can generate lists for course registration planning or follow-ups, for example contacting students whose payment is Pending.",
    "It helps answer student inquiries that arrive through other channels quickly.",
  ],
  integrationTitle: "Integration (advanced and sensitive)",
  integration: [
    "Critical: it requires a secure integration with the center's real student information system and course management system through APIs. Data retrieval MUST be strictly permissioned by the logged-in admin's role.",
    "Implement robust anonymization or role-based access control before the data even reaches the prompt context layer.",
    "Updates through natural language (for example marking a student's payment as Paid) would need API calls that write back to the system, and need extremely careful validation and security.",
    "Integrate with communication tools to draft emails (reminders for pending payments, invitations to the next level), always requiring human review before sending.",
  ],
  tryThis: "Write three administrator queries: one about the program, one about a student and one that is ambiguous, and say which branch of the flow each one takes.",
};

const LAB: Blueprint = {
  domain: "Laboratory management, quality control, food safety, diagnostics",
  scenario:
    "A food testing laboratory processes many samples every day. Each sample goes through several analytical tests and stages (Received, Prepping, Testing, Analyzing Results, Reporting). The lab needs an efficient way to query the status of specific samples or batches, to find the samples that need urgent attention (nearing a deadline, critical results pending) and to generate summary reports.",
  goal: "Generate accurate status reports for specific samples, or summaries of samples by criteria (stage, test type, urgency), derived strictly from the provided excerpts of the laboratory information system (LIMS).",
  objective:
    "Help lab technicians, managers and possibly clients (with appropriate access) with a natural language interface to complex sample tracking data, improving visibility and workflow management.",
  techniques: [
    ["Context setting (pillar 1)", "Needs structured context, typically an excerpt from the LIMS: the sample data (sample ID, client name or code, product type, date received, current stage, tests assigned such as microbiology, chemical residue or allergen, urgency flag Y or N, expected report date); optionally test definitions that explain common test codes; the user's query; and a data confidentiality constraint: reveal only what the query needs and keep client and sample confidentiality as appropriate."],
    ["Structured input data", "The LIMS excerpt must be in a clear, parseable format such as a Markdown table or tagged blocks."],
    ["Instructions and intent recognition (pillar 2, tool-using controller simulation)", "Parse the user's query to understand the intent (status of a specific sample ID, list the samples at the Testing stage, find urgent samples, identify the tests assigned to a batch), filter the provided sample data by the query criteria, extract the relevant details for the identified samples and generate a response in the requested format (specific status details, a list, a summary count)."],
    ["Retrieval principle", "All responses MUST be strictly grounded in the provided sample data excerpt. The system must not infer statuses or test results that are not in the context."],
    ["Structured output", "Tables or consistent lists make it easy to compare the status of several samples."],
    ["Constraints (pillar 4)", "Besides confidentiality, constraints can cover date ranges or specific test types to include or exclude. The system must say clearly if a sample ID is not found in the provided data."],
  ],
  intended:
    "Quick, accurate answers to common questions about sample status and lab workflow, reducing manual LIMS searches, improving communication and helping to prioritize tasks by urgency or stage.",
  prompt: `### CONTEXT ###
Role: You are an AI Laboratory Information Assistant.
Goal: Provide status updates and summaries regarding food sample analysis based only
on the LIMS data excerpt provided below. Maintain confidentiality.

**LIMS Data Excerpt (Today: 2024-10-27):**
<lims_data>
| Sample ID | Client Code | Product Type   | Received   | Stage    | Tests Assigned              | Urgent | Report Due |
| :-------- | :---------- | :------------- | :--------- | :------- | :-------------------------- | :----- | :--------- |
| FS-24-101 | ClientA     | Frozen Berries | 2024-10-25 | Prepping | Micro, Pesticide Residue    | N      | 2024-11-01 |
| FS-24-102 | ClientB     | Canned Tuna    | 2024-10-25 | Testing  | Heavy Metals, Histamine     | Y      | 2024-10-29 |
| FS-24-103 | ClientA     | Apple Juice    | 2024-10-26 | Received | Micro, Patulin              | N      | 2024-11-02 |
| FS-24-104 | ClientC     | Ground Beef    | 2024-10-26 | Testing  | E.coli O157, Salmonella     | Y      | 2024-10-30 |
| FS-24-105 | ClientB     | Canned Tuna    | 2024-10-26 | Prepping | Heavy Metals, Histamine     | N      | 2024-11-02 |
</lims_data>

**User Query:**
<user_query>
[User asks their question here, e.g., "What is the status of sample FS-24-102?", "List
all urgent samples currently in Testing stage", "Which tests are assigned to ClientA's
samples?"]
</user_query>

**Data Confidentiality Constraint:** Provide only the information requested based on the
query and the data above. Do not reveal client codes unnecessarily unless specifically
asked and relevant. Focus on Sample IDs and status.

### INSTRUCTION ###
1. **Analyze Query:** Determine the user's specific request (status lookup, filtering,
   summarization) from <user_query>.
2. **Filter & Retrieve:** Locate the relevant sample(s) and their data within <lims_data>
   based on the query criteria (Sample ID, Stage, Urgency, Client Code, etc.).
3. **Extract Information:** Pull the specific details requested (e.g., Stage, Tests
   Assigned, Report Due date) for the identified sample(s).
4. **Format Response:** Present the answer clearly.
   * For single sample status: State the Sample ID and the requested details (e.g.,
     "Sample FS-24-102 is currently in the 'Testing' stage. Tests assigned: Heavy Metals,
     Histamine. Urgent: Yes. Report Due: 2024-10-29.").
   * For lists: Use bullet points or a simple Markdown table to list the requested
     samples and their relevant details.
   * If no samples match the criteria, state "No samples found matching the specified
     criteria in the provided data."
5. **Adhere to Constraints:** Follow the Data Confidentiality Constraint. Base the
   response only on the provided <lims_data>.

### LABORATORY STATUS RESPONSE ###`,
  flow: [
    "Start the lab status query. Three inputs arrive: the LIMS data excerpt, the user query and the confidentiality constraint.",
    "Analyze the query intent. Three branches follow.",
    "Intent specific sample status: filter the LIMS data by sample ID. If the sample is found, extract the requested details (stage, tests, due date) and format a single sample status response. If it is not found, generate a Sample Not Found message.",
    "Intent list samples by criteria: filter the data by stage, urgency, client or other criteria. If samples are found, extract the details for each and format a list or table. If none match, generate a No Matching Samples message.",
    "Intent ambiguous or other: ask for clarification or state the limitation.",
    "Every branch ends by providing the response.",
  ],
  flowNote: "The flowchart shows the system parsing the query, then filtering the provided LIMS data either by a specific ID or by broader criteria, and formatting the output accordingly.",
  refinement: [
    "Add the capability to query by date ranges (received date, due date).",
    "Include instructions to calculate the turnaround time (current date minus received date) for samples in progress.",
    "Use few-shot examples if specific output formats, such as detailed tables with a specific column order, are required.",
    "Add logic to flag samples whose report due date is today or already passed, based on the current date provided or assumed.",
  ],
  application: [
    "Lab technicians and managers use it for quick status checks without navigating complex LIMS interfaces.",
    "It helps prioritize work by urgency or due dates.",
    "It can generate daily Work In Progress summary reports by stage or test type.",
    "With appropriate security, it could feed status updates to a client portal.",
  ],
  integration: [
    "Connect the prompt through a secure API directly to the LIMS database to query real-time data based on the parsed natural language query.",
    "Generate automated alerts from the prompt's analysis, for example alert the manager if an urgent sample's due date is tomorrow.",
    "Integrate with scheduling tools to plan resource allocation (instrument time, technician availability) for the samples in the Prepping or Testing stages.",
  ],
  tryThis: "Answer by hand from the table: which urgent samples are in the Testing stage, and what is the earliest report due date among them?",
};

const FITNESS: Blueprint = {
  domain: "Fitness, wellness, personal training, customer relationship management (CRM)",
  scenario:
    "A fitness center wants to give its clients personalized recommendations for training programs, classes or nutritional guidance, based on their stated goals, preferences and some basic fitness level indicators given at onboarding or consultation.",
  goal: "Analyze client profile information and generate tailored, suggested fitness program elements (types of workouts, class recommendations, general nutritional focus areas) that fit the goals and preferences, while emphasizing safety and avoiding prescriptive medical or dietary advice.",
  objective:
    "Help fitness trainers and membership advisors quickly produce personalized starting-point recommendations, so the service feels more tailored and clients can navigate the center's offerings by their individual needs. This is NOT about creating automated workout plans. It is about suggesting types of activities and focus areas.",
  techniques: [
    ["Context setting (pillar 1)", "Needs clear context about both the client and the center's offerings. The client profile: stated goals (weight loss, muscle gain, better cardio, stress relief), fitness level (beginner, intermediate, advanced, self-reported or assessed), preferred activities (group classes, weightlifting, outdoor activities), time availability (days, times, desired frequency) and any stated limitations or dislikes (a dislike of running, a knee issue, described non-medically). The fitness center offerings: the class types (yoga, HIIT, spin, strength), the personal training focus areas and the nutritional guidance topics available. An optional user query, and the safety and scope constraints (critical): avoid medical advice, diagnosing conditions, prescribing specific diets or guaranteeing results, stress that the suggestions are general recommendations and advise professional consultation."],
    ["Structured input data", "Both the client profile and the center's offerings should be presented clearly, as lists or tagged data."],
    ["Instructions and logic (pillar 2, chain of thought simulation)", "Analyze the client profile (goals, level, preferences, availability), match those factors to the relevant offerings (a weight loss goal plus a beginner plus enjoying groups suggests a beginner HIIT class, introductory strength training and general nutrition tips), generate suggestions for 2 to 3 relevant activity types or classes, suggest 1 to 2 general nutritional focus areas and filter everything through the safety and scope constraints."],
    ["Retrieval principle", "Recommendations MUST be grounded in the provided client profile and match the available offerings."],
    ["Structured output", "Clear sections for Workout Suggestions, Class Recommendations and Nutritional Focus make the advice easy to understand."],
    ["Persona (pillar 1)", "A Helpful Fitness Advisor: encouraging and knowledgeable about general fitness, but cautious and non-prescriptive."],
  ],
  intended:
    "Give fitness center staff AI-generated, personalized recommendation drafts that guide conversations with clients, suggest relevant services and create a more tailored member experience, while strictly respecting the safety and scope limits.",
  prompt: `### CONTEXT ###
Role: You are an AI Fitness Advisor assistant for 'Pulse Fitness Center'.
Goal: Generate personalized suggestions for fitness activities and general nutritional
focus areas for a client based only on their provided profile and our center's
offerings. This is informational guidance, NOT a prescribed workout plan, medical
advice, or specific diet plan.

**Client Profile:**
<client_profile>
* **Client ID:** [e.g., CL-456]
* **Stated Goals:** [e.g., "Lose weight (approx. 10kg)", "Feel stronger and have more
  energy"]
* **Fitness Level (Self-Reported):** [e.g., Beginner, hasn't exercised regularly in years]
* **Preferred Activities:** [e.g., "Prefers structured classes over gym floor", "Enjoys
  music and group energy"]
* **Time Availability:** [e.g., "Evenings after 6 PM weekdays, Saturday mornings"]
* **Limitations/Dislikes:** [e.g., "Dislikes running due to past shin splints", "Not
  interested in heavy weightlifting initially"]
</client_profile>

**Pulse Fitness Center Offerings (Examples):**
* **Classes:** Beginner Yoga, Power Yoga, HIIT Blast (High Intensity), CycleFit
  (Spinning), Strength Circuit, Zumba Dance.
* **Training:** Personal Training (Weight Loss Focus, Strength Building, General
  Fitness), Small Group Training.
* **Nutrition:** General Healthy Eating Workshops, Hydration Seminars, Basic
  Macronutrient Guidance sessions (informational only).

**SAFETY & SCOPE CONSTRAINTS (CRITICAL):**
1. **No Medical Advice:** DO NOT diagnose conditions or suggest exercises for specific
   injuries (like knee issues). Recommend consulting a doctor or physiotherapist for
   injuries.
2. **No Specific Diets:** DO NOT prescribe meal plans or specific calorie counts. Only
   suggest general nutritional focus areas (e.g., importance of protein, hydration
   basics).
3. **General Suggestions Only:** Frame all output as suggestions or ideas to explore
   with a trainer or on their own. Use cautious language ("You might enjoy...",
   "Consider exploring...", "A possible focus could be...").
4. **Disclaimer Required:** MUST include a disclaimer advising the client to consult
   with fitness professionals and healthcare providers before starting any new program
   or making significant dietary changes.

### INSTRUCTION ###
1. **Analyze Profile:** Review the <client_profile> focusing on goals, level,
   preferences, and availability.
2. **Match Offerings:** Identify 2-3 class types or training approaches from the 'Pulse
   Fitness Center Offerings' that align well with the client's profile.
3. **Suggest Nutritional Focus:** Identify 1-2 general nutritional topics from the
   offerings relevant to the client's goals (e.g., weight loss goals might link to
   healthy eating workshops or hydration).
4. **Filter & Phrase Carefully:** Ensure all suggestions adhere strictly to the Safety &
   Scope Constraints. Use encouraging but non-prescriptive language.
5. **Include Disclaimer:** Add the mandatory disclaimer at the end.

**Output Format:**
Present the suggestions clearly under headings: "Potential Class/Activity
Suggestions", "General Nutritional Focus Ideas", and "Important Disclaimer".

### PERSONALIZED FITNESS SUGGESTIONS ###`,
  flow: [
    "Start the client needs assessment request. Three inputs arrive: the client profile (goals, level, preferences), the fitness center offerings and the CRITICAL safety and scope constraints.",
    "Analyze the profile against the offerings.",
    "Identify the relevant activity types or classes, and the relevant general nutrition topics.",
    "Filter the activities and the nutrition topics against the constraints and safety rules.",
    "Select 2 to 3 compliant activity suggestions and 1 to 2 compliant nutrition focus suggestions.",
    "Format the response, add the MANDATORY disclaimer, generate the personalized suggestions report and hand it to the advisor or client.",
  ],
  flowNote: "The flowchart shows the matching of client needs to offerings, followed by the critical filtering step based on safety and scope constraints before the final output is formatted with a disclaimer.",
  refinement: [
    "Add few-shot examples showing how to phrase suggestions non-prescriptively for different client profiles (beginner versus advanced, different goals).",
    "Incorporate the client's past attendance data, if available and permissioned, to suggest classes they might like based on earlier enjoyment.",
    "Refine the instructions to generate suggested weekly schedules from availability, for example 2 to 3 classes a week that fit evening and weekend availability.",
    "Add the ability to ask clarifying questions if the client profile is incomplete.",
  ],
  application: [
    "Fitness advisors use it during onboarding consultations to give initial, personalized guidance.",
    "It can generate content for personalized emails or app messages that suggest relevant classes or workshops to existing members.",
    "It helps trainers quickly understand a new client's starting point and preferences.",
    "Crucially, it is always presented as suggestions that need further discussion with a qualified professional.",
  ],
  integration: [
    "Connect the prompt through a secure API to the center's membership database or CRM to pull client profile data, with permissions.",
    "Link the generated class suggestions directly to the class booking system in the center's app or website.",
    "Use feedback, for example which suggested classes the client actually attends, to refine the recommendation logic over time (potentially informing later RLHF cycles if applicable).",
  ],
  tryThis: "Write a client profile with a limitation such as a knee issue, and check that your prompt sends it to a professional instead of advising on it.",
};

const JOURNALISM: Blueprint = {
  domain: "Journalism, investigation, research, information analysis",
  scenario:
    "An investigative journalist is working on a complex story about potential corporate misconduct. They have gathered a large volume of documents (internal emails that were leaked, public filings, news articles, witness testimonies) and need help triaging the information, identifying key entities, finding connections, summarizing complex documents and flagging possible inconsistencies or areas for further investigation.",
  goal: "Use AI as an assistant to process and analyze large volumes of text-based evidence, helping the journalist find key information, potential leads and inconsistencies more efficiently, while keeping journalistic standards of verification and objectivity. The AI assists the analysis. It does not replace fact-checking or source validation.",
  objective:
    "Use the text processing capability of AI to speed up the first stages of investigative research: finding relevant information in large document sets, structuring complex data, summarizing lengthy texts and highlighting areas for deeper human investigation.",
  techniques: [
    ["Context setting (pillar 1)", "Crucial, and it often involves a lot of text: the document corpus (the specific documents or relevant excerpts, if context limits apply, such as emails, reports and articles) as retrieval context; the investigation focus (for example potential conflicts of interest involving Company X and Politician Y, or environmental regulation violations by Factory Z); the specific task (entity extraction, timeline creation, inconsistency flagging); and a journalistic standards constraint: objectivity, sourcing claims within the provided text, no speculation."],
    ["Retrieval principle (essential)", "All analysis MUST be strictly grounded in the provided document corpus. The AI acts on the evidence given, not on outside knowledge."],
    ["Decomposition and specific instructions (pillar 2, chain of thought)", "Investigative work is broken into tasks. Entity extraction: identify all mentions of people, organizations and locations relevant to the focus. Timeline creation: extract all dated events about a topic and list them chronologically. Relationship mapping: identify stated connections or interactions between Person A and Company B in these emails. Inconsistency flagging: review two witness statements and identify specific points where their accounts of the same event directly contradict each other, based only on the text (this needs careful prompting). Summarization: summarize a 10 page regulatory filing, focusing on the sections about compliance violations."],
    ["Structured output", "Lists of entities, chronological timelines, tables that compare statements and tagged summaries make complex information manageable and useful."],
    ["Constraints (pillar 4)", "Reinforce objectivity, sourcing within the text and no speculation or jumping to conclusions. Specify the output format and the level of detail."],
    ["Few-shot examples (optional)", "Useful to demonstrate specific formats for timelines, entity lists or inconsistency reports."],
  ],
  intended:
    "A tireless research assistant that processes large volumes of text faster than a human can, extracts key facts, structures information and highlights potential leads or discrepancies that deserve the journalist's expert attention, verification and deeper investigation.",
  prompt: `### CONTEXT ###
Role: You are an AI Investigative Assistant specialized in analyzing textual evidence.
Goal: Analyze a set of provided email excerpts to identify key individuals/organizations
mentioned and any stated interactions between them related to "Project Aquila".

**Investigation Focus:** Potential undisclosed communications regarding environmental
impact waivers for "Project Aquila".

**Document Corpus (Email Excerpts):**
(Provide excerpts using clear delimiters. Ensure sensitive info is handled appropriately
according to source/legality)
<email id="E001" date="2023-05-10" from="john.doe@companyX.com" to="jane.roe@regulator.gov">
Subject: Project Aquila - Update
...discussed the preliminary environmental report with Sarah Chen from EnviroConsult
Ltd yesterday. She raised concerns about water table impact... Need to schedule a
follow-up with Director Miller at the Agency...
</email>
<email id="E002" date="2023-05-12" from="jane.roe@regulator.gov" to="director.miller@regulator.gov">
Subject: FW: Project Aquila - Update
John Doe (Company X) reached out. EnviroConsult (Sarah Chen) flagged potential water
table issues based on their report. Suggest we meet before approving the waiver...
</email>
<email id="E003" date="2023-05-15" from="john.doe@companyX.com" to="internal.team@companyX.com">
Subject: Aquila Strategy
Met with regulator contact. Consultant concerns were discussed. Need to prepare
mitigation plan before the Miller meeting... Assign Bob Lee to draft initial response.
</email>
(Add more relevant email excerpts)

**Journalistic Standards Constraint:** Base analysis strictly on the text provided.
Identify stated connections only. Do not infer relationships or motives not explicitly
mentioned. Remain neutral and objective.

### INSTRUCTION ###
Analyze the provided email excerpts related to "Project Aquila". Generate a report with
two sections:

**1. Key Entities Mentioned:**
- List all unique individuals (with affiliations if mentioned) and organizations
  identified in the emails related to this project. Format as a bulleted list.

**2. Stated Interactions/Connections:**
- List any direct communications or meetings explicitly stated in the emails between the
  identified entities regarding Project Aquila. Describe the interaction briefly (e.g.,
  "Email from X to Y discussing Z," "Meeting mentioned between X and Y regarding
  report"). Format as a bulleted list.

Present the output clearly under Markdown headings.

### EMAIL ANALYSIS REPORT (Project Aquila) ###`,
  flow: [
    "Start the email analysis request. Three inputs arrive: the email excerpts corpus, the investigation focus (Project Aquila) and the journalistic standards constraint.",
    "The instruction: identify entities and interactions.",
    "Process each email excerpt in turn.",
    "Identify the mentions of individuals and organizations and add the unique entities to the list.",
    "Identify the stated communications or meetings between entities about Project Aquila and add each stated interaction to the list.",
    "Check whether all excerpts are finished. If not, return to the next excerpt. If yes, format the output report.",
    "Generate the structured report: entities and interactions.",
  ],
  flowNote: "The flowchart depicts iterating through documents, extracting specific types of information (entities and interactions) as instructed, and compiling structured lists.",
  refinement: [
    "Develop prompts for timeline creation from the dates extracted from documents.",
    "Create prompts designed to compare statements across different documents or testimonies and flag inconsistencies (this needs careful instructions on what counts as a contradiction).",
    "Use few-shot examples to show how to handle ambiguous references or complex relationship descriptions.",
    "Tell the system to extract specific claims related to the investigation focus and to find the sentences that offer potential support within the same document (a basic textual proximity check, not validation).",
  ],
  application: [
    "Entity and interaction lists help the journalist visualize the network of involved parties.",
    "Timelines give chronological structure to complex events.",
    "Inconsistency reports highlight areas that need direct follow-up interviews or further fact-checking.",
    "Summaries of long documents accelerate the review.",
    "Crucially, every AI output serves as a lead or an organizational aid. The journalist must independently verify facts, validate sources, conduct interviews and perform critical analysis.",
  ],
  integrationTitle: "Integration (advanced and sensitive)",
  integration: [
    "Use specialized investigative software that incorporates AI tools for processing large document dumps securely.",
    "Develop secure, private systems in which journalists can upload document sets and run customized analysis prompts through an API. Data security and source protection are paramount.",
    "Explore using prompts to generate initial hypotheses or questions for further investigation from the analyzed data, always subject to human journalistic judgment.",
  ],
  tryThis: "Take three short texts of your own and write the prompt that lists only the connections the texts state, with a rule against inferring motives.",
};

const PAPER_WRITING: Blueprint = {
  domain: "Academia, scientific research, scholarly writing",
  scenario:
    "A researcher is drafting a scientific paper (biology, computer science, social sciences and so on) and needs help at several stages of writing: summarizing background literature, drafting sections from provided data or notes, refining language for clarity and conciseness, and checking for consistency, while ensuring accuracy and academic integrity.",
  goal: "Use AI as a writing assistant to help structure the paper, summarize relevant literature, draft sections from provided results or outlines, improve the clarity and conciseness of the language and perform consistency checks, under the close supervision and critical revision of the human researcher. The AI assists the drafting. It does not perform the research or guarantee originality or validity.",
  objective:
    "Use the language capabilities of AI to speed up the laborious process of scientific writing, helping researchers organize their thoughts, draft standard sections, refine prose and check internal consistency, so they can focus on the scientific content, the interpretation and the argument.",
  techniques: [
    ["Context setting (pillar 1)", "Depends heavily on the task: research data or notes (for Results or Methods sections, the summarized data, analysis outputs or detailed methodological notes); literature excerpts (for Introduction or Background sections, key papers or abstracts to summarize and synthesize); a section outline (a bullet-point outline for the section the AI should draft); the target journal style (optional, it can guide formatting and stylistic conventions such as reference style and heading requirements, though specific formatting often needs human editing or dedicated tools); and an academic integrity constraint (avoid plagiarism, cite sources conceptually by referring to the provided context, keep a formal, objective, scientific tone)."],
    ["Retrieval principle (crucial)", "Drafting sections such as Introduction, Methods or Results must be grounded in the provided literature excerpts or data and notes. Summaries must reflect the sources accurately."],
    ["Specific instructions and decomposition (pillar 2, chain of thought)", "Different prompts for different writing tasks. Literature summary: summarize the key findings on a topic from the provided abstracts. Drafting the Methods section: from detailed experimental notes, write a draft describing the procedure sequentially in the standard scientific past tense. Drafting the Results section: from a summary data table and a figure description, describe the main findings objectively and refer to Table 1 or Figure 1 as appropriate. Language refinement: rewrite a paragraph to be more concise and clear, in formal scientific language, avoiding the passive voice where possible. Consistency check: read the Methods and Results sections and identify apparent inconsistencies in terminology, units or reported values between them."],
    ["Structured output", "Useful for outlines, structured summaries or lists of points. For draft sections, standard paragraph output is usually wanted."],
    ["Constraints (pillar 4)", "Objectivity, accuracy based only on the provided data or literature, a formal tone, conciseness, and strict avoidance of plagiarism or unsupported claims."],
    ["Few-shot examples (optional)", "Help to demonstrate a specific desired writing style (concise and direct versus more narrative) or a particular way of describing results linked to data."],
  ],
  intended:
    "A sophisticated writing assistant that helps overcome writer's block, structures information logically, summarizes background material efficiently and refines language, accelerating manuscript preparation, while the critical scientific thinking, the interpretation, the validation and the final authorship stay firmly in the hands of the human researcher.",
  prompt: `### CONTEXT ###
Role: You are an AI Scientific Writing Assistant.
Goal: Draft key discussion points for a research paper based on provided Introduction
context and Results summary. Focus on interpreting the results in light of the initial
questions/hypotheses.

**Research Paper Context:**
* **Topic:** Impact of novel fertilizer 'GrowFast-X' on crop yield in nutrient-poor soil.
* **Introduction Summary (Provided):** The study aimed to determine if GrowFast-X
  significantly increases wheat yield compared to standard fertilizer and untreated
  controls in nutrient-poor conditions, hypothesizing a >15% yield increase.
* **Results Summary (Provided):** GrowFast-X group showed a mean yield increase of 25%
  (p<0.01) compared to control, and 18% (p<0.05) compared to standard fertilizer. No
  significant difference in plant height was observed. Soil nutrient analysis
  post-harvest showed slightly elevated nitrogen levels in the GrowFast-X plots.

**Academic Integrity Constraint:** Base discussion points strictly on the provided
Introduction and Results summaries. Do not introduce external information or make
claims not supported by this context. Maintain an objective, analytical tone
appropriate for a scientific discussion section. Avoid definitive causal claims unless
explicitly supported.

### INSTRUCTION ###
Generate a draft outline (using bullet points) for the **Discussion** section of this
research paper. Focus on interpreting the results in the context of the initial
hypothesis and suggesting implications or next steps. Create points covering:
1. **Restatement & Support for Hypothesis:** Briefly restate the main finding regarding
   yield and explicitly state whether it supports the initial hypothesis (>15% increase).
2. **Comparison to Standard:** Discuss the finding comparing GrowFast-X to the standard
   fertilizer.
3. **Interpretation of Secondary Findings:** Briefly interpret the non-significant height
   difference and the elevated nitrogen levels - what might these suggest?
4. **Potential Limitations/Caveats (Based only on context):** Mention any limitations
   implicitly suggested by the provided info (e.g., study only on wheat, single soil type
   implicitly). Do NOT invent limitations.
5. **Implications / Future Directions:** Suggest 1-2 potential implications of the
   findings or logical next steps for research based on the results.

**Output Format:**
Use Markdown bullet points for each discussion point. Keep points concise and focused.

### DRAFT DISCUSSION POINTS OUTLINE ###`,
  flow: [
    "Start the request for draft discussion points. Four inputs arrive: the research topic, the introduction summary (the hypothesis), the results summary (the findings) and the academic integrity constraints.",
    "The instruction: generate discussion points in five steps.",
    "Step 1, compare the main finding with the hypothesis: draft a point that says whether the hypothesis is supported.",
    "Step 2, analyze the comparison to the standard: draft a point on the significance against the standard fertilizer.",
    "Step 3, interpret the secondary findings: draft a point on the implications of the height and nitrogen results.",
    "Step 4, identify the limitations implied in the context: draft a point that acknowledges the scope and limitations of the study.",
    "Step 5, suggest implications and future work: draft a point on next steps and applications. Then assemble and format the bulleted discussion outline.",
  ],
  flowNote: "The flowchart shows the system using different pieces of the provided context (introduction, results) to generate distinct components of the Discussion outline, following the instructed steps.",
  refinement: [
    "Develop separate, specialized prompts for each major paper section (Abstract, Introduction, Methods, Results, Discussion), with highly tailored instructions and context requirements.",
    "Use few-shot examples to demonstrate a specific citation style (APA, MLA) when summarizing literature, or a specific way of phrasing statistical results.",
    "Tell the system to check for specific elements of reporting guidelines (for example CONSORT for clinical trials, PRISMA for systematic reviews) based on provided checklists.",
    "Prompt for rephrasing awkward sentences or improving the flow between paragraphs.",
  ],
  application: [
    "The researcher uses the generated draft outline or section text as a starting point, reviewing it critically, editing it, adding nuanced interpretation, ensuring scientific accuracy and citing all sources properly.",
    "Use language refinement prompts to polish drafts the researcher wrote, for clarity and conciseness.",
    "Use consistency-checking prompts as a final proofreading aid before submission.",
    "Crucially, the AI output is assistance, never the final product. The researcher keeps full responsibility for the content, the originality and the validity of the work. Plagiarism checks on AI-generated text are essential.",
  ],
  integration: [
    "Integrate the prompt templates into writing software or research management tools (such as Zotero or Mendeley).",
    "Develop secure systems in which researchers can provide manuscript drafts and run analysis prompts through an API, keeping confidentiality.",
    "Potentially connect to citation databases (through tool use) to help find relevant papers for the Introduction, though verifying relevance remains key.",
  ],
  tryThis: "Write the Results summary of a small piece of work of your own, then ask for the Discussion points and check every point against your summary, deleting anything that is not in it.",
};

export const BLUEPRINTS_3_LESSONS: LessonContent[] = [
  {
    slug: "blueprint-11-language-learning-center",
    title: "Blueprint 11: language learning center program and student management",
    minutes: 12,
    covers: ["appB-bp11-explained", "appB-bp11-prompt", "appB-bp11-flowchart", "appB-bp11-next-steps"],
    body: blueprintBody(LANGUAGE_CENTER),
  },
  {
    slug: "blueprint-12-laboratory-sample-tracking",
    title: "Blueprint 12: laboratory sample analysis tracking and reporting",
    minutes: 11,
    covers: ["appB-bp12-explained", "appB-bp12-prompt", "appB-bp12-flowchart", "appB-bp12-next-steps"],
    body: blueprintBody(LAB),
  },
  {
    slug: "blueprint-13-fitness-client-assessment",
    title: "Blueprint 13: fitness center client needs assessment",
    minutes: 12,
    covers: ["appB-bp13-explained", "appB-bp13-prompt", "appB-bp13-flowchart", "appB-bp13-next-steps"],
    body: blueprintBody(FITNESS),
  },
  {
    slug: "blueprint-14-investigative-journalism-assistance",
    title: "Blueprint 14: investigative journalism assistance",
    minutes: 12,
    covers: ["appB-bp14-explained", "appB-bp14-prompt", "appB-bp14-flowchart", "appB-bp14-next-steps"],
    body: blueprintBody(JOURNALISM),
  },
  {
    slug: "blueprint-15-scientific-paper-writing",
    title: "Blueprint 15: scientific research paper writing assistance",
    minutes: 12,
    covers: ["appB-bp15-explained", "appB-bp15-prompt", "appB-bp15-flowchart", "appB-bp15-next-steps"],
    body: blueprintBody(PAPER_WRITING),
  },
  {
    slug: "from-blueprints-to-bespoke-tools",
    title: "From blueprints to bespoke tools",
    minutes: 6,
    covers: ["appB-closing"],
    body: `The fifteen blueprints of the template library offer a substantial starting point: structured frameworks designed to accelerate your work across diverse domains, from the analytical precision required in finance and science to the creative demands of marketing and the operational logic of logistics. They embody the principles of the whole course, integrating context, clear instructions, the power of demonstration, necessary constraints and structural delimiters.

The book makes one point again, drawing on decades of work with complex systems: these blueprints are foundations, not finished structures. Like an architect's standard plan, they provide a sound basis, but true effectiveness emerges only when they are adapted to the specific "site conditions": your unique goals, your specific input data, the nuances of the computational system you are using and the critical requirements of your task.

Consider them sophisticated starting kits in your prompt engineering workshop. The real craft lies in what you do next.

## Four practices that turn a blueprint into your own tool

- **Customization.** Do not just fill in the blanks. Critically assess whether the instructions need tweaking, whether the constraints are appropriate, whether the persona fits and whether the output structure needs modification for your precise needs.
- **Contextualization.** Make sure the context you provide, whether source documents for retrieval, data for analysis or examples for few-shot learning, is accurate, relevant and well formatted. The quality of the input profoundly influences the quality of the output.
- **Refinement (the watchmaker's patience).** Embrace the iterative cycle. Test your customized prompt rigorously and analyze its performance: where does it excel, where does it falter? Make targeted adjustments, informed by the five pillars and the troubleshooting techniques, and test again. This patient refinement is non-negotiable for building reliable and remarkable prompts.
- **Ethical scrutiny (the lens grinder's test).** Especially for templates that deal with sensitive domains such as finance, medicine, HR and journalism, constantly apply the ethical lens. Are you inadvertently introducing bias? Are the safety and privacy constraints robust enough?

## What the fifteen blueprints share

Look back across the workshops and you will see the same skeleton every time: a role, a goal, the data as context, a numbered instruction, an output format with headings, and a grounding rule that keeps the system to the provided data. In the sensitive blueprints (banking, pharmaceuticals, personal finance, fitness, journalism, scientific writing) you also saw an explicit ethical or safety block, a disclaimer where advice could be mistaken for professional advice, and a human who reviews before anything happens. Those repeated features are the real lesson. The domains change, the skeleton stays.

## Closing

This library provides schematic diagrams for powerful prompt mechanisms. By applying your own critical thinking, your domain knowledge and the iterative refinement process, you transform these blueprints into bespoke tools tailored precisely to your purpose. The journey from understanding the principles to mastering their application involves persistent practice and thoughtful adaptation. May these blueprints serve you well as you continue to hone your craft as an effective and responsible prompt engineer.

**Try this:** pick one blueprint, customize it for a real task of yours, run it three times with different data and write down one change you made after each run.`,
  },
];

export const BLUEPRINTS_3_EXERCISES: ExerciseWithSamples[] = [
  {
    slug: "student-ids-not-names",
    kind: "choice",
    title: "How student data is referred to",
    promptText: "In the language center blueprint, how must the system refer to students, and what must it never do?",
    public: {
      options: [
        "By full name, adding any detail that might be useful",
        "By student ID, and it must not reveal names or information that is not in the provided context",
        "By nickname, guessing details from the payment status",
        "By ID only when the administrator asks twice",
      ],
    },
    answer: { correct: 1 },
    explanation: "The privacy and accuracy constraint says to answer only what is asked, only from the provided data, and not to reveal student names (use IDs).",
  },
  {
    slug: "language-center-branches",
    kind: "fill",
    title: "Where each query goes",
    promptText: "Match each kind of query in the language center flow to what the system does.",
    public: {
      template:
        "A question about a class schedule: {{a}}\nA question about a student's payment status: {{b}}\nA vague question that names no course or student: {{c}}",
      blanks: [
        { id: "a", choices: ["Search the program information and format the schedule", "Apply the privacy filter, then search the student data", "Ask for clarification or state the limitation", "Refuse because schedules are private"] },
        { id: "b", choices: ["Search the program information and format the schedule", "Apply the privacy filter, then search the student data", "Ask for clarification or state the limitation", "Refuse because schedules are private"] },
        { id: "c", choices: ["Search the program information and format the schedule", "Apply the privacy filter, then search the student data", "Ask for clarification or state the limitation", "Refuse because schedules are private"] },
      ],
    },
    answer: { correct: { a: "Search the program information and format the schedule", b: "Apply the privacy filter, then search the student data", c: "Ask for clarification or state the limitation" } },
    explanation: "The intent decides the branch. Program questions search the program data, student questions pass through the privacy filter first, and ambiguous ones get a clarifying question.",
  },
  {
    slug: "order-lims-response",
    kind: "order",
    title: "How the LIMS assistant answers",
    promptText: "Put the steps of the laboratory blueprint in order, from query to reply.",
    public: {
      blocks: [
        { id: "format", text: "Format the response as a single sample status, a list or a table" },
        { id: "extract", text: "Extract the details requested, such as stage, tests assigned and report due date" },
        { id: "analyze", text: "Analyze the query to see whether it asks for a status lookup, a filter or a summary" },
        { id: "filter", text: "Filter the LIMS data by sample ID, stage, urgency or client" },
      ],
    },
    answer: { order: ["analyze", "filter", "extract", "format"] },
    explanation: "The assistant first understands the request, then filters only the provided data, extracts what was asked and formats it. If nothing matches, it says so in the provided wording.",
  },
  {
    slug: "spot-fitness-limits",
    kind: "spot",
    title: "Lines the fitness advisor must not write",
    promptText: "Select every line that breaks the safety and scope constraints of the fitness blueprint.",
    public: {
      pickPrompt: "Select every line that breaks the constraints",
      hitLabel: "Breaks the constraints",
      missLabel: "Acceptable",
      segments: [
        { id: "z1", text: "Your knee pain looks like a meniscus problem, so do these three rehabilitation exercises." },
        { id: "z2", text: "You might enjoy a Beginner Yoga class on Saturday mornings." },
        { id: "z3", text: "Eat exactly 1,200 calories a day and you will lose 10 kg in two months." },
        { id: "z4", text: "A possible nutritional focus could be hydration basics. Please check with a doctor or fitness professional before starting a new program." },
        { id: "z5", text: "We guarantee this plan will make you stronger." },
      ],
    },
    answer: { flawed: ["z1", "z3", "z5"] },
    explanation: "The blueprint forbids diagnosing conditions or advising on injuries, prescribing calorie counts and guaranteeing results. Cautious suggestions from the center's offerings, with the disclaimer, are what it asks for.",
  },
  {
    slug: "fitness-purpose",
    kind: "choice",
    title: "What the fitness blueprint is really for",
    promptText: "According to the fitness blueprint, what is its output?",
    public: {
      options: [
        "An automated, prescribed workout and diet plan",
        "A medical assessment of the client's condition",
        "Suggestions of activity types and general focus areas that a trainer then discusses with the client",
        "A guarantee of results within a set time",
      ],
    },
    answer: { correct: 2 },
    explanation: "The blueprint is not about automated workout plans. It suggests types of activities and focus areas, framed as ideas to explore with a qualified professional.",
  },
  {
    slug: "journalism-stated-only",
    kind: "choice",
    title: "Only what the emails state",
    promptText: "In the investigative journalism blueprint, which output is acceptable for the Stated Interactions section?",
    public: {
      options: [
        "John Doe secretly bribed the regulator to approve the waiver",
        "Email E002 from Jane Roe to Director Miller reports that John Doe of Company X reached out about Project Aquila",
        "It is likely that Sarah Chen was pressured to hide the water table risk",
        "Director Miller probably intends to approve the waiver",
      ],
    },
    answer: { correct: 1 },
    explanation: "The standards constraint says to identify stated connections only and not to infer relationships or motives. Describing a communication that the email actually states is acceptable, guesses about motives are not.",
  },
  {
    slug: "journalism-task-types",
    kind: "fill",
    title: "The investigative tasks",
    promptText: "Match each request to the investigative task it represents.",
    public: {
      template:
        "Extract all dated events about the waiver and list them in order: {{a}}\nIdentify all people, organizations and locations in these documents: {{b}}\nFind the points where two witnesses directly contradict each other: {{c}}",
      blanks: [
        { id: "a", choices: ["Timeline creation", "Entity extraction", "Inconsistency flagging", "Summarization"] },
        { id: "b", choices: ["Timeline creation", "Entity extraction", "Inconsistency flagging", "Summarization"] },
        { id: "c", choices: ["Timeline creation", "Entity extraction", "Inconsistency flagging", "Summarization"] },
      ],
    },
    answer: { correct: { a: "Timeline creation", b: "Entity extraction", c: "Inconsistency flagging" } },
    explanation: "Dated events in order make a timeline, names of people and organizations are entity extraction, and directly contradicting accounts are inconsistencies. All of them stay grounded in the provided text, and the journalist verifies every result.",
  },
  {
    slug: "spot-paper-integrity",
    kind: "spot",
    title: "Breaking the academic integrity constraint",
    promptText: "Select every instruction that would break the academic integrity constraint of the scientific writing blueprint.",
    public: {
      pickPrompt: "Select every instruction that breaks the constraint",
      hitLabel: "Breaks the constraint",
      missLabel: "Keeps the constraint",
      segments: [
        { id: "w1", text: "Strengthen the discussion with three published studies that are not in the provided summaries." },
        { id: "w2", text: "State whether the 25% yield increase supports the hypothesis of more than 15%." },
        { id: "w3", text: "Invent limitations that make the study sound more careful." },
        { id: "w4", text: "Say that GrowFast-X definitely causes the higher nitrogen levels." },
        { id: "w5", text: "Mention only the limitations implied by the provided information, such as a single crop." },
      ],
    },
    answer: { flawed: ["w1", "w3", "w4"] },
    explanation: "The constraint says to base the points strictly on the provided introduction and results, not to invent limitations and not to make definitive causal claims. Restating a finding against the hypothesis and naming implied limitations are allowed.",
  },
  {
    slug: "four-practices",
    kind: "fill",
    title: "Turning a blueprint into a bespoke tool",
    promptText: "Match each of the book's four practices to what it asks of you.",
    public: {
      template:
        "Customization: {{a}}\nContextualization: {{b}}\nRefinement (the watchmaker's patience): {{c}}\nEthical scrutiny (the lens grinder's test): {{d}}",
      blanks: [
        { id: "a", choices: ["Assess whether the instructions, constraints, persona and output structure fit your needs", "Make sure source documents, data and examples are accurate, relevant and well formatted", "Test, analyze and adjust in cycles", "Check for bias and for robust safety and privacy constraints"] },
        { id: "b", choices: ["Assess whether the instructions, constraints, persona and output structure fit your needs", "Make sure source documents, data and examples are accurate, relevant and well formatted", "Test, analyze and adjust in cycles", "Check for bias and for robust safety and privacy constraints"] },
        { id: "c", choices: ["Assess whether the instructions, constraints, persona and output structure fit your needs", "Make sure source documents, data and examples are accurate, relevant and well formatted", "Test, analyze and adjust in cycles", "Check for bias and for robust safety and privacy constraints"] },
        { id: "d", choices: ["Assess whether the instructions, constraints, persona and output structure fit your needs", "Make sure source documents, data and examples are accurate, relevant and well formatted", "Test, analyze and adjust in cycles", "Check for bias and for robust safety and privacy constraints"] },
      ],
    },
    answer: { correct: { a: "Assess whether the instructions, constraints, persona and output structure fit your needs", b: "Make sure source documents, data and examples are accurate, relevant and well formatted", c: "Test, analyze and adjust in cycles", d: "Check for bias and for robust safety and privacy constraints" } },
    explanation: "Customization changes the design to your goal, contextualization feeds it good input, refinement tests it patiently and ethical scrutiny keeps sensitive domains safe and fair.",
  },
  {
    slug: "repair-discussion-prompt",
    kind: "repair",
    title: "Turn a vague request into a scientific writing prompt",
    promptText: "Rewrite this request in the shape of the scientific writing blueprint: a role, the provided context, an integrity constraint, a numbered instruction and an output format.",
    public: {
      starter: "Write the discussion of my paper.",
      hint: "Give a role, provide the hypothesis and results summaries, forbid outside information and invented limitations, list what the discussion must cover, and ask for concise bullet points.",
    },
    answer: {
      criteria: [
        { id: "role", label: "Gives a role", weight: 1, anyOf: ["\\b(you are|role)\\b"], hint: "Start with a role, for example: You are an AI scientific writing assistant." },
        { id: "context", label: "Provides the hypothesis and the results as context", weight: 2, anyOf: ["\\bhypothes\\w+\\b[\\s\\S]*\\bresults?\\b", "\\bresults?\\b[\\s\\S]*\\bhypothes\\w+\\b"], hint: "Include a summary of the introduction hypothesis and of the results." },
        { id: "integrity", label: "Restricts the draft to the provided context and forbids invention", weight: 3, anyOf: ["\\b(only|strictly|solely)\\b[\\s\\S]*\\b(provided|given|context|summar\\w+)\\b", "\\bdo not (introduce|invent|add)\\b", "\\bno external\\b"], hint: "Add an integrity rule: base the points strictly on the provided summaries and do not introduce external information or invent limitations." },
        { id: "instruction", label: "Lists what the discussion must cover", weight: 2, anyOf: ["\\b(limitations?|implications?|future)\\b", "\\bsupport\\w*\\b[\\s\\S]*\\bhypothes\\w+\\b"], hint: "Name what to cover, such as support for the hypothesis, limitations and implications." },
        { id: "format", label: "Asks for a concise output format", weight: 1, anyOf: ["\\b(bullet|outline|concise|headings?)\\b"], hint: "Ask for concise bullet points or an outline." },
      ],
      model:
        "### CONTEXT ###\nRole: You are an AI Scientific Writing Assistant.\nIntroduction summary: the study tested whether the new fertilizer raises wheat yield by more than 15%, the hypothesis.\nResults summary: yield rose 25% against the control and 18% against the standard fertilizer, with no difference in plant height.\n\n### CONSTRAINT ###\nBase the discussion strictly on the provided summaries. Do not introduce external information, do not invent limitations and avoid definitive causal claims.\n\n### INSTRUCTION ###\nDraft a Discussion outline that: 1. states whether the results support the hypothesis, 2. compares the finding to the standard fertilizer, 3. notes only the limitations implied by the context, 4. suggests one implication or next step.\n\n### OUTPUT FORMAT ###\nConcise Markdown bullet points.",
    },
    explanation: "The blueprint turns 'write my discussion' into a bounded task: the researcher supplies the evidence, the integrity rule keeps the draft inside it and the structure makes every point checkable. The researcher stays responsible for the final text.",
    samples: {
      good: [
        "You are a scientific writing assistant. Hypothesis: the treatment raises yield by more than 15%. Results: yield rose 20%, and height did not change. Use only this information and do not invent limitations or add outside studies. Draft concise bullet points on whether the hypothesis is supported, the limitations implied and one next step.",
      ],
      bad: ["Write the discussion of my paper.", "You are a science writer. Write a strong discussion and add supporting studies from the literature."],
    },
  },
];

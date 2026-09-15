# CURRICULUM DRAFT — Vibe-Coding University (v3, 5 chapters/level)

**Status: DRAFT — awaiting Director review/correction (M-4).** Supersedes
the v2 draft (4 chapters/level, exactly 20 lessons/level) per Director's
2026-09-15 correction: the SPEC says **minimum** 20 lessons per level,
not exactly 20 — the number must be large enough to reach real
curriculum quality, not just clear the floor. Confirmed with Director:
5 chapters per level (~25 lessons/level), applied retroactively to
Beginner (already complete at the old 20) as well as Intermediate and
Expert.

**Confirmed 2026-09-15:** all core lessons and all quiz questions are
hand-authored by this assistant directly (not AI-generated) — zero
ongoing Gemini cost for the core curriculum. The weekly AI generation
cron (PLAN.md) continues to run, but everything it produces from now on
is **supplementary** content layered on top of the complete core, not
part of it — e.g. the already-generated "Agentic Coding Workflows"
lesson (PDL-033) is reclassified as a supplementary item, not core
lesson content, under this structure.

**Structure**: 5 chapters per level × 5 lessons per chapter = 25 lessons
per level × 3 levels = **75 core lessons**. Each chapter ends with a
5-question quiz (4/5 to pass) gating the next chapter. Each level ends
with a cumulative final test after all 5 chapters are cleared — the
test's own question count is independent of lesson count (graded by
percentage, not a fixed score), so it grows to stay representative as
chapters are added rather than being locked to an old total.

Chapter/lesson counts per chapter aren't hard-limited in the schema or
gating logic (`isChapterQuizAvailable` checks "all lessons in this
chapter complete," not a fixed count) — 5 lessons/chapter is a design
choice for a consistent rhythm, not a constraint. If a specific topic
genuinely needs more than 5 lessons to do it justice, that's a smaller,
local decision for that chapter when it's actually being written, not
something to resolve here in the outline.

## Beginner

**Chapter 1 — Foundations**
1. What Is Vibe-Coding? *(written, published)*
2. The Vibe-Coding Mindset: Judgment Over Typing *(written, published)*
3. A Short History: From Autocomplete to Agents *(written, published)*
4. Vibe-Coding vs. Traditional Programming: What Changes, What Doesn't *(written, published)*
5. Setting Realistic Expectations for AI-Assisted Development *(written, published)*

**Chapter 2 — Choosing and Setting Up Your Tools**
6. Choosing Your AI Coding Tool: IDEs, Agents, and No-Code *(written, published)*
7. Getting Started with an AI-Assisted IDE *(written, published)*
8. Getting Started with an Agentic Coding Tool *(written, published)*
9. Understanding Tool Tiers: Free, Pro, and Enterprise Limits *(written, published)*
10. Setting Up a Safe Practice Project *(written, published)*

**Chapter 3 — Working With Prompts**
11. Writing Effective Prompts for Code Generation *(written, published)*
12. Giving an AI Assistant the Right Context *(written, published)*
13. Iterating on a Prompt When the First Result Is Wrong *(written, published)*
14. Common Prompting Mistakes Beginners Make *(written, published)*
15. Prompting for Small Tasks vs. Large Features *(written, published)*

**Chapter 4 — Reading, Testing, and Trusting Output**
16. Reading AI-Generated Code Before You Accept It *(written, published)*
17. Basic Debugging with AI Assistance *(written, published)*
18. Spotting Common AI Mistakes in Generated Code *(written, published)*
19. Running and Testing What the AI Wrote *(written, published)*
20. When to Trust the AI and When to Slow Down *(written, published)*

**Chapter 5 — Building Your First Real Project** *(new, 2026-09-15 expansion)*
21. Planning a Small Project Before You Prompt
22. Structuring a Project So AI Tools Can Help Effectively
23. Working in Small, Reviewable Increments
24. Documenting What You Built (and Why)
25. Knowing When You're Done, and What to Learn Next

*Beginner level final test: 10 cumulative questions written and
passed live at the old 4-chapter total — needs 2-3 more questions
covering Chapter 5 once it's written, to stay genuinely cumulative.*

## Intermediate

**Chapter 1 — Agentic Workflows**
26. Agentic Coding Workflows: How They Actually Work
27. Multi-Step Tasks: Letting the Agent Plan
28. Giving an Agent Access to Your Codebase Safely
29. When to Use Agent Mode vs. Single Prompts
30. Recovering When an Agent Goes Off Track

**Chapter 2 — Context and Memory**
31. Context Management: What to Include and Why
32. Context Windows: Limits and Trade-offs
33. Working Across Multiple Files and a Large Codebase
34. Using Project Documentation to Guide the AI
35. Context Engineering: A Practical Introduction

**Chapter 3 — Quality and Process**
36. Code Review in an AI-Assisted Workflow
37. Testing Strategies for AI-Generated Code
38. Writing Tests the AI Can Use to Check Its Own Work
39. Version Control Habits for Vibe-Coding
40. Handling Security in AI-Generated Code

**Chapter 4 — Tools and Integration**
41. Working with MCP: What It Is and Why It Matters
42. Connecting an AI Assistant to External Tools
43. Automating Repetitive Tasks with AI Agents
44. Working with AI in a Team Setting
45. Choosing the Right Tool for the Right Job

**Chapter 5 — Working With Existing Codebases and Teams** *(new, 2026-09-15 expansion)*
46. Onboarding an AI Assistant to an Existing Codebase
47. Working Within Someone Else's Code Style and Conventions
48. AI-Assisted Code Review: Giving and Receiving
49. Collaborating on a Shared Codebase with AI Tools in the Mix
50. Handling Merge Conflicts and Multi-Person Changes

Note: an old supplementary (AI-generated, `is_core=false`) lesson
already exists at slug `agentic-coding-workflows` (PDL-033). Lesson 26
above ("Agentic Coding Workflows: How They Actually Work") needs a
distinct slug when written to avoid colliding with it.

## Expert

**Chapter 1 — Advanced Agentic Systems**
51. Building Multi-Agent Systems: An Overview
52. Orchestrating Agents for Complex Projects
53. Designing Guardrails for Autonomous Agents
54. Long-Running Agent Tasks and Monitoring
55. Failure Modes in Multi-Agent Systems

**Chapter 2 — Architecture and Decisions**
56. AI-Assisted Architecture Decisions
57. Knowing When NOT to Use AI for a Task
58. Designing Systems That Are Easy for AI to Extend
59. Technical Debt in AI-Generated Codebases
60. Refactoring AI-Generated Code at Scale

**Chapter 3 — Cost, Scale, and Operations**
61. Cost and Quota Management for AI-Powered Products
62. Rate Limits and Multi-Provider Strategies
63. Monitoring and Observability for AI-Assisted Systems
64. Scaling a Vibe-Coded Product Beyond a Prototype
65. Operational Discipline: Fail Loudly, Not Silently

**Chapter 4 — Evaluation and Leadership**
66. Evaluating and Comparing AI Coding Tools
67. Building an Evaluation Framework for Your Team
68. Mentoring Others in AI-Assisted Development
69. Contributing to AI-Assisted Development Practices
70. Where Vibe-Coding Is Headed Next

**Chapter 5 — Security, Risk, and Governance for AI-Assisted Development** *(new, 2026-09-15 expansion)*
71. Security Risks Specific to AI-Generated Code
72. Preventing Secret and Credential Leaks in AI Workflows
73. Auditing and Logging AI-Assisted Changes
74. Setting Organizational Policy for AI Tool Usage
75. Staying Current as the Field Moves Fast

## Authoring pace (honest, not a promise of "all at once")

75 lessons + 15 chapter quizzes (75 questions) + 3 level final tests is
real content-authoring volume — writing all of it in a single pass
would mean rushing quality on later chapters. Pace: engineering
(schema, chapter gating, quiz UI, gamification triggers) shipped first
since it's needed regardless of how much content exists. Beginner
Chapters 1-4 (20 lessons) and its level final test were written and
live-verified first; Chapter 5 (the 2026-09-15 expansion) is the
current in-progress wave. Intermediate and Expert follow in subsequent
waves, each independently reviewable — not one large unreviewed
content dump.

# CURRICULUM DRAFT — Vibe-Coding University (v2, chapters + core)

**Status: DRAFT — awaiting Director review/correction (M-4).** Supersedes
the original 15-lesson draft per the 2026-09-15 structural amendment to
`SPEC.md` (chapters, chapter quizzes, minimum 20 lessons/level, level
final test).

**Confirmed 2026-09-15:** all 60 core lessons and all quiz questions are
hand-authored by this assistant directly (not AI-generated) — zero
ongoing Gemini cost for the core curriculum. The weekly AI generation
cron (PLAN.md) continues to run, but everything it produces from now on
is **supplementary** content layered on top of the complete core, not
part of it — e.g. the already-generated "Agentic Coding Workflows"
lesson (PDL-033) is reclassified as the first supplementary item, not
core lesson content, once this structure ships.

**Structure**: 4 chapters per level × 5 lessons per chapter = 20 lessons
per level × 3 levels = **60 core lessons**. Each chapter ends with a
5-question quiz (4/5 to pass, confirmed 2026-09-15) gating the next
chapter. Each level ends with a cumulative final test after all 4
chapters are cleared.

## Beginner

**Chapter 1 — Foundations**
1. What Is Vibe-Coding? *(written, published)*
2. The Vibe-Coding Mindset: Judgment Over Typing
3. A Short History: From Autocomplete to Agents
4. Vibe-Coding vs. Traditional Programming: What Changes, What Doesn't
5. Setting Realistic Expectations for AI-Assisted Development

**Chapter 2 — Choosing and Setting Up Your Tools**
6. Choosing Your AI Coding Tool: IDEs, Agents, and No-Code
7. Getting Started with an AI-Assisted IDE
8. Getting Started with an Agentic Coding Tool
9. Understanding Tool Tiers: Free, Pro, and Enterprise Limits
10. Setting Up a Safe Practice Project

**Chapter 3 — Working With Prompts**
11. Writing Effective Prompts for Code Generation
12. Giving an AI Assistant the Right Context
13. Iterating on a Prompt When the First Result Is Wrong
14. Common Prompting Mistakes Beginners Make
15. Prompting for Small Tasks vs. Large Features

**Chapter 4 — Reading, Testing, and Trusting Output**
16. Reading AI-Generated Code Before You Accept It
17. Basic Debugging with AI Assistance
18. Spotting Common AI Mistakes in Generated Code
19. Running and Testing What the AI Wrote
20. When to Trust the AI and When to Slow Down

## Intermediate

**Chapter 1 — Agentic Workflows**
21. Agentic Coding Workflows: How They Actually Work
22. Multi-Step Tasks: Letting the Agent Plan
23. Giving an Agent Access to Your Codebase Safely
24. When to Use Agent Mode vs. Single Prompts
25. Recovering When an Agent Goes Off Track

**Chapter 2 — Context and Memory**
26. Context Management: What to Include and Why
27. Context Windows: Limits and Trade-offs
28. Working Across Multiple Files and a Large Codebase
29. Using Project Documentation to Guide the AI
30. Context Engineering: A Practical Introduction

**Chapter 3 — Quality and Process**
31. Code Review in an AI-Assisted Workflow
32. Testing Strategies for AI-Generated Code
33. Writing Tests the AI Can Use to Check Its Own Work
34. Version Control Habits for Vibe-Coding
35. Handling Security in AI-Generated Code

**Chapter 4 — Tools and Integration**
36. Working with MCP: What It Is and Why It Matters
37. Connecting an AI Assistant to External Tools
38. Automating Repetitive Tasks with AI Agents
39. Working with AI in a Team Setting
40. Choosing the Right Tool for the Right Job

## Expert

**Chapter 1 — Advanced Agentic Systems**
41. Building Multi-Agent Systems: An Overview
42. Orchestrating Agents for Complex Projects
43. Designing Guardrails for Autonomous Agents
44. Long-Running Agent Tasks and Monitoring
45. Failure Modes in Multi-Agent Systems

**Chapter 2 — Architecture and Decisions**
46. AI-Assisted Architecture Decisions
47. Knowing When NOT to Use AI for a Task
48. Designing Systems That Are Easy for AI to Extend
49. Technical Debt in AI-Generated Codebases
50. Refactoring AI-Generated Code at Scale

**Chapter 3 — Cost, Scale, and Operations**
51. Cost and Quota Management for AI-Powered Products
52. Rate Limits and Multi-Provider Strategies
53. Monitoring and Observability for AI-Assisted Systems
54. Scaling a Vibe-Coded Product Beyond a Prototype
55. Operational Discipline: Fail Loudly, Not Silently

**Chapter 4 — Evaluation and Leadership**
56. Evaluating and Comparing AI Coding Tools
57. Building an Evaluation Framework for Your Team
58. Mentoring Others in AI-Assisted Development
59. Contributing to AI-Assisted Development Practices
60. Where Vibe-Coding Is Headed Next

## Authoring pace (honest, not a promise of "all at once")

60 lessons + 12 chapter quizzes (60 questions) + 3 level final tests is
real content-authoring volume — writing all of it in a single pass
would mean rushing quality on later chapters. Pace: engineering
(schema, chapter gating, quiz UI, gamification triggers) ships first
since it's needed regardless of how much content exists; Chapter 1 of
Beginner ships fully written as the first real, reviewable sample;
remaining chapters follow in subsequent waves, each independently
reviewable — not one large unreviewed content dump.

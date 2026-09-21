/**
 * Prompt School rewards (PDL-072): the Prompt School routes pay their coins through the shared server-side helper in
 * features/rewards/learning.ts (also used by the University since PDL-075). Kept as a thin alias so the routes and the
 * tests keep their names.
 */
export { awardLearningStep as awardPromptSchool, type LearningReward as PromptSchoolReward } from "@/features/rewards/learning";

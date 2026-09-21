/**
 * The live sandbox's limits (PDL-077), in a file with no imports so the browser panel can use them without pulling the
 * task content (checklists included) into its bundle. Domain logic that needs them is in sandbox.ts.
 */

/** Three runs a day per learner (Director, 2026-09-21). */
export const SANDBOX_DAILY_CAP_PER_USER = 3;
/**
 * Every learner together. The free Gemini pool allows roughly 100 to 240 requests a day for everything (PDL-058), and the
 * Assistant already holds 30 of them, so the sandbox takes a small, fixed share and can never starve the Daily Report.
 */
export const SANDBOX_DAILY_GLOBAL_CAP = 30;
export const SANDBOX_MIN_PROMPT_CHARS = 10;
export const SANDBOX_MAX_PROMPT_CHARS = 1200;
export const SANDBOX_MAX_REPLY_CHARS = 2500;
/** Where the sample input goes when the learner writes this marker; without it the sample is appended. */
export const SANDBOX_INPUT_MARKER = "{{input}}";

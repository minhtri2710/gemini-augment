import {
  buildDoneCriteria,
  buildOutputContract,
  buildToolRules,
  buildVerification,
  buildWorkStyle,
} from "./prompt-leverage.js";
import type { AugmentContextPayload } from "./types.js";

export function buildRewriteSpec(context: AugmentContextPayload): string {
  return context.effectiveRewriteMode === "execution-contract"
    ? buildExecutionContractSpec(context)
    : buildPlainRewriteSpec(context);
}

function buildPlainRewriteSpec(context: AugmentContextPayload): string {
  return [
    "Rewrite the draft into a stronger prompt.",
    "Keep the rewrite concise, concrete, and faithful to the user's wording and scope.",
    "Do not over-specify a simple task. Keep the result proportional.",
    "Preserve the user's objective, constraints, tone, file paths, commands, APIs, and acceptance criteria.",
    "Treat recent conversation as optional grounding. Use it only when it sharpens the rewrite or resolves ambiguity.",
    "Do not add commentary about the rewrite.",
    "Return only the rewritten prompt.",
    "",
    "Work Style:",
    buildWorkStyle(context.intent, context.effortLevel),
    "",
    "Tool Rules:",
    buildToolRules(context.intent),
    "",
    "Output Contract:",
    buildOutputContract(context.intent),
    "",
    "Verification:",
    buildVerification(context.intent),
    "",
    "Done Criteria:",
    buildDoneCriteria(context.intent),
  ].join("\n");
}

function buildExecutionContractSpec(context: AugmentContextPayload): string {
  return [
    "Compile the draft into the smallest strong execution contract.",
    "Prefer compact natural sections or bullets over XML.",
    "Include only sections that materially improve execution quality.",
    "Preserve the user's objective, constraints, tone, file paths, commands, APIs, and acceptance criteria.",
    "Treat recent conversation as optional grounding. Use it only when it sharpens the rewrite or resolves ambiguity.",
    "Do not invent facts, hidden requirements, or speculative implementation details.",
    "Return only the rewritten prompt.",
    "",
    "Available sections:",
    "- Task: state the task and what success looks like.",
    "- Context: list sources, files, constraints, and unknowns.",
    "- Constraints: preserve behavior, avoid unnecessary scope, and note key limits.",
    "- Work Style: set depth, breadth, care, and first-principles expectations.",
    "- Tool Rules: state when inspection, evidence gathering, or validation is required.",
    "- Verification: require correctness checks, edge cases, and relevant validation.",
    "- Deliverable: define the expected final output.",
    "- Done Criteria: define when the agent should stop.",
    "",
    "Work Style:",
    buildWorkStyle(context.intent, context.effortLevel),
    "",
    "Tool Rules:",
    buildToolRules(context.intent),
    "",
    "Output Contract:",
    buildOutputContract(context.intent),
    "",
    "Verification:",
    buildVerification(context.intent),
    "",
    "Done Criteria:",
    buildDoneCriteria(context.intent),
  ].join("\n");
}

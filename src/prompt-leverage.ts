import type { AugmentTaskIntent } from "./types.js";

export type PromptLeverageIntensity = "Light" | "Standard" | "Deep";

// ---------------------------------------------------------------------------
// Intent guidance configuration
// ---------------------------------------------------------------------------
// Each intent maps to a single record containing all five guidance fields.
// Adding a new intent requires exactly one entry here instead of editing
// five switch statements.
// ---------------------------------------------------------------------------

interface IntentGuidance {
	toolRules: string;
	outputContract: string;
	workStyleLines: string[];
	verification: string;
	doneCriteria: string;
}

const CODE_INTENT_TOOL_RULES =
	"Inspect the relevant files and dependencies first. Validate the final change with the narrowest useful checks before broadening scope.";

const CODE_INTENT_OUTPUT_CONTRACT =
	"Return the result in a practical execution format: concise summary, concrete changes or code, validation notes, and any remaining risks.";

const CODE_INTENT_VERIFICATION =
	"Run relevant checks (tests, lint, typecheck) and verify the change does not break existing behavior.";

const CODE_INTENT_DONE_CRITERIA =
	"Stop only when the change is complete, tests pass, and there are no known regressions.";

const FALLBACK_TOOL_RULES =
	"Use tools or extra context only when they materially improve correctness or completeness.";

const FALLBACK_VERIFICATION =
	"Improve obvious weaknesses if a better approach is available within scope.";

const INTENT_GUIDANCE: Record<AugmentTaskIntent, IntentGuidance> = {
	implement: {
		toolRules: CODE_INTENT_TOOL_RULES,
		outputContract: CODE_INTENT_OUTPUT_CONTRACT,
		workStyleLines: [
			"Understand the problem broadly enough to avoid narrow mistakes, then go deep where the risk or complexity is highest.",
			"Use first-principles reasoning before proposing changes.",
		],
		verification: CODE_INTENT_VERIFICATION,
		doneCriteria: CODE_INTENT_DONE_CRITERIA,
	},
	debug: {
		toolRules: CODE_INTENT_TOOL_RULES,
		outputContract:
			"Return a diagnosis with root cause, the fix, validation steps, and regression notes.",
		workStyleLines: [
			"Inspect before editing. Reproduce or confirm the issue first.",
			"Use first-principles reasoning to find the root cause, not just the symptom.",
		],
		verification:
			"Confirm the root cause is addressed and add or update regression coverage when appropriate.",
		doneCriteria:
			"Stop only when the root cause is confirmed fixed and regression coverage is in place.",
	},
	refactor: {
		toolRules: CODE_INTENT_TOOL_RULES,
		outputContract: CODE_INTENT_OUTPUT_CONTRACT,
		workStyleLines: [
			"Preserve behavior. Improve structure without unnecessary API changes.",
			"Remove duplication or dead code when appropriate.",
		],
		verification: CODE_INTENT_VERIFICATION,
		doneCriteria: CODE_INTENT_DONE_CRITERIA,
	},
	review: {
		toolRules:
			"Read enough surrounding context to understand intent before critiquing. Distinguish confirmed issues from plausible risks.",
		outputContract:
			"Return findings grouped by severity or importance, explain why each matters, and suggest the smallest credible next step.",
		workStyleLines: [
			"Use fresh-eyes critique. Distinguish confirmed issues from plausible risks.",
			"Order findings by severity or impact.",
		],
		verification: "Avoid speculative redesign unless requested.",
		doneCriteria:
			"Stop only when findings are delivered with severity, reasoning, and next-step suggestions.",
	},
	research: {
		toolRules:
			"Retrieve evidence from reliable sources before concluding. Do not guess facts that can be checked.",
		outputContract:
			"Return a structured synthesis with key findings, supporting evidence, uncertainty where relevant, and a concise bottom line.",
		workStyleLines: [
			"Gather evidence broadly before narrowing. Cite sources when web research is involved.",
			"End with a recommended path.",
		],
		verification: FALLBACK_VERIFICATION,
		doneCriteria:
			"Stop only when the synthesis is grounded, uncertainties are flagged, and a recommended path is provided.",
	},
	docs: {
		toolRules:
			"Read the current documentation and runtime behavior before rewriting. Keep examples and commands accurate.",
		outputContract:
			"Return polished documentation aligned with current runtime behavior. Keep examples and commands accurate.",
		workStyleLines: [
			"Align documentation with current runtime behavior.",
			"Keep examples and commands accurate.",
		],
		verification: "Verify examples and commands still work.",
		doneCriteria:
			"Stop only when documentation matches current behavior and examples are verified.",
	},
	"test-fix": {
		toolRules: CODE_INTENT_TOOL_RULES,
		outputContract: CODE_INTENT_OUTPUT_CONTRACT,
		workStyleLines: [
			"Decide whether the bug or the test is wrong before fixing.",
			"Keep regression coverage close to the change.",
		],
		verification: CODE_INTENT_VERIFICATION,
		doneCriteria: CODE_INTENT_DONE_CRITERIA,
	},
	explain: {
		toolRules: FALLBACK_TOOL_RULES,
		outputContract:
			"Return a clear, well-structured explanation matched to the question, with no unnecessary verbosity.",
		workStyleLines: [
			"Keep it explanatory. Do not turn it into an execution plan unless asked.",
		],
		verification: FALLBACK_VERIFICATION,
		doneCriteria:
			"Stop only when the explanation clearly answers the question.",
	},
	general: {
		toolRules: FALLBACK_TOOL_RULES,
		outputContract:
			"Return a clear, well-structured response matched to the task, with no unnecessary verbosity.",
		workStyleLines: [
			"Understand the problem broadly enough to avoid narrow mistakes, then go deep where the risk or complexity is highest.",
		],
		verification: FALLBACK_VERIFICATION,
		doneCriteria:
			"Stop only when the response satisfies the task, matches the requested format, and passes the verification step.",
	},
};

// ---------------------------------------------------------------------------
// Effort-level inference
// ---------------------------------------------------------------------------

const DEEP_SIGNALS = [
	/\bcareful\b/,
	/\bdeep\b/,
	/\bthorough\b/,
	/\bhigh.?stakes?\b/,
	/\bproduction\b/,
	/\bcritical\b/,
	/\barchitecture\b/,
	/\bsecurity\b/,
];

const STANDARD_INTENTS = new Set<AugmentTaskIntent>([
	"implement",
	"debug",
	"refactor",
	"review",
	"research",
	"test-fix",
]);

export function inferIntensity(
	draft: string,
	intent: AugmentTaskIntent,
): PromptLeverageIntensity {
	const lowered = draft.toLowerCase();
	if (DEEP_SIGNALS.some((re) => re.test(lowered))) {
		return "Deep";
	}
	if (STANDARD_INTENTS.has(intent)) {
		return "Standard";
	}
	return "Light";
}

// ---------------------------------------------------------------------------
// Public guidance accessors — thin lookups into INTENT_GUIDANCE
// ---------------------------------------------------------------------------

export function buildToolRules(intent: AugmentTaskIntent): string {
	return INTENT_GUIDANCE[intent].toolRules;
}

export function buildOutputContract(intent: AugmentTaskIntent): string {
	return INTENT_GUIDANCE[intent].outputContract;
}

export function buildWorkStyle(
	intent: AugmentTaskIntent,
	intensity: PromptLeverageIntensity,
): string {
	const lines: string[] = [
		`Task type: ${intent}`,
		`Effort level: ${intensity}`,
		...INTENT_GUIDANCE[intent].workStyleLines,
	];

	if (intensity === "Deep" || intensity === "Standard") {
		lines.push(
			"For non-trivial work, review the result once with fresh eyes before finalizing.",
		);
	}

	return lines.join("\n");
}

export function buildVerification(intent: AugmentTaskIntent): string {
	const base = "Check correctness, completeness, and edge cases.";
	return `${base}\n${INTENT_GUIDANCE[intent].verification}`;
}

export function buildDoneCriteria(intent: AugmentTaskIntent): string {
	return INTENT_GUIDANCE[intent].doneCriteria;
}

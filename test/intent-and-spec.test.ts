import assert from "node:assert/strict";
import test from "node:test";
import {
	analyzeDraftIntent,
	detectTaskIntent,
	resolveEffectiveRewriteMode,
} from "../src/intent.js";
import {
	normalizeAugmentOutput,
	stripOuterMarkdownFences,
} from "../src/parser.js";
import { prepareRewrite } from "../src/spec.js";
import type { AugmentContextPayload } from "../src/types.js";

void test("intent classification detects implement-oriented drafts", () => {
	assert.equal(
		detectTaskIntent(
			"Implement support for rewriteMode in src/commands.ts and run tests.",
		),
		"implement",
	);
});

void test("intent classification detects debug-oriented drafts", () => {
	assert.equal(
		detectTaskIntent("Debug why /augment hangs and fix the timeout bug."),
		"debug",
	);
});

void test("intent classification detects explain-oriented drafts", () => {
	assert.equal(
		detectTaskIntent("Explain how Augment model routing works."),
		"explain",
	);
});

void test("intent classification still prefers execution when the draft asks to explain and fix", () => {
	assert.equal(
		detectTaskIntent("Explain why tests fail and fix the root cause."),
		"debug",
	);
});

void test("intent classification resolves complex multi-intent drafts predictably", () => {
	// Matches "add tests" (test-fix), "document" (docs), and "bug fix" (debug).
	// Because TEST_FIX_RULE is higher in STRONG_INTENT_RULES, it should resolve to test-fix.
	assert.equal(
		detectTaskIntent("Add tests to document the bug fix."),
		"test-fix",
	);

	// Matches "fix the bug" (debug) and "document it" (docs).
	// DEBUG_RULE > DOCS_RULE
	assert.equal(
		detectTaskIntent("Fix the bug and document it in the readme."),
		"debug",
	);

	// Matches "refactor" (refactor) and "tests" (test-fix).
	// TEST_FIX_RULE > REFACTOR_RULE
	assert.equal(
		detectTaskIntent("Refactor the component to fix failing tests."),
		"test-fix",
	);
});

void test("rewrite mode resolution honors forced and auto modes", () => {
	assert.equal(resolveEffectiveRewriteMode("plain", "implement"), "plain");
	assert.equal(
		resolveEffectiveRewriteMode("execution-contract", "explain"),
		"execution-contract",
	);
	assert.equal(
		resolveEffectiveRewriteMode("auto", "implement"),
		"execution-contract",
	);
	assert.equal(resolveEffectiveRewriteMode("auto", "explain"), "plain");
});

void test("draft analysis resolves intent and effective rewrite mode together", () => {
	assert.deepEqual(
		analyzeDraftIntent("Review this diff and report findings.", "auto"),
		{
			intent: "review",
			effectiveRewriteMode: "execution-contract",
		},
	);
});

void test("prepared rewrite includes deterministic metadata and execution rules", () => {
	const prepared = prepareRewrite(
		createPromptContext({
			draft: "Fix the login bug and run tests.",
			intent: "debug",
			effectiveRewriteMode: "execution-contract",
			effortLevel: "Standard",
		}),
	);

	assert.equal(prepared.intent, "debug");
	assert.equal(prepared.mode, "execution-contract");
	assert.match(prepared.promptSpec, /Intent: debug/);
	assert.match(prepared.promptSpec, /Mode: execution-contract/);
	assert.match(prepared.promptSpec, /root cause/i);
	assert.match(prepared.promptSpec, /Return only the rewritten prompt/i);
});

void test("prepared rewrite includes recent conversation excerpts when present", () => {
	const prepared = prepareRewrite(
		createPromptContext({
			recentConversation: [
				{
					role: "user",
					text: "We already confirmed the bug happens after login.",
					tokens: 13,
				},
				{
					role: "assistant",
					text: "The redirect likely comes from the callback handler.",
					tokens: 12,
				},
			],
		}),
	);

	assert.match(prepared.promptSpec, /Recent conversation:/);
	assert.match(
		prepared.promptSpec,
		/\[user\] We already confirmed the bug happens after login\./,
	);
	assert.match(
		prepared.promptSpec,
		/\[assistant\] The redirect likely comes from the callback handler\./,
	);
	assert.match(
		prepared.promptSpec,
		/Use these excerpts only if they materially improve the rewrite\./,
	);
});

void test("prepared rewrite falls back cleanly when no recent conversation is relevant", () => {
	const prepared = prepareRewrite(
		createPromptContext({
			draft: "Explain how model routing works.",
			intent: "explain",
			effectiveRewriteMode: "plain",
			effortLevel: "Light",
			recentConversation: [],
		}),
	);

	assert.match(
		prepared.promptSpec,
		/Recent conversation: none relevant\. Rely on the draft and workspace context only\./,
	);
});

void test("prepared rewrite keeps plain rewrites out of execution-contract wording", () => {
	const prepared = prepareRewrite(
		createPromptContext({
			draft: "Explain how model routing works.",
			intent: "explain",
			effectiveRewriteMode: "plain",
			effortLevel: "Light",
		}),
	);

	assert.match(
		prepared.promptSpec,
		/Rewrite the draft into a stronger prompt/i,
	);
	assert.doesNotMatch(
		prepared.promptSpec,
		/smallest strong execution contract/i,
	);
});

void test("normalizeAugmentOutput extracts execution_contract from fenced output", () => {
	assert.equal(
		normalizeAugmentOutput(
			"Here is the rewritten prompt:\n\n```xml\n<execution_contract>\nBetter prompt\n</execution_contract>\n```",
		),
		"Better prompt",
	);
});

void test("normalizeAugmentOutput preserves raw execution contract XML", () => {
	assert.equal(
		normalizeAugmentOutput(
			"```xml\n<task>Fix the login redirect</task>\n\n<context>Inspect the auth callback flow</context>\n```",
		),
		"<task>Fix the login redirect</task>\n\n<context>Inspect the auth callback flow</context>",
	);
});

void test("normalizeAugmentOutput strips leading labels for plain rewrites", () => {
	assert.equal(
		normalizeAugmentOutput(
			"Rewritten prompt: Explain how model routing works in this codebase.",
		),
		"Explain how model routing works in this codebase.",
	);
});

void test("stripOuterMarkdownFences strips untyped fences", () => {
	assert.equal(
		stripOuterMarkdownFences("```\nExplain how model routing works.\n```"),
		"Explain how model routing works.",
	);
});

function createPromptContext(
	overrides: Partial<AugmentContextPayload>,
): AugmentContextPayload {
	return {
		draft: "draft",
		effectiveRewriteMode: "plain",
		intent: "general",
		effortLevel: "Light",
		recentConversation: [],
		projectMetadata: { cwd: "/tmp/project", gitBranch: "main" },
		...overrides,
	};
}

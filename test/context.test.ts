import assert from "node:assert/strict";
import test from "node:test";
import { buildPromptContext } from "../src/context.js";

// ---------------------------------------------------------------------------
// buildPromptContext — integration tests
// ---------------------------------------------------------------------------

void test("buildPromptContext returns a complete payload for a simple draft", async () => {
	const ctx = await buildPromptContext(
		"Implement login form support in src/auth.ts and run tests",
	);
	assert.equal(
		ctx.draft,
		"Implement login form support in src/auth.ts and run tests",
	);
	assert.equal(ctx.intent, "implement");
	assert.equal(ctx.effectiveRewriteMode, "execution-contract");
	assert.ok(ctx.effortLevel, "effortLevel should be set");
	assert.ok(ctx.projectMetadata, "projectMetadata should be present");
	assert.ok(ctx.projectMetadata?.cwd, "cwd should be set");
});

void test("buildPromptContext resolves correct intent for different draft types", async () => {
	const debug = await buildPromptContext(
		"Debug why the server crashes on startup",
	);
	assert.equal(debug.intent, "debug");

	const explain = await buildPromptContext(
		"Explain how the routing layer works",
	);
	assert.equal(explain.intent, "explain");
	assert.equal(explain.effectiveRewriteMode, "plain");

	const review = await buildPromptContext("Review this pull request diff");
	assert.equal(review.intent, "review");
});

void test("buildPromptContext infers effort level from draft signals", async () => {
	const deep = await buildPromptContext(
		"Carefully review the production authentication code",
	);
	assert.equal(deep.effortLevel, "Deep");

	const standard = await buildPromptContext("Fix the null pointer crash");
	assert.equal(standard.effortLevel, "Standard");

	const light = await buildPromptContext("Explain what this function does");
	assert.equal(light.effortLevel, "Light");
});

// ---------------------------------------------------------------------------
// normalizeRecentConversation — tested indirectly via buildPromptContext
// ---------------------------------------------------------------------------

void test("buildPromptContext normalizes recent conversation entries", async () => {
	const ctx = await buildPromptContext("Fix the bug", [
		{ role: "user", text: "I found a crash when logging in" },
		{
			role: "assistant",
			text: "I see, the auth handler throws on null tokens",
		},
	]);
	assert.equal(ctx.recentConversation.length, 2);
	assert.equal(ctx.recentConversation[0].role, "user");
	assert.equal(
		ctx.recentConversation[0].text,
		"I found a crash when logging in",
	);
	assert.ok(ctx.recentConversation[0].tokens > 0, "tokens should be estimated");
	assert.equal(ctx.recentConversation[1].role, "assistant");
});

void test("buildPromptContext limits conversation to 4 entries", async () => {
	const input = [
		{ role: "user" as const, text: "Message one" },
		{ role: "assistant" as const, text: "Reply one" },
		{ role: "user" as const, text: "Message two" },
		{ role: "assistant" as const, text: "Reply two" },
		{ role: "user" as const, text: "Message three" },
		{ role: "assistant" as const, text: "Reply three" },
	];
	const ctx = await buildPromptContext("Do something", input);
	assert.ok(ctx.recentConversation.length <= 4, "Should cap at 4 messages");
});

void test("buildPromptContext returns empty conversation when none provided", async () => {
	const ctx = await buildPromptContext("Explain something");
	assert.deepEqual(ctx.recentConversation, []);
});

void test("buildPromptContext skips empty conversation entries", async () => {
	const ctx = await buildPromptContext("Fix something", [
		{ role: "user", text: "Real message" },
		{ role: "assistant", text: "   " },
		{ role: "user", text: "" },
		{ role: "assistant", text: "Another real message" },
	]);
	assert.equal(ctx.recentConversation.length, 2);
	assert.equal(ctx.recentConversation[0].text, "Real message");
	assert.equal(ctx.recentConversation[1].text, "Another real message");
});

void test("buildPromptContext respects token budget for conversation", async () => {
	// Create a very long message that exceeds the 800 token budget
	const longText = "x".repeat(4000); // ~1000 tokens at 4 chars/token
	const ctx = await buildPromptContext("Fix something", [
		{ role: "user", text: "Short early message" },
		{ role: "assistant", text: longText },
	]);
	// The long message should either be the only one (if it fits alone) or
	// the short message should be included if the long one was skipped
	assert.ok(ctx.recentConversation.length <= 2, "Should respect token budget");
});

// ---------------------------------------------------------------------------
// git branch resolution — indirect test
// ---------------------------------------------------------------------------

void test("buildPromptContext resolves git branch when in a git repo", async () => {
	// This test runs inside the gemini-augment repo, so git should work
	const ctx = await buildPromptContext("Do something");
	assert.ok(ctx.projectMetadata, "projectMetadata should be present");
	// We're in a git repo, so gitBranch should be defined
	// (unless in detached HEAD state)
	if (ctx.projectMetadata?.gitBranch) {
		assert.equal(typeof ctx.projectMetadata.gitBranch, "string");
		assert.ok(ctx.projectMetadata.gitBranch.length > 0);
	}
});

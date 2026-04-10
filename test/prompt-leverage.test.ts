import assert from "node:assert/strict";
import test from "node:test";
import {
	buildDoneCriteria,
	buildOutputContract,
	buildToolRules,
	buildVerification,
	buildWorkStyle,
	inferIntensity,
} from "../src/prompt-leverage.js";
import type { AugmentTaskIntent } from "../src/types.js";

const ALL_INTENTS: AugmentTaskIntent[] = [
	"implement",
	"debug",
	"refactor",
	"review",
	"research",
	"docs",
	"test-fix",
	"explain",
	"general",
];

// ---------------------------------------------------------------------------
// inferIntensity
// ---------------------------------------------------------------------------

void test("inferIntensity returns Deep when draft contains deep signal words", () => {
	assert.equal(
		inferIntensity("Be careful with this refactor", "general"),
		"Deep",
	);
	assert.equal(inferIntensity("This is production code", "explain"), "Deep");
	assert.equal(
		inferIntensity("Critical security patch needed", "general"),
		"Deep",
	);
	assert.equal(inferIntensity("Do a thorough review", "general"), "Deep");
	assert.equal(inferIntensity("High-stakes migration", "general"), "Deep");
	assert.equal(inferIntensity("Review the architecture", "general"), "Deep");
});

void test("inferIntensity returns Deep for Vietnamese high-risk signals", () => {
	assert.equal(
		inferIntensity("Can sua that can than vi day la production", "general"),
		"Deep",
	);
	assert.equal(
		inferIntensity("Day la thay doi nghiem trong lien quan bao mat", "general"),
		"Deep",
	);
});

void test("inferIntensity returns Standard for code-oriented intents without deep signals", () => {
	assert.equal(inferIntensity("Add a login form", "implement"), "Standard");
	assert.equal(inferIntensity("Fix the crash", "debug"), "Standard");
	assert.equal(inferIntensity("Clean up the module", "refactor"), "Standard");
	assert.equal(inferIntensity("Check this PR", "review"), "Standard");
	assert.equal(inferIntensity("Look into options", "research"), "Standard");
	assert.equal(inferIntensity("Fix the failing spec", "test-fix"), "Standard");
});

void test("inferIntensity returns Light for explain and general intents without deep signals", () => {
	assert.equal(inferIntensity("How does routing work?", "explain"), "Light");
	assert.equal(inferIntensity("Summarize the project", "general"), "Light");
});

void test("inferIntensity deep signals override intent-based level", () => {
	// Even explain/general get Deep when signals are present
	assert.equal(
		inferIntensity("Be careful with this explanation", "explain"),
		"Deep",
	);
	assert.equal(
		inferIntensity("Deep dive into the codebase", "general"),
		"Deep",
	);
});

// ---------------------------------------------------------------------------
// buildToolRules — every intent returns a non-empty string
// ---------------------------------------------------------------------------

void test("buildToolRules returns non-empty guidance for every intent", () => {
	for (const intent of ALL_INTENTS) {
		const result = buildToolRules(intent);
		assert.ok(result.length > 0, `Empty tool rules for intent: ${intent}`);
	}
});

void test("buildToolRules returns code-specific rules for code intents", () => {
	const codeIntents: AugmentTaskIntent[] = [
		"implement",
		"debug",
		"refactor",
		"test-fix",
	];
	for (const intent of codeIntents) {
		assert.match(
			buildToolRules(intent),
			/Inspect.*relevant files/i,
			`Expected code-specific tool rules for ${intent}`,
		);
	}
});

// ---------------------------------------------------------------------------
// buildOutputContract — every intent returns a non-empty string
// ---------------------------------------------------------------------------

void test("buildOutputContract returns non-empty contract for every intent", () => {
	for (const intent of ALL_INTENTS) {
		const result = buildOutputContract(intent);
		assert.ok(result.length > 0, `Empty output contract for intent: ${intent}`);
	}
});

void test("buildOutputContract returns diagnosis-focused contract for debug", () => {
	assert.match(buildOutputContract("debug"), /root cause/i);
});

void test("buildOutputContract returns explanation-focused contract for explain", () => {
	assert.match(buildOutputContract("explain"), /explanation/i);
});

// ---------------------------------------------------------------------------
// buildWorkStyle — intent + intensity variations
// ---------------------------------------------------------------------------

void test("buildWorkStyle includes task type and effort level", () => {
	const result = buildWorkStyle("implement", "Standard");
	assert.match(result, /Task type: implement/);
	assert.match(result, /Effort level: Standard/);
});

void test("buildWorkStyle includes fresh-eyes review line for Deep and Standard", () => {
	assert.match(buildWorkStyle("implement", "Deep"), /fresh eyes/i);
	assert.match(buildWorkStyle("debug", "Standard"), /fresh eyes/i);
});

void test("buildWorkStyle omits fresh-eyes review line for Light", () => {
	assert.doesNotMatch(buildWorkStyle("explain", "Light"), /fresh eyes/i);
});

void test("buildWorkStyle includes intent-specific lines for debug", () => {
	assert.match(buildWorkStyle("debug", "Standard"), /Inspect before editing/);
	assert.match(buildWorkStyle("debug", "Standard"), /root cause/);
});

void test("buildWorkStyle includes intent-specific lines for review", () => {
	assert.match(buildWorkStyle("review", "Standard"), /fresh-eyes critique/i);
});

void test("buildWorkStyle returns non-empty for every intent", () => {
	for (const intent of ALL_INTENTS) {
		const result = buildWorkStyle(intent, "Standard");
		assert.ok(result.length > 0, `Empty work style for intent: ${intent}`);
	}
});

// ---------------------------------------------------------------------------
// buildVerification — always includes base + intent-specific
// ---------------------------------------------------------------------------

void test("buildVerification always includes base correctness check", () => {
	for (const intent of ALL_INTENTS) {
		assert.match(
			buildVerification(intent),
			/correctness.*completeness.*edge cases/i,
			`Missing base check for intent: ${intent}`,
		);
	}
});

void test("buildVerification includes intent-specific guidance", () => {
	assert.match(buildVerification("debug"), /root cause.*addressed/i);
	assert.match(buildVerification("docs"), /examples.*commands/i);
	assert.match(buildVerification("review"), /speculative redesign/i);
});

// ---------------------------------------------------------------------------
// buildDoneCriteria — every intent returns a non-empty string
// ---------------------------------------------------------------------------

void test("buildDoneCriteria returns non-empty criteria for every intent", () => {
	for (const intent of ALL_INTENTS) {
		const result = buildDoneCriteria(intent);
		assert.ok(result.length > 0, `Empty done criteria for intent: ${intent}`);
	}
});

void test("buildDoneCriteria returns root-cause-specific criteria for debug", () => {
	assert.match(buildDoneCriteria("debug"), /root cause.*confirmed/i);
});

void test("buildDoneCriteria returns explanation-specific criteria for explain", () => {
	assert.match(buildDoneCriteria("explain"), /explanation.*answers/i);
});

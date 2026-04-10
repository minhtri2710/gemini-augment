const AUGMENT_ENHANCED_PATTERN =
	/<augment-enhanced-prompt>([\s\S]*?)<\/augment-enhanced-prompt>/;
const EXECUTION_CONTRACT_PATTERN =
	/<execution_contract>([\s\S]*?)<\/execution_contract>/;
const FIRST_TAG_START_PATTERN = /<[a-z_]+>/i;
const LAST_TAG_END_PATTERN = /<\/[a-z_]+>/gi;
const TASK_TAG_PATTERN = /<task>[\s\S]*?<\/task>/i;
const CONTEXT_TAG_PATTERN = /<context>[\s\S]*?<\/context>/i;
const BALANCED_TAG_PATTERN = /<([a-z_]+)>[\s\S]*?<\/\1>/gi;
const OUTER_FENCE_OPEN_PATTERN = /^```[\w-]*\n?/;
const OUTER_FENCE_CLOSE_PATTERN = /\n?```$/;
const WRAPPED_BLOCK_PATTERNS = [
	AUGMENT_ENHANCED_PATTERN,
	EXECUTION_CONTRACT_PATTERN,
] as const;
const FENCED_BLOCK_PATTERN = /^(?:[\s\S]*?)\n?```[\w-]*\n([\s\S]*?)\n```\s*$/;
const LEADING_LABEL_PATTERN =
	/^(?:here(?:'s| is) (?:the )?(?:rewritten|enhanced|normalized) prompt:?|(?:rewritten|enhanced|normalized) prompt:?|output:)\s*/i;

export function normalizeAugmentOutput(responseText: string): string {
	const text = normalizePromptText(responseText);
	if (!text) {
		throw new Error("Augment received empty output.");
	}

	const normalized = extractNormalizedPrompt(text);
	if (normalized !== null) return normalized;

	const stripped = stripOuterMarkdownFences(text);
	const strippedNormalized = extractNormalizedPrompt(stripped);
	if (strippedNormalized !== null) return strippedNormalized;

	return stripLeadingPreamble(stripped);
}

function extractNormalizedPrompt(text: string): string | null {
	if (!text) return null;

	for (const pattern of WRAPPED_BLOCK_PATTERNS) {
		const extracted = extractWrappedBlock(text, pattern);
		if (extracted !== null) return extracted;
	}

	return extractRawExecutionContract(text);
}

function extractWrappedBlock(text: string, pattern: RegExp): string | null {
	const match = pattern.exec(text);
	if (!match) return null;

	const extracted = normalizePromptText(match[1] ?? "");
	return extracted || null;
}

function extractRawExecutionContract(text: string): string | null {
	if (!text) return null;

	const block = sliceRawExecutionContract(text);
	if (!block) return null;
	if (!looksLikeExecutionContract(block)) return null;

	return block;
}

function sliceRawExecutionContract(text: string): string | null {
	const start = findFirstTagStart(text);
	if (start === -1) return null;

	const end = findLastTagEnd(text);
	if (end === -1 || end <= start) return null;

	const block = normalizePromptText(text.slice(start, end));
	return block || null;
}

function findFirstTagStart(text: string): number {
	const match = FIRST_TAG_START_PATTERN.exec(text);
	return match?.index ?? -1;
}

function findLastTagEnd(text: string): number {
	let lastIndex = -1;
	let lastLength = 0;

	LAST_TAG_END_PATTERN.lastIndex = 0;
	for (const match of text.matchAll(LAST_TAG_END_PATTERN)) {
		lastIndex = match.index ?? -1;
		lastLength = match[0]?.length ?? 0;
	}

	return lastIndex === -1 ? -1 : lastIndex + lastLength;
}

function looksLikeExecutionContract(text: string): boolean {
	const hasTask = TASK_TAG_PATTERN.test(text);
	const hasContext = CONTEXT_TAG_PATTERN.test(text);
	if (!hasTask || !hasContext) return false;

	const uniqueTags = new Set<string>();
	BALANCED_TAG_PATTERN.lastIndex = 0;
	for (const match of text.matchAll(BALANCED_TAG_PATTERN)) {
		const tag = match[1]?.toLowerCase();
		if (tag) {
			uniqueTags.add(tag);
			if (uniqueTags.size >= 2) {
				return true;
			}
		}
	}

	return uniqueTags.size >= 2;
}

export function stripOuterMarkdownFences(text: string): string {
	let result = text.trim();
	result = result.replace(OUTER_FENCE_OPEN_PATTERN, "");
	result = result.replace(OUTER_FENCE_CLOSE_PATTERN, "");
	return result.trim();
}

function stripLeadingPreamble(text: string): string {
	const normalized = normalizePromptText(text);
	if (!normalized) return normalized;

	const fenceMatch = normalized.match(FENCED_BLOCK_PATTERN);
	if (fenceMatch) {
		return fenceMatch[1].trim();
	}

	const withoutLabel = normalized.replace(LEADING_LABEL_PATTERN, "");
	const cleaned = stripOuterMarkdownFences(withoutLabel);
	return cleaned.trim();
}

function normalizePromptText(text: string): string {
	return text
		.replace(/^\uFEFF/, "")
		.replace(/\r\n/g, "\n")
		.trim();
}

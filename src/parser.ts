const EXECUTION_CONTRACT_OPEN = "<execution_contract>";
const EXECUTION_CONTRACT_CLOSE = "</execution_contract>";

export function normalizeAugmentOutput(responseText: string): string {
	const text = normalizePromptText(responseText);
	if (!text) {
		throw new Error("Augment received empty output.");
	}

	const primary = extractWrappedBlock(
		text,
		"<augment-enhanced-prompt>",
		"</augment-enhanced-prompt>",
	);
	if (primary !== null) return primary;

	const executionContract = extractWrappedBlock(
		text,
		EXECUTION_CONTRACT_OPEN,
		EXECUTION_CONTRACT_CLOSE,
	);
	if (executionContract !== null) return executionContract;

	const rawExecutionContract = extractRawExecutionContract(text);
	if (rawExecutionContract !== null) return rawExecutionContract;

	const stripped = stripOuterMarkdownFences(text);
	const strippedPrimary = extractWrappedBlock(
		stripped,
		"<augment-enhanced-prompt>",
		"</augment-enhanced-prompt>",
	);
	if (strippedPrimary !== null) return strippedPrimary;

	const strippedExecution = extractWrappedBlock(
		stripped,
		EXECUTION_CONTRACT_OPEN,
		EXECUTION_CONTRACT_CLOSE,
	);
	if (strippedExecution !== null) return strippedExecution;

	const strippedRawExecution = extractRawExecutionContract(stripped);
	if (strippedRawExecution !== null) return strippedRawExecution;

	return stripLeadingPreamble(stripped);
}

function extractWrappedBlock(
	text: string,
	open: string,
	close: string,
): string | null {
	if (!text) return null;

	const pattern = new RegExp(
		`${escapeRegExp(open)}([\\s\\S]*?)${escapeRegExp(close)}`,
	);
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
	const match = text.match(/<[a-z_]+>/i);
	return match?.index ?? -1;
}

function findLastTagEnd(text: string): number {
	const matches = [...text.matchAll(/<\/[a-z_]+>/gi)];
	if (matches.length === 0) return -1;
	const lastMatch = matches[matches.length - 1];
	return lastMatch.index + lastMatch[0].length;
}

function looksLikeExecutionContract(text: string): boolean {
	const hasTask = /<task>[\s\S]*?<\/task>/i.test(text);
	const hasContext = /<context>[\s\S]*?<\/context>/i.test(text);
	if (!hasTask || !hasContext) return false;

	const matches = [...text.matchAll(/<([a-z_]+)>[\s\S]*?<\/\1>/gi)];
	const uniqueTags = new Set(matches.map((m) => m[1].toLowerCase()));
	return uniqueTags.size >= 2;
}

export function stripOuterMarkdownFences(text: string): string {
	let result = text.trim();
	result = result.replace(/^```[\w-]*\n?/, "");
	result = result.replace(/\n?```$/, "");
	return result.trim();
}

function stripLeadingPreamble(text: string): string {
	const normalized = normalizePromptText(text);
	if (!normalized) return normalized;

	const fenceMatch = normalized.match(
		/^(?:[\s\S]*?)\n?```[\w-]*\n([\s\S]*?)\n```\s*$/,
	);
	if (fenceMatch) {
		return fenceMatch[1].trim();
	}

	const withoutLabel = normalized.replace(
		/^(?:here(?:'s| is) (?:the )?(?:rewritten|enhanced|normalized) prompt:?|(?:rewritten|enhanced|normalized) prompt:?|output:)\s*/i,
		"",
	);
	const cleaned = stripOuterMarkdownFences(withoutLabel);
	return cleaned.trim();
}

function normalizePromptText(text: string): string {
	return text
		.replace(/^\uFEFF/, "")
		.replace(/\r\n/g, "\n")
		.trim();
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { analyzeDraftIntent } from "./intent.js";
import { inferIntensity } from "./prompt-leverage.js";
import type { AugmentContextPayload, ConversationExcerpt } from "./types.js";

const execFileAsync = promisify(execFile);
const MAX_CONVERSATION_MESSAGES = 4;
const MAX_RECENT_CONVERSATION_TOKENS = 800;

export async function buildPromptContext(
	draft: string,
	recentConversationInput: Array<{
		role: "user" | "assistant";
		text: string;
	}> = [],
): Promise<AugmentContextPayload> {
	const analysis = analyzeDraftIntent(draft, "auto");
	const cwd = process.cwd();
	const gitBranch = await resolveGitBranch(cwd);
	const effortLevel = inferIntensity(draft, analysis.intent);
	const recentConversation = normalizeRecentConversation(
		recentConversationInput,
	);

	return {
		draft,
		intent: analysis.intent,
		effectiveRewriteMode: analysis.effectiveRewriteMode,
		effortLevel,
		recentConversation,
		projectMetadata: gitBranch ? { cwd, gitBranch } : { cwd },
	};
}

function normalizeRecentConversation(
	recentConversationInput: Array<{ role: "user" | "assistant"; text: string }>,
): ConversationExcerpt[] {
	const selected: ConversationExcerpt[] = [];
	let remaining = MAX_RECENT_CONVERSATION_TOKENS;

	for (let i = recentConversationInput.length - 1; i >= 0; i--) {
		const entry = recentConversationInput[i];
		const text = entry.text.replace(/\r\n/g, "\n").trim();
		if (!text) continue;

		// Fast, crude heuristic for token count estimation.
		// Accurate enough for truncating optional conversational context.
		const tokens = Math.ceil(text.length / 4);
		if (tokens > remaining && selected.length > 0) continue;
		if (tokens > remaining) break;

		selected.push({ role: entry.role, text, tokens });
		remaining -= tokens;
		if (selected.length >= MAX_CONVERSATION_MESSAGES) break;
	}

	return selected.reverse();
}

async function resolveGitBranch(cwd: string): Promise<string | undefined> {
	try {
		const { stdout } = await execFileAsync(
			"git",
			["branch", "--show-current"],
			{ cwd },
		);
		const branch = stdout.trim();
		return branch || undefined;
	} catch {
		// Silently gracefully degrade if git is unavailable or the directory
		// is not a git repository. Workspace context is optional and failing
		// here should not block execution.
		return undefined;
	}
}

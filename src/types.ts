export type AugmentRewriteMode = "plain" | "execution-contract";
export type AugmentTaskIntent =
	| "implement"
	| "debug"
	| "refactor"
	| "review"
	| "research"
	| "docs"
	| "test-fix"
	| "explain"
	| "general";

export interface ProjectMetadata {
	cwd: string;
	gitBranch?: string;
}

export interface ConversationExcerpt {
	role: "user" | "assistant";
	text: string;
	tokens: number;
}

export interface AugmentContextPayload {
	draft: string;
	effectiveRewriteMode: AugmentRewriteMode;
	intent: AugmentTaskIntent;
	effortLevel: "Light" | "Standard" | "Deep";
	recentConversation: ConversationExcerpt[];
	projectMetadata?: ProjectMetadata;
}

export interface PreparedRewrite {
	intent: AugmentTaskIntent;
	mode: AugmentRewriteMode;
	effortLevel: "Light" | "Standard" | "Deep";
	promptSpec: string;
}

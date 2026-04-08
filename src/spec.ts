import { buildRewriteSpec } from "./contracts.js";
import type { AugmentContextPayload, PreparedRewrite } from "./types.js";

export function prepareRewrite(context: AugmentContextPayload): PreparedRewrite {
  const recentConversationSection =
    context.recentConversation.length > 0
      ? [
          "",
          "Recent conversation:",
          ...context.recentConversation.map((entry) => `- [${entry.role}] ${entry.text}`),
          "Use these excerpts only if they materially improve the rewrite.",
        ]
      : ["", "Recent conversation: none relevant. Rely on the draft and workspace context only."];

  return {
    intent: context.intent,
    mode: context.effectiveRewriteMode,
    effortLevel: context.effortLevel,
    promptSpec: [
      "Augment rewrite specification",
      `Intent: ${context.intent}`,
      `Mode: ${context.effectiveRewriteMode}`,
      `Effort: ${context.effortLevel}`,
      ...(context.projectMetadata
        ? [
            `Workspace: ${context.projectMetadata.cwd}`,
            ...(context.projectMetadata.gitBranch
              ? [`Git branch: ${context.projectMetadata.gitBranch}`]
              : []),
          ]
        : []),
      ...recentConversationSection,
      "",
      "User draft:",
      context.draft,
      "",
      "Rewrite rules:",
      buildRewriteSpec(context),
    ].join("\n"),
  };
}

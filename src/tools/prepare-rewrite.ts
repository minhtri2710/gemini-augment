import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildPromptContext } from "../context.js";
import { prepareRewrite } from "../spec.js";

export function registerPrepareRewriteTool(server: McpServer) {
	server.registerTool(
		"prepare_augment_rewrite",
		{
			description:
				"Build a deterministic rewrite specification for turning a raw draft into a stronger Augment-style prompt.",
			inputSchema: {
				draft: z.string().min(1, "Draft is required."),
				analysisDraft: z
					.string()
					.min(1, "Analysis draft must not be empty.")
					.optional(),
				recentConversation: z
					.array(
						z.object({
							role: z.enum(["user", "assistant"]),
							text: z.string().min(1, "Conversation text is required."),
						}),
					)
					.max(4, "Provide at most 4 recent conversation excerpts.")
					.optional(),
			},
		},
		async ({ draft, analysisDraft, recentConversation }) => {
			const context = await buildPromptContext(
				draft,
				recentConversation ?? [],
				analysisDraft,
			);
			const prepared = prepareRewrite(context);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(prepared, null, 2),
					},
				],
			};
		},
	);
}

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { normalizeAugmentOutput } from "../parser.js";

export function registerNormalizeOutputTool(server: McpServer) {
	server.registerTool(
		"normalize_augment_output",
		{
			description:
				"Normalize an Augment rewrite by stripping wrappers, code fences, and leading commentary while preserving the actual rewritten prompt.",
			inputSchema: {
				rawText: z.string().min(1, "Raw text is required."),
			},
		},
		async ({ rawText }) => {
			const normalizedText = normalizeAugmentOutput(rawText);

			return {
				content: [
					{
						type: "text",
						text: normalizedText,
					},
				],
			};
		},
	);
}

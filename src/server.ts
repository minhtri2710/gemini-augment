import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildPromptContext } from "./context.js";
import { normalizeAugmentOutput } from "./parser.js";
import { prepareRewrite } from "./spec.js";

const server = new McpServer({
  name: "gemini-augment",
  version: "0.1.0",
});

server.registerTool(
  "prepare_augment_rewrite",
  {
    description:
      "Build a deterministic rewrite specification for turning a raw draft into a stronger Augment-style prompt.",
    inputSchema: {
      draft: z.string().min(1, "Draft is required."),
      recentConversation: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            text: z.string().min(1, "Conversation text is required."),
          })
        )
        .max(4, "Provide at most 4 recent conversation excerpts.")
        .optional(),
    },
  },
  async ({ draft, recentConversation }) => {
    const context = await buildPromptContext(draft, recentConversation ?? []);
    const prepared = prepareRewrite(context);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prepared, null, 2),
        },
      ],
    };
  }
);

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
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

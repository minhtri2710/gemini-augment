import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerNormalizeOutputTool } from "./tools/normalize-output.js";
import { registerPrepareRewriteTool } from "./tools/prepare-rewrite.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const server = new McpServer({
	name: "gemini-augment",
	version,
});

registerPrepareRewriteTool(server);
registerNormalizeOutputTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);

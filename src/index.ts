import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerNormalizeOutputTool } from "./tools/normalize-output.js";
import { registerPrepareRewriteTool } from "./tools/prepare-rewrite.js";

const server = new McpServer({
	name: "gemini-augment",
	version: "0.1.0",
});

registerPrepareRewriteTool(server);
registerNormalizeOutputTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

void test("MCP server exposes rewrite and normalization tools end to end", async () => {
	const { rootDir, command, args } = resolveServerLaunch();
	const client = new Client(
		{ name: "gemini-augment-smoke", version: "0.1.0" },
		{ capabilities: {} },
	);

	const transport = new StdioClientTransport({
		command,
		args,
		cwd: rootDir,
		stderr: "pipe",
	});

	let stderr = "";
	transport.stderr?.on("data", (chunk) => {
		stderr += chunk.toString();
	});

	try {
		await client.connect(transport);

		const tools = await client.listTools();
		const toolNames = tools.tools.map((tool) => tool.name).sort();
		assert.deepEqual(toolNames, [
			"normalize_augment_output",
			"prepare_augment_rewrite",
		]);

		const prepared = await client.callTool({
			name: "prepare_augment_rewrite",
			arguments: {
				draft: "Fix the login redirect bug and run tests.",
				recentConversation: [
					{ role: "user", text: "We already traced it to the auth callback." },
					{
						role: "assistant",
						text: "The redirect target is probably being overwritten.",
					},
				],
			},
		});

		const preparedText = getTextResult(prepared);
		const preparedJson = JSON.parse(preparedText) as {
			intent: string;
			mode: string;
			promptSpec: string;
		};

		assert.equal(preparedJson.intent, "debug");
		assert.equal(preparedJson.mode, "execution-contract");
		assert.match(preparedJson.promptSpec, /Recent conversation:/);
		assert.match(preparedJson.promptSpec, /auth callback/i);

		const normalized = await client.callTool({
			name: "normalize_augment_output",
			arguments: {
				rawText:
					"Here is the rewritten prompt:\n\n```xml\n<execution_contract>\nBetter prompt\n</execution_contract>\n```",
			},
		});

		assert.equal(getTextResult(normalized), "Better prompt");
	} catch (error) {
		const extra = stderr.trim() ? `\nServer stderr:\n${stderr}` : "";
		throw new Error(
			`${error instanceof Error ? error.message : String(error)}${extra}`,
		);
	} finally {
		await transport.close();
	}
});

function resolveServerLaunch(): {
	rootDir: string;
	command: string;
	args: string[];
} {
	const currentFile = fileURLToPath(import.meta.url);
	const rootDir = findProjectRoot(path.dirname(currentFile));
	const isCompiled = currentFile.includes(
		`${path.sep}dist${path.sep}test${path.sep}`,
	);

	return isCompiled
		? {
				rootDir,
				command: "node",
				args: [path.join(rootDir, "dist", "src", "server.js")],
			}
		: {
				rootDir,
				command: "node",
				args: ["--import=tsx", path.join(rootDir, "src", "server.ts")],
			};
}

function findProjectRoot(startDir: string): string {
	let current = startDir;

	while (true) {
		if (
			existsSync(path.join(current, "package.json")) &&
			existsSync(path.join(current, "gemini-extension.json"))
		) {
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			throw new Error("Could not locate gemini-augment project root.");
		}

		current = parent;
	}
}

function getTextResult(result: unknown): string {
	const content = extractContent(result);
	const textPart = content.find(
		(part): part is { type: "text"; text: string } =>
			part.type === "text" && typeof part.text === "string",
	);
	assert.ok(textPart, "expected text content from tool result");
	return textPart.text;
}

function extractContent(
	result: unknown,
): Array<{ type: string; text?: string }> {
	if (!result || typeof result !== "object") {
		throw new Error("Expected tool result object.");
	}

	const candidate = result as { content?: unknown };
	if (!Array.isArray(candidate.content)) {
		throw new Error("Expected tool result with content array.");
	}

	return candidate.content.filter(
		(part): part is { type: string; text?: string } =>
			!!part &&
			typeof part === "object" &&
			typeof (part as { type?: unknown }).type === "string",
	);
}

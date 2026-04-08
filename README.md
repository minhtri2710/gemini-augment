# gemini-augment

Gemini CLI extension that provides an explicit `/augment` command to rewrite raw prompts into stronger, more structured versions.

## What it does

`/augment <draft>` rewrites a raw prompt into a stronger, more structured version for review in chat.

The rewrite preserves the following behavior:

- explicit invocation rather than automatic rewriting
- intent-aware routing
- auto-selection between plain rewrite and execution-contract modes
- proportional structure for simple vs non-trivial tasks
- Prompt Leverage style guidance for context, constraints, verification, and done criteria
- optional recent-conversation grounding when current chat context materially affects the rewrite
- deterministic output normalization to strip wrappers, fences, and leading commentary

## Files

- `gemini-extension.json`: Gemini extension manifest and MCP server wiring
- `GEMINI.md`: persistent extension context
- `commands/augment.toml`: thin `/augment` command entrypoint
- `src/`: TypeScript logic ported from `pi-augment`
- `dist/`: compiled runtime files

## MCP tools

- `prepare_augment_rewrite`: classifies the draft, resolves rewrite mode, captures workspace metadata, accepts optional recent conversation excerpts, and returns a deterministic rewrite specification
- `normalize_augment_output`: strips wrappers such as `<execution_contract>`, markdown fences, and leading commentary so the final output is clean

## Install

```bash
gemini extensions install https://github.com/minhtri2710/gemini-augment
```

Restart Gemini CLI or reload commands as needed.

## Install for local development

From the extension directory:

```bash
gemini extensions link .
```

Restart Gemini CLI or reload commands as needed.

For verification during development:

```bash
npm run build
npm run smoke-test
```

## Release

Before cutting a version:

```bash
npm run typecheck
npm run build
npm test
npm run smoke-test
```

Then update `package.json`, `gemini-extension.json`, and `CHANGELOG.md` together so the published version and release notes stay aligned.

## Usage

```text
/augment fix the login bug where users get redirected to 404
```

```text
/augment explain how model routing works in this codebase
```

If the current chat contains relevant context, `/augment` can use a few short recent excerpts as grounding. If the draft is already self-contained or the surrounding conversation is not relevant, the rewrite should fall back to the draft and workspace context only.

## How it works

The extension uses Gemini CLI custom commands plus a TypeScript MCP server:

- the rewrite happens inside Gemini CLI via `/augment`
- deterministic augmentation logic lives in TypeScript
- the rewritten prompt is shown in chat for review
- the command can include workspace context such as current directory, git branch, and short relevant conversation excerpts

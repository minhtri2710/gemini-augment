# gemini-augment

Gemini CLI extension that provides an explicit `/augment` command to rewrite raw prompts into stronger, more structured versions.

## What it does

`/augment <draft>` rewrites a raw prompt into a stronger, more structured instruction and then executes it.

The rewrite preserves the following behavior:

- explicit invocation rather than automatic rewriting
- intent-aware routing
- auto-selection between plain rewrite and execution-contract modes
- proportional structure for simple vs non-trivial tasks
- Prompt Leverage style guidance for context, constraints, verification, and done criteria
- optional recent-conversation grounding when current chat context materially affects the rewrite
- deterministic output normalization to strip wrappers, fences, and leading commentary
- rewrite-then-execute flow so the command performs the task instead of stopping at the prompt

## Files

- `gemini-extension.json`: Gemini extension manifest and MCP server wiring
- `GEMINI.md`: persistent extension context
- `commands/augment.toml`: thin `/augment` command entrypoint
- `skills/prompt-leverage/`: bundled agent skill for deeper prompt-structuring guidance
- `src/`: TypeScript logic ported from `pi-augment`
- `dist/`: compiled artifacts, including the bundled self-contained MCP runtime shipped with the extension

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

Run `npm run build` before publishing so the bundled `dist/index.js` shipped to Gemini stays in sync with the source.

## Usage

```text
/augment fix the login bug where users get redirected to 404
```

```text
/augment explain how model routing works in this codebase
```

If the current chat contains relevant context, `/augment` can use a few short recent excerpts as grounding. If the draft is already self-contained or the surrounding conversation is not relevant, the rewrite should fall back to the draft and workspace context only.

`/augment` now treats the normalized rewritten prompt as an internal execution instruction. In normal use, it should do the work and return the outcome rather than echoing the rewritten prompt back to the user.

## How it works

The extension uses Gemini CLI custom commands plus a TypeScript MCP server:

- the rewrite happens inside Gemini CLI via `/augment`
- deterministic augmentation logic lives in TypeScript
- the rewritten prompt is normalized and used as the execution instruction for the same turn
- the command can include workspace context such as current directory, git branch, and short relevant conversation excerpts

## Bundled agent skill

The extension now bundles `skills/prompt-leverage/SKILL.md` so Gemini CLI can auto-discover the `prompt-leverage` agent skill.

- base `GEMINI.md` stays focused on `/augment` behavior and tool usage
- the bundled skill carries the heavier framework guidance for prompt upgrades, reusable templates, and hook-style prompt preprocessing
- `/augment` still relies on the deterministic MCP rewrite spec; the skill complements that flow instead of replacing it

Gemini should naturally activate the bundled skill for requests such as:

- improving an existing prompt without necessarily using `/augment`
- turning a one-off prompt into a reusable template
- designing a prompt hook or pre-processing workflow
- asking for clearer tool rules, verification steps, or done criteria in a prompt

For normal `/augment <draft>` usage, the extension should primarily follow the deterministic MCP rewrite flow, then execute the normalized rewrite and only lean on Prompt Leverage style guidance when it materially improves the rewrite.

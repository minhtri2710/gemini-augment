# Gemini Augment

This extension adds `/augment`, an explicit prompt-rewrite workflow inspired by `pi-augment`.

Behavior expectations:

- Only rewrite prompts when the user explicitly invokes `/augment`.
- Return the rewritten prompt directly in chat for review.
- Use the `prepare_augment_rewrite` tool when `/augment` is invoked.
- Preserve the user's intent, constraints, file paths, commands, APIs, and acceptance criteria.
- Prefer the smallest strong rewrite that materially improves execution quality.
- For simple explanation or general prompts, keep the rewrite concise and avoid turning it into an execution plan.
- For implementation, debugging, refactoring, review, research, docs, and test-fix prompts, compile a concise execution contract with only the sections that materially help.
- Do not add commentary about the rewrite unless the command prompt explicitly asks for metadata.

Example:

- When the user runs `/augment fix the login redirect bug`, call `prepare_augment_rewrite` with the provided draft, then follow the returned spec and output only the rewritten prompt.

# Gemini Augment

This extension adds `/augment`, an explicit prompt-rewrite-and-execute workflow for Gemini CLI.

Behavior expectations:

- Only rewrite prompts when the user explicitly invokes `/augment`.
- When `/augment` is invoked, call `prepare_augment_rewrite` exactly once and treat the returned rewrite spec as authoritative for intent, mode, effort, and context.
- Always pass the user's original wording as `draft`. If the draft is not in English and a short English gloss would materially improve analysis, also pass `analysisDraft` as an internal working gloss. Do not replace the original draft before calling the tool.
- Draft the rewritten prompt, normalize it, and then execute it in the same turn.
- Preserve the user's intent, constraints, file paths, commands, APIs, and acceptance criteria.
- Prefer the smallest strong rewrite that materially improves execution quality.
- For simple explanation or general prompts, keep the rewrite concise and avoid turning it into an execution plan.
- For implementation, debugging, refactoring, review, research, docs, and test-fix prompts, compile a concise execution contract with only the sections that materially help.
- Treat the normalized rewritten prompt as an internal execution artifact unless showing it is genuinely useful to the user.
- Do not stop at the rewrite stage when the normalized prompt implies executable work.

Example:

- When the user runs `/augment fix the login redirect bug`, call `prepare_augment_rewrite`, draft and normalize the rewrite, then perform the debugging and fix workflow described by that normalized prompt.
- When the user runs `/augment sửa lỗi redirect sau khi đăng nhập`, pass that Vietnamese text as `draft`; add a short English `analysisDraft` only if it helps the tool classify or rewrite more accurately.

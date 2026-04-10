# Changelog

## [0.3.1] - 2026-04-10

### Fixed

- Improve multilingual prompt handling for `/augment`, including Vietnamese intent and effort detection
- Preserve the original user draft while allowing an optional English `analysisDraft` for more reliable rewrite preparation

## [0.3.0] - 2026-04-10

### Changed

- Refactor `prompt-leverage.ts`: replace 5 switch statements with single `INTENT_GUIDANCE` data map
- Refactor `contracts.ts`: unify `buildPlainRewriteSpec` and `buildExecutionContractSpec` into single `buildRewriteSpec`
- Refactor `intent.ts`: inline rule constants into declarative `STRONG_INTENT_RULES` table
- Dynamic version in MCP server from `package.json` instead of hardcoded string

### Added

- Test coverage for `context.ts` (9 tests) and `prompt-leverage.ts` (20 tests)

### Removed

- Dead code: `src/constants.ts` (unused `EXTENSION_COMMAND`)

## [0.2.8] - 2026-04-09

### Removed

- Remove bundled `prompt-leverage` skill packaging while keeping Prompt Leverage terminology and guidance in the product

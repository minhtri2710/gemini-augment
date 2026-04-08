# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

## [0.2.3] - 2026-04-08

### Fixed
- Run Biome formatting after syncing tag versions in the release workflow so generated JSON matches repository formatting rules before CI checks.

## [0.2.2] - 2026-04-08

### Fixed
- Preserve tab-indented JSON formatting in the release workflow so `biome check` passes after syncing version metadata from tags.

## [0.2.1] - 2026-04-08

### Added
- GitHub Actions workflow to build tagged releases, package extension assets, and publish GitHub releases automatically.

## [0.2.0] - 2026-04-08

### Added
- Initial Gemini CLI extension port of the `pi-augment` workflow.
- TypeScript MCP server for deterministic rewrite preparation and output normalization.
- Optional recent-conversation grounding for `/augment` when current chat context materially changes the rewrite.

### Changed
- Improved `/augment` fallback behavior so irrelevant recent conversation is ignored instead of being forced into the rewrite.

## [0.1.0] - 2026-04-08

### Added
- Initial local development release scaffold.

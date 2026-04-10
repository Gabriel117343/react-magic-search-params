# AGENTS.md

Project: react-magic-search-params

Purpose
- Typed, centralized query/search param management for React Router.
- Extension pattern over useSearchParams with safer defaults and predictable URL behavior.

Feature Decision Map
- Keep pagination keys always present: use mandatory and defaultParams.
- Prevent user override of specific query values: use forceParams.
- Hide non-informative values in URL: use omitParamsByValues.
- Support tags or multi-select filters: use array params with arraySerialization.
- Reset page or cursor when filters change: use resetOnChange.
- Page pagination: use paginationStrategy with mode page.
- Offset/limit pagination: use paginationStrategy with mode offset.
- Cursor pagination: use paginationStrategy with mode cursor.
- Avoid browser history noise while typing: use historyMode replace globally or per update override.
- Preserve unknown params from external systems: use unknownParamsPolicy preserve.
- Need custom parsing/serialization: use codecs.
- Need side effects when a param changes: use onChange.

Generation Order
1. Define one params contract object per screen: mandatory and optional.
2. Add default and constraint rules: defaultParams and forceParams.
3. Add URL cleanliness rules: omitParamsByValues and unknownParamsPolicy.
4. Add behavior rules: resetOnChange, historyMode, paginationStrategy.
5. Add codecs only when default conversion is not enough.

Project Conventions
- Prefer local constants per screen for stronger TypeScript inference.
- Keep examples and docs in English.
- Use pnpm commands in this repository.

Validation Commands
- pnpm run typecheck
- pnpm test
- pnpm run build

Commit Conventions (Conventional Commits)
- Format: `type(scope): short summary`
- Common types:
	- `feat(scope)`: new functionality
	- `fix(scope)`: bug fix
	- `docs(scope)`: documentation-only changes
	- `chore(scope)`: maintenance/config/dependency tasks
	- `refactor(scope)`: internal refactor without behavior change
	- `test(scope)`: test additions/changes
	- `ci(scope)`: CI/workflow changes
	- `build(scope)`: build/packaging changes
	- `perf(scope)`: performance improvements

Repository Guidance for Commits
- Prefer small, focused commits by concern (core, docs, ci, build).
- If a release includes user-visible API improvements, prefer `feat(core)`.
- If only tooling/workflows changed, prefer `ci(...)` or `chore(...)`.

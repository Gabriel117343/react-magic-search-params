# Copilot Instructions for react-magic-search-params

Use this guidance when generating code that consumes `useMagicSearchParams`.

## Feature Decision Map

- Requirement: keep pagination keys always present
  Use: `mandatory` and `defaultParams`
- Requirement: never allow user override of specific query values
  Use: `forceParams`
- Requirement: hide non-informative values in URL
  Use: `omitParamsByValues`
- Requirement: support tags or multi-select filters
  Use: array params with `arraySerialization`
- Requirement: reset page or cursor when filters change
  Use: `resetOnChange`
- Requirement: page-based pagination
  Use: `paginationStrategy: { mode: 'page' }`
- Requirement: offset/limit pagination
  Use: `paginationStrategy: { mode: 'offset' }`
- Requirement: cursor pagination
  Use: `paginationStrategy: { mode: 'cursor' }`
- Requirement: avoid polluting browser history while typing
  Use: `historyMode: 'replace'` globally or per update override
- Requirement: preserve unknown params from external systems
  Use: `unknownParamsPolicy: 'preserve'`
- Requirement: union-like ambiguous values (e.g. `boolean | ''`, `number | ''`)
  Use: `coerceParams` first
- Requirement: custom parse/serialize behavior
  Use: `codecs`
- Requirement: side effects when a param changes
  Use: `onChange`

## Generation Order

1. Define one params contract object (`mandatory` and `optional`) per screen.
2. Add defaults and constraints (`defaultParams`, `forceParams`).
3. Add URL cleanliness rules (`omitParamsByValues`, `unknownParamsPolicy`).
4. Add behavior rules (`resetOnChange`, `historyMode`, `paginationStrategy`).
5. Add `coerceParams` for ambiguous runtime inference cases.
6. Add codecs only when default conversion or coerce hints are not enough.

## Project-specific Notes

- Prefer local constants per screen for stronger TypeScript inference.
- For ambiguous optional unions, prefer `coerceParams` before writing custom codecs.
- Keep examples and docs in English.
- Use pnpm commands in this repository (`pnpm test`, `pnpm run typecheck`, `pnpm run build`).

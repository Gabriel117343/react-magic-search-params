---
name: react-magic-search-params
description: "Use when implementing typed URL query/search state in React Router with useMagicSearchParams, including pagination, filters, reset rules, unknown param policy, and runtime coercion for ambiguous unions."
---

# react-magic-search-params Skill

## Use When

- You need URL-driven state for filters, search, sorting, tags, or pagination.
- You want typed query params with one contract per screen.
- You need predictable behavior for defaults, forced params, and reset rules.
- You have ambiguous optional unions like `boolean | ''` or `number | ''`.

## Feature Decision Map

- Keep required query keys always present: use `mandatory` and `defaultParams`.
- Prevent user override for specific values: use `forceParams`.
- Hide non-informative values: use `omitParamsByValues`.
- Handle multi-select and tags: use array params with `arraySerialization`.
- Reset dependent keys when source changes: use `resetOnChange`.
- Choose pagination strategy: use `paginationStrategy` with `page`, `offset`, or `cursor`.
- Keep URL clean while typing: use `historyMode: 'replace'`.
- Keep external unknown params: use `unknownParamsPolicy: 'preserve'`.
- Handle ambiguous runtime inference: use `coerceParams` first.
- Handle custom parsing/serialization: use `codecs`.
- Trigger side effects on param changes: use `onChange`.

## Generation Order

1. Define one params contract per screen (`mandatory` and `optional`).
2. Add defaults and constraints (`defaultParams`, `forceParams`).
3. Add URL cleanliness rules (`omitParamsByValues`, `unknownParamsPolicy`).
4. Add behavior rules (`resetOnChange`, `historyMode`, `paginationStrategy`).
5. Add `coerceParams` for ambiguous unions.
6. Add `codecs` only when coercion and defaults are not enough.

## Practical Rule for Ambiguous Unions

If a key is declared with an optional union that defaults to empty string, runtime inference cannot detect boolean or number intent from TypeScript alone.

Example:

```ts
optional: {
  only_unmapped: '' as boolean | '',
}
```

Prefer:

```ts
coerceParams: {
  only_unmapped: 'boolean',
}
```

Use `codecs` only when you need custom mapping logic beyond simple coercion.

## Validation Commands

- `pnpm run typecheck`
- `pnpm test`
- `pnpm run build`

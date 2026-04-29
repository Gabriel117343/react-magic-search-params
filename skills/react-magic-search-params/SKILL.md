---
name: react-magic-search-params
description: "Use when implementing typed URL query/search state in React Router with useMagicSearchParams, including params contracts, defaults, forced params, deep links, React Query integration, request-safe reads, protected params, and pagination helpers. This is an abstraction of useSearchParams (react-router-dom) with safer defaults and predictable URL behavior."
---

# react-magic-search-params Skill

## Use When

- You need URL-driven state for filters, search, sorting, tags, or pagination.
- You want one typed params contract per screen.
- You want examples that are ready to paste, not only conceptual guidance.
- You need to integrate URL state with React Query, links, or shareable filters.

## Core Rule

Always start by defining one constants object per screen and reuse that object everywhere:

- inside `useMagicSearchParams`
- when building links
- when creating React Query request params
- when documenting the screen behavior

## Recommended Build Order

1. Create one params contract per screen with `mandatory` and `optional`.
2. Add `defaultParams` if the page should boot with required URL state.
3. Add `forceParams` only for values users should never control.
4. Add `omitParamsByValues` and `unknownParamsPolicy` for URL cleanliness.
5. Add `coerceParams` for ambiguous unions like `boolean | ''` or `number | ''`.
6. Add `forRequest` reads for backend calls.
7. Add `protectedParams` for obfuscated shareable IDs.
8. Add `codecs` only when default conversion and protection rules are not enough.
9. Add `resetOnChange`, `historyMode`, and `paginationStrategy` for behavior.

## Base Pattern

### 1. Create the screen contract

```ts
type CommerceStatus = 'draft' | 'approved' | 'rejected' | ''
type OfferingType = 'products' | 'services' | ''

export const paramsAdminCommercesList = {
  mandatory: {
    page: 1,
    limit: 20 as const,
  },
  optional: {
    search: '',
    status: '' as CommerceStatus,
    offering_type: '' as OfferingType,
    region_id: '',
    commune_id: '',
    is_verified: '' as boolean | '',
    is_company_verified: '' as boolean | '',
  },
  coerceParams: {
    page: 'number',
    limit: 'number',
    is_verified: 'boolean',
    is_company_verified: 'boolean',
  } as const,
}
```

### 2. Use the contract in the page

```tsx
import { useMagicSearchParams } from 'react-magic-search-params'
import { paramsAdminCommercesList } from './paramsAdminCommercesList'

export function AdminCommercesPage() {
  const { getParams, updateParams, clearParams, pagination } = useMagicSearchParams({
    ...paramsAdminCommercesList,
    defaultParams: paramsAdminCommercesList.mandatory,
    forceParams: { limit: 20 },
    omitParamsByValues: ['all', 'default'],
    historyMode: 'replace',
  })

  const filters = getParams({ convert: true })

  function handleSearchChange(search: string) {
    updateParams({
      newParams: { page: 1, search },
      historyMode: 'replace',
    })
  }

  return (
    <>
      <p>Page: {filters.page}</p>
      <p>Search: {filters.search}</p>
      <button onClick={() => handleSearchChange('bakery')}>Search bakery</button>
      <button onClick={() => pagination.next()}>Next page</button>
      <button onClick={() => clearParams({ keepMandatoryParams: true })}>Reset filters</button>
    </>
  )
}
```

## Deep Links and Sidebars

If a sidebar, menu, or dashboard card should open a page with mandatory URL params already present, generate the query string from the same contract object.

```ts
export const buildMandatoryQuery = (
  paramsMandatory: Record<string, string | number | boolean>
) => {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(paramsMandatory)) {
    query.set(key, String(value))
  }

  return query.toString()
}
```

```tsx
import { Link } from 'react-router-dom'
import { paramsAdminCommercesList } from './paramsAdminCommercesList'

const adminCommercesPath = `/admin/commerces?${buildMandatoryQuery(
  paramsAdminCommercesList.mandatory
)}`

export function SidebarLink() {
  return <Link to={adminCommercesPath}>Commerces</Link>
}
```

Inside the page, keep:

```tsx
useMagicSearchParams({
  ...paramsAdminCommercesList,
  defaultParams: paramsAdminCommercesList.mandatory,
  forceParams: { limit: 20 },
})
```

Use this rule:

- `defaultParams` keeps required keys present when the page boots.
- `forceParams` is for non-user-controllable values such as `limit`.
- Do not force dynamic mandatory values like `page` unless you truly want them frozen.

## React Query Pattern

Use two reads from the same contract:

- `getParams({ convert: true })` for UI state
- `getParams({ convert: true, forRequest: true })` for backend/API state

```tsx
import { useQuery } from '@tanstack/react-query'
import { useMagicSearchParams } from 'react-magic-search-params'
import { paramsAdminCommercesList } from './paramsAdminCommercesList'

export function AdminCommercesPage() {
  const { getParams, updateParams } = useMagicSearchParams({
    ...paramsAdminCommercesList,
    defaultParams: paramsAdminCommercesList.mandatory,
    forceParams: { limit: 20 },
  })

  const filters = getParams({ convert: true })
  const queryParams = getParams({ convert: true, forRequest: true })

  const commercesQuery = useQuery({
    queryKey: ['admin-commerces', queryParams],
    queryFn: () => listAdminCommerces(queryParams),
  })

  function handleVerifiedChange(is_verified: boolean | '') {
    updateParams({
      newParams: { page: 1, is_verified },
    })
  }

  return (
    <>
      <p>Current search: {filters.search}</p>
      <p>Verified filter: {String(filters.is_verified)}</p>
      <button onClick={() => handleVerifiedChange(true)}>Only verified</button>
      <button onClick={() => handleVerifiedChange('')}>Clear verified</button>
      <pre>{JSON.stringify(commercesQuery.data, null, 2)}</pre>
    </>
  )
}
```

Why this works:

- `coerceParams` gives correct runtime types.
- `forRequest` removes `''`, `null`, and `undefined`.
- no manual request cleanup is needed before calling the backend.

## When to Use `coerceParams`

Use `coerceParams` when the runtime default cannot reveal the intended type.

Typical cases:

- `'' as boolean | ''`
- `'' as number | ''`
- `'' as SomeUnion | ''`

Example:

```ts
optional: {
  only_unmapped: '' as boolean | '',
  amount: '' as number | '',
},
coerceParams: {
  only_unmapped: 'boolean',
  amount: 'number',
},
```

Rule:

- use `coerceParams` first
- use `codecs` only when the conversion itself is custom

## When to Use `protectedParams`

Use `protectedParams` when a value should stay shareable in the URL but not be immediately obvious to users.

```ts
protectedParams: {
  commerce_id: true,
  user_id: {
    serialize: (value) => `safe-${String(value)}`,
    parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '').replace(/^safe-/, ''),
  },
}
```

Behavior:

- `true` uses built-in `base64url`
- object form lets you override `serialize` and/or `parse`
- `getParams({ convert: true })` returns the decoded value
- `getParams({ convert: false })` returns the raw URL value

Important:

- this is obfuscation, not security
- do not treat it as encryption
- do not place truly sensitive secrets in query params

## When to Use `forceParams`

Good use:

```ts
forceParams: {
  limit: 20,
  entity_type: 'commerce',
}
```

Bad use:

```ts
forceParams: {
  page: 1,
}
```

Use `forceParams` for values that must not be user-controlled. Avoid forcing keys that are supposed to change during normal interaction.

## URL Cleanliness

Use these knobs together:

```ts
omitParamsByValues: ['all', 'default'],
unknownParamsPolicy: 'preserve',
historyMode: 'replace',
```

Use them when:

- `omitParamsByValues` should hide non-informative values
- `unknownParamsPolicy: 'preserve'` should keep external tracking or partner params
- `historyMode: 'replace'` should avoid history spam while typing

## Arrays and Multi-Select Filters

For tags and multi-select filters, declare a real array in the contract.

```ts
type CommerceTag = 'featured' | 'verified' | 'new'

export const paramsCatalog = {
  mandatory: {
    page: 1,
  },
  optional: {
    search: '',
    tags: [] as CommerceTag[],
  },
}
```

```tsx
useMagicSearchParams({
  ...paramsCatalog,
  arraySerialization: 'repeat',
})
```

```tsx
updateParams({ newParams: { tags: 'featured' } })
updateParams({ newParams: { tags: ['featured', 'verified'] } })
```

Use:

- `csv` for `tags=a,b`
- `repeat` for `tags=a&tags=b`
- `brackets` for `tags[]=a&tags[]=b`

## Reset Rules and Pagination

Reset page or cursor automatically when filter inputs change.

```tsx
useMagicSearchParams({
  mandatory: { page: 1, limit: 20 },
  optional: { search: '', status: '', cursor: '' },
  resetOnChange: {
    search: ['page', 'cursor'],
    status: ['page', 'cursor'],
  },
  paginationStrategy: {
    mode: 'page',
    pageKey: 'page',
  },
})
```

Supported pagination modes:

- `page`
- `offset`
- `cursor`

## When to Use `codecs`

Use codecs when conversion is truly custom, not just ambiguous.

Examples:

- trimmed search text
- lowercase normalization
- opaque cursor formatting
- JSON-like payloads
- date serialization/parsing

```tsx
useMagicSearchParams({
  mandatory: { page: 1 },
  optional: { q: '', cursor: '' },
  codecs: {
    q: {
      parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '').trim(),
      serialize: (value) => String(value ?? '').trim().toLowerCase(),
    },
    cursor: {
      parse: (value) => (Array.isArray(value) ? value[0] : value ?? ''),
    },
  },
})
```

## Agent Instructions

When generating code for this library:

- define the params contract in a local constant first
- spread that constant into `useMagicSearchParams`
- prefer `defaultParams: paramsX.mandatory` when the page must always boot with required keys
- prefer `forceParams` only for non-user-controllable values
- prefer `coerceParams` before `codecs`
- prefer `getParams({ convert: true, forRequest: true })` for React Query and API requests
- prefer `protectedParams` for obfuscated shareable IDs
- keep examples and docs in English

## Validation Commands

- `pnpm run typecheck`
- `pnpm test`
- `pnpm run build`

[![Version](https://img.shields.io/npm/v/react-magic-search-params?style=flat-square&color=blue)](https://www.npmjs.com/package/react-magic-search-params)
[![Downloads](https://img.shields.io/npm/dm/react-magic-search-params?style=flat-square&color=green)](https://www.npmjs.com/package/react-magic-search-params)
[![License: MIT](https://img.shields.io/npm/l/react-magic-search-params?style=flat-square&color=yellow)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue)](https://react.dev)

# react-magic-search-params

![react-magic-search-params hero](https://raw.githubusercontent.com/Gabriel117343/react-magic-search-params/main/public/hero.png)

Advanced, typed, and centralized query params management for React Router.

## Installation

```bash
npm install react-magic-search-params
```

## Table of Contents 📑

1. [General Introduction](#general-introduction)
   1.1 [Hook Purpose](#hook-purpose)
   1.2 [Implementation Context](#implementation-context)
2. [Accepted Parameter Types](#accepted-parameter-types)
   2.1 [mandatory (Required)](#mandatory-required)
   2.2 [optional (Optional)](#optional-optional)
   2.3 [defaultParams](#defaultparams)
   2.4 [forceParams](#forceparams)
   2.5 [omitParamsByValues](#omitparamsbyvalues)
   2.6 [arraySerialization](#arrayserialization)
  2.7 [coerceParams](#coerceparams)
3. [Usage Recommendation with a Constants File](#usage-recommendation-with-a-constants-file)
4. [Main Functions](#main-functions)
   4.1 [getParams](#getparams)
   4.2 [updateParams](#updateparams)
   4.3 [clearParams](#clearparams)
  4.4 [pagination helpers](#pagination-helpers)
5. [Key Features and Benefits](#key-features-and-benefits)
6. [Usage Example & Explanations](#usage-example--explanations)
7. [Array Serialization in the URL (new)](#array-serialization-in-the-url-new)
8. [Best Practices and Considerations](#best-practices-and-considerations)
9. [Advanced Options](#advanced-options)
10. [Unit Tests with Vitest](#unit-tests-with-vitest)
11. [Conclusion](#conclusion)

---

![URL state comic overview](https://raw.githubusercontent.com/Gabriel117343/react-magic-search-params/main/public/comic-url-state.png)


## General Introduction

### Hook Purpose

`useMagicSearchParams` centralizes how your app reads, converts, and writes query parameters.

It is especially useful for pages that depend on URL state, such as:

- pagination (`page`, `page_size`)
- filtering (`status`, `tags`, `only_is_active`)
- searching (`search`)
- sorting (`order`)

Without a shared abstraction, each page usually re-implements parsing and update logic differently. This hook solves that by enforcing one typed contract per view.

> [!NOTE]
> Because this hook relies on `react-router-dom`, your app must be rendered inside `BrowserRouter` or `RouterProvider`.

<details>
<summary><strong>Before (manual URL handling) ❌</strong></summary>

```tsx
import { useSearchParams } from 'react-router-dom';

export function BeforeHookExample() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '10', 10);
  const search = searchParams.get('search') || '';

  function handleNextPage() {
    searchParams.set('page', String(page + 1));
    setSearchParams(searchParams);
  }

  return (
    <div>
      <p>Page: {page}</p>
      <p>Page size: {pageSize}</p>
      <p>Search: {search}</p>
      <button onClick={handleNextPage}>Next page</button>
    </div>
  );
}
```

</details>

<details>
<summary><strong>After (typed + safer) ✅</strong></summary>

```tsx
import { useMagicSearchParams } from 'react-magic-search-params';

const paramsUsers = {
  mandatory: { page: 1, page_size: 10 as const, only_is_active: false },
  optional: { search: '', order: '' as 'asc' | 'desc' | '' },
};

export function AfterHookExample() {
  const { getParams, updateParams } = useMagicSearchParams({
    ...paramsUsers,
    defaultParams: paramsUsers.mandatory,
    forceParams: { page_size: 10 },
    omitParamsByValues: ['all', 'default'],
  });

  const { page, search } = getParams({ convert: true });

  function handleNextPage() {
    updateParams({ newParams: { page: (page ?? 1) + 1 } });
  }

  return (
    <div>
      <p>Page: {page}</p>
      <p>Search: {search}</p>
      <button onClick={handleNextPage}>Next page</button>
    </div>
  );
}
```

</details>

### Implementation Context

In 2026, this is still a real practical problem for many apps. It is not a React Router bug; it is a natural consequence of URL semantics:

- query strings are string-based by design
- each screen often re-implements conversion logic (`string` to `number`, `boolean`, arrays)
- defaults and forced values can drift between components
- repeated updates can create noisy, inconsistent query states

`useMagicSearchParams` addresses this by:

- defining a single source of truth for params per page
- preserving predictable ordering in the URL
- converting values to original types when reading
- supporting omission rules to keep URLs clean

## Accepted Parameter Types

### mandatory (Required)

Parameters that your page needs to work reliably, such as `page` and `page_size`.

These keys are always part of your params contract.

### optional (Optional)

Parameters that may or may not exist, such as `search`, `order`, or extra filters.

Optional params are useful when you only want values in the URL if they carry meaningful state.

### defaultParams

Initial values the hook writes when the page is loaded.

Useful when the view should boot with a known query state even if the incoming URL has missing values.

### forceParams

Protected values that should not be overridden by user-provided query values.

Typical use case: enforce `page_size: 10` to avoid unsupported pagination sizes.

### omitParamsByValues

Removes params if their value is considered non-informative.

Supported values are: `all`, `default`, `unknown`, `none`, `void`.

This keeps URLs shorter and easier to read.

### arraySerialization

Controls how array params are represented in the URL:

- `csv` -> `tags=react,node`
- `repeat` -> `tags=react&tags=node`
- `brackets` -> `tags[]=react&tags[]=node`

### coerceParams

Use `coerceParams` when a key cannot be inferred correctly from runtime defaults (for example `boolean | ''` or `number | ''`).

This lets you provide explicit conversion hints without writing full codecs.

```ts
const paramsGirosMapping = {
  mandatory: {
    page: 1,
    page_size: 50 as const,
  },
  optional: {
    search: '',
    rubro: '',
    only_unmapped: '' as boolean | '',
  },
};

useMagicSearchParams({
  ...paramsGirosMapping,
  coerceParams: {
    only_unmapped: 'boolean',
  },
});
```

Supported coercion hints: `string`, `number`, `boolean`, `array`.

For optional boolean unions declared as `boolean | ''` with default `''`, boolean coercion keeps `''` for absent, empty, or invalid URL values instead of forcing `false`. This preserves a clean "not selected" filter state.

Use `getParams({ convert: true, forRequest: true })` when you want the same contract sanitized for backend requests. `coerceParams` solves runtime conversion, while `forRequest` removes empty request values like `''`, `null`, and `undefined`.

### protectedParams

Use `protectedParams` when a param should appear obfuscated in the URL but still be read normally by the hook.

This is useful for shareable links with active filters such as IDs:

```ts
useMagicSearchParams({
  mandatory: { page: 1 },
  optional: { commerce_id: '', user_id: '' },
  protectedParams: {
    commerce_id: true,
    user_id: {
      serialize: (value) => `safe-${String(value)}`,
      parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '').replace(/^safe-/, ''),
    },
  },
});
```

- `true` uses the built-in `base64url` obfuscation
- object form lets you override `serialize` and/or `parse`
- `getParams({ convert: true })` returns the de-obfuscated value
- `getParams({ convert: false })` returns the raw URL value

> [!WARNING]
> `protectedParams` is for obfuscation and DX, not real security or encryption.

For arrays, prefer declaring real array defaults in the contract (for example `tags: []`). In that contract shape, `coerceParams: { key: 'array' }` works with query-array formats (`csv`, `repeat`, `brackets`). A custom codec is only needed when a key is modeled as a string that contains JSON-like array text (for example `"[]"`).

## Usage Recommendation with a Constants File 📁

Define one constants file per view/screen.

This pattern gives you:

- one source of truth for that page's query contract
- better autocomplete and stricter TypeScript checks
- easier maintenance as filters evolve

> [!NOTE]
> This way TypeScript can infer the types of the query parameters and their default values to manage them.

```ts
type UserTag = 'react' | 'node' | 'typescript' | 'javascript';
type UserOrder = 'role' | 'date' | '';

export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const,
    only_is_active: false,
    tags: [] as UserTag[],
  },
  optional: {
    search: '',
    order: '' as UserOrder,
  },
};
```

> [!TIP]
> By **explicitly declaring** the types (instead of relying solely on type inference), you enable TypeScript to provide **stricter type checking**. This ensures that only the defined values are allowed for each parameter, helping to avoid accidental assignment of invalid values.

## Main Functions

### getParams

Returns current query params as an object.

`getParams` follows your declared contract (`mandatory` + `optional`) and only exposes known keys from that contract.

`unknownParamsPolicy` (default: `drop`) controls how unknown keys are preserved or dropped in URL operations; it does not add unknown keys to `getParams` output.

- `convert: true` (default): values are converted to inferred original types
- `convert: false`: values are returned in URL-oriented format
- `forRequest: true`: after conversion, omits keys whose value is `''`, `null`, or `undefined`

```tsx
const { page, only_is_active, tags } = getParams({ convert: true });
const tagsRaw = getParams({ convert: false }).tags;
const apiParams = getParams({ convert: true, forRequest: true });
```

`forRequest` is useful when the same screen contract feeds a backend call. It keeps meaningful falsy values like `false` and `0`, keeps mandatory params such as pagination keys, and does not reuse `omitParamsByValues`.

You can also read a single key:

```tsx
const tags = getParam('tags', { convert: true });
```

### updateParams

Safely updates URL params.

- `newParams`: keys to set/update
- `keepParams`: optional map to explicitly remove selected keys from previous state (`false`)
- `historyMode`: optional per-call override (`push` or `replace`)
- `newParams` also supports functional updater

Type note:

- `updateParams` preserves the declared contract types (including string unions), so TypeScript autocomplete stays precise.
- For array params, `updateParams` accepts either an array or a single typed item (toggle behavior).
- You can pass `''` as a remove signal for optional keys; omitted values are removed from the URL.

```tsx
updateParams({
  newParams: { page: 1, search: 'john' },
});

updateParams({
  newParams: (prev) => ({ page: (prev.page ?? 1) + 1 }),
});

updateParams((prev) => ({
  newParams: { page: (prev.page ?? 1) + 1 },
  keepParams: { search: false },
  historyMode: 'replace',
}));
```

`keepParams` is not required for keys you want to keep. Use it only when you want to explicitly remove a key (`false`).

### clearParams

Clears params and optionally keeps mandatory ones.

```tsx
clearParams();
clearParams({ keepMandatoryParams: false });
```

Optional advanced subscription:

```tsx
const unsubscribe = onChange('search', [
  ({ previousValue, currentValue }) => {
    // side effects on search changes
    console.log(previousValue, currentValue);
  },
]);

// Later
unsubscribe();
```

### pagination helpers

The hook now returns `pagination` helpers to reduce repeated navigation code:

- `pagination.next(cursor?)`
- `pagination.prev()`
- `pagination.reset()`
- `pagination.setCursor(cursor)`

Configure with `paginationStrategy`:

```tsx
const { pagination } = useMagicSearchParams({
  mandatory: { page: 1, page_size: 10 },
  optional: { search: '', cursor: '' },
  paginationStrategy: { mode: 'page', pageKey: 'page' },
});

pagination.next();
pagination.prev();
pagination.reset();
```

## Key Features and Benefits

- typed query state with better DX
- request-ready params from the same screen contract
- centralized defaults, force rules, and omission rules
- cleaner URL output and predictable key order
- array support with three serialization strategies
- declarative reset rules for dependent params
- built-in pagination helpers (page, offset, cursor)
- unknown param policy (`drop` / `preserve`)
- functional updater support for complex transitions
- smoother React Query / TanStack Query integration
- better scalability across medium and large React Router apps

## Usage Example & Explanations

```tsx
import { useEffect } from 'react';
import { useMagicSearchParams } from 'react-magic-search-params';
import { paramsUsers } from './constants/defaultParamsPage';

export function FilterUsers() {
  const { searchParams, getParams, updateParams, clearParams, onChange } =
    useMagicSearchParams({
      ...paramsUsers,
      defaultParams: paramsUsers.mandatory,
      forceParams: { page_size: 10 },
      omitParamsByValues: ['all', 'default'],
      arraySerialization: 'repeat',
    });

  const { page, search, order, tags } = getParams({ convert: true });

  function handleSearchChange(nextSearch: string) {
    updateParams({ newParams: { page: 1, search: nextSearch } });
  }

  function handleOrderChange(nextOrder: string) {
    updateParams({
      newParams: { order: nextOrder },
      keepParams: { search: true },
    });
  }

  function handleTagToggle(tag: string) {
    updateParams({ newParams: { tags: tag } });
  }

  useEffect(() => {
    onChange('search', [
      () => {
        // Trigger analytics, cache invalidation, etc.
      },
    ]);
  }, [onChange]);

  return (
    <>
      <p>URL: {searchParams.toString()}</p>
      <p>Page: {page}</p>
      <p>Search: {search}</p>
      <p>Order: {order}</p>
      <p>Tags: {Array.isArray(tags) ? tags.join(', ') : ''}</p>

      <button onClick={() => handleSearchChange('john')}>Search john</button>
      <button onClick={() => handleOrderChange('date')}>Order by date</button>
      <button onClick={() => handleTagToggle('react')}>Toggle react tag</button>
      <button onClick={() => clearParams({ keepMandatoryParams: true })}>
        Reset filters
      </button>
    </>
  );
}
```

### React Query Integration

```tsx
import { useQuery } from '@tanstack/react-query';
import { useMagicSearchParams } from 'react-magic-search-params';

type CommerceStatus = 'draft' | 'approved' | 'rejected';

const paramsAdminCommercesList = {
  mandatory: {
    page: 1,
    limit: 20 as const,
  },
  optional: {
    search: '',
    status: '' as CommerceStatus | '',
    is_verified: '' as boolean | '',
    is_company_verified: '' as boolean | '',
  },
  coerceParams: {
    page: 'number',
    limit: 'number',
    is_verified: 'boolean',
    is_company_verified: 'boolean',
  } as const,
};

export function AdminCommercesList() {
  const { getParams, updateParams } = useMagicSearchParams({
    ...paramsAdminCommercesList,
    defaultParams: paramsAdminCommercesList.mandatory,
  });

  const filters = getParams({ convert: true });
  const queryParams = getParams({ convert: true, forRequest: true });

  const commercesQuery = useQuery({
    queryKey: ['admin-commerces', queryParams],
    queryFn: () => listAdminCommerces(queryParams),
  });

  function handleSearchChange(search: string) {
    updateParams({ newParams: { page: 1, search }, historyMode: 'replace' });
  }

  return (
    <>
      <p>Current search: {filters.search}</p>
      <button onClick={() => handleSearchChange('bakery')}>Search bakery</button>
      <pre>{JSON.stringify(commercesQuery.data, null, 2)}</pre>
    </>
  );
}
```

This split is intentional:

- `getParams({ convert: true })` is UI/state-friendly and preserves empty filter state.
- `getParams({ convert: true, forRequest: true })` is backend-friendly and avoids repetitive request cleanup.

## Array Serialization in the URL (new)

`arraySerialization` lets you adapt the same frontend state to different backend expectations.

| Mode | URL Example |
| --- | --- |
| `csv` | `tags=react,node,typescript` |
| `repeat` | `tags=react&tags=node&tags=typescript` |
| `brackets` | `tags[]=react&tags[]=node&tags[]=typescript` |

### Why this matters

- backend compatibility without custom per-page serialization code
- consistent conversion flow when reading params
- simpler components with less URL plumbing

### Behavior notes

- when sending a string value for an array key, the hook toggles that entry in the array
- when sending an array value, the hook stores a deduplicated version of the provided array

## Best Practices and Considerations

1. Validate sensitive values in the backend as well.
2. Keep the constants contract updated when product requirements change.
3. Prefer one params constants file per view to avoid accidental contract drift.
4. Use `forceParams` for limits that should never be user-controlled.
5. Use `omitParamsByValues` to avoid noisy URLs with non-informative values.

### Deep Links With Mandatory Params

If your sidebar/menu routes should always open with a known mandatory URL state, generating links with mandatory params is a good pattern.

```ts
const assignMandatoryParams = (
  paramsMandatory: Record<string, string | number | boolean>
) => {
  const stringParams: Record<string, string> = {}
  for (const [key, val] of Object.entries(paramsMandatory)) {
    stringParams[key] = String(val)
  }
  return new URLSearchParams(stringParams).toString()
}

const path = `/admin/categories/list?${assignMandatoryParams(paramsCategoriesList.mandatory)}`
```

Then, inside the page hook, keep this contract-first setup:

```tsx
const { getParams, updateParams } = useMagicSearchParams({
  ...paramsUsers,
  defaultParams: paramsUsers.mandatory,
  forceParams: { page_size: 10 },
})
```

Notes:

- `defaultParams: paramsUsers.mandatory` ensures mandatory keys are present when the page boots.
- Use `forceParams` for non-user-controllable keys (for example `page_size`), not necessarily all mandatory keys.
- Forcing all mandatory keys can block legitimate runtime changes (for example `page` in pagination).

## Advanced Options

### 1. Custom codecs

Use codecs when default conversion is not enough (opaque cursor, trimmed `q`, date parsing, etc.).

```tsx
const { getParams, updateParams } = useMagicSearchParams({
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
});

const { q } = getParams({ convert: true });
updateParams({ newParams: { q: '  React  ' } });
```

### 2. Declarative resetOnChange

Reset dependent params automatically when a source param changes.

```tsx
useMagicSearchParams({
  mandatory: { page: 1, page_size: 10 },
  optional: { search: '', order: '', cursor: '' },
  resetOnChange: {
    search: ['page', 'cursor'],
    order: ['page'],
  },
});
```

### 3. Pagination strategy

Supported modes:

- `page` (classic page/page_size)
- `offset` (offset/limit)
- `cursor` (opaque cursor)

```tsx
useMagicSearchParams({
  mandatory: { offset: 0, limit: 20 },
  optional: { q: '' },
  paginationStrategy: {
    mode: 'offset',
    offsetKey: 'offset',
    limitKey: 'limit',
  },
});
```

### 4. Unknown params policy

Define what happens with URL params not declared in `mandatory` / `optional`:

- `drop` (default)
- `preserve`

```tsx
useMagicSearchParams({
  mandatory: { page: 1 },
  optional: { q: '' },
  unknownParamsPolicy: 'preserve',
});
```

### 5. Global history mode

Set default navigation behavior for updates:

```tsx
useMagicSearchParams({
  mandatory: { page: 1 },
  optional: { q: '' },
  historyMode: 'replace',
});
```

## Unit Tests with Vitest

Run all tests:

```bash
npm test
```

Run type checks:

```bash
npm run typecheck
```

Run one test file:

```bash
npm test -- test/useMagicSearchParams.test.tsx
```

## Conclusion

`react-magic-search-params` gives you a reliable, typed, and scalable query param workflow for React Router applications.

It keeps URL behavior predictable while reducing duplicated logic across screens.

If this library helps you, consider giving it a star ⭐️ on GitHub!

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

- `convert: true` (default): values are converted to inferred original types
- `convert: false`: values are returned in URL-oriented format

```tsx
const { page, only_is_active, tags } = getParams({ convert: true });
const tagsRaw = getParams({ convert: false }).tags;
```

You can also read a single key:

```tsx
const tags = getParam('tags', { convert: true });
```

### updateParams

Safely updates URL params.

- `newParams`: keys to set/update
- `keepParams`: explicitly keep/remove selected keys from previous state
- `historyMode`: optional per-call override (`push` or `replace`)
- `newParams` also supports functional updater

```tsx
updateParams({
  newParams: { page: 1, search: 'john' },
  keepParams: { order: true },
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
- centralized defaults, force rules, and omission rules
- cleaner URL output and predictable key order
- array support with three serialization strategies
- declarative reset rules for dependent params
- built-in pagination helpers (page, offset, cursor)
- unknown param policy (`drop` / `preserve`)
- functional updater support for complex transitions
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
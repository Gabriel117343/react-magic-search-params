[![Version](https://img.shields.io/npm/v/react-magic-search-params?style=flat-square&color=blue)](https://www.npmjs.com/package/react-magic-search-params)
[![Downloads](https://img.shields.io/npm/dm/react-magic-search-params?style=flat-square&color=green)](https://www.npmjs.com/package/react-magic-search-params)
[![License: MIT](https://img.shields.io/npm/l/react-magic-search-params?style=flat-square&color=yellow)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue)](https://react.dev)

# react-magic-search-params

![react-magic-search-params hero](https://raw.githubusercontent.com/Gabriel117343/react-magic-search-params/main/public/hero.png)

Type-safe query/search parameter management for React Router, built as an extension over useSearchParams.

Define one params contract per screen (`mandatory` + `optional`) so URL state stays predictable and strongly typed.

## Installation

```bash
npm install react-magic-search-params
```

## Compatibility

- React 18.x and 19.x
- React Router DOM 6+
- Node.js 18+

## Basic Usage

```tsx
import { useMagicSearchParams } from 'react-magic-search-params';

const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const,
    only_is_active: false,
    tags: ['uno', 'dos', 'tres'] as string[],
  },
  optional: {
    search: '',
    order: '',
  },
};

const { getParams, updateParams, clearParams } = useMagicSearchParams({
  ...paramsUsers,
  defaultParams: paramsUsers.mandatory,
  forceParams: { page_size: 10 },
  arraySerialization: 'csv',
  omitParamsByValues: ['all', 'default'],
});

const { page, search, tags } = getParams({ convert: true });
const requestParams = getParams({ convert: true, forRequest: true });

updateParams({ newParams: { page: (page ?? 1) + 1 } });
updateParams({ newParams: { tags: 'react' } });
clearParams({ keepMandatoryParams: true });
```

If you have ambiguous optional unions (for example `boolean | ''`), use `coerceParams`:

```tsx
const { getParams } = useMagicSearchParams({
  mandatory: { page: 1, page_size: 50 },
  optional: { only_unmapped: '' as boolean | '' },
  coerceParams: { only_unmapped: 'boolean' },
});

const { only_unmapped } = getParams({ convert: true });
```

For optional boolean unions with `''` as default, coercion keeps `''` for absent/empty/invalid URL values and returns booleans only for valid `true`/`false` inputs.

When you need backend-ready params, use:

```tsx
const queryParams = getParams({ convert: true, forRequest: true });
```

`coerceParams` solves runtime conversion. `forRequest` solves request sanitization by omitting `''`, `null`, and `undefined` while keeping useful values like `false`, `0`, and mandatory pagination keys.

When you want IDs or similar values to be shareable in the URL without being immediately obvious, use `protectedParams`:

```tsx
const { getParams } = useMagicSearchParams({
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

const decoded = getParams({ convert: true });
const rawUrlValues = getParams({ convert: false });
```

`true` uses the built-in `base64url` obfuscation. This is obfuscation for DX/shareable links, not real encryption or security.

For arrays, prefer real array defaults in your contract (`tags: []`). In that contract shape, `coerceParams: 'array'` works for query-array formats (`csv`, `repeat`, `brackets`). Use codecs only when a key is modeled as a string that carries JSON-like array text (for example `"[]"`).

This works especially well with React Query / TanStack Query because you can use the same params contract both for UI state and for API requests without repetitive cleanup code.

```tsx
const { getParams } = useMagicSearchParams({
  mandatory: { page: 1, limit: 20 },
  optional: {
    search: '',
    status: '' as 'approved' | 'rejected' | '',
    is_verified: '' as boolean | '',
  },
  coerceParams: {
    page: 'number',
    limit: 'number',
    is_verified: 'boolean',
  },
});

const uiParams = getParams({ convert: true });
const apiParams = getParams({ convert: true, forRequest: true });

useQuery({
  queryKey: ['commerces', apiParams],
  queryFn: () => listAdminCommerces(apiParams),
});
```

If your menu/sidebar links should always open with mandatory URL state, prebuild links with mandatory params and keep `defaultParams` in the page hook. Use `forceParams` only for non-user-controllable keys (for example `page_size`), not necessarily all mandatory keys.

## API

- `getParams({ convert?: boolean, forRequest?: boolean })`
- `getParam(key, { convert?: boolean })`
- `updateParams({ newParams?, keepParams? })`
- `clearParams({ keepMandatoryParams?: boolean })`
- `onChange(paramName, callbacks[])`

## Full Documentation

The full guide, advanced patterns, and detailed explanations are in the repository README:

https://github.com/Gabriel117343/react-magic-search-params

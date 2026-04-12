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

For arrays, prefer real array defaults in your contract (`tags: []`). In that contract shape, `coerceParams: 'array'` works for query-array formats (`csv`, `repeat`, `brackets`). Use codecs only when a key is modeled as a string that carries JSON-like array text (for example `"[]"`).

If your menu/sidebar links should always open with mandatory URL state, prebuild links with mandatory params and keep `defaultParams` in the page hook. Use `forceParams` only for non-user-controllable keys (for example `page_size`), not necessarily all mandatory keys.

## API

- `getParams({ convert?: boolean })`
- `getParam(key, { convert?: boolean })`
- `updateParams({ newParams?, keepParams? })`
- `clearParams({ keepMandatoryParams?: boolean })`
- `onChange(paramName, callbacks[])`

## Full Documentation

The full guide, advanced patterns, and detailed explanations are in the repository README:

https://github.com/Gabriel117343/react-magic-search-params
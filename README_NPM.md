[![Version](https://img.shields.io/npm/v/react-magic-search-params?style=flat-square&color=blue)](https://www.npmjs.com/package/react-magic-search-params)
[![Downloads](https://img.shields.io/npm/dm/react-magic-search-params?style=flat-square&color=green)](https://www.npmjs.com/package/react-magic-search-params)
[![License: MIT](https://img.shields.io/npm/l/react-magic-search-params?style=flat-square&color=yellow)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-%5E16.8.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-%5E3.8-blueviolet)](https://www.typescriptlang.org/)
[![Issues](https://img.shields.io/github/issues/user/react-magic-search-params?style=flat-square&color=red)](https://github.com/user/react-magic-search-params/issues)
# `react-magic-search-params` 🪄 <img src="https://static-production.npmjs.com/255a118f56f5346b97e56325a1217a16.svg" width="20px" height="20px" title="This package contains built-in TypeScript declarations" alt="TypeScript icon, indicating that this package has built-in type declarations">

<img src="https://github.com/user-attachments/assets/1f437570-6f30-4c10-b27d-b876f5c557bd" alt="Screenshot" width="800px" />

Centralize and type your search parameters (query params) handling in React Router v6+ with TypeScript.

---

## 📖 Introduction

`useMagicSearchParams` allows you to:
- Define **required** and **optional** parameters in one place.
- Get typed values (`number`, `string`, `boolean`, `array`).
- Update or clear the URL without repeating logic.
- Serialize arrays in `csv`, `repeat` or `brackets` format.
- Force values (`forceParams`) or omit neutral values (`omitParamsByValues`).

---

## 🚀 Installation

```bash
npm install react-magic-search-params
```

## Basic Usage

```jsx
import { useMagicSearchParams } from 'react-magic-search-params';
import { paramsUsers } from './constants';

const { getParams, updateParams, clearParams } = useMagicSearchParams({
  ...paramsUsers,
  defaultParams: paramsUsers.mandatory,
  forceParams:   { page_size: 10 },
  omitParamsByValues: ['all','default'],
  arraySerialization: 'csv',
});

// Get typed values:
const { page, search, tags } = getParams({ convert: true });

// Change page:
updateParams({ newParams: { page: (page ?? 1) + 1 } });

// Clear filters:
clearParams();
```

### 📁 Recommended Constants File

```ts
type UserTagOptions = 'tag1' | 'tag2' | 'react' | 'node' | 'typescript' | 'javascript';
type OrderUserProps = 'role' | 'date';

export const paramsUsers = {
  mandatory: { 
    page: 1,
    page_size: 10 as const,
    only_is_active: false,
  },
  optional:  { 
    order: '' as OrderUserProps,
    search: '',
    tags: ['tag1','tag2'] as Array<UserTagOptions>
  },
};
```

### 🌟 Key Functions

- `getParams(opts?)` → returns typed params.
- `updateParams({ newParams, keepParams? })` → updates the URL.
- `clearParams({ keepMandatoryParams? })` → clears parameters.
- `onChange(key, callbacks[])` → subscribes to parameter changes.

---

### 🔄 Array Serialization

| Method     | Example URL                          |
|------------|--------------------------------------|
| `csv`      | `tags=tag1,tag2,tag3`                |
| `repeat`   | `tags=tag1&tags=tag2&tags=tag3`      |
| `brackets` | `tags[]=tag1&tags[]=tag2&tags[]=tag3` |

## 🔗 Complete Documentation

Find the complete guide and examples on GitHub:  
https://github.com/Gabriel117343/react-magic-search-params

If you found this library helpful, please give it a ⭐️ on GitHub!
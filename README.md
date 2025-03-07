# `react-magic-search-params` 🪄 <img src="https://static-production.npmjs.com/255a118f56f5346b97e56325a1217a16.svg" width="20px" height="20px" title="This package contains built-in TypeScript declarations" alt="TypeScript icon, indicating that this package has built-in type declarations" class="aa30d277 pl3" data-nosnippet="true">

<img src="https://github.com/user-attachments/assets/1f437570-6f30-4c10-b27d-b876f5c557bd" alt="Screenshot" width="800px" />

# Installation

To install this library, run:

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

5. [Key Features and Benefits](#key-features-and-benefits)
6. [Usage Example & Explanations](#usage-example--explanations)
7. [Array Serialization in the URL (new)](#array-serialization-in-the-url-new)
8. [Best Practices and Considerations](#best-practices-and-considerations-)
9. [Unit Tests with Vitest](#unit-tests-with-vitest)
10. [Conclusion](#conclusion-)

---


# General Introduction

## Hook Purpose 🎯

The **`useMagicSearchParams` hook** enables **advanced** and **centralized** management of URL parameters.  
It allows you to define and unify logic to filter, paginate, or perform any other operation that depends on query parameters (e.g. `?page=1&page_size=10`).

**Before (no autocomplete or typing)**
This section quickly illustrates how parameter handling changed before using the hook and how it simplifies with `useMagicSearchParams`.

<details>
<summary>Before (manual URL handling) ❌</summary>

```jsx
// filepath: /example/BeforeHook.tsx

export const BeforeHookExample = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Manually extract values (no typing or validation)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('page_size') || '10', 10)
  const search = searchParams.get('search') || ''

  const handleChangePage = (newPage: number) => {
    searchParams.set('page', newPage.toString())
    setSearchParams(searchParams)
  }

  return (
    <div>
      <p>Page: {page}</p>
      <p>page_size: {pageSize}</p>
      <p>search: {search}</p>
      {/* Button to move to the next page */}
      <button onClick={() => handleChangePage(page + 1)}>Next page</button>
    </div>
  )
}
```

</details> 
</details> <details> <summary>After (with autocomplete and safety) ✅</summary>

```jsx
// filepath: /example/AfterHook.tsx
import { useMagicSearchParams } from "@/hooks/useMagicSearchParams";
import { paramsUsers } from "@/constants/DefaultParamsPage";

export const AfterHookExample = () => {
  // context of an external API...
  const { searchParams, getParams, updateParams } = useMagicSearchParams({
    ...paramsUsers,
    forceParams: { page_size: paramsUsers.mandatory.page_size }, // limited to 10
    omitParamsByValues: ["all", "default"],
  });

  useEffect(() => {
    const paramsUser = getParams();

    async function loadUsers() {
      toast.loading("Loading...", { id: "loading" });

      console.log({ paramsUser });
      const { success, message } = await getUsersContext(paramsUser);
      if (success) {
        toast.success(message ?? "Users retrieved", { id: "loading" });
        setLoading(false);
      } else {
        toast.error(message ?? "Unexpected error retrieving the users", {
          id: "loading",
        });
      }
    }
    loadUsers();
  }, [searchParams]);

  // getParams returns typed and converted data with autocomplete
  const { page, page_size, search } = getParams({ convert: true });

  const tags = getParam("tags", { convert: false })

  const handleNextPage = () => {
    const nextPage = { page: (page ?? 1) + 1 };
    updateParams({ newParams: nextPage }); // by default, the rest of the query parameters are preserved
  };

  return (
    <div>
      {/* Note: typically this input will be “uncontrolled,” as you often use a “debounce” approach to delay updates */}
      <input
        defaultValue={search}
        placeholder="Search by..."
        onChange={handleSearchChange}
      />
      <p>Current page: {page}</p>
      <p>Page size: {page_size}</p>
      <p>Search: {search}</p>
      <button onClick={handleNextPage}>Next page</button>
    </div>
  );
};
```

</details>

#### Additional Information 📋

1. **Strict Typing_**

- By defining “mandatory” and “optional” from a constants file, TypeScript infers the available keys in the U

2. **_Control en la URL_**

- “forceParams” enforces fixed values (preventing unnecessary API overloads).
  “omitParamsByValues” removes “all” or “default” parameters that don’t add real information..

3. **_Reuse in Different Views_**

- Each view can have its own mandatory and optional. This prevents code duplication for extracting and validating parameters.

4. **_Uniform URL Order_**

- ensures a predictable order (first “page”, then “page_size”, etc.)

### Implementation Context

1. **Avoid multiple sources of truth**: By centralizing logic in a single hook, code does not repeat in every file.
2. **Guarantee a Common Standard** All parameters (required or optional) are defined in a single place and reused in multiple places.
3. **Control the URL**: Prevents unwanted parameter injections and maintains a consistent order(ej. `?page=1&page_size=10` en instead ?`page_size=1000&page=1`).

### Accepted Parameter Typess

1. **Mandatory**:(Required)

- Typical example: Pagination (page, page_size)
- They must always exist in the URL for the view to work.

2. **Optional**:(Opcionales)

- Example: Search filters (search, order).
- They do not affect the **route** if they are not present.

3. **DefaultParams**:

- Automatically set when loading a component.
- Useful for `“default filters”` or initial settings.
- Unlike parameters added in links, e.g.  `sistema/lista?page=1&page_size=10`, , these load depending on the component (page) being visited, ensuring that the visited page always has default parameters, even if the user removes them. This ensures that **API** calls depending on URL parameters return correct data.

4. **ForceParams**:

- Enforce values that cannot be overwritten (e.g. page_size=10).
- Provides maximum safety while enhancing user experience (avoid page_size=1000).

5. **OmitParamsByValues**:(Parámetros omitidos por Valores)

- A list of values that, if detected, are omitted from the **URL** (e.g. ‘all’, ‘default’).
- Simplifies URLs by removing parameters that do not provide real information.
- Reserves space for other query parameters given potential URL limitations (depending on the browser in use).

6. **arraySerialization**:

- Allows arrays to be serialized in the **URL** through three different methods (csv, repeat, brackets).
- Enables updating them via two methods: toggle (add or remove) and passing an array of values (e.g. tags: [‘new1’, ‘new2’])
- Accessible through the **getParams** method to obtain string-type values (e.g. tags=one,two,three) or converted to their original type (e.g. `tags: [‘one’, ‘two’, ‘three’]`).

## 3 Usage Recommendation with a Constants File 📁

- Define the required and optional parameters in a single file (e.g. defaultParamsPage.ts).
- optionally add typing (normally you'll let **typescript** infer)
- **Beneficios**:
  - **_Greater consistency_**: Everything is centralized, meaning a single source of truth for the parameters of each page.
  - **_Safe typing_**: Guarantees autocomplete and reduces typos.

> [!NOTE]
> This way TypeScript can infer the types of the query parameters and their default values to manag

```typescript
type UserTagOptions = 'tag1' | 'tag2' | 'react' | 'node' | 'typescript' | 'javascript';
type OrderUserProps = 'role' | 'date';
// you can specify the values ​​to help typescript give you more typed
export const paramsCrimesDashboard = {
  mandatory: {
    days: 7,
  },
  optional: {},
};
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const,
    only_is_active: false,
  },
  optional: {
    order: "" as OrderUserProps;
    search: "",
    tags: ['tag1', 'tag2'] as Array<UserTagOptions>
  },
};
```

## 4 Main Functions ⚙️

### 4.1 getParams

Retrieves typed parameters from the URL and optionally converts them.
Useful to pull `“page”, “order”, “search”`, etc. without dealing with null values or incorrect types.

> [!NOTE]
> By default, the **react-router-dom** `useSearchParams` hook returns parameters as `string`, even if defined with another type (e.g. `number`). The `getParams` method solves this by keeping a reference to their original type.

<details>
<summary>Ejemplo de uso</summary>

```typescript
// Retrieving converted values
const { page, search } = getParams({ convert: true });
const tags = getParam("tags")
// tags = [tag1, tag2]

// Example: displaying parameters in console
console.log("Current page:", page); // number
console.log("Search:", search); // string | undefined
```

</details>

### 4.2 updateParams

Safely modifies URL parameters, respecting mandatory values; you may reset one value without losing the rest (e.g. set `page=1` while keeping `search`).

<details> 
<summary>Ejemplo de uso</summary>

```typescript
// Change page and keep the current order
updateParams({
  newParams: { page: 2 },
  keepParams: { order: true },
});

// Set a new filter and reset the page
updateParams({ newParams: { page: 1, search: "John" } });
```

</details>

### 4.3 clearParams

Resets the URL parameters, optionally keeping mandatory ones.
Allows you to “clear” the filters and return to the initial state.
<details> <summary>Ejemplo de uso</summary>

```typescript
// Clear everything and keep mandatory parameters
clearParams();

// Clear everything, including mandatory parameters
clearParams({ keepMandatoryParams: false });
```
</details>

### 4.4 onChange
The `onChange` function allows you to subscribe to changes in specific URL parameters. Each time the parameter changes, the associated callbacks will be executed. This is useful when you need to trigger updates or actions (such as API calls, validations, etc.) after a particular value changes.

> [!NOTE]
> Although you will usually want to call an API or trigger other events as soon as changes are detected in any of the URL parameters (by adding `searchParams` to the dependency array of `useEffect`), there are occasions where you may prefer more granular control and only react to specific parameters.


**Basic use**
```jsx
useEffect(() => {
  function fetchData() {
   
    // can be an call to API or any other operation  
    return new Promise((resolve) => {
      setTimeout(() => resolve('Information recibed'), 1500)
    })
  }

  function showData(data: string) {
    alert(`Data recibed: ${data}`)
  }

  function notifyChange() {
    console.log('Change detected in the parameter search')
  }

  onChange('search', [
    async () => {
      const data = await fetchData()
      showData(data)
    },
    notifyChange
  ])
}, [])
  // otr
```

### Usage Example & Explanations 🖥️💡

In the following example, we combine:

**mandatory**: Needed for pagination.
**optional**: Search and order parameters.
**forceParams**: Parameters that must not change
**omitParamsByValues**: Omits `all` or `default` values.

```jsx
// filepath: /c:/.../FilterUsers.tsx
import { useMagicSearchParams } from "@/hooks/UseMagicSearchParams";
import { paramsUsers } from "@constants/DefaultParamsPage";

export const FilterUsers = (props) => {
  const { searchParams, updateParams, clearParams, getParams } =
    useMagicSearchParams({
      ...paramsUsers,
      defaultParams: paramsUsers.mandatory,
      forceParams: { page_size: 1 },
      omitParamsByValues: ["all", "default"],
    });

   // Retrieve parameters converted to their original types
  const { page, search, order } = getParams({ convert: true });

  
  // Update: set page = 1 and change search
  const handleChangeSearch = (evt) => {
    updateParams({ newParams: { page: 1, search: evt.target.value } });
  };

 // Clear everything and keep mandatory parameters by default
  const handleReset = () => {
    clearParams();
  };
  const handleChangeOrder = (value) => {
    // if value is equal to 'all' it will be ommited 
    updateParams({ newParams: { order: value }, keepParams: { search: false }})
  }
  // ...
  return (
  <>
    {/** rest.. */}
    <select name="order" onChange={e => handleChangeOrder(e)}>
      <option value="all">Select tag</option>

      {/** map of tags..*/}
    </select>
      
  </>
  )
};
```

**En este componente:**

**_paramsUsers_**: defines the `mandatory` and `optional` objects.
**_forceParams_**: prevents “page*size” from being changed by the user.
**_omitParamsByValues**: discards values that do not provide real data (“all”, “default”)
**_getParams_**: returns typed values (numbers, booleans, strings, etc.).
**updateParams** and **clearParams** simplify URL update flows.

## 7 Serialización de Arrays en la URL 🚀

The **useMagicSearchParams** hook now allows for advanced and flexible handling of a`array-type parameters`, sending them to the `backend` in the format required. This is done via the **arraySerialization** option, which supports three techniques:

### Métodos de Serialización 🔄

- **csv**:  
  Serializes the array into a single comma-separated string.
  **Ejemplo:**  
  `tags=tag1,tag2,tag3`  
  Ideal when the backend expects a single string.

- **repeat**:  
  Sends each array element as a separate parameter.
  **Ejemplo:**  
  `tags=tag1&tags=tag2&tags=tag3`  
  _Perfect for APIs that handle multiple entries under the same key._

- **brackets**:  
  Uses bracket notation in the key for each element. 
  **Ejemplo:**  
  `tags[]=tag1&tags[]=tag2&tags[]=tag3`  
  _Useful for frameworks expecting this format (e.g. PHP)._

> [!TIP]
> When extracting `tags` with `getParams({ convert: true })` you get:
>
> - **Am String** if not conversion is specified (e.g, csv): `"tags=tag1,tag2,tag3"`
> - **An Array**  if conversion is used: `tags=['tag1', 'tag2', 'tag3']`  
>   _This improves consistency and typing in your application._

### dvantages and Benefits 🌟

- **Flexible Submission**:  
  Choose the method that best suits backend requirements.
  ✅ _Better compatibility with various systems._

- **Automatic Normalization**:  
  Keys arriving `tags[]` format normalize to `tags` to simplify handling.  
  ✅ _Easier iteration and conversion to original types._

- **Full URL Control**:  
  The hook consistently manages URL rewriting, reducing errors and keeping it readable.
  🔒 _Improves parameter security and control._

### Code Usage Examples 👨‍💻

```jsx
import { useMagicSearchParams } from "useMagicSearchParams";
import { paramsUsers } from "../src/constants/defaulParamsPage";

export default function App() {
  const { searchParams, getParams, updateParams, clearParams } = useMagicSearchParams({
    ...paramsUsers,
    defaultParams: paramsUsers.mandatory,
    arraySerialization: 'repeat', // You can switch to 'csv' or 'brackets' as needed.
    omitParamsByValues: ["all", "default"],
  });

  // Get converted parameters (for example, tags is retrieved as an array)
  const { tags, page } = getParams({ convert: true });

  const availableTags = ['react', 'node', 'typescript', 'javascript'];

  // Example: Update the tags array with toggle
  const handleTagToggle = (newTag: string) => {
    // if it exists, remove it; otherwise, add it
    updateParams({ newParams: { tags: newTag } });
  };

  // Pass an array of tags, useful for adding multiple filters at once
  const handleTagToggleArray = (newTags: string[]) => {
    // the hook ensures no duplicates by merging with existing ones
    updateParams({ newParams: { tags: [...tags, ...newTags] } });
  };

  return (
    <div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Select Tags:</h3>
        {availableTags.map(tag => {
          const isActive = Array.isArray(tags) && tags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-4 py-2 rounded-md border ${
                isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <p>Current tags: {JSON.stringify(tags)}</p>
      {/* Rest of the component */}
    </div>
  );
}
```

In this example, when using **repeat** serialization the `URL` result look like this:

- **(repeat) Mode**: `?page=1&page_size=10&only_is_active=false&tags=tag1&tags=tag2&tags=tag3`
- **(csv) Mode**: `?page=1&page_size=10&only_is_active=false&tags=tag1,tag2,tag3`
- **(brackets) Mode**: `?page=1&page_size=10&only_is_active=false&tags[]=tag1&tags[]=tag2&tags[]=tag3`

### This new functionality allows you to:

- Send arrays in a format that matches backend expectations.
- Centrally manage conversion and serialization, reducing complexity in individual components.
- Keep the URL clean and consistent, no matter which serialization method you choose.
- **Provide total control to the developer**: On how to transform or send parameters, allowing custom operations based on the backend.

### Why Is This Functionality Key? 🎯

- **Adaptable array submission to the backend:**
  Fits various formats servers may expect.
- **Reduced complexity in components:**
  Centralizes serialization logic, preventing code duplication.
- **Better user experience:**
  A clean, consistent URL makes debugging easier and improves usability.

## 8 Best Practices and Considerations ✅

1. **Validate sensitive parameters in the backend**:  Even though the hook protects on the frontend, the server must enforce its own limits.
2. **Keep types updated:**:  As requirements change, update `mandatory` and `optional` to avoid mismatches.
3. **One constants file per view**: Helps organize each screen or section, keeping clarity and consistency.

---

## 9 Unit Tests 🔬

This project includes automated tests to ensure its robustness and reliability.

### Run your tests with **Vitest** 🧪

To validate this hook (and others), go to the test directory and run the following command in your terminal:

```bash
npm run test ./test/useMagicSearchParams.test.ts
```

> [!WARNING]
> Note: Make sure you have Vitest configured in your project so these tests can run correctly; you can check the version with `npm list`

## 10 Conclusion 🎉

The `useMagicSearchParams` hook provides:

- **Readability and Maintainability**: By centralizing logic:
- **Robustess**: in parameter management, limiting insecure values and enabling a coherent flow.

It’s recommended to adjust or expand it based on each project’s needs, for example by adding advanced validations or additional type conversions.

---

<div align="center">
  <img src="https://github.com/user-attachments/assets/acd13a47-dcd3-488c-b0be-69ce466bb106" alt="Captura de pantalla" width="500px" />
</div>

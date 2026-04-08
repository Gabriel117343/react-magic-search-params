import { type UseMagicSearchParamsOptions } from '../../../src'

// Even you can import OrserUser from other file constants to transform the type in a more global way
// import { OrderUser } from './OrderUser';

export type TagsUserProps = 'uno' | 'dos' | 'tres' | 'react' | 'node' | 'typescript' | 'javascript';
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const,
    only_is_active: false,
    tags: ['uno', 'dos', 'tres'] as Array<TagsUserProps>,

  },
  optional: {
    order: '',
    q: '',
    cursor: '',

  }
}
type MandatoryUsersType = typeof paramsUsers.mandatory;
type OptionalUsersType = typeof paramsUsers.optional;

// 2) Build the configuration type for the hook to use in componente in the same place (page) without using "Prop Drilling" or "Context API" (React Context / zustand / Redux)

export type UsersHookConfig = UseMagicSearchParamsOptions<
  MandatoryUsersType,
  OptionalUsersType
>

// Now you have one unique place to change the configuration of the hook and the component that uses it will be updated automatically
// See the behavior useSearchParams of React Router Dom: https://reactrouter.com/6.30.0/hooks/use-search-params
export const paramsUserConfig: UsersHookConfig = {
  mandatory: paramsUsers.mandatory,
  optional: paramsUsers.optional,
  defaultParams: paramsUsers.mandatory,
  forceParams: { page_size: 10 },
  arraySerialization: "csv",
  omitParamsByValues: ["all", "default"],
  historyMode: 'replace',
  unknownParamsPolicy: 'preserve',
  paginationStrategy: {
    mode: 'page',
    pageKey: 'page',
    pageSizeKey: 'page_size',
  },
  resetOnChange: {
    q: ['page', 'cursor'],
    order: ['page', 'cursor'],
    tags: ['page', 'cursor'],
    only_is_active: ['page', 'cursor'],
  },
  codecs: {
    q: {
      parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '').trim(),
      serialize: (value) => String(value ?? '').trim().toLowerCase(),
    },
    cursor: {
      parse: (value) => (Array.isArray(value) ? value[0] : value ?? ''),
    },
  },
}
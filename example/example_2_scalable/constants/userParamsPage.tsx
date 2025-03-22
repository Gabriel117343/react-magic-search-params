import { type UseMagicSearchParamsOptions } from 'react-magic-search-params'

// Even you can import OrserUser from other file constants to transform the type in a more global way
// import { OrderUser } from './OrderUser';

export type TagsUserProps = 'uno' | 'dos' | 'tres' | 'react' | 'node' | 'typescript' | 'javascript';
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const, // we force the page size to 10
    only_is_active: false,
    tags: ['uno', 'dos', 'tres', 'tres'] as Array<TagsUserProps>, // Array of strings represented in the url as eg: tags=tag1,tag2,tag3

  },
  optional: {
    order: '',
    search: '',

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
  // From here on, the options are optional:
  defaultParams: paramsUsers.mandatory, // normally when the component is mounted for the first time it will use the default values to make the first request to the API
  forceParams: { page_size: 10 },
  arraySerialization: "csv",
  omitParamsByValues: ["all", "default"],
}
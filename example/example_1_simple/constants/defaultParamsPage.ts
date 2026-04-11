import { type UseMagicSearchParamsOptions } from '../../../src'

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
    only_unmapped: '' as boolean | '',

  }
}

type MandatoryUsersType = typeof paramsUsers.mandatory
type OptionalUsersType = typeof paramsUsers.optional

export type UsersHookConfig = UseMagicSearchParamsOptions<
  MandatoryUsersType,
  OptionalUsersType
>

export const paramsUserConfig: UsersHookConfig = {
  mandatory: paramsUsers.mandatory,
  optional: paramsUsers.optional,
  defaultParams: paramsUsers.mandatory,
  forceParams: { page_size: 10 },
  arraySerialization: 'csv',
  omitParamsByValues: ['all', 'default'],
  coerceParams: {
    only_unmapped: 'boolean',
  },
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
    only_unmapped: ['page', 'cursor'],
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

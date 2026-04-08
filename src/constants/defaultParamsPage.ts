
// Note: don't change this file if you want to ensure the correct operation of the tests
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10,
    only_is_active: false,
    tags: ['uno', 'dos', 'tres'] as unknown[],

  },
  optional: {
    order: '',
    search: '',

  }
}
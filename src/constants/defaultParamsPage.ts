
// Note: don't change this file if you want to ensure the correct operation of the tests
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const, // Forzar el tamaño de página a 10
    only_is_active: false,
    tags: ['uno', 'dos', 'tres', 'tres'] as unknown[], // Array de strings representados en la url como ej: tags=tag1,tag2,tag3

  },
  optional: {
    order: '',
    search: '',

  }
}
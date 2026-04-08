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

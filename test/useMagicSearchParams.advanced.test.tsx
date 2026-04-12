import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter as TestMemoryRouter, Route, Routes } from 'react-router-dom'
import { useMagicSearchParams } from '../src/useMagicSearchParams'

function Wrapper({
  children,
  initialEntries = ['/']
}: {
  children: React.ReactNode
  initialEntries?: string[]
}) {
  return (
    <TestMemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path='/' element={children} />
      </Routes>
    </TestMemoryRouter>
  )
}

describe('useMagicSearchParams advanced features', () => {
  it('resetOnChange should reset page when search changes', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 10 },
          optional: { search: '', order: '' },
          resetOnChange: {
            search: ['page']
          }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { page: 5, search: 'john' } })
    })

    expect(result.current.getParams({ convert: true }).page).toBe(1)

    act(() => {
      result.current.updateParams({ newParams: { search: 'doe' } })
    })

    expect(result.current.getParams({ convert: true }).page).toBe(1)
  })

  it('resetOnChange should remove optional cursor when source key changes', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 10 },
          optional: { search: '', cursor: '' },
          resetOnChange: {
            search: ['cursor']
          }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { cursor: 'opaque-token' } })
    })

    expect(result.current.getParams({ convert: true }).cursor).toBe('opaque-token')

    act(() => {
      result.current.updateParams({ newParams: { search: 'new-query' } })
    })

    expect(result.current.getParams({ convert: true }).cursor).toBeUndefined()
  })

  it('pagination strategy page should handle next prev and reset', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 10 },
          optional: {},
          paginationStrategy: { mode: 'page', pageKey: 'page' }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.pagination.next()
    })

    act(() => {
      result.current.pagination.next()
    })

    expect(result.current.getParams({ convert: true }).page).toBe(3)

    act(() => {
      result.current.pagination.prev()
    })

    act(() => {
      result.current.pagination.prev()
    })

    act(() => {
      result.current.pagination.prev()
    })

    expect(result.current.getParams({ convert: true }).page).toBe(1)

    act(() => {
      result.current.updateParams({ newParams: { page: 6 } })
      result.current.pagination.reset()
    })

    expect(result.current.getParams({ convert: true }).page).toBe(1)
  })

  it('pagination strategy offset should handle next prev and reset', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { offset: 0, limit: 20 },
          optional: { search: '' },
          paginationStrategy: { mode: 'offset', offsetKey: 'offset', limitKey: 'limit' }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.pagination.next()
    })

    act(() => {
      result.current.pagination.next()
    })

    expect(result.current.getParams({ convert: true }).offset).toBe(40)

    act(() => {
      result.current.pagination.prev()
    })

    expect(result.current.getParams({ convert: true }).offset).toBe(20)

    act(() => {
      result.current.pagination.reset()
    })

    expect(result.current.getParams({ convert: true }).offset).toBe(0)
  })

  it('pagination strategy cursor should set and clear cursor', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { cursor: '', q: '' },
          paginationStrategy: { mode: 'cursor', cursorKey: 'cursor' }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.pagination.setCursor('cursor-001')
    })

    expect(result.current.getParams({ convert: true }).cursor).toBe('cursor-001')

    act(() => {
      result.current.pagination.next('cursor-002')
    })

    expect(result.current.getParams({ convert: true }).cursor).toBe('cursor-002')

    act(() => {
      result.current.pagination.reset()
    })

    expect(result.current.getParams({ convert: true }).cursor).toBeUndefined()
  })

  it('unknownParamsPolicy preserve should keep unknown params after updates', () => {
    const initialEntries = ['/?page=1&utm_source=google']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { search: '' },
          unknownParamsPolicy: 'preserve'
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    act(() => {
      result.current.updateParams({ newParams: { search: 'abc' } })
    })

    expect(result.current.searchParams.get('utm_source')).toBe('google')
    const params = result.current.getParams({ convert: true })
    expect(params.search).toBe('abc')
    expect((params as Record<string, unknown>).utm_source).toBeUndefined()
  })

  it('unknownParamsPolicy drop should remove unknown params after updates', () => {
    const initialEntries = ['/?page=1&utm_source=google']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { search: '' },
          unknownParamsPolicy: 'drop'
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    act(() => {
      result.current.updateParams({ newParams: { search: 'abc' } })
    })

    expect(result.current.searchParams.get('utm_source')).toBeNull()
  })

  it('updateParams should support functional updater in newParams', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 10 },
          optional: { search: '', order: '' }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({
        newParams: (prev) => ({
          page: ((prev.page as number | undefined) ?? 1) + 1
        })
      })
    })

    expect(result.current.getParams({ convert: true }).page).toBe(2)
  })

  it('updateParams should support top-level functional updater', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 10 },
          optional: { search: '', order: '' }
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { search: 'john', order: 'date' } })
    })

    act(() => {
      result.current.updateParams((prev) => ({
        newParams: {
          page: ((prev.page as number | undefined) ?? 1) + 1
        },
        keepParams: {
          search: false
        }
      }))
    })

    const params = result.current.getParams({ convert: true })
    expect(params.page).toBe(2)
    expect(params.search).toBeUndefined()
    expect(params.order).toBe('date')
  })

  it('coerceParams should coerce ambiguous optional values like boolean unions', () => {
    const initialEntries = ['/?page=2&page_size=50&only_unmapped=true']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: { search: '', rubro: '', only_unmapped: '' as boolean | '' },
          coerceParams: {
            only_unmapped: 'boolean'
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    const params = result.current.getParams({ convert: true })
    expect(params.page).toBe(2)
    expect(params.page_size).toBe(50)
    expect(params.only_unmapped).toBe(true)
  })

  it('coerceParams should enforce boolean runtime type in convert=true as safety layer', () => {
    const initialEntries = ['/?page=2&page_size=50&only_unmapped=true']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: { only_unmapped: '' as boolean | '' },
          coerceParams: {
            only_unmapped: 'boolean'
          },
          codecs: {
            only_unmapped: {
              parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '') as boolean | ''
            }
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    const params = result.current.getParams({ convert: true })
    expect(params.only_unmapped).toBe(true)
    expect(typeof params.only_unmapped).toBe('boolean')
  })

  it('coerceParams boolean should keep optional boolean union as empty when value is absent', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: { only_unmapped: '' as boolean | '' },
          coerceParams: {
            only_unmapped: 'boolean'
          }
        }),
      {
        wrapper: Wrapper
      }
    )

    const params = result.current.getParams({ convert: true })
    expect(params.only_unmapped).toBe('')
  })

  it('coerceParams boolean should keep optional boolean union as empty for empty or invalid url values', () => {
    const emptyEntries = ['/?page=1&page_size=50&only_unmapped=']
    const invalidEntries = ['/?page=1&page_size=50&only_unmapped=trueff']

    const { result: emptyResult } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: { only_unmapped: '' as boolean | '' },
          coerceParams: {
            only_unmapped: 'boolean'
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={emptyEntries}>{children}</Wrapper>
      }
    )

    const { result: invalidResult } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: { only_unmapped: '' as boolean | '' },
          coerceParams: {
            only_unmapped: 'boolean'
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={invalidEntries}>{children}</Wrapper>
      }
    )

    expect(emptyResult.current.getParams({ convert: true }).only_unmapped).toBe('')
    expect(invalidResult.current.getParams({ convert: true }).only_unmapped).toBe('')
  })

  it('coerceParams boolean should keep mandatory booleans strict', () => {
    const initialEntries = ['/?page=1&page_size=50&only_is_active=trueff']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50, only_is_active: true },
          optional: {},
          coerceParams: {
            only_is_active: 'boolean'
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    const params = result.current.getParams({ convert: true })
    expect(params.only_is_active).toBe(true)
    expect(typeof params.only_is_active).toBe('boolean')
  })

  it('updateParams should allow empty string as remove signal for optional params', () => {
    const initialEntries = ['/?page=1&page_size=10&entity_type=region']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 10 },
          optional: {
            entity_type: '' as 'region' | 'province' | ''
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    expect(result.current.getParams({ convert: true }).entity_type).toBe('region')

    act(() => {
      result.current.updateParams({
        newParams: {
          entity_type: '',
          page: 1
        }
      })
    })

    const params = result.current.getParams({ convert: true })
    expect(params.entity_type).toBeUndefined()
    expect(result.current.searchParams.get('entity_type')).toBeNull()
  })

  it('coerceParams number should convert numeric strings from URL and updates', () => {
    const initialEntries = ['/?page=1&page_size=50&amount=33']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: { amount: '' as number | '' },
          coerceParams: {
            amount: 'number'
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    expect(result.current.getParams({ convert: true }).amount).toBe(33)
    expect(typeof result.current.getParams({ convert: true }).amount).toBe('number')

    act(() => {
      result.current.updateParams({
        newParams: {
          amount: '44' as unknown as number | ''
        }
      })
    })

    expect(result.current.getParams({ convert: true }).amount).toBe(44)
    expect(typeof result.current.getParams({ convert: true }).amount).toBe('number')
  })

  it('array params declared as arrays should convert correctly without manual string tricks', () => {
    const initialEntries = ['/?page=1&tags=react,node,typescript']

    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { tags: [] as string[] },
          arraySerialization: 'csv'
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    const params = result.current.getParams({ convert: true })
    expect(Array.isArray(params.tags)).toBe(true)
    expect(params.tags).toEqual(['react', 'node', 'typescript'])
  })

  it('json-like array strings require codecs even when coerceParams uses array', () => {
    const initialEntries = ['/?page=1&tags_payload=%5B%22react%22%2C%22node%22%5D']

    const { result: withoutCodec } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { tags_payload: '' },
          coerceParams: {
            tags_payload: 'array'
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    const { result: withCodec } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { tags_payload: '' },
          coerceParams: {
            tags_payload: 'array'
          },
          codecs: {
            tags_payload: {
              parse: (value) => {
                const raw = String(Array.isArray(value) ? value[0] : value ?? '')
                try {
                  const parsed = JSON.parse(raw)
                  return Array.isArray(parsed) ? parsed : []
                } catch {
                  return []
                }
              }
            }
          }
        }),
      {
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    expect(withoutCodec.current.getParams({ convert: true }).tags_payload).toEqual([
      '["react"',
      '"node"]'
    ])
    expect(withCodec.current.getParams({ convert: true }).tags_payload).toEqual(['react', 'node'])
  })
})

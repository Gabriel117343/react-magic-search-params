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
    expect(result.current.getParams({ convert: true }).search).toBe('abc')
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
})

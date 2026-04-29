import React from 'react'
import { describe, it, expect, expectTypeOf } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter as TestMemoryRouter, Route, Routes } from 'react-router-dom'
import { useMagicSearchParams } from '../dist/index.js'

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

describe('useMagicSearchParams dist smoke', () => {
  it('coerceParams should coerce boolean union values when consumed from dist', () => {
    const initialEntries = ['/?page=2&page_size=50&only_unmapped=true']

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
        wrapper: ({ children }) => <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
      }
    )

    const params = result.current.getParams({ convert: true })

    expect(params.page).toBe(2)
    expect(params.page_size).toBe(50)
    expect(params.only_unmapped).toBe(true)
    expect(typeof params.only_unmapped).toBe('boolean')
  })

  it('getParams forRequest should sanitize empty params and preserve dist typings', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1, page_size: 50 },
          optional: {
            only_unmapped: '' as boolean | '',
            status: '' as 'approved' | 'pending' | ''
          },
          coerceParams: {
            only_unmapped: 'boolean'
          }
        }),
      {
        wrapper: Wrapper
      }
    )

    const requestParams = result.current.getParams({ convert: true, forRequest: true })

    expect(requestParams).toEqual({
      page: 1,
      page_size: 50
    })
    expectTypeOf(requestParams.page).toEqualTypeOf<number>()
    expectTypeOf(requestParams.only_unmapped).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(requestParams.status).toEqualTypeOf<'approved' | 'pending' | undefined>()
  })

  it('protectedParams should be available from dist and decode values for consumers', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          mandatory: { page: 1 },
          optional: { commerce_id: '' },
          protectedParams: {
            commerce_id: true
          }
        }),
      {
        wrapper: Wrapper
      }
    )

    const requestBeforeUpdate = result.current.getParams({ convert: true, forRequest: true })
    expectTypeOf(requestBeforeUpdate.commerce_id).toEqualTypeOf<string | undefined>()

    expect(result.current.getParams({ convert: true }).commerce_id).toBeUndefined()
  })
})

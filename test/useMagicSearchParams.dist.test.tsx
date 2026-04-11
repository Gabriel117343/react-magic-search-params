import React from 'react'
import { describe, it, expect } from 'vitest'
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
})

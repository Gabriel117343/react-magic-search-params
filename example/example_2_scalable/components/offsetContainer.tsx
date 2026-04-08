import React from 'react'
import { useMagicSearchParams } from '../../../src'
import { paramsProductsConfig } from '../constants/otherParamsPage'

export const OffsetContainer = () => {
  const { getParams, updateParams, pagination } = useMagicSearchParams(paramsProductsConfig)

  const { offset = 0, limit = 20, products_q = '' } = getParams({ convert: true })

  return (
    <section className='w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 dark:bg-zinc-800'>
      <h2 className='text-2xl font-semibold mb-4'>Offset/Limit Strategy Demo</h2>

      <label
        htmlFor='products_q'
        className='block text-sm font-medium text-gray-700 mb-1 dark:text-white'
      >
        Product search (products_q)
      </label>
      <input
        id='products_q'
        type='text'
        defaultValue={products_q}
        placeholder='Filter products...'
        onChange={(event) =>
          updateParams({
            newParams: { products_q: event.target.value },
            historyMode: 'replace',
          })
        }
        className='w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 mb-4'
      />

      <div className='flex gap-3'>
        <button
          type='button'
          onClick={() => pagination.prev()}
          className='bg-gray-700 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition duration-200'
        >
          Prev Window
        </button>
        <button
          type='button'
          onClick={() => pagination.next()}
          className='bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200'
        >
          Next Window
        </button>
        <button
          type='button'
          onClick={() => pagination.reset()}
          className='bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200'
        >
          Reset Offset
        </button>
      </div>

      <pre className='mt-5 bg-gray-50 p-5 rounded-md shadow-inner dark:bg-zinc-900'>
{JSON.stringify(
  {
    offset,
    limit,
    products_q,
  },
  null,
  2
)}
      </pre>
    </section>
  )
}

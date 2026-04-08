import React, { useEffect, useRef } from 'react'

import {
  paramsUserConfig,
  type TagsUserProps,
} from '../constants/userParamsPage'
import { DarkSvg } from './ui/svg/DarkSvg'
import { LightSvg } from './ui/svg/LightSvg'
import { useHandleTheme } from '../hooks/useHandleTheme'
import { useMagicSearchParams } from 'react-magic-search-params'
import { CurrentParameters } from './currentParameters'

export const UserContainer = () => {
  const {
    searchParams,
    getParams,
    updateParams,
    clearParams,
    getParam,
    onChange,
    pagination,
  } = useMagicSearchParams(paramsUserConfig)

  const qDebounceRef = useRef<number | null>(null)

  const { theme, onChangeTheme } = useHandleTheme()
  const {
    page = 1,
    q = '',
    order = '',
    only_is_active = false,
    tags = [],
    cursor = '',
  } = getParams({
    convert: true,
  }) as {
    page: number
    q: string
    order: string
    only_is_active: boolean
    tags: string[]
    cursor: string
  }

  const tagsWithoutConvert = String(getParam('tags', { convert: false }))

  useEffect(() => {
    const unsubQ = onChange('q', [
      ({ previousValue, currentValue }) => {
        // Useful in real apps for analytics, traces, or API orchestration
        // eslint-disable-next-line no-console
        console.log('q changed', { previousValue, currentValue })
      },
    ])

    const unsubCursor = onChange('cursor', [
      ({ currentValue }) => {
        // eslint-disable-next-line no-console
        console.log('cursor changed', { currentValue })
      },
    ])

    return () => {
      unsubQ()
      unsubCursor()
    }
  }, [onChange])

  const handleQChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (qDebounceRef.current) {
      window.clearTimeout(qDebounceRef.current)
    }

    qDebounceRef.current = window.setTimeout(() => {
      updateParams({
        newParams: {
          q: value,
        },
        historyMode: 'replace',
      })
    }, 350)
  }

  const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOrder = event.target.value
    updateParams({ newParams: { order: selectedOrder } })
  }

  const availableTags: TagsUserProps[] = ['react', 'node', 'typescript', 'javascript']

  const handleTagToggle = (tag: TagsUserProps) => {
    updateParams((prev) => {
      const currentTags = Array.isArray(prev.tags) ? [...prev.tags] : []
      if (currentTags.includes(tag)) {
        return { newParams: { tags: currentTags.filter((item) => item !== tag) } }
      }

      return { newParams: { tags: [...currentTags, tag] } }
    })
  }

  const handleClear = () => {
    clearParams({ keepMandatoryParams: true })
  }

  return (
    <section className='min-h-screen bg-gray-100 flex flex-col items-center p-6 bg-gradient-to-r dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 dark:text-white'>
      <LightSvg width={24} height={24} />
      <div className='absolute top-0 right-0 p-4'>
        <button
          type='button'
          className='p-4 bg-slate-200 rounded-sm hover:bg-slate-300'
          onClick={onChangeTheme}
        >
          {theme === 'light' ? <LightSvg width={24} height={24} /> : <DarkSvg width={24} height={24} />}
        </button>
      </div>

      <div className='w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 mb-6 dark:bg-transparent relative overflow-hidden z-50'>
        {theme === 'dark' && (
          <div className='absolute top-0 left-0 right-0 bottom-0 filter blur-2xl hover:blur-3xl bg-black opacity-40 -z-10' />
        )}
        <h1 className='text-3xl font-bold mb-6 text-center'>User Management (Scalable)</h1>

        <div className='mb-6'>
          <label
            htmlFor='q'
            className='block text-sm font-medium text-gray-700 mb-1 dark:text-white'
          >
            Search Users (q + debounce + replace history)
          </label>
          <input
            type='text'
            id='q'
            onChange={handleQChange}
            placeholder='Enter first or last name...'
            className='w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500'
            defaultValue={q}
          />
        </div>

        <div className='mb-6'>
          <label
            htmlFor='order'
            className='block text-sm font-medium text-gray-700 mb-1 dark:text-white'
          >
            Sort By
          </label>
          <select
            id='order'
            value={order}
            onChange={handleOrderChange}
            className='w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 dark:text-white'
          >
            <option value='all' className='dark:bg-sky-950'>
              None(all)
            </option>
            <option value='asc' className='dark:bg-sky-950'>
              Ascending(asc)
            </option>
            <option value='desc' className='dark:bg-sky-950'>
              Descending(desc)
            </option>
          </select>
        </div>

        <div className='mb-6'>
          <label htmlFor='only_is_active' className='flex items-center space-x-2 cursor-pointer'>
            <input
              type='checkbox'
              id='only_is_active'
              onChange={() =>
                updateParams({
                  newParams: {
                    only_is_active: !only_is_active,
                  },
                })
              }
              checked={only_is_active}
              className='text-blue-500 rounded'
            />
            <span className='text-sm text-gray-700 dark:text-white'>Show only active users</span>
          </label>
        </div>

        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-3'>Select Tags</h3>
          <div className='flex flex-wrap gap-2'>
            {availableTags.map((tag) => {
              const isActive = Array.isArray(tags) && tags.includes(tag)
              return (
                <button
                  key={tag}
                  type='button'
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-md border ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        <CurrentParameters
          page={page}
          only_is_active={only_is_active}
          tags={tags}
          order={order}
          q={q}
          cursor={cursor}
          tagsWithoutConvert={tagsWithoutConvert}
        />

        <div className='flex space-x-4 justify-center flex-wrap'>
          <button
            type='button'
            onClick={() => pagination.prev()}
            className='bg-gray-700 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition duration-200'
          >
            Prev Page
          </button>
          <button
            type='button'
            onClick={() => pagination.next()}
            className='bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200'
          >
            Next Page
          </button>
          <button
            type='button'
            onClick={() => pagination.reset()}
            className='bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-200'
          >
            Reset Page
          </button>
          <button
            type='button'
            onClick={() => pagination.setCursor(`opaque_${Date.now().toString(36)}`)}
            className='bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 transition duration-200'
          >
            Set Opaque Cursor
          </button>
          <button
            type='button'
            onClick={() => pagination.setCursor('')}
            className='bg-teal-800 text-white px-6 py-3 rounded-md hover:bg-teal-900 transition duration-200'
          >
            Clear Cursor
          </button>
          <button
            type='button'
            onClick={handleClear}
            className='bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-200'
          >
            Clear Filters
          </button>
        </div>

        <div className='mt-6 bg-gray-50 p-5 rounded-md shadow-inner'>
          <p className='text-sm text-gray-600'>
            Unknown params policy is set to preserve. Example: if URL has utm_source,
            it will remain after updates.
          </p>
          <p className='text-sm text-gray-600 mt-2'>
            Current URL: {searchParams.toString()}
          </p>
        </div>
      </div>
    </section>
  )
}

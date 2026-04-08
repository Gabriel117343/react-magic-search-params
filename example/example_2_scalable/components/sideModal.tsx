import React, { useState, useEffect } from 'react'
import { useMagicSearchParams } from 'react-magic-search-params'
import { paramsUserConfig } from '../constants/userParamsPage'

export const SideModal = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [lastParamChanged, setLastParamChanged] = useState('None')
  const [lastTransition, setLastTransition] = useState('')
  // When using one unique hook for all the parameters, you can use the same hook for all the parameters
  const { onChange } = useMagicSearchParams(paramsUserConfig)

  useEffect(() => {
    const makeHandler = (keyName: string) => [
      ({ previousValue, currentValue }) => {
        setLastParamChanged(keyName)
        setLastTransition(`${String(previousValue)} -> ${String(currentValue)}`)
      }
    ]

    const unsubTags = onChange('tags', makeHandler('tags'))
    const unsubOnlyActive = onChange('only_is_active', makeHandler('only_is_active'))
    const unsubOrder = onChange('order', makeHandler('order'))
    const unsubQ = onChange('q', makeHandler('q'))
    const unsubCursor = onChange('cursor', makeHandler('cursor'))
    const unsubPage = onChange('page', makeHandler('page'))

    return () => {
      unsubTags()
      unsubOnlyActive()
      unsubOrder()
      unsubQ()
      unsubCursor()
      unsubPage()
    }

  }, [onChange])

  return (
    <dialog open={isOpen} className="absolute opacity-80 hover:opacity-100 top-0 m-5 h-[220px] rounded-xl bg-lime-100">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold"></h2>
          <button type='button' className="text-2xl" onClick={() => setIsOpen(prev => !prev)}>X</button>
        </div>
  
        <p className="text-lg mt-4 text-gray-700 flex flex-col">Last Parameter Changed:
          <strong className='font-semibold'>{lastParamChanged}</strong>
        </p>
        <p className='text-sm text-gray-600 mt-2'>
          Transition: {lastTransition || 'No changes yet'}
        </p>
      </div>
    </dialog>
  )
}


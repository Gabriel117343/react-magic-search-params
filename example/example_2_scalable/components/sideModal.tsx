import React, { useState, useEffect } from 'react'
import { useMagicSearchParams } from 'react-magic-search-params'
import { paramsUserConfig } from '../constants/userParamsPage'

export const SideModal = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [lastParamChanged, setLastParamChanged] = useState('')
  // When using one unique hook for all the parameters, you can use the same hook for all the parameters
  const { onChange, getParam } = useMagicSearchParams(paramsUserConfig)
  const currentTags = getParam('tags', { convert: true })
  console.log('currentTags', currentTags)
  useEffect(() => {
    onChange('tags', [
       () => setLastParamChanged('tags')
    ])
    onChange('only_is_active', [
      () => setLastParamChanged('only_is_active')])
    onChange('order', [
      () => setLastParamChanged('order')])
    onChange('search', [
      () => setLastParamChanged('search')
    ])
    onChange('page', [
      () => setLastParamChanged('page')
    ])

  }, [onChange])

  return (
    <dialog open={isOpen} className="absolute opacity-80 hover:opacity-100 top-0 m-5 h-[220px] rounded-xl bg-lime-100">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold"></h2>
          <button className="text-2xl" onClick={() => setIsOpen(prev => !prev)}>X</button>
        </div>
  
        <p className="text-lg mt-4 text-gray-700 flex flex-col">Last Parameter Changed:
          <strong className='font-semibold'>{lastParamChanged || 'None'}</strong>
        </p>
      </div>
    </dialog>
  )
}


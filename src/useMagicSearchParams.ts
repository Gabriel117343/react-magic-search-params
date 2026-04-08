import { useSearchParams } from 'react-router-dom'
import { useMemo, useEffect, useRef, useCallback } from 'react'

// Custom hook with advanced techniques to handle search parameters for any pagination

type CommonParams = {
  page?: number
  page_size?: number
}

/*
Maps all properties of M (mandatory)
and all properties of O (optional).
*/
type MergeParams<M, O> = {
  [K in keyof M]: M[K]
} & {
  [K in keyof O]?: O[K]
}

export type ParamCodec<TValue> = {
  parse?: (
    value: string | string[] | null,
    context: { key: string; searchParams: URLSearchParams }
  ) => TValue
  serialize?: (value: TValue, context: { key: string }) => string | string[] | null | undefined
}

type ParamCodecs<TParams extends Record<string, unknown>> = Partial<{
  [K in keyof TParams]: ParamCodec<TParams[K]>
}>

type ParamKey<TParams extends Record<string, unknown>> = Extract<keyof TParams, string>

export type PaginationStrategy<TParams extends Record<string, unknown>> =
  | {
      mode: 'page'
      pageKey?: ParamKey<TParams>
      pageSizeKey?: ParamKey<TParams>
    }
  | {
      mode: 'offset'
      offsetKey?: ParamKey<TParams>
      limitKey?: ParamKey<TParams>
    }
  | {
      mode: 'cursor'
      cursorKey?: ParamKey<TParams>
    }

export type ResetOnChangeRules<TParams extends Record<string, unknown>> = Partial<
  Record<ParamKey<TParams>, Array<ParamKey<TParams>>>
>

export type UnknownParamsPolicy = 'drop' | 'preserve'

export type HistoryMode = 'push' | 'replace'

export type OnChangeEvent<TParams extends Record<string, unknown>> = {
  key: keyof TParams
  previousValue: unknown
  currentValue: unknown
}

type OnChangeCallback<TParams extends Record<string, unknown>> =
  | ((event: OnChangeEvent<TParams>) => void)
  | (() => void)

/**
 * Interface for the configuration object that the hook receives
 */
export interface UseMagicSearchParamsOptions<
  M extends Record<string, unknown>,
  O extends Record<string, unknown>
> {
  mandatory: M
  optional?: O
  defaultParams?: Partial<MergeParams<M, O>>
  forceParams?: Partial<MergeParams<M, O>>
  arraySerialization?: 'csv' | 'repeat' | 'brackets'
  omitParamsByValues?: Array<'all' | 'default' | 'unknown' | 'none' | 'void'>
  codecs?: ParamCodecs<MergeParams<M, O>>
  historyMode?: HistoryMode
  resetOnChange?: ResetOnChangeRules<MergeParams<M, O>>
  paginationStrategy?: PaginationStrategy<MergeParams<M, O>>
  unknownParamsPolicy?: UnknownParamsPolicy
}

/**
Generic hook to handle search parameters in the URL
@param mandatory - Mandatory parameters (e.g., page=1, page_size=10, etc.)
@param optional - Optional parameters (e.g., order, search, etc.)
@param defaultParams - Default parameters sent in the URL on initialization
@param forceParams - Parameters forced into the URL regardless of user input
@param omitParamsByValues - Parameters omitted if they have specific values
*/
export const useMagicSearchParams = <
  M extends Record<string, unknown> & CommonParams,
  O extends Record<string, unknown>
>({
  mandatory = {} as M,
  optional = {} as O,
  defaultParams = {} as Partial<MergeParams<M, O>>,
  arraySerialization = 'csv',
  forceParams = {} as Partial<MergeParams<M, O>>,
  omitParamsByValues = [] as Array<'all' | 'default' | 'unknown' | 'none' | 'void'>,
  codecs = {} as ParamCodecs<MergeParams<M, O>>,
  historyMode = 'push',
  resetOnChange = {} as ResetOnChangeRules<MergeParams<M, O>>,
  paginationStrategy,
  unknownParamsPolicy = 'drop'
}: UseMagicSearchParamsOptions<M, O>) => {
  type Params = MergeParams<M, O>
  type Keys = ParamKey<Params>
  type KeepParams = Partial<Record<Keys, boolean>>
  type NewParams = Partial<Params>
  type UpdateParamsObject = {
    newParams?: NewParams | ((current: Params) => NewParams)
    keepParams?: KeepParams
    historyMode?: HistoryMode
  }
  type UpdateParamsInput =
    | UpdateParamsObject
    | ((current: Params) => UpdateParamsObject | NewParams)

  const [searchParams, setSearchParams] = useSearchParams()

  // Ref to store subscriptions: { paramName: [callback1, callback2, ...] }
  const subscriptionsRef = useRef<Record<string, Array<OnChangeCallback<MergeParams<M, O>>>>>({})
  const previousParamsRef = useRef<Record<string, unknown>>({})

  const setSearchParamsWithHistory = useCallback(
    (nextParams: URLSearchParams, modeOverride?: HistoryMode) => {
      const modeToUse = modeOverride ?? historyMode
      setSearchParams(nextParams, { replace: modeToUse === 'replace' })
    },
    [setSearchParams, historyMode]
  )

  const TOTAL_PARAMS_PAGE: MergeParams<M, O> = useMemo(() => {
    return { ...mandatory, ...optional }
  }, [mandatory, optional])

  const PARAM_ORDER = useMemo(() => {
    return Array.from(Object.keys(TOTAL_PARAMS_PAGE))
  }, [TOTAL_PARAMS_PAGE])

  const hasKnownKey = useCallback(
    (key: string) => Object.prototype.hasOwnProperty.call(TOTAL_PARAMS_PAGE, key),
    [TOTAL_PARAMS_PAGE]
  )

  const getRawParamValue = (key: string): string | string[] | null => {
    const isArrayKey = Array.isArray(TOTAL_PARAMS_PAGE[key])
    if (!isArrayKey) {
      return searchParams.get(key)
    }

    if (arraySerialization === 'csv') {
      return searchParams.get(key)
    }
    if (arraySerialization === 'repeat') {
      return searchParams.getAll(key)
    }
    return searchParams.getAll(`${key}[]`)
  }

  const getUnknownEntries = useCallback((): Array<[string, string]> => {
    if (unknownParamsPolicy === 'drop') return []

    const unknownEntries: Array<[string, string]> = []
    for (const [key, value] of searchParams.entries()) {
      const normalizedKey = key.endsWith('[]') ? key.replace('[]', '') : key
      if (!hasKnownKey(normalizedKey)) {
        unknownEntries.push([key, value])
      }
    }
    return unknownEntries
  }, [unknownParamsPolicy, searchParams, hasKnownKey])

  const appendUnknownEntries = useCallback(
    (url: URLSearchParams): URLSearchParams => {
      if (unknownParamsPolicy === 'drop') return url

      const composed = new URLSearchParams(url.toString())
      const unknownEntries = getUnknownEntries()
      for (const [key, value] of unknownEntries) {
        composed.append(key, value)
      }
      return composed
    },
    [unknownParamsPolicy, getUnknownEntries]
  )

  const valuesAreEqual = (left: unknown, right: unknown) => {
    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) return false
      return left.every((value, index) => value === right[index])
    }

    return left === right
  }

  // We get the keys that are arrays according to TOTAL_PARAMS_PAGE.
  const ARRAY_KEYS = useMemo(() => {
    return Object.keys(TOTAL_PARAMS_PAGE).filter((key) => Array.isArray(TOTAL_PARAMS_PAGE[key]))
  }, [TOTAL_PARAMS_PAGE])

  const appendArrayValues = (
    finallyParams: Record<string, unknown>,
    newParams: Record<string, string | string[] | unknown>
  ): Record<string, unknown> => {
    const updatedParams = { ...finallyParams }

    if (ARRAY_KEYS.length === 0) return updatedParams

    ARRAY_KEYS.forEach((key) => {
      let currentValues: string[] = []

      switch (arraySerialization) {
        case 'csv': {
          const raw = searchParams.get(key) || ''
          currentValues = raw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
          break
        }
        case 'repeat': {
          const urlParams = searchParams.getAll(key) as Array<string>
          currentValues = urlParams.length > 0 ? urlParams : []
          break
        }
        case 'brackets': {
          const urlParams = searchParams.getAll(`${key}[]`) as Array<string>
          currentValues = urlParams.length > 0 ? urlParams : []
          break
        }
        default: {
          const raw = searchParams.get(key) ?? ''
          currentValues = raw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        }
      }

      if (newParams[key] !== undefined) {
        const incoming = newParams[key]
        let combined: string[] = []

        if (typeof incoming === 'string') {
          combined = currentValues.includes(incoming)
            ? currentValues.filter((v) => v !== incoming)
            : [...currentValues, incoming]
        } else if (Array.isArray(incoming)) {
          combined = Array.from(new Set([...incoming.map(String)]))
        } else {
          combined = currentValues
        }

        updatedParams[key] = combined
      }
    })

    return updatedParams
  }

  const transformParamsToURLSearch = (params: Record<string, unknown>): URLSearchParams => {
    const newParam: URLSearchParams = new URLSearchParams()
    const paramsKeys = Object.keys(params)

    for (const key of paramsKeys) {
      const codec = codecs[key as keyof MergeParams<M, O>]
      if (codec?.serialize) {
        const serializedValue = (
          codec.serialize as (
            value: unknown,
            context: { key: string }
          ) => string | string[] | null | undefined
        )(params[key], { key })

        if (serializedValue == null) {
          continue
        }

        if (Array.isArray(serializedValue)) {
          if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
            if (arraySerialization === 'csv') {
              newParam.set(key, serializedValue.join(','))
            } else if (arraySerialization === 'repeat') {
              for (const item of serializedValue) {
                newParam.append(key, String(item))
              }
            } else {
              for (const item of serializedValue) {
                newParam.append(`${key}[]`, String(item))
              }
            }
          } else if (serializedValue.length > 0) {
            newParam.set(key, String(serializedValue[0]))
          }
        } else {
          newParam.set(key, String(serializedValue))
        }
        continue
      }

      if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
        const arrayValue = params[key] as unknown[]
        switch (arraySerialization) {
          case 'csv': {
            newParam.set(key, arrayValue.join(','))
            break
          }
          case 'repeat': {
            for (const item of arrayValue) {
              newParam.append(key, String(item))
            }
            break
          }
          case 'brackets': {
            for (const item of arrayValue) {
              newParam.append(`${key}[]`, String(item))
            }
            break
          }
          default: {
            newParam.set(key, arrayValue.join(','))
          }
        }
      } else {
        newParam.set(key, String(params[key]))
      }
    }

    return newParam
  }

  const getDefaultValueForKey = (key: string, fallback: unknown) => {
    if (Object.prototype.hasOwnProperty.call(mandatory, key)) {
      return mandatory[key as keyof typeof mandatory]
    }
    if (Object.prototype.hasOwnProperty.call(defaultParams, key)) {
      return defaultParams[key as keyof typeof defaultParams]
    }
    return fallback
  }

  const hasForcedParamsValues = ({
    paramsForced,
    compareParams
  }: {
    paramsForced: Record<string, unknown>
    compareParams: Record<string, unknown>
  }) => {
    const allParamsMatch = Object.entries(paramsForced).every(
      ([key, value]) => compareParams[key] === value
    )

    return allParamsMatch
  }

  /**
   * Convert a string value to its original type (number, boolean, array) according to TOTAL_PARAMS_PAGE
   */
  const convertOriginalType = (key: string) => {
    const rawValue = getRawParamValue(key)
    const codec = codecs[key as keyof MergeParams<M, O>]
    if (codec?.parse) {
      return codec.parse(rawValue, { key, searchParams })
    }

    if (typeof TOTAL_PARAMS_PAGE[key] === 'number') {
      const parsed = Number.parseInt(String(rawValue ?? ''), 10)
      if (Number.isNaN(parsed)) {
        const defaultNumber = getDefaultValueForKey(key, 0)
        return typeof defaultNumber === 'number' ? defaultNumber : 0
      }
      return parsed
    }

    if (typeof TOTAL_PARAMS_PAGE[key] === 'boolean') {
      return String(rawValue) === 'true'
    }

    if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
      if (arraySerialization === 'csv') {
        return String(rawValue ?? '').split(',').filter(Boolean)
      }
      return Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []
    }

    if (Array.isArray(rawValue)) {
      return rawValue[0] ?? ''
    }

    return rawValue ?? ''
  }

  const getStringUrl = (key: string, paramsUrl: Record<string, unknown>) => {
    const isKeyArray = Array.isArray(TOTAL_PARAMS_PAGE[key])
    if (isKeyArray) {
      if (arraySerialization === 'brackets') {
        const arrayUrl = searchParams.getAll(`${key}[]`)
        const encodedQueryArray = transformParamsToURLSearch({ [key]: arrayUrl }).toString()
        return decodeURIComponent(encodedQueryArray)
      }

      if (arraySerialization === 'csv') {
        const arrayValue = searchParams.getAll(key)
        const encodedQueryArray = transformParamsToURLSearch({ [key]: arrayValue }).toString()
        return decodeURIComponent(encodedQueryArray)
      }

      const arrayValue = searchParams.getAll(key)
      return transformParamsToURLSearch({ [key]: arrayValue }).toString()
    }

    return paramsUrl[key] as string
  }

  const getParamsObj = (urlParams: URLSearchParams): Record<string, string | string[]> => {
    const paramsObj: Record<string, string | string[]> = {}

    for (const [key, value] of urlParams.entries()) {
      if (key.endsWith('[]')) {
        const bareKey = key.replace('[]', '')
        if (paramsObj[bareKey]) {
          ;(paramsObj[bareKey] as string[]).push(value)
        } else {
          paramsObj[bareKey] = [value]
        }
      } else {
        if (paramsObj[key]) {
          if (Array.isArray(paramsObj[key])) {
            ;(paramsObj[key] as string[]).push(value)
          } else {
            paramsObj[key] = [paramsObj[key] as string, value]
          }
        } else {
          paramsObj[key] = value
        }
      }
    }

    return paramsObj
  }

  // Optimization: While params are not updated, URL params are not recalculated.
  const CURRENT_PARAMS_URL: Record<string, unknown> = useMemo(() => {
    return arraySerialization === 'brackets'
      ? getParamsObj(searchParams)
      : Object.fromEntries(searchParams.entries())
  }, [searchParams, arraySerialization])

  /**
   * Gets current URL params and converts to original types if desired.
   */
  const getParams = ({ convert = true } = {}): MergeParams<M, O> => {
    const params = Object.keys(CURRENT_PARAMS_URL).reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(TOTAL_PARAMS_PAGE, key)) {
        const realKey = arraySerialization === 'brackets' ? key.replace('[]', '') : key
        ;(acc as Record<string, unknown>)[realKey] =
          convert === true
            ? convertOriginalType(realKey)
            : getStringUrl(key, CURRENT_PARAMS_URL)
      }
      return acc
    }, {} as Record<string, unknown>)

    return params as MergeParams<M, O>
  }

  type ParamReturn<K extends Keys, T extends boolean> = T extends true
    ? MergeParams<M, O>[K]
    : string

  /**
   * Gets one URL parameter and converts it to original type if desired.
   */
  const getParam = <K extends Keys, T extends boolean = true>(
    key: K,
    options?: { convert: T }
  ): ParamReturn<K, T> => {
    const keyStr = String(key)
    const shouldConvert = options?.convert !== false
    const value = shouldConvert
      ? convertOriginalType(keyStr)
      : getStringUrl(keyStr, CURRENT_PARAMS_URL)

    return value as ParamReturn<K, T>
  }

  const isUpdateShape = (value: unknown): value is UpdateParamsObject => {
    if (value == null || typeof value !== 'object') return false

    return (
      Object.prototype.hasOwnProperty.call(value, 'newParams') ||
      Object.prototype.hasOwnProperty.call(value, 'keepParams') ||
      Object.prototype.hasOwnProperty.call(value, 'historyMode')
    )
  }

  const normalizeUpdateInput = (input?: UpdateParamsInput) => {
    const currentParams = getParams({ convert: true })

    if (typeof input === 'function') {
      const result = input(currentParams)
      if (isUpdateShape(result)) {
        return {
          newParams:
            typeof result.newParams === 'function'
              ? result.newParams(currentParams)
              : (result.newParams ?? ({} as NewParams)),
          keepParams: result.keepParams ?? ({} as KeepParams),
          historyMode: result.historyMode
        }
      }

      return {
        newParams: result as NewParams,
        keepParams: {} as KeepParams,
        historyMode: undefined
      }
    }

    if (!input) {
      return {
        newParams: {} as NewParams,
        keepParams: {} as KeepParams,
        historyMode: undefined
      }
    }

    return {
      newParams:
        typeof input.newParams === 'function'
          ? input.newParams(currentParams)
          : (input.newParams ?? ({} as NewParams)),
      keepParams: input.keepParams ?? ({} as KeepParams),
      historyMode: input.historyMode
    }
  }

  const applyResetOnChangeRules = ({
    currentParams,
    newParams,
    keepParams
  }: {
    currentParams: Params
    newParams: NewParams
    keepParams: KeepParams
  }) => {
    const nextNewParams = { ...newParams } as Record<string, unknown>
    const nextKeepParams = { ...keepParams } as Record<string, boolean | undefined>

    for (const [sourceKey, targetKeys] of Object.entries(resetOnChange)) {
      if (!targetKeys || targetKeys.length === 0) continue
      if (!Object.prototype.hasOwnProperty.call(nextNewParams, sourceKey)) continue

      const hasChanged = !valuesAreEqual(
        nextNewParams[sourceKey],
        currentParams[sourceKey as keyof Params]
      )

      if (!hasChanged) continue

      for (const targetKey of targetKeys) {
        if (Object.prototype.hasOwnProperty.call(forceParams, targetKey)) {
          continue
        }

        if (Object.prototype.hasOwnProperty.call(mandatory, targetKey)) {
          nextNewParams[targetKey] = mandatory[targetKey as keyof typeof mandatory]
          delete nextKeepParams[targetKey]
          continue
        }

        if (Object.prototype.hasOwnProperty.call(defaultParams, targetKey)) {
          nextNewParams[targetKey] = defaultParams[targetKey as keyof typeof defaultParams]
          delete nextKeepParams[targetKey]
          continue
        }

        delete nextNewParams[targetKey]
        nextKeepParams[targetKey] = false
      }
    }

    return {
      newParams: nextNewParams as NewParams,
      keepParams: nextKeepParams as KeepParams
    }
  }

  const calculateOmittedParameters = (
    newParams: Record<string, unknown | unknown[]>,
    keepParams: Record<string, boolean | undefined>
  ) => {
    const params = getParams()

    // Arrays are handled separately to support toggle/merge behaviors.
    const newParamsWithoutArray = Object.entries(newParams).filter(
      ([key]) => !Array.isArray(TOTAL_PARAMS_PAGE[key])
    )

    const result = Object.assign(
      {
        ...params,
        ...Object.fromEntries(newParamsWithoutArray)
      },
      forceParams
    )

    const paramsFiltered = Object.keys(result).reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(keepParams, key) && keepParams[key] === false) {
        return acc
      }

      const value = result[key]
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !omitParamsByValues.includes(value as 'all' | 'default' | 'unknown' | 'none' | 'void')
      ) {
        ;(acc as Record<string, unknown>)[key] = value
      }

      return acc
    }, {} as Record<string, unknown>)

    return {
      ...mandatory,
      ...paramsFiltered
    }
  }

  const sortParameters = (paramsFiltered: Record<string, unknown>) => {
    // Sort params according to base structure to keep a stable URL order.
    const orderedParams = PARAM_ORDER.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(paramsFiltered, key)) {
        ;(acc as Record<string, unknown>)[key] = paramsFiltered[key]
      }

      return acc
    }, {} as Record<string, unknown>)

    return orderedParams as MergeParams<M, O>
  }

  const mandatoryParameters = () => {
    // In case arrays exist in URL, convert them to original form; otherwise skip conversion to optimize.
    const isNecessaryConvert: boolean = ARRAY_KEYS.length > 0
    const totalParametros: Record<string, unknown> = getParams({
      convert: isNecessaryConvert
    })

    const paramsUrlFound: Record<string, unknown> = Object.keys(totalParametros).reduce(
      (acc, key) => {
        if (Object.prototype.hasOwnProperty.call(mandatory, key)) {
          ;(acc as Record<string, unknown>)[key] = totalParametros[key]
        }
        return acc
      },
      {}
    )

    return paramsUrlFound
  }

  /**
   * Clears URL params, keeping mandatory params by default.
   */
  const clearParams = ({
    keepMandatoryParams = true,
    historyMode: historyModeOverride
  }: {
    keepMandatoryParams?: boolean
    historyMode?: HistoryMode
  } = {}): void => {
    const paramsTransformed = transformParamsToURLSearch({
      ...mandatory,
      ...(keepMandatoryParams && {
        ...mandatoryParameters()
      }),
      ...forceParams
    })

    const finalParams = appendUnknownEntries(paramsTransformed)
    setSearchParamsWithHistory(finalParams, historyModeOverride)
  }

  /**
   * Merges new params with current ones, applies omit/reset rules, and writes sorted URL state.
   */
  const updateParams = (input?: UpdateParamsInput) => {
    const normalizedInput = normalizeUpdateInput(input)
    const currentParams = getParams({ convert: true })

    const updatesWithResets = applyResetOnChangeRules({
      currentParams,
      newParams: normalizedInput.newParams,
      keepParams: normalizedInput.keepParams
    })

    const newParams = updatesWithResets.newParams
    const keepParams = updatesWithResets.keepParams

    if (
      Object.keys(newParams).length === 0 &&
      Object.keys(keepParams).length === 0
    ) {
      clearParams({ historyMode: normalizedInput.historyMode })
      return
    }

    const finallyParamters = calculateOmittedParameters(newParams, keepParams)
    const convertedArrayValues = appendArrayValues(finallyParamters, newParams)
    const paramsSorted = sortParameters(convertedArrayValues)

    const transformedParams = transformParamsToURLSearch(paramsSorted)
    const finalParams = appendUnknownEntries(transformedParams)

    setSearchParamsWithHistory(finalParams, normalizedInput.historyMode)
  }

  const pageStrategy = paginationStrategy?.mode === 'page' ? paginationStrategy : undefined
  const offsetStrategy = paginationStrategy?.mode === 'offset' ? paginationStrategy : undefined
  const cursorStrategy = paginationStrategy?.mode === 'cursor' ? paginationStrategy : undefined

  const pagination = {
    mode: paginationStrategy?.mode ?? 'page',
    next: (cursor?: string) => {
      const strategyMode = paginationStrategy?.mode ?? 'page'

      if (strategyMode === 'cursor') {
        const cursorKey = cursorStrategy?.cursorKey ?? ('cursor' as Keys)
        if (typeof cursor === 'string') {
          updateParams({ newParams: { [cursorKey]: cursor } as NewParams })
        }
        return
      }

      if (strategyMode === 'offset') {
        const offsetKey = offsetStrategy?.offsetKey ?? ('offset' as Keys)
        const limitKey = offsetStrategy?.limitKey ?? ('limit' as Keys)

        const currentOffset = Number(
          getParam(offsetKey, { convert: true } as { convert: true }) ?? 0
        )
        const currentLimit = Number(
          getParam(limitKey, { convert: true } as { convert: true }) ??
            getDefaultValueForKey(String(limitKey), 10)
        )

        const safeOffset = Number.isFinite(currentOffset) ? currentOffset : 0
        const safeLimit = Number.isFinite(currentLimit) && currentLimit > 0 ? currentLimit : 10

        updateParams({
          newParams: {
            [offsetKey]: safeOffset + safeLimit
          } as NewParams
        })
        return
      }

      const pageKey =
        pageStrategy
          ? pageStrategy.pageKey ?? ('page' as Keys)
          : ('page' as Keys)

      const currentPage = Number(
        getParam(pageKey, { convert: true } as { convert: true }) ??
          getDefaultValueForKey(String(pageKey), 1)
      )

      const safeCurrentPage = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1

      updateParams({
        newParams: {
          [pageKey]: safeCurrentPage + 1
        } as NewParams
      })
    },
    prev: () => {
      const strategyMode = paginationStrategy?.mode ?? 'page'

      if (strategyMode === 'cursor') {
        const cursorKey = cursorStrategy?.cursorKey ?? ('cursor' as Keys)
        updateParams({ keepParams: { [cursorKey]: false } as KeepParams })
        return
      }

      if (strategyMode === 'offset') {
        const offsetKey = offsetStrategy?.offsetKey ?? ('offset' as Keys)
        const limitKey = offsetStrategy?.limitKey ?? ('limit' as Keys)

        const currentOffset = Number(
          getParam(offsetKey, { convert: true } as { convert: true }) ?? 0
        )
        const currentLimit = Number(
          getParam(limitKey, { convert: true } as { convert: true }) ??
            getDefaultValueForKey(String(limitKey), 10)
        )

        const safeOffset = Number.isFinite(currentOffset) ? currentOffset : 0
        const safeLimit = Number.isFinite(currentLimit) && currentLimit > 0 ? currentLimit : 10

        updateParams({
          newParams: {
            [offsetKey]: Math.max(0, safeOffset - safeLimit)
          } as NewParams
        })
        return
      }

      const pageKey =
        pageStrategy
          ? pageStrategy.pageKey ?? ('page' as Keys)
          : ('page' as Keys)

      const currentPage = Number(
        getParam(pageKey, { convert: true } as { convert: true }) ??
          getDefaultValueForKey(String(pageKey), 1)
      )

      const safeCurrentPage = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1

      updateParams({
        newParams: {
          [pageKey]: Math.max(1, safeCurrentPage - 1)
        } as NewParams
      })
    },
    reset: () => {
      const strategyMode = paginationStrategy?.mode ?? 'page'

      if (strategyMode === 'cursor') {
        const cursorKey = cursorStrategy?.cursorKey ?? ('cursor' as Keys)
        updateParams({ keepParams: { [cursorKey]: false } as KeepParams })
        return
      }

      if (strategyMode === 'offset') {
        const offsetKey = offsetStrategy?.offsetKey ?? ('offset' as Keys)
        const defaultOffset = Number(getDefaultValueForKey(String(offsetKey), 0))

        updateParams({
          newParams: {
            [offsetKey]: Number.isFinite(defaultOffset) ? defaultOffset : 0
          } as NewParams
        })
        return
      }

      const pageKey =
        pageStrategy
          ? pageStrategy.pageKey ?? ('page' as Keys)
          : ('page' as Keys)

      const defaultPage = Number(getDefaultValueForKey(String(pageKey), 1))

      updateParams({
        newParams: {
          [pageKey]: Number.isFinite(defaultPage) && defaultPage > 0 ? defaultPage : 1
        } as NewParams
      })
    },
    setCursor: (cursor: string | null | undefined) => {
      const strategyMode = paginationStrategy?.mode ?? 'page'
      const cursorKey =
        strategyMode === 'cursor'
          ? cursorStrategy?.cursorKey ?? ('cursor' as Keys)
          : ('cursor' as Keys)

      if (cursor == null || cursor === '') {
        updateParams({ keepParams: { [cursorKey]: false } as KeepParams })
        return
      }

      updateParams({
        newParams: {
          [cursorKey]: cursor
        } as NewParams
      })
    }
  }

  const onChange = useCallback(
    (paramName: Keys, callbacks: Array<OnChangeCallback<MergeParams<M, O>>>) => {
      const paramNameStr = String(paramName)
      subscriptionsRef.current[paramNameStr] = callbacks

      return () => {
        delete subscriptionsRef.current[paramNameStr]
        delete previousParamsRef.current[paramNameStr]
      }
    },
    []
  )

  // Every time searchParams changes, notify subscribers.
  useEffect(() => {
    for (const [key, callbacks] of Object.entries(subscriptionsRef.current)) {
      const newValue = hasKnownKey(key) ? convertOriginalType(key) : searchParams.get(key)
      const oldValue = previousParamsRef.current[key] ?? null

      if (!valuesAreEqual(newValue, oldValue)) {
        for (const callback of callbacks) {
          callback({
            key: key as keyof MergeParams<M, O>,
            previousValue: oldValue,
            currentValue: newValue
          })
        }
      }

      previousParamsRef.current[key] = newValue
    }
  }, [CURRENT_PARAMS_URL, hasKnownKey, searchParams])

  useEffect(() => {
    const keysDefaultParams: string[] = Object.keys(defaultParams)
    const keysForceParams: string[] = Object.keys(forceParams)
    if (keysDefaultParams.length === 0 && keysForceParams.length === 0) return

    function handleStartingParams() {
      const defaultParamsString = transformParamsToURLSearch(defaultParams).toString()
      const paramsUrl = getParams()
      const paramsUrlString = transformParamsToURLSearch(paramsUrl).toString()
      const isForcedParams: boolean = hasForcedParamsValues({
        paramsForced: forceParams,
        compareParams: paramsUrl
      })

      if (!isForcedParams) {
        updateParams({
          newParams: {
            ...defaultParams,
            ...forceParams
          }
        })
        return
      }

      const isIncludesForcedParams = hasForcedParamsValues({
        paramsForced: forceParams,
        compareParams: defaultParams as Record<string, unknown>
      })

      if (keysDefaultParams.length > 0 && isIncludesForcedParams) {
        if (defaultParamsString === paramsUrlString) return
        updateParams({ newParams: defaultParams })
      }
    }

    handleStartingParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    searchParams,
    updateParams,
    clearParams,
    getParams,
    getParam,
    onChange,
    pagination
  }
}

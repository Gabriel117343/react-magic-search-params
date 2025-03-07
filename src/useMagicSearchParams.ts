import { useSearchParams } from 'react-router-dom'
import { useMemo, useEffect, useRef, useCallback } from 'react'


// Custom hook with advanced techniques to handle search parameters for any pagination

type CommonParams = {
  page?: number
  page_size?: number
}
/*
Maps all properties of M (mandatory) as required
and all properties of O (optional) as optional. 
*/
type MergeParams<M, O> = {
  [K in keyof M]: M[K]
} & {
  [K in keyof O]?: O[K]
}
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
  forceParams?: Partial<MergeParams<M, O>> // transform all to partial to avoid errors
  arraySerialization?: 'csv' | 'repeat' | 'brackets' // technical to serialize arrays in the URL
  omitParamsByValues?: Array<'all' | 'default' | 'unknown' | 'none' | 'void '> 
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
  O extends Record<string, unknown>,
>({
  mandatory = {} as M,
  optional = {} as O,
  defaultParams = {} as Partial<MergeParams<M, O>>,
  arraySerialization = 'csv',
  forceParams = {} as  {} as Partial<MergeParams<M, O>>,
  omitParamsByValues = [] as Array<'all' | 'default' | 'unknown' | 'none' | 'void '>
}: UseMagicSearchParamsOptions<M, O>)=> {


  const [searchParams, setSearchParams] = useSearchParams() 
    // Ref to store subscriptions: { paramName: [callback1, callback2, ...] }
  const subscriptionsRef = useRef<Record<string, Array<() => unknown>>>({}); 
  const previousParamsRef = useRef<Record<string, unknown>>({})

  const TOTAL_PARAMS_PAGE: MergeParams<M, O> = useMemo(() => {
    return { ...mandatory, ...optional };
  }, [mandatory, optional]);

  const PARAM_ORDER = useMemo(() => {
    return Array.from(Object.keys(TOTAL_PARAMS_PAGE))
  }, [TOTAL_PARAMS_PAGE])

  // we get the keys that are arrays according to TOTAL_PARAMS_PAGE since these require special treatment in the URL due to serialization mode
  const ARRAY_KEYS = useMemo(() => {
    return Object.keys(TOTAL_PARAMS_PAGE).filter(
      (key) => Array.isArray(TOTAL_PARAMS_PAGE[key])
    );
  }, [TOTAL_PARAMS_PAGE])

  const appendArrayValues = (
    finallyParams: Record<string, unknown>,
    newParams: Record<string, string | string[] | unknown>
  ): Record<string, unknown> => {
 
    // Note: We cannot modify the object of the final parameters directly, as immutability must be maintained
    const updatedParams = { ...finallyParams };
  

    if (ARRAY_KEYS.length === 0) return updatedParams;
  
    ARRAY_KEYS.forEach((key) => {
      // We use the current values directly from searchParams (source of truth)
      // This avoids depending on finallyParams in which the arrays have been omitted
      let currentValues = []; 
      switch (arraySerialization) {
        case 'csv': {
          const raw = searchParams.get(key) || '';
          // For csv we expect "value1,value2,..." (no prefix)
          currentValues = raw.split(',')
            .map((v) => v.trim())
            .filter(Boolean) as Array<string>
          break;
        }
        case 'repeat': {
          // Here we get all ocurrences of key
          const urlParams = searchParams.getAll(key) as Array<string>
          currentValues = urlParams.length > 0 ? urlParams : []
          
          console.log({REPEAT: currentValues})
          break;
        }
        case 'brackets': {
           // Build URLSearchParams from current parameters (to ensure no serialized values are taken previously)
            const urlParams = searchParams.getAll(`${key}[]`) as Array<string>
            currentValues = urlParams.length > 0 ? urlParams : []
            console.log({BRACKETS: urlParams})
        
    
            break;
        }
        default: {
          // Mode by default works as csv
          const raw = searchParams.get(key) ?? '';
          currentValues = raw.split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          }
        break; 
      }
      // Update array values with new ones
    
      if (newParams[key] !== undefined) {
        const incoming = newParams[key];
        let combined: string[] = []
        if (typeof incoming === 'string') {
          // If it is a string, it is toggled (add/remove)
          combined = currentValues.includes(incoming)
            ? currentValues.filter((v) => v !== incoming)
            : [...currentValues, incoming];
          console.log({currentValues})
            console.log({incoming})
          console.log({CONBINED_STRING: combined})
        } else if (Array.isArray(incoming)) {
          // if an array is passed, repeated values are merged into a single value
          // Note: Set is used to remove duplicates
          combined = Array.from(new Set([ ...incoming]));
          console.log({incoming})
          console.log({combined})
        } else {
       
          combined = currentValues;
        }

        updatedParams[key] = combined

      }
    });
    console.log({updatedParams})
    return updatedParams
  };

  const transformParamsToURLSearch = (params: Record<string, unknown>): URLSearchParams => {
    console.log({PARAMS_RECIBIDOS_TRANSFORM: params})

    const newParam: URLSearchParams = new URLSearchParams()

    const paramsKeys = Object.keys(params)

    for (const key of paramsKeys) {
      if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
        const arrayValue = params[key] as unknown[]
        console.log({arrayValue})
        switch (arraySerialization) {
          case 'csv': {
            const csvValue = arrayValue.join(',')
            // set ensure that the previous value is replaced
            newParam.set(key, csvValue)
            break
          } case 'repeat': {
      
            for (const item of arrayValue) {
              console.log({item})
              // add new value to the key, instead of replacing it
              newParam.append(key, item as string)
   
            }
            break
          } case 'brackets': {
            for (const item of arrayValue) {
              newParam.append(`${key}[]`, item as string)
            }
            break
          } default: {
            const csvValue = arrayValue.join(',')
            newParam.set(key, csvValue)
          }
        }
      } else {
        newParam.set(key, params[key] as string)
      }
    }
    console.log({FINAL: newParam.toString()})
    return newParam
  }
  // @ts-ignore
  const hasForcedParamsValues = ({ paramsForced, compareParams }) => {

    // Iterates over the forced parameters and verifies that they exist in the URL and match their values
    // Ej: { page: 1, page_size: 10 } === { page: 1, page_size: 10 } => true
    const allParamsMatch = Object.entries(paramsForced).every(
      ([key, value]) => compareParams[key] === value
    );

    return allParamsMatch;
  };
  
  useEffect(() => {

    const keysDefaultParams: string[] = Object.keys(defaultParams)
    const keysForceParams: string[] = Object.keys(forceParams)
    if(keysDefaultParams.length === 0 && keysForceParams.length === 0) return
  

    function handleStartingParams() {

      const defaultParamsString  = transformParamsToURLSearch(defaultParams).toString()
      const paramsUrl = getParams()
      const paramsUrlString = transformParamsToURLSearch(paramsUrl).toString()
      const forceParamsString = transformParamsToURLSearch(forceParams).toString()

      console.log({defaultParamsString})

      const isForcedParams: boolean = hasForcedParamsValues({ paramsForced: forceParams, compareParams: paramsUrl })

      if (!isForcedParams) {

        // In this case, the forced parameters take precedence over the default parameters and the parameters of the current URL (which could have been modified by the user, e.g., page_size=1000)

        updateParams({ newParams: {
          ...defaultParams,
          ...forceParams
        }})
        return
      }
      // In this way it will be validated that the forced parameters keys and values are in the current URL
      const isIncludesForcedParams = hasForcedParamsValues({ paramsForced: forceParamsString, compareParams: defaultParams })

      if (keysDefaultParams.length > 0 && isIncludesForcedParams) {
        if (defaultParamsString === paramsUrlString) return // this means that the URL already has the default parameters
        updateParams({ newParams: defaultParams })
      }

    }
    handleStartingParams()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Convert a string value to its original type (number, boolean, array) according to TOTAL_PARAMS_PAGE
   * @param value - Chain obtained from the URL
   * @param key - Key of the parameter
   */
  const convertOriginalType = (value: string, key: string) => {
    // Given that the parameters of a URL are recieved as strings, they are converted to their original type
    if (typeof TOTAL_PARAMS_PAGE[key] === 'number') {
      return parseInt(value)
    } else if (typeof TOTAL_PARAMS_PAGE[key] === 'boolean') {
      return value === 'true'
    } else if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
      // The result will be a valid array represented in the URL ej: tags=tag1,tag2,tag3 to ['tag1', 'tag2', 'tag3'], useful to combine the values of the arrays with the new ones
 
      if (arraySerialization === 'csv') {
        return searchParams.getAll(key).join('').split(',')
      } else if (arraySerialization === 'repeat') {
    
        console.log({SEARCH_PARAMS: searchParams.getAll(key)})
        return searchParams.getAll(key)
      } else if (arraySerialization === 'brackets') {
        return searchParams.getAll(`${key}[]`)
      }
     
     
    }
    // Note: dates are not converted as it is better to handle them directly in the component that receives them, using a library like < date-fns >
    return value
  }
  
    /**
   * Gets the current parameters from the URL and converts them to their original type if desired
   * @param convert - If true, converts from string to the inferred type (number, boolean, ...)
   */
    const getStringUrl = (key: string, paramsUrl: Record<string, unknown>) => {
      const isKeyArray = Array.isArray(TOTAL_PARAMS_PAGE[key])
      if (isKeyArray) {

        if (arraySerialization === 'brackets') {

          const arrayUrl = searchParams.getAll(`${key}[]`)
          const encodedQueryArray = transformParamsToURLSearch({ [key]: arrayUrl }).toString()
          // in this way the array of the URL is decoded to its original form ej: tags[]=tag1&tags[]=tag2&tags[]=tag3
          const unencodeQuery = decodeURIComponent(encodedQueryArray)
          return unencodeQuery
        } else if (arraySerialization === 'csv') {
          const arrayValue = searchParams.getAll(key)
          const encodedQueryArray = transformParamsToURLSearch({ [key]: arrayValue }).toString()
          const unencodeQuery = decodeURIComponent(encodedQueryArray)
          return unencodeQuery
        }
        const arrayValue = searchParams.getAll(key)
        const stringResult = transformParamsToURLSearch({ [key]: arrayValue }).toString()
        return stringResult
      } else {
   
        return paramsUrl[key] as string
      }
     }
     const getParamsObj = (searchParams: URLSearchParams): Record<string, string | string[]> => {
      const paramsObj: Record<string, string | string[]> = {};
      // @ts-ignore
      for (const [key, value] of searchParams.entries()) {
        if (key.endsWith('[]')) {
          const bareKey = key.replace('[]', '');
          if (paramsObj[bareKey]) {
            (paramsObj[bareKey] as string[]).push(value);
          } else {
            paramsObj[bareKey] = [value];
          }
        } else {
          // If the key already exists, it is a repeated parameter
          if (paramsObj[key]) {
            if (Array.isArray(paramsObj[key])) {
              (paramsObj[key] as string[]).push(value);
            } else {
              paramsObj[key] = [paramsObj[key] as string, value];
            }
          } else {
            paramsObj[key] = value;
          }
        }
      }
      return paramsObj;
     }
    // Optimization: While the parameters are not updated, the current parameters of the URL are not recalculated
    const CURRENT_PARAMS_URL: Record<string, unknown> = useMemo(() => {

      return arraySerialization === 'brackets' ? getParamsObj(searchParams) : Object.fromEntries(searchParams.entries())
    }, [searchParams, arraySerialization])

    const getParams = ({ convert = true } = {}): MergeParams<M, O> => {
      // All the paramteres are extracted from the URL and converted into an object

      const params = Object.keys(CURRENT_PARAMS_URL).reduce((acc, key) => {
        if (Object.prototype.hasOwnProperty.call(TOTAL_PARAMS_PAGE, key)) {
          const realKey = arraySerialization === 'brackets' ? key.replace('[]', '') : key
          // @ts-ignore
          acc[realKey] = convert === true
            ? convertOriginalType(CURRENT_PARAMS_URL[key] as string, key)
            :  getStringUrl(key, CURRENT_PARAMS_URL)
        }
        return acc
      }, {})
  
      return params as MergeParams<M, O>
    }
  type keys = keyof MergeParams<M, O>
  // Note: in this way the return of the getParam function is typed dynamically, thus having autocomplete in the IDE (eg: value.split(','))
  type TagReturn<T extends boolean> = T extends true ? string[] : string;
  const getParam = <T extends boolean>(key: keys, options?: { convert: T }): TagReturn<T>  => {

    const keyStr = String(key)
    // @ts-ignore
    const value = options?.convert === true ? convertOriginalType(searchParams.get(keyStr), keyStr) : getStringUrl(keyStr,  CURRENT_PARAMS_URL)
    return value as TagReturn<T> 
  }
  
  type OptionalParamsFiltered = Partial<O>

  const calculateOmittedParameters = (newParams: Record<string, unknown | unknown[]>, keepParams: Record<string, boolean>) => {
    // Calculate the ommited parameters, that is, the parameters that have not been sent in the request
    const params = getParams()
    // hasOw
    // Note: it will be necessary to omit the parameters that are arrays because the idea is not to replace them but to add or remove some values
    const newParamsWithoutArray = Object.entries(newParams).filter(([key,]) => !Array.isArray(TOTAL_PARAMS_PAGE[key]))
    const result = Object.assign({
      ...params,
      ...Object.fromEntries(newParamsWithoutArray),
      ...forceParams // the forced parameters will always be sent and will maintain their value
    })
    const paramsFiltered: OptionalParamsFiltered = Object.keys(result).reduce((acc, key) => {
      // for default no parameters are omitted unless specified in the keepParams object
      if (Object.prototype.hasOwnProperty.call(keepParams, key) && keepParams[key] === false) {
        return acc
      // Note: They array of parameters omitted by values (e.g., ['all', 'default']) are omitted since they are usually a default value that is not desired to be sent
      } else if (!!result[key] !== false && !omitParamsByValues.includes(result[key])) {
        // @ts-ignore
        acc[key] = result[key]
      }

      return acc
    }, {})

    return {
      ...mandatory,
      ...paramsFiltered
    } 
  }
    // @ts-ignore
  const sortParameters = (paramsFiltered) => {
    // sort the parameters according to the structure so that it persists with each change in the URL, eg: localhost:3000/?page=1&page_size=10
    // Note: this visibly improves the user experience
    const orderedParams = PARAM_ORDER.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(paramsFiltered, key)) {
          // @ts-ignore
        acc[key] = paramsFiltered[key]
      }

      return acc
    }, {})
    return orderedParams
  }

  const mandatoryParameters = () => {
    // Note: in case there are arrays in the URL, they are converted to their original form ej: tags=['tag1', 'tag2'] otherwise the parameters are extracted without converting to optimize performance
    const isNecessaryConvert: boolean = ARRAY_KEYS.length > 0 ? true : false
    const totalParametros: Record<string, unknown>  = getParams({ convert: isNecessaryConvert })

    const paramsUrlFound: Record<string, boolean> = Object.keys(totalParametros).reduce(
      (acc, key) => {
        if (Object.prototype.hasOwnProperty.call(mandatory, key)) {
          // @ts-ignore
          acc[key] = totalParametros[key]
        }
        return acc
      },
      {}
    )

    return paramsUrlFound
  }

  const clearParams = ({ keepMandatoryParams = true } = {}): void => {
    // for default, the mandatory parameters are not cleared since the current pagination would be lost
    const paramsTransformed = transformParamsToURLSearch(
      {
        ...mandatory,
     
         ...(keepMandatoryParams && {
          ...mandatoryParameters()
        }),
        ...forceParams 
      }
    )
    setSearchParams(paramsTransformed) 
  }

  // transforms the keys to boolean to know which parameters to keep
  type KeepParamsTransformedValuesBoolean = Partial<Record<keyof typeof TOTAL_PARAMS_PAGE, boolean>>
  type NewParams = Partial<typeof TOTAL_PARAMS_PAGE> 
  type KeepParams = KeepParamsTransformedValuesBoolean
  const updateParams = ({ newParams = {} as NewParams, keepParams = {} as KeepParams } = {}) => {

    if (
      Object.keys(newParams).length === 0 &&
      Object.keys(keepParams).length === 0
    ) {
      clearParams()
      return
    }
    // @ts-ignore
    const finallyParamters = calculateOmittedParameters(newParams, keepParams)

    const convertedArrayValues = appendArrayValues(finallyParamters, newParams)

    const paramsSorted = sortParameters(convertedArrayValues)

    setSearchParams(transformParamsToURLSearch(paramsSorted))

  }

    // only for the keys of the parameters to subscribe to changes in the URL to trigger the callback
    const onChange = useCallback( (paramName: keys, callbacks: Array<() => void>) => {
      const paramNameStr = String(paramName)
      // replace the previous callbacks with the new ones so as not to accumulate callbacks
      subscriptionsRef.current[paramNameStr] = callbacks;
    }, [])
  
    // each time searchParams changes, we notify the subscribers
    useEffect(() => {

      for (const [key, value] of Object.entries(subscriptionsRef.current)) {

        const newValue = CURRENT_PARAMS_URL[key] ?? null 
        const oldValue = previousParamsRef.current[key] ?? null
        if (newValue !== oldValue) {
          
          for (const callback of value) {
            console.log(value)

            callback()

          }
        }
        // once the callback is executed, the previous value is updated to ensure that the next time the value changes, the callback is executed
        previousParamsRef.current[key] = newValue
      }

      
    }, [CURRENT_PARAMS_URL])
  return {
    searchParams,
    updateParams,
    clearParams,
    getParams,
    getParam,
    onChange
  }
}

import { type UseMagicSearchParamsOptions } from '../../../src'

export const paramsProducts = {
	mandatory: {
		offset: 0,
		limit: 20 as const,
	},
	optional: {
		products_q: '',
	},
}

type MandatoryProductsType = typeof paramsProducts.mandatory
type OptionalProductsType = typeof paramsProducts.optional

export type ProductsHookConfig = UseMagicSearchParamsOptions<
	MandatoryProductsType,
	OptionalProductsType
>

export const paramsProductsConfig: ProductsHookConfig = {
	mandatory: paramsProducts.mandatory,
	optional: paramsProducts.optional,
	defaultParams: paramsProducts.mandatory,
	historyMode: 'replace',
	unknownParamsPolicy: 'preserve',
	paginationStrategy: {
		mode: 'offset',
		offsetKey: 'offset',
		limitKey: 'limit',
	},
	resetOnChange: {
		products_q: ['offset'],
	},
	codecs: {
		products_q: {
			parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '').trim(),
			serialize: (value) => String(value ?? '').trim(),
		},
	},
}

import React, { useRef } from 'react';
import { useMagicSearchParams } from 'react-magic-search-params';
import { paramsUsers, type TagsUserProps } from './constants/defaultParamsPage';

export default function App() {
  const debounceRef = useRef<number | null>(null);

  const { getParams, getParam, updateParams, clearParams, pagination } = useMagicSearchParams({
    ...paramsUsers,
    defaultParams: paramsUsers.mandatory,
    forceParams: { page_size: 10 },
    arraySerialization: 'csv',
    omitParamsByValues: ['all', 'default'],
    historyMode: 'replace',
    unknownParamsPolicy: 'preserve',
    paginationStrategy: {
      mode: 'page',
      pageKey: 'page',
      pageSizeKey: 'page_size',
    },
    resetOnChange: {
      q: ['page', 'cursor'],
      order: ['page', 'cursor'],
      tags: ['page', 'cursor'],
    },
    codecs: {
      q: {
        parse: (value) => String(Array.isArray(value) ? value[0] : value ?? '').trim(),
        serialize: (value) => String(value ?? '').trim().toLowerCase(),
      },
      cursor: {
        parse: (value) => (Array.isArray(value) ? value[0] : value ?? ''),
      },
    },
  });

  const {
    page,
    page_size,
    q = '',
    order = '',
    tags = [],
    cursor = '',
  } = getParams({
    convert: true,
  });

  const tagsRaw = getParam('tags', { convert: false });

  const offsetDemo = useMagicSearchParams({
    mandatory: {
      offset: 0,
      limit: 20,
    },
    optional: {
      products_q: '',
    },
    defaultParams: {
      offset: 0,
      limit: 20,
    },
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
  });

  const { offset = 0, limit = 20, products_q = '' } = offsetDemo.getParams({ convert: true });

  const availableTags: TagsUserProps[] = [
    'react',
    'node',
    'typescript',
    'javascript',
  ];

  const handleQChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQ = event.target.value;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      updateParams({ newParams: { q: nextQ }, historyMode: 'replace' });
    }, 350);
  };

  const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ newParams: { order: event.target.value } });
  };

  const handleToggleTag = (tag: TagsUserProps) => {
    updateParams({ newParams: { tags: tag } });
  };

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '2rem auto' }}>
      <h1>react-magic-search-params - Simple Example</h1>
      <p>
        This demo includes `q` search with replace history + debounce, opaque cursor
        handling with declarative resets, and offset/limit pagination strategy.
      </p>

      <label htmlFor="search">Search (q, debounced)</label>
      <input
        id="search"
        defaultValue={q}
        onChange={handleQChange}
        placeholder="Search users"
        style={{ display: 'block', width: '100%', marginBottom: 12 }}
      />

      <label htmlFor="order">Order</label>
      <select
        id="order"
        value={order}
        onChange={handleOrderChange}
        style={{ display: 'block', width: '100%', marginBottom: 12 }}
      >
        <option value="">none</option>
        <option value="asc">asc</option>
        <option value="desc">desc</option>
      </select>

      <section style={{ marginBottom: 12 }}>
        {availableTags.map((tag) => {
          const active = Array.isArray(tags) && tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleTag(tag)}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {active ? 'active: ' : ''}
              {tag}
            </button>
          );
        })}
      </section>

      <button type="button" onClick={() => pagination.prev()}>
        Prev page
      </button>
      <button type="button" onClick={() => pagination.next()} style={{ marginLeft: 8 }}>
        Next page
      </button>
      <button type="button" onClick={() => pagination.reset()} style={{ marginLeft: 8 }}>
        Reset page
      </button>
      <button
        type="button"
        onClick={() => pagination.setCursor(`cursor_${Date.now().toString(36)}`)}
        style={{ marginLeft: 8 }}
      >
        Set opaque cursor
      </button>
      <button type="button" onClick={() => pagination.setCursor('')} style={{ marginLeft: 8 }}>
        Clear cursor
      </button>
      <button
        type="button"
        onClick={() => clearParams({ keepMandatoryParams: true })}
        style={{ marginLeft: 8 }}
      >
        Clear optional params
      </button>

      <pre style={{ background: '#f7f7f7', padding: 12, marginTop: 16 }}>
{JSON.stringify(
  {
    page,
    page_size,
    q,
    order,
    cursor,
    tags,
    tagsRaw,
  },
  null,
  2
)}
      </pre>

      <h2 style={{ marginTop: 24 }}>Offset/Limit Demo (paginationStrategy: offset)</h2>
      <label htmlFor="products_q">Products search</label>
      <input
        id="products_q"
        defaultValue={products_q}
        onChange={(event) => {
          offsetDemo.updateParams({
            newParams: { products_q: event.target.value },
            historyMode: 'replace',
          });
        }}
        placeholder="Filter products"
        style={{ display: 'block', width: '100%', marginBottom: 12 }}
      />
      <button type="button" onClick={() => offsetDemo.pagination.prev()}>
        Prev offset window
      </button>
      <button type="button" onClick={() => offsetDemo.pagination.next()} style={{ marginLeft: 8 }}>
        Next offset window
      </button>
      <button type="button" onClick={() => offsetDemo.pagination.reset()} style={{ marginLeft: 8 }}>
        Reset offset
      </button>
      <pre style={{ background: '#f7f7f7', padding: 12, marginTop: 16 }}>
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
    </main>
  );
}

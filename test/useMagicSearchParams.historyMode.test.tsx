import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMagicSearchParams } from '../src/useMagicSearchParams';

const setSearchParamsMock = vi.fn();
let currentParams = new URLSearchParams('page=1');

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [currentParams, setSearchParamsMock],
}));

describe('useMagicSearchParams historyMode', () => {
  beforeEach(() => {
    currentParams = new URLSearchParams('page=1');
    setSearchParamsMock.mockReset();
  });

  it('should use replace mode when historyMode is replace', () => {
    const { result } = renderHook(() =>
      useMagicSearchParams({
        mandatory: { page: 1 },
        optional: {},
        historyMode: 'replace',
      })
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 2 } });
    });

    const lastCall = setSearchParamsMock.mock.calls.at(-1);
    expect(lastCall?.[1]).toEqual({ replace: true });
  });

  it('should default to push mode', () => {
    const { result } = renderHook(() =>
      useMagicSearchParams({
        mandatory: { page: 1 },
        optional: {},
      })
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 2 } });
    });

    const lastCall = setSearchParamsMock.mock.calls.at(-1);
    expect(lastCall?.[1]).toEqual({ replace: false });
  });

  it('should not write history when defaultParams already match on mount', () => {
    renderHook(() =>
      useMagicSearchParams({
        mandatory: { page: 1 },
        optional: {},
        defaultParams: { page: 1 },
      })
    );

    expect(setSearchParamsMock).not.toHaveBeenCalled();
  });

  it('should use replace when syncing defaultParams on mount', () => {
    currentParams = new URLSearchParams('page=1');

    renderHook(() =>
      useMagicSearchParams({
        mandatory: { page: 1 },
        optional: { view: '' },
        defaultParams: { page: 1, view: 'table' },
      })
    );

    const lastCall = setSearchParamsMock.mock.calls.at(-1);
    expect(lastCall?.[0].toString()).toBe('page=1&view=table');
    expect(lastCall?.[1]).toEqual({ replace: true });
  });

  it('should use replace when syncing forceParams on mount even if global historyMode is push', () => {
    currentParams = new URLSearchParams('page=1&limit=50');

    renderHook(() =>
      useMagicSearchParams({
        mandatory: { page: 1, limit: 20 },
        optional: {},
        defaultParams: { page: 1 },
        forceParams: { limit: 20 },
      })
    );

    const lastCall = setSearchParamsMock.mock.calls.at(-1);
    expect(lastCall?.[0].toString()).toBe('page=1&limit=20');
    expect(lastCall?.[1]).toEqual({ replace: true });
  });
});

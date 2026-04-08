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
});

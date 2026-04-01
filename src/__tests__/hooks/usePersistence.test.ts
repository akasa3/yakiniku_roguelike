// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import type { PersistentState } from '../../types';

// ---------------------------------------------------------------------------
// Module mock — intercept persistence utilities before the hook imports them
// ---------------------------------------------------------------------------

vi.mock('../../utils/persistence', () => ({
  loadPersistentState: vi.fn(),
}));

import { loadPersistentState } from '../../utils/persistence';
import { usePersistence } from '../../hooks/usePersistence';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_STATE: PersistentState = {
  highScore: 0,
  unlockedCharacters: ['tanaka'],
  catalog: [],
  clearedWithCharacterIds: [],
};

function makeState(overrides: Partial<PersistentState> = {}): PersistentState {
  return { ...DEFAULT_STATE, ...overrides };
}

// Cast once so every test can set return values without repeating the cast
const mockLoad = loadPersistentState as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockLoad.mockReturnValue(makeState());
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// usePersistence — return shape
// ---------------------------------------------------------------------------

describe('usePersistence — return shape', () => {
  it('returns an object with `persistent` and `reload` keys', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current).toHaveProperty('persistent');
    expect(result.current).toHaveProperty('reload');
  });

  it('`reload` is a function', () => {
    const { result } = renderHook(() => usePersistence());
    expect(typeof result.current.reload).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// usePersistence — initial load on mount
// ---------------------------------------------------------------------------

describe('usePersistence — initial load on mount', () => {
  it('calls loadPersistentState() exactly once on mount', () => {
    renderHook(() => usePersistence());
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('exposes the value returned by loadPersistentState as `persistent`', () => {
    const stored = makeState({ highScore: 5 });
    mockLoad.mockReturnValue(stored);

    const { result } = renderHook(() => usePersistence());

    expect(result.current.persistent.highScore).toBe(5);
  });

  it('persistent.unlockedCharacters reflects loaded value on mount', () => {
    mockLoad.mockReturnValue(
      makeState({ unlockedCharacters: ['tanaka', 'gourmet-critic'] }),
    );

    const { result } = renderHook(() => usePersistence());

    expect(result.current.persistent.unlockedCharacters).toEqual([
      'tanaka',
      'gourmet-critic',
    ]);
  });

  it('persistent.catalog reflects loaded value on mount', () => {
    mockLoad.mockReturnValue(makeState({ catalog: ['kalbi', 'beef-tongue'] }));

    const { result } = renderHook(() => usePersistence());

    expect(result.current.persistent.catalog).toEqual(['kalbi', 'beef-tongue']);
  });

  it('persistent.clearedWithCharacterIds reflects loaded value on mount', () => {
    mockLoad.mockReturnValue(
      makeState({ clearedWithCharacterIds: ['tanaka'] }),
    );

    const { result } = renderHook(() => usePersistence());

    expect(result.current.persistent.clearedWithCharacterIds).toEqual([
      'tanaka',
    ]);
  });
});

// ---------------------------------------------------------------------------
// usePersistence — default values (nothing stored)
// ---------------------------------------------------------------------------

describe('usePersistence — default values when nothing is stored', () => {
  it('persistent.highScore defaults to 0', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.highScore).toBe(0);
  });

  it('persistent.unlockedCharacters defaults to ["tanaka"]', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.unlockedCharacters).toEqual(['tanaka']);
  });

  it('persistent.catalog defaults to []', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.catalog).toEqual([]);
  });

  it('persistent.clearedWithCharacterIds defaults to []', () => {
    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.clearedWithCharacterIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// usePersistence — reload()
// ---------------------------------------------------------------------------

describe('usePersistence — reload()', () => {
  it('calling reload() triggers another call to loadPersistentState()', () => {
    const { result } = renderHook(() => usePersistence());
    expect(mockLoad).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reload();
    });

    expect(mockLoad).toHaveBeenCalledTimes(2);
  });

  it('persistent is updated with the newly loaded value after reload()', () => {
    mockLoad.mockReturnValueOnce(makeState({ highScore: 0 }));
    mockLoad.mockReturnValueOnce(makeState({ highScore: 42 }));

    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.highScore).toBe(0);

    act(() => {
      result.current.reload();
    });

    expect(result.current.persistent.highScore).toBe(42);
  });

  it('reloads updated unlockedCharacters', () => {
    mockLoad.mockReturnValueOnce(makeState({ unlockedCharacters: ['tanaka'] }));
    mockLoad.mockReturnValueOnce(
      makeState({ unlockedCharacters: ['tanaka', 'competitive-eater'] }),
    );

    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.unlockedCharacters).toEqual(['tanaka']);

    act(() => {
      result.current.reload();
    });

    expect(result.current.persistent.unlockedCharacters).toEqual([
      'tanaka',
      'competitive-eater',
    ]);
  });

  it('reloads updated catalog', () => {
    mockLoad.mockReturnValueOnce(makeState({ catalog: [] }));
    mockLoad.mockReturnValueOnce(makeState({ catalog: ['kalbi'] }));

    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.catalog).toEqual([]);

    act(() => {
      result.current.reload();
    });

    expect(result.current.persistent.catalog).toEqual(['kalbi']);
  });

  it('reloads updated clearedWithCharacterIds', () => {
    mockLoad.mockReturnValueOnce(makeState({ clearedWithCharacterIds: [] }));
    mockLoad.mockReturnValueOnce(
      makeState({ clearedWithCharacterIds: ['tanaka'] }),
    );

    const { result } = renderHook(() => usePersistence());
    expect(result.current.persistent.clearedWithCharacterIds).toEqual([]);

    act(() => {
      result.current.reload();
    });

    expect(result.current.persistent.clearedWithCharacterIds).toEqual([
      'tanaka',
    ]);
  });

  it('calling reload() multiple times re-fetches each time', () => {
    const { result } = renderHook(() => usePersistence());

    act(() => { result.current.reload(); });
    act(() => { result.current.reload(); });
    act(() => { result.current.reload(); });

    // mount (1) + 3 reloads = 4 total calls
    expect(mockLoad).toHaveBeenCalledTimes(4);
  });

  it('reload() after unmount does not cause a state-update warning', () => {
    const { result, unmount } = renderHook(() => usePersistence());
    const { reload } = result.current;

    unmount();

    // Should not throw and should not log a React state-update-on-unmounted warning
    expect(() => {
      act(() => { reload(); });
    }).not.toThrow();
  });
});

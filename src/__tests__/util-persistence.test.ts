import { vi } from 'vitest';
import type { CharacterId, PersistentState } from '../types';
import {
  saveHighScore,
  loadHighScore,
  saveUnlockedCharacters,
  loadUnlockedCharacters,
  saveCatalog,
  loadCatalog,
  saveClearedWith,
  loadClearedWith,
  savePersistentState,
  loadPersistentState,
} from '../utils/persistence';

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number): string | null => Object.keys(store)[index] ?? null),
    _store: store,
  };
}

let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

beforeEach(() => {
  localStorageMock = makeLocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePersistentState(
  overrides: Partial<PersistentState> = {},
): PersistentState {
  return {
    highScore: 0,
    unlockedCharacters: ['tanaka'],
    catalog: [],
    clearedWithCharacterIds: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// saveHighScore / loadHighScore
// ---------------------------------------------------------------------------

describe('loadHighScore()', () => {
  it('returns 0 when nothing is stored (default)', () => {
    expect(loadHighScore()).toBe(0);
  });

  it('returns the stored integer after saveHighScore', () => {
    saveHighScore(5);
    expect(loadHighScore()).toBe(5);
  });

  it('returns 0 for corrupted (non-numeric) stored value', () => {
    localStorageMock._store['yakirogue_highscore'] = 'not-a-number';
    expect(loadHighScore()).toBe(0);
  });

  it('returns 0 when stored value is an empty string', () => {
    localStorageMock._store['yakirogue_highscore'] = '';
    expect(loadHighScore()).toBe(0);
  });

  it('returns 0 when localStorage is unavailable (getItem throws)', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    expect(loadHighScore()).toBe(0);
  });

  it('always returns a non-negative integer', () => {
    localStorageMock._store['yakirogue_highscore'] = JSON.stringify(42);
    const result = loadHighScore();
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('saveHighScore()', () => {
  it('writes score 0 when nothing is stored yet (first run)', () => {
    saveHighScore(0);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'yakirogue_highscore',
      expect.any(String),
    );
    expect(loadHighScore()).toBe(0);
  });

  it('writes a higher score, replacing the current stored value', () => {
    saveHighScore(3);
    saveHighScore(7);
    expect(loadHighScore()).toBe(7);
  });

  it('does NOT overwrite when new score equals existing score', () => {
    saveHighScore(5);
    const callsBefore = localStorageMock.setItem.mock.calls.length;
    saveHighScore(5);
    expect(localStorageMock.setItem.mock.calls.length).toBe(callsBefore);
  });

  it('does NOT overwrite when new score is lower than existing score', () => {
    saveHighScore(10);
    const callsBefore = localStorageMock.setItem.mock.calls.length;
    saveHighScore(3);
    expect(localStorageMock.setItem.mock.calls.length).toBe(callsBefore);
    expect(loadHighScore()).toBe(10);
  });

  it('does not throw when localStorage.setItem throws (silent failure)', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveHighScore(99)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// saveUnlockedCharacters / loadUnlockedCharacters
// ---------------------------------------------------------------------------

describe('loadUnlockedCharacters()', () => {
  it('returns ["tanaka"] when nothing is stored (default)', () => {
    expect(loadUnlockedCharacters()).toEqual(['tanaka']);
  });

  it('returns the stored array after saveUnlockedCharacters', () => {
    const chars: CharacterId[] = ['tanaka', 'gourmet-critic'];
    saveUnlockedCharacters(chars);
    expect(loadUnlockedCharacters()).toEqual(['tanaka', 'gourmet-critic']);
  });

  it('always includes "tanaka" even when the stored array omits it', () => {
    localStorageMock._store['yakirogue_characters'] = JSON.stringify([
      'gourmet-critic',
    ]);
    const result = loadUnlockedCharacters();
    expect(result).toContain('tanaka');
  });

  it('returns ["tanaka"] for corrupted JSON', () => {
    localStorageMock._store['yakirogue_characters'] = '{invalid-json}}}';
    expect(loadUnlockedCharacters()).toEqual(['tanaka']);
  });

  it('returns ["tanaka"] when the stored value is not an array', () => {
    localStorageMock._store['yakirogue_characters'] = JSON.stringify({
      id: 'tanaka',
    });
    expect(loadUnlockedCharacters()).toEqual(['tanaka']);
  });

  it('returns ["tanaka"] when localStorage is unavailable', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    expect(loadUnlockedCharacters()).toEqual(['tanaka']);
  });

  it('filters out unknown CharacterId values (forward-compatibility)', () => {
    localStorageMock._store['yakirogue_characters'] = JSON.stringify([
      'tanaka',
      'unknown-future-character',
    ]);
    const result = loadUnlockedCharacters();
    expect(result).toContain('tanaka');
    expect(result).not.toContain('unknown-future-character');
  });

  it('includes all valid CharacterId values when stored', () => {
    const all: CharacterId[] = [
      'tanaka',
      'gourmet-critic',
      'competitive-eater',
      'raw-food-advocate',
      'vegan-tashiro',
    ];
    saveUnlockedCharacters(all);
    const result = loadUnlockedCharacters();
    for (const id of all) {
      expect(result).toContain(id);
    }
  });
});

describe('saveUnlockedCharacters()', () => {
  it('writes the array to localStorage', () => {
    const chars: CharacterId[] = ['tanaka', 'competitive-eater'];
    saveUnlockedCharacters(chars);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'yakirogue_characters',
      JSON.stringify(chars),
    );
  });

  it('overwrites previously stored value with the new array', () => {
    saveUnlockedCharacters(['tanaka']);
    saveUnlockedCharacters(['tanaka', 'gourmet-critic']);
    expect(loadUnlockedCharacters()).toEqual(['tanaka', 'gourmet-critic']);
  });

  it('does not throw when localStorage.setItem throws (silent failure)', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveUnlockedCharacters(['tanaka'])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// saveCatalog / loadCatalog
// ---------------------------------------------------------------------------

describe('loadCatalog()', () => {
  it('returns [] when nothing is stored (default)', () => {
    expect(loadCatalog()).toEqual([]);
  });

  it('returns the stored array after saveCatalog', () => {
    saveCatalog(['kalbi', 'beef-tongue']);
    expect(loadCatalog()).toEqual(['kalbi', 'beef-tongue']);
  });

  it('returns [] for corrupted JSON', () => {
    localStorageMock._store['yakirogue_catalog'] = '[[broken}';
    expect(loadCatalog()).toEqual([]);
  });

  it('returns [] when the stored value is not an array', () => {
    localStorageMock._store['yakirogue_catalog'] = JSON.stringify(42);
    expect(loadCatalog()).toEqual([]);
  });

  it('returns [] when localStorage is unavailable', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    expect(loadCatalog()).toEqual([]);
  });

  it('filters out unknown (non-meat) part IDs (forward-compatibility)', () => {
    localStorageMock._store['yakirogue_catalog'] = JSON.stringify([
      'kalbi',
      'unknown-future-meat',
    ]);
    const result = loadCatalog();
    expect(result).toContain('kalbi');
    expect(result).not.toContain('unknown-future-meat');
  });

  it('filters out vegetable IDs from catalog', () => {
    // vegetables (corn, kimchi) are not valid catalog entries per spec
    localStorageMock._store['yakirogue_catalog'] = JSON.stringify([
      'kalbi',
      'corn',
    ]);
    const result = loadCatalog();
    expect(result).toContain('kalbi');
    expect(result).not.toContain('corn');
  });

  it('returns [] for empty stored array', () => {
    saveCatalog([]);
    expect(loadCatalog()).toEqual([]);
  });
});

describe('saveCatalog()', () => {
  it('writes the array to localStorage', () => {
    saveCatalog(['kalbi']);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'yakirogue_catalog',
      JSON.stringify(['kalbi']),
    );
  });

  it('overwrites previously stored value with the new array', () => {
    saveCatalog(['kalbi']);
    saveCatalog(['beef-tongue', 'harami']);
    expect(loadCatalog()).toEqual(['beef-tongue', 'harami']);
  });

  it('does not throw when localStorage.setItem throws (silent failure)', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveCatalog(['kalbi'])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// saveClearedWith / loadClearedWith
// ---------------------------------------------------------------------------

describe('loadClearedWith()', () => {
  it('returns [] when nothing is stored (default / brand-new save)', () => {
    expect(loadClearedWith()).toEqual([]);
  });

  it('returns the stored array after saveClearedWith', () => {
    saveClearedWith(['tanaka']);
    expect(loadClearedWith()).toEqual(['tanaka']);
  });

  it('returns [] for corrupted JSON', () => {
    localStorageMock._store['yakirogue_cleared_with'] = 'not-json';
    expect(loadClearedWith()).toEqual([]);
  });

  it('returns [] when the stored value is not an array', () => {
    localStorageMock._store['yakirogue_cleared_with'] = JSON.stringify(false);
    expect(loadClearedWith()).toEqual([]);
  });

  it('returns [] when localStorage is unavailable', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    expect(loadClearedWith()).toEqual([]);
  });

  it('filters out unknown CharacterId values (forward-compatibility)', () => {
    localStorageMock._store['yakirogue_cleared_with'] = JSON.stringify([
      'tanaka',
      'future-dlc-character',
    ]);
    const result = loadClearedWith();
    expect(result).toContain('tanaka');
    expect(result).not.toContain('future-dlc-character');
  });

  it('returns [] for empty stored array', () => {
    saveClearedWith([]);
    expect(loadClearedWith()).toEqual([]);
  });

  it('stores and retrieves multiple cleared characters', () => {
    const cleared: CharacterId[] = ['tanaka', 'gourmet-critic', 'competitive-eater'];
    saveClearedWith(cleared);
    expect(loadClearedWith()).toEqual(cleared);
  });
});

describe('saveClearedWith()', () => {
  it('writes the array to localStorage under the canonical key', () => {
    saveClearedWith(['tanaka']);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'yakirogue_cleared_with',
      JSON.stringify(['tanaka']),
    );
  });

  it('overwrites previously stored value — caller must load-append-save to preserve history', () => {
    saveClearedWith(['tanaka']);
    saveClearedWith(['gourmet-critic']);
    expect(loadClearedWith()).toEqual(['gourmet-critic']);
  });

  it('does not throw when localStorage.setItem throws (silent failure)', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveClearedWith(['tanaka'])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// savePersistentState / loadPersistentState
// ---------------------------------------------------------------------------

describe('savePersistentState()', () => {
  it('writes all four fields to localStorage', () => {
    const state = makePersistentState({
      highScore: 12,
      unlockedCharacters: ['tanaka', 'gourmet-critic'],
      catalog: ['kalbi'],
      clearedWithCharacterIds: ['tanaka'],
    });
    savePersistentState(state);

    expect(loadHighScore()).toBe(12);
    expect(loadUnlockedCharacters()).toEqual(['tanaka', 'gourmet-critic']);
    expect(loadCatalog()).toEqual(['kalbi']);
    expect(loadClearedWith()).toEqual(['tanaka']);
  });

  it('saves highScore using only-if-higher semantics (does not downgrade)', () => {
    saveHighScore(20);
    const state = makePersistentState({ highScore: 5 });
    savePersistentState(state);
    // 5 < 20 → high score must stay at 20
    expect(loadHighScore()).toBe(20);
  });

  it('saves all fields independently — a failure in one does not block others', () => {
    // Simulate setItem failing only for the highscore key
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      if (key === 'yakirogue_highscore') throw new Error('Quota exceeded');
      // Write to store for all other keys
      localStorageMock._store[key] = value;
    });

    const state = makePersistentState({
      highScore: 5,
      unlockedCharacters: ['tanaka', 'competitive-eater'],
      catalog: ['kalbi'],
      clearedWithCharacterIds: ['tanaka'],
    });

    expect(() => savePersistentState(state)).not.toThrow();
    // The other three fields should still be readable
    expect(loadUnlockedCharacters()).toContain('tanaka');
    expect(loadCatalog()).toEqual(['kalbi']);
    expect(loadClearedWith()).toEqual(['tanaka']);
  });

  it('does not throw when localStorage is completely unavailable', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    expect(() => savePersistentState(makePersistentState())).not.toThrow();
  });
});

describe('loadPersistentState()', () => {
  it('returns fully defaulted PersistentState when nothing is stored', () => {
    const state = loadPersistentState();
    expect(state.highScore).toBe(0);
    expect(state.unlockedCharacters).toEqual(['tanaka']);
    expect(state.catalog).toEqual([]);
    expect(state.clearedWithCharacterIds).toEqual([]);
  });

  it('returns all four fields populated from stored values', () => {
    saveHighScore(8);
    saveUnlockedCharacters(['tanaka', 'raw-food-advocate']);
    saveCatalog(['kalbi', 'beef-tongue']);
    saveClearedWith(['tanaka']);

    const state = loadPersistentState();
    expect(state.highScore).toBe(8);
    expect(state.unlockedCharacters).toEqual(['tanaka', 'raw-food-advocate']);
    expect(state.catalog).toEqual(['kalbi', 'beef-tongue']);
    expect(state.clearedWithCharacterIds).toEqual(['tanaka']);
  });

  it('unlockedCharacters always contains "tanaka"', () => {
    // corrupt the stored characters to omit tanaka
    localStorageMock._store['yakirogue_characters'] = JSON.stringify([
      'gourmet-critic',
    ]);
    const state = loadPersistentState();
    expect(state.unlockedCharacters).toContain('tanaka');
  });

  it('returns fully defaulted state when localStorage is unavailable', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    const state = loadPersistentState();
    expect(state.highScore).toBe(0);
    expect(state.unlockedCharacters).toEqual(['tanaka']);
    expect(state.catalog).toEqual([]);
    expect(state.clearedWithCharacterIds).toEqual([]);
  });

  it('returned object has all four required keys', () => {
    const state = loadPersistentState();
    expect(state).toHaveProperty('highScore');
    expect(state).toHaveProperty('unlockedCharacters');
    expect(state).toHaveProperty('catalog');
    expect(state).toHaveProperty('clearedWithCharacterIds');
  });

  it('round-trips a full PersistentState via savePersistentState + loadPersistentState', () => {
    const original = makePersistentState({
      highScore: 7,
      unlockedCharacters: ['tanaka', 'competitive-eater'],
      catalog: ['kalbi'],
      clearedWithCharacterIds: ['tanaka', 'competitive-eater'],
    });
    savePersistentState(original);
    const loaded = loadPersistentState();

    expect(loaded.highScore).toBe(original.highScore);
    expect(Array.from(loaded.unlockedCharacters).sort()).toEqual(
      Array.from(original.unlockedCharacters).sort(),
    );
    expect(Array.from(loaded.catalog).sort()).toEqual(
      Array.from(original.catalog).sort(),
    );
    expect(Array.from(loaded.clearedWithCharacterIds).sort()).toEqual(
      Array.from(original.clearedWithCharacterIds).sort(),
    );
  });
});

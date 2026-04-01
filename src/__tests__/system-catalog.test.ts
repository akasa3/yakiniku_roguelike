import { describe, it, expect } from 'vitest';
import {
  unlockCatalogEntry,
  isCatalogUnlocked,
  getCatalogProgress,
} from '../game/systems/catalog';
import type { GameState } from '../types';

// ---------------------------------------------------------------------------
// Mock GameState builder
// ---------------------------------------------------------------------------

const ALL_MEAT_IDS = [
  'kalbi',
  'beef-tongue',
  'harami',
  'upper-kalbi',
  'thick-tongue',
  'loin',
  'special-kalbi',
  'zabuton',
  'misuji',
  'chateaubriand',
  'ichibo',
] as const;

const VEGETABLE_IDS = ['green-pepper', 'eggplant'] as const;

function buildMockGameState(overrides: Partial<GameState> = {}): GameState {
  const mockRestaurant: GameState['restaurant'] = {
    definition: {
      type: 'chain',
      nameJP: 'テスト食堂',
      totalDishes: 10,
      servingInterval: 5,
      rankDistribution: { common: 0.6, upper: 0.3, premium: 0.08, elite: 0.02 },
      activePenalties: [],
    },
    dishesServed: 0,
    meatDishesEaten: 0,
    totalMeatDishes: 8,
    timeSinceLastServe: 0,
    effectiveServingInterval: 5,
    startTime: 0,
    servingQueue: [],
    isCleared: false,
  };

  const base: GameState = {
    character: 'tanaka',
    cycle: 1,
    restaurantIndexInCycle: 0,
    score: 0,
    highestRestaurantTypeReached: 0,
    restaurant: mockRestaurant,
    grill: [],
    table: [],
    tableCapacity: 5,
    skills: [],
    coins: 0,
    staffWarningCount: 0,
    actionDisabledTimer: 0,
    burntSmokeActive: false,
    consecutiveEatCount: 0,
    bingeNextDishDoubled: false,
    allSlotsOccupiedLastTick: false,
    phase: 'playing',
    gameOver: null,
    pendingSkillChoices: [],
    pendingNodeChoice: false,
    catalog: [],
    elapsedTime: 0,
  };

  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// unlockCatalogEntry
// ---------------------------------------------------------------------------

describe('unlockCatalogEntry', () => {
  describe('happy path — unlocking a new meat part', () => {
    it('adds the meat id to state.catalog when it is not already present', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'kalbi');
      expect(next.catalog).toContain('kalbi');
    });

    it('returns a new state reference (immutable update)', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'kalbi');
      expect(next).not.toBe(state);
    });

    it('preserves other fields on the returned state', () => {
      const state = buildMockGameState({ catalog: [], coins: 42, score: 7 });
      const next = unlockCatalogEntry(state, 'beef-tongue');
      expect(next.coins).toBe(42);
      expect(next.score).toBe(7);
    });

    it('appends the id to an existing catalog with other entries', () => {
      const state = buildMockGameState({ catalog: ['kalbi', 'harami'] });
      const next = unlockCatalogEntry(state, 'loin');
      expect(next.catalog).toContain('kalbi');
      expect(next.catalog).toContain('harami');
      expect(next.catalog).toContain('loin');
      expect(next.catalog.length).toBe(3);
    });

    it('can unlock every one of the 11 meat part ids', () => {
      let state = buildMockGameState({ catalog: [] });
      for (const id of ALL_MEAT_IDS) {
        state = unlockCatalogEntry(state, id);
      }
      expect(state.catalog.length).toBe(11);
      for (const id of ALL_MEAT_IDS) {
        expect(state.catalog).toContain(id);
      }
    });
  });

  describe('duplicate unlock — idempotency', () => {
    it('returns the same state reference when meatId is already unlocked', () => {
      const state = buildMockGameState({ catalog: ['kalbi'] });
      const next = unlockCatalogEntry(state, 'kalbi');
      expect(next).toBe(state);
    });

    it('does not add a duplicate entry when called twice with the same id', () => {
      const state = buildMockGameState({ catalog: [] });
      const after1 = unlockCatalogEntry(state, 'harami');
      const after2 = unlockCatalogEntry(after1, 'harami');
      const kalbiCount = after2.catalog.filter((id) => id === 'harami').length;
      expect(kalbiCount).toBe(1);
    });

    it('does not duplicate when catalog already has multiple entries', () => {
      const state = buildMockGameState({ catalog: ['kalbi', 'loin', 'harami'] });
      const next = unlockCatalogEntry(state, 'loin');
      expect(next.catalog.filter((id) => id === 'loin').length).toBe(1);
    });
  });

  describe('vegetable handling — no-op', () => {
    it('returns state unchanged (same reference) for green-pepper', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'green-pepper');
      expect(next).toBe(state);
    });

    it('returns state unchanged (same reference) for eggplant', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'eggplant');
      expect(next).toBe(state);
    });

    it('does not add vegetable ids to state.catalog', () => {
      let state = buildMockGameState({ catalog: [] });
      for (const id of VEGETABLE_IDS) {
        state = unlockCatalogEntry(state, id);
      }
      expect(state.catalog.length).toBe(0);
      for (const id of VEGETABLE_IDS) {
        expect(state.catalog).not.toContain(id);
      }
    });
  });

  describe('unrecognized id — no-op', () => {
    it('returns state unchanged (same reference) for an unknown id', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'mystery-meat');
      expect(next).toBe(state);
    });

    it('returns state unchanged for an empty string id', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, '');
      expect(next).toBe(state);
    });

    it('is case-sensitive — uppercase variant is treated as unrecognized', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'Kalbi');
      expect(next).toBe(state);
    });

    it('is case-sensitive — mixed-case variant is treated as unrecognized', () => {
      const state = buildMockGameState({ catalog: [] });
      const next = unlockCatalogEntry(state, 'BEEF-TONGUE');
      expect(next).toBe(state);
    });
  });
});

// ---------------------------------------------------------------------------
// isCatalogUnlocked
// ---------------------------------------------------------------------------

describe('isCatalogUnlocked', () => {
  it('returns true for a meat id that is in state.catalog', () => {
    const state = buildMockGameState({ catalog: ['kalbi'] });
    expect(isCatalogUnlocked(state, 'kalbi')).toBe(true);
  });

  it('returns false for a meat id not in state.catalog', () => {
    const state = buildMockGameState({ catalog: ['kalbi'] });
    expect(isCatalogUnlocked(state, 'harami')).toBe(false);
  });

  it('returns false on an empty catalog (fresh run)', () => {
    const state = buildMockGameState({ catalog: [] });
    expect(isCatalogUnlocked(state, 'kalbi')).toBe(false);
  });

  it('returns false for a vegetable id (never stored in catalog)', () => {
    const state = buildMockGameState({ catalog: [] });
    expect(isCatalogUnlocked(state, 'green-pepper')).toBe(false);
    expect(isCatalogUnlocked(state, 'eggplant')).toBe(false);
  });

  it('returns false for an unknown id', () => {
    const state = buildMockGameState({ catalog: ['kalbi', 'loin'] });
    expect(isCatalogUnlocked(state, 'nonexistent')).toBe(false);
  });

  it('returns true for all 11 parts when all are in catalog', () => {
    const state = buildMockGameState({ catalog: [...ALL_MEAT_IDS] });
    for (const id of ALL_MEAT_IDS) {
      expect(isCatalogUnlocked(state, id)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getCatalogProgress
// ---------------------------------------------------------------------------

describe('getCatalogProgress', () => {
  describe('total is always 11', () => {
    it('returns total === 11 on a fresh (empty) catalog', () => {
      const state = buildMockGameState({ catalog: [] });
      expect(getCatalogProgress(state).total).toBe(11);
    });

    it('returns total === 11 with some entries unlocked', () => {
      const state = buildMockGameState({ catalog: ['kalbi', 'harami'] });
      expect(getCatalogProgress(state).total).toBe(11);
    });

    it('returns total === 11 when all entries are unlocked', () => {
      const state = buildMockGameState({ catalog: [...ALL_MEAT_IDS] });
      expect(getCatalogProgress(state).total).toBe(11);
    });
  });

  describe('unlocked count reflects valid meat entries only', () => {
    it('returns unlocked === 0 on a fresh run', () => {
      const state = buildMockGameState({ catalog: [] });
      expect(getCatalogProgress(state).unlocked).toBe(0);
    });

    it('returns unlocked === 1 after one entry', () => {
      const state = buildMockGameState({ catalog: ['beef-tongue'] });
      expect(getCatalogProgress(state).unlocked).toBe(1);
    });

    it('returns unlocked === 5 with five entries', () => {
      const state = buildMockGameState({
        catalog: ['kalbi', 'beef-tongue', 'harami', 'upper-kalbi', 'loin'],
      });
      expect(getCatalogProgress(state).unlocked).toBe(5);
    });

    it('returns unlocked === 11 when all 11 parts are present', () => {
      const state = buildMockGameState({ catalog: [...ALL_MEAT_IDS] });
      expect(getCatalogProgress(state).unlocked).toBe(11);
    });

    it('unlocked is never greater than total', () => {
      const state = buildMockGameState({ catalog: [...ALL_MEAT_IDS] });
      const { unlocked, total } = getCatalogProgress(state);
      expect(unlocked).toBeLessThanOrEqual(total);
    });
  });

  describe('all-unlocked state', () => {
    it('returns { unlocked: 11, total: 11 } when all meat parts have been eaten', () => {
      const state = buildMockGameState({ catalog: [...ALL_MEAT_IDS] });
      const progress = getCatalogProgress(state);
      expect(progress).toEqual({ unlocked: 11, total: 11 });
    });
  });

  describe('vegetable ids in catalog are not counted', () => {
    it('does not count green-pepper if accidentally present in catalog', () => {
      // If a vegetable id somehow ends up in state.catalog, getCatalogProgress
      // must not count it toward the unlocked tally.
      const state = buildMockGameState({
        catalog: ['kalbi', 'green-pepper'],
      });
      expect(getCatalogProgress(state).unlocked).toBe(1);
    });

    it('does not count eggplant if accidentally present in catalog', () => {
      const state = buildMockGameState({
        catalog: ['kalbi', 'harami', 'eggplant'],
      });
      expect(getCatalogProgress(state).unlocked).toBe(2);
    });
  });

  describe('return shape', () => {
    it('returns an object with exactly the keys unlocked and total', () => {
      const state = buildMockGameState({ catalog: [] });
      const result = getCatalogProgress(state);
      expect(Object.keys(result).sort()).toEqual(['total', 'unlocked'].sort());
    });

    it('both values are numbers', () => {
      const state = buildMockGameState({ catalog: ['ichibo'] });
      const { unlocked, total } = getCatalogProgress(state);
      expect(typeof unlocked).toBe('number');
      expect(typeof total).toBe('number');
    });
  });
});

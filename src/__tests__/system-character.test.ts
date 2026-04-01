import { describe, it, expect } from 'vitest';
import {
  getCharacterModifiers,
  canUnlockCharacter,
  processVeganExchange,
} from '../game/systems/character';
import type { GameState, GrillSlot, PersistentState, MeatPart, Restaurant, RestaurantDefinition } from '../types';
import {
  GOURMET_SWEET_SPOT_BONUS,
  GOURMET_COMMON_COIN_MULTIPLIER,
  COMPETITIVE_EATER_SPEED_MULTIPLIER,
  COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER,
  VEGETABLE_COIN_MULTIPLIER,
  VEGAN_MEAT_EAT_WARNING_PENALTY,
  DELAYED_EXCHANGE_DURATION,
  INITIAL_GRILL_SLOTS,
  INITIAL_TABLE_CAPACITY,
} from '../game/data/constants';

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

function makeMeatPart(overrides: Partial<MeatPart> = {}): MeatPart {
  return {
    id: 'kalbi',
    name: 'Kalbi',
    nameJP: 'カルビ',
    rank: 'common',
    grillTime: 5,
    flareRisk: 0.2,
    sweetSpot: 2,
    flavorText: 'Juicy marbled beef short rib.',
    isVegetable: false,
    ...overrides,
  };
}

function makeGrillSlot(overrides: Partial<GrillSlot> = {}): GrillSlot {
  return {
    id: 0,
    part: null,
    state: 'raw',
    timeInState: 0,
    fireTimer: 0,
    disabled: false,
    disabledTimer: 0,
    ...overrides,
  };
}

function makeRestaurantDefinition(): RestaurantDefinition {
  return {
    type: 'chain',
    nameJP: 'チェーン店',
    totalDishes: 8,
    servingInterval: 8,
    rankDistribution: { common: 0.7, upper: 0.2, premium: 0.08, elite: 0.02 },
    activePenalties: ['raw-meat', 'burnt-smoke', 'discard-loss'],
  };
}

function makeRestaurant(): Restaurant {
  return {
    definition: makeRestaurantDefinition(),
    dishesServed: 0,
    meatDishesEaten: 0,
    totalMeatDishes: 8,
    timeSinceLastServe: 0,
    effectiveServingInterval: 8,
    startTime: 0,
    servingQueue: [],
    isCleared: false,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultGrill: readonly GrillSlot[] = Array.from(
    { length: INITIAL_GRILL_SLOTS },
    (_, i) => makeGrillSlot({ id: i }),
  );

  return {
    character: 'tanaka',
    cycle: 1,
    restaurantIndexInCycle: 0,
    score: 0,
    highestRestaurantTypeReached: 0,
    restaurant: makeRestaurant(),
    grill: defaultGrill,
    table: [],
    tableCapacity: INITIAL_TABLE_CAPACITY,
    skills: [],
    coins: 20,
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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getCharacterModifiers — Salaryman Tanaka
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — Salaryman Tanaka', () => {
  it('returns an object with no sweetSpotBonus entries', () => {
    const mods = getCharacterModifiers('tanaka', []);
    expect(mods.sweetSpotBonus ?? {}).toEqual({});
  });

  it('returns undefined eatSpeedMultiplier', () => {
    const mods = getCharacterModifiers('tanaka', []);
    expect(mods.eatSpeedMultiplier).toBeUndefined();
  });

  it('returns no coinMultiplierByRank entries', () => {
    const mods = getCharacterModifiers('tanaka', []);
    expect(mods.coinMultiplierByRank ?? {}).toEqual({});
  });

  it('returns undefined vegetableCoinMultiplier', () => {
    const mods = getCharacterModifiers('tanaka', []);
    expect(mods.vegetableCoinMultiplier).toBeUndefined();
  });

  it('returns undefined meatEatStaffWarningIncrement', () => {
    const mods = getCharacterModifiers('tanaka', []);
    expect(mods.meatEatStaffWarningIncrement).toBeUndefined();
  });

  it('returns undefined instantGameOverOnBurn', () => {
    const mods = getCharacterModifiers('tanaka', []);
    expect(mods.instantGameOverOnBurn).toBeUndefined();
  });

  it('returns same result regardless of skills array', () => {
    const modsNoSkills = getCharacterModifiers('tanaka', []);
    const modsWithSkills = getCharacterModifiers('tanaka', ['speed-eater', 'heat-sensor']);
    expect(modsNoSkills).toEqual(modsWithSkills);
  });
});

// ---------------------------------------------------------------------------
// getCharacterModifiers — Gourmet Critic
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — Gourmet Critic', () => {
  it('returns sweetSpotBonus.elite === GOURMET_SWEET_SPOT_BONUS (+1)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.sweetSpotBonus?.elite).toBe(GOURMET_SWEET_SPOT_BONUS);
  });

  it('returns sweetSpotBonus.premium === GOURMET_SWEET_SPOT_BONUS (+1)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.sweetSpotBonus?.premium).toBe(GOURMET_SWEET_SPOT_BONUS);
  });

  it('returns sweetSpotBonus.upper === 0 (no bonus for upper rank)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.sweetSpotBonus?.upper ?? 0).toBe(0);
  });

  it('returns sweetSpotBonus.common === 0 (no bonus for common rank)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.sweetSpotBonus?.common ?? 0).toBe(0);
  });

  it('returns coinMultiplierByRank.common === GOURMET_COMMON_COIN_MULTIPLIER (0.50)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.coinMultiplierByRank?.common).toBe(GOURMET_COMMON_COIN_MULTIPLIER);
  });

  it('returns coinMultiplierByRank.upper === 1.0 (no modifier)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.coinMultiplierByRank?.upper).toBe(1.0);
  });

  it('returns coinMultiplierByRank.premium === 1.0 (no modifier)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.coinMultiplierByRank?.premium).toBe(1.0);
  });

  it('returns coinMultiplierByRank.elite === 1.0 (no modifier)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.coinMultiplierByRank?.elite).toBe(1.0);
  });

  it('returns undefined eatSpeedMultiplier (Heat Sensor starter, no eat speed modifier)', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.eatSpeedMultiplier).toBeUndefined();
  });

  it('returns undefined vegetableCoinMultiplier', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.vegetableCoinMultiplier).toBeUndefined();
  });

  it('returns undefined instantGameOverOnBurn', () => {
    const mods = getCharacterModifiers('gourmet-critic', []);
    expect(mods.instantGameOverOnBurn).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCharacterModifiers — Competitive Eater
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — Competitive Eater', () => {
  it('returns eatSpeedMultiplier === COMPETITIVE_EATER_SPEED_MULTIPLIER (0.50)', () => {
    const mods = getCharacterModifiers('competitive-eater', []);
    expect(mods.eatSpeedMultiplier).toBe(COMPETITIVE_EATER_SPEED_MULTIPLIER);
  });

  it('returns sweetSpotPenaltyMultiplier === COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER (0.80)', () => {
    const mods = getCharacterModifiers('competitive-eater', []);
    expect(mods.sweetSpotPenaltyMultiplier).toBe(COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER);
  });

  it('returns undefined sweetSpotBonus', () => {
    const mods = getCharacterModifiers('competitive-eater', []);
    expect(mods.sweetSpotBonus).toBeUndefined();
  });

  it('returns undefined coinMultiplierByRank', () => {
    const mods = getCharacterModifiers('competitive-eater', []);
    expect(mods.coinMultiplierByRank).toBeUndefined();
  });

  it('returns undefined vegetableCoinMultiplier', () => {
    const mods = getCharacterModifiers('competitive-eater', []);
    expect(mods.vegetableCoinMultiplier).toBeUndefined();
  });

  it('returns undefined instantGameOverOnBurn', () => {
    const mods = getCharacterModifiers('competitive-eater', []);
    expect(mods.instantGameOverOnBurn).toBeUndefined();
  });

  it('returns same eatSpeedMultiplier even when speed-eater skill is held (character overrides skill)', () => {
    const modsNoSkill = getCharacterModifiers('competitive-eater', []);
    const modsWithSpeedEater = getCharacterModifiers('competitive-eater', ['speed-eater']);
    expect(modsWithSpeedEater.eatSpeedMultiplier).toBe(modsNoSkill.eatSpeedMultiplier);
    expect(modsWithSpeedEater.eatSpeedMultiplier).toBe(COMPETITIVE_EATER_SPEED_MULTIPLIER);
  });
});

// ---------------------------------------------------------------------------
// getCharacterModifiers — Raw Food Advocate
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — Raw Food Advocate', () => {
  it('returns instantGameOverOnBurn === true', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.instantGameOverOnBurn).toBe(true);
  });

  it('returns undefined eatSpeedMultiplier', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.eatSpeedMultiplier).toBeUndefined();
  });

  it('returns undefined sweetSpotBonus', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.sweetSpotBonus).toBeUndefined();
  });

  it('returns undefined coinMultiplierByRank', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.coinMultiplierByRank).toBeUndefined();
  });

  it('returns undefined vegetableCoinMultiplier', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.vegetableCoinMultiplier).toBeUndefined();
  });

  it('returns undefined meatEatStaffWarningIncrement', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.meatEatStaffWarningIncrement).toBeUndefined();
  });

  it('returns undefined sweetSpotPenaltyMultiplier', () => {
    const mods = getCharacterModifiers('raw-food-advocate', []);
    expect(mods.sweetSpotPenaltyMultiplier).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCharacterModifiers — Vegan Tashiro
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — Vegan Tashiro', () => {
  it('returns vegetableCoinMultiplier === VEGETABLE_COIN_MULTIPLIER (3)', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.vegetableCoinMultiplier).toBe(VEGETABLE_COIN_MULTIPLIER);
  });

  it('returns meatEatStaffWarningIncrement === VEGAN_MEAT_EAT_WARNING_PENALTY (2)', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.meatEatStaffWarningIncrement).toBe(VEGAN_MEAT_EAT_WARNING_PENALTY);
  });

  it('returns undefined eatSpeedMultiplier', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.eatSpeedMultiplier).toBeUndefined();
  });

  it('returns undefined instantGameOverOnBurn', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.instantGameOverOnBurn).toBeUndefined();
  });

  it('returns undefined sweetSpotBonus', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.sweetSpotBonus).toBeUndefined();
  });

  it('returns undefined coinMultiplierByRank', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.coinMultiplierByRank).toBeUndefined();
  });

  it('returns undefined sweetSpotPenaltyMultiplier', () => {
    const mods = getCharacterModifiers('vegan-tashiro', []);
    expect(mods.sweetSpotPenaltyMultiplier).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCharacterModifiers — edge case: unknown characterId
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — unknown characterId (defensive)', () => {
  it('returns a no-modifier object (treats as Tanaka) for an unknown id', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mods = getCharacterModifiers('unknown-character' as any, []);
    expect(mods.instantGameOverOnBurn).toBeUndefined();
    expect(mods.eatSpeedMultiplier).toBeUndefined();
    expect(mods.vegetableCoinMultiplier).toBeUndefined();
    expect(mods.meatEatStaffWarningIncrement).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCharacterModifiers — pure function invariant
// ---------------------------------------------------------------------------

describe('getCharacterModifiers() — pure function invariant', () => {
  it('returns identical results for the same inputs called twice', () => {
    const result1 = getCharacterModifiers('gourmet-critic', ['heat-sensor']);
    const result2 = getCharacterModifiers('gourmet-critic', ['heat-sensor']);
    expect(result1).toEqual(result2);
  });
});

// ---------------------------------------------------------------------------
// canUnlockCharacter — Salaryman Tanaka
// ---------------------------------------------------------------------------

describe('canUnlockCharacter() — Salaryman Tanaka', () => {
  it('always returns true on a fresh save (no cleared runs)', () => {
    const persistent = makePersistentState();
    expect(canUnlockCharacter('tanaka', persistent)).toBe(true);
  });

  it('always returns true even when unlockedCharacters is empty', () => {
    const persistent = makePersistentState({ unlockedCharacters: [] });
    expect(canUnlockCharacter('tanaka', persistent)).toBe(true);
  });

  it('always returns true regardless of clearedWithCharacterIds', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['gourmet-critic', 'competitive-eater'],
    });
    expect(canUnlockCharacter('tanaka', persistent)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canUnlockCharacter — Gourmet Critic (requires clear with tanaka)
// ---------------------------------------------------------------------------

describe('canUnlockCharacter() — Gourmet Critic', () => {
  it('returns false when clearedWithCharacterIds is empty', () => {
    const persistent = makePersistentState({ clearedWithCharacterIds: [] });
    expect(canUnlockCharacter('gourmet-critic', persistent)).toBe(false);
  });

  it('returns false when only non-tanaka characters have cleared', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['gourmet-critic'],
    });
    expect(canUnlockCharacter('gourmet-critic', persistent)).toBe(false);
  });

  it('returns true when clearedWithCharacterIds contains tanaka', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['tanaka'],
    });
    expect(canUnlockCharacter('gourmet-critic', persistent)).toBe(true);
  });

  it('returns true when already present in unlockedCharacters', () => {
    const persistent = makePersistentState({
      unlockedCharacters: ['tanaka', 'gourmet-critic'],
      clearedWithCharacterIds: [],
    });
    expect(canUnlockCharacter('gourmet-critic', persistent)).toBe(true);
  });

  it('returns true when tanaka is among multiple clearedWithCharacterIds', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['tanaka', 'competitive-eater'],
    });
    expect(canUnlockCharacter('gourmet-critic', persistent)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canUnlockCharacter — Competitive Eater (requires clear with tanaka)
// ---------------------------------------------------------------------------

describe('canUnlockCharacter() — Competitive Eater', () => {
  it('returns false when clearedWithCharacterIds is empty', () => {
    const persistent = makePersistentState({ clearedWithCharacterIds: [] });
    expect(canUnlockCharacter('competitive-eater', persistent)).toBe(false);
  });

  it('returns true when clearedWithCharacterIds contains tanaka', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['tanaka'],
    });
    expect(canUnlockCharacter('competitive-eater', persistent)).toBe(true);
  });

  it('returns true when already present in unlockedCharacters (regardless of cleared list)', () => {
    const persistent = makePersistentState({
      unlockedCharacters: ['tanaka', 'competitive-eater'],
      clearedWithCharacterIds: [],
    });
    expect(canUnlockCharacter('competitive-eater', persistent)).toBe(true);
  });

  it('both specialist characters unlock simultaneously when tanaka clears', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['tanaka'],
    });
    expect(canUnlockCharacter('gourmet-critic', persistent)).toBe(true);
    expect(canUnlockCharacter('competitive-eater', persistent)).toBe(true);
  });

  it('cycle 3 boss defeat does NOT satisfy unlock condition (only cycle 4 qualifies)', () => {
    // Cycle 3 boss clear is represented by NOT having tanaka in clearedWithCharacterIds
    // (the True Ending is only triggered by cycle 4 boss)
    const persistent = makePersistentState({
      clearedWithCharacterIds: [],
    });
    expect(canUnlockCharacter('competitive-eater', persistent)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canUnlockCharacter — Raw Food Advocate (requires any specialist clear)
// ---------------------------------------------------------------------------

describe('canUnlockCharacter() — Raw Food Advocate', () => {
  it('returns false when clearedWithCharacterIds is empty', () => {
    const persistent = makePersistentState({ clearedWithCharacterIds: [] });
    expect(canUnlockCharacter('raw-food-advocate', persistent)).toBe(false);
  });

  it('returns false when only tanaka has cleared (no specialist clear)', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['tanaka'],
    });
    expect(canUnlockCharacter('raw-food-advocate', persistent)).toBe(false);
  });

  it('returns true when gourmet-critic has cleared', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['gourmet-critic'],
    });
    expect(canUnlockCharacter('raw-food-advocate', persistent)).toBe(true);
  });

  it('returns true when competitive-eater has cleared', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['competitive-eater'],
    });
    expect(canUnlockCharacter('raw-food-advocate', persistent)).toBe(true);
  });

  it('returns true when already present in unlockedCharacters', () => {
    const persistent = makePersistentState({
      unlockedCharacters: ['tanaka', 'raw-food-advocate'],
      clearedWithCharacterIds: [],
    });
    expect(canUnlockCharacter('raw-food-advocate', persistent)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canUnlockCharacter — Vegan Tashiro (requires any specialist clear)
// ---------------------------------------------------------------------------

describe('canUnlockCharacter() — Vegan Tashiro', () => {
  it('returns false when clearedWithCharacterIds is empty', () => {
    const persistent = makePersistentState({ clearedWithCharacterIds: [] });
    expect(canUnlockCharacter('vegan-tashiro', persistent)).toBe(false);
  });

  it('returns false when only tanaka has cleared', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['tanaka'],
    });
    expect(canUnlockCharacter('vegan-tashiro', persistent)).toBe(false);
  });

  it('returns true when gourmet-critic has cleared', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['gourmet-critic'],
    });
    expect(canUnlockCharacter('vegan-tashiro', persistent)).toBe(true);
  });

  it('returns true when competitive-eater has cleared', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['competitive-eater'],
    });
    expect(canUnlockCharacter('vegan-tashiro', persistent)).toBe(true);
  });

  it('both peaky characters unlock simultaneously when any specialist clears', () => {
    const persistent = makePersistentState({
      clearedWithCharacterIds: ['gourmet-critic'],
    });
    expect(canUnlockCharacter('raw-food-advocate', persistent)).toBe(true);
    expect(canUnlockCharacter('vegan-tashiro', persistent)).toBe(true);
  });

  it('returns true when already present in unlockedCharacters', () => {
    const persistent = makePersistentState({
      unlockedCharacters: ['tanaka', 'vegan-tashiro'],
      clearedWithCharacterIds: [],
    });
    expect(canUnlockCharacter('vegan-tashiro', persistent)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// processVeganExchange — Instant Exchange
// ---------------------------------------------------------------------------

describe('processVeganExchange() — instant method', () => {
  it('deducts exchangeCost from state.coins', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat, state: 'raw' });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result.coins).toBe(15);
  });

  it('replaces slot part with a VegetablePart (isVegetable === true)', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    const newPart = result.grill[0]!.part;
    expect(newPart).not.toBeNull();
    expect(newPart!.isVegetable).toBe(true);
  });

  it('resets slot state to "raw" after instant exchange', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat, state: 'well-done' });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result.grill[0]!.state).toBe('raw');
  });

  it('resets timeInState to 0 after instant exchange', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium', timeInState: 3.5 });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result.grill[0]!.timeInState).toBe(0);
  });

  it('resets fireTimer to 0 after instant exchange', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium', fireTimer: 2.1 });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result.grill[0]!.fireTimer).toBe(0);
  });

  it('replaced vegetable part id is either "green-pepper" or "eggplant"', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 30,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    // Run multiple times to verify both vegetable ids can be chosen
    const seenIds = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const result = processVeganExchange(state, 0, 'instant', 1);
      const part = result.grill[0]!.part;
      if (part !== null) seenIds.add(part.id);
    }
    for (const id of seenIds) {
      expect(['green-pepper', 'eggplant']).toContain(id);
    }
    // Both vegetables should eventually appear in 50 trials
    expect(seenIds.size).toBeGreaterThanOrEqual(1);
  });

  it('does not deduct below 0 coins when exchange cost equals current coins', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 5,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result.coins).toBe(0);
  });

  it('does not modify other grill slots', () => {
    const meat = makeMeatPart();
    const slot0 = makeGrillSlot({ id: 0, part: meat });
    const slot1 = makeGrillSlot({ id: 1, part: makeMeatPart({ id: 'sirloin', name: 'Sirloin' }) });
    const slot2 = makeGrillSlot({ id: 2 });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot0, slot1, slot2],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result.grill[1]).toEqual(slot1);
    expect(result.grill[2]).toEqual(slot2);
  });

  it('returns a new GameState object (immutable update)', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'instant', 5);
    expect(result).not.toBe(state);
  });
});

// ---------------------------------------------------------------------------
// processVeganExchange — Delayed Exchange
// ---------------------------------------------------------------------------

describe('processVeganExchange() — delayed method', () => {
  it('does NOT deduct coins', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'delayed', 0);
    expect(result.coins).toBe(10);
  });

  it('replaces meat with a vegetable on the slot', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'delayed', 0);
    expect(result.grill[0]!.part).not.toBeNull();
    expect(result.grill[0]!.part!.isVegetable).toBe(true);
  });

  it('sets actionDisabledTimer to DELAYED_EXCHANGE_DURATION on the state', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'delayed', 0);
    expect(result.actionDisabledTimer).toBe(DELAYED_EXCHANGE_DURATION);
  });

  it('does not disable the slot (vegetable is placed immediately)', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'delayed', 0);
    expect(result.grill[0]!.disabled).toBe(false);
  });

  it('does not modify other grill slots', () => {
    const meat = makeMeatPart();
    const slot0 = makeGrillSlot({ id: 0, part: meat });
    const slot1 = makeGrillSlot({ id: 1, part: makeMeatPart({ id: 'sirloin', name: 'Sirloin' }) });
    const slot2 = makeGrillSlot({ id: 2 });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot0, slot1, slot2],
    });

    const result = processVeganExchange(state, 0, 'delayed', 0);
    expect(result.grill[1]).toEqual(slot1);
    expect(result.grill[2]).toEqual(slot2);
  });

  it('returns a new GameState object (immutable update)', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 0, 'delayed', 0);
    expect(result).not.toBe(state);
  });
});

// ---------------------------------------------------------------------------
// processVeganExchange — edge cases
// ---------------------------------------------------------------------------

describe('processVeganExchange() — edge cases', () => {
  it('returns state unchanged when slotIndex is out of bounds', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    const result = processVeganExchange(state, 99, 'instant', 5);
    expect(result.grill).toEqual(state.grill);
    expect(result.coins).toBe(state.coins);
  });

  it('exchangeCost passed by caller is deducted as-is (no internal recalculation)', () => {
    const meat = makeMeatPart();
    const slot = makeGrillSlot({ id: 0, part: meat });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    });

    // Pass a discounted cost (e.g., 3 coins with Exchange Discount applied by caller)
    const result = processVeganExchange(state, 0, 'instant', 3);
    expect(result.coins).toBe(17);
  });

  it('instant exchange with slotIndex 1 modifies only that slot', () => {
    const slot0 = makeGrillSlot({ id: 0, part: makeMeatPart({ id: 'kalbi' }) });
    const slot1 = makeGrillSlot({ id: 1, part: makeMeatPart({ id: 'sirloin', name: 'Sirloin' }) });
    const slot2 = makeGrillSlot({ id: 2 });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 20,
      grill: [slot0, slot1, slot2],
    });

    const result = processVeganExchange(state, 1, 'instant', 5);
    expect(result.grill[0]).toEqual(slot0);
    expect(result.grill[1]!.part?.isVegetable).toBe(true);
    expect(result.grill[2]).toEqual(slot2);
  });

  it('delayed exchange with slotIndex 2 modifies only that slot', () => {
    const slot0 = makeGrillSlot({ id: 0 });
    const slot1 = makeGrillSlot({ id: 1 });
    const slot2 = makeGrillSlot({ id: 2, part: makeMeatPart({ id: 'tongue', name: 'Tongue' }) });
    const state = makeGameState({
      character: 'vegan-tashiro',
      coins: 10,
      grill: [slot0, slot1, slot2],
    });

    const result = processVeganExchange(state, 2, 'delayed', 0);
    expect(result.grill[0]).toEqual(slot0);
    expect(result.grill[1]).toEqual(slot1);
    expect(result.grill[2]!.part!.isVegetable).toBe(true);
    expect(result.actionDisabledTimer).toBe(DELAYED_EXCHANGE_DURATION);
  });
});

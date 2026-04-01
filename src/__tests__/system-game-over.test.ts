import { checkGameOver, isConditionActive } from '../game/systems/game-over';
import type {
  GameState,
  CharacterId,
  GrillSlot,
  Part,
  Restaurant,
} from '../types/index';
import {
  GRILL_FIRE_GAME_OVER_THRESHOLD,
  INITIAL_TABLE_CAPACITY,
} from '../game/data/constants';

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

function makePart(overrides: Partial<Part> = {}): Part {
  return {
    id: 'mock-beef',
    name: 'Mock Beef',
    nameJP: 'モックビーフ',
    rank: 'common',
    grillTime: 5,
    flareRisk: 0.05,
    sweetSpot: 2,
    flavorText: 'mock',
    isVegetable: false,
    ...overrides,
  } as Part;
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

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    definition: {
      type: 'chain',
      nameJP: 'モックチェーン',
      totalDishes: 8,
      servingInterval: 8,
      rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
      activePenalties: [],
    },
    dishesServed: 0,
    meatDishesEaten: 0,
    totalMeatDishes: 8,
    timeSinceLastServe: 0,
    effectiveServingInterval: 8,
    startTime: 0,
    servingQueue: [],
    isCleared: false,
    ...overrides,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    character: 'tanaka',
    cycle: 1,
    restaurantIndexInCycle: 0,
    score: 0,
    highestRestaurantTypeReached: 0,
    restaurant: makeRestaurant(),
    grill: [makeGrillSlot({ id: 0 }), makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
    table: [],
    tableCapacity: INITIAL_TABLE_CAPACITY,
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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isConditionActive
// ---------------------------------------------------------------------------

describe('isConditionActive', () => {
  describe("'table-overflow'", () => {
    it('always returns true regardless of highestRestaurantTypeReached', () => {
      const stateChain = makeGameState({ highestRestaurantTypeReached: 0 });
      const stateBoss = makeGameState({ highestRestaurantTypeReached: 3 });

      expect(isConditionActive('table-overflow', stateChain)).toBe(true);
      expect(isConditionActive('table-overflow', stateBoss)).toBe(true);
    });

    it('always returns true regardless of character', () => {
      const characters: CharacterId[] = [
        'tanaka',
        'gourmet-critic',
        'competitive-eater',
        'raw-food-advocate',
        'vegan-tashiro',
      ];

      for (const character of characters) {
        const state = makeGameState({ character });
        expect(isConditionActive('table-overflow', state)).toBe(true);
      }
    });
  });

  describe("'grill-fire'", () => {
    it('returns false at chain restaurant (highestRestaurantTypeReached = 0)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 0 });
      expect(isConditionActive('grill-fire', state)).toBe(false);
    });

    it('returns false at local restaurant (highestRestaurantTypeReached = 1)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 1 });
      expect(isConditionActive('grill-fire', state)).toBe(false);
    });

    it('returns true at high-end restaurant (highestRestaurantTypeReached = 2)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 2 });
      expect(isConditionActive('grill-fire', state)).toBe(true);
    });

    it('returns true at boss restaurant (highestRestaurantTypeReached = 3)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 3 });
      expect(isConditionActive('grill-fire', state)).toBe(true);
    });

    it('returns true when player has reached high-end in a previous restaurant but is now at chain', () => {
      // highestRestaurantTypeReached is monotonically non-decreasing — once unlocked, stays unlocked
      const state = makeGameState({
        highestRestaurantTypeReached: 2,
        restaurant: makeRestaurant({ definition: { type: 'chain', nameJP: '', totalDishes: 8, servingInterval: 8, rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 }, activePenalties: [] } }),
      });
      expect(isConditionActive('grill-fire', state)).toBe(true);
    });
  });

  describe("'raw-paralysis'", () => {
    it('returns false at chain (highestRestaurantTypeReached = 0)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 0 });
      expect(isConditionActive('raw-paralysis', state)).toBe(false);
    });

    it('returns false at local (highestRestaurantTypeReached = 1)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 1 });
      expect(isConditionActive('raw-paralysis', state)).toBe(false);
    });

    it('returns false at high-end (highestRestaurantTypeReached = 2)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 2 });
      expect(isConditionActive('raw-paralysis', state)).toBe(false);
    });

    it('returns true at boss (highestRestaurantTypeReached = 3)', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 3 });
      expect(isConditionActive('raw-paralysis', state)).toBe(true);
    });

    it('returns true after boss has been seen (highestRestaurantTypeReached = 3) even at later chain', () => {
      const state = makeGameState({ highestRestaurantTypeReached: 3 });
      expect(isConditionActive('raw-paralysis', state)).toBe(true);
    });
  });

  describe("'burnt-instant'", () => {
    it('returns true only for raw-food-advocate character', () => {
      const state = makeGameState({ character: 'raw-food-advocate' });
      expect(isConditionActive('burnt-instant', state)).toBe(true);
    });

    it('returns false for tanaka', () => {
      const state = makeGameState({ character: 'tanaka' });
      expect(isConditionActive('burnt-instant', state)).toBe(false);
    });

    it('returns false for gourmet-critic', () => {
      const state = makeGameState({ character: 'gourmet-critic' });
      expect(isConditionActive('burnt-instant', state)).toBe(false);
    });

    it('returns false for competitive-eater', () => {
      const state = makeGameState({ character: 'competitive-eater' });
      expect(isConditionActive('burnt-instant', state)).toBe(false);
    });

    it('returns false for vegan-tashiro', () => {
      const state = makeGameState({ character: 'vegan-tashiro' });
      expect(isConditionActive('burnt-instant', state)).toBe(false);
    });

    it('is active at chain restaurant (staged unlock is ignored)', () => {
      const state = makeGameState({
        character: 'raw-food-advocate',
        highestRestaurantTypeReached: 0,
      });
      expect(isConditionActive('burnt-instant', state)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// checkGameOver
// ---------------------------------------------------------------------------

describe('checkGameOver', () => {
  describe('returns null when no conditions are triggered', () => {
    it('returns null in a clean state', () => {
      const state = makeGameState();
      expect(checkGameOver(state)).toBeNull();
    });

    it('returns null when table length equals tableCapacity (not exceeded)', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => makePart());
      const state = makeGameState({ table });
      expect(checkGameOver(state)).toBeNull();
    });

    it('returns null when fireTimer equals threshold exactly (strictly greater than required)', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 2 });
      expect(checkGameOver(state)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Condition: table-overflow
  // -------------------------------------------------------------------------

  describe("condition: 'table-overflow'", () => {
    it('triggers when table.length > tableCapacity', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({ table });
      expect(checkGameOver(state)).toBe('table-overflow');
    });

    it('is active from the very first restaurant (chain, highestRestaurantTypeReached = 0)', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({ table, highestRestaurantTypeReached: 0 });
      expect(checkGameOver(state)).toBe('table-overflow');
    });

    it('does not trigger when table length is exactly at capacity', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => makePart());
      const state = makeGameState({ table });
      expect(checkGameOver(state)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Condition: grill-fire
  // -------------------------------------------------------------------------

  describe("condition: 'grill-fire'", () => {
    it('triggers when a slot has fireTimer strictly greater than GRILL_FIRE_GAME_OVER_THRESHOLD at high-end', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 0.001 }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 2 });
      expect(checkGameOver(state)).toBe('grill-fire');
    });

    it('does not trigger at chain even when fireTimer exceeds threshold (staged unlock)', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 0 });
      // grill-fire is not active at chain, table is empty, so result should be null
      expect(checkGameOver(state)).toBeNull();
    });

    it('does not trigger at local even when fireTimer exceeds threshold (staged unlock)', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 1 });
      expect(checkGameOver(state)).toBeNull();
    });

    it('triggers at boss when fireTimer exceeds threshold', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 5 }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 3 });
      expect(checkGameOver(state)).toBe('grill-fire');
    });

    it('triggers from a second grill slot independently', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: null, state: 'raw', fireTimer: 0 }),
        makeGrillSlot({ id: 1, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 2 });
      expect(checkGameOver(state)).toBe('grill-fire');
    });

    it('does not trigger when fireTimer is exactly at threshold (not strictly greater)', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD }),
      ];
      const state = makeGameState({ grill, highestRestaurantTypeReached: 2 });
      expect(checkGameOver(state)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Condition: raw-paralysis
  // -------------------------------------------------------------------------

  describe("condition: 'raw-paralysis'", () => {
    it('triggers when table overflows AND actionDisabledTimer > 0 at boss', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        table,
        actionDisabledTimer: 1,
        highestRestaurantTypeReached: 3,
      });
      expect(checkGameOver(state)).toBe('raw-paralysis');
    });

    it('does NOT trigger raw-paralysis at high-end even with overflow + disabled (staged unlock)', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        table,
        actionDisabledTimer: 1,
        highestRestaurantTypeReached: 2,
      });
      // raw-paralysis not yet unlocked; should fall back to table-overflow
      expect(checkGameOver(state)).toBe('table-overflow');
    });

    it('does NOT trigger raw-paralysis at chain even with overflow + disabled', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        table,
        actionDisabledTimer: 3,
        highestRestaurantTypeReached: 0,
      });
      expect(checkGameOver(state)).toBe('table-overflow');
    });

    it('table overflow without action disable at boss returns table-overflow, not raw-paralysis', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        table,
        actionDisabledTimer: 0,
        highestRestaurantTypeReached: 3,
      });
      // raw-paralysis needs actionDisabledTimer > 0
      expect(checkGameOver(state)).toBe('table-overflow');
    });
  });

  // -------------------------------------------------------------------------
  // Condition: burnt-instant
  // -------------------------------------------------------------------------

  describe("condition: 'burnt-instant'", () => {
    it('triggers immediately when any slot transitions to burnt for raw-food-advocate', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: 0 }),
      ];
      const state = makeGameState({ character: 'raw-food-advocate', grill });
      expect(checkGameOver(state)).toBe('burnt-instant');
    });

    it('does not trigger for tanaka even with burnt slot', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: 0 }),
      ];
      const state = makeGameState({ character: 'tanaka', grill });
      // No other conditions active; table is fine, no fireTimer exceeded
      expect(checkGameOver(state)).toBeNull();
    });

    it('triggers at chain restaurant (staged unlock ignored for burnt-instant)', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: 0 }),
      ];
      const state = makeGameState({
        character: 'raw-food-advocate',
        grill,
        highestRestaurantTypeReached: 0,
      });
      expect(checkGameOver(state)).toBe('burnt-instant');
    });

    it('requires part to be non-null in the slot', () => {
      // slot.state === 'burnt' but slot.part === null — should NOT trigger
      const grill = [
        makeGrillSlot({ id: 0, part: null, state: 'burnt', fireTimer: 0 }),
      ];
      const state = makeGameState({ character: 'raw-food-advocate', grill });
      expect(checkGameOver(state)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Priority ordering
  // -------------------------------------------------------------------------

  describe('priority ordering', () => {
    it('burnt-instant takes priority over table-overflow when both triggered (raw-food-advocate)', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: 0 }),
      ];
      const state = makeGameState({
        character: 'raw-food-advocate',
        grill,
        table,
      });
      expect(checkGameOver(state)).toBe('burnt-instant');
    });

    it('burnt-instant takes priority over grill-fire when both triggered (raw-food-advocate, high-end)', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({
        character: 'raw-food-advocate',
        grill,
        highestRestaurantTypeReached: 2,
      });
      expect(checkGameOver(state)).toBe('burnt-instant');
    });

    it('burnt-instant takes priority over raw-paralysis when both triggered (raw-food-advocate, boss)', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: 0 }),
      ];
      const state = makeGameState({
        character: 'raw-food-advocate',
        grill,
        table,
        actionDisabledTimer: 2,
        highestRestaurantTypeReached: 3,
      });
      expect(checkGameOver(state)).toBe('burnt-instant');
    });

    it('raw-paralysis takes priority over table-overflow when both are triggered and boss unlocked', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        character: 'tanaka',
        table,
        actionDisabledTimer: 2,
        highestRestaurantTypeReached: 3,
      });
      // raw-paralysis (priority 4 in spec numbering, but precedence over plain table-overflow)
      expect(checkGameOver(state)).toBe('raw-paralysis');
    });

    it('table-overflow returned before grill-fire in priority order when both triggered', () => {
      // table-overflow is priority 2, grill-fire is priority 3
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({
        character: 'tanaka',
        grill,
        table,
        actionDisabledTimer: 0,
        highestRestaurantTypeReached: 2,
      });
      expect(checkGameOver(state)).toBe('table-overflow');
    });

    it('grill-fire returned before raw-paralysis when only grill-fire and raw-paralysis would trigger (no overflow)', () => {
      // grill-fire (priority 3) vs raw-paralysis (priority 4)
      // raw-paralysis needs table overflow; without it only grill-fire fires
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({
        character: 'tanaka',
        grill,
        actionDisabledTimer: 2,
        highestRestaurantTypeReached: 3,
      });
      expect(checkGameOver(state)).toBe('grill-fire');
    });
  });

  // -------------------------------------------------------------------------
  // Staged unlock integration
  // -------------------------------------------------------------------------

  describe('staged unlock — conditions active at correct restaurant types', () => {
    it('at chain (highestRestaurantTypeReached = 0): only table-overflow is checked', () => {
      // grill fire threshold exceeded + action disabled — neither should fire
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 5 }),
      ];
      const state = makeGameState({
        grill,
        actionDisabledTimer: 3,
        highestRestaurantTypeReached: 0,
      });
      // table is within capacity, no overflow
      expect(checkGameOver(state)).toBeNull();
    });

    it('at local (highestRestaurantTypeReached = 1): only table-overflow is checked', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 5 }),
      ];
      const state = makeGameState({
        grill,
        actionDisabledTimer: 3,
        highestRestaurantTypeReached: 1,
      });
      expect(checkGameOver(state)).toBeNull();
    });

    it('at high-end (highestRestaurantTypeReached = 2): table-overflow and grill-fire are checked', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({
        grill,
        highestRestaurantTypeReached: 2,
      });
      expect(checkGameOver(state)).toBe('grill-fire');
    });

    it('at boss (highestRestaurantTypeReached = 3): table-overflow, grill-fire, and raw-paralysis all checked', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        table,
        actionDisabledTimer: 2,
        highestRestaurantTypeReached: 3,
      });
      expect(checkGameOver(state)).toBe('raw-paralysis');
    });

    it('once boss unlocked, raw-paralysis remains active even in subsequent chain restaurants', () => {
      const table = Array.from({ length: INITIAL_TABLE_CAPACITY + 1 }, () => makePart());
      const state = makeGameState({
        table,
        actionDisabledTimer: 2,
        // highestRestaurantTypeReached stays at 3 even if currently playing chain
        highestRestaurantTypeReached: 3,
        restaurant: makeRestaurant(),
      });
      expect(checkGameOver(state)).toBe('raw-paralysis');
    });

    it('once high-end unlocked, grill-fire remains active even back at local restaurant', () => {
      const grill = [
        makeGrillSlot({ id: 0, part: makePart(), state: 'burnt', fireTimer: GRILL_FIRE_GAME_OVER_THRESHOLD + 1 }),
      ];
      const state = makeGameState({
        grill,
        highestRestaurantTypeReached: 2,
        restaurant: makeRestaurant(),
      });
      expect(checkGameOver(state)).toBe('grill-fire');
    });
  });
});

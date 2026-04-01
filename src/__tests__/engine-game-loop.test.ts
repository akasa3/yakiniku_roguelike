import type {
  GameState,
  GrillSlot,
  MeatPart,
  VegetablePart,
  Restaurant,
} from '../types/index';
import {
  initGameState,
  gameTick,
  processAction,
  checkPhaseTransition,
} from '../game/engine/game-loop';
import {
  INITIAL_GRILL_SLOTS,
  INITIAL_TABLE_CAPACITY,
  TRUE_ENDING_CYCLE,
} from '../game/data/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeatPart(overrides: Partial<MeatPart> = {}): MeatPart {
  return {
    id: 'kalbi',
    name: 'Kalbi',
    nameJP: 'カルビ',
    rank: 'common',
    grillTime: 5,
    flareRisk: 0,
    sweetSpot: 2,
    flavorText: 'Test meat.',
    isVegetable: false,
    ...overrides,
  };
}

function makeVegetablePart(overrides: Partial<VegetablePart> = {}): VegetablePart {
  return {
    id: 'green-pepper',
    name: 'Green Pepper',
    nameJP: 'ピーマン',
    grillTime: 3,
    flareRisk: 0,
    sweetSpot: 3,
    isVegetable: true,
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

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    definition: {
      type: 'chain',
      nameJP: 'テストチェーン',
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
    grill: [
      makeGrillSlot({ id: 0 }),
      makeGrillSlot({ id: 1 }),
      makeGrillSlot({ id: 2 }),
    ],
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

/** Never-trigger RNG: returns 1 so flareRisk < 1 never fires. */
const neverTrigger = () => 1;

// ---------------------------------------------------------------------------
// initGameState
// ---------------------------------------------------------------------------

describe('initGameState', () => {
  it('returns a GameState with the selected character', () => {
    const state = initGameState('tanaka');
    expect(state.character).toBe('tanaka');
  });

  it('starts at cycle 1, restaurantIndexInCycle 0', () => {
    const state = initGameState('tanaka');
    expect(state.cycle).toBe(1);
    expect(state.restaurantIndexInCycle).toBe(0);
  });

  it('starts with score 0', () => {
    const state = initGameState('tanaka');
    expect(state.score).toBe(0);
  });

  it(`initializes ${INITIAL_GRILL_SLOTS} empty grill slots`, () => {
    const state = initGameState('tanaka');
    expect(state.grill).toHaveLength(INITIAL_GRILL_SLOTS);
    for (const slot of state.grill) {
      expect(slot.part).toBeNull();
      expect(slot.state).toBe('raw');
      expect(slot.disabled).toBe(false);
      expect(slot.disabledTimer).toBe(0);
      expect(slot.timeInState).toBe(0);
      expect(slot.fireTimer).toBe(0);
    }
  });

  it('initializes an empty table', () => {
    const state = initGameState('tanaka');
    expect(state.table).toHaveLength(0);
  });

  it(`initializes tableCapacity to ${INITIAL_TABLE_CAPACITY}`, () => {
    const state = initGameState('tanaka');
    expect(state.tableCapacity).toBe(INITIAL_TABLE_CAPACITY);
  });

  it('starts with 0 coins', () => {
    const state = initGameState('tanaka');
    expect(state.coins).toBe(0);
  });

  it('starts in playing phase', () => {
    const state = initGameState('tanaka');
    expect(state.phase).toBe('playing');
  });

  it('starts with no game-over reason', () => {
    const state = initGameState('tanaka');
    expect(state.gameOver).toBeNull();
  });

  it("includes the character's starter skill", () => {
    // tanaka's starterSkillId is 'discard-pro'
    const state = initGameState('tanaka');
    expect(state.skills).toContain('discard-pro');
  });

  it("includes competitive-eater's starter skill (speed-eater)", () => {
    const state = initGameState('competitive-eater');
    expect(state.skills).toContain('speed-eater');
  });

  it('starts with debuff timers at 0', () => {
    const state = initGameState('tanaka');
    expect(state.staffWarningCount).toBe(0);
    expect(state.actionDisabledTimer).toBe(0);
    expect(state.burntSmokeActive).toBe(false);
  });

  it('starts with binge tracking at default values', () => {
    const state = initGameState('tanaka');
    expect(state.consecutiveEatCount).toBe(0);
    expect(state.bingeNextDishDoubled).toBe(false);
  });

  it('starts with no pending skill choices or node choice', () => {
    const state = initGameState('tanaka');
    expect(state.pendingSkillChoices).toHaveLength(0);
    expect(state.pendingNodeChoice).toBe(false);
  });

  it('initializes the restaurant at cycle 1, index 0 (chain type)', () => {
    const state = initGameState('tanaka');
    expect(state.restaurant.definition.type).toBe('chain');
    expect(state.restaurant.dishesServed).toBe(0);
    expect(state.restaurant.meatDishesEaten).toBe(0);
    expect(state.restaurant.startTime).toBe(0);
  });

  it('starts with elapsedTime at 0', () => {
    const state = initGameState('tanaka');
    expect(state.elapsedTime).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// gameTick
// ---------------------------------------------------------------------------

describe('gameTick', () => {
  describe('no-op outside playing phase', () => {
    it('returns state unchanged when phase is game-over', () => {
      const state = makeGameState({ phase: 'game-over', gameOver: 'grill-fire' });
      const result = gameTick(state, 0.016, neverTrigger);
      expect(result).toBe(state);
    });

    it('returns state unchanged when phase is skill-select', () => {
      const state = makeGameState({ phase: 'skill-select' });
      const result = gameTick(state, 0.016, neverTrigger);
      expect(result).toBe(state);
    });

    it('returns state unchanged when phase is node-select', () => {
      const state = makeGameState({ phase: 'node-select' });
      const result = gameTick(state, 0.016, neverTrigger);
      expect(result).toBe(state);
    });

    it('returns state unchanged when phase is true-ending', () => {
      const state = makeGameState({ phase: 'true-ending' });
      const result = gameTick(state, 0.016, neverTrigger);
      expect(result).toBe(state);
    });
  });

  describe('pure function — no mutation', () => {
    it('does not mutate the input state', () => {
      const state = makeGameState();
      const frozen = Object.freeze(state);
      expect(() => gameTick(frozen, 0.016, neverTrigger)).not.toThrow();
    });

    it('returns a new object reference', () => {
      const state = makeGameState();
      const result = gameTick(state, 0.016, neverTrigger);
      expect(result).not.toBe(state);
    });
  });

  describe('elapsedTime advancement', () => {
    it('increments elapsedTime by deltaTime', () => {
      const state = makeGameState({ elapsedTime: 10 });
      const result = gameTick(state, 0.5, neverTrigger);
      expect(result.elapsedTime).toBeCloseTo(10.5);
    });
  });

  describe('grill slot timer advancement', () => {
    it('advances timeInState for an occupied, non-disabled slot', () => {
      const meat = makeMeatPart({ grillTime: 5 });
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'raw', timeInState: 0 });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = gameTick(state, 0.1, neverTrigger);
      expect(result.grill[0]!.timeInState).toBeGreaterThan(0);
    });

    it('does not advance timeInState for an empty slot', () => {
      const state = makeGameState();
      const result = gameTick(state, 0.5, neverTrigger);
      expect(result.grill[0]!.timeInState).toBe(0);
    });

    it('does not advance timeInState for a disabled slot', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, disabled: true, disabledTimer: 5 });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = gameTick(state, 0.5, neverTrigger);
      expect(result.grill[0]!.timeInState).toBe(0);
    });
  });

  describe('penalty timer advancement', () => {
    it('decrements actionDisabledTimer toward 0', () => {
      const state = makeGameState({ actionDisabledTimer: 2.0 });
      const result = gameTick(state, 0.5, neverTrigger);
      expect(result.actionDisabledTimer).toBeCloseTo(1.5);
    });

    it('clamps actionDisabledTimer to 0 (no negative values)', () => {
      const state = makeGameState({ actionDisabledTimer: 0.1 });
      const result = gameTick(state, 1.0, neverTrigger);
      expect(result.actionDisabledTimer).toBe(0);
    });

    it('decrements disabledTimer on a disabled slot', () => {
      const slot = makeGrillSlot({ id: 0, disabled: true, disabledTimer: 5.0 });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = gameTick(state, 1.0, neverTrigger);
      expect(result.grill[0]!.disabledTimer).toBeCloseTo(4.0);
    });

    it('re-enables a disabled slot when its disabledTimer expires', () => {
      const slot = makeGrillSlot({ id: 0, disabled: true, disabledTimer: 0.5 });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = gameTick(state, 1.0, neverTrigger);
      expect(result.grill[0]!.disabled).toBe(false);
      expect(result.grill[0]!.disabledTimer).toBe(0);
    });
  });

  describe('raw-food-advocate burnt-instant game over', () => {
    it('sets gameOver to burnt-instant when meat burns for raw-food-advocate', () => {
      // Place a meat part that is nearly going to transition to burnt.
      // grillTime=5, sweetSpot=0.1: raw→rare→medium→well-done each at 5s, well-done at 0.1s → burnt.
      // Slot is in well-done state with timeInState just below sweetSpot.
      const meat = makeMeatPart({ grillTime: 5, sweetSpot: 0.1 });
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'well-done', timeInState: 0.09 });
      const state = makeGameState({
        character: 'raw-food-advocate',
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = gameTick(state, 0.1, neverTrigger);
      expect(result.gameOver).toBe('burnt-instant');
      expect(result.phase).toBe('game-over');
    });
  });

  describe('table overflow game over', () => {
    it('sets gameOver to table-overflow when table is full and a new dish would be placed', () => {
      const vegetable = makeVegetablePart();
      // Table at capacity, no free grill slots
      const occupiedSlot = (id: number) =>
        makeGrillSlot({ id, part: makeMeatPart(), state: 'raw' });
      const fullTable = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => vegetable);
      const state = makeGameState({
        restaurant: makeRestaurant({
          totalMeatDishes: 8,
          meatDishesEaten: 0,
          dishesServed: 0,
          timeSinceLastServe: 7.99, // just below interval of 8
          effectiveServingInterval: 8,
        }),
        grill: [occupiedSlot(0), occupiedSlot(1), occupiedSlot(2)],
        table: fullTable,
        tableCapacity: INITIAL_TABLE_CAPACITY,
      });
      // tick enough to trigger a serve (timeSinceLastServe + 0.02 >= 8)
      const result = gameTick(state, 0.02, neverTrigger);
      expect(result.gameOver).toBe('table-overflow');
      expect(result.phase).toBe('game-over');
    });
  });
});

// ---------------------------------------------------------------------------
// processAction
// ---------------------------------------------------------------------------

describe('processAction', () => {
  describe('eat', () => {
    it('clears the slot after eating', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium', timeInState: 2 });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        restaurant: makeRestaurant({ meatDishesEaten: 0, totalMeatDishes: 8 }),
      });
      const result = processAction(state, 'eat', 0);
      expect(result.grill[0]!.part).toBeNull();
    });

    it('increments meatDishesEaten after eating a meat part', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        restaurant: makeRestaurant({ meatDishesEaten: 2, totalMeatDishes: 8 }),
      });
      const result = processAction(state, 'eat', 0);
      expect(result.restaurant.meatDishesEaten).toBe(3);
    });

    it('increments consecutiveEatCount on eat', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        consecutiveEatCount: 2,
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'eat', 0);
      expect(result.consecutiveEatCount).toBe(3);
    });

    it('is blocked by actionDisabledTimer > 0', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        actionDisabledTimer: 1.5,
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'eat', 0);
      // Slot should not be cleared when action-disabled
      expect(result.grill[0]!.part).not.toBeNull();
    });

    it('cannot eat a burnt part', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'burnt' });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'eat', 0);
      expect(result.grill[0]!.part).not.toBeNull();
    });

    it('applies raw meat penalty when eating raw (no negation)', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'raw' });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        actionDisabledTimer: 0,
        skills: [], // no raw tolerance
      });
      const result = processAction(state, 'eat', 0);
      expect(result.actionDisabledTimer).toBeGreaterThan(0);
    });

    it('moves first table dish to the cleared slot after eating', () => {
      const meat = makeMeatPart();
      const tableItem = makeVegetablePart({ id: 'corn' });
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        table: [tableItem],
        restaurant: makeRestaurant({ meatDishesEaten: 0, totalMeatDishes: 8 }),
      });
      const result = processAction(state, 'eat', 0);
      // The table dish should move to the slot
      expect(result.grill[0]!.part).toBe(tableItem);
      expect(result.table).toHaveLength(0);
    });

    it('returns state unchanged for an out-of-bounds slotIndex', () => {
      const state = makeGameState();
      const result = processAction(state, 'eat', 99);
      expect(result).toBe(state);
    });
  });

  describe('discard', () => {
    it('clears the slot after discard', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'burnt' });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'discard', 0);
      expect(result.grill[0]!.part).toBeNull();
    });

    it('resets consecutiveEatCount to 0 on discard', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        consecutiveEatCount: 4,
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'discard', 0);
      expect(result.consecutiveEatCount).toBe(0);
    });

    it('is permitted even when actionDisabledTimer > 0', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'raw' });
      const state = makeGameState({
        actionDisabledTimer: 2.0,
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'discard', 0);
      expect(result.grill[0]!.part).toBeNull();
    });

    it('does not reset bingeNextDishDoubled on discard', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        bingeNextDishDoubled: true,
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'discard', 0);
      expect(result.bingeNextDishDoubled).toBe(true);
    });
  });

  describe('flip', () => {
    it('is blocked by actionDisabledTimer > 0', () => {
      const meat = makeMeatPart({ grillTime: 5 });
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'rare', timeInState: 3 });
      const state = makeGameState({
        actionDisabledTimer: 1.5,
        skills: ['tong-master'], // flip requires Tong Master
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'flip', 0);
      expect(result.grill[0]!.timeInState).toBe(3); // unchanged
    });

    it('returns state unchanged if Tong Master skill is not held', () => {
      const meat = makeMeatPart({ grillTime: 5 });
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'rare', timeInState: 4 });
      const state = makeGameState({
        skills: [], // no tong-master
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'flip', 0);
      expect(result).toBe(state);
    });

    it('does not reset consecutiveEatCount on flip', () => {
      const meat = makeMeatPart({ grillTime: 5 });
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'rare', timeInState: 2 });
      const state = makeGameState({
        consecutiveEatCount: 3,
        skills: ['tong-master'],
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'flip', 0);
      expect(result.consecutiveEatCount).toBe(3);
    });
  });

  describe('instant-exchange', () => {
    it('returns state unchanged for non-vegan-tashiro character', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'raw' });
      const state = makeGameState({
        character: 'tanaka',
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        coins: 100,
      });
      const result = processAction(state, 'instant-exchange', 0);
      expect(result).toBe(state);
    });
  });

  describe('delayed-exchange', () => {
    it('returns state unchanged for non-vegan-tashiro character', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'raw' });
      const state = makeGameState({
        character: 'tanaka',
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = processAction(state, 'delayed-exchange', 0);
      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('does not mutate the input state', () => {
      const meat = makeMeatPart();
      const slot = makeGrillSlot({ id: 0, part: meat, state: 'medium' });
      const state = makeGameState({
        grill: [slot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const frozen = Object.freeze(state);
      expect(() => processAction(frozen, 'discard', 0)).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// checkPhaseTransition
// ---------------------------------------------------------------------------

describe('checkPhaseTransition', () => {
  describe('restaurant not yet cleared', () => {
    it('returns state unchanged when meatDishesEaten < totalMeatDishes', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ meatDishesEaten: 5, totalMeatDishes: 8 }),
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result).toBe(state);
    });
  });

  describe('restaurant cleared', () => {
    it('increments score by 1 on restaurant clear', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
        score: 2,
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result.score).toBe(3);
    });

    it('transitions to skill-select phase on restaurant clear', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result.phase).toBe('skill-select');
    });

    it('populates pendingSkillChoices on restaurant clear', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      // May be empty if skill pool is exhausted, but must be an array
      expect(Array.isArray(result.pendingSkillChoices)).toBe(true);
    });

    it('does not transition to true-ending at cycle 1 boss', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({
          meatDishesEaten: 15,
          totalMeatDishes: 15,
          definition: {
            type: 'boss',
            nameJP: 'ボス',
            totalDishes: 15,
            servingInterval: 3,
            rankDistribution: { common: 0, upper: 0, premium: 0, elite: 1 },
            activePenalties: [],
          },
        }),
        cycle: 1,
        restaurantIndexInCycle: 3, // Boss position
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result.phase).not.toBe('true-ending');
    });
  });

  describe('True Ending', () => {
    it(`transitions to true-ending when cycle is ${TRUE_ENDING_CYCLE} and boss is cleared`, () => {
      const state = makeGameState({
        restaurant: makeRestaurant({
          meatDishesEaten: 15,
          totalMeatDishes: 15,
          definition: {
            type: 'boss',
            nameJP: 'ラスボス',
            totalDishes: 15,
            servingInterval: 3,
            rankDistribution: { common: 0, upper: 0, premium: 0, elite: 1 },
            activePenalties: [],
          },
        }),
        cycle: TRUE_ENDING_CYCLE,
        restaurantIndexInCycle: 3, // Boss position (index 3)
        score: 15,
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result.phase).toBe('true-ending');
    });

    it('does not trigger true-ending at TRUE_ENDING_CYCLE but non-boss position', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({
          meatDishesEaten: 8,
          totalMeatDishes: 8,
          definition: {
            type: 'chain',
            nameJP: 'チェーン',
            totalDishes: 8,
            servingInterval: 8,
            rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
            activePenalties: [],
          },
        }),
        cycle: TRUE_ENDING_CYCLE,
        restaurantIndexInCycle: 0, // Chain position, not Boss
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result.phase).not.toBe('true-ending');
      expect(result.phase).toBe('skill-select');
    });
  });

  describe('binge streak across restaurant boundary', () => {
    it('does not reset consecutiveEatCount on restaurant clear', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
        consecutiveEatCount: 7,
        phase: 'playing',
      });
      const result = checkPhaseTransition(state);
      expect(result.consecutiveEatCount).toBe(7);
    });
  });

  describe('immutability', () => {
    it('does not mutate the input state', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ meatDishesEaten: 5, totalMeatDishes: 8 }),
        phase: 'playing',
      });
      const frozen = Object.freeze(state);
      expect(() => checkPhaseTransition(frozen)).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: vi.mock ensures module under test is not yet implemented
// (Red phase guard — if game-loop.ts is accidentally created without exports,
//  the import at the top will surface a clear error rather than silent no-ops)
// ---------------------------------------------------------------------------

describe('module exports (red-phase guard)', () => {
  it('exports initGameState as a function', () => {
    expect(typeof initGameState).toBe('function');
  });

  it('exports gameTick as a function', () => {
    expect(typeof gameTick).toBe('function');
  });

  it('exports processAction as a function', () => {
    expect(typeof processAction).toBe('function');
  });

  it('exports checkPhaseTransition as a function', () => {
    expect(typeof checkPhaseTransition).toBe('function');
  });
});

import type {
  GameState,
  GrillSlot,
  Restaurant,
  RestaurantDefinition,
  MeatPart,
} from '../types/index';
import {
  createRestaurant,
  generateDish,
  tickServing,
  checkRestaurantCleared,
  advanceToNextRestaurant,
  getDifficultyModifiers,
} from '../game/systems/restaurant';
import {
  DISHES_PER_RESTAURANT,
  SERVING_INTERVALS,
  SERVING_SPEED_REDUCTION_PER_CYCLE,
  SERVING_SPEED_MAX_REDUCTION,
  SWEET_SPOT_REDUCTION_PER_CYCLE,
  SWEET_SPOT_SCALING_CAP_CYCLE,
  PENALTY_INCREASE_PER_CYCLE,
  PENALTY_SCALING_CAP_CYCLE,
} from '../game/data/constants';
import { RESTAURANT_CYCLE_ORDER } from '../game/data/restaurants';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRestaurantDef(overrides: Partial<RestaurantDefinition> = {}): RestaurantDefinition {
  return {
    type: 'chain',
    nameJP: 'テストチェーン',
    totalDishes: DISHES_PER_RESTAURANT.CHAIN,
    servingInterval: SERVING_INTERVALS.CHAIN,
    rankDistribution: { common: 1.0, upper: 0.0, premium: 0.0, elite: 0.0 },
    activePenalties: ['table-overflow'],
    ...overrides,
  };
}

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    definition: makeRestaurantDef(),
    dishesServed: 0,
    meatDishesEaten: 0,
    totalMeatDishes: DISHES_PER_RESTAURANT.CHAIN,
    timeSinceLastServe: 0,
    effectiveServingInterval: SERVING_INTERVALS.CHAIN,
    startTime: 0,
    servingQueue: [],
    isCleared: false,
    ...overrides,
  };
}

function makeGrillSlot(id: number, overrides: Partial<GrillSlot> = {}): GrillSlot {
  return {
    id,
    part: null,
    state: 'raw',
    timeInState: 0,
    fireTimer: 0,
    disabled: false,
    disabledTimer: 0,
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
    grill: [makeGrillSlot(0), makeGrillSlot(1), makeGrillSlot(2)],
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
    flareRisk: 0.4,
    sweetSpot: 2,
    flavorText: 'A reliable classic.',
    isVegetable: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createRestaurant
// ---------------------------------------------------------------------------

describe('createRestaurant', () => {
  it('is exported as a function', () => {
    expect(typeof createRestaurant).toBe('function');
  });

  describe('definition.type matches RESTAURANT_CYCLE_ORDER', () => {
    it('index 0 → chain', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.definition.type).toBe(RESTAURANT_CYCLE_ORDER[0]!);
    });

    it('index 1 → local', () => {
      const r = createRestaurant(1, 1, 0);
      expect(r.definition.type).toBe(RESTAURANT_CYCLE_ORDER[1]!);
    });

    it('index 2 → high-end', () => {
      const r = createRestaurant(1, 2, 0);
      expect(r.definition.type).toBe(RESTAURANT_CYCLE_ORDER[2]!);
    });

    it('index 3 → boss', () => {
      const r = createRestaurant(1, 3, 0);
      expect(r.definition.type).toBe(RESTAURANT_CYCLE_ORDER[3]!);
    });
  });

  describe('initial field values', () => {
    it('totalMeatDishes equals DISHES_PER_RESTAURANT.CHAIN for chain', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.totalMeatDishes).toBe(DISHES_PER_RESTAURANT.CHAIN);
    });

    it('totalMeatDishes equals DISHES_PER_RESTAURANT.LOCAL for local', () => {
      const r = createRestaurant(1, 1, 0);
      expect(r.totalMeatDishes).toBe(DISHES_PER_RESTAURANT.LOCAL);
    });

    it('totalMeatDishes equals DISHES_PER_RESTAURANT.HIGH_END for high-end', () => {
      const r = createRestaurant(1, 2, 0);
      expect(r.totalMeatDishes).toBe(DISHES_PER_RESTAURANT.HIGH_END);
    });

    it('totalMeatDishes equals DISHES_PER_RESTAURANT.BOSS for boss', () => {
      const r = createRestaurant(1, 3, 0);
      expect(r.totalMeatDishes).toBe(DISHES_PER_RESTAURANT.BOSS);
    });

    it('meatDishesEaten starts at 0', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.meatDishesEaten).toBe(0);
    });

    it('dishesServed starts at 0', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.dishesServed).toBe(0);
    });

    it('timeSinceLastServe starts at 0', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.timeSinceLastServe).toBe(0);
    });

    it('isCleared starts as false', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.isCleared).toBe(false);
    });

    it('startTime equals the passed currentElapsedTime', () => {
      const r = createRestaurant(1, 0, 42.5);
      expect(r.startTime).toBe(42.5);
    });
  });

  describe('effectiveServingInterval — difficulty scaling', () => {
    it('cycle 1 has no reduction (chain base = 8)', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.effectiveServingInterval).toBe(SERVING_INTERVALS.CHAIN);
    });

    it('cycle 2 reduces chain interval by 0.5s', () => {
      const r = createRestaurant(2, 0, 0);
      const expected = SERVING_INTERVALS.CHAIN - SERVING_SPEED_REDUCTION_PER_CYCLE;
      expect(r.effectiveServingInterval).toBeCloseTo(expected);
    });

    it('cycle 3 reduces chain interval by 1.0s (cap reached)', () => {
      const r = createRestaurant(3, 0, 0);
      const expected = SERVING_INTERVALS.CHAIN - SERVING_SPEED_MAX_REDUCTION;
      expect(r.effectiveServingInterval).toBeCloseTo(expected);
    });

    it('cycle 4 does not reduce further than cycle 3 (cap)', () => {
      const r3 = createRestaurant(3, 0, 0);
      const r4 = createRestaurant(4, 0, 0);
      expect(r4.effectiveServingInterval).toBeCloseTo(r3.effectiveServingInterval);
    });

    it('effectiveServingInterval is never less than 1.0', () => {
      // Boss at cycle 1 has base interval of 3; cap-constrained cycles push it down
      // but the floor must hold
      const r = createRestaurant(10, 3, 0);
      expect(r.effectiveServingInterval).toBeGreaterThanOrEqual(1.0);
    });

    it('cycle 1 local interval has no reduction', () => {
      const r = createRestaurant(1, 1, 0);
      expect(r.effectiveServingInterval).toBe(SERVING_INTERVALS.LOCAL);
    });
  });

  describe('serving queue', () => {
    it('contains at least totalMeatDishes entries', () => {
      const r = createRestaurant(1, 0, 0);
      // Queue has meat + possibly interleaved vegetables
      expect(r.servingQueue.length).toBeGreaterThanOrEqual(r.totalMeatDishes);
    });

    it('queue length >= totalMeatDishes (vegetables may be interleaved)', () => {
      const r = createRestaurant(1, 0, 0);
      expect(r.servingQueue.length).toBeGreaterThanOrEqual(r.totalMeatDishes);
    });

    it('all items in the queue have the required MeatPart fields', () => {
      const r = createRestaurant(1, 0, 0);
      r.servingQueue.forEach((p: MeatPart) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('rank');
        expect(p).toHaveProperty('grillTime');
        expect(p).toHaveProperty('sweetSpot');
      });
    });

    it('chain restaurant queue contains only common-rank parts', () => {
      const r = createRestaurant(1, 0, 0);
      r.servingQueue.forEach((p: MeatPart) => {
        expect(p.rank).toBe('common');
      });
    });

    it('boss restaurant queue contains only premium or elite rank meat parts', () => {
      const r = createRestaurant(1, 3, 0);
      r.servingQueue.forEach((p: MeatPart) => {
        expect(['premium', 'elite']).toContain(p.rank);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// generateDish
// ---------------------------------------------------------------------------

describe('generateDish', () => {
  it('is exported as a function', () => {
    expect(typeof generateDish).toBe('function');
  });

  it('returns a MeatPart (isVegetable = false)', () => {
    const r = makeRestaurant();
    const part = generateDish(r);
    expect(part.isVegetable).toBe(false);
  });

  it('returns an object with id, rank, grillTime, flareRisk, sweetSpot fields', () => {
    const r = makeRestaurant();
    const part = generateDish(r);
    expect(part).toHaveProperty('id');
    expect(part).toHaveProperty('rank');
    expect(part).toHaveProperty('grillTime');
    expect(part).toHaveProperty('flareRisk');
    expect(part).toHaveProperty('sweetSpot');
  });

  describe('rank selection follows distribution weights', () => {
    it('chain (100% common) always returns common rank', () => {
      const r = makeRestaurant({
        definition: makeRestaurantDef({
          type: 'chain',
          rankDistribution: { common: 1.0, upper: 0.0, premium: 0.0, elite: 0.0 },
        }),
      });
      for (let i = 0; i < 20; i++) {
        expect(generateDish(r).rank).toBe('common');
      }
    });

    it('boss (40% premium, 60% elite) never returns common or upper', () => {
      const r = makeRestaurant({
        definition: makeRestaurantDef({
          type: 'boss',
          rankDistribution: { common: 0.0, upper: 0.0, premium: 0.40, elite: 0.60 },
        }),
      });
      for (let i = 0; i < 30; i++) {
        const rank = generateDish(r).rank;
        expect(['premium', 'elite']).toContain(rank);
      }
    });

    it('high-end (0% common, 30% upper, 70% premium) never returns common or elite', () => {
      const r = makeRestaurant({
        definition: makeRestaurantDef({
          type: 'high-end',
          rankDistribution: { common: 0.0, upper: 0.30, premium: 0.70, elite: 0.0 },
        }),
      });
      for (let i = 0; i < 30; i++) {
        const rank = generateDish(r).rank;
        expect(['upper', 'premium']).toContain(rank);
      }
    });

    it('local (40% common, 60% upper) never returns premium or elite', () => {
      const r = makeRestaurant({
        definition: makeRestaurantDef({
          type: 'local',
          rankDistribution: { common: 0.40, upper: 0.60, premium: 0.00, elite: 0.00 },
        }),
      });
      for (let i = 0; i < 30; i++) {
        const rank = generateDish(r).rank;
        expect(['common', 'upper']).toContain(rank);
      }
    });

    it('with injectable RNG returning 0.0 → chain picks common', () => {
      // generateDish must accept an optional rng parameter, or use a deterministic approach
      // We rely on the fact that chain has 100% common — any roll picks common
      const r = makeRestaurant({
        definition: makeRestaurantDef({
          rankDistribution: { common: 1.0, upper: 0.0, premium: 0.0, elite: 0.0 },
        }),
      });
      const part = generateDish(r);
      expect(part.rank).toBe('common');
    });

    it('distribution produces both common and upper over many runs for local', () => {
      const r = makeRestaurant({
        definition: makeRestaurantDef({
          type: 'local',
          rankDistribution: { common: 0.40, upper: 0.60, premium: 0.00, elite: 0.00 },
        }),
      });
      const ranks = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ranks.add(generateDish(r).rank);
      }
      expect(ranks.has('common')).toBe(true);
      expect(ranks.has('upper')).toBe(true);
    });
  });

  it('never returns a vegetable', () => {
    const r = makeRestaurant();
    for (let i = 0; i < 20; i++) {
      expect(generateDish(r).isVegetable).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// tickServing
// ---------------------------------------------------------------------------

describe('tickServing', () => {
  it('is exported as a function', () => {
    expect(typeof tickServing).toBe('function');
  });

  it('returns a new GameState object (no mutation)', () => {
    const queue: readonly MeatPart[] = [makeMeatPart()];
    const state = makeGameState({
      restaurant: makeRestaurant({
        timeSinceLastServe: 0,
        effectiveServingInterval: 8,
        servingQueue: queue,
      }),
    });
    const next = tickServing(state, 1);
    expect(next).not.toBe(state);
  });

  it('accumulates timeSinceLastServe when interval not yet reached', () => {
    const queue: readonly MeatPart[] = [makeMeatPart()];
    const state = makeGameState({
      restaurant: makeRestaurant({
        timeSinceLastServe: 0,
        effectiveServingInterval: 8,
        servingQueue: queue,
      }),
    });
    const next = tickServing(state, 3);
    expect(next.restaurant.timeSinceLastServe).toBeCloseTo(3);
  });

  it('does not dequeue a dish when interval is not reached', () => {
    const queue: readonly MeatPart[] = [makeMeatPart()];
    const state = makeGameState({
      restaurant: makeRestaurant({
        timeSinceLastServe: 0,
        effectiveServingInterval: 8,
        servingQueue: queue,
      }),
    });
    const next = tickServing(state, 3);
    expect(next.restaurant.servingQueue.length).toBe(1);
  });

  it('dequeues one dish when timeSinceLastServe crosses effectiveServingInterval', () => {
    const queue: readonly MeatPart[] = [makeMeatPart({ id: 'dish-1' }), makeMeatPart({ id: 'dish-2' })];
    const state = makeGameState({
      table: [],
      tableCapacity: 5,
      restaurant: makeRestaurant({
        timeSinceLastServe: 7.5,
        effectiveServingInterval: 8,
        servingQueue: queue,
      }),
    });
    const next = tickServing(state, 1);
    // After tick: 7.5 + 1.0 = 8.5 >= 8 → one dish dequeued
    expect(next.restaurant.servingQueue.length).toBe(1);
  });

  it('subtracts effectiveServingInterval from timeSinceLastServe on dequeue', () => {
    const queue: readonly MeatPart[] = [makeMeatPart()];
    const state = makeGameState({
      table: [],
      tableCapacity: 5,
      restaurant: makeRestaurant({
        timeSinceLastServe: 7.5,
        effectiveServingInterval: 8,
        servingQueue: queue,
      }),
    });
    const next = tickServing(state, 1);
    // 7.5 + 1 = 8.5; after consuming one interval: 8.5 - 8 = 0.5
    expect(next.restaurant.timeSinceLastServe).toBeCloseTo(0.5);
  });

  it('handles large deltaTime by serving multiple dishes', () => {
    const queue: readonly MeatPart[] = [
      makeMeatPart({ id: 'd1' }),
      makeMeatPart({ id: 'd2' }),
      makeMeatPart({ id: 'd3' }),
    ];
    const state = makeGameState({
      table: [],
      tableCapacity: 5,
      restaurant: makeRestaurant({
        timeSinceLastServe: 0,
        effectiveServingInterval: 4,
        servingQueue: queue,
      }),
    });
    // deltaTime of 10 covers at least 2 intervals (10 / 4 = 2.5)
    const next = tickServing(state, 10);
    expect(next.restaurant.servingQueue.length).toBeLessThan(3);
  });

  it('stops when serving queue is empty', () => {
    const state = makeGameState({
      restaurant: makeRestaurant({
        timeSinceLastServe: 0,
        effectiveServingInterval: 4,
        servingQueue: [],
      }),
    });
    const next = tickServing(state, 20);
    expect(next.restaurant.servingQueue.length).toBe(0);
    // Game-over should not be triggered just because the queue is empty
    expect(next.gameOver).toBeNull();
  });

  it('does not mutate original state', () => {
    const queue: readonly MeatPart[] = [makeMeatPart()];
    const originalQueue = queue;
    const state = makeGameState({
      table: [],
      tableCapacity: 5,
      restaurant: makeRestaurant({
        timeSinceLastServe: 7,
        effectiveServingInterval: 8,
        servingQueue: originalQueue,
      }),
    });
    tickServing(state, 2);
    // Original queue must still contain the dish
    expect(state.restaurant.servingQueue).toBe(originalQueue);
    expect(state.restaurant.servingQueue.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// checkRestaurantCleared
// ---------------------------------------------------------------------------

describe('checkRestaurantCleared', () => {
  it('is exported as a function', () => {
    expect(typeof checkRestaurantCleared).toBe('function');
  });

  it('returns false when meatDishesEaten < totalMeatDishes', () => {
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 5, totalMeatDishes: 8 }),
    });
    expect(checkRestaurantCleared(state)).toBe(false);
  });

  it('returns true when meatDishesEaten === totalMeatDishes', () => {
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
    });
    expect(checkRestaurantCleared(state)).toBe(true);
  });

  it('returns true when meatDishesEaten > totalMeatDishes (invariant edge)', () => {
    // Spec says meatDishesEaten >= totalMeatDishes
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 9, totalMeatDishes: 8 }),
    });
    expect(checkRestaurantCleared(state)).toBe(true);
  });

  it('returns false when meatDishesEaten = 0', () => {
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 0, totalMeatDishes: 8 }),
    });
    expect(checkRestaurantCleared(state)).toBe(false);
  });

  it('is a pure function — does not mutate state', () => {
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
    });
    const before = state.restaurant.meatDishesEaten;
    checkRestaurantCleared(state);
    expect(state.restaurant.meatDishesEaten).toBe(before);
  });

  it('ignores items still on grill or table', () => {
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 8, totalMeatDishes: 8 }),
      grill: [
        makeGrillSlot(0, { part: makeMeatPart(), state: 'medium' }),
      ],
      table: [makeMeatPart()],
    });
    expect(checkRestaurantCleared(state)).toBe(true);
  });

  it('does not count vegetable dishes toward clearing', () => {
    // meatDishesEaten only counts meat — vegetables don't contribute to totalMeatDishes
    const state = makeGameState({
      restaurant: makeRestaurant({ meatDishesEaten: 7, totalMeatDishes: 8 }),
    });
    expect(checkRestaurantCleared(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// advanceToNextRestaurant
// ---------------------------------------------------------------------------

describe('advanceToNextRestaurant', () => {
  it('is exported as a function', () => {
    expect(typeof advanceToNextRestaurant).toBe('function');
  });

  it('returns a new GameState object (no mutation)', () => {
    const state = makeGameState({ restaurantIndexInCycle: 0, cycle: 1 });
    const next = advanceToNextRestaurant(state);
    expect(next).not.toBe(state);
  });

  describe('index cycling', () => {
    it('advances index from 0 to 1', () => {
      const state = makeGameState({ restaurantIndexInCycle: 0, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.restaurantIndexInCycle).toBe(1);
    });

    it('advances index from 1 to 2', () => {
      const state = makeGameState({ restaurantIndexInCycle: 1, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.restaurantIndexInCycle).toBe(2);
    });

    it('advances index from 2 to 3', () => {
      const state = makeGameState({ restaurantIndexInCycle: 2, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.restaurantIndexInCycle).toBe(3);
    });

    it('wraps index from 3 back to 0 (Boss → Chain)', () => {
      const state = makeGameState({ restaurantIndexInCycle: 3, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.restaurantIndexInCycle).toBe(0);
    });
  });

  describe('cycle increment', () => {
    it('cycle stays the same when advancing from index 0→1', () => {
      const state = makeGameState({ restaurantIndexInCycle: 0, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.cycle).toBe(1);
    });

    it('cycle stays the same when advancing from index 2→3', () => {
      const state = makeGameState({ restaurantIndexInCycle: 2, cycle: 2 });
      const next = advanceToNextRestaurant(state);
      expect(next.cycle).toBe(2);
    });

    it('cycle increments when wrapping from Boss (index 3) to Chain (index 0)', () => {
      const state = makeGameState({ restaurantIndexInCycle: 3, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.cycle).toBe(2);
    });

    it('cycle 3 increments to 4 on wrap', () => {
      const state = makeGameState({ restaurantIndexInCycle: 3, cycle: 3 });
      const next = advanceToNextRestaurant(state);
      expect(next.cycle).toBe(4);
    });
  });

  describe('score and coins (preserved, not awarded here)', () => {
    it('does NOT change score (awards handled by checkPhaseTransition)', () => {
      const state = makeGameState({ score: 5, restaurantIndexInCycle: 0, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.score).toBe(5);
    });

    it('does NOT change coins (awards handled by checkPhaseTransition)', () => {
      const state = makeGameState({ coins: 50, restaurantIndexInCycle: 0, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.coins).toBe(50);
    });
  });

  describe('highestRestaurantTypeReached', () => {
    it('updates to nextIndex when nextIndex is higher', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        highestRestaurantTypeReached: 0,
        cycle: 1,
      });
      const next = advanceToNextRestaurant(state);
      // nextIndex = 1 (local)
      expect(next.highestRestaurantTypeReached).toBe(1);
    });

    it('does not decrease when nextIndex is lower (monotonically non-decreasing)', () => {
      // After Boss (3) → Chain (0), highestRestaurantTypeReached stays at 3
      const state = makeGameState({
        restaurantIndexInCycle: 3,
        highestRestaurantTypeReached: 3,
        cycle: 1,
      });
      const next = advanceToNextRestaurant(state);
      expect(next.highestRestaurantTypeReached).toBe(3);
    });

    it('keeps higher value when current is already higher', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        highestRestaurantTypeReached: 3,
        cycle: 1,
      });
      const next = advanceToNextRestaurant(state);
      expect(next.highestRestaurantTypeReached).toBe(3);
    });
  });

  describe('new restaurant creation', () => {
    it('creates a new Restaurant for the next position', () => {
      const state = makeGameState({ restaurantIndexInCycle: 0, cycle: 1 });
      const next = advanceToNextRestaurant(state);
      expect(next.restaurant).toBeDefined();
      expect(next.restaurant.definition.type).toBe('local');
    });

    it('grill is cleared on advance', () => {
      const occupiedSlot = makeGrillSlot(0, { part: makeMeatPart(), state: 'medium' });
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        cycle: 1,
        grill: [occupiedSlot, makeGrillSlot(1), makeGrillSlot(2)],
      });
      const next = advanceToNextRestaurant(state);
      expect(next.grill[0]!.part).toBeNull();
      expect(next.grill[0]!.disabled).toBe(false);
    });

    it('table is cleared on advance', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        cycle: 1,
        table: [makeMeatPart()],
      });
      const next = advanceToNextRestaurant(state);
      expect(next.table.length).toBe(0);
    });
  });

  describe('skill: regular-customer', () => {
    it('reduces staffWarningCount by 1 when regular-customer skill is held', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        cycle: 1,
        skills: ['regular-customer'],
        staffWarningCount: 3,
      });
      const next = advanceToNextRestaurant(state);
      expect(next.staffWarningCount).toBeLessThanOrEqual(2);
    });

    it('staffWarningCount does not go below 0 with regular-customer', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        cycle: 1,
        skills: ['regular-customer'],
        staffWarningCount: 0,
      });
      const next = advanceToNextRestaurant(state);
      expect(next.staffWarningCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('skill: regular-customer-bonus (coins awarded by checkPhaseTransition, not here)', () => {
    it('does NOT award coins here (handled by checkPhaseTransition)', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        cycle: 1,
        coins: 50,
        skills: ['regular-customer-bonus'],
        staffWarningCount: 0,
      });
      const next = advanceToNextRestaurant(state);
      expect(next.coins).toBe(50);
    });

    it('coins unchanged regardless of staffWarningCount', () => {
      const state = makeGameState({
        restaurantIndexInCycle: 0,
        cycle: 1,
        coins: 50,
        skills: ['regular-customer-bonus'],
        staffWarningCount: 2,
      });
      const next = advanceToNextRestaurant(state);
      expect(next.coins).toBe(50);
    });
  });
});

// ---------------------------------------------------------------------------
// getDifficultyModifiers
// ---------------------------------------------------------------------------

describe('getDifficultyModifiers', () => {
  it('is exported as a function', () => {
    expect(typeof getDifficultyModifiers).toBe('function');
  });

  it('returns an object with the three expected keys', () => {
    const mods = getDifficultyModifiers(1);
    expect(mods).toHaveProperty('servingSpeedReduction');
    expect(mods).toHaveProperty('sweetSpotReduction');
    expect(mods).toHaveProperty('penaltyMultiplier');
  });

  describe('cycle 1 — no scaling applied', () => {
    it('servingSpeedReduction = 0', () => {
      expect(getDifficultyModifiers(1).servingSpeedReduction).toBeCloseTo(0);
    });

    it('sweetSpotReduction = 0', () => {
      expect(getDifficultyModifiers(1).sweetSpotReduction).toBeCloseTo(0);
    });

    it('penaltyMultiplier = 1.0', () => {
      expect(getDifficultyModifiers(1).penaltyMultiplier).toBeCloseTo(1.0);
    });
  });

  describe('servingSpeedReduction', () => {
    it('cycle 2 → 0.5 reduction', () => {
      const expected = SERVING_SPEED_REDUCTION_PER_CYCLE; // 0.5
      expect(getDifficultyModifiers(2).servingSpeedReduction).toBeCloseTo(expected);
    });

    it('cycle 3 → 1.0 reduction (cap)', () => {
      expect(getDifficultyModifiers(3).servingSpeedReduction).toBeCloseTo(SERVING_SPEED_MAX_REDUCTION);
    });

    it('cycle 4 → still 1.0 (cap holds)', () => {
      expect(getDifficultyModifiers(4).servingSpeedReduction).toBeCloseTo(SERVING_SPEED_MAX_REDUCTION);
    });

    it('cycle 10 → still 1.0 (cap holds)', () => {
      expect(getDifficultyModifiers(10).servingSpeedReduction).toBeCloseTo(SERVING_SPEED_MAX_REDUCTION);
    });
  });

  describe('sweetSpotReduction', () => {
    it('cycle 2 → SWEET_SPOT_REDUCTION_PER_CYCLE × 1', () => {
      const expected = SWEET_SPOT_REDUCTION_PER_CYCLE; // 0.3
      expect(getDifficultyModifiers(2).sweetSpotReduction).toBeCloseTo(expected);
    });

    it('cycle 3 → SWEET_SPOT_REDUCTION_PER_CYCLE × 2', () => {
      expect(getDifficultyModifiers(3).sweetSpotReduction).toBeCloseTo(SWEET_SPOT_REDUCTION_PER_CYCLE * 2);
    });

    it('cycle 5 → capped at (SWEET_SPOT_SCALING_CAP_CYCLE - 1) steps', () => {
      const maxSteps = SWEET_SPOT_SCALING_CAP_CYCLE - 1; // 4
      const maxReduction = maxSteps * SWEET_SPOT_REDUCTION_PER_CYCLE;
      expect(getDifficultyModifiers(5).sweetSpotReduction).toBeCloseTo(maxReduction);
    });

    it('cycle 6 → same cap as cycle 5', () => {
      expect(getDifficultyModifiers(6).sweetSpotReduction).toBeCloseTo(
        getDifficultyModifiers(5).sweetSpotReduction,
      );
    });
  });

  describe('penaltyMultiplier', () => {
    it('cycle 2 → 1.0 + PENALTY_INCREASE_PER_CYCLE × 1', () => {
      const expected = 1.0 + PENALTY_INCREASE_PER_CYCLE;
      expect(getDifficultyModifiers(2).penaltyMultiplier).toBeCloseTo(expected);
    });

    it('cycle 5 → 1.4 (4 increments × 0.10)', () => {
      const maxIncrements = PENALTY_SCALING_CAP_CYCLE - 1; // 4
      const expected = 1.0 + maxIncrements * PENALTY_INCREASE_PER_CYCLE;
      expect(getDifficultyModifiers(5).penaltyMultiplier).toBeCloseTo(expected);
    });

    it('cycle 6+ is capped at cycle 5 value', () => {
      expect(getDifficultyModifiers(6).penaltyMultiplier).toBeCloseTo(
        getDifficultyModifiers(5).penaltyMultiplier,
      );
    });

    it('cycle 10 → same as cycle 5 (cap holds)', () => {
      expect(getDifficultyModifiers(10).penaltyMultiplier).toBeCloseTo(
        getDifficultyModifiers(5).penaltyMultiplier,
      );
    });
  });

  describe('purity and invariants', () => {
    it('same cycle always returns the same values', () => {
      const a = getDifficultyModifiers(3);
      const b = getDifficultyModifiers(3);
      expect(a.servingSpeedReduction).toBeCloseTo(b.servingSpeedReduction);
      expect(a.sweetSpotReduction).toBeCloseTo(b.sweetSpotReduction);
      expect(a.penaltyMultiplier).toBeCloseTo(b.penaltyMultiplier);
    });

    it('all values are non-negative for cycle 1', () => {
      const mods = getDifficultyModifiers(1);
      expect(mods.servingSpeedReduction).toBeGreaterThanOrEqual(0);
      expect(mods.sweetSpotReduction).toBeGreaterThanOrEqual(0);
      expect(mods.penaltyMultiplier).toBeGreaterThanOrEqual(0);
    });

    it('all values are non-negative for high cycles', () => {
      const mods = getDifficultyModifiers(100);
      expect(mods.servingSpeedReduction).toBeGreaterThanOrEqual(0);
      expect(mods.sweetSpotReduction).toBeGreaterThanOrEqual(0);
      expect(mods.penaltyMultiplier).toBeGreaterThanOrEqual(0);
    });
  });
});

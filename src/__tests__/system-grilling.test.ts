import type {
  GameState,
  GrillSlot,
  MeatPart,
  VegetablePart,
  Restaurant,
  Part,
} from '../types/index';
import {
  advanceGrilling,
  eatMeat,
  discardMeat,
  flipMeat,
  serveDish,
  moveTableToGrill,
} from '../game/systems/grilling';
import {
  GRILL_TIME,
  FLIP_TIMER_RESET_FRACTION,
  SWEET_SPOT_MINIMUM,
  SWEET_SPOT_REDUCTION_PER_CYCLE,
  FAST_EATER_WAGE_COINS,
  PERFECT_GRILL_BONUS_COINS,
  TARE_CONVERSION_COINS,
  CHAR_BONUS_COINS,
  EATING_STREAK_THRESHOLD,
  EATING_STREAK_BONUS_COINS,
  DIGESTIVE_PRO_STREAK_THRESHOLD,
  INITIAL_TABLE_CAPACITY,
  TABLE_EXTENSION_COUNT,
  HEAT_SENSOR_WARNING_SECONDS,
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
    grillTime: GRILL_TIME.MEDIUM, // 5s
    flareRisk: 0.4,
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
    grillTime: GRILL_TIME.SHORT, // 3s
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

/** Always-trigger RNG: returns 0 so any flareRisk > 0 fires. */
const alwaysTrigger = () => 0;
/** Never-trigger RNG: returns 1 so flareRisk < 1 never fires. */
const neverTrigger = () => 1;

// ---------------------------------------------------------------------------
// advanceGrilling
// ---------------------------------------------------------------------------

describe('advanceGrilling', () => {
  describe('guard conditions', () => {
    it('returns slot unchanged when part is null', () => {
      const slot = makeGrillSlot({ part: null });
      const result = advanceGrilling(slot, 1, [], 1, neverTrigger);
      expect(result).toBe(slot);
    });

    it('returns slot unchanged when disabled is true', () => {
      const slot = makeGrillSlot({ part: makeMeatPart(), disabled: true });
      const result = advanceGrilling(slot, 1, [], 1, neverTrigger);
      expect(result).toBe(slot);
    });
  });

  describe('immutability', () => {
    it('does not mutate the input slot', () => {
      const slot = makeGrillSlot({ part: makeMeatPart(), state: 'raw', timeInState: 0 });
      const frozen = Object.freeze(slot);
      expect(() => advanceGrilling(frozen, 1, [], 1, neverTrigger)).not.toThrow();
    });

    it('returns a new object reference', () => {
      const slot = makeGrillSlot({ part: makeMeatPart(), state: 'raw', timeInState: 0 });
      const result = advanceGrilling(slot, 1, [], 1, neverTrigger);
      expect(result).not.toBe(slot);
    });
  });

  describe('timeInState accumulation (no transition)', () => {
    it('increments timeInState by deltaTime when no transition threshold is crossed', () => {
      const slot = makeGrillSlot({ part: makeMeatPart({ grillTime: GRILL_TIME.MEDIUM }), state: 'raw', timeInState: 0 });
      const result = advanceGrilling(slot, 2, [], 1, neverTrigger);
      expect(result.timeInState).toBeCloseTo(2);
      expect(result.state).toBe('raw');
    });
  });

  describe('state transitions: raw → rare → medium → well-done → burnt', () => {
    it('transitions raw → rare exactly when timeInState reaches grillTime', () => {
      const grillTime = GRILL_TIME.MEDIUM; // 5s
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'raw',
        timeInState: grillTime - 0.001,
      });
      // tiny delta to cross the boundary
      const result = advanceGrilling(slot, 0.002, [], 1, neverTrigger);
      expect(result.state).toBe('rare');
      expect(result.timeInState).toBeGreaterThanOrEqual(0);
    });

    it('transitions rare → medium when timeInState reaches grillTime', () => {
      const grillTime = GRILL_TIME.MEDIUM;
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'rare',
        timeInState: grillTime - 0.001,
      });
      const result = advanceGrilling(slot, 0.002, [], 1, neverTrigger);
      expect(result.state).toBe('medium');
    });

    it('transitions medium → well-done when timeInState reaches grillTime', () => {
      const grillTime = GRILL_TIME.MEDIUM;
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'medium',
        timeInState: grillTime - 0.001,
      });
      const result = advanceGrilling(slot, 0.002, [], 1, neverTrigger);
      expect(result.state).toBe('well-done');
    });

    it('transitions well-done → burnt when timeInState reaches effectiveSweetSpot at cycle 1', () => {
      const sweetSpot = 2; // base 2s, no cycle reduction at cycle 1
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: sweetSpot - 0.001,
      });
      const result = advanceGrilling(slot, 0.002, [], 1, neverTrigger);
      expect(result.state).toBe('burnt');
    });

    it('resets timeInState to 0 upon a state transition', () => {
      const grillTime = GRILL_TIME.MEDIUM;
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'raw',
        timeInState: grillTime - 0.001,
      });
      const result = advanceGrilling(slot, 0.002, [], 1, neverTrigger);
      expect(result.state).toBe('rare');
      // timeInState resets, only the leftover past the threshold remains
      expect(result.timeInState).toBeGreaterThanOrEqual(0);
      expect(result.timeInState).toBeLessThan(grillTime);
    });

    it('burnt is terminal — no further state transition occurs', () => {
      const slot = makeGrillSlot({
        part: makeMeatPart(),
        state: 'burnt',
        timeInState: 0,
      });
      const result = advanceGrilling(slot, 100, [], 1, neverTrigger);
      expect(result.state).toBe('burnt');
    });

    it('timeInState still increments in burnt state', () => {
      const slot = makeGrillSlot({
        part: makeMeatPart(),
        state: 'burnt',
        timeInState: 5,
      });
      const result = advanceGrilling(slot, 3, [], 1, neverTrigger);
      expect(result.timeInState).toBeGreaterThan(5);
    });
  });

  describe('sweet spot narrowing by cycle', () => {
    it('applies no reduction at cycle 1', () => {
      const sweetSpot = 3;
      // effectiveSweetSpot = max(SWEET_SPOT_MINIMUM, 3 - 0.3 * 0) = 3
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 2.9,
      });
      const result = advanceGrilling(slot, 0.05, [], 1, neverTrigger);
      // 2.9 + 0.05 = 2.95 < 3.0, should still be well-done
      expect(result.state).toBe('well-done');
    });

    it('reduces sweet spot by 0.3s × (cycle - 1) at cycle 2', () => {
      const sweetSpot = 3;
      // effectiveSweetSpot = max(SWEET_SPOT_MINIMUM, 3 - 0.3 * 1) = 2.7
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 2.65,
      });
      const result = advanceGrilling(slot, 0.1, [], 2, neverTrigger);
      // 2.65 + 0.1 = 2.75 >= 2.7 → should transition to burnt
      expect(result.state).toBe('burnt');
    });

    it('caps reduction at cycle 5 (4 reduction steps)', () => {
      const sweetSpot = 3;
      // At cycle 5: effectiveSweetSpot = max(SWEET_SPOT_MINIMUM, 3 - 0.3 * 4) = 3 - 1.2 = 1.8
      // At cycle 6 (capped): same result = 1.8
      const slotCycle5 = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 1.75,
      });
      const slotCycle6 = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 1.75,
      });
      const resultCycle5 = advanceGrilling(slotCycle5, 0.1, [], 5, neverTrigger);
      const resultCycle6 = advanceGrilling(slotCycle6, 0.1, [], 6, neverTrigger);
      // Both should have the same effective sweet spot → same transition behaviour
      expect(resultCycle5.state).toBe(resultCycle6.state);
    });

    it('uses SWEET_SPOT_MINIMUM when scaling would reduce sweet spot to zero or below', () => {
      // sweetSpot=1, cycle 5 → 1 - 0.3*4 = -0.2 → capped to SWEET_SPOT_MINIMUM
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot: 1 }),
        state: 'well-done',
        timeInState: SWEET_SPOT_MINIMUM - 0.001,
      });
      const result = advanceGrilling(slot, 0.002, [], 5, neverTrigger);
      // Should transition to burnt once timeInState exceeds SWEET_SPOT_MINIMUM
      expect(result.state).toBe('burnt');
    });
  });

  describe('flare risk checks', () => {
    it('does NOT trigger flare risk for vegetables (isVegetable === true)', () => {
      const vegSlot = makeGrillSlot({
        part: makeVegetablePart({ flareRisk: 0 }),
        state: 'raw',
        timeInState: 0,
      });
      // Cross 2 integer-second boundaries; if flare checked it would set timeInState back
      const result = advanceGrilling(vegSlot, 2.5, [], 1, alwaysTrigger);
      // timeInState should simply be 2.5 (no flare penalty)
      expect(result.timeInState).toBeCloseTo(2.5);
    });

    it('triggers flare risk once per integer-second boundary crossed', () => {
      // Meat with grillTime 5, flareRisk > 0, alwaysTrigger
      // Start at timeInState=0, advance 2.5s → crosses second boundaries at 1 and 2 → 2 flare checks
      // With alwaysTrigger, flare fires twice.
      // Each flare: newTimeInState = max(0, current - 5 * 0.5) = max(0, current - 2.5)
      const grillTime = GRILL_TIME.MEDIUM; // 5
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime, flareRisk: 1.0 }),
        state: 'raw',
        timeInState: 0,
      });
      const result = advanceGrilling(slot, 2.5, [], 1, alwaysTrigger);
      // After both flares, timeInState is reset each time via max(0, t - grillTime * FLIP_TIMER_RESET_FRACTION)
      // The exact value depends on implementation detail; we just verify it's less than 2.5
      expect(result.timeInState).toBeLessThan(2.5);
    });

    it('does NOT trigger flare when random() returns >= flareRisk', () => {
      const grillTime = GRILL_TIME.MEDIUM;
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime, flareRisk: 0.4 }),
        state: 'raw',
        timeInState: 0,
      });
      // neverTrigger returns 1, which is >= any flareRisk in [0,1)
      const result = advanceGrilling(slot, 2.5, [], 1, neverTrigger);
      expect(result.timeInState).toBeCloseTo(2.5);
      expect(result.state).toBe('raw');
    });

    it('flare in well-done reduces timeInState, potentially causing burnt transition in same tick', () => {
      // sweetSpot=1, timeInState=0.9; advance 0.2s → crosses 1s boundary → alwaysTrigger fires
      // flare: newTimeInState = max(0, 1.0 - 1 * 0.5) = 0.5; but then re-check: 0.5 < 1 → still well-done
      // Without transition, just verify the flare effect on timeInState reduces it
      const sweetSpot = 2;
      const grillTime = GRILL_TIME.MEDIUM; // 5
      // Place just below the sweet-spot boundary; a flare in well-done resets timeInState
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime, flareRisk: 1.0, sweetSpot }),
        state: 'well-done',
        timeInState: 0,
      });
      // Advance 1.5s (cross boundary at 1s): flare fires → newTimeInState = max(0, 1.5 - 5*0.5) = 0
      const result = advanceGrilling(slot, 1.5, [], 1, alwaysTrigger);
      // timeInState should be reduced by flare
      expect(result.timeInState).toBeLessThanOrEqual(1.5);
    });

    it('multiple integer-second boundaries trigger independent random() calls each', () => {
      let callCount = 0;
      const countingRandom = () => { callCount++; return 1; }; // never trigger but count calls
      const slot = makeGrillSlot({
        part: makeMeatPart({ flareRisk: 0.4 }),
        state: 'raw',
        timeInState: 0,
      });
      advanceGrilling(slot, 3.5, [], 1, countingRandom);
      // Should have crossed 3 integer-second boundaries (1, 2, 3)
      expect(callCount).toBe(3);
    });
  });

  describe('Heat Sensor warning', () => {
    it('does not throw when heat-sensor skill is in skills array and slot is near burnt', () => {
      const sweetSpot = 3;
      // timeInState approaching within 2s of effectiveSweetSpot
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 0.9, // 3 - 0.9 = 2.1 > 2, not yet warning
      });
      expect(() => advanceGrilling(slot, 0.2, ['heat-sensor'], 1, neverTrigger)).not.toThrow();
    });

    it('is safe to call without heat-sensor skill (no warning side-effect)', () => {
      const sweetSpot = 3;
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 1.5,
      });
      // 3 - 1.5 = 1.5 < HEAT_SENSOR_WARNING_SECONDS=2 → would warn if skill held
      const result = advanceGrilling(slot, 0.1, [], 1, neverTrigger);
      expect(result.state).toBe('well-done');
    });
  });
});

// ---------------------------------------------------------------------------
// flipMeat
// ---------------------------------------------------------------------------

describe('flipMeat', () => {
  describe('immutability', () => {
    it('returns a new slot object, does not mutate input', () => {
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime: GRILL_TIME.MEDIUM }),
        state: 'raw',
        timeInState: 3,
      });
      const frozen = Object.freeze(slot);
      expect(() => flipMeat(frozen)).not.toThrow();
      const result = flipMeat(slot);
      expect(result).not.toBe(slot);
    });
  });

  describe('non-well-done states', () => {
    it('resets timeInState by grillTime * FLIP_TIMER_RESET_FRACTION in raw state', () => {
      const grillTime = GRILL_TIME.MEDIUM; // 5
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'raw',
        timeInState: 4,
      });
      const result = flipMeat(slot);
      // newTimeInState = max(0, 4 - 5 * 0.5) = max(0, 4 - 2.5) = 1.5
      expect(result.timeInState).toBeCloseTo(4 - grillTime * FLIP_TIMER_RESET_FRACTION);
      expect(result.state).toBe('raw');
    });

    it('resets timeInState in rare state correctly', () => {
      const grillTime = GRILL_TIME.MEDIUM;
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'rare',
        timeInState: 2,
      });
      const result = flipMeat(slot);
      // newTimeInState = max(0, 2 - 5 * 0.5) = max(0, -0.5) = 0
      expect(result.timeInState).toBe(0);
      expect(result.state).toBe('rare');
    });

    it('clamps timeInState to 0 if result would be negative', () => {
      const grillTime = GRILL_TIME.MEDIUM;
      const slot = makeGrillSlot({
        part: makeMeatPart({ grillTime }),
        state: 'medium',
        timeInState: 1, // 1 - 5*0.5 = -1.5 → clamped to 0
      });
      const result = flipMeat(slot);
      expect(result.timeInState).toBe(0);
    });
  });

  describe('well-done state', () => {
    it('resets timeInState by sweetSpot * FLIP_TIMER_RESET_FRACTION', () => {
      const sweetSpot = 2;
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 1.5,
      });
      const result = flipMeat(slot);
      // newTimeInState = max(0, 1.5 - 2 * 0.5) = max(0, 0.5) = 0.5
      expect(result.timeInState).toBeCloseTo(1.5 - sweetSpot * FLIP_TIMER_RESET_FRACTION);
      expect(result.state).toBe('well-done');
    });

    it('clamps timeInState to 0 if sweetSpot reset would go negative', () => {
      const sweetSpot = 2;
      const slot = makeGrillSlot({
        part: makeMeatPart({ sweetSpot }),
        state: 'well-done',
        timeInState: 0.5, // 0.5 - 2*0.5 = -0.5 → 0
      });
      const result = flipMeat(slot);
      expect(result.timeInState).toBe(0);
    });
  });

  describe('preserves other slot fields', () => {
    it('does not change state, id, part, or fireTimer', () => {
      const part = makeMeatPart();
      const slot = makeGrillSlot({
        id: 2,
        part,
        state: 'medium',
        timeInState: 3,
        fireTimer: 0,
        disabled: false,
        disabledTimer: 0,
      });
      const result = flipMeat(slot);
      expect(result.id).toBe(2);
      expect(result.part).toBe(part);
      expect(result.state).toBe('medium');
      expect(result.fireTimer).toBe(0);
      expect(result.disabled).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// eatMeat
// ---------------------------------------------------------------------------

describe('eatMeat', () => {
  describe('guard conditions', () => {
    it('returns state unchanged when slotIndex is out of range', () => {
      const state = makeGameState();
      const result = eatMeat(state, 99);
      expect(result).toBe(state);
    });

    it('returns state unchanged when slot is empty (part === null)', () => {
      const state = makeGameState();
      const result = eatMeat(state, 0);
      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('does not mutate input state', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'well-done' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      Object.freeze(state);
      expect(() => eatMeat(state, 0)).not.toThrow();
    });
  });

  describe('slot clearing', () => {
    it('clears the eaten slot (part=null, state=raw, timeInState=0, fireTimer=0)', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium', timeInState: 3 }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      const slot = result.grill[0]!;
      expect(slot.part).toBeNull();
      expect(slot.state).toBe('raw');
      expect(slot.timeInState).toBe(0);
      expect(slot.fireTimer).toBe(0);
    });
  });

  describe('meatDishesEaten increment', () => {
    it('increments meatDishesEaten by 1 for meat', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.restaurant.meatDishesEaten).toBe(1);
    });

    it('does NOT increment meatDishesEaten for vegetables', () => {
      const veg = makeVegetablePart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part: veg, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.restaurant.meatDishesEaten).toBe(0);
    });
  });

  describe('catalog unlock', () => {
    it('adds meat id to catalog if not already present', () => {
      const part = makeMeatPart({ id: 'kalbi' });
      const state = makeGameState({
        catalog: [],
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.catalog).toContain('kalbi');
    });

    it('does not duplicate meat id in catalog if already present', () => {
      const part = makeMeatPart({ id: 'kalbi' });
      const state = makeGameState({
        catalog: ['kalbi'],
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.catalog.filter((id) => id === 'kalbi').length).toBe(1);
    });

    it('does NOT add vegetable to catalog', () => {
      const veg = makeVegetablePart({ id: 'green-pepper' });
      const state = makeGameState({
        catalog: [],
        grill: [
          makeGrillSlot({ id: 0, part: veg, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.catalog).not.toContain('green-pepper');
    });
  });

  describe('coin awards: fast-eaters-wage', () => {
    it('awards FAST_EATER_WAGE_COINS when eating rare meat with fast-eaters-wage skill', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['fast-eaters-wage'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'rare' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.coins).toBeGreaterThanOrEqual(FAST_EATER_WAGE_COINS);
    });

    it('does NOT award fast-eaters-wage coins for non-rare state', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['fast-eaters-wage'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.coins).toBe(0);
    });
  });

  describe('coin awards: perfect-grill-bonus', () => {
    it('awards PERFECT_GRILL_BONUS_COINS when eating well-done with perfect-grill-bonus skill', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['perfect-grill-bonus'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'well-done' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.coins).toBeGreaterThanOrEqual(PERFECT_GRILL_BONUS_COINS);
    });

    it('does NOT award perfect-grill-bonus coins for non-well-done state', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['perfect-grill-bonus'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'rare' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.coins).toBe(0);
    });
  });

  describe('coin awards: eating-streak-bonus', () => {
    it('awards EATING_STREAK_BONUS_COINS every EATING_STREAK_THRESHOLD consecutive eats', () => {
      const part = makeMeatPart();
      // consecutiveEatCount is already at EATING_STREAK_THRESHOLD - 1, eating one more triggers bonus
      const state = makeGameState({
        skills: ['eating-streak-bonus', 'binge-mode'],
        coins: 0,
        consecutiveEatCount: EATING_STREAK_THRESHOLD - 1,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.coins).toBeGreaterThanOrEqual(EATING_STREAK_BONUS_COINS);
    });
  });

  describe('binge-mode tracking', () => {
    it('increments consecutiveEatCount when binge-mode skill is held', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['binge-mode'],
        consecutiveEatCount: 2,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.consecutiveEatCount).toBe(3);
    });

    it('sets bingeNextDishDoubled when consecutiveEatCount reaches EATING_STREAK_THRESHOLD', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['binge-mode'],
        consecutiveEatCount: EATING_STREAK_THRESHOLD - 1,
        bingeNextDishDoubled: false,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.consecutiveEatCount).toBe(EATING_STREAK_THRESHOLD);
      expect(result.bingeNextDishDoubled).toBe(true);
    });

    it('uses DIGESTIVE_PRO_STREAK_THRESHOLD when digestive-pro skill is held', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['binge-mode', 'digestive-pro'],
        consecutiveEatCount: DIGESTIVE_PRO_STREAK_THRESHOLD - 1,
        bingeNextDishDoubled: false,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.consecutiveEatCount).toBe(DIGESTIVE_PRO_STREAK_THRESHOLD);
      expect(result.bingeNextDishDoubled).toBe(true);
    });

    it('does not reset consecutiveEatCount after binge fires — it continues accumulating', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['binge-mode'],
        consecutiveEatCount: EATING_STREAK_THRESHOLD - 1,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      // Counter should be EATING_STREAK_THRESHOLD, NOT reset to 0
      expect(result.consecutiveEatCount).toBe(EATING_STREAK_THRESHOLD);
    });
  });

  describe('raw meat penalty', () => {
    it('applies raw meat penalty (actionDisabledTimer) when eating raw meat', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'raw' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = eatMeat(state, 0);
      expect(result.actionDisabledTimer).toBeGreaterThan(0);
    });
  });

  describe('moveTableToGrill is called after eating', () => {
    it('moves a dish from the table to the freed grill slot', () => {
      const part = makeMeatPart();
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1, part: makeMeatPart({ id: 'beef-tongue' }), state: 'rare' }),
          makeGrillSlot({ id: 2, part: makeMeatPart({ id: 'loin' }), state: 'raw' }),
        ],
        table: [tableItem],
      });
      const result = eatMeat(state, 0);
      // Freed slot 0 should now have the table item
      expect(result.grill[0]!.part).not.toBeNull();
      expect(result.table.length).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// discardMeat
// ---------------------------------------------------------------------------

describe('discardMeat', () => {
  describe('guard conditions', () => {
    it('returns state unchanged when slotIndex is out of range', () => {
      const state = makeGameState();
      const result = discardMeat(state, 99);
      expect(result).toBe(state);
    });

    it('returns state unchanged when slot is empty', () => {
      const state = makeGameState();
      const result = discardMeat(state, 0);
      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('does not mutate input state', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'well-done' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      Object.freeze(state);
      expect(() => discardMeat(state, 0)).not.toThrow();
    });
  });

  describe('slot clearing', () => {
    it('clears the discarded slot', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'burnt' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      const slot = result.grill[0]!;
      expect(slot.part).toBeNull();
      expect(slot.state).toBe('raw');
      expect(slot.timeInState).toBe(0);
      expect(slot.fireTimer).toBe(0);
    });
  });

  describe('does NOT increment meatDishesEaten', () => {
    it('meatDishesEaten stays the same after discard', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.restaurant.meatDishesEaten).toBe(0);
    });
  });

  describe('staff warning: meat without protective skills', () => {
    it('increments staffWarningCount by 1 when discarding meat without discard-pro or tare-conversion', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: [],
        staffWarningCount: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.staffWarningCount).toBe(1);
    });
  });

  describe('staff warning: suppressed by discard-pro', () => {
    it('does NOT increment staffWarningCount when discard-pro is held', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['discard-pro'],
        staffWarningCount: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.staffWarningCount).toBe(0);
    });
  });

  describe('staff warning: suppressed by tare-conversion', () => {
    it('does NOT increment staffWarningCount when tare-conversion is held', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['tare-conversion'],
        staffWarningCount: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.staffWarningCount).toBe(0);
    });
  });

  describe('staff warning: vegetables are neutral', () => {
    it('does NOT increment staffWarningCount when discarding a vegetable', () => {
      const veg = makeVegetablePart();
      const state = makeGameState({
        skills: [],
        staffWarningCount: 0,
        grill: [
          makeGrillSlot({ id: 0, part: veg, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.staffWarningCount).toBe(0);
    });
  });

  describe('coin awards: tare-conversion', () => {
    it('grants TARE_CONVERSION_COINS on meat discard when tare-conversion is held', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['tare-conversion'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.coins).toBeGreaterThanOrEqual(TARE_CONVERSION_COINS);
    });

    it('does NOT grant tare-conversion coins on vegetable discard', () => {
      const veg = makeVegetablePart();
      const state = makeGameState({
        skills: ['tare-conversion'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part: veg, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.coins).toBe(0);
    });
  });

  describe('coin awards: char-bonus', () => {
    it('grants CHAR_BONUS_COINS additionally when discarding burnt meat with char-bonus skill', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['char-bonus'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'burnt' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.coins).toBeGreaterThanOrEqual(CHAR_BONUS_COINS);
    });

    it('stacks char-bonus on top of tare-conversion for burnt meat', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['tare-conversion', 'char-bonus'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'burnt' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      expect(result.coins).toBeGreaterThanOrEqual(TARE_CONVERSION_COINS + CHAR_BONUS_COINS);
    });

    it('does NOT grant char-bonus on non-burnt meat', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        skills: ['char-bonus'],
        coins: 0,
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = discardMeat(state, 0);
      // char-bonus only for burnt; no tare-conversion either → 0 coins
      expect(result.coins).toBe(0);
    });
  });

  describe('moveTableToGrill is called after discarding', () => {
    it('moves a dish from the table to the freed slot', () => {
      const part = makeMeatPart();
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'medium' }),
          makeGrillSlot({ id: 1, part: makeMeatPart({ id: 'beef-tongue' }), state: 'rare' }),
          makeGrillSlot({ id: 2, part: makeMeatPart({ id: 'loin' }), state: 'raw' }),
        ],
        table: [tableItem],
      });
      const result = discardMeat(state, 0);
      expect(result.grill[0]!.part).not.toBeNull();
      expect(result.table.length).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// serveDish
// ---------------------------------------------------------------------------

describe('serveDish', () => {
  describe('empty serving queue', () => {
    it('returns state unchanged when serving queue is empty', () => {
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [] }),
      });
      const result = serveDish(state);
      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('does not mutate input state', () => {
      const part = makeMeatPart();
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [part] }),
      });
      Object.freeze(state);
      expect(() => serveDish(state)).not.toThrow();
    });
  });

  describe('placing on grill slot', () => {
    it('places dish on the first empty non-disabled grill slot', () => {
      const part = makeMeatPart({ id: 'kalbi' });
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [part] }),
        grill: [
          makeGrillSlot({ id: 0 }), // empty
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = serveDish(state);
      expect(result.grill[0]!.part).toBe(part);
      expect(result.restaurant.servingQueue.length).toBe(0);
    });

    it('skips disabled slots and uses next available slot', () => {
      const part = makeMeatPart({ id: 'kalbi' });
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [part] }),
        grill: [
          makeGrillSlot({ id: 0, disabled: true }), // disabled, skip
          makeGrillSlot({ id: 1 }), // empty → place here
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = serveDish(state);
      expect(result.grill[0]!.part).toBeNull();
      expect(result.grill[1]!.part).toBe(part);
    });
  });

  describe('table overflow when grill is full', () => {
    it('places dish on table when all grill slots are occupied', () => {
      const occupiedPart = makeMeatPart();
      const servedPart = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [servedPart] }),
        grill: [
          makeGrillSlot({ id: 0, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 1, part: occupiedPart, state: 'rare' }),
          makeGrillSlot({ id: 2, part: occupiedPart, state: 'medium' }),
        ],
        table: [],
        tableCapacity: INITIAL_TABLE_CAPACITY,
      });
      const result = serveDish(state);
      expect(result.table.length).toBe(1);
      expect(result.table[0]).toBe(servedPart);
    });

    it('places dish on table when all grill slots are disabled', () => {
      const servedPart = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [servedPart] }),
        grill: [
          makeGrillSlot({ id: 0, disabled: true }),
          makeGrillSlot({ id: 1, disabled: true }),
          makeGrillSlot({ id: 2, disabled: true }),
        ],
        table: [],
        tableCapacity: INITIAL_TABLE_CAPACITY,
      });
      const result = serveDish(state);
      expect(result.table.length).toBe(1);
    });

    it('sets gameOver to table-overflow when table is at capacity', () => {
      const occupiedPart = makeMeatPart();
      const servedPart = makeMeatPart({ id: 'harami' });
      // Fill table to capacity
      const fullTable: Part[] = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => makeMeatPart());
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [servedPart] }),
        grill: [
          makeGrillSlot({ id: 0, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 1, part: occupiedPart, state: 'rare' }),
          makeGrillSlot({ id: 2, part: occupiedPart, state: 'medium' }),
        ],
        table: fullTable,
        tableCapacity: INITIAL_TABLE_CAPACITY,
        actionDisabledTimer: 0,
      });
      const result = serveDish(state);
      expect(result.gameOver).toBe('table-overflow');
    });

    it('does NOT add dish to table when gameOver is triggered', () => {
      const occupiedPart = makeMeatPart();
      const servedPart = makeMeatPart({ id: 'harami' });
      const fullTable: Part[] = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => makeMeatPart());
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [servedPart] }),
        grill: [
          makeGrillSlot({ id: 0, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 1, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 2, part: occupiedPart, state: 'raw' }),
        ],
        table: fullTable,
        tableCapacity: INITIAL_TABLE_CAPACITY,
      });
      const result = serveDish(state);
      expect(result.table.length).toBe(INITIAL_TABLE_CAPACITY);
    });

    it('sets gameOver to raw-paralysis when action is disabled and table overflows', () => {
      const occupiedPart = makeMeatPart();
      const servedPart = makeMeatPart({ id: 'harami' });
      const fullTable: Part[] = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => makeMeatPart());
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [servedPart] }),
        grill: [
          makeGrillSlot({ id: 0, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 1, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 2, part: occupiedPart, state: 'raw' }),
        ],
        table: fullTable,
        tableCapacity: INITIAL_TABLE_CAPACITY,
        actionDisabledTimer: 2, // action is disabled → raw-paralysis takes precedence
      });
      const result = serveDish(state);
      expect(result.gameOver).toBe('raw-paralysis');
    });
  });

  describe('table capacity with table-extension skill', () => {
    it('uses increased tableCapacity with table-extension', () => {
      const occupiedPart = makeMeatPart();
      const servedPart = makeMeatPart({ id: 'harami' });
      // tableCapacity is INITIAL_TABLE_CAPACITY + TABLE_EXTENSION_COUNT when skill is held
      const extendedCapacity = INITIAL_TABLE_CAPACITY + TABLE_EXTENSION_COUNT;
      // Fill table to original capacity (but not extended capacity)
      const partialTable: Part[] = Array.from({ length: INITIAL_TABLE_CAPACITY }, () => makeMeatPart());
      const state = makeGameState({
        skills: ['table-extension'],
        restaurant: makeRestaurant({ servingQueue: [servedPart] }),
        grill: [
          makeGrillSlot({ id: 0, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 1, part: occupiedPart, state: 'raw' }),
          makeGrillSlot({ id: 2, part: occupiedPart, state: 'raw' }),
        ],
        table: partialTable,
        tableCapacity: extendedCapacity,
      });
      const result = serveDish(state);
      // Should NOT be game over — table has room under extended capacity
      expect(result.gameOver).toBeNull();
      expect(result.table.length).toBe(INITIAL_TABLE_CAPACITY + 1);
    });
  });

  describe('dequeues from serving queue correctly', () => {
    it('dequeues the first dish (FIFO) from the serving queue', () => {
      const part1 = makeMeatPart({ id: 'kalbi' });
      const part2 = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [part1, part2] }),
        grill: [
          makeGrillSlot({ id: 0 }),
          makeGrillSlot({ id: 1 }),
          makeGrillSlot({ id: 2 }),
        ],
      });
      const result = serveDish(state);
      // First in queue (kalbi) should be served, harami stays in queue
      expect(result.grill[0]!.part?.id).toBe('kalbi');
      expect(result.restaurant.servingQueue.length).toBe(1);
      expect(result.restaurant.servingQueue[0]?.id).toBe('harami');
    });
  });
});

// ---------------------------------------------------------------------------
// moveTableToGrill
// ---------------------------------------------------------------------------

describe('moveTableToGrill', () => {
  describe('no-op cases', () => {
    it('returns state unchanged when table is empty', () => {
      const state = makeGameState({
        grill: [makeGrillSlot({ id: 0 }), makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        table: [],
      });
      const result = moveTableToGrill(state);
      expect(result).toBe(state);
    });

    it('returns state unchanged when all grill slots are occupied', () => {
      const part = makeMeatPart();
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, part, state: 'raw' }),
          makeGrillSlot({ id: 1, part, state: 'raw' }),
          makeGrillSlot({ id: 2, part, state: 'raw' }),
        ],
        table: [tableItem],
      });
      const result = moveTableToGrill(state);
      expect(result).toBe(state);
    });

    it('returns state unchanged when all empty slots are disabled', () => {
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, disabled: true }),
          makeGrillSlot({ id: 1, disabled: true }),
          makeGrillSlot({ id: 2, disabled: true }),
        ],
        table: [tableItem],
      });
      const result = moveTableToGrill(state);
      expect(result).toBe(state);
    });
  });

  describe('immutability', () => {
    it('does not mutate input state', () => {
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [makeGrillSlot({ id: 0 }), makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        table: [tableItem],
      });
      Object.freeze(state);
      expect(() => moveTableToGrill(state)).not.toThrow();
    });
  });

  describe('FIFO dequeue from table', () => {
    it('places the first table item onto the lowest-index empty slot', () => {
      const first: Part = makeMeatPart({ id: 'kalbi' });
      const second: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [makeGrillSlot({ id: 0 }), makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        table: [first, second],
      });
      const result = moveTableToGrill(state);
      // First item on table goes to slot 0, second to slot 1
      expect(result.grill[0]!.part).toBe(first);
      expect(result.grill[1]!.part).toBe(second);
      expect(result.table.length).toBe(0);
    });

    it('places only as many items as there are empty slots', () => {
      const part = makeMeatPart();
      const items: Part[] = [
        makeMeatPart({ id: 'kalbi' }),
        makeMeatPart({ id: 'harami' }),
        makeMeatPart({ id: 'beef-tongue' }),
      ];
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0 }), // empty
          makeGrillSlot({ id: 1, part, state: 'raw' }), // occupied
          makeGrillSlot({ id: 2 }), // empty
        ],
        table: items,
      });
      const result = moveTableToGrill(state);
      // Only 2 empty slots → only 2 items moved
      expect(result.grill[0]!.part?.id).toBe('kalbi');
      expect(result.grill[1]!.part).not.toBeNull(); // still occupied by original
      expect(result.grill[2]!.part?.id).toBe('harami');
      expect(result.table.length).toBe(1); // one item remains
    });

    it('skips disabled slots when placing from table', () => {
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        grill: [
          makeGrillSlot({ id: 0, disabled: true }), // disabled, skip
          makeGrillSlot({ id: 1 }), // empty → place here
          makeGrillSlot({ id: 2 }),
        ],
        table: [tableItem],
      });
      const result = moveTableToGrill(state);
      expect(result.grill[0]!.part).toBeNull(); // disabled, unchanged
      expect(result.grill[1]!.part).toBe(tableItem);
      expect(result.table.length).toBe(0);
    });
  });

  describe('does not trigger further restaurant serving', () => {
    it('does not modify the restaurant servingQueue', () => {
      const queueItem = makeMeatPart({ id: 'loin' });
      const tableItem: Part = makeMeatPart({ id: 'harami' });
      const state = makeGameState({
        restaurant: makeRestaurant({ servingQueue: [queueItem] }),
        grill: [makeGrillSlot({ id: 0 }), makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
        table: [tableItem],
      });
      const result = moveTableToGrill(state);
      // servingQueue should remain unchanged
      expect(result.restaurant.servingQueue.length).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Invariant checks
// ---------------------------------------------------------------------------

describe('invariants', () => {
  it('timeInState is always >= 0 after advanceGrilling', () => {
    const slot = makeGrillSlot({
      part: makeMeatPart({ grillTime: GRILL_TIME.SHORT, flareRisk: 1.0 }),
      state: 'raw',
      timeInState: 0,
    });
    const result = advanceGrilling(slot, 5, [], 1, alwaysTrigger);
    expect(result.timeInState).toBeGreaterThanOrEqual(0);
  });

  it('timeInState is always >= 0 after flipMeat (clamped)', () => {
    const slot = makeGrillSlot({
      part: makeMeatPart({ grillTime: GRILL_TIME.MEDIUM }),
      state: 'raw',
      timeInState: 0, // 0 - 2.5 would be negative → clamped to 0
    });
    const result = flipMeat(slot);
    expect(result.timeInState).toBeGreaterThanOrEqual(0);
  });

  it('burnt state is never exited by advanceGrilling regardless of time', () => {
    const slot = makeGrillSlot({
      part: makeMeatPart(),
      state: 'burnt',
      timeInState: 0,
    });
    const result = advanceGrilling(slot, 1000, [], 10, alwaysTrigger);
    expect(result.state).toBe('burnt');
  });

  it('no state fields are undefined on a returned GrillSlot from advanceGrilling', () => {
    const slot = makeGrillSlot({
      part: makeMeatPart(),
      state: 'raw',
      timeInState: 0,
    });
    const result = advanceGrilling(slot, 1, [], 1, neverTrigger);
    expect(result.id).toBeDefined();
    expect(result.part).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.timeInState).toBeDefined();
    expect(result.fireTimer).toBeDefined();
    expect(result.disabled).toBeDefined();
    expect(result.disabledTimer).toBeDefined();
  });

  it('SWEET_SPOT_REDUCTION_PER_CYCLE constant is 0.3', () => {
    expect(SWEET_SPOT_REDUCTION_PER_CYCLE).toBe(0.3);
  });

  it('FLIP_TIMER_RESET_FRACTION constant is 0.5', () => {
    expect(FLIP_TIMER_RESET_FRACTION).toBe(0.5);
  });

  it('HEAT_SENSOR_WARNING_SECONDS constant is 2', () => {
    expect(HEAT_SENSOR_WARNING_SECONDS).toBe(2);
  });
});

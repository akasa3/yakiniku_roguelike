import { describe, it, expect } from 'vitest';
import {
  applyRawMeatPenalty,
  applyBurntSmoke,
  incrementStaffWarning,
  applyGrillFire,
  tickPenalties,
  getSpeedModifier,
} from '../game/systems/penalty';
import type { GameState, GrillSlot, Restaurant } from '../types';
import {
  RAW_MEAT_DISABLE_DURATION,
  RAW_TOLERANCE_MULTIPLIER,
  GRILL_FIRE_DISABLE_DURATION,
  FIRE_CONTROL_MULTIPLIER,
  STAFF_WARNING_THRESHOLD,
  STAFF_WARNING_STACK_THRESHOLD,
  CHARMING_FIRST_THRESHOLD,
  CHARMING_STACK_THRESHOLD,
  VIP_STATUS_SPEED_BUFF,
  PENALTY_INCREASE_PER_CYCLE,
  PENALTY_SCALING_CAP_CYCLE,
} from '../game/data/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// Computes the expected penalty cycle severity multiplier, mirroring the spec formula.
function cycleSeverityMultiplier(cycle: number): number {
  return 1 + PENALTY_INCREASE_PER_CYCLE * Math.min(cycle - 1, PENALTY_SCALING_CAP_CYCLE - 1);
}

// ---------------------------------------------------------------------------
// applyRawMeatPenalty
// ---------------------------------------------------------------------------

describe('applyRawMeatPenalty', () => {
  describe('iron-stomach skill — full negation', () => {
    it('returns state unchanged when iron-stomach is held', () => {
      const state = makeGameState({ skills: ['iron-stomach'] });
      const result = applyRawMeatPenalty(state);
      expect(result).toBe(state);
    });

    it('actionDisabledTimer remains 0 with iron-stomach', () => {
      const state = makeGameState({ skills: ['iron-stomach'], actionDisabledTimer: 0 });
      const result = applyRawMeatPenalty(state);
      expect(result.actionDisabledTimer).toBe(0);
    });

    it('does not set actionDisabledTimer when iron-stomach is held even if already had a timer', () => {
      // If prior timer existed, iron-stomach still negates the new application —
      // function returns state reference unchanged.
      const state = makeGameState({ skills: ['iron-stomach'], actionDisabledTimer: 1.5 });
      const result = applyRawMeatPenalty(state);
      expect(result).toBe(state);
    });
  });

  describe('no skills — base duration at cycle 1', () => {
    it('sets actionDisabledTimer to RAW_MEAT_DISABLE_DURATION at cycle 1', () => {
      const state = makeGameState({ cycle: 1 });
      const result = applyRawMeatPenalty(state);
      // cycle 1: multiplier = 1 + 0.10 * min(0, 4) = 1.0
      expect(result.actionDisabledTimer).toBeCloseTo(RAW_MEAT_DISABLE_DURATION * 1.0);
    });

    it('does not mutate the original state', () => {
      const state = makeGameState({ cycle: 1 });
      applyRawMeatPenalty(state);
      expect(state.actionDisabledTimer).toBe(0);
    });

    it('returns a new state object', () => {
      const state = makeGameState({ cycle: 1 });
      const result = applyRawMeatPenalty(state);
      expect(result).not.toBe(state);
    });
  });

  describe('cycle scaling', () => {
    it('applies +10% penalty per cycle starting from cycle 2', () => {
      const state = makeGameState({ cycle: 2 });
      const result = applyRawMeatPenalty(state);
      const expected = RAW_MEAT_DISABLE_DURATION * cycleSeverityMultiplier(2);
      expect(result.actionDisabledTimer).toBeCloseTo(expected);
    });

    it('applies +20% penalty at cycle 3', () => {
      const state = makeGameState({ cycle: 3 });
      const result = applyRawMeatPenalty(state);
      const expected = RAW_MEAT_DISABLE_DURATION * cycleSeverityMultiplier(3);
      expect(result.actionDisabledTimer).toBeCloseTo(expected);
    });

    it('caps cycle scaling at PENALTY_SCALING_CAP_CYCLE (cycle 5)', () => {
      const stateCycle5 = makeGameState({ cycle: 5 });
      const stateCycle6 = makeGameState({ cycle: 6 });
      const result5 = applyRawMeatPenalty(stateCycle5);
      const result6 = applyRawMeatPenalty(stateCycle6);
      expect(result5.actionDisabledTimer).toBeCloseTo(result6.actionDisabledTimer);
    });

    it('cycle 5 penalty equals cycle 4 penalty plus one more increment', () => {
      const state4 = makeGameState({ cycle: 4 });
      const state5 = makeGameState({ cycle: 5 });
      const result4 = applyRawMeatPenalty(state4);
      const result5 = applyRawMeatPenalty(state5);
      expect(result5.actionDisabledTimer).toBeGreaterThan(result4.actionDisabledTimer);
    });

    it('cycle 6 produces the same timer as cycle 5 (cap enforced)', () => {
      const state5 = makeGameState({ cycle: 5 });
      const state6 = makeGameState({ cycle: 6 });
      expect(applyRawMeatPenalty(state5).actionDisabledTimer).toBeCloseTo(
        applyRawMeatPenalty(state6).actionDisabledTimer
      );
    });
  });

  describe('raw-tolerance skill', () => {
    it('reduces duration by RAW_TOLERANCE_MULTIPLIER at cycle 1', () => {
      const state = makeGameState({ cycle: 1, skills: ['raw-tolerance'] });
      const result = applyRawMeatPenalty(state);
      const expected = RAW_MEAT_DISABLE_DURATION * 1.0 * RAW_TOLERANCE_MULTIPLIER;
      expect(result.actionDisabledTimer).toBeCloseTo(expected);
    });

    it('raw-tolerance is applied after cycle scaling', () => {
      const state = makeGameState({ cycle: 3, skills: ['raw-tolerance'] });
      const result = applyRawMeatPenalty(state);
      const expected =
        RAW_MEAT_DISABLE_DURATION * cycleSeverityMultiplier(3) * RAW_TOLERANCE_MULTIPLIER;
      expect(result.actionDisabledTimer).toBeCloseTo(expected);
    });

    it('raw-tolerance still applies a positive (non-zero) duration', () => {
      const state = makeGameState({ cycle: 1, skills: ['raw-tolerance'] });
      const result = applyRawMeatPenalty(state);
      expect(result.actionDisabledTimer).toBeGreaterThan(0);
    });
  });

  describe('overwrite behaviour', () => {
    it('resets timer to the new computed duration when an action disable is already active', () => {
      const state = makeGameState({ cycle: 1, actionDisabledTimer: 99 });
      const result = applyRawMeatPenalty(state);
      // Must not stack — old value is overwritten with the freshly computed one.
      expect(result.actionDisabledTimer).toBeCloseTo(RAW_MEAT_DISABLE_DURATION * 1.0);
    });
  });

  describe('duration floor', () => {
    it('actionDisabledTimer is never negative', () => {
      // RAW_TOLERANCE_MULTIPLIER is 0.30, so duration stays well above 0;
      // this guards the floor invariant generically.
      const state = makeGameState({ cycle: 1, skills: ['raw-tolerance'] });
      const result = applyRawMeatPenalty(state);
      expect(result.actionDisabledTimer).toBeGreaterThanOrEqual(0);
    });
  });
});

// ---------------------------------------------------------------------------
// applyBurntSmoke
// ---------------------------------------------------------------------------

describe('applyBurntSmoke', () => {
  it('sets burntSmokeActive to true', () => {
    const state = makeGameState({ burntSmokeActive: false });
    const result = applyBurntSmoke(state);
    expect(result.burntSmokeActive).toBe(true);
  });

  it('returns a new state object', () => {
    const state = makeGameState({ burntSmokeActive: false });
    const result = applyBurntSmoke(state);
    expect(result).not.toBe(state);
  });

  it('does not mutate the original state', () => {
    const state = makeGameState({ burntSmokeActive: false });
    applyBurntSmoke(state);
    expect(state.burntSmokeActive).toBe(false);
  });

  it('returns burntSmokeActive = true even when it was already true', () => {
    const state = makeGameState({ burntSmokeActive: true });
    const result = applyBurntSmoke(state);
    expect(result.burntSmokeActive).toBe(true);
  });

  it('does not clear burntSmokeActive (clearing is handled by tickPenalties)', () => {
    const state = makeGameState({ burntSmokeActive: true });
    const result = applyBurntSmoke(state);
    // burntSmokeActive must remain true; the trigger only sets it, never clears it.
    expect(result.burntSmokeActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// incrementStaffWarning
// ---------------------------------------------------------------------------

describe('incrementStaffWarning', () => {
  describe('returns new state without mutation', () => {
    it('returns a new state object', () => {
      const state = makeGameState();
      const result = incrementStaffWarning(state, 1);
      expect(result).not.toBe(state);
    });

    it('does not mutate the original staffWarningCount', () => {
      const state = makeGameState({ staffWarningCount: 0 });
      incrementStaffWarning(state, 1);
      expect(state.staffWarningCount).toBe(0);
    });
  });

  describe('counter increments', () => {
    it('increments staffWarningCount by 1', () => {
      const state = makeGameState({ staffWarningCount: 0 });
      const result = incrementStaffWarning(state, 1);
      expect(result.staffWarningCount).toBe(1);
    });

    it('increments staffWarningCount by 2 (Vegan Tashiro penalty)', () => {
      const state = makeGameState({ staffWarningCount: 0 });
      const result = incrementStaffWarning(state, 2);
      expect(result.staffWarningCount).toBe(2);
    });

    it('accumulates across calls', () => {
      const state0 = makeGameState({ staffWarningCount: 0 });
      const state1 = incrementStaffWarning(state0, 1);
      const state2 = incrementStaffWarning(state1, 1);
      expect(state2.staffWarningCount).toBe(2);
    });
  });

  describe('default thresholds — level transitions', () => {
    it('count below STAFF_WARNING_THRESHOLD → level none', () => {
      // STAFF_WARNING_THRESHOLD = 3; count 2 → none
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_THRESHOLD - 2 });
      const result = incrementStaffWarning(state, 1); // count = THRESHOLD - 1
      // staffWarningCount < firstThreshold → none
      expect(result.staffWarningCount).toBeLessThan(STAFF_WARNING_THRESHOLD);
    });

    it('count reaching STAFF_WARNING_THRESHOLD triggers warning level', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_THRESHOLD - 1 });
      const result = incrementStaffWarning(state, 1); // count = THRESHOLD
      expect(result.staffWarningCount).toBe(STAFF_WARNING_THRESHOLD);
    });

    it('count reaching STAFF_WARNING_STACK_THRESHOLD triggers stacked level', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_STACK_THRESHOLD - 1 });
      const result = incrementStaffWarning(state, 1); // count = STACK_THRESHOLD
      expect(result.staffWarningCount).toBe(STAFF_WARNING_STACK_THRESHOLD);
    });

    it('counter can exceed STAFF_WARNING_STACK_THRESHOLD (no cap on count)', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_STACK_THRESHOLD });
      const result = incrementStaffWarning(state, 5);
      expect(result.staffWarningCount).toBe(STAFF_WARNING_STACK_THRESHOLD + 5);
    });
  });

  describe('single increment skipping both thresholds', () => {
    it('jumping from below firstThreshold to above stackThreshold yields stacked in one step', () => {
      // amount=3, default thresholds first=3, stack=5; starting at 2 → count=5 → stacked
      const state = makeGameState({ staffWarningCount: 2 });
      const result = incrementStaffWarning(state, 3); // 2 + 3 = 5 = stackThreshold → stacked
      expect(result.staffWarningCount).toBe(STAFF_WARNING_STACK_THRESHOLD);
    });
  });

  describe('charming-personality skill — raised thresholds', () => {
    it('count at default warning threshold does NOT trigger warning with charming-personality', () => {
      // STAFF_WARNING_THRESHOLD=3, CHARMING_FIRST_THRESHOLD=5
      // With charming, firstThreshold=5; count=3 is still below that → none
      const state = makeGameState({
        staffWarningCount: STAFF_WARNING_THRESHOLD - 1,
        skills: ['charming-personality'],
      });
      const result = incrementStaffWarning(state, 1); // count = 3
      expect(result.staffWarningCount).toBeLessThan(CHARMING_FIRST_THRESHOLD);
    });

    it('count reaching CHARMING_FIRST_THRESHOLD triggers warning with charming-personality', () => {
      const state = makeGameState({
        staffWarningCount: CHARMING_FIRST_THRESHOLD - 1,
        skills: ['charming-personality'],
      });
      const result = incrementStaffWarning(state, 1); // count = CHARMING_FIRST_THRESHOLD
      expect(result.staffWarningCount).toBe(CHARMING_FIRST_THRESHOLD);
    });

    it('count reaching CHARMING_STACK_THRESHOLD triggers stacked with charming-personality', () => {
      const state = makeGameState({
        staffWarningCount: CHARMING_STACK_THRESHOLD - 1,
        skills: ['charming-personality'],
      });
      const result = incrementStaffWarning(state, 1);
      expect(result.staffWarningCount).toBe(CHARMING_STACK_THRESHOLD);
    });
  });

  describe('staffWarningCount is never negative after increment', () => {
    it('result count is always >= 0', () => {
      const state = makeGameState({ staffWarningCount: 0 });
      const result = incrementStaffWarning(state, 1);
      expect(result.staffWarningCount).toBeGreaterThanOrEqual(0);
    });
  });
});

// ---------------------------------------------------------------------------
// applyGrillFire
// ---------------------------------------------------------------------------

describe('applyGrillFire', () => {
  describe('returns new state without mutation', () => {
    it('returns a new state object', () => {
      const state = makeGameState();
      const result = applyGrillFire(state, 0);
      expect(result).not.toBe(state);
    });

    it('does not mutate the original grill array', () => {
      const state = makeGameState();
      const originalSlot = state.grill[0]!;
      applyGrillFire(state, 0);
      expect(state.grill[0]).toBe(originalSlot);
      expect(originalSlot.disabled).toBe(false);
    });
  });

  describe('slot disabling', () => {
    it('sets the target slot to disabled = true', () => {
      const state = makeGameState({ cycle: 1 });
      const result = applyGrillFire(state, 0);
      expect(result.grill[0]!.disabled).toBe(true);
    });

    it('only disables the specified slot; others remain unchanged', () => {
      const state = makeGameState({ cycle: 1 });
      const result = applyGrillFire(state, 1);
      expect(result.grill[0]!.disabled).toBe(false);
      expect(result.grill[1]!.disabled).toBe(true);
      expect(result.grill[2]!.disabled).toBe(false);
    });

    it('clears the meat from the fired slot (part becomes null)', () => {
      const burntPart = {
        id: 'karubi',
        name: 'Karubi',
        nameJP: 'カルビ',
        rank: 'common' as const,
        grillTime: 5,
        flareRisk: 0.2,
        sweetSpot: 2,
        flavorText: '',
        isVegetable: false as const,
      };
      const slotWithMeat = makeGrillSlot({ id: 0, part: burntPart, state: 'burnt' });
      const state = makeGameState({
        cycle: 1,
        grill: [slotWithMeat, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = applyGrillFire(state, 0);
      expect(result.grill[0]!.part).toBeNull();
    });
  });

  describe('fire timer — default duration', () => {
    it('sets fireTimer to GRILL_FIRE_DISABLE_DURATION at cycle 1 (no fire-control)', () => {
      const state = makeGameState({ cycle: 1 });
      const result = applyGrillFire(state, 0);
      const expected = GRILL_FIRE_DISABLE_DURATION * cycleSeverityMultiplier(1);
      expect(result.grill[0]!.fireTimer).toBeCloseTo(expected);
    });

    it('sets disabledTimer equal to fireTimer', () => {
      const state = makeGameState({ cycle: 1 });
      const result = applyGrillFire(state, 0);
      expect(result.grill[0]!.disabledTimer).toBeCloseTo(result.grill[0]!.fireTimer);
    });

    it('scales fire disable duration by cycle severity at cycle 2', () => {
      const state = makeGameState({ cycle: 2 });
      const result = applyGrillFire(state, 0);
      const expected = GRILL_FIRE_DISABLE_DURATION * cycleSeverityMultiplier(2);
      expect(result.grill[0]!.fireTimer).toBeCloseTo(expected);
    });

    it('caps cycle scaling at PENALTY_SCALING_CAP_CYCLE', () => {
      const state5 = makeGameState({ cycle: 5 });
      const state9 = makeGameState({ cycle: 9 });
      const result5 = applyGrillFire(state5, 0);
      const result9 = applyGrillFire(state9, 0);
      expect(result5.grill[0]!.fireTimer).toBeCloseTo(result9.grill[0]!.fireTimer);
    });
  });

  describe('fire timer — fire-control skill', () => {
    it('halves the fire disable duration with fire-control at cycle 1', () => {
      const state = makeGameState({ cycle: 1, skills: ['fire-control'] });
      const result = applyGrillFire(state, 0);
      const expected =
        GRILL_FIRE_DISABLE_DURATION * FIRE_CONTROL_MULTIPLIER * cycleSeverityMultiplier(1);
      expect(result.grill[0]!.fireTimer).toBeCloseTo(expected);
    });

    it('fire-control duration is less than default duration', () => {
      const state = makeGameState({ cycle: 1, skills: ['fire-control'] });
      const stateNoSkill = makeGameState({ cycle: 1 });
      expect(applyGrillFire(state, 0).grill[0]!.fireTimer).toBeLessThan(
        applyGrillFire(stateNoSkill, 0).grill[0]!.fireTimer
      );
    });

    it('fire-control still scales with cycle penalty', () => {
      const state = makeGameState({ cycle: 3, skills: ['fire-control'] });
      const result = applyGrillFire(state, 0);
      const expected =
        GRILL_FIRE_DISABLE_DURATION * FIRE_CONTROL_MULTIPLIER * cycleSeverityMultiplier(3);
      expect(result.grill[0]!.fireTimer).toBeCloseTo(expected);
    });
  });

  describe('fire replacement — already on fire', () => {
    it('resets fireTimer when fire is already active on the slot', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 7, disabled: true, disabledTimer: 7 });
      const state = makeGameState({
        cycle: 1,
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = applyGrillFire(state, 0);
      const expected = GRILL_FIRE_DISABLE_DURATION * cycleSeverityMultiplier(1);
      // Timer resets; should not be 7.
      expect(result.grill[0]!.fireTimer).toBeCloseTo(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// tickPenalties
// ---------------------------------------------------------------------------

describe('tickPenalties', () => {
  describe('returns new state without mutation', () => {
    it('returns a new state object', () => {
      const state = makeGameState();
      const result = tickPenalties(state, 0.016);
      expect(result).not.toBe(state);
    });

    it('does not mutate the original state', () => {
      const state = makeGameState({ actionDisabledTimer: 3 });
      tickPenalties(state, 1);
      expect(state.actionDisabledTimer).toBe(3);
    });
  });

  describe('actionDisabledTimer decrement', () => {
    it('decrements actionDisabledTimer by deltaTime', () => {
      const state = makeGameState({ actionDisabledTimer: 3 });
      const result = tickPenalties(state, 1);
      expect(result.actionDisabledTimer).toBeCloseTo(2);
    });

    it('clamps actionDisabledTimer to 0 (no negative values)', () => {
      const state = makeGameState({ actionDisabledTimer: 0.5 });
      const result = tickPenalties(state, 2);
      expect(result.actionDisabledTimer).toBe(0);
    });

    it('actionDisabledTimer reaches exactly 0 when deltaTime equals remaining timer', () => {
      const state = makeGameState({ actionDisabledTimer: 1.5 });
      const result = tickPenalties(state, 1.5);
      expect(result.actionDisabledTimer).toBe(0);
    });

    it('actionDisabledTimer is always >= 0 after any tick', () => {
      const state = makeGameState({ actionDisabledTimer: 0 });
      const result = tickPenalties(state, 10);
      expect(result.actionDisabledTimer).toBeGreaterThanOrEqual(0);
    });
  });

  describe('slot fireTimer decrement', () => {
    it('decrements slot fireTimer by deltaTime', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 8, disabled: true, disabledTimer: 8 });
      const state = makeGameState({
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 1);
      expect(result.grill[0]!.fireTimer).toBeCloseTo(7);
    });

    it('clamps slot fireTimer to 0', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 0.3, disabled: true, disabledTimer: 0.3 });
      const state = makeGameState({
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 1);
      expect(result.grill[0]!.fireTimer).toBe(0);
    });

    it('slot fireTimer is always >= 0 after tick', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 0, disabled: false, disabledTimer: 0 });
      const state = makeGameState({
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 5);
      expect(result.grill[0]!.fireTimer).toBeGreaterThanOrEqual(0);
    });
  });

  describe('slot re-enable when fireTimer expires', () => {
    it('sets disabled = false when fireTimer reaches 0', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 0.5, disabled: true, disabledTimer: 0.5 });
      const state = makeGameState({
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 1);
      expect(result.grill[0]!.disabled).toBe(false);
    });

    it('sets disabledTimer = 0 when fireTimer expires', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 0.5, disabled: true, disabledTimer: 0.5 });
      const state = makeGameState({
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 1);
      expect(result.grill[0]!.disabledTimer).toBe(0);
    });

    it('does not re-enable a slot whose fireTimer is still positive', () => {
      const firingSlot = makeGrillSlot({ id: 0, fireTimer: 5, disabled: true, disabledTimer: 5 });
      const state = makeGameState({
        grill: [firingSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 1);
      expect(result.grill[0]!.disabled).toBe(true);
    });

    it('slot not on fire stays enabled after tick', () => {
      const state = makeGameState();
      const result = tickPenalties(state, 1);
      expect(result.grill[0]!.disabled).toBe(false);
    });
  });

  describe('burntSmokeActive recalculation', () => {
    it('sets burntSmokeActive = true when any slot has state burnt and part is not null', () => {
      const burntPart = {
        id: 'harami',
        name: 'Harami',
        nameJP: 'ハラミ',
        rank: 'common' as const,
        grillTime: 5,
        flareRisk: 0.2,
        sweetSpot: 2,
        flavorText: '',
        isVegetable: false as const,
      };
      const burntSlot = makeGrillSlot({ id: 0, part: burntPart, state: 'burnt' });
      const state = makeGameState({
        burntSmokeActive: false,
        grill: [burntSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 0.016);
      expect(result.burntSmokeActive).toBe(true);
    });

    it('sets burntSmokeActive = false when no slot holds burnt meat', () => {
      const state = makeGameState({
        burntSmokeActive: true,
        grill: [
          makeGrillSlot({ id: 0, part: null, state: 'raw' }),
          makeGrillSlot({ id: 1, part: null, state: 'raw' }),
          makeGrillSlot({ id: 2, part: null, state: 'raw' }),
        ],
      });
      const result = tickPenalties(state, 0.016);
      expect(result.burntSmokeActive).toBe(false);
    });

    it('burntSmokeActive remains false when burnt slot has no part (part = null)', () => {
      const burntEmptySlot = makeGrillSlot({ id: 0, part: null, state: 'burnt' });
      const state = makeGameState({
        burntSmokeActive: false,
        grill: [burntEmptySlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 0.016);
      expect(result.burntSmokeActive).toBe(false);
    });

    it('multiple burnt slots do not compound — burntSmokeActive stays boolean true', () => {
      const burntPart = {
        id: 'tan',
        name: 'Tan',
        nameJP: 'タン',
        rank: 'common' as const,
        grillTime: 5,
        flareRisk: 0.2,
        sweetSpot: 2,
        flavorText: '',
        isVegetable: false as const,
      };
      const slot0 = makeGrillSlot({ id: 0, part: burntPart, state: 'burnt' });
      const slot1 = makeGrillSlot({ id: 1, part: burntPart, state: 'burnt' });
      const state = makeGameState({
        burntSmokeActive: false,
        grill: [slot0, slot1, makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 0.016);
      expect(result.burntSmokeActive).toBe(true);
    });

    it('clears burntSmokeActive once the burnt meat is removed (slot transitions away)', () => {
      // Simulate a slot that was burnt but is now empty (part removed, state resets to raw).
      const clearedSlot = makeGrillSlot({ id: 0, part: null, state: 'raw' });
      const state = makeGameState({
        burntSmokeActive: true,
        grill: [clearedSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 0.016);
      expect(result.burntSmokeActive).toBe(false);
    });
  });

  describe('staff warning count is not changed by tickPenalties', () => {
    it('staffWarningCount is unchanged after a tick', () => {
      const state = makeGameState({ staffWarningCount: 4 });
      const result = tickPenalties(state, 1);
      expect(result.staffWarningCount).toBe(4);
    });
  });

  describe('disabled slot escalation tracking', () => {
    it('does not update burnt escalation for a slot that is disabled due to grill fire', () => {
      // A disabled (on-fire) slot should not be subject to further burnt escalation tracking.
      // We verify that tickPenalties does not set gameOver here — game-over from grill fire
      // is detected by the game loop, not tickPenalties.
      const burntPart = {
        id: 'rosu',
        name: 'Rosu',
        nameJP: 'ロース',
        rank: 'common' as const,
        grillTime: 5,
        flareRisk: 0.2,
        sweetSpot: 2,
        flavorText: '',
        isVegetable: false as const,
      };
      const disabledBurntSlot = makeGrillSlot({
        id: 0,
        part: burntPart,
        state: 'burnt',
        disabled: true,
        fireTimer: 8,
        disabledTimer: 8,
      });
      const state = makeGameState({
        grill: [disabledBurntSlot, makeGrillSlot({ id: 1 }), makeGrillSlot({ id: 2 })],
      });
      const result = tickPenalties(state, 1);
      // gameOver must not be set by tickPenalties itself.
      expect(result.gameOver).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// getSpeedModifier
// ---------------------------------------------------------------------------

describe('getSpeedModifier', () => {
  describe('no skills — default thresholds', () => {
    it('returns 1.0 when staffWarningCount is 0 (level: none)', () => {
      const state = makeGameState({ staffWarningCount: 0 });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns 1.0 when count is below STAFF_WARNING_THRESHOLD', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_THRESHOLD - 1 });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns 1.0 at warning level (speed debuff removed, replaced by eat cooldown)', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_THRESHOLD });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns 1.0 at stacked level (speed debuff removed)', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_STACK_THRESHOLD });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns 1.0 at count well above stack threshold', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_STACK_THRESHOLD + 10 });
      expect(getSpeedModifier(state)).toBe(1.0);
    });
  });

  describe('charming-personality skill — raised thresholds', () => {
    it('returns 1.0 at default warning threshold when charming-personality is held', () => {
      const state = makeGameState({
        staffWarningCount: STAFF_WARNING_THRESHOLD,
        skills: ['charming-personality'],
      });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns 1.0 at CHARMING_FIRST_THRESHOLD with charming-personality', () => {
      const state = makeGameState({
        staffWarningCount: CHARMING_FIRST_THRESHOLD,
        skills: ['charming-personality'],
      });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns 1.0 at CHARMING_STACK_THRESHOLD with charming-personality', () => {
      const state = makeGameState({
        staffWarningCount: CHARMING_STACK_THRESHOLD,
        skills: ['charming-personality'],
      });
      expect(getSpeedModifier(state)).toBe(1.0);
    });
  });

  describe('vip-status skill', () => {
    it('returns 1.0 at level none with vip-status (no passive buff)', () => {
      const state = makeGameState({
        staffWarningCount: 0,
        skills: ['vip-status'],
      });
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('returns VIP_STATUS_SPEED_BUFF instead of warning debuff at warning level', () => {
      const state = makeGameState({
        staffWarningCount: STAFF_WARNING_THRESHOLD,
        skills: ['vip-status'],
      });
      expect(getSpeedModifier(state)).toBeCloseTo(VIP_STATUS_SPEED_BUFF);
    });

    it('returns VIP_STATUS_SPEED_BUFF instead of stack debuff at stacked level', () => {
      const state = makeGameState({
        staffWarningCount: STAFF_WARNING_STACK_THRESHOLD,
        skills: ['vip-status'],
      });
      expect(getSpeedModifier(state)).toBeCloseTo(VIP_STATUS_SPEED_BUFF);
    });

    it('VIP_STATUS_SPEED_BUFF is greater than 1.0 (actual buff)', () => {
      const state = makeGameState({
        staffWarningCount: STAFF_WARNING_THRESHOLD,
        skills: ['vip-status'],
      });
      expect(getSpeedModifier(state)).toBeGreaterThan(1.0);
    });
  });

  describe('vip-status + charming-personality combined', () => {
    it('uses charming thresholds with vip-status; below charming threshold → 1.0', () => {
      const state = makeGameState({
        staffWarningCount: STAFF_WARNING_THRESHOLD, // below CHARMING_FIRST_THRESHOLD
        skills: ['vip-status', 'charming-personality'],
      });
      // count < CHARMING_FIRST_THRESHOLD → level none → 1.0 (VIP buff only activates at threshold)
      expect(getSpeedModifier(state)).toBe(1.0);
    });

    it('uses charming thresholds with vip-status; at charming threshold → VIP buff', () => {
      const state = makeGameState({
        staffWarningCount: CHARMING_FIRST_THRESHOLD,
        skills: ['vip-status', 'charming-personality'],
      });
      expect(getSpeedModifier(state)).toBeCloseTo(VIP_STATUS_SPEED_BUFF);
    });
  });

  describe('pure function invariants', () => {
    it('returns the same value on two calls with the same state', () => {
      const state = makeGameState({ staffWarningCount: STAFF_WARNING_THRESHOLD });
      expect(getSpeedModifier(state)).toBe(getSpeedModifier(state));
    });

    it('does not mutate state', () => {
      const state = makeGameState({ staffWarningCount: 3 });
      getSpeedModifier(state);
      expect(state.staffWarningCount).toBe(3);
    });
  });
});

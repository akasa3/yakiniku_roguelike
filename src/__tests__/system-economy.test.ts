import type { GameState, GrillSlot, Restaurant, MeatPart, VegetablePart, GrillingState, RestaurantDefinition } from '../types/index';
import {
  awardRestaurantClearCoins,
  awardEatCoins,
  awardDiscardCoins,
  awardStreakCoins,
  awardSlotEfficiencyCoins,
  awardQuickTurnoverCoins,
  getExchangeCost,
} from '../game/systems/economy';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const BASE_RESTAURANT_DEF: RestaurantDefinition = {
  type: 'chain',
  nameJP: 'テストチェーン',
  totalDishes: 8,
  servingInterval: 8,
  rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
  activePenalties: [],
};

const BASE_RESTAURANT: Restaurant = {
  definition: BASE_RESTAURANT_DEF,
  dishesServed: 8,
  meatDishesEaten: 8,
  totalMeatDishes: 8,
  timeSinceLastServe: 0,
  effectiveServingInterval: 8,
  startTime: 0,
  servingQueue: [],
  isCleared: true,
};

const BASE_GRILL_SLOT: GrillSlot = {
  id: 0,
  part: null,
  state: 'raw',
  timeInState: 0,
  fireTimer: 0,
  disabled: false,
  disabledTimer: 0,
};

function makeMeatPart(overrides: Partial<MeatPart> = {}): MeatPart {
  return {
    id: 'karubi',
    name: 'Karubi',
    nameJP: 'カルビ',
    rank: 'common',
    grillTime: 5,
    flareRisk: 0.05,
    sweetSpot: 2,
    flavorText: 'Juicy and tender.',
    isVegetable: false,
    ...overrides,
  };
}

function makeVegetablePart(overrides: Partial<VegetablePart> = {}): VegetablePart {
  return {
    id: 'corn',
    name: 'Corn',
    nameJP: 'とうもろこし',
    grillTime: 5,
    flareRisk: 0,
    sweetSpot: 3,
    isVegetable: true,
    ...overrides,
  };
}

function makeGrillSlots(count: number, occupied: boolean[] = []): readonly GrillSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    ...BASE_GRILL_SLOT,
    id: i,
    part: occupied[i] === true ? makeMeatPart() : null,
  }));
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    character: 'tanaka',
    cycle: 1,
    restaurantIndexInCycle: 0,
    score: 0,
    highestRestaurantTypeReached: 0,
    restaurant: BASE_RESTAURANT,
    grill: makeGrillSlots(3),
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
    elapsedTime: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// awardRestaurantClearCoins
// ---------------------------------------------------------------------------

describe('awardRestaurantClearCoins', () => {
  it('always awards BASE_RESTAURANT_CLEAR_COINS (10) to coins', () => {
    const state = makeState({ coins: 0 });
    const result = awardRestaurantClearCoins(state);
    expect(result.coins).toBe(10);
  });

  it('adds to existing coin balance', () => {
    const state = makeState({ coins: 5 });
    const result = awardRestaurantClearCoins(state);
    expect(result.coins).toBe(15);
  });

  it('does not modify score', () => {
    const state = makeState({ coins: 0, score: 42 });
    const result = awardRestaurantClearCoins(state);
    expect(result.score).toBe(42);
  });

  it('awards Regular Customer Bonus (5) when skill held and staffWarningCount is 0', () => {
    const state = makeState({
      coins: 0,
      skills: ['regular-customer-bonus'],
      staffWarningCount: 0,
    });
    const result = awardRestaurantClearCoins(state);
    // 10 (base) + 5 (bonus) = 15
    expect(result.coins).toBe(15);
  });

  it('does NOT award Regular Customer Bonus when staffWarningCount > 0', () => {
    const state = makeState({
      coins: 0,
      skills: ['regular-customer-bonus'],
      staffWarningCount: 1,
    });
    const result = awardRestaurantClearCoins(state);
    expect(result.coins).toBe(10);
  });

  it('does NOT award Regular Customer Bonus when skill is not held', () => {
    const state = makeState({
      coins: 0,
      skills: [],
      staffWarningCount: 0,
    });
    const result = awardRestaurantClearCoins(state);
    expect(result.coins).toBe(10);
  });

  it('decrements staffWarningCount by 1 when regular-customer skill is held', () => {
    const state = makeState({
      coins: 0,
      skills: ['regular-customer'],
      staffWarningCount: 3,
    });
    const result = awardRestaurantClearCoins(state);
    expect(result.staffWarningCount).toBe(2);
  });

  it('floors staffWarningCount at 0 when regular-customer is held and count is already 0', () => {
    const state = makeState({
      coins: 0,
      skills: ['regular-customer'],
      staffWarningCount: 0,
    });
    const result = awardRestaurantClearCoins(state);
    expect(result.staffWarningCount).toBe(0);
  });

  it('Regular Customer Bonus fires (count was 0) then Regular Customer decrements (stays at 0)', () => {
    const state = makeState({
      coins: 0,
      skills: ['regular-customer-bonus', 'regular-customer'],
      staffWarningCount: 0,
    });
    const result = awardRestaurantClearCoins(state);
    // bonus fires because count was 0 at clearing time → 10 + 5 = 15
    expect(result.coins).toBe(15);
    // decrement applied after: 0 - 1 floored at 0
    expect(result.staffWarningCount).toBe(0);
  });

  it('Regular Customer Bonus does NOT fire when count is 1 even if regular-customer would decrement it to 0', () => {
    // count is 1 at clearing time → bonus should NOT fire; regular-customer then decrements to 0
    const state = makeState({
      coins: 0,
      skills: ['regular-customer-bonus', 'regular-customer'],
      staffWarningCount: 1,
    });
    const result = awardRestaurantClearCoins(state);
    expect(result.coins).toBe(10); // no bonus
    expect(result.staffWarningCount).toBe(0);
  });

  it('returns a new state object (immutable update)', () => {
    const state = makeState({ coins: 0 });
    const result = awardRestaurantClearCoins(state);
    expect(result).not.toBe(state);
  });
});

// ---------------------------------------------------------------------------
// awardEatCoins
// ---------------------------------------------------------------------------

describe('awardEatCoins', () => {
  describe("Fast Eater's Wage", () => {
    it('awards FAST_EATER_WAGE_COINS (3) when skill held, meatState is rare, and part is not vegetable', () => {
      const state = makeState({ coins: 0, skills: ['fast-eaters-wage'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'rare', meat);
      expect(result.coins).toBe(3);
    });

    it('does NOT award when meatState is medium', () => {
      const state = makeState({ coins: 0, skills: ['fast-eaters-wage'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'medium', meat);
      expect(result.coins).toBe(0);
    });

    it('does NOT award fast-eaters-wage when meatState is well-done (base well-done coins only)', () => {
      const state = makeState({ coins: 0, skills: ['fast-eaters-wage'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'well-done', meat);
      expect(result.coins).toBe(3); // WELL_DONE_BASE_COINS only, no fast-eater wage
    });

    it('does NOT award when meatState is raw', () => {
      const state = makeState({ coins: 0, skills: ['fast-eaters-wage'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'raw', meat);
      expect(result.coins).toBe(0);
    });

    it('does NOT award for vegetable in rare state (skill specifies meat only)', () => {
      const state = makeState({ coins: 0, skills: ['fast-eaters-wage'] });
      const veg = makeVegetablePart();
      const result = awardEatCoins(state, 'rare', veg);
      expect(result.coins).toBe(0);
    });

    it('does NOT award when skill is not held', () => {
      const state = makeState({ coins: 0, skills: [] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'rare', meat);
      expect(result.coins).toBe(0);
    });
  });

  describe('Perfect Grill Bonus', () => {
    it('awards WELL_DONE_BASE_COINS + PERFECT_GRILL_BONUS_COINS (3+3=6) when skill held, meatState is well-done, and part is not vegetable', () => {
      const state = makeState({ coins: 0, skills: ['perfect-grill-bonus'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'well-done', meat);
      expect(result.coins).toBe(6); // 3 base + 3 skill bonus
    });

    it('does NOT award when meatState is rare', () => {
      const state = makeState({ coins: 0, skills: ['perfect-grill-bonus'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'rare', meat);
      expect(result.coins).toBe(0);
    });

    it('does NOT award when meatState is medium', () => {
      const state = makeState({ coins: 0, skills: ['perfect-grill-bonus'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'medium', meat);
      expect(result.coins).toBe(0);
    });

    it('does NOT award when meatState is raw', () => {
      const state = makeState({ coins: 0, skills: ['perfect-grill-bonus'] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'raw', meat);
      expect(result.coins).toBe(0);
    });

    it('does NOT award for vegetable in well-done state (skill specifies meat only)', () => {
      const state = makeState({ coins: 0, skills: ['perfect-grill-bonus'] });
      const veg = makeVegetablePart();
      const result = awardEatCoins(state, 'well-done', veg);
      expect(result.coins).toBe(0);
    });

    it('awards only base well-done coins when skill is not held', () => {
      const state = makeState({ coins: 0, skills: [] });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'well-done', meat);
      expect(result.coins).toBe(3); // WELL_DONE_BASE_COINS only
    });
  });

  describe('Vegan Tashiro vegetable coins', () => {
    it('awards VEGETABLE_COIN_MULTIPLIER (3) when character is vegan-tashiro and part is vegetable', () => {
      const state = makeState({ coins: 0, character: 'vegan-tashiro' });
      const veg = makeVegetablePart();
      const result = awardEatCoins(state, 'well-done', veg);
      expect(result.coins).toBe(3);
    });

    it('awards vegetable coins for vegan-tashiro in any grilling state', () => {
      const vegStates: GrillingState[] = ['raw', 'rare', 'medium', 'well-done'];
      for (const gs of vegStates) {
        const state = makeState({ coins: 0, character: 'vegan-tashiro' });
        const veg = makeVegetablePart();
        const result = awardEatCoins(state, gs, veg);
        expect(result.coins).toBe(3);
      }
    });

    it('does NOT award vegetable coins for non-vegan characters', () => {
      const state = makeState({ coins: 0, character: 'tanaka' });
      const veg = makeVegetablePart();
      const result = awardEatCoins(state, 'well-done', veg);
      expect(result.coins).toBe(0);
    });

    it('does NOT award vegetable coins when vegan-tashiro eats meat (base well-done only)', () => {
      // Vegan Tashiro eating meat earns base well-done coins; no vegetable bonus
      const state = makeState({ coins: 0, character: 'vegan-tashiro' });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'well-done', meat);
      expect(result.coins).toBe(3); // WELL_DONE_BASE_COINS only
    });
  });

  describe('multiple bonuses stacking', () => {
    it('awards Fast Eater Wage (3) when vegan-tashiro eats rare meat — vegetable bonus does not apply to meat', () => {
      const state = makeState({
        coins: 0,
        character: 'vegan-tashiro',
        skills: ['fast-eaters-wage'],
      });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'rare', meat);
      expect(result.coins).toBe(3); // only fast-eaters-wage; no veg bonus for meat
    });

    it('awards only Fast Eater Wage on rare state when both skill bonuses are held', () => {
      const state = makeState({
        coins: 0,
        skills: ['fast-eaters-wage', 'perfect-grill-bonus'],
      });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'rare', meat);
      expect(result.coins).toBe(3); // fast-eaters-wage only
    });

    it('awards base well-done + Perfect Grill Bonus on well-done state when both skill bonuses are held', () => {
      const state = makeState({
        coins: 0,
        skills: ['fast-eaters-wage', 'perfect-grill-bonus'],
      });
      const meat = makeMeatPart();
      const result = awardEatCoins(state, 'well-done', meat);
      expect(result.coins).toBe(6); // 3 base + 3 perfect-grill-bonus
    });
  });

  it('returns a new state object (immutable update)', () => {
    const state = makeState({ coins: 0, skills: ['fast-eaters-wage'] });
    const meat = makeMeatPart();
    const result = awardEatCoins(state, 'rare', meat);
    expect(result).not.toBe(state);
  });

  it('returns state with same coins when no bonuses apply', () => {
    const state = makeState({ coins: 7, skills: [] });
    const meat = makeMeatPart();
    const result = awardEatCoins(state, 'medium', meat);
    expect(result.coins).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// awardDiscardCoins
// ---------------------------------------------------------------------------

describe('awardDiscardCoins', () => {
  describe('Tare Conversion', () => {
    it('awards TARE_CONVERSION_COINS (2) when skill held and part is not vegetable', () => {
      const state = makeState({ coins: 0, skills: ['tare-conversion'] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'medium');
      expect(result.coins).toBe(2);
    });

    it('awards tare-conversion for any non-burnt grilling state', () => {
      const nonBurntStates: GrillingState[] = ['raw', 'rare', 'medium', 'well-done'];
      for (const gs of nonBurntStates) {
        const state = makeState({ coins: 0, skills: ['tare-conversion'] });
        const meat = makeMeatPart();
        const result = awardDiscardCoins(state, meat, gs);
        expect(result.coins).toBe(2);
      }
    });

    it('awards tare-conversion on burnt state (no char-bonus applied without that skill)', () => {
      const state = makeState({ coins: 0, skills: ['tare-conversion'] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'burnt');
      expect(result.coins).toBe(2);
    });

    it('does NOT award when part is vegetable', () => {
      const state = makeState({ coins: 0, skills: ['tare-conversion'] });
      const veg = makeVegetablePart();
      const result = awardDiscardCoins(state, veg, 'medium');
      expect(result.coins).toBe(0);
    });

    it('does NOT award when skill is not held', () => {
      const state = makeState({ coins: 0, skills: [] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'medium');
      expect(result.coins).toBe(0);
    });
  });

  describe('Char Bonus', () => {
    it('awards CHAR_BONUS_COINS (3) when skill held and part is burnt meat', () => {
      const state = makeState({ coins: 0, skills: ['char-bonus'] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'burnt');
      expect(result.coins).toBe(3);
    });

    it('does NOT award char-bonus on non-burnt grilling states', () => {
      const nonBurntStates: GrillingState[] = ['raw', 'rare', 'medium', 'well-done'];
      for (const gs of nonBurntStates) {
        const state = makeState({ coins: 0, skills: ['char-bonus'] });
        const meat = makeMeatPart();
        const result = awardDiscardCoins(state, meat, gs);
        expect(result.coins).toBe(0);
      }
    });

    it('does NOT award char-bonus for burnt vegetable discard', () => {
      const state = makeState({ coins: 0, skills: ['char-bonus'] });
      const veg = makeVegetablePart();
      const result = awardDiscardCoins(state, veg, 'burnt');
      expect(result.coins).toBe(0);
    });

    it('does NOT award when skill is not held', () => {
      const state = makeState({ coins: 0, skills: [] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'burnt');
      expect(result.coins).toBe(0);
    });
  });

  describe('stacking: Tare Conversion + Char Bonus on burnt meat', () => {
    it('awards TARE_CONVERSION_COINS + CHAR_BONUS_COINS (2+3=5) on burnt meat when both held', () => {
      const state = makeState({ coins: 0, skills: ['tare-conversion', 'char-bonus'] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'burnt');
      expect(result.coins).toBe(5);
    });

    it('awards only TARE_CONVERSION_COINS (2) on non-burnt meat when both held', () => {
      const state = makeState({ coins: 0, skills: ['tare-conversion', 'char-bonus'] });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'medium');
      expect(result.coins).toBe(2);
    });

    it('awards nothing when both held and discard is a vegetable', () => {
      const state = makeState({ coins: 0, skills: ['tare-conversion', 'char-bonus'] });
      const veg = makeVegetablePart();
      const result = awardDiscardCoins(state, veg, 'burnt');
      expect(result.coins).toBe(0);
    });
  });

  describe('staffWarningCount invariant — awardDiscardCoins never modifies it', () => {
    it('never modifies staffWarningCount when tare-conversion and char-bonus are held and meat is burnt', () => {
      const initialWarnings = 2;
      const state = makeState({
        coins: 0,
        skills: ['tare-conversion', 'char-bonus'],
        staffWarningCount: initialWarnings,
      });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'burnt');
      expect(result.staffWarningCount).toBe(initialWarnings);
    });

    it('never modifies staffWarningCount for vegetable discards', () => {
      const initialWarnings = 1;
      const state = makeState({
        coins: 0,
        skills: [],
        staffWarningCount: initialWarnings,
      });
      const veg = makeVegetablePart();
      const result = awardDiscardCoins(state, veg, 'well-done');
      expect(result.staffWarningCount).toBe(initialWarnings);
    });

    it('never modifies staffWarningCount even when no skills held', () => {
      const state = makeState({ coins: 0, skills: [], staffWarningCount: 3 });
      const meat = makeMeatPart();
      const result = awardDiscardCoins(state, meat, 'raw');
      expect(result.staffWarningCount).toBe(3);
    });
  });

  it('returns a new state object (immutable update)', () => {
    const state = makeState({ coins: 0, skills: ['tare-conversion'] });
    const meat = makeMeatPart();
    const result = awardDiscardCoins(state, meat, 'medium');
    expect(result).not.toBe(state);
  });

  it('returns state with same coins when no bonuses apply', () => {
    const state = makeState({ coins: 4, skills: [] });
    const meat = makeMeatPart();
    const result = awardDiscardCoins(state, meat, 'burnt');
    expect(result.coins).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// awardStreakCoins
// ---------------------------------------------------------------------------

describe('awardStreakCoins', () => {
  it('awards EATING_STREAK_BONUS_COINS (5) when skill held and consecutiveEatCount is 5 (first threshold)', () => {
    const state = makeState({ coins: 0, skills: ['eating-streak-bonus'], consecutiveEatCount: 5 });
    const result = awardStreakCoins(state);
    expect(result.coins).toBe(5);
  });

  it('awards again at the 10th consecutive eat', () => {
    const state = makeState({ coins: 0, skills: ['eating-streak-bonus'], consecutiveEatCount: 10 });
    const result = awardStreakCoins(state);
    expect(result.coins).toBe(5);
  });

  it('awards again at the 15th consecutive eat', () => {
    const state = makeState({ coins: 0, skills: ['eating-streak-bonus'], consecutiveEatCount: 15 });
    const result = awardStreakCoins(state);
    expect(result.coins).toBe(5);
  });

  it('does NOT award when consecutiveEatCount is NOT a multiple of 5', () => {
    const nonMultiples = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14];
    for (const count of nonMultiples) {
      const state = makeState({ coins: 0, skills: ['eating-streak-bonus'], consecutiveEatCount: count });
      const result = awardStreakCoins(state);
      expect(result.coins).toBe(0);
    }
  });

  it('does NOT award when consecutiveEatCount is 0 (division guard prevents false positive)', () => {
    const state = makeState({ coins: 0, skills: ['eating-streak-bonus'], consecutiveEatCount: 0 });
    const result = awardStreakCoins(state);
    expect(result.coins).toBe(0);
  });

  it('does NOT award when eating-streak-bonus skill is not held', () => {
    const state = makeState({ coins: 0, skills: [], consecutiveEatCount: 5 });
    const result = awardStreakCoins(state);
    expect(result.coins).toBe(0);
  });

  it('returns state with unchanged coins when skill not held', () => {
    const state = makeState({ coins: 7, skills: [], consecutiveEatCount: 10 });
    const result = awardStreakCoins(state);
    expect(result.coins).toBe(7);
  });

  it('returns a new state object (immutable update)', () => {
    const state = makeState({ coins: 0, skills: ['eating-streak-bonus'], consecutiveEatCount: 5 });
    const result = awardStreakCoins(state);
    expect(result).not.toBe(state);
  });
});

// ---------------------------------------------------------------------------
// awardSlotEfficiencyCoins
// ---------------------------------------------------------------------------

describe('awardSlotEfficiencyCoins', () => {
  it('awards SLOT_EFFICIENCY_BONUS_COINS (2) on transition from not-full to full when skill held', () => {
    const occupiedSlots = makeGrillSlots(3, [true, true, true]);
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: occupiedSlots,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(2);
  });

  it('does NOT award when all slots occupied but allSlotsOccupiedLastTick was already true (edge-trigger guard)', () => {
    const occupiedSlots = makeGrillSlots(3, [true, true, true]);
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: occupiedSlots,
      allSlotsOccupiedLastTick: true,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(0);
  });

  it('does NOT award when not all non-disabled slots are occupied', () => {
    const partialSlots = makeGrillSlots(3, [true, false, true]);
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: partialSlots,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(0);
  });

  it('does NOT award when skill is not held', () => {
    const occupiedSlots = makeGrillSlots(3, [true, true, true]);
    const state = makeState({
      coins: 0,
      skills: [],
      grill: occupiedSlots,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(0);
  });

  it('excludes disabled slots from the occupancy check — disabled empty slot does not block the bonus', () => {
    // slots 0 and 1 are active and occupied; slot 2 is disabled (empty is fine)
    const mixedSlots: readonly GrillSlot[] = [
      { ...BASE_GRILL_SLOT, id: 0, part: makeMeatPart(), disabled: false },
      { ...BASE_GRILL_SLOT, id: 1, part: makeMeatPart(), disabled: false },
      { ...BASE_GRILL_SLOT, id: 2, part: null, disabled: true },
    ];
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: mixedSlots,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(2);
  });

  it('scales to new slot count when Extra Slot is acquired — all 5 slots must be occupied', () => {
    const fiveOccupied = makeGrillSlots(5, [true, true, true, true, true]);
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: fiveOccupied,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(2);
  });

  it('does NOT award with 5 slots if only 4 are occupied', () => {
    const fourOccupied = makeGrillSlots(5, [true, true, true, true, false]);
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: fourOccupied,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result.coins).toBe(0);
  });

  it('returns a new state object (immutable update)', () => {
    const occupiedSlots = makeGrillSlots(3, [true, true, true]);
    const state = makeState({
      coins: 0,
      skills: ['slot-efficiency-bonus'],
      grill: occupiedSlots,
      allSlotsOccupiedLastTick: false,
    });
    const result = awardSlotEfficiencyCoins(state);
    expect(result).not.toBe(state);
  });
});

// ---------------------------------------------------------------------------
// awardQuickTurnoverCoins
// ---------------------------------------------------------------------------

describe('awardQuickTurnoverCoins', () => {
  function makeRestaurantWithTiming(meatDishesEaten: number, startTime: number): Restaurant {
    return { ...BASE_RESTAURANT, meatDishesEaten, startTime };
  }

  it('awards QUICK_TURNOVER_BONUS_COINS (5) when skill held and DPM exceeds 2.5', () => {
    // elapsedTime=100, startTime=40 → duration=60s=1min, dishes=4 → DPM=4.0 > 2.5
    const state = makeState({
      coins: 0,
      skills: ['quick-turnover-bonus'],
      restaurant: makeRestaurantWithTiming(4, 40),
      elapsedTime: 100,
    });
    const result = awardQuickTurnoverCoins(state);
    expect(result.coins).toBe(5);
  });

  it('does NOT award when DPM equals the threshold exactly (exclusive: must strictly exceed 2.5)', () => {
    // 5 dishes / (120s / 60) = 5/2 = 2.5 DPM exactly → no bonus
    const state = makeState({
      coins: 0,
      skills: ['quick-turnover-bonus'],
      restaurant: makeRestaurantWithTiming(5, 0),
      elapsedTime: 120,
    });
    const result = awardQuickTurnoverCoins(state);
    expect(result.coins).toBe(0);
  });

  it('does NOT award when DPM is below the threshold', () => {
    // 1 dish / (60s / 60) = 1.0 DPM < 2.5
    const state = makeState({
      coins: 0,
      skills: ['quick-turnover-bonus'],
      restaurant: makeRestaurantWithTiming(1, 40),
      elapsedTime: 100,
    });
    const result = awardQuickTurnoverCoins(state);
    expect(result.coins).toBe(0);
  });

  it('does NOT award when skill is not held even when DPM exceeds threshold', () => {
    const state = makeState({
      coins: 0,
      skills: [],
      restaurant: makeRestaurantWithTiming(4, 40),
      elapsedTime: 100,
    });
    const result = awardQuickTurnoverCoins(state);
    expect(result.coins).toBe(0);
  });

  it('handles degenerate case: durationSeconds <= 0 — DPM clamped to Infinity so bonus always fires', () => {
    // startTime === elapsedTime → duration = 0 → division by zero → clamp to Infinity > 2.5
    const state = makeState({
      coins: 0,
      skills: ['quick-turnover-bonus'],
      restaurant: makeRestaurantWithTiming(1, 100),
      elapsedTime: 100,
    });
    const result = awardQuickTurnoverCoins(state);
    expect(result.coins).toBe(5);
  });

  it('returns a new state object (immutable update)', () => {
    const state = makeState({
      coins: 0,
      skills: ['quick-turnover-bonus'],
      restaurant: makeRestaurantWithTiming(4, 40),
      elapsedTime: 100,
    });
    const result = awardQuickTurnoverCoins(state);
    expect(result).not.toBe(state);
  });
});

// ---------------------------------------------------------------------------
// getExchangeCost
// ---------------------------------------------------------------------------

describe('getExchangeCost', () => {
  it('returns INSTANT_EXCHANGE_BASE_COST (5) when exchange-discount skill is not held', () => {
    const state = makeState({ skills: [] });
    expect(getExchangeCost(state)).toBe(5);
  });

  it('returns Math.floor(5 * 0.70) = 3 when exchange-discount skill is held', () => {
    // floor(5 * 0.70) = floor(3.5) = 3
    const state = makeState({ skills: ['exchange-discount'] });
    expect(getExchangeCost(state)).toBe(3);
  });

  it('discounted cost is strictly less than base cost', () => {
    const withSkill = makeState({ skills: ['exchange-discount'] });
    const withoutSkill = makeState({ skills: [] });
    expect(getExchangeCost(withSkill)).toBeLessThan(getExchangeCost(withoutSkill));
  });

  it('returns a non-negative integer', () => {
    const withSkill = makeState({ skills: ['exchange-discount'] });
    const withoutSkill = makeState({ skills: [] });
    expect(getExchangeCost(withSkill)).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(getExchangeCost(withSkill))).toBe(true);
    expect(getExchangeCost(withoutSkill)).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(getExchangeCost(withoutSkill))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Global invariant: award functions only add coins, never subtract
// ---------------------------------------------------------------------------

describe('coins invariant: award functions only add, never subtract', () => {
  it('awardRestaurantClearCoins never decreases coins', () => {
    const state = makeState({ coins: 100, skills: [] });
    expect(awardRestaurantClearCoins(state).coins).toBeGreaterThanOrEqual(100);
  });

  it('awardEatCoins never decreases coins', () => {
    const state = makeState({ coins: 100, skills: [] });
    const meat = makeMeatPart();
    expect(awardEatCoins(state, 'raw', meat).coins).toBeGreaterThanOrEqual(100);
  });

  it('awardDiscardCoins never decreases coins', () => {
    const state = makeState({ coins: 100, skills: [] });
    const meat = makeMeatPart();
    expect(awardDiscardCoins(state, meat, 'burnt').coins).toBeGreaterThanOrEqual(100);
  });

  it('awardStreakCoins never decreases coins', () => {
    const state = makeState({ coins: 100, skills: [], consecutiveEatCount: 3 });
    expect(awardStreakCoins(state).coins).toBeGreaterThanOrEqual(100);
  });

  it('awardSlotEfficiencyCoins never decreases coins', () => {
    const state = makeState({ coins: 100, skills: [], grill: makeGrillSlots(3) });
    expect(awardSlotEfficiencyCoins(state).coins).toBeGreaterThanOrEqual(100);
  });

  it('awardQuickTurnoverCoins never decreases coins', () => {
    const state = makeState({
      coins: 100,
      skills: [],
      restaurant: { ...BASE_RESTAURANT, meatDishesEaten: 1, startTime: 40 },
      elapsedTime: 100,
    });
    expect(awardQuickTurnoverCoins(state).coins).toBeGreaterThanOrEqual(100);
  });
});

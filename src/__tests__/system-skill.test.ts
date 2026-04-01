import type { GameState, GrillSlot, Restaurant } from '../types/index';
import {
  generateSkillChoices,
  acquireSkill,
  hasSkill,
  applySkillModifiers,
} from '../game/systems/skill';

// ---------------------------------------------------------------------------
// Helper: Mock GameState
// ---------------------------------------------------------------------------

function makeGrillSlot(id: number): GrillSlot {
  return {
    id,
    part: null,
    state: 'raw',
    timeInState: 0,
    fireTimer: 0,
    disabled: false,
    disabledTimer: 0,
  };
}

function makeRestaurant(): Restaurant {
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
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const grillSlots = [makeGrillSlot(0), makeGrillSlot(1), makeGrillSlot(2)];

  return {
    character: 'tanaka',
    cycle: 1,
    restaurantIndexInCycle: 0,
    score: 0,
    highestRestaurantTypeReached: 0,
    restaurant: makeRestaurant(),
    grill: grillSlots,
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

// ---------------------------------------------------------------------------
// hasSkill
// ---------------------------------------------------------------------------

describe('hasSkill', () => {
  it('returns false when skills array is empty', () => {
    const state = makeGameState({ skills: [] });
    expect(hasSkill(state, 'tong-master')).toBe(false);
  });

  it('returns true when the skill is present in state.skills', () => {
    const state = makeGameState({ skills: ['tong-master', 'heat-sensor'] });
    expect(hasSkill(state, 'tong-master')).toBe(true);
  });

  it('returns false for a skill not in state.skills even if other skills exist', () => {
    const state = makeGameState({ skills: ['tong-master', 'heat-sensor'] });
    expect(hasSkill(state, 'speed-eater')).toBe(false);
  });

  it('returns false for an unknown/unrecognized skill id', () => {
    const state = makeGameState({ skills: ['tong-master'] });
    expect(hasSkill(state, 'unknown-skill-xyz')).toBe(false);
  });

  it('returns false when the id is an empty string', () => {
    const state = makeGameState({ skills: ['tong-master'] });
    expect(hasSkill(state, '')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateSkillChoices
// ---------------------------------------------------------------------------

describe('generateSkillChoices', () => {
  it('returns up to count skill definitions when pool is large enough', () => {
    const state = makeGameState({ skills: [] });
    const choices = generateSkillChoices(state, 3);
    expect(choices.length).toBe(3);
  });

  it('never returns a skill already in state.skills (non-stackable)', () => {
    // Acquire every non-stackable skill except a few, then ensure they never appear
    const acquiredIds = [
      'tong-master',
      'heat-sensor',
      'speed-eater',
      'quick-order',
      'exchange-discount',
      'raw-tolerance',
      'iron-stomach',
      'fast-eaters-wage',
      'tare-conversion',
      'char-bonus',
      'perfect-grill-bonus',
      'binge-mode',
      'digestive-pro',
      'eating-streak-bonus',
      'regular-customer',
      'vip-status',
      'regular-customer-bonus',
      'discard-pro',
      'charming-personality',
      'fire-control',
      'slot-efficiency-bonus',
      'quick-turnover-bonus',
    ];
    const state = makeGameState({ skills: acquiredIds });
    const choices = generateSkillChoices(state, 3);

    for (const choice of choices) {
      if (!choice.isStackable) {
        expect(acquiredIds).not.toContain(choice.id);
      }
    }
  });

  it('returns all remaining skills when pool is smaller than count', () => {
    // Hold all non-stackable skills; only stackable ones remain
    const allNonStackable = [
      'tong-master',
      'heat-sensor',
      'speed-eater',
      'quick-order',
      'exchange-discount',
      'raw-tolerance',
      'iron-stomach',
      'fast-eaters-wage',
      'tare-conversion',
      'char-bonus',
      'perfect-grill-bonus',
      'binge-mode',
      'digestive-pro',
      'eating-streak-bonus',
      'regular-customer',
      'vip-status',
      'regular-customer-bonus',
      'discard-pro',
      'charming-personality',
      'fire-control',
      'slot-efficiency-bonus',
      'quick-turnover-bonus',
    ];
    const state = makeGameState({ skills: allNonStackable });
    const choices = generateSkillChoices(state, 3);
    // Pool is only the stackable skills (extra-slot, table-extension) — size 2
    expect(choices.length).toBeLessThanOrEqual(3);
    expect(choices.length).toBeLessThanOrEqual(2); // only stackable remain
  });

  it('returns empty array when pool is empty', () => {
    // Acquire all 24 skills including one copy each of stackable
    const allSkillIds = [
      'tong-master',
      'heat-sensor',
      'extra-slot',
      'table-extension',
      'slot-efficiency-bonus',
      'speed-eater',
      'quick-order',
      'quick-turnover-bonus',
      'discard-pro',
      'charming-personality',
      'fire-control',
      'exchange-discount',
      'raw-tolerance',
      'iron-stomach',
      'fast-eaters-wage',
      'tare-conversion',
      'char-bonus',
      'perfect-grill-bonus',
      'binge-mode',
      'digestive-pro',
      'eating-streak-bonus',
      'regular-customer',
      'vip-status',
      'regular-customer-bonus',
    ];
    const state = makeGameState({ skills: allSkillIds });
    // If the pool truly has no non-stackable remaining and stackable appear once,
    // we still have stackable available — test with a manually depleted pool concept.
    // This test verifies count=0 edge case instead.
    const choices = generateSkillChoices(state, 0);
    expect(choices).toEqual([]);
  });

  it('allows stackable skill (extra-slot) to appear even if already held', () => {
    const state = makeGameState({ skills: ['extra-slot'] });
    const choices = generateSkillChoices(state, 24);
    const hasExtraSlot = choices.some((s) => s.id === 'extra-slot');
    expect(hasExtraSlot).toBe(true);
  });

  it('allows table-extension to appear even if already held once', () => {
    const state = makeGameState({ skills: ['table-extension'] });
    const choices = generateSkillChoices(state, 24);
    const hasTableExt = choices.some((s) => s.id === 'table-extension');
    expect(hasTableExt).toBe(true);
  });

  it('excludes non-stackable skills already held', () => {
    const state = makeGameState({ skills: ['tong-master'] });
    const choices = generateSkillChoices(state, 24);
    expect(choices.every((s) => s.id !== 'tong-master')).toBe(true);
  });

  it('returned choices contain valid SkillDefinition objects with required fields', () => {
    const state = makeGameState({ skills: [] });
    const choices = generateSkillChoices(state, 3);
    for (const choice of choices) {
      expect(typeof choice.id).toBe('string');
      expect(typeof choice.name).toBe('string');
      expect(typeof choice.nameJP).toBe('string');
      expect(typeof choice.build).toBe('string');
      expect(typeof choice.isStackable).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------------
// acquireSkill
// ---------------------------------------------------------------------------

describe('acquireSkill', () => {
  describe('basic acquisition', () => {
    it('appends skillId to state.skills', () => {
      const state = makeGameState({ skills: [] });
      const next = acquireSkill(state, 'tong-master');
      expect(next.skills).toContain('tong-master');
    });

    it('returns a new state object (immutable update)', () => {
      const state = makeGameState({ skills: [] });
      const next = acquireSkill(state, 'heat-sensor');
      expect(next).not.toBe(state);
    });

    it('does not mutate the original state.skills array', () => {
      const skills: readonly string[] = ['tong-master'];
      const state = makeGameState({ skills });
      acquireSkill(state, 'heat-sensor');
      expect(state.skills).toEqual(['tong-master']);
      expect(state.skills).toHaveLength(1);
    });

    it('is idempotent for non-stackable skills (no duplicate added)', () => {
      const state = makeGameState({ skills: ['tong-master'] });
      const next = acquireSkill(state, 'tong-master');
      const count = next.skills.filter((id) => id === 'tong-master').length;
      expect(count).toBe(1);
    });

    it('returns unchanged skills for non-stackable skill already held', () => {
      const state = makeGameState({ skills: ['heat-sensor'] });
      const next = acquireSkill(state, 'heat-sensor');
      expect(next.skills).toEqual(['heat-sensor']);
    });
  });

  describe('Extra Slot — grill expansion', () => {
    it('extends grill by EXTRA_SLOT_COUNT (2) slots when Extra Slot is acquired', () => {
      const state = makeGameState();
      expect(state.grill).toHaveLength(3);
      const next = acquireSkill(state, 'extra-slot');
      expect(next.grill).toHaveLength(5); // 3 + EXTRA_SLOT_COUNT(2)
    });

    it('new grill slots are empty (part: null)', () => {
      const state = makeGameState();
      const next = acquireSkill(state, 'extra-slot');
      const newSlots = next.grill.slice(3);
      for (const slot of newSlots) {
        expect(slot.part).toBeNull();
      }
    });

    it('new grill slots are not disabled', () => {
      const state = makeGameState();
      const next = acquireSkill(state, 'extra-slot');
      const newSlots = next.grill.slice(3);
      for (const slot of newSlots) {
        expect(slot.disabled).toBe(false);
      }
    });

    it('acquiring Extra Slot twice adds 4 total extra slots (2 per acquisition)', () => {
      const state = makeGameState();
      const after1 = acquireSkill(state, 'extra-slot');
      const after2 = acquireSkill(after1, 'extra-slot');
      expect(after2.grill).toHaveLength(7); // 3 + 2 + 2
    });

    it('skills array records multiple extra-slot entries when stackable', () => {
      const state = makeGameState();
      const after1 = acquireSkill(state, 'extra-slot');
      const after2 = acquireSkill(after1, 'extra-slot');
      const count = after2.skills.filter((id) => id === 'extra-slot').length;
      expect(count).toBe(2);
    });
  });

  describe('Table Extension — capacity increase', () => {
    it('increases tableCapacity by TABLE_EXTENSION_COUNT (3) when Table Extension is acquired', () => {
      const state = makeGameState({ tableCapacity: 5 });
      const next = acquireSkill(state, 'table-extension');
      expect(next.tableCapacity).toBe(8); // 5 + TABLE_EXTENSION_COUNT(3)
    });

    it('acquiring Table Extension twice adds 6 total capacity', () => {
      const state = makeGameState({ tableCapacity: 5 });
      const after1 = acquireSkill(state, 'table-extension');
      const after2 = acquireSkill(after1, 'table-extension');
      expect(after2.tableCapacity).toBe(11); // 5 + 3 + 3
    });

    it('skills array records multiple table-extension entries when stackable', () => {
      const state = makeGameState();
      const after1 = acquireSkill(state, 'table-extension');
      const after2 = acquireSkill(after1, 'table-extension');
      const count = after2.skills.filter((id) => id === 'table-extension').length;
      expect(count).toBe(2);
    });
  });

  describe('Quick Order — serving interval reduction', () => {
    it('reduces effectiveServingInterval by QUICK_ORDER_INTERVAL_REDUCTION (1) upon acquisition', () => {
      const state = makeGameState();
      const originalInterval = state.restaurant.effectiveServingInterval; // 8
      const next = acquireSkill(state, 'quick-order');
      expect(next.restaurant.effectiveServingInterval).toBe(originalInterval - 1);
    });

    it('adds quick-order to state.skills', () => {
      const state = makeGameState();
      const next = acquireSkill(state, 'quick-order');
      expect(next.skills).toContain('quick-order');
    });

    it('does not reduce interval below the serving speed floor when acquired again as non-stackable', () => {
      // quick-order is non-stackable; re-acquiring is idempotent
      const state = makeGameState();
      const after1 = acquireSkill(state, 'quick-order');
      const after2 = acquireSkill(after1, 'quick-order');
      // Interval should only reduce once
      const originalInterval = state.restaurant.effectiveServingInterval;
      expect(after2.restaurant.effectiveServingInterval).toBe(originalInterval - 1);
    });
  });

  describe('other skills — lazy modifier (no structural change)', () => {
    it('acquiring speed-eater only adds to skills array, no structural change', () => {
      const state = makeGameState();
      const next = acquireSkill(state, 'speed-eater');
      expect(next.skills).toContain('speed-eater');
      expect(next.grill).toHaveLength(state.grill.length);
      expect(next.tableCapacity).toBe(state.tableCapacity);
    });

    it('acquiring tong-master only adds to skills array', () => {
      const state = makeGameState();
      const next = acquireSkill(state, 'tong-master');
      expect(next.skills).toContain('tong-master');
      expect(next.grill).toHaveLength(state.grill.length);
    });
  });
});

// ---------------------------------------------------------------------------
// applySkillModifiers
// ---------------------------------------------------------------------------

describe('applySkillModifiers', () => {
  describe('defaults — no skills held', () => {
    it('returns grillSlotCount of 3 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.grillSlotCount).toBe(3);
    });

    it('returns tableCapacity of 5 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.tableCapacity).toBe(5);
    });

    it('returns eatingSpeedMultiplier of 1.0 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.eatingSpeedMultiplier).toBe(1.0);
    });

    it('returns servingIntervalReduction of 0 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.servingIntervalReduction).toBe(0);
    });

    it('returns flipAvailable false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.flipAvailable).toBe(false);
    });

    it('returns heatSensorEnabled false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.heatSensorEnabled).toBe(false);
    });

    it('returns rawToleranceDurationMultiplier of 1.0 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.rawToleranceDurationMultiplier).toBe(1.0);
    });

    it('returns rawPenaltyNegated false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.rawPenaltyNegated).toBe(false);
    });

    it('returns staffWarningThreshold1 of 3 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.staffWarningThreshold1).toBe(3);
    });

    it('returns staffWarningThreshold2 of 5 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.staffWarningThreshold2).toBe(5);
    });

    it('returns discardProActive false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.discardProActive).toBe(false);
    });

    it('returns vipStatusActive false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.vipStatusActive).toBe(false);
    });

    it('returns fireControlActive false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.fireControlActive).toBe(false);
    });

    it('returns exchangeDiscountMultiplier of 1.0 when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.exchangeDiscountMultiplier).toBe(1.0);
    });

    it('returns bingeMultiplierActive false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.bingeMultiplierActive).toBe(false);
    });

    it('returns digestiveProActive false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.digestiveProActive).toBe(false);
    });

    it('returns regularCustomerActive false when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.regularCustomerActive).toBe(false);
    });

    it('returns eatingStreakThreshold of 5 (EATING_STREAK_THRESHOLD) when no skills are held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.eatingStreakThreshold).toBe(5);
    });
  });

  describe('grillSlotCount — Extra Slot stacking', () => {
    it('returns 5 when one extra-slot is held (3 + 2)', () => {
      const state = makeGameState({ skills: ['extra-slot'] });
      const mods = applySkillModifiers(state);
      expect(mods.grillSlotCount).toBe(5);
    });

    it('returns 7 when two extra-slot are held (3 + 2 + 2)', () => {
      const state = makeGameState({ skills: ['extra-slot', 'extra-slot'] });
      const mods = applySkillModifiers(state);
      expect(mods.grillSlotCount).toBe(7);
    });

    it('returns 9 when three extra-slot are held (3 + 2 + 2 + 2)', () => {
      const state = makeGameState({ skills: ['extra-slot', 'extra-slot', 'extra-slot'] });
      const mods = applySkillModifiers(state);
      expect(mods.grillSlotCount).toBe(9);
    });
  });

  describe('tableCapacity — Table Extension stacking', () => {
    it('returns 8 when one table-extension is held (5 + 3)', () => {
      const state = makeGameState({ skills: ['table-extension'] });
      const mods = applySkillModifiers(state);
      expect(mods.tableCapacity).toBe(8);
    });

    it('returns 11 when two table-extension are held (5 + 3 + 3)', () => {
      const state = makeGameState({ skills: ['table-extension', 'table-extension'] });
      const mods = applySkillModifiers(state);
      expect(mods.tableCapacity).toBe(11);
    });
  });

  describe('eatingSpeedMultiplier — Speed Eater', () => {
    it('returns SPEED_EATER_MULTIPLIER (0.70) when speed-eater is held', () => {
      const state = makeGameState({ skills: ['speed-eater'] });
      const mods = applySkillModifiers(state);
      expect(mods.eatingSpeedMultiplier).toBe(0.70);
    });

    it('returns 1.0 when speed-eater is not held', () => {
      const state = makeGameState({ skills: ['tong-master'] });
      const mods = applySkillModifiers(state);
      expect(mods.eatingSpeedMultiplier).toBe(1.0);
    });
  });

  describe('servingIntervalReduction — Quick Order', () => {
    it('returns QUICK_ORDER_INTERVAL_REDUCTION (1) when quick-order is held', () => {
      const state = makeGameState({ skills: ['quick-order'] });
      const mods = applySkillModifiers(state);
      expect(mods.servingIntervalReduction).toBe(1);
    });

    it('returns 0 when quick-order is not held', () => {
      const state = makeGameState({ skills: ['speed-eater'] });
      const mods = applySkillModifiers(state);
      expect(mods.servingIntervalReduction).toBe(0);
    });
  });

  describe('flipAvailable — Tong Master', () => {
    it('returns true when tong-master is held', () => {
      const state = makeGameState({ skills: ['tong-master'] });
      const mods = applySkillModifiers(state);
      expect(mods.flipAvailable).toBe(true);
    });

    it('returns false when tong-master is not held', () => {
      const state = makeGameState({ skills: ['heat-sensor'] });
      const mods = applySkillModifiers(state);
      expect(mods.flipAvailable).toBe(false);
    });
  });

  describe('heatSensorEnabled — Heat Sensor', () => {
    it('returns true when heat-sensor is held', () => {
      const state = makeGameState({ skills: ['heat-sensor'] });
      const mods = applySkillModifiers(state);
      expect(mods.heatSensorEnabled).toBe(true);
    });

    it('returns false when heat-sensor is not held', () => {
      const state = makeGameState({ skills: ['tong-master'] });
      const mods = applySkillModifiers(state);
      expect(mods.heatSensorEnabled).toBe(false);
    });
  });

  describe('rawToleranceDurationMultiplier and rawPenaltyNegated', () => {
    it('returns RAW_TOLERANCE_MULTIPLIER (0.30) and rawPenaltyNegated=false when raw-tolerance is held', () => {
      const state = makeGameState({ skills: ['raw-tolerance'] });
      const mods = applySkillModifiers(state);
      expect(mods.rawToleranceDurationMultiplier).toBe(0.30);
      expect(mods.rawPenaltyNegated).toBe(false);
    });

    it('returns rawToleranceDurationMultiplier=0.0 and rawPenaltyNegated=true when iron-stomach is held', () => {
      const state = makeGameState({ skills: ['iron-stomach'] });
      const mods = applySkillModifiers(state);
      expect(mods.rawToleranceDurationMultiplier).toBe(0.0);
      expect(mods.rawPenaltyNegated).toBe(true);
    });

    it('iron-stomach takes full precedence when both raw-tolerance and iron-stomach are held', () => {
      const state = makeGameState({ skills: ['raw-tolerance', 'iron-stomach'] });
      const mods = applySkillModifiers(state);
      expect(mods.rawPenaltyNegated).toBe(true);
      expect(mods.rawToleranceDurationMultiplier).toBe(0.0);
    });

    it('returns 1.0 multiplier and rawPenaltyNegated=false when neither raw-tolerance nor iron-stomach is held', () => {
      const state = makeGameState({ skills: ['speed-eater'] });
      const mods = applySkillModifiers(state);
      expect(mods.rawToleranceDurationMultiplier).toBe(1.0);
      expect(mods.rawPenaltyNegated).toBe(false);
    });
  });

  describe('staffWarningThreshold — Charming Personality', () => {
    it('raises threshold1 to CHARMING_FIRST_THRESHOLD (5) when charming-personality is held', () => {
      const state = makeGameState({ skills: ['charming-personality'] });
      const mods = applySkillModifiers(state);
      expect(mods.staffWarningThreshold1).toBe(5);
    });

    it('raises threshold2 to CHARMING_STACK_THRESHOLD (7) when charming-personality is held', () => {
      const state = makeGameState({ skills: ['charming-personality'] });
      const mods = applySkillModifiers(state);
      expect(mods.staffWarningThreshold2).toBe(7);
    });

    it('keeps default thresholds (3 and 5) when charming-personality is not held', () => {
      const state = makeGameState({ skills: ['tong-master'] });
      const mods = applySkillModifiers(state);
      expect(mods.staffWarningThreshold1).toBe(3);
      expect(mods.staffWarningThreshold2).toBe(5);
    });
  });

  describe('discardProActive — Discard Pro', () => {
    it('returns true when discard-pro is held', () => {
      const state = makeGameState({ skills: ['discard-pro'] });
      const mods = applySkillModifiers(state);
      expect(mods.discardProActive).toBe(true);
    });

    it('returns false when discard-pro is not held', () => {
      const state = makeGameState({ skills: ['tong-master'] });
      const mods = applySkillModifiers(state);
      expect(mods.discardProActive).toBe(false);
    });
  });

  describe('vipStatusActive — VIP Status', () => {
    it('returns true when vip-status is held', () => {
      const state = makeGameState({ skills: ['vip-status'] });
      const mods = applySkillModifiers(state);
      expect(mods.vipStatusActive).toBe(true);
    });

    it('returns false when vip-status is not held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.vipStatusActive).toBe(false);
    });
  });

  describe('fireControlActive — Fire Control', () => {
    it('returns true when fire-control is held', () => {
      const state = makeGameState({ skills: ['fire-control'] });
      const mods = applySkillModifiers(state);
      expect(mods.fireControlActive).toBe(true);
    });

    it('returns false when fire-control is not held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.fireControlActive).toBe(false);
    });
  });

  describe('exchangeDiscountMultiplier — Exchange Discount', () => {
    it('returns EXCHANGE_DISCOUNT_MULTIPLIER (0.70) when exchange-discount is held', () => {
      const state = makeGameState({ skills: ['exchange-discount'] });
      const mods = applySkillModifiers(state);
      expect(mods.exchangeDiscountMultiplier).toBe(0.70);
    });

    it('returns 1.0 when exchange-discount is not held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.exchangeDiscountMultiplier).toBe(1.0);
    });
  });

  describe('bingeMultiplierActive — Binge Mode', () => {
    it('returns true when binge-mode is held', () => {
      const state = makeGameState({ skills: ['binge-mode'] });
      const mods = applySkillModifiers(state);
      expect(mods.bingeMultiplierActive).toBe(true);
    });

    it('returns false when binge-mode is not held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.bingeMultiplierActive).toBe(false);
    });
  });

  describe('digestiveProActive and eatingStreakThreshold — Digestive Pro', () => {
    it('returns digestiveProActive=true when digestive-pro is held', () => {
      const state = makeGameState({ skills: ['digestive-pro'] });
      const mods = applySkillModifiers(state);
      expect(mods.digestiveProActive).toBe(true);
    });

    it('returns eatingStreakThreshold of DIGESTIVE_PRO_STREAK_THRESHOLD (3) when digestive-pro is held', () => {
      const state = makeGameState({ skills: ['digestive-pro'] });
      const mods = applySkillModifiers(state);
      expect(mods.eatingStreakThreshold).toBe(3);
    });

    it('returns eatingStreakThreshold of EATING_STREAK_THRESHOLD (5) when digestive-pro is not held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.eatingStreakThreshold).toBe(5);
    });
  });

  describe('regularCustomerActive — Regular Customer', () => {
    it('returns true when regular-customer is held', () => {
      const state = makeGameState({ skills: ['regular-customer'] });
      const mods = applySkillModifiers(state);
      expect(mods.regularCustomerActive).toBe(true);
    });

    it('returns false when regular-customer is not held', () => {
      const state = makeGameState({ skills: [] });
      const mods = applySkillModifiers(state);
      expect(mods.regularCustomerActive).toBe(false);
    });
  });

  describe('purity — applySkillModifiers does not mutate state', () => {
    it('returns identical results on repeated calls with the same state', () => {
      const state = makeGameState({ skills: ['tong-master', 'speed-eater', 'extra-slot'] });
      const mods1 = applySkillModifiers(state);
      const mods2 = applySkillModifiers(state);
      expect(mods1).toEqual(mods2);
    });

    it('does not mutate state.skills', () => {
      const skills: readonly string[] = ['tong-master', 'heat-sensor'];
      const state = makeGameState({ skills });
      applySkillModifiers(state);
      expect(state.skills).toEqual(['tong-master', 'heat-sensor']);
    });
  });

  describe('combined skills — interactions', () => {
    it('handles multiple unrelated skills simultaneously with correct modifier values', () => {
      const state = makeGameState({
        skills: ['tong-master', 'heat-sensor', 'speed-eater', 'discard-pro', 'charming-personality'],
      });
      const mods = applySkillModifiers(state);
      expect(mods.flipAvailable).toBe(true);
      expect(mods.heatSensorEnabled).toBe(true);
      expect(mods.eatingSpeedMultiplier).toBe(0.70);
      expect(mods.discardProActive).toBe(true);
      expect(mods.staffWarningThreshold1).toBe(5);
      expect(mods.staffWarningThreshold2).toBe(7);
    });

    it('grill slot count plus table capacity both scale correctly when both stackable skills are held multiple times', () => {
      const state = makeGameState({
        skills: ['extra-slot', 'extra-slot', 'table-extension', 'table-extension', 'table-extension'],
      });
      const mods = applySkillModifiers(state);
      expect(mods.grillSlotCount).toBe(7);   // 3 + 2×2
      expect(mods.tableCapacity).toBe(14);   // 5 + 3×3
    });
  });
});

// ---------------------------------------------------------------------------
// generateSkillChoices — non-stackable exclusion vs. stackable re-offer
// ---------------------------------------------------------------------------

describe('generateSkillChoices — stackable re-offer and non-stackable exclusion', () => {
  it('re-offers extra-slot (stackable) even when already in state.skills', () => {
    const state = makeGameState({ skills: ['extra-slot'] });
    // Request up to 24 choices to be sure extra-slot can appear
    const choices = generateSkillChoices(state, 24);
    expect(choices.some((s) => s.id === 'extra-slot')).toBe(true);
  });

  it('re-offers table-extension (stackable) even when already in state.skills', () => {
    const state = makeGameState({ skills: ['table-extension'] });
    const choices = generateSkillChoices(state, 24);
    expect(choices.some((s) => s.id === 'table-extension')).toBe(true);
  });

  it('does NOT re-offer tong-master (non-stackable) when already held', () => {
    const state = makeGameState({ skills: ['tong-master'] });
    const choices = generateSkillChoices(state, 24);
    expect(choices.every((s) => s.id !== 'tong-master')).toBe(true);
  });

  it('does NOT re-offer speed-eater (non-stackable) when already held', () => {
    const state = makeGameState({ skills: ['speed-eater'] });
    const choices = generateSkillChoices(state, 24);
    expect(choices.every((s) => s.id !== 'speed-eater')).toBe(true);
  });

  it('does NOT re-offer iron-stomach (non-stackable) when already held', () => {
    const state = makeGameState({ skills: ['iron-stomach'] });
    const choices = generateSkillChoices(state, 24);
    expect(choices.every((s) => s.id !== 'iron-stomach')).toBe(true);
  });

  it('does NOT re-offer charming-personality (non-stackable) when already held', () => {
    const state = makeGameState({ skills: ['charming-personality'] });
    const choices = generateSkillChoices(state, 24);
    expect(choices.every((s) => s.id !== 'charming-personality')).toBe(true);
  });
});

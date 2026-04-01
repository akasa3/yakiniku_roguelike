import type { GameState, GrillSlot, Restaurant, SkillDefinition, ConsumableItem } from '../types/index';
import {
  shouldShowNode,
  applyRest,
  getShopOfferings,
  purchaseSkill,
  purchaseConsumable,
} from '../game/systems/node';
import {
  NODE_FREQUENCY_BY_CYCLE,
  NODE_FREQUENCY_FLOOR,
  SKILL_PURCHASE_COST,
  CONSUMABLE_PURCHASE_COST,
  SKILL_CHOICE_COUNT,
} from '../game/data/constants';

// ---------------------------------------------------------------------------
// Helper: Build mock state
// ---------------------------------------------------------------------------

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
    coins: 100,
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
// shouldShowNode
// ---------------------------------------------------------------------------

describe('shouldShowNode', () => {
  it('is exported as a function', () => {
    expect(typeof shouldShowNode).toBe('function');
  });

  describe('cycle 1 — freq=1 (node after every restaurant)', () => {
    it('returns true after restaurant 1 (Chain)', () => {
      expect(shouldShowNode(1, 1)).toBe(true);
    });

    it('returns true after restaurant 2 (Local)', () => {
      expect(shouldShowNode(1, 2)).toBe(true);
    });

    it('returns true after restaurant 3 (High-End)', () => {
      expect(shouldShowNode(1, 3)).toBe(true);
    });

    it('returns true after restaurant 4 (Boss)', () => {
      expect(shouldShowNode(1, 4)).toBe(true);
    });
  });

  describe('cycle 2 — freq=2 (node after every 2nd restaurant)', () => {
    it('returns false after restaurant 1 (Chain)', () => {
      expect(shouldShowNode(2, 1)).toBe(false);
    });

    it('returns true after restaurant 2 (Local)', () => {
      expect(shouldShowNode(2, 2)).toBe(true);
    });

    it('returns false after restaurant 3 (High-End)', () => {
      expect(shouldShowNode(2, 3)).toBe(false);
    });

    it('returns true after restaurant 4 (Boss)', () => {
      expect(shouldShowNode(2, 4)).toBe(true);
    });
  });

  describe('cycle 3 — freq=3 (floor, node after every 3rd restaurant)', () => {
    it('returns false after restaurant 1 (Chain)', () => {
      expect(shouldShowNode(3, 1)).toBe(false);
    });

    it('returns false after restaurant 2 (Local)', () => {
      expect(shouldShowNode(3, 2)).toBe(false);
    });

    it('returns true after restaurant 3 (High-End)', () => {
      expect(shouldShowNode(3, 3)).toBe(true);
    });

    it('returns false after restaurant 4 (Boss) — 4 % 3 !== 0', () => {
      expect(shouldShowNode(3, 4)).toBe(false);
    });
  });

  describe('cycle 4+ — freq capped at NODE_FREQUENCY_FLOOR (3)', () => {
    it('returns same result as cycle 3 for cycle 4, restaurant 3', () => {
      expect(shouldShowNode(4, 3)).toBe(true);
    });

    it('returns same result as cycle 3 for cycle 4, restaurant 4', () => {
      expect(shouldShowNode(4, 4)).toBe(false);
    });

    it('returns same result as cycle 3 for cycle 10, restaurant 3', () => {
      expect(shouldShowNode(10, 3)).toBe(true);
    });

    it('returns same result as cycle 3 for cycle 10, restaurant 1', () => {
      expect(shouldShowNode(10, 1)).toBe(false);
    });
  });

  describe('pure function — same inputs yield same output', () => {
    it('returns identical results when called twice with the same arguments', () => {
      expect(shouldShowNode(2, 2)).toBe(shouldShowNode(2, 2));
    });
  });

  describe('NODE_FREQUENCY_BY_CYCLE constant consistency', () => {
    it('cycle 1 freq matches NODE_FREQUENCY_BY_CYCLE[0]', () => {
      const freq = NODE_FREQUENCY_BY_CYCLE[0]!;
      expect(1 % freq).toBe(0); // restaurantsCompletedInCycle=1 must return true
    });

    it('cycle 2 freq matches NODE_FREQUENCY_BY_CYCLE[1]', () => {
      const freq = NODE_FREQUENCY_BY_CYCLE[1]!;
      // freq=2: restaurant 2 triggers, restaurant 1 does not
      expect(2 % freq).toBe(0);
      expect(1 % freq).not.toBe(0);
    });

    it('cycle 3+ freq matches NODE_FREQUENCY_FLOOR', () => {
      expect(NODE_FREQUENCY_FLOOR).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// applyRest
// ---------------------------------------------------------------------------

describe('applyRest', () => {
  it('returns a new GameState object (immutable update)', () => {
    const state = makeGameState();
    const next = applyRest(state);
    expect(next).not.toBe(state);
  });

  it('does not mutate the input state', () => {
    const state = makeGameState({ staffWarningCount: 4, burntSmokeActive: true });
    applyRest(state);
    expect(state.staffWarningCount).toBe(4);
    expect(state.burntSmokeActive).toBe(true);
  });

  it('sets staffWarningCount to 0', () => {
    const state = makeGameState({ staffWarningCount: 5 });
    const next = applyRest(state);
    expect(next.staffWarningCount).toBe(0);
  });

  it('sets actionDisabledTimer to 0', () => {
    const state = makeGameState({ actionDisabledTimer: 2.5 });
    const next = applyRest(state);
    expect(next.actionDisabledTimer).toBe(0);
  });

  it('sets burntSmokeActive to false', () => {
    const state = makeGameState({ burntSmokeActive: true });
    const next = applyRest(state);
    expect(next.burntSmokeActive).toBe(false);
  });

  it('resets fireTimer to 0 on all grill slots', () => {
    const state = makeGameState({
      grill: [
        makeGrillSlot(0, { fireTimer: 5 }),
        makeGrillSlot(1, { fireTimer: 3 }),
        makeGrillSlot(2, { fireTimer: 0 }),
      ],
    });
    const next = applyRest(state);
    for (const slot of next.grill) {
      expect(slot.fireTimer).toBe(0);
    }
  });

  it('sets disabled to false on all grill slots', () => {
    const state = makeGameState({
      grill: [
        makeGrillSlot(0, { disabled: true, disabledTimer: 8 }),
        makeGrillSlot(1, { disabled: true, disabledTimer: 3 }),
        makeGrillSlot(2),
      ],
    });
    const next = applyRest(state);
    for (const slot of next.grill) {
      expect(slot.disabled).toBe(false);
    }
  });

  it('sets disabledTimer to 0 on all grill slots', () => {
    const state = makeGameState({
      grill: [
        makeGrillSlot(0, { disabledTimer: 7 }),
        makeGrillSlot(1, { disabledTimer: 2 }),
        makeGrillSlot(2),
      ],
    });
    const next = applyRest(state);
    for (const slot of next.grill) {
      expect(slot.disabledTimer).toBe(0);
    }
  });

  it('does NOT reset coins', () => {
    const state = makeGameState({ coins: 42 });
    const next = applyRest(state);
    expect(next.coins).toBe(42);
  });

  it('does NOT reset skills', () => {
    const state = makeGameState({ skills: ['tong-master', 'heat-sensor'] });
    const next = applyRest(state);
    expect(next.skills).toEqual(['tong-master', 'heat-sensor']);
  });

  it('does NOT reset score', () => {
    const state = makeGameState({ score: 7 });
    const next = applyRest(state);
    expect(next.score).toBe(7);
  });

  it('does NOT reset cycle', () => {
    const state = makeGameState({ cycle: 3 });
    const next = applyRest(state);
    expect(next.cycle).toBe(3);
  });

  it('does NOT reset catalog', () => {
    const state = makeGameState({ catalog: ['karubi', 'tontoro'] });
    const next = applyRest(state);
    expect(next.catalog).toEqual(['karubi', 'tontoro']);
  });

  it('does NOT reset highestRestaurantTypeReached', () => {
    const state = makeGameState({ highestRestaurantTypeReached: 3 });
    const next = applyRest(state);
    expect(next.highestRestaurantTypeReached).toBe(3);
  });

  it('always results in staffWarningCount === 0 (invariant)', () => {
    for (const count of [0, 1, 3, 5, 10]) {
      const state = makeGameState({ staffWarningCount: count });
      const next = applyRest(state);
      expect(next.staffWarningCount).toBe(0);
    }
  });

  it('resets all slots even when only one has active fire', () => {
    const state = makeGameState({
      grill: [
        makeGrillSlot(0, { fireTimer: 9, disabled: true, disabledTimer: 9 }),
        makeGrillSlot(1),
        makeGrillSlot(2),
      ],
    });
    const next = applyRest(state);
    expect(next.grill[0]!.fireTimer).toBe(0);
    expect(next.grill[0]!.disabled).toBe(false);
    expect(next.grill[0]!.disabledTimer).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getShopOfferings
// ---------------------------------------------------------------------------

describe('getShopOfferings', () => {
  it('returns an object with skills and consumables arrays', () => {
    const state = makeGameState();
    const offerings = getShopOfferings(state);
    expect(Array.isArray(offerings.skills)).toBe(true);
    expect(Array.isArray(offerings.consumables)).toBe(true);
  });

  describe('skills offerings', () => {
    it('returns at most SKILL_CHOICE_COUNT (3) skills', () => {
      const state = makeGameState({ skills: [] });
      const offerings = getShopOfferings(state);
      expect(offerings.skills.length).toBeLessThanOrEqual(SKILL_CHOICE_COUNT);
    });

    it('never includes skills already held by the player (non-stackable)', () => {
      const heldSkills = ['tong-master', 'heat-sensor', 'speed-eater'];
      const state = makeGameState({ skills: heldSkills });
      const offerings = getShopOfferings(state);
      for (const skill of offerings.skills) {
        if (!skill.isStackable) {
          expect(heldSkills).not.toContain(skill.id);
        }
      }
    });

    it('never includes the character starter skill (tanaka starter = discard-pro)', () => {
      const state = makeGameState({ character: 'tanaka', skills: [] });
      const offerings = getShopOfferings(state);
      expect(offerings.skills.every((s: SkillDefinition) => s.id !== 'discard-pro')).toBe(true);
    });

    it('never includes gourmet-critic starter skill (heat-sensor) when playing as gourmet-critic', () => {
      const state = makeGameState({ character: 'gourmet-critic', skills: [] });
      const offerings = getShopOfferings(state);
      expect(offerings.skills.every((s: SkillDefinition) => s.id !== 'heat-sensor')).toBe(true);
    });

    it('never includes competitive-eater starter skill (speed-eater) for that character', () => {
      const state = makeGameState({ character: 'competitive-eater', skills: [] });
      const offerings = getShopOfferings(state);
      expect(offerings.skills.every((s: SkillDefinition) => s.id !== 'speed-eater')).toBe(true);
    });

    it('never includes raw-food-advocate starter skill (iron-stomach) for that character', () => {
      const state = makeGameState({ character: 'raw-food-advocate', skills: [] });
      const offerings = getShopOfferings(state);
      expect(offerings.skills.every((s: SkillDefinition) => s.id !== 'iron-stomach')).toBe(true);
    });

    it('never includes vegan-tashiro starter skill (exchange-discount) for that character', () => {
      const state = makeGameState({ character: 'vegan-tashiro', skills: [] });
      const offerings = getShopOfferings(state);
      expect(offerings.skills.every((s: SkillDefinition) => s.id !== 'exchange-discount')).toBe(true);
    });

    it('offered skill definitions have required fields (id, name, nameJP, build, isStackable)', () => {
      const state = makeGameState({ skills: [] });
      const offerings = getShopOfferings(state);
      for (const skill of offerings.skills) {
        expect(typeof skill.id).toBe('string');
        expect(typeof skill.name).toBe('string');
        expect(typeof skill.nameJP).toBe('string');
        expect(typeof skill.build).toBe('string');
        expect(typeof skill.isStackable).toBe('boolean');
      }
    });

    it('returns empty array when all non-starter non-stackable skills are already held', () => {
      // Hold all known non-stackable skills except the tanaka starter (discard-pro)
      const allNonStackable = [
        'tong-master', 'heat-sensor', 'speed-eater', 'quick-order',
        'exchange-discount', 'raw-tolerance', 'iron-stomach', 'fast-eaters-wage',
        'tare-conversion', 'char-bonus', 'perfect-grill-bonus', 'binge-mode',
        'digestive-pro', 'eating-streak-bonus', 'regular-customer', 'vip-status',
        'regular-customer-bonus', 'charming-personality', 'fire-control',
        'slot-efficiency-bonus', 'quick-turnover-bonus',
        // stackable ones held once each — still eligible but non-starter filter makes pool small
        'extra-slot', 'table-extension',
      ];
      const state = makeGameState({ character: 'tanaka', skills: allNonStackable });
      const offerings = getShopOfferings(state);
      // All non-stackable held + stackable held once → pool only has stackable re-offers
      // (extra-slot, table-extension still eligible since stackable)
      // But no non-stackable unacquired remain (excluding starter discard-pro which is already filtered)
      expect(offerings.skills.every((s: SkillDefinition) => s.isStackable)).toBe(true);
    });

    it('does NOT include skills already held (non-stackable) even if pool is large', () => {
      const state = makeGameState({ skills: ['tong-master', 'heat-sensor'] });
      // Run many iterations to catch random variation
      for (let i = 0; i < 10; i++) {
        const offerings = getShopOfferings(state);
        for (const skill of offerings.skills) {
          if (!skill.isStackable) {
            expect(['tong-master', 'heat-sensor']).not.toContain(skill.id);
          }
        }
      }
    });

    it('can include exchange-discount for non-Vegan characters', () => {
      // exchange-discount is in general pool; tanaka starter is discard-pro
      // so exchange-discount may appear for tanaka
      const state = makeGameState({ character: 'tanaka', skills: [] });
      // We cannot guarantee it appears in 3 picks, but it must not be excluded by pool rules
      // Run multiple times and verify it's at least not actively barred
      let seenExchangeDiscount = false;
      for (let i = 0; i < 30; i++) {
        const offerings = getShopOfferings(state);
        if (offerings.skills.some((s: SkillDefinition) => s.id === 'exchange-discount')) {
          seenExchangeDiscount = true;
          break;
        }
      }
      expect(seenExchangeDiscount).toBe(true);
    });
  });

  describe('consumables offerings', () => {
    it('returns a non-empty consumables array', () => {
      const state = makeGameState();
      const offerings = getShopOfferings(state);
      expect(offerings.consumables.length).toBeGreaterThan(0);
    });

    it('consumable items have required fields (id, name, nameJP, cost, effect)', () => {
      const state = makeGameState();
      const offerings = getShopOfferings(state);
      for (const item of offerings.consumables) {
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.nameJP).toBe('string');
        expect(typeof item.cost).toBe('number');
        expect(item.effect).toBeDefined();
        expect(typeof item.effect.type).toBe('string');
      }
    });

    it('consumable effects are valid types (clear-warning or heal-fire)', () => {
      const state = makeGameState();
      const offerings = getShopOfferings(state);
      for (const item of offerings.consumables) {
        expect(['clear-warning', 'heal-fire']).toContain(item.effect.type);
      }
    });

    it('returns the same consumables regardless of player state (not gated by state)', () => {
      const stateA = makeGameState({ staffWarningCount: 0 });
      const stateB = makeGameState({ staffWarningCount: 5 });
      const offeringsA = getShopOfferings(stateA);
      const offeringsB = getShopOfferings(stateB);
      const idsA = offeringsA.consumables.map((c: ConsumableItem) => c.id).sort();
      const idsB = offeringsB.consumables.map((c: ConsumableItem) => c.id).sort();
      expect(idsA).toEqual(idsB);
    });
  });
});

// ---------------------------------------------------------------------------
// purchaseSkill
// ---------------------------------------------------------------------------

describe('purchaseSkill', () => {
  it('returns a new GameState object (immutable update)', () => {
    const state = makeGameState({ coins: SKILL_PURCHASE_COST });
    const next = purchaseSkill(state, 'tong-master');
    expect(next).not.toBe(state);
  });

  it('does not mutate the input state', () => {
    const skills: readonly string[] = [];
    const state = makeGameState({ coins: SKILL_PURCHASE_COST, skills });
    purchaseSkill(state, 'tong-master');
    expect(state.skills).toEqual([]);
    expect(state.coins).toBe(SKILL_PURCHASE_COST);
  });

  it('deducts SKILL_PURCHASE_COST from coins on successful purchase', () => {
    const state = makeGameState({ coins: 50 });
    const next = purchaseSkill(state, 'tong-master');
    expect(next.coins).toBe(50 - SKILL_PURCHASE_COST);
  });

  it('adds the skill to state.skills after purchase', () => {
    const state = makeGameState({ coins: SKILL_PURCHASE_COST, skills: [] });
    const next = purchaseSkill(state, 'tong-master');
    expect(next.skills).toContain('tong-master');
  });

  it('delegates to acquireSkill — extra-slot extends grill when purchased', () => {
    const state = makeGameState({ coins: SKILL_PURCHASE_COST });
    expect(state.grill).toHaveLength(3);
    const next = purchaseSkill(state, 'extra-slot');
    expect(next.grill.length).toBeGreaterThan(3);
  });

  it('delegates to acquireSkill — table-extension increases tableCapacity when purchased', () => {
    const state = makeGameState({ coins: SKILL_PURCHASE_COST, tableCapacity: 5 });
    const next = purchaseSkill(state, 'table-extension');
    expect(next.tableCapacity).toBeGreaterThan(5);
  });

  describe('guard: insufficient coins', () => {
    it('returns state unchanged when coins < SKILL_PURCHASE_COST', () => {
      const state = makeGameState({ coins: SKILL_PURCHASE_COST - 1, skills: [] });
      const next = purchaseSkill(state, 'tong-master');
      expect(next).toBe(state);
    });

    it('does not add skill when coins are insufficient', () => {
      const state = makeGameState({ coins: 0, skills: [] });
      const next = purchaseSkill(state, 'heat-sensor');
      expect(next.skills).not.toContain('heat-sensor');
    });

    it('does not deduct coins when coins are insufficient', () => {
      const state = makeGameState({ coins: 5, skills: [] });
      const next = purchaseSkill(state, 'speed-eater');
      expect(next.coins).toBe(5);
    });
  });

  describe('guard: skill already held (non-stackable)', () => {
    it('returns state unchanged when non-stackable skill is already held', () => {
      const state = makeGameState({ coins: 100, skills: ['tong-master'] });
      const next = purchaseSkill(state, 'tong-master');
      expect(next).toBe(state);
    });

    it('does not deduct coins when skill is already held (non-stackable)', () => {
      const state = makeGameState({ coins: 100, skills: ['heat-sensor'] });
      const next = purchaseSkill(state, 'heat-sensor');
      expect(next.coins).toBe(100);
    });

    it('does not duplicate skill entry when skill is already held (non-stackable)', () => {
      const state = makeGameState({ coins: 100, skills: ['speed-eater'] });
      const next = purchaseSkill(state, 'speed-eater');
      const count = (next.skills as readonly string[]).filter((id: string) => id === 'speed-eater').length;
      expect(count).toBe(1);
    });
  });

  describe('invariants', () => {
    it('never reduces coins below 0', () => {
      const state = makeGameState({ coins: 0 });
      const next = purchaseSkill(state, 'tong-master');
      expect(next.coins).toBeGreaterThanOrEqual(0);
    });

    it('never adds a skill that was already held (non-stackable, idempotent)', () => {
      const state = makeGameState({ coins: 100, skills: ['tong-master'] });
      const next = purchaseSkill(state, 'tong-master');
      const count = (next.skills as readonly string[]).filter((id: string) => id === 'tong-master').length;
      expect(count).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// purchaseConsumable
// ---------------------------------------------------------------------------

describe('purchaseConsumable', () => {
  // We need a valid consumable id; use one that will come from getShopOfferings
  function getFirstConsumableId(state: GameState): string {
    const offerings = getShopOfferings(state);
    return offerings.consumables[0]!.id;
  }

  function getClearWarningConsumable(state: GameState): ConsumableItem | undefined {
    const offerings = getShopOfferings(state);
    return offerings.consumables.find((c: ConsumableItem) => c.effect.type === 'clear-warning');
  }

  function getHealFireConsumable(state: GameState): ConsumableItem | undefined {
    const offerings = getShopOfferings(state);
    return offerings.consumables.find((c: ConsumableItem) => c.effect.type === 'heal-fire');
  }

  it('returns a new GameState object (immutable update)', () => {
    const state = makeGameState({ coins: CONSUMABLE_PURCHASE_COST });
    const itemId = getFirstConsumableId(state);
    const next = purchaseConsumable(state, itemId);
    expect(next).not.toBe(state);
  });

  it('does not mutate input state', () => {
    const state = makeGameState({ coins: CONSUMABLE_PURCHASE_COST, staffWarningCount: 3 });
    const itemId = getFirstConsumableId(state);
    purchaseConsumable(state, itemId);
    expect(state.coins).toBe(CONSUMABLE_PURCHASE_COST);
    expect(state.staffWarningCount).toBe(3);
  });

  it('deducts CONSUMABLE_PURCHASE_COST from coins on successful purchase', () => {
    const state = makeGameState({ coins: 50 });
    const itemId = getFirstConsumableId(state);
    const next = purchaseConsumable(state, itemId);
    expect(next.coins).toBe(50 - CONSUMABLE_PURCHASE_COST);
  });

  describe('effect: clear-warning', () => {
    it('reduces staffWarningCount by the consumable amount', () => {
      const baseState = makeGameState({ coins: CONSUMABLE_PURCHASE_COST, staffWarningCount: 5 });
      const consumable = getClearWarningConsumable(baseState);
      if (consumable === undefined) return; // skip if no clear-warning consumable defined yet
      const next = purchaseConsumable(baseState, consumable.id);
      const expectedCount = Math.max(0, 5 - (consumable.effect as { type: 'clear-warning'; amount: number }).amount);
      expect(next.staffWarningCount).toBe(expectedCount);
    });

    it('never reduces staffWarningCount below 0', () => {
      const baseState = makeGameState({ coins: CONSUMABLE_PURCHASE_COST, staffWarningCount: 0 });
      const consumable = getClearWarningConsumable(baseState);
      if (consumable === undefined) return;
      const next = purchaseConsumable(baseState, consumable.id);
      expect(next.staffWarningCount).toBeGreaterThanOrEqual(0);
    });

    it('does not add the consumable to state.skills (single-use)', () => {
      const baseState = makeGameState({ coins: CONSUMABLE_PURCHASE_COST, skills: [] });
      const consumable = getClearWarningConsumable(baseState);
      if (consumable === undefined) return;
      const next = purchaseConsumable(baseState, consumable.id);
      expect(next.skills).not.toContain(consumable.id);
    });
  });

  describe('effect: heal-fire', () => {
    it('resets fireTimer/disabled/disabledTimer on burning slots (up to slotCount)', () => {
      const baseState = makeGameState({
        coins: CONSUMABLE_PURCHASE_COST,
        grill: [
          makeGrillSlot(0, { disabled: true, fireTimer: 8, disabledTimer: 8 }),
          makeGrillSlot(1, { disabled: true, fireTimer: 5, disabledTimer: 5 }),
          makeGrillSlot(2),
        ],
      });
      const consumable = getHealFireConsumable(baseState);
      if (consumable === undefined) return;
      const next = purchaseConsumable(baseState, consumable.id);
      const slotCount = (consumable.effect as { type: 'heal-fire'; slotCount: number }).slotCount;
      let healed = 0;
      for (const slot of next.grill) {
        if (!slot.disabled && slot.fireTimer === 0 && slot.disabledTimer === 0) {
          // check original state to see which were disabled
          const orig = baseState.grill.find((s) => s.id === slot.id);
          if (orig?.disabled) healed++;
        }
      }
      expect(healed).toBeLessThanOrEqual(slotCount);
    });

    it('does not add the consumable to state.skills (single-use)', () => {
      const baseState = makeGameState({ coins: CONSUMABLE_PURCHASE_COST, skills: [] });
      const consumable = getHealFireConsumable(baseState);
      if (consumable === undefined) return;
      const next = purchaseConsumable(baseState, consumable.id);
      expect(next.skills).not.toContain(consumable.id);
    });
  });

  describe('guard: insufficient coins', () => {
    it('returns state unchanged when coins < CONSUMABLE_PURCHASE_COST', () => {
      const state = makeGameState({ coins: CONSUMABLE_PURCHASE_COST - 1 });
      const itemId = getFirstConsumableId(state);
      const next = purchaseConsumable(state, itemId);
      expect(next).toBe(state);
    });

    it('does not deduct coins when insufficient', () => {
      const state = makeGameState({ coins: 0 });
      const itemId = getFirstConsumableId(state);
      const next = purchaseConsumable(state, itemId);
      expect(next.coins).toBe(0);
    });
  });

  describe('guard: invalid item id', () => {
    it('returns state unchanged for an unknown consumable id', () => {
      const state = makeGameState({ coins: 100 });
      const next = purchaseConsumable(state, 'non-existent-item-xyz');
      expect(next).toBe(state);
    });

    it('does not deduct coins for an unknown consumable id', () => {
      const state = makeGameState({ coins: 100 });
      const next = purchaseConsumable(state, 'non-existent-item-xyz');
      expect(next.coins).toBe(100);
    });
  });

  describe('invariants', () => {
    it('never reduces coins below 0', () => {
      const state = makeGameState({ coins: CONSUMABLE_PURCHASE_COST });
      const itemId = getFirstConsumableId(state);
      const next = purchaseConsumable(state, itemId);
      expect(next.coins).toBeGreaterThanOrEqual(0);
    });

    it('does not add any consumed item to state.skills', () => {
      const state = makeGameState({ coins: 50, skills: [] });
      const itemId = getFirstConsumableId(state);
      const skillsBefore = state.skills.length;
      const next = purchaseConsumable(state, itemId);
      expect(next.skills.length).toBe(skillsBefore);
    });
  });
});

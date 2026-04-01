import type { GameState, GrillSlot, SkillDefinition } from '../../types/index';
import { SKILLS, filterAvailableSkills } from '../data/skills';
import {
  INITIAL_GRILL_SLOTS,
  INITIAL_TABLE_CAPACITY,
  EXTRA_SLOT_COUNT,
  TABLE_EXTENSION_COUNT,
  QUICK_ORDER_INTERVAL_REDUCTION,
  SPEED_EATER_MULTIPLIER,
  EXCHANGE_DISCOUNT_MULTIPLIER,
  RAW_TOLERANCE_MULTIPLIER,
  CHARMING_FIRST_THRESHOLD,
  CHARMING_STACK_THRESHOLD,
  EATING_STREAK_THRESHOLD,
  DIGESTIVE_PRO_STREAK_THRESHOLD,
} from '../data/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillModifiers {
  readonly grillSlotCount: number;
  readonly tableCapacity: number;
  readonly eatingSpeedMultiplier: number;
  readonly servingIntervalReduction: number;
  readonly flipAvailable: boolean;
  readonly heatSensorEnabled: boolean;
  readonly rawToleranceDurationMultiplier: number;
  readonly rawPenaltyNegated: boolean;
  readonly staffWarningThreshold1: number;
  readonly staffWarningThreshold2: number;
  readonly discardProActive: boolean;
  readonly vipStatusActive: boolean;
  readonly fireControlActive: boolean;
  readonly exchangeDiscountMultiplier: number;
  readonly bingeMultiplierActive: boolean;
  readonly digestiveProActive: boolean;
  readonly regularCustomerActive: boolean;
  readonly eatingStreakThreshold: number;
}

// ---------------------------------------------------------------------------
// hasSkill
// ---------------------------------------------------------------------------

/**
 * Checks whether the player currently holds the given skill.
 */
export function hasSkill(state: GameState, skillId: string): boolean {
  return state.skills.includes(skillId);
}

// ---------------------------------------------------------------------------
// generateSkillChoices
// ---------------------------------------------------------------------------

/**
 * Returns up to `count` random skill definitions that the player does not already
 * own (for non-stackable skills) and are available in the general pool.
 */
export function generateSkillChoices(state: GameState, count: number): SkillDefinition[] {
  if (count <= 0) {
    return [];
  }

  const available = filterAvailableSkills(SKILLS, state.skills);

  if (available.length === 0) {
    return [];
  }

  if (count >= available.length) {
    return [...available];
  }

  // Fisher-Yates shuffle on a copy, then take first `count`
  const pool = [...available];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = temp;
  }

  return pool.slice(0, count);
}

// ---------------------------------------------------------------------------
// acquireSkill
// ---------------------------------------------------------------------------

function makeEmptyGrillSlot(id: number): GrillSlot {
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

/**
 * Adds `skillId` to `state.skills` and applies any one-time structural changes.
 * Returns state unchanged if a non-stackable skill is already held.
 */
export function acquireSkill(state: GameState, skillId: string): GameState {
  const skillDef = SKILLS.find((s) => s.id === skillId);

  // Guard: non-stackable skill already held → idempotent
  if (!skillDef?.isStackable && state.skills.includes(skillId)) {
    return state;
  }

  const newSkills = [...state.skills, skillId];

  // Extra Slot: extend grill slots
  if (skillId === 'extra-slot') {
    const currentLength = state.grill.length;
    const newSlots: GrillSlot[] = Array.from({ length: EXTRA_SLOT_COUNT }, (_, i) =>
      makeEmptyGrillSlot(currentLength + i)
    );
    return {
      ...state,
      skills: newSkills,
      grill: [...state.grill, ...newSlots],
    };
  }

  // Table Extension: increase table capacity
  if (skillId === 'table-extension') {
    return {
      ...state,
      skills: newSkills,
      tableCapacity: state.tableCapacity + TABLE_EXTENSION_COUNT,
    };
  }

  // Quick Order: reduce effectiveServingInterval
  if (skillId === 'quick-order') {
    return {
      ...state,
      skills: newSkills,
      restaurant: {
        ...state.restaurant,
        effectiveServingInterval:
          state.restaurant.effectiveServingInterval - QUICK_ORDER_INTERVAL_REDUCTION,
      },
    };
  }

  // All other skills: just append to skills array
  return {
    ...state,
    skills: newSkills,
  };
}

// ---------------------------------------------------------------------------
// applySkillModifiers
// ---------------------------------------------------------------------------

/**
 * Computes and returns the aggregate modifier object from all currently held skills.
 * Pure function — does not modify state.
 */
export function applySkillModifiers(state: GameState): SkillModifiers {
  const held = state.skills;

  const extraSlotCount = held.filter((id) => id === 'extra-slot').length;
  const tableExtCount = held.filter((id) => id === 'table-extension').length;

  const hasIronStomach = held.includes('iron-stomach');
  const hasRawTolerance = held.includes('raw-tolerance');

  let rawToleranceDurationMultiplier: number;
  let rawPenaltyNegated: boolean;
  if (hasIronStomach) {
    rawPenaltyNegated = true;
    rawToleranceDurationMultiplier = 0.0;
  } else if (hasRawTolerance) {
    rawPenaltyNegated = false;
    rawToleranceDurationMultiplier = RAW_TOLERANCE_MULTIPLIER;
  } else {
    rawPenaltyNegated = false;
    rawToleranceDurationMultiplier = 1.0;
  }

  const hasCharming = held.includes('charming-personality');
  const hasDigestivePro = held.includes('digestive-pro');

  return {
    grillSlotCount: INITIAL_GRILL_SLOTS + extraSlotCount * EXTRA_SLOT_COUNT,
    tableCapacity: INITIAL_TABLE_CAPACITY + tableExtCount * TABLE_EXTENSION_COUNT,
    eatingSpeedMultiplier: held.includes('speed-eater') ? SPEED_EATER_MULTIPLIER : 1.0,
    servingIntervalReduction: held.includes('quick-order') ? QUICK_ORDER_INTERVAL_REDUCTION : 0,
    flipAvailable: held.includes('tong-master'),
    heatSensorEnabled: held.includes('heat-sensor'),
    rawToleranceDurationMultiplier,
    rawPenaltyNegated,
    staffWarningThreshold1: hasCharming ? CHARMING_FIRST_THRESHOLD : 3,
    staffWarningThreshold2: hasCharming ? CHARMING_STACK_THRESHOLD : 5,
    discardProActive: held.includes('discard-pro'),
    vipStatusActive: held.includes('vip-status'),
    fireControlActive: held.includes('fire-control'),
    exchangeDiscountMultiplier: held.includes('exchange-discount')
      ? EXCHANGE_DISCOUNT_MULTIPLIER
      : 1.0,
    bingeMultiplierActive: held.includes('binge-mode'),
    digestiveProActive: hasDigestivePro,
    regularCustomerActive: held.includes('regular-customer'),
    eatingStreakThreshold: hasDigestivePro ? DIGESTIVE_PRO_STREAK_THRESHOLD : EATING_STREAK_THRESHOLD,
  };
}

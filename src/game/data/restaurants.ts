import type { RestaurantDefinition, RestaurantType, MeatRank } from '../../types/index';
import {
  DISHES_PER_RESTAURANT,
  SERVING_INTERVALS,
  SWEET_SPOT_MINIMUM,
  SWEET_SPOT_REDUCTION_PER_CYCLE,
  SWEET_SPOT_SCALING_CAP_CYCLE,
  SERVING_SPEED_REDUCTION_PER_CYCLE,
  SERVING_SPEED_SCALING_CAP_CYCLE,
  PENALTY_INCREASE_PER_CYCLE,
  PENALTY_SCALING_CAP_CYCLE,
} from './constants';

// ---------------------------------------------------------------------------
// Cycle order
// ---------------------------------------------------------------------------

export const RESTAURANT_CYCLE_ORDER: readonly RestaurantType[] = [
  'chain',
  'local',
  'high-end',
  'boss',
] as const;

// ---------------------------------------------------------------------------
// Restaurant definitions
// ---------------------------------------------------------------------------

export const RESTAURANT_DEFINITIONS: readonly RestaurantDefinition[] = [
  {
    type: 'chain',
    nameJP: 'チェーン店',
    totalDishes: DISHES_PER_RESTAURANT.CHAIN,       // [TUNE] 8
    servingInterval: SERVING_INTERVALS.CHAIN,        // [TUNE] 8
    rankDistribution: {
      common:  1.0,
      upper:   0.0,
      premium: 0.0,
      elite:   0.0,
    },
    activePenalties: ['table-overflow'],
  },
  {
    type: 'local',
    nameJP: '個人店',
    totalDishes: DISHES_PER_RESTAURANT.LOCAL,        // [TUNE] 12
    servingInterval: SERVING_INTERVALS.LOCAL,         // [TUNE] 6
    rankDistribution: {
      common:  0.40,
      upper:   0.60,
      premium: 0.00,
      elite:   0.00,
    },
    activePenalties: ['table-overflow', 'staff-warning'],
  },
  {
    type: 'high-end',
    nameJP: '高級店',
    totalDishes: DISHES_PER_RESTAURANT.HIGH_END,     // [TUNE] 10
    servingInterval: SERVING_INTERVALS.HIGH_END,      // [TUNE] 5
    rankDistribution: {
      common:  0.00,
      upper:   0.30,
      premium: 0.70,
      elite:   0.00,
    },
    activePenalties: ['table-overflow', 'staff-warning', 'grill-fire'],
  },
  {
    type: 'boss',
    nameJP: 'ボス店舗',
    totalDishes: DISHES_PER_RESTAURANT.BOSS,         // [TUNE] 15
    servingInterval: SERVING_INTERVALS.BOSS,          // [TUNE] 3
    rankDistribution: {
      common:  0.00,
      upper:   0.00,
      premium: 0.40,
      elite:   0.60,
    },
    activePenalties: ['table-overflow', 'staff-warning', 'grill-fire', 'raw-meat'],
  },
] as const;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the RestaurantDefinition for the given type.
 * Throws if the type is invalid.
 */
export function getRestaurantDefinition(type: RestaurantType): RestaurantDefinition {
  const def = RESTAURANT_DEFINITIONS.find((d) => d.type === type);
  if (def === undefined) {
    throw new Error(`Unknown restaurant type: "${String(type)}"`);
  }
  return def;
}

/**
 * Returns the RestaurantDefinition at the given 0-based index within a cycle.
 * Valid indices are 0–3. Throws if the index is out of range.
 */
export function getRestaurantAtIndex(cycleRestaurantIndex: number): RestaurantDefinition {
  if (cycleRestaurantIndex < 0 || cycleRestaurantIndex >= RESTAURANT_CYCLE_ORDER.length) {
    throw new Error(`Restaurant index out of range: ${cycleRestaurantIndex} (valid: 0–3)`);
  }
  const type = RESTAURANT_CYCLE_ORDER[cycleRestaurantIndex]!;
  return getRestaurantDefinition(type);
}

/**
 * Returns the serving interval in seconds after applying cycle-based speed scaling.
 * Formula: base - SERVING_SPEED_REDUCTION_PER_CYCLE × min(cycleNumber - 1, SERVING_SPEED_SCALING_CAP_CYCLE - 1)
 * Result is always > 0.
 */
export function getEffectiveServingInterval(
  definition: RestaurantDefinition,
  cycleNumber: number,
): number {
  const increments = Math.min(cycleNumber - 1, SERVING_SPEED_SCALING_CAP_CYCLE - 1);
  return definition.servingInterval - SERVING_SPEED_REDUCTION_PER_CYCLE * increments;
}

/**
 * Returns the adjusted sweet_spot duration after cycle scaling.
 * Formula: max(SWEET_SPOT_MINIMUM, base - SWEET_SPOT_REDUCTION_PER_CYCLE × min(cycleNumber - 1, SWEET_SPOT_SCALING_CAP_CYCLE - 1))
 * Result is always ≥ SWEET_SPOT_MINIMUM.
 */
export function getEffectiveSweetSpot(baseSweetSpot: number, cycleNumber: number): number {
  const increments = Math.min(cycleNumber - 1, SWEET_SPOT_SCALING_CAP_CYCLE - 1);
  const reduced = baseSweetSpot - SWEET_SPOT_REDUCTION_PER_CYCLE * increments;
  return Math.max(SWEET_SPOT_MINIMUM, reduced);
}

/**
 * Returns the penalty severity multiplier for the given cycle.
 * Formula: 1.0 + PENALTY_INCREASE_PER_CYCLE × min(cycleNumber - 1, PENALTY_SCALING_CAP_CYCLE - 1)
 * At cycle 1: 1.0 (no scaling). At cycle 5+: capped at 1.40.
 */
export function getEffectivePenaltyMultiplier(cycleNumber: number): number {
  const increments = Math.min(cycleNumber - 1, PENALTY_SCALING_CAP_CYCLE - 1);
  return 1.0 + PENALTY_INCREASE_PER_CYCLE * increments;
}

/**
 * Selects a MeatRank for a newly served meat dish based on the restaurant's rank distribution.
 * Uses cumulative probability bucketing over the order: common → upper → premium → elite.
 * `random` is an injected random function (e.g., Math.random) to allow deterministic testing.
 */
export function pickMeatRank(
  definition: RestaurantDefinition,
  random: () => number,
): MeatRank {
  const roll = random();
  const { common, upper, premium } = definition.rankDistribution;

  let cumulative = 0;

  cumulative += common;
  if (roll < cumulative) return 'common';

  cumulative += upper;
  if (roll < cumulative) return 'upper';

  cumulative += premium;
  if (roll < cumulative) return 'premium';

  return 'elite';
}

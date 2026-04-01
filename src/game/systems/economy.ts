import type { GameState, GrillingState, Part } from '../../types/index';
import { hasSkill } from './skill';
import {
  BASE_RESTAURANT_CLEAR_COINS,
  REGULAR_CUSTOMER_BONUS_COINS,
  FAST_EATER_WAGE_COINS,
  WELL_DONE_BASE_COINS,
  PERFECT_GRILL_BONUS_COINS,
  TARE_CONVERSION_COINS,
  CHAR_BONUS_COINS,
  EATING_STREAK_THRESHOLD,
  EATING_STREAK_BONUS_COINS,
  SLOT_EFFICIENCY_BONUS_COINS,
  QUICK_TURNOVER_BONUS_COINS,
  QUICK_TURNOVER_DPM_THRESHOLD,
  INSTANT_EXCHANGE_BASE_COST,
  EXCHANGE_DISCOUNT_MULTIPLIER,
  VEGETABLE_COIN_MULTIPLIER,
} from '../data/constants';

// ---------------------------------------------------------------------------
// awardRestaurantClearCoins
// ---------------------------------------------------------------------------

/**
 * Awards coins for clearing a restaurant.
 * Always awards BASE_RESTAURANT_CLEAR_COINS.
 * Additionally awards REGULAR_CUSTOMER_BONUS_COINS if the bonus skill is held
 * and staffWarningCount is 0 at the moment of clearing.
 * If the regular-customer skill is held, decrements staffWarningCount by 1 (floored at 0)
 * AFTER the bonus check.
 */
export function awardRestaurantClearCoins(state: GameState): GameState {
  let coins = state.coins + BASE_RESTAURANT_CLEAR_COINS;

  // Regular Customer Bonus: check count at clearing time (before any decrement)
  if (hasSkill(state, 'regular-customer-bonus') && state.staffWarningCount === 0) {
    coins += REGULAR_CUSTOMER_BONUS_COINS;
  }

  // Regular Customer: decrement staffWarningCount after bonus check
  const staffWarningCount = hasSkill(state, 'regular-customer')
    ? Math.max(0, state.staffWarningCount - 1)
    : state.staffWarningCount;

  return {
    ...state,
    coins,
    staffWarningCount,
  };
}

// ---------------------------------------------------------------------------
// awardEatCoins
// ---------------------------------------------------------------------------

/**
 * Awards coins triggered by a successful eat action.
 * Fast Eater's Wage: rare + non-vegetable meat + skill held → FAST_EATER_WAGE_COINS
 * Perfect Grill Bonus: well-done + non-vegetable meat + skill held → PERFECT_GRILL_BONUS_COINS
 * Vegan Tashiro: vegetable + character is vegan-tashiro → VEGETABLE_COIN_MULTIPLIER
 */
export function awardEatCoins(state: GameState, meatState: GrillingState, meat: Part): GameState {
  let bonus = 0;

  // Fast Eater's Wage: rare, non-vegetable, skill held
  if (hasSkill(state, 'fast-eaters-wage') && meatState === 'rare' && !meat.isVegetable) {
    bonus += FAST_EATER_WAGE_COINS;
  }

  // Well-done base coins: always awarded for eating well-done meat (no skill required)
  if (meatState === 'well-done' && !meat.isVegetable) {
    bonus += WELL_DONE_BASE_COINS;
  }

  // Perfect Grill Bonus: well-done, non-vegetable, skill held (stacks with base)
  if (hasSkill(state, 'perfect-grill-bonus') && meatState === 'well-done' && !meat.isVegetable) {
    bonus += PERFECT_GRILL_BONUS_COINS;
  }

  // Vegan Tashiro vegetable coins
  if (state.character === 'vegan-tashiro' && meat.isVegetable) {
    bonus += VEGETABLE_COIN_MULTIPLIER;
  }

  return {
    ...state,
    coins: state.coins + bonus,
  };
}

// ---------------------------------------------------------------------------
// awardDiscardCoins
// ---------------------------------------------------------------------------

/**
 * Awards coins triggered by a discard action.
 * Tare Conversion: non-vegetable meat + skill held → TARE_CONVERSION_COINS
 * Char Bonus: burnt + non-vegetable + skill held → CHAR_BONUS_COINS (stacks with Tare Conversion)
 * Never modifies staffWarningCount.
 */
export function awardDiscardCoins(state: GameState, meat: Part, meatState: GrillingState): GameState {
  let bonus = 0;

  if (!meat.isVegetable) {
    // Tare Conversion: any discard of meat
    if (hasSkill(state, 'tare-conversion')) {
      bonus += TARE_CONVERSION_COINS;
    }

    // Char Bonus: burnt meat discard
    if (hasSkill(state, 'char-bonus') && meatState === 'burnt') {
      bonus += CHAR_BONUS_COINS;
    }
  }

  return {
    ...state,
    coins: state.coins + bonus,
  };
}

// ---------------------------------------------------------------------------
// awardStreakCoins
// ---------------------------------------------------------------------------

/**
 * Awards Eating Streak Bonus coins when consecutiveEatCount reaches a multiple
 * of EATING_STREAK_THRESHOLD and is greater than 0.
 */
export function awardStreakCoins(state: GameState): GameState {
  if (
    hasSkill(state, 'eating-streak-bonus') &&
    state.consecutiveEatCount > 0 &&
    state.consecutiveEatCount % EATING_STREAK_THRESHOLD === 0
  ) {
    return {
      ...state,
      coins: state.coins + EATING_STREAK_BONUS_COINS,
    };
  }

  return { ...state };
}

// ---------------------------------------------------------------------------
// awardSlotEfficiencyCoins
// ---------------------------------------------------------------------------

/**
 * Awards Slot Efficiency Bonus coins when all non-disabled grill slots become
 * simultaneously occupied for the first time (edge-triggered).
 */
export function awardSlotEfficiencyCoins(state: GameState): GameState {
  const nonDisabledSlots = state.grill.filter((slot) => !slot.disabled);
  const allFull = nonDisabledSlots.length > 0 && nonDisabledSlots.every((slot) => slot.part !== null);

  if (
    hasSkill(state, 'slot-efficiency-bonus') &&
    allFull &&
    !state.allSlotsOccupiedLastTick
  ) {
    return {
      ...state,
      coins: state.coins + SLOT_EFFICIENCY_BONUS_COINS,
    };
  }

  return { ...state };
}

// ---------------------------------------------------------------------------
// awardQuickTurnoverCoins
// ---------------------------------------------------------------------------

/**
 * Awards Quick Turnover Bonus coins when a restaurant is cleared above the
 * dishes-per-minute threshold. Uses game-time seconds for a pure, testable calculation.
 */
export function awardQuickTurnoverCoins(state: GameState): GameState {
  if (!hasSkill(state, 'quick-turnover-bonus')) {
    return { ...state };
  }

  const durationSeconds = state.elapsedTime - state.restaurant.startTime;

  // Degenerate case: duration <= 0 → clamp DPM to Infinity
  const dpm =
    durationSeconds <= 0
      ? Infinity
      : state.restaurant.meatDishesEaten / (durationSeconds / 60);

  if (dpm > QUICK_TURNOVER_DPM_THRESHOLD) {
    return {
      ...state,
      coins: state.coins + QUICK_TURNOVER_BONUS_COINS,
    };
  }

  return { ...state };
}

// ---------------------------------------------------------------------------
// getExchangeCost
// ---------------------------------------------------------------------------

/**
 * Returns the current Instant Exchange coin cost after applying any Exchange Discount.
 */
export function getExchangeCost(state: GameState): number {
  if (hasSkill(state, 'exchange-discount')) {
    return Math.floor(INSTANT_EXCHANGE_BASE_COST * EXCHANGE_DISCOUNT_MULTIPLIER);
  }

  return INSTANT_EXCHANGE_BASE_COST;
}

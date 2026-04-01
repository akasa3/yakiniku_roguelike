import { describe, it, expect } from 'vitest';
import {
  // Grill System
  INITIAL_GRILL_SLOTS,
  INITIAL_TABLE_CAPACITY,
  GRILL_TIME,
  FLARE_RISK,
  SWEET_SPOT,
  FLIP_TIMER_RESET_FRACTION,
  SWEET_SPOT_MINIMUM,
  FLARE_RISK_CHECK_INTERVAL,
  // Penalty Durations
  RAW_MEAT_DISABLE_DURATION,
  GRILL_FIRE_DISABLE_DURATION,
  GRILL_FIRE_GAME_OVER_THRESHOLD,
  // Staff Warning System
  STAFF_WARNING_THRESHOLD,
  STAFF_WARNING_STACK_THRESHOLD,
  STAFF_WARNING_GAME_OVER_THRESHOLD,
  STAFF_WARNING_EAT_COOLDOWN,
  // Charming Personality
  CHARMING_FIRST_THRESHOLD,
  CHARMING_STACK_THRESHOLD,
  // Skill Effects
  HEAT_SENSOR_WARNING_SECONDS,
  EXTRA_SLOT_COUNT,
  TABLE_EXTENSION_COUNT,
  SPEED_EATER_MULTIPLIER,
  QUICK_ORDER_INTERVAL_REDUCTION,
  EXCHANGE_DISCOUNT_MULTIPLIER,
  RAW_TOLERANCE_MULTIPLIER,
  FIRE_CONTROL_MULTIPLIER,
  FIRE_CONTROL_AUTO_EXTINGUISH_SECONDS,
  REGULAR_CUSTOMER_WARNING_REDUCTION,
  VIP_STATUS_SPEED_BUFF,
  // Difficulty Scaling
  SWEET_SPOT_REDUCTION_PER_CYCLE,
  SWEET_SPOT_SCALING_CAP_CYCLE,
  PENALTY_INCREASE_PER_CYCLE,
  PENALTY_SCALING_CAP_CYCLE,
  SERVING_SPEED_REDUCTION_PER_CYCLE,
  SERVING_SPEED_SCALING_CAP_CYCLE,
  SERVING_SPEED_MAX_REDUCTION,
  // Economy
  BASE_RESTAURANT_CLEAR_COINS,
  SKILL_PURCHASE_COST,
  CONSUMABLE_PURCHASE_COST,
  INSTANT_EXCHANGE_BASE_COST,
  FAST_EATER_WAGE_COINS,
  PERFECT_GRILL_BONUS_COINS,
  TARE_CONVERSION_COINS,
  CHAR_BONUS_COINS,
  EATING_STREAK_THRESHOLD,
  EATING_STREAK_BONUS_COINS,
  REGULAR_CUSTOMER_BONUS_COINS,
  SLOT_EFFICIENCY_BONUS_COINS,
  QUICK_TURNOVER_BONUS_COINS,
  QUICK_TURNOVER_DPM_THRESHOLD,
  VEGETABLE_COIN_MULTIPLIER,
  // Restaurant
  DISHES_PER_RESTAURANT,
  SERVING_INTERVALS,
  VEGETABLE_INSERT_CHANCE,
  RESTAURANT_CYCLE_LENGTH,
  // Character Modifiers
  GOURMET_SWEET_SPOT_BONUS,
  GOURMET_COMMON_COIN_MULTIPLIER,
  COMPETITIVE_EATER_SPEED_MULTIPLIER,
  COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER,
  VEGAN_MEAT_EAT_WARNING_PENALTY,
  // Binge System
  DIGESTIVE_PRO_STREAK_THRESHOLD,
  // Skill Selection
  SKILL_CHOICE_COUNT,
  DELAYED_EXCHANGE_DURATION,
  // Node System
  NODE_FREQUENCY_BY_CYCLE,
  NODE_FREQUENCY_FLOOR,
  NODE_FREQUENCY_CYCLE_1,
  NODE_FREQUENCY_CYCLE_2,
  NODE_FREQUENCY_CYCLE_3_PLUS,
  // True Ending
  TRUE_ENDING_CYCLE,
  // Persistence
  STORAGE_KEY_PERSISTENT,
  PERSISTENT_STATE_VERSION,
} from '../game/data/constants';

describe('data/constants', () => {
  describe('Grill System', () => {
    it('INITIAL_GRILL_SLOTS is 3', () => {
      expect(INITIAL_GRILL_SLOTS).toBe(3);
    });

    it('INITIAL_TABLE_CAPACITY is 5', () => {
      expect(INITIAL_TABLE_CAPACITY).toBe(5);
    });

    it('GRILL_TIME has correct durations', () => {
      expect(GRILL_TIME.SHORT).toBe(3);
      expect(GRILL_TIME.MEDIUM).toBe(5);
      expect(GRILL_TIME.LONG).toBe(8);
      expect(GRILL_TIME.VERY_LONG).toBe(12);
    });

    it('FLARE_RISK has correct probabilities', () => {
      expect(FLARE_RISK.NONE).toBe(0);
      expect(FLARE_RISK.LOW).toBe(0.05);
      expect(FLARE_RISK.MEDIUM).toBe(0.20);
      expect(FLARE_RISK.HIGH).toBe(0.40);
      expect(FLARE_RISK.VERY_HIGH).toBe(0.60);
    });

    it('SWEET_SPOT has correct window durations', () => {
      expect(SWEET_SPOT.VERY_NARROW).toBe(0.5);
      expect(SWEET_SPOT.NARROW).toBe(1);
      expect(SWEET_SPOT.MEDIUM).toBe(2);
      expect(SWEET_SPOT.WIDE).toBe(3);
      expect(SWEET_SPOT.VERY_WIDE).toBe(4);
    });

    it('FLIP_TIMER_RESET_FRACTION is 0.5', () => {
      expect(FLIP_TIMER_RESET_FRACTION).toBe(0.5);
    });

    it('SWEET_SPOT_MINIMUM is 0.1', () => {
      expect(SWEET_SPOT_MINIMUM).toBe(0.1);
    });

    it('FLARE_RISK_CHECK_INTERVAL is 1', () => {
      expect(FLARE_RISK_CHECK_INTERVAL).toBe(1);
    });
  });

  describe('Penalty Durations', () => {
    it('RAW_MEAT_DISABLE_DURATION is 3', () => {
      expect(RAW_MEAT_DISABLE_DURATION).toBe(3);
    });

    it('GRILL_FIRE_DISABLE_DURATION is 10', () => {
      expect(GRILL_FIRE_DISABLE_DURATION).toBe(10);
    });

    it('GRILL_FIRE_GAME_OVER_THRESHOLD is 15', () => {
      expect(GRILL_FIRE_GAME_OVER_THRESHOLD).toBe(15);
    });
  });

  describe('Staff Warning System', () => {
    it('STAFF_WARNING_THRESHOLD is 3', () => {
      expect(STAFF_WARNING_THRESHOLD).toBe(3);
    });

    it('STAFF_WARNING_STACK_THRESHOLD is 5', () => {
      expect(STAFF_WARNING_STACK_THRESHOLD).toBe(5);
    });

    it('STAFF_WARNING_GAME_OVER_THRESHOLD is 8', () => {
      expect(STAFF_WARNING_GAME_OVER_THRESHOLD).toBe(8);
    });

    it('STAFF_WARNING_EAT_COOLDOWN is 1.0', () => {
      expect(STAFF_WARNING_EAT_COOLDOWN).toBe(1.0);
    });
  });

  describe('Charming Personality — Raised Thresholds', () => {
    it('CHARMING_FIRST_THRESHOLD is 5', () => {
      expect(CHARMING_FIRST_THRESHOLD).toBe(5);
    });

    it('CHARMING_STACK_THRESHOLD is 7', () => {
      expect(CHARMING_STACK_THRESHOLD).toBe(7);
    });
  });

  describe('Skill Effects', () => {
    it('HEAT_SENSOR_WARNING_SECONDS is 2', () => {
      expect(HEAT_SENSOR_WARNING_SECONDS).toBe(2);
    });

    it('EXTRA_SLOT_COUNT is 2', () => {
      expect(EXTRA_SLOT_COUNT).toBe(2);
    });

    it('TABLE_EXTENSION_COUNT is 3', () => {
      expect(TABLE_EXTENSION_COUNT).toBe(3);
    });

    it('SPEED_EATER_MULTIPLIER is 0.70', () => {
      expect(SPEED_EATER_MULTIPLIER).toBe(0.70);
    });

    it('QUICK_ORDER_INTERVAL_REDUCTION is 1', () => {
      expect(QUICK_ORDER_INTERVAL_REDUCTION).toBe(1);
    });

    it('EXCHANGE_DISCOUNT_MULTIPLIER is 0.70', () => {
      expect(EXCHANGE_DISCOUNT_MULTIPLIER).toBe(0.70);
    });

    it('RAW_TOLERANCE_MULTIPLIER is 0.30', () => {
      expect(RAW_TOLERANCE_MULTIPLIER).toBe(0.30);
    });

    it('FIRE_CONTROL_MULTIPLIER is 0.50', () => {
      expect(FIRE_CONTROL_MULTIPLIER).toBe(0.50);
    });

    it('FIRE_CONTROL_AUTO_EXTINGUISH_SECONDS is 5', () => {
      expect(FIRE_CONTROL_AUTO_EXTINGUISH_SECONDS).toBe(5);
    });

    it('REGULAR_CUSTOMER_WARNING_REDUCTION is 1', () => {
      expect(REGULAR_CUSTOMER_WARNING_REDUCTION).toBe(1);
    });

    it('VIP_STATUS_SPEED_BUFF is 1.1', () => {
      expect(VIP_STATUS_SPEED_BUFF).toBe(1.1);
    });
  });

  describe('Difficulty Scaling', () => {
    it('SWEET_SPOT_REDUCTION_PER_CYCLE is 0.3', () => {
      expect(SWEET_SPOT_REDUCTION_PER_CYCLE).toBe(0.3);
    });

    it('SWEET_SPOT_SCALING_CAP_CYCLE is 5', () => {
      expect(SWEET_SPOT_SCALING_CAP_CYCLE).toBe(5);
    });

    it('PENALTY_INCREASE_PER_CYCLE is 0.10', () => {
      expect(PENALTY_INCREASE_PER_CYCLE).toBe(0.10);
    });

    it('PENALTY_SCALING_CAP_CYCLE is 5', () => {
      expect(PENALTY_SCALING_CAP_CYCLE).toBe(5);
    });

    it('SERVING_SPEED_REDUCTION_PER_CYCLE is 0.5', () => {
      expect(SERVING_SPEED_REDUCTION_PER_CYCLE).toBe(0.5);
    });

    it('SERVING_SPEED_SCALING_CAP_CYCLE is 3', () => {
      expect(SERVING_SPEED_SCALING_CAP_CYCLE).toBe(3);
    });

    it('SERVING_SPEED_MAX_REDUCTION is 1.0 (derived from cap and reduction rate)', () => {
      expect(SERVING_SPEED_MAX_REDUCTION).toBe(1.0);
    });

    it('SERVING_SPEED_MAX_REDUCTION equals (SERVING_SPEED_SCALING_CAP_CYCLE - 1) × SERVING_SPEED_REDUCTION_PER_CYCLE', () => {
      expect(SERVING_SPEED_MAX_REDUCTION).toBe(
        (SERVING_SPEED_SCALING_CAP_CYCLE - 1) * SERVING_SPEED_REDUCTION_PER_CYCLE
      );
    });
  });

  describe('Economy', () => {
    it('BASE_RESTAURANT_CLEAR_COINS is 10', () => {
      expect(BASE_RESTAURANT_CLEAR_COINS).toBe(10);
    });

    it('SKILL_PURCHASE_COST is 20', () => {
      expect(SKILL_PURCHASE_COST).toBe(20);
    });

    it('CONSUMABLE_PURCHASE_COST is 10', () => {
      expect(CONSUMABLE_PURCHASE_COST).toBe(10);
    });

    it('INSTANT_EXCHANGE_BASE_COST is 5', () => {
      expect(INSTANT_EXCHANGE_BASE_COST).toBe(5);
    });

    it('FAST_EATER_WAGE_COINS is 3', () => {
      expect(FAST_EATER_WAGE_COINS).toBe(3);
    });

    it('PERFECT_GRILL_BONUS_COINS is 3', () => {
      expect(PERFECT_GRILL_BONUS_COINS).toBe(3);
    });

    it('TARE_CONVERSION_COINS is 2', () => {
      expect(TARE_CONVERSION_COINS).toBe(2);
    });

    it('CHAR_BONUS_COINS is 3', () => {
      expect(CHAR_BONUS_COINS).toBe(3);
    });

    it('EATING_STREAK_THRESHOLD is 5', () => {
      expect(EATING_STREAK_THRESHOLD).toBe(5);
    });

    it('EATING_STREAK_BONUS_COINS is 5', () => {
      expect(EATING_STREAK_BONUS_COINS).toBe(5);
    });

    it('REGULAR_CUSTOMER_BONUS_COINS is 5', () => {
      expect(REGULAR_CUSTOMER_BONUS_COINS).toBe(5);
    });

    it('SLOT_EFFICIENCY_BONUS_COINS is 2', () => {
      expect(SLOT_EFFICIENCY_BONUS_COINS).toBe(2);
    });

    it('QUICK_TURNOVER_BONUS_COINS is 5', () => {
      expect(QUICK_TURNOVER_BONUS_COINS).toBe(5);
    });

    it('QUICK_TURNOVER_DPM_THRESHOLD is 2.5', () => {
      expect(QUICK_TURNOVER_DPM_THRESHOLD).toBe(2.5);
    });

    it('VEGETABLE_COIN_MULTIPLIER is 3', () => {
      expect(VEGETABLE_COIN_MULTIPLIER).toBe(3);
    });
  });

  describe('Restaurant', () => {
    it('DISHES_PER_RESTAURANT has correct counts per type', () => {
      expect(DISHES_PER_RESTAURANT.CHAIN).toBe(8);
      expect(DISHES_PER_RESTAURANT.LOCAL).toBe(12);
      expect(DISHES_PER_RESTAURANT.HIGH_END).toBe(10);
      expect(DISHES_PER_RESTAURANT.BOSS).toBe(15);
    });

    it('SERVING_INTERVALS has correct seconds per type', () => {
      expect(SERVING_INTERVALS.CHAIN).toBe(8);
      expect(SERVING_INTERVALS.LOCAL).toBe(6);
      expect(SERVING_INTERVALS.HIGH_END).toBe(5);
      expect(SERVING_INTERVALS.BOSS).toBe(3);
    });

    it('VEGETABLE_INSERT_CHANCE is 0.20', () => {
      expect(VEGETABLE_INSERT_CHANCE).toBe(0.20);
    });

    it('RESTAURANT_CYCLE_LENGTH is 4', () => {
      expect(RESTAURANT_CYCLE_LENGTH).toBe(4);
    });
  });

  describe('Character Modifiers', () => {
    it('GOURMET_SWEET_SPOT_BONUS is 1', () => {
      expect(GOURMET_SWEET_SPOT_BONUS).toBe(1);
    });

    it('GOURMET_COMMON_COIN_MULTIPLIER is 0.50', () => {
      expect(GOURMET_COMMON_COIN_MULTIPLIER).toBe(0.50);
    });

    it('COMPETITIVE_EATER_SPEED_MULTIPLIER is 0.50', () => {
      expect(COMPETITIVE_EATER_SPEED_MULTIPLIER).toBe(0.50);
    });

    it('COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER is 0.80', () => {
      expect(COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER).toBe(0.80);
    });

    it('VEGAN_MEAT_EAT_WARNING_PENALTY is 2', () => {
      expect(VEGAN_MEAT_EAT_WARNING_PENALTY).toBe(2);
    });
  });

  describe('Binge System', () => {
    it('DIGESTIVE_PRO_STREAK_THRESHOLD is 3', () => {
      expect(DIGESTIVE_PRO_STREAK_THRESHOLD).toBe(3);
    });
  });

  describe('Skill Selection', () => {
    it('SKILL_CHOICE_COUNT is 3', () => {
      expect(SKILL_CHOICE_COUNT).toBe(3);
    });

    it('DELAYED_EXCHANGE_DURATION is 5', () => {
      expect(DELAYED_EXCHANGE_DURATION).toBe(5);
    });
  });

  describe('Node System', () => {
    it('NODE_FREQUENCY_BY_CYCLE has 3 entries', () => {
      expect(NODE_FREQUENCY_BY_CYCLE).toHaveLength(3);
    });

    it('NODE_FREQUENCY_BY_CYCLE has correct values per cycle', () => {
      expect(NODE_FREQUENCY_BY_CYCLE[0]).toBe(1); // cycle 1
      expect(NODE_FREQUENCY_BY_CYCLE[1]).toBe(2); // cycle 2
      expect(NODE_FREQUENCY_BY_CYCLE[2]).toBe(3); // cycle 3+
    });

    it('NODE_FREQUENCY_FLOOR is 3', () => {
      expect(NODE_FREQUENCY_FLOOR).toBe(3);
    });

    it('NODE_FREQUENCY_CYCLE_1 is 1', () => {
      expect(NODE_FREQUENCY_CYCLE_1).toBe(1);
    });

    it('NODE_FREQUENCY_CYCLE_2 is 2', () => {
      expect(NODE_FREQUENCY_CYCLE_2).toBe(2);
    });

    it('NODE_FREQUENCY_CYCLE_3_PLUS is 3', () => {
      expect(NODE_FREQUENCY_CYCLE_3_PLUS).toBe(3);
    });
  });

  describe('True Ending', () => {
    it('TRUE_ENDING_CYCLE is 4', () => {
      expect(TRUE_ENDING_CYCLE).toBe(4);
    });
  });

  describe('Persistence', () => {
    it('STORAGE_KEY_PERSISTENT is the expected string', () => {
      expect(STORAGE_KEY_PERSISTENT).toBe('yakiniku-roguelike-save');
    });

    it('PERSISTENT_STATE_VERSION is 1', () => {
      expect(PERSISTENT_STATE_VERSION).toBe(1);
    });
  });

  describe('Invariants', () => {
    it('SWEET_SPOT_MINIMUM is positive', () => {
      expect(SWEET_SPOT_MINIMUM).toBeGreaterThan(0);
    });

    it('BASE_RESTAURANT_CLEAR_COINS is positive', () => {
      expect(BASE_RESTAURANT_CLEAR_COINS).toBeGreaterThan(0);
    });

    it('STAFF_WARNING_THRESHOLD < STAFF_WARNING_STACK_THRESHOLD', () => {
      expect(STAFF_WARNING_THRESHOLD).toBeLessThan(STAFF_WARNING_STACK_THRESHOLD);
    });

    it('CHARMING_FIRST_THRESHOLD < CHARMING_STACK_THRESHOLD', () => {
      expect(CHARMING_FIRST_THRESHOLD).toBeLessThan(CHARMING_STACK_THRESHOLD);
    });

    it('STAFF_WARNING_THRESHOLD < CHARMING_FIRST_THRESHOLD', () => {
      expect(STAFF_WARNING_THRESHOLD).toBeLessThan(CHARMING_FIRST_THRESHOLD);
    });

    it('STAFF_WARNING_STACK_THRESHOLD < CHARMING_STACK_THRESHOLD', () => {
      expect(STAFF_WARNING_STACK_THRESHOLD).toBeLessThan(CHARMING_STACK_THRESHOLD);
    });

    it('DIGESTIVE_PRO_STREAK_THRESHOLD < EATING_STREAK_THRESHOLD', () => {
      expect(DIGESTIVE_PRO_STREAK_THRESHOLD).toBeLessThan(EATING_STREAK_THRESHOLD);
    });

    it('NODE_FREQUENCY_BY_CYCLE last element equals NODE_FREQUENCY_FLOOR', () => {
      expect(NODE_FREQUENCY_BY_CYCLE[NODE_FREQUENCY_BY_CYCLE.length - 1]).toBe(NODE_FREQUENCY_FLOOR);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  RESTAURANT_CYCLE_ORDER,
  RESTAURANT_DEFINITIONS,
  getRestaurantDefinition,
  getRestaurantAtIndex,
  getEffectiveServingInterval,
  getEffectiveSweetSpot,
  getEffectivePenaltyMultiplier,
  pickMeatRank,
} from '../game/data/restaurants';

// ---------------------------------------------------------------------------
// RESTAURANT_CYCLE_ORDER
// ---------------------------------------------------------------------------

describe('RESTAURANT_CYCLE_ORDER', () => {
  it('has exactly 4 entries', () => {
    expect(RESTAURANT_CYCLE_ORDER).toHaveLength(4);
  });

  it('follows the fixed order: chain → local → high-end → boss', () => {
    expect(RESTAURANT_CYCLE_ORDER[0]).toBe('chain');
    expect(RESTAURANT_CYCLE_ORDER[1]).toBe('local');
    expect(RESTAURANT_CYCLE_ORDER[2]).toBe('high-end');
    expect(RESTAURANT_CYCLE_ORDER[3]).toBe('boss');
  });
});

// ---------------------------------------------------------------------------
// RESTAURANT_DEFINITIONS — shape and count
// ---------------------------------------------------------------------------

describe('RESTAURANT_DEFINITIONS', () => {
  it('has exactly 4 entries', () => {
    expect(RESTAURANT_DEFINITIONS).toHaveLength(4);
  });

  it('types match RESTAURANT_CYCLE_ORDER', () => {
    RESTAURANT_DEFINITIONS.forEach((def, i) => {
      expect(def.type).toBe(RESTAURANT_CYCLE_ORDER[i]);
    });
  });

  it('every rankDistribution sums to 1.0 (±0.001)', () => {
    for (const def of RESTAURANT_DEFINITIONS) {
      const sum =
        def.rankDistribution.common +
        def.rankDistribution.upper +
        def.rankDistribution.premium +
        def.rankDistribution.elite;
      expect(sum).toBeCloseTo(1.0, 3);
    }
  });
});

// ---------------------------------------------------------------------------
// Chain (チェーン店)
// ---------------------------------------------------------------------------

describe('Chain restaurant definition', () => {
  const def = () => RESTAURANT_DEFINITIONS.find((d) => d.type === 'chain')!;

  it('type is "chain"', () => {
    expect(def().type).toBe('chain');
  });

  it('nameJP is "チェーン店"', () => {
    expect(def().nameJP).toBe('チェーン店');
  });

  it('totalDishes is 8 (DISHES_PER_RESTAURANT.CHAIN)', () => {
    expect(def().totalDishes).toBe(8);
  });

  it('servingInterval is 8 (SERVING_INTERVALS.CHAIN)', () => {
    expect(def().servingInterval).toBe(8);
  });

  describe('rankDistribution', () => {
    it('common is 1.0', () => {
      expect(def().rankDistribution.common).toBe(1.0);
    });

    it('upper is 0.0', () => {
      expect(def().rankDistribution.upper).toBe(0.0);
    });

    it('premium is 0.0', () => {
      expect(def().rankDistribution.premium).toBe(0.0);
    });

    it('elite is 0.0', () => {
      expect(def().rankDistribution.elite).toBe(0.0);
    });
  });

  describe('activePenalties', () => {
    it('contains only "table-overflow"', () => {
      expect(def().activePenalties).toEqual(['table-overflow']);
    });
  });
});

// ---------------------------------------------------------------------------
// Local (個人店)
// ---------------------------------------------------------------------------

describe('Local restaurant definition', () => {
  const def = () => RESTAURANT_DEFINITIONS.find((d) => d.type === 'local')!;

  it('type is "local"', () => {
    expect(def().type).toBe('local');
  });

  it('nameJP is "個人店"', () => {
    expect(def().nameJP).toBe('個人店');
  });

  it('totalDishes is 12 (DISHES_PER_RESTAURANT.LOCAL)', () => {
    expect(def().totalDishes).toBe(12);
  });

  it('servingInterval is 6 (SERVING_INTERVALS.LOCAL)', () => {
    expect(def().servingInterval).toBe(6);
  });

  describe('rankDistribution', () => {
    it('common is 0.40', () => {
      expect(def().rankDistribution.common).toBeCloseTo(0.40, 5);
    });

    it('upper is 0.60', () => {
      expect(def().rankDistribution.upper).toBeCloseTo(0.60, 5);
    });

    it('premium is 0.00', () => {
      expect(def().rankDistribution.premium).toBe(0.0);
    });

    it('elite is 0.00', () => {
      expect(def().rankDistribution.elite).toBe(0.0);
    });
  });

  describe('activePenalties', () => {
    it('contains "table-overflow" and "staff-warning"', () => {
      expect(def().activePenalties).toContain('table-overflow');
      expect(def().activePenalties).toContain('staff-warning');
    });

    it('has exactly 2 entries', () => {
      expect(def().activePenalties).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// High-End (高級店)
// ---------------------------------------------------------------------------

describe('High-End restaurant definition', () => {
  const def = () => RESTAURANT_DEFINITIONS.find((d) => d.type === 'high-end')!;

  it('type is "high-end"', () => {
    expect(def().type).toBe('high-end');
  });

  it('nameJP is "高級店"', () => {
    expect(def().nameJP).toBe('高級店');
  });

  it('totalDishes is 10 (DISHES_PER_RESTAURANT.HIGH_END)', () => {
    expect(def().totalDishes).toBe(10);
  });

  it('servingInterval is 5 (SERVING_INTERVALS.HIGH_END)', () => {
    expect(def().servingInterval).toBe(5);
  });

  describe('rankDistribution', () => {
    it('common is 0.00', () => {
      expect(def().rankDistribution.common).toBe(0.0);
    });

    it('upper is 0.30', () => {
      expect(def().rankDistribution.upper).toBeCloseTo(0.30, 5);
    });

    it('premium is 0.70', () => {
      expect(def().rankDistribution.premium).toBeCloseTo(0.70, 5);
    });

    it('elite is 0.00', () => {
      expect(def().rankDistribution.elite).toBe(0.0);
    });
  });

  describe('activePenalties', () => {
    it('contains "table-overflow", "staff-warning", and "grill-fire"', () => {
      expect(def().activePenalties).toContain('table-overflow');
      expect(def().activePenalties).toContain('staff-warning');
      expect(def().activePenalties).toContain('grill-fire');
    });

    it('has exactly 3 entries', () => {
      expect(def().activePenalties).toHaveLength(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Boss (ボス店舗)
// ---------------------------------------------------------------------------

describe('Boss restaurant definition', () => {
  const def = () => RESTAURANT_DEFINITIONS.find((d) => d.type === 'boss')!;

  it('type is "boss"', () => {
    expect(def().type).toBe('boss');
  });

  it('nameJP is "ボス店舗"', () => {
    expect(def().nameJP).toBe('ボス店舗');
  });

  it('totalDishes is 15 (DISHES_PER_RESTAURANT.BOSS)', () => {
    expect(def().totalDishes).toBe(15);
  });

  it('servingInterval is 3 (SERVING_INTERVALS.BOSS)', () => {
    expect(def().servingInterval).toBe(3);
  });

  describe('rankDistribution', () => {
    it('common is 0.00', () => {
      expect(def().rankDistribution.common).toBe(0.0);
    });

    it('upper is 0.00', () => {
      expect(def().rankDistribution.upper).toBe(0.0);
    });

    it('premium is 0.40', () => {
      expect(def().rankDistribution.premium).toBeCloseTo(0.40, 5);
    });

    it('elite is 0.60', () => {
      expect(def().rankDistribution.elite).toBeCloseTo(0.60, 5);
    });
  });

  describe('activePenalties', () => {
    it('contains "table-overflow", "staff-warning", "grill-fire", and "raw-meat"', () => {
      expect(def().activePenalties).toContain('table-overflow');
      expect(def().activePenalties).toContain('staff-warning');
      expect(def().activePenalties).toContain('grill-fire');
      expect(def().activePenalties).toContain('raw-meat');
    });

    it('has exactly 4 entries', () => {
      expect(def().activePenalties).toHaveLength(4);
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting invariants on RESTAURANT_DEFINITIONS
// ---------------------------------------------------------------------------

describe('RestaurantDefinition invariants', () => {
  it('Chain has common === 1.0 (only Common rank)', () => {
    const chain = RESTAURANT_DEFINITIONS.find((d) => d.type === 'chain')!;
    expect(chain.rankDistribution.common).toBe(1.0);
  });

  it('Local has elite === 0.0 and premium === 0.0', () => {
    const local = RESTAURANT_DEFINITIONS.find((d) => d.type === 'local')!;
    expect(local.rankDistribution.elite).toBe(0.0);
    expect(local.rankDistribution.premium).toBe(0.0);
  });

  it('High-End has common === 0.0 and elite === 0.0', () => {
    const highEnd = RESTAURANT_DEFINITIONS.find((d) => d.type === 'high-end')!;
    expect(highEnd.rankDistribution.common).toBe(0.0);
    expect(highEnd.rankDistribution.elite).toBe(0.0);
  });

  it('Boss has common === 0.0 and upper === 0.0', () => {
    const boss = RESTAURANT_DEFINITIONS.find((d) => d.type === 'boss')!;
    expect(boss.rankDistribution.common).toBe(0.0);
    expect(boss.rankDistribution.upper).toBe(0.0);
  });
});

// ---------------------------------------------------------------------------
// getRestaurantDefinition
// ---------------------------------------------------------------------------

describe('getRestaurantDefinition', () => {
  it('returns the Chain definition for "chain"', () => {
    const def = getRestaurantDefinition('chain');
    expect(def.type).toBe('chain');
  });

  it('returns the Local definition for "local"', () => {
    const def = getRestaurantDefinition('local');
    expect(def.type).toBe('local');
  });

  it('returns the High-End definition for "high-end"', () => {
    const def = getRestaurantDefinition('high-end');
    expect(def.type).toBe('high-end');
  });

  it('returns the Boss definition for "boss"', () => {
    const def = getRestaurantDefinition('boss');
    expect(def.type).toBe('boss');
  });

  it('throws for an invalid type', () => {
    // @ts-expect-error — intentionally invalid type for runtime guard test
    expect(() => getRestaurantDefinition('invalid')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getRestaurantAtIndex
// ---------------------------------------------------------------------------

describe('getRestaurantAtIndex', () => {
  it('index 0 returns Chain', () => {
    expect(getRestaurantAtIndex(0).type).toBe('chain');
  });

  it('index 1 returns Local', () => {
    expect(getRestaurantAtIndex(1).type).toBe('local');
  });

  it('index 2 returns High-End', () => {
    expect(getRestaurantAtIndex(2).type).toBe('high-end');
  });

  it('index 3 returns Boss', () => {
    expect(getRestaurantAtIndex(3).type).toBe('boss');
  });

  it('throws for index -1', () => {
    expect(() => getRestaurantAtIndex(-1)).toThrow();
  });

  it('throws for index 4', () => {
    expect(() => getRestaurantAtIndex(4)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getEffectiveServingInterval
// ---------------------------------------------------------------------------
// Formula: base - SERVING_SPEED_REDUCTION_PER_CYCLE(0.5) × min(cycle-1, cap-1(2))
// Cycle 1: −0s, Cycle 2: −0.5s, Cycle 3+: −1.0s

describe('getEffectiveServingInterval', () => {
  describe('Chain (base=8)', () => {
    it('cycle 1 → 8.0s (no reduction)', () => {
      const def = getRestaurantDefinition('chain');
      expect(getEffectiveServingInterval(def, 1)).toBeCloseTo(8.0, 5);
    });

    it('cycle 2 → 7.5s (−0.5s)', () => {
      const def = getRestaurantDefinition('chain');
      expect(getEffectiveServingInterval(def, 2)).toBeCloseTo(7.5, 5);
    });

    it('cycle 3 → 7.0s (−1.0s, capped)', () => {
      const def = getRestaurantDefinition('chain');
      expect(getEffectiveServingInterval(def, 3)).toBeCloseTo(7.0, 5);
    });

    it('cycle 10 → 7.0s (still capped at −1.0s)', () => {
      const def = getRestaurantDefinition('chain');
      expect(getEffectiveServingInterval(def, 10)).toBeCloseTo(7.0, 5);
    });
  });

  describe('Boss (base=3)', () => {
    it('cycle 1 → 3.0s', () => {
      const def = getRestaurantDefinition('boss');
      expect(getEffectiveServingInterval(def, 1)).toBeCloseTo(3.0, 5);
    });

    it('cycle 2 → 2.5s', () => {
      const def = getRestaurantDefinition('boss');
      expect(getEffectiveServingInterval(def, 2)).toBeCloseTo(2.5, 5);
    });

    it('cycle 3 → 2.0s (min; never ≤ 0)', () => {
      const def = getRestaurantDefinition('boss');
      expect(getEffectiveServingInterval(def, 3)).toBeCloseTo(2.0, 5);
    });
  });

  it('result is always > 0 for all restaurants at all cycles up to 20', () => {
    for (const def of RESTAURANT_DEFINITIONS) {
      for (let cycle = 1; cycle <= 20; cycle++) {
        expect(getEffectiveServingInterval(def, cycle)).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getEffectiveSweetSpot
// ---------------------------------------------------------------------------
// Formula: max(SWEET_SPOT_MINIMUM(0.1), base - SWEET_SPOT_REDUCTION_PER_CYCLE(0.3) × min(cycle-1, cap-1(4)))
// Cap cycle = 5 → max increments = 4 → max reduction = 1.2s

describe('getEffectiveSweetSpot', () => {
  it('cycle 1 returns base unchanged', () => {
    expect(getEffectiveSweetSpot(2, 1)).toBeCloseTo(2.0, 5);
  });

  it('cycle 2 reduces by 0.3s', () => {
    expect(getEffectiveSweetSpot(2, 2)).toBeCloseTo(1.7, 5);
  });

  it('cycle 5 reduces by 1.2s (max reduction, 4 × 0.3)', () => {
    expect(getEffectiveSweetSpot(2, 5)).toBeCloseTo(0.8, 5);
  });

  it('cycle 10 still returns same as cycle 5 (capped)', () => {
    expect(getEffectiveSweetSpot(2, 10)).toBeCloseTo(getEffectiveSweetSpot(2, 5), 5);
  });

  it('result never goes below SWEET_SPOT_MINIMUM (0.1) even with a very small base', () => {
    // base=0.2 at cycle 5: 0.2 - 1.2 = −1.0 → should floor to 0.1
    expect(getEffectiveSweetSpot(0.2, 5)).toBeCloseTo(0.1, 5);
  });

  it('result is always ≥ SWEET_SPOT_MINIMUM (0.1) for a range of bases and cycles', () => {
    const bases = [0.5, 1, 2, 3, 4];
    for (const base of bases) {
      for (let cycle = 1; cycle <= 10; cycle++) {
        expect(getEffectiveSweetSpot(base, cycle)).toBeGreaterThanOrEqual(0.1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getEffectivePenaltyMultiplier
// ---------------------------------------------------------------------------
// Formula: 1.0 + PENALTY_INCREASE_PER_CYCLE(0.10) × min(cycle-1, cap-1(4))
// Cycle 1 → 1.0; Cycle 2 → 1.1; Cycle 5 → 1.4; Cycle 6+ → 1.4 (capped)

describe('getEffectivePenaltyMultiplier', () => {
  it('cycle 1 returns 1.0 (baseline; no scaling)', () => {
    expect(getEffectivePenaltyMultiplier(1)).toBeCloseTo(1.0, 5);
  });

  it('cycle 2 returns 1.1', () => {
    expect(getEffectivePenaltyMultiplier(2)).toBeCloseTo(1.1, 5);
  });

  it('cycle 3 returns 1.2', () => {
    expect(getEffectivePenaltyMultiplier(3)).toBeCloseTo(1.2, 5);
  });

  it('cycle 4 returns 1.3', () => {
    expect(getEffectivePenaltyMultiplier(4)).toBeCloseTo(1.3, 5);
  });

  it('cycle 5 returns 1.4 (cap: 1.0 + 0.10 × 4)', () => {
    expect(getEffectivePenaltyMultiplier(5)).toBeCloseTo(1.4, 5);
  });

  it('cycle 6+ returns same as cycle 5 (capped at 1.4)', () => {
    expect(getEffectivePenaltyMultiplier(6)).toBeCloseTo(1.4, 5);
    expect(getEffectivePenaltyMultiplier(10)).toBeCloseTo(1.4, 5);
  });
});

// ---------------------------------------------------------------------------
// pickMeatRank
// ---------------------------------------------------------------------------

describe('pickMeatRank', () => {
  describe('Chain (common=1.0)', () => {
    it('always returns "common" regardless of random value', () => {
      const def = getRestaurantDefinition('chain');
      expect(pickMeatRank(def, () => 0.0)).toBe('common');
      expect(pickMeatRank(def, () => 0.5)).toBe('common');
      expect(pickMeatRank(def, () => 0.9999)).toBe('common');
    });
  });

  describe('Local (common=0.40, upper=0.60)', () => {
    const def = () => getRestaurantDefinition('local');

    it('returns "common" when random < 0.40', () => {
      expect(pickMeatRank(def(), () => 0.0)).toBe('common');
      expect(pickMeatRank(def(), () => 0.39)).toBe('common');
    });

    it('returns "upper" when random >= 0.40', () => {
      expect(pickMeatRank(def(), () => 0.40)).toBe('upper');
      expect(pickMeatRank(def(), () => 0.9999)).toBe('upper');
    });
  });

  describe('High-End (upper=0.30, premium=0.70)', () => {
    const def = () => getRestaurantDefinition('high-end');

    it('returns "upper" when random < 0.30', () => {
      expect(pickMeatRank(def(), () => 0.0)).toBe('upper');
      expect(pickMeatRank(def(), () => 0.29)).toBe('upper');
    });

    it('returns "premium" when random >= 0.30', () => {
      expect(pickMeatRank(def(), () => 0.30)).toBe('premium');
      expect(pickMeatRank(def(), () => 0.9999)).toBe('premium');
    });
  });

  describe('Boss (premium=0.40, elite=0.60)', () => {
    const def = () => getRestaurantDefinition('boss');

    it('returns "premium" when random < 0.40', () => {
      expect(pickMeatRank(def(), () => 0.0)).toBe('premium');
      expect(pickMeatRank(def(), () => 0.39)).toBe('premium');
    });

    it('returns "elite" when random >= 0.40', () => {
      expect(pickMeatRank(def(), () => 0.40)).toBe('elite');
      expect(pickMeatRank(def(), () => 0.9999)).toBe('elite');
    });
  });

  it('result is always a valid MeatRank', () => {
    const validRanks = new Set(['common', 'upper', 'premium', 'elite']);
    for (const def of RESTAURANT_DEFINITIONS) {
      for (let i = 0; i < 10; i++) {
        const rank = pickMeatRank(def, Math.random);
        expect(validRanks.has(rank)).toBe(true);
      }
    }
  });

  it('is deterministic: same random() value yields same result', () => {
    const def = getRestaurantDefinition('boss');
    const fixed = () => 0.5;
    expect(pickMeatRank(def, fixed)).toBe(pickMeatRank(def, fixed));
  });
});

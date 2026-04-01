# Module Spec: Restaurant Definitions

## Purpose
Defines the 4 restaurant types as immutable typed constants, including their dish counts, serving speeds, rank distributions, and the difficulty scaling formulas applied per cycle.

## File Path
`src/game/data/restaurants.ts`

## Dependencies
- `src/types/index.ts` — `RestaurantDefinition`, `RestaurantType`, `MeatRank`, `PenaltyType`
- `src/game/data/constants.ts` — all numeric scaling constants

> All numeric constants (dish counts, serving intervals, scaling values) are defined in `data-constants.spec.md` and imported from there. Do not redefine them here.

---

## Exports

### `RESTAURANT_CYCLE_ORDER`: `readonly RestaurantType[]`
```ts
export const RESTAURANT_CYCLE_ORDER: readonly RestaurantType[] = [
  'chain',
  'local',
  'high-end',
  'boss',
] as const;
```
- Fixed; never shuffled
- Cycle number increments after every Boss clear
- `restaurantIndex` in `GameState` is the 0-based index into this array (0=chain, 1=local, 2=high-end, 3=boss)

---

### Scaling Formulas

All scaling starts from cycle 2; cycle 1 is baseline (no reduction applied).

```
effectiveSweetSpot(base, cycleNumber) =
  max(SWEET_SPOT_MINIMUM,
      base - SWEET_SPOT_REDUCTION_PER_CYCLE × min(cycleNumber - 1, SWEET_SPOT_SCALING_CAP_CYCLE - 1))

effectiveServingInterval(base, cycleNumber) =
  base - SERVING_SPEED_REDUCTION_PER_CYCLE × min(cycleNumber - 1, SERVING_SPEED_SCALING_CAP_CYCLE - 1)
  // Reduction shortens the interval; result is always > 0

effectivePenaltyMultiplier(cycleNumber) =
  1.0 + PENALTY_INCREASE_PER_CYCLE × min(cycleNumber - 1, PENALTY_SCALING_CAP_CYCLE - 1)
```

**Serving speed cap derivation:**
- Cap cycle = `SERVING_SPEED_SCALING_CAP_CYCLE` = 3
- Max increments applied = cap - 1 = 2
- Max total reduction = 2 × `SERVING_SPEED_REDUCTION_PER_CYCLE` = 2 × 0.5 = **−1.0s**
- Formula: `min((cycleNumber - 1), SERVING_SPEED_SCALING_CAP_CYCLE - 1) × SERVING_SPEED_REDUCTION_PER_CYCLE`
- At cycle 1: 0s reduction; cycle 2: −0.5s; cycle 3+: −1.0s (floor)

At cycle 1: penalty multiplier = 1.0 (baseline; no scaling applied).

---

### `RESTAURANT_DEFINITIONS`: `readonly RestaurantDefinition[]`
All 4 restaurant definitions. Order matches `RESTAURANT_CYCLE_ORDER`.

---

#### Chain (チェーン店)
```
type:             'chain'
nameJP:           'チェーン店'
totalDishes:      DISHES_PER_RESTAURANT.CHAIN      (8)   // [TUNE]
servingInterval:  SERVING_INTERVALS.CHAIN           (8)   // [TUNE] base seconds at cycle 1
rankDistribution:
  common:  1.0
  upper:   0.0
  premium: 0.0
  elite:   0.0
activePenalties:  ['table-overflow']  // only table overflow is active at Chain
```

---

#### Local (個人店)
```
type:             'local'
nameJP:           '個人店'
totalDishes:      DISHES_PER_RESTAURANT.LOCAL       (12)  // [TUNE]
servingInterval:  SERVING_INTERVALS.LOCAL            (6)   // [TUNE]
rankDistribution:
  common:  0.40
  upper:   0.60
  premium: 0.00
  elite:   0.00
activePenalties:  ['table-overflow', 'staff-warning']
```
- Staff Warning becomes an active penalty type here (counter behavior same as always, but debuff activates)

---

#### High-End (高級店)
```
type:             'high-end'
nameJP:           '高級店'
totalDishes:      DISHES_PER_RESTAURANT.HIGH_END    (10)  // [TUNE]
servingInterval:  SERVING_INTERVALS.HIGH_END         (5)   // [TUNE]
rankDistribution:
  common:  0.00
  upper:   0.30
  premium: 0.70
  elite:   0.00
activePenalties:  ['table-overflow', 'staff-warning', 'grill-fire']
```
- Grill Fire game-over condition (escalation after `GRILL_FIRE_GAME_OVER_THRESHOLD` seconds) staged to unlock here

---

#### Boss (ボス店舗)
```
type:             'boss'
nameJP:           'ボス店舗'
totalDishes:      DISHES_PER_RESTAURANT.BOSS        (15)  // [TUNE]
servingInterval:  SERVING_INTERVALS.BOSS             (3)   // [TUNE]
rankDistribution:
  common:  0.00
  upper:   0.00
  premium: 0.40
  elite:   0.60
activePenalties:  ['table-overflow', 'staff-warning', 'grill-fire', 'raw-meat']
```
- Raw Meat Paralysis (action-disable → overflow) game-over condition staged to unlock here
- Rapid serving (3s base) is the primary threat

---

## Functions

### `getRestaurantDefinition(type: RestaurantType): RestaurantDefinition`
- Returns the `RestaurantDefinition` for the given type
- Throws if type is invalid
- Pure function

### `getRestaurantAtIndex(cycleRestaurantIndex: number): RestaurantDefinition`
- `cycleRestaurantIndex` is 0–3; indexes into `RESTAURANT_CYCLE_ORDER`
- Returns the corresponding definition
- Throws if index is out of range

### `getEffectiveServingInterval(definition: RestaurantDefinition, cycleNumber: number): number`
- Returns the serving interval in seconds after applying cycle-based speed scaling
- Formula: `definition.servingInterval - SERVING_SPEED_REDUCTION_PER_CYCLE × min(cycleNumber - 1, SERVING_SPEED_SCALING_CAP_CYCLE - 1)`
- Maximum total reduction is `(SERVING_SPEED_SCALING_CAP_CYCLE - 1) × SERVING_SPEED_REDUCTION_PER_CYCLE` = 1.0s
- Result is always > 0 (Boss at max reduction = 3s − 1.0s = 2.0s)
- Pure function

### `getEffectiveSweetSpot(baseSweetSpot: number, cycleNumber: number): number`
- Returns the adjusted sweet_spot duration after cycle scaling
- Result is floored at `SWEET_SPOT_MINIMUM`
- Pure function

### `getEffectivePenaltyMultiplier(cycleNumber: number): number`
- Returns the penalty severity multiplier for the given cycle
- At cycle 1: `1.0`; at cycle 5+: `1.0 + PENALTY_INCREASE_PER_CYCLE × 4 = 1.40`
- Pure function

### `pickMeatRank(definition: RestaurantDefinition, random: () => number): MeatRank`
- Selects a `MeatRank` for a newly served meat dish based on `definition.rankDistribution`
- `random` is an injected random function (e.g., `Math.random`) — enables deterministic testing
- Each call is an independent roll; previous results have no influence
- Pure function (given a fixed `random()` value, result is deterministic)

---

## Invariants

- `RESTAURANT_DEFINITIONS.length === 4`
- `RESTAURANT_CYCLE_ORDER.length === 4`
- For every `RestaurantDefinition`, `Object.values(rankDistribution)` sum to exactly `1.0` (within floating-point tolerance of ±0.001)
- Chain `rankDistribution.common === 1.0` — only Common rank
- Local `rankDistribution.elite === 0.0 && rankDistribution.premium === 0.0`
- High-End `rankDistribution.common === 0.0 && rankDistribution.elite === 0.0`
- Boss `rankDistribution.common === 0.0 && rankDistribution.upper === 0.0`
- `getEffectiveServingInterval` never returns a value ≤ 0
- `getEffectiveSweetSpot` never returns a value < `SWEET_SPOT_MINIMUM`
- All numeric literal values in `RESTAURANT_DEFINITIONS` reference named constants from `data-constants.ts` — no inline magic numbers
- All data arrays are `as const` (readonly; fields are not reassignable at compile time)

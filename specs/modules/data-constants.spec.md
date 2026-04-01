# Module Spec: Game-Wide Constants

## Purpose
Single source of truth for all numeric game parameters that are referenced across multiple modules. All values are [TUNE] unless explicitly noted as fixed by design. **No other spec file may redefine a constant already listed here.**

## File Path
`src/game/data/constants.ts`

## Dependencies
- None (this module has no imports; other modules import from here)

---

## Constants

### Grill System

```ts
/** Initial number of grill slots at run start. */
export const INITIAL_GRILL_SLOTS = 3; // [TUNE]

/** Table capacity (dishes waiting to be grilled) at run start. */
export const INITIAL_TABLE_CAPACITY = 5; // [TUNE]

/** Grill time (seconds per state transition). */
export const GRILL_TIME = {
  SHORT:     3,  // [TUNE]
  MEDIUM:    5,  // [TUNE]
  LONG:      8,  // [TUNE]
  VERY_LONG: 12, // [TUNE]
} as const;

/** Flare risk (probability per second of state-time acceleration). */
export const FLARE_RISK = {
  NONE:      0,    // vegetables — no flare check performed
  LOW:       0.05, // [TUNE]
  MEDIUM:    0.20, // [TUNE]
  HIGH:      0.40, // [TUNE]
  VERY_HIGH: 0.60, // [TUNE]
} as const;

/** Sweet spot (well-done window duration in seconds). */
export const SWEET_SPOT = {
  VERY_NARROW: 0.5, // [TUNE]
  NARROW:      1,   // [TUNE]
  MEDIUM:      2,   // [TUNE]
  WIDE:        3,   // [TUNE]
  VERY_WIDE:   4,   // [TUNE]
} as const;

/**
 * When the Flip action is performed, timeInState is reset to this fraction
 * of the full state duration (e.g., 0.5 → reset to 50% remaining).
 */
export const FLIP_TIMER_RESET_FRACTION = 0.5; // [TUNE]

/** Minimum sweet_spot window after all scaling applied (prevents zero or negative windows). */
export const SWEET_SPOT_MINIMUM = 0.1; // seconds [TUNE]

/** Interval in seconds between flare risk checks per grill slot. */
export const FLARE_RISK_CHECK_INTERVAL = 1; // check once per second [TUNE]
```

### Penalty Durations

```ts
/** How long the player's actions are disabled after eating raw meat (seconds). */
export const RAW_MEAT_DISABLE_DURATION = 3; // [TUNE]

/** How long a grill slot is disabled after a Grill Fire triggers (seconds). */
export const GRILL_FIRE_DISABLE_DURATION = 10; // [TUNE]

/**
 * How long burnt meat must remain on a slot before escalating to a Grill Fire
 * game-over condition (seconds).
 * Active from High-End restaurants onward (staged unlock).
 */
export const GRILL_FIRE_GAME_OVER_THRESHOLD = 15; // [TUNE]
```

### Staff Warning System

```ts
/** Staff Warning counter value at which the first speed debuff activates (without Charming Personality). */
export const STAFF_WARNING_THRESHOLD = 3; // [TUNE]

/** Staff Warning counter value at which the stacked (stronger) speed debuff activates (without Charming Personality). */
export const STAFF_WARNING_STACK_THRESHOLD = 5; // [TUNE]

/** Speed penalty fraction applied at the first Staff Warning threshold (0.20 = −20% speed). */
export const STAFF_WARNING_DEBUFF = 0.20; // [TUNE]

/** Speed penalty fraction applied at the stacked Staff Warning threshold (0.40 = −40% speed). */
export const STAFF_WARNING_STACK_DEBUFF = 0.40; // [TUNE]
```

### Charming Personality — Raised Thresholds

```ts
/** Staff Warning threshold for first debuff activation when Charming Personality is held. */
export const CHARMING_FIRST_THRESHOLD = 5; // [TUNE]

/** Staff Warning threshold for stacked debuff activation when Charming Personality is held. */
export const CHARMING_STACK_THRESHOLD = 7; // [TUNE]
```

### Skill Effects

```ts
/** Seconds before burnt-state transition at which Heat Sensor fires a visual warning. */
export const HEAT_SENSOR_WARNING_SECONDS = 2; // [TUNE]

/** Grill slots added per Extra Slot acquisition. */
export const EXTRA_SLOT_COUNT = 2; // [TUNE]

/** Table capacity added per Table Extension acquisition. */
export const TABLE_EXTENSION_COUNT = 3; // [TUNE]

/** Eating time multiplier for Speed Eater (0.70 = −30% eat time). */
export const SPEED_EATER_MULTIPLIER = 0.70; // [TUNE]

/** Serving interval reduction (seconds) per Quick Order acquisition. */
export const QUICK_ORDER_INTERVAL_REDUCTION = 1; // [TUNE]

/** Instant Exchange cost multiplier for Exchange Discount (0.70 = −30% cost). */
export const EXCHANGE_DISCOUNT_MULTIPLIER = 0.70; // [TUNE]

/** Raw meat action-disable duration multiplier for Raw Tolerance (0.30 = −70% penalty). */
export const RAW_TOLERANCE_MULTIPLIER = 0.30; // [TUNE]

/** Grill fire disable duration multiplier for Fire Control (0.50 = halved). */
export const FIRE_CONTROL_MULTIPLIER = 0.50; // [TUNE]

/** Seconds after which Fire Control auto-extinguishes a grill fire. */
export const FIRE_CONTROL_AUTO_EXTINGUISH_SECONDS = 5; // [TUNE]

/** Staff Warning counter decrease per restaurant cleared (Regular Customer). */
export const REGULAR_CUSTOMER_WARNING_REDUCTION = 1; // [TUNE]

/** Speed multiplier applied when VIP Status replaces the Staff Warning debuff with a buff. */
export const VIP_STATUS_SPEED_BUFF = 1.1; // [TUNE]
```

### Difficulty Scaling

```ts
/**
 * sweet_spot reduction per cycle starting from cycle 2 (in seconds; positive value subtracted).
 * Applied as: effectiveSweetSpot = base - SWEET_SPOT_REDUCTION_PER_CYCLE × min(cycle - 1, cap - 1)
 */
export const SWEET_SPOT_REDUCTION_PER_CYCLE = 0.3; // [TUNE]

/** Cycle at which sweet_spot scaling caps (inclusive). Reduction does not increase after this cycle. */
export const SWEET_SPOT_SCALING_CAP_CYCLE = 5; // [TUNE]

/** Penalty severity increase per cycle (fraction; e.g., 0.10 = +10%). */
export const PENALTY_INCREASE_PER_CYCLE = 0.10; // [TUNE]

/** Cycle at which penalty scaling caps (inclusive). */
export const PENALTY_SCALING_CAP_CYCLE = 5; // [TUNE]

/**
 * Serving interval reduction per cycle starting from cycle 2 (in seconds; positive value subtracted).
 * Applied as: effectiveInterval = base - SERVING_SPEED_REDUCTION_PER_CYCLE × min(cycle - 1, cap - 1)
 */
export const SERVING_SPEED_REDUCTION_PER_CYCLE = 0.5; // [TUNE]

/**
 * Cycle at which serving speed scaling caps (inclusive).
 * Max total reduction = (SERVING_SPEED_SCALING_CAP_CYCLE - 1) × SERVING_SPEED_REDUCTION_PER_CYCLE
 *                     = (3 - 1) × 0.5 = 1.0s
 */
export const SERVING_SPEED_SCALING_CAP_CYCLE = 3; // [TUNE]

/**
 * Maximum total serving interval reduction across all cycles.
 * Derived: (SERVING_SPEED_SCALING_CAP_CYCLE - 1) × SERVING_SPEED_REDUCTION_PER_CYCLE = 1.0s
 */
export const SERVING_SPEED_MAX_REDUCTION = 1.0; // derived
```

### Economy

```ts
/** Coins awarded for clearing any restaurant (base income, all builds). */
export const BASE_RESTAURANT_CLEAR_COINS = 10; // [TUNE]

/** Cost to purchase a skill in the Shop (1 of 3 random choices). */
export const SKILL_PURCHASE_COST = 20; // [TUNE]

/** Cost to purchase a consumable item in the Shop. */
export const CONSUMABLE_PURCHASE_COST = 10; // [TUNE]

/** Base coin cost for Instant Exchange (before Exchange Discount). */
export const INSTANT_EXCHANGE_BASE_COST = 5; // [TUNE]

/** Coins earned by Fast Eater's Wage per rare-state eat. */
export const FAST_EATER_WAGE_COINS = 3; // [TUNE]

/** Coins earned by Perfect Grill Bonus per well-done-state eat. */
export const PERFECT_GRILL_BONUS_COINS = 3; // [TUNE]

/** Coins earned by Tare Conversion per meat discard. */
export const TARE_CONVERSION_COINS = 2; // [TUNE]

/** Coins earned by Char Bonus per burnt meat discard (stacks with Tare Conversion). */
export const CHAR_BONUS_COINS = 3; // [TUNE]

/** Consecutive eat count required to trigger Eating Streak Bonus. */
export const EATING_STREAK_THRESHOLD = 5; // [TUNE]

/** Coins earned by Eating Streak Bonus per streak trigger. */
export const EATING_STREAK_BONUS_COINS = 5; // [TUNE]

/** Coins earned by Regular Customer Bonus for clearing a restaurant with 0 Staff Warnings. */
export const REGULAR_CUSTOMER_BONUS_COINS = 5; // [TUNE]

/** Coins earned by Slot Efficiency Bonus when all grill slots are simultaneously occupied. */
export const SLOT_EFFICIENCY_BONUS_COINS = 2; // [TUNE]

/** Coins earned by Quick Turnover Bonus for clearing a restaurant above throughput threshold. */
export const QUICK_TURNOVER_BONUS_COINS = 5; // [TUNE]

/** Dishes per minute threshold required to trigger Quick Turnover Bonus (exclusive: must exceed, not equal). */
export const QUICK_TURNOVER_DPM_THRESHOLD = 2.5; // [TUNE]

/** Vegetable coin multiplier for Vegan Tashiro. */
export const VEGETABLE_COIN_MULTIPLIER = 3; // [TUNE]
```

### Restaurant

```ts
/** Total meat dishes required to clear each restaurant type. */
export const DISHES_PER_RESTAURANT = {
  CHAIN:    8,  // [TUNE]
  LOCAL:    12, // [TUNE]
  HIGH_END: 10, // [TUNE]
  BOSS:     15, // [TUNE]
} as const;

/** Base serving interval (seconds between dishes) per restaurant type at cycle 1. */
export const SERVING_INTERVALS = {
  CHAIN:    8, // [TUNE]
  LOCAL:    6, // [TUNE]
  HIGH_END: 5, // [TUNE]
  BOSS:     3, // [TUNE]
} as const;

/** Probability a dish served is a vegetable (instead of meat). */
export const VEGETABLE_INSERT_CHANCE = 0.20; // [TUNE]

/** Number of restaurants per cycle (Chain, Local, High-End, Boss). Design-fixed. */
export const RESTAURANT_CYCLE_LENGTH = 4; // Design-fixed
```

### Character Modifiers

```ts
/** Sweet_spot bonus (seconds) applied by Gourmet Critic to Premium and Elite ranks. */
export const GOURMET_SWEET_SPOT_BONUS = 1; // [TUNE]

/** Gourmet Critic coin multiplier for Common-rank meat (0.50 = 50% of base value). */
export const GOURMET_COMMON_COIN_MULTIPLIER = 0.50; // [TUNE]

/** Competitive Eater eating time multiplier (0.50 = 50% of base duration). */
export const COMPETITIVE_EATER_SPEED_MULTIPLIER = 0.50; // [TUNE]

/** Competitive Eater sweet_spot narrowing multiplier (0.80 = 80% of base window). */
export const COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER = 0.80; // [TUNE]

/** Staff Warning increment when Vegan Tashiro eats any meat. */
export const VEGAN_MEAT_EAT_WARNING_PENALTY = 2; // [TUNE]
```

### Binge System

```ts
/** Consecutive eat count required for Binge Mode trigger when Digestive Pro is held. */
export const DIGESTIVE_PRO_STREAK_THRESHOLD = 3; // [TUNE]
```

### Skill Selection

```ts
/** Number of skill choices presented after each restaurant clear. */
export const SKILL_CHOICE_COUNT = 3; // Design-fixed

/** Duration of a Delayed Exchange slot occupation (seconds). */
export const DELAYED_EXCHANGE_DURATION = 5; // [TUNE]
```

### Node System

```ts
/**
 * Node frequency per cycle: a node appears after every N restaurants.
 * Index = cycleNumber - 1 (0-based).
 * Cycle 3 value is the floor for all subsequent cycles.
 */
export const NODE_FREQUENCY_BY_CYCLE: readonly number[] = [
  1, // cycle 1: node after every 1 restaurant
  2, // cycle 2: node after every 2 restaurants
  3, // cycle 3+: node after every 3 restaurants (floor)
] as const;

/** Minimum node frequency (floor); used for cycle 3 and all higher cycles. */
export const NODE_FREQUENCY_FLOOR = 3; // [TUNE]

/** Node frequency for cycle 1: a node appears after every 1 restaurant. */
export const NODE_FREQUENCY_CYCLE_1 = 1; // [TUNE]

/** Node frequency for cycle 2: a node appears after every 2 restaurants. */
export const NODE_FREQUENCY_CYCLE_2 = 2; // [TUNE]

/** Node frequency for cycle 3 and above: a node appears after every 3 restaurants. */
export const NODE_FREQUENCY_CYCLE_3_PLUS = 3; // [TUNE]
```

### True Ending

```ts
/** Cycle number at which clearing the Boss restaurant triggers the True Ending. */
export const TRUE_ENDING_CYCLE = 4; // Design-fixed; not tunable
```

### Persistence

```ts
/** localStorage key for persistent save state. */
export const STORAGE_KEY_PERSISTENT = 'yakiniku-roguelike-save';

/** Schema version for PersistentState migrations. Increment when PersistentState shape changes. */
export const PERSISTENT_STATE_VERSION = 1;
```

---

## Invariants

- All exported values are `const` (not `let`); runtime values are frozen
- No value in this file depends on any other game module (no imports)
- `NODE_FREQUENCY_BY_CYCLE[NODE_FREQUENCY_BY_CYCLE.length - 1] === NODE_FREQUENCY_FLOOR` — the floor value is consistent
- `STAFF_WARNING_THRESHOLD < STAFF_WARNING_STACK_THRESHOLD` — thresholds are strictly ordered
- `CHARMING_FIRST_THRESHOLD < CHARMING_STACK_THRESHOLD` — same ordering for Charming variant
- `STAFF_WARNING_THRESHOLD < CHARMING_FIRST_THRESHOLD` — Charming raises thresholds above base
- `STAFF_WARNING_STACK_THRESHOLD < CHARMING_STACK_THRESHOLD` — same for stacked
- `SWEET_SPOT_MINIMUM > 0` — effective sweet_spot window is always a positive duration
- `BASE_RESTAURANT_CLEAR_COINS > 0` — every player earns at least some coins per restaurant
- `DIGESTIVE_PRO_STREAK_THRESHOLD < EATING_STREAK_THRESHOLD` — Digestive Pro reduces the threshold
- All constants with `*_MULTIPLIER` suffix represent a multiplicative factor (never a raw reduction)
- All constants with `*_REDUCTION_PER_CYCLE` suffix are positive values (subtracted by the formula, not added)
- No other spec file may define a constant whose semantic meaning duplicates a constant defined here
- All [TUNE]-marked values must have exactly one definition (here); no duplication as a magic number elsewhere in the codebase

# Module Spec: Coin Economy

## Purpose
All coin award and cost calculations for the economy system. Each function takes the current game state and returns a new state with an updated coin balance.

## File Path
`src/game/systems/economy.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `GrillingState`, `MeatPart`, `Part`
- `src/game/systems/skill.ts` — `hasSkill`
- `src/game/data/constants.ts` — all numeric constants

---

## Constants

All constants are imported from `src/game/data/constants.ts`. No separate `src/game/data/economy.ts` file.

```ts
// Referenced from data-constants — all values are [TUNE]
// BASE_RESTAURANT_CLEAR_COINS = 10
// REGULAR_CUSTOMER_BONUS_COINS = 5          awarded when clearing with 0 staff warnings
// FAST_EATER_WAGE_COINS = 3                 per rare-state meat eat
// PERFECT_GRILL_BONUS_COINS = 3             per well-done meat eat
// TARE_CONVERSION_COINS = 2                 per any meat discard
// CHAR_BONUS_COINS = 3                      additional coins for burnt meat discard
// EATING_STREAK_BONUS_COINS = 5             every EATING_STREAK_THRESHOLD consecutive eats
// EATING_STREAK_THRESHOLD = 5               consecutive eats required per trigger
// SLOT_EFFICIENCY_BONUS_COINS = 2           all slots occupied simultaneously
// QUICK_TURNOVER_BONUS_COINS = 5            clearing above dishes-per-minute threshold
// QUICK_TURNOVER_DPM_THRESHOLD = 2.5        dishes per minute required (exclusive threshold)
// INSTANT_EXCHANGE_BASE_COST = 5            base coin cost for Instant Exchange
// VEGETABLE_COIN_MULTIPLIER = 3             Vegan Tashiro coin multiplier for vegetables
```

---

## Functions

### `awardRestaurantClearCoins(state: GameState): GameState`
- **Purpose**: Awards coins for clearing a restaurant. Always awards the base clear amount; additionally awards the Regular Customer Bonus if applicable.
- **Preconditions**:
  - Called exactly once when `restaurant.isCleared` transitions to `true`.
  - `state.coins >= 0`.
- **Postconditions**:
  - Returns a new `GameState` with `coins` increased by `BASE_RESTAURANT_CLEAR_COINS`.
  - If `hasSkill(state, 'regular-customer-bonus')` AND `state.staffWarningCount === 0`: additionally increases `coins` by `REGULAR_CUSTOMER_BONUS_COINS`.
  - If `hasSkill(state, 'regular-customer')`: decrements `staffWarningCount` by 1 (floored at 0). This decrement is applied after the Regular Customer Bonus check — whether to award the bonus is based on the count *at the moment of clearing*, before Regular Customer's reduction.
  - Does not affect `score` — that is the engine's responsibility.
- **Edge cases**:
  - If Regular Customer Bonus condition is met AND Regular Customer skill is also held: bonus fires first (count is 0), then count is decremented (stays at 0, floored).
  - Coin balance cannot exceed any hard cap if one is defined; otherwise no upper bound.

---

### `awardEatCoins(state: GameState, meatState: GrillingState, meat: Part): GameState`
- **Purpose**: Awards coins triggered by a successful eat action, based on the current grilling state of the dish and held skills.
- **Preconditions**:
  - `meatState` is one of `'raw' | 'rare' | 'medium' | 'well-done'` (burnt meat cannot be eaten).
  - `meat` is the `Part` being eaten.
- **Postconditions**:
  - **Fast Eater's Wage**: if `hasSkill(state, 'fast-eaters-wage')` AND `meatState === 'rare'` AND `!meat.isVegetable`: awards `FAST_EATER_WAGE_COINS`.
  - **Perfect Grill Bonus**: if `hasSkill(state, 'perfect-grill-bonus')` AND `meatState === 'well-done'` AND `!meat.isVegetable`: awards `PERFECT_GRILL_BONUS_COINS`.
  - **Vegan Tashiro vegetable coins**: if `state.character === 'vegan-tashiro'` AND `meat.isVegetable`: awards `VEGETABLE_COIN_MULTIPLIER` coins (the multiplier value is the coin amount for Vegan Tashiro). Non-Vegan characters earn 0 coins from vegetable eats.
  - Multiple award sources in a single eat are additive (e.g., if both Fast Eater's Wage and a future mechanic apply, both are added).
  - Returns new `GameState` with updated `coins`.
- **Edge cases**:
  - Vegetable eaten in `rare` state by a player with Fast Eater's Wage: no Fast Eater's Wage bonus (skill specifies meat only).
  - Vegetable eaten in `well-done` state by a player with Perfect Grill Bonus: no bonus (skill specifies meat only).
  - Vegan Tashiro eating meat does NOT award coins here — the character penalty (+2 staff warnings) is handled by the penalty system; no coin income is granted for meat eats by Vegan Tashiro.
  - `meatState === 'raw'`: eligible for Fast Eater's Wage only if state is `'rare'`; raw state does not trigger any eat-coin bonus.

---

### `awardDiscardCoins(state: GameState, meat: Part, meatState: GrillingState): GameState`
- **Purpose**: Awards coins triggered by a discard action, based on held skills and the current grilling state of the discarded dish. Returns ONLY coin changes — does NOT touch `staffWarningCount`. Staff warning management on discard is handled by the caller (engine/grilling system).
- **Preconditions**:
  - `meatState` is any valid `GrillingState` (all states can be discarded).
  - `meat` is the `Part` being discarded.
- **Postconditions**:
  - **Tare Conversion**: if `hasSkill(state, 'tare-conversion')` AND `!meat.isVegetable`: awards `TARE_CONVERSION_COINS`.
  - **Char Bonus**: if `hasSkill(state, 'char-bonus')` AND `!meat.isVegetable` AND `meatState === 'burnt'`: awards `CHAR_BONUS_COINS` in addition to Tare Conversion (if held).
  - **Stacking**: if both Tare Conversion and Char Bonus are held and `meatState === 'burnt'`: both coin rewards apply (total = `TARE_CONVERSION_COINS + CHAR_BONUS_COINS`).
  - **Vegetable discards**: neither Tare Conversion nor Char Bonus applies; vegetable discards are neutral (no coins). Staff Warning is also NOT incremented for vegetable discards — the caller handles this check.
  - Returns new `GameState` with updated `coins` only. `staffWarningCount` is never modified by this function.
- **Edge cases**:
  - Char Bonus alone (no Tare Conversion) on a non-burnt discard: no coins awarded.
  - Tare Conversion alone on a burnt discard: only `TARE_CONVERSION_COINS` awarded; Char Bonus does not fire.
  - Discard Pro and Tare Conversion held together: Tare Conversion still awards coins; the caller uses Discard Pro to decide whether to suppress the staff warning increment independently.
  - The caller is responsible for checking `hasSkill(state, 'tare-conversion')`, `hasSkill(state, 'discard-pro')`, and `meat.isVegetable` to determine whether `staffWarningCount` should be incremented. This function does not perform that check.

---

### `awardStreakCoins(state: GameState): GameState`
- **Purpose**: Awards Eating Streak Bonus coins when `consecutiveEatCount` reaches a multiple of `EATING_STREAK_THRESHOLD`.
- **Preconditions**:
  - Called after `state.consecutiveEatCount` has been incremented by the eating action.
  - `hasSkill(state, 'eating-streak-bonus')` check is performed internally.
- **Postconditions**:
  - If `hasSkill(state, 'eating-streak-bonus')` AND `state.consecutiveEatCount % EATING_STREAK_THRESHOLD === 0` AND `state.consecutiveEatCount > 0`: awards `EATING_STREAK_BONUS_COINS`.
  - Bonus fires at every multiple of 5 (5th, 10th, 15th consecutive eat, etc.).
  - Returns new `GameState` with updated `coins`.
- **Edge cases**:
  - Streak counter of 0 never triggers bonus (division guard prevents false positive).
  - If Eating Streak Bonus skill is not held, returns state unchanged.
  - Streak counter reset (e.g., after a discard) is managed by the engine; this function only awards coins based on the current streak value.

---

### `awardSlotEfficiencyCoins(state: GameState): GameState`
- **Purpose**: Awards Slot Efficiency Bonus coins when all grill slots become simultaneously occupied for the first time (edge-triggered).
- **Preconditions**:
  - Called after a dish is placed onto a grill slot (i.e., after the slot array is updated).
  - `hasSkill(state, 'slot-efficiency-bonus')` check is performed internally.
- **Postconditions**:
  - Compute `allFull`: `true` if every non-disabled slot in `state.grill` has `part !== null`.
  - If `hasSkill(state, 'slot-efficiency-bonus')` AND `allFull === true` AND `state.allSlotsOccupiedLastTick === false`: awards `SLOT_EFFICIENCY_BONUS_COINS` (edge-triggered: fires only on the transition from not-full → full).
  - Returns new `GameState` with updated `coins`. The engine updates `allSlotsOccupiedLastTick` to `allFull` each tick AFTER calling this function.
- **Edge cases**:
  - Disabled slots are excluded from the occupancy check; only non-disabled slots must be non-null to satisfy `allFull`.
  - If all non-disabled slots are occupied for multiple consecutive ticks, the bonus fires only once (on the first tick where `allSlotsOccupiedLastTick` was `false`).
  - If `state.grill` count changes (Extra Slot acquired), the threshold scales to the new total automatically (all slots checked dynamically).

---

### `awardQuickTurnoverCoins(state: GameState): GameState`
- **Purpose**: Awards Quick Turnover Bonus coins when a restaurant is cleared above the dishes-per-minute threshold. Uses game-time seconds (not wall-clock) for a pure, testable calculation.
- **Preconditions**:
  - Called at the moment `restaurant.isCleared` transitions to `true`, before returning to idle phase.
  - `hasSkill(state, 'quick-turnover-bonus')` check is performed internally.
  - `state.restaurant.startTime` is the value of `state.elapsedTime` when the restaurant was created.
- **Postconditions**:
  - Computes restaurant duration in seconds as `state.elapsedTime - state.restaurant.startTime`.
  - Computes dishes-per-minute as `restaurant.meatDishesEaten / (durationSeconds / 60)`.
  - If `hasSkill(state, 'quick-turnover-bonus')` AND computed DPM > `QUICK_TURNOVER_DPM_THRESHOLD`: awards `QUICK_TURNOVER_BONUS_COINS`.
  - Returns new `GameState` with updated `coins`.
- **Edge cases**:
  - If `durationSeconds <= 0` (degenerate case — restaurant cleared on the same tick it started): clamp DPM to a large safe value (e.g., `Infinity`) so the bonus always fires; avoid division by zero.
  - Does not fire when DPM equals the threshold exactly (`>`, not `>=`). [TUNE]

---

### `getExchangeCost(state: GameState): number`
- **Purpose**: Returns the current Instant Exchange coin cost after applying any Exchange Discount.
- **Preconditions**: None.
- **Postconditions**:
  - Base cost is `INSTANT_EXCHANGE_BASE_COST`.
  - If `hasSkill(state, 'exchange-discount')`: returns `Math.floor(INSTANT_EXCHANGE_BASE_COST * EXCHANGE_DISCOUNT_MULTIPLIER)`.
  - Returns an integer ≥ 0 (floored, not rounded).
- **Edge cases**:
  - If Exchange Discount is not held, returns `INSTANT_EXCHANGE_BASE_COST` unchanged.
  - Delayed Exchange always costs 0 — this function is not called for Delayed Exchange.
  - Return value is never negative.

---

## Invariants

- `state.coins` is always ≥ 0 after any award function; award functions only add coins, never subtract.
- `awardDiscardCoins` is pure with respect to `staffWarningCount` — it never reads or writes that field. The caller is solely responsible for staff warning management on discard.
- Tare Conversion and Char Bonus both award coins on qualifying meat discards; having both held does not produce a negative counter.
- Vegetable discards never trigger any coin award from this module.
- `awardRestaurantClearCoins` fires exactly once per restaurant clear; calling it twice for the same clear would double-award — the engine must ensure single invocation.
- All coin amounts and thresholds are defined as named constants imported from `src/game/data/constants.ts`; no inline numeric literals appear in function bodies.
- Canonical `GameState` field names are used throughout: `state.character` (not `state.characterId`), `state.grill` (not `state.grillSlots`), `state.consecutiveEatCount` (not `state.consecutiveEatStreak`).

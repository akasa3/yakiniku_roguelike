# Module Spec: Skill System

## Purpose
Manages skill acquisition, ownership checks, and aggregated modifier computation for all held skills.

## File Path
`src/game/systems/skill.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `SkillDefinition`
- Note: `SkillModifiers` is defined locally in this module (not in types)
- `src/game/data/skills.ts` — `SKILLS: readonly SkillDefinition[]`
- `src/game/data/constants.ts` — all numeric constants

---

## Constants

All constants are imported from `src/game/data/constants.ts`. No local redefinitions.

```ts
// Referenced from data-constants — all values are [TUNE]
// SKILL_CHOICE_COUNT = 3                         number of choices offered post-restaurant / Shop
// EXTRA_SLOT_COUNT = 2                            grill slots added per Extra Slot acquisition
// TABLE_EXTENSION_COUNT = 3                       table capacity added per Table Extension acquisition
// FLIP_TIMER_RESET_FRACTION = 0.5                 flip resets timer to 50% of total state duration
// SPEED_EATER_MULTIPLIER = 0.70                   eating action time multiplier (×0.70, i.e. −30%)
// QUICK_ORDER_INTERVAL_REDUCTION = 1              seconds subtracted from serving interval
// EXCHANGE_DISCOUNT_MULTIPLIER = 0.70             Instant Exchange cost multiplier (×0.70, i.e. −30%)
// HEAT_SENSOR_WARNING_SECONDS = 2                 seconds before burning when warning fires
// RAW_TOLERANCE_MULTIPLIER = 0.30                 raw meat penalty duration multiplier (×0.30, i.e. −70%)
// CHARMING_FIRST_THRESHOLD = 5                    raised first debuff threshold
// CHARMING_STACK_THRESHOLD = 7                    raised stacked debuff threshold
// FIRE_CONTROL_MULTIPLIER = 0.5                   fire duration multiplier (×0.50, i.e. halved)
// FIRE_CONTROL_AUTO_EXTINGUISH_SECONDS = 5
// EATING_STREAK_THRESHOLD = 5                     consecutive eats required to trigger binge
// DIGESTIVE_PRO_STREAK_THRESHOLD = 3              reduced threshold when Digestive Pro is held
```

---

## Types

```ts
interface SkillModifiers {
  readonly grillSlotCount: number;                    // base 3 + Extra Slot increments
  readonly tableCapacity: number;                     // base 5 + Table Extension increments
  readonly eatingSpeedMultiplier: number;             // 1.0 = baseline; lower = faster
  readonly servingIntervalReduction: number;          // seconds to subtract from base interval
  readonly flipAvailable: boolean;                    // true if Tong Master is held
  readonly heatSensorEnabled: boolean;                // true if Heat Sensor is held
  readonly rawToleranceDurationMultiplier: number;    // 1.0 = no reduction; RAW_TOLERANCE_MULTIPLIER if held; 0.0 if Iron Stomach
  readonly rawPenaltyNegated: boolean;                // true if Iron Stomach held
  readonly staffWarningThreshold1: number;            // default 3; raised by Charming Personality
  readonly staffWarningThreshold2: number;            // default 5; raised by Charming Personality
  readonly discardProActive: boolean;                 // true if Discard Pro held
  readonly vipStatusActive: boolean;                  // true if VIP Status held
  readonly fireControlActive: boolean;                // true if Fire Control held
  readonly exchangeDiscountMultiplier: number;        // 1.0 = no discount; EXCHANGE_DISCOUNT_MULTIPLIER if Exchange Discount held
  readonly bingeMultiplierActive: boolean;            // true if Binge Mode held (managed via GameState.bingeNextDishDoubled)
  readonly digestiveProActive: boolean;               // true if Digestive Pro held
  readonly regularCustomerActive: boolean;            // true if Regular Customer held
  readonly eatingStreakThreshold: number;             // EATING_STREAK_THRESHOLD normally; DIGESTIVE_PRO_STREAK_THRESHOLD if Digestive Pro held
}
```

---

## Functions

### `generateSkillChoices(state: GameState, count: number): SkillDefinition[]`
- **Purpose**: Returns up to `count` random skill definitions that the player does not already own and are available in the general pool.
- **Preconditions**:
  - `count` is a positive integer (typically `SKILL_CHOICE_COUNT = 3`).
  - `SKILLS` contains all skill definitions in the general pool.
- **Postconditions**:
  - Returns an array of length `min(count, availableSkills.length)`.
  - No returned skill has its `id` in `state.skills`.
  - Available pool is filtered by `!state.skills.includes(skill.id)` — no `isStarterOnly` check (field removed from `SkillDefinition`).
  - Skills that are stackable (e.g., Extra Slot) may appear even if already held once — only non-stackable duplicates are excluded.
  - The selection is random (uniform distribution over available pool).
- **Edge cases**:
  - If the remaining pool has fewer than `count` skills, returns all remaining skills (no error).
  - If the pool is empty, returns `[]`.
  - Extra Slot (`isStackable: true`) may appear in choices even if already acquired; it is excluded only if the player holds the maximum permissible copies (if a cap is defined).

---

### `acquireSkill(state: GameState, skillId: string): GameState`
- **Purpose**: Adds `skillId` to `state.skills` and applies any one-time structural changes (e.g., expanding grill slot array, expanding table capacity).
- **Preconditions**:
  - `skillId` refers to a valid entry in `SKILLS`.
  - The skill is not already in `state.skills` unless `isStackable === true`.
- **Postconditions**:
  - Returns a new `GameState` with `skillId` appended to `state.skills`.
  - If the skill is Extra Slot: `grill` is extended by `EXTRA_SLOT_COUNT` empty slots.
  - If the skill is Table Extension: table capacity is increased by `TABLE_EXTENSION_COUNT`.
  - If the skill is Quick Order: `restaurant.effectiveServingInterval` is reduced by `QUICK_ORDER_INTERVAL_REDUCTION` (clamped at serving speed floor).
  - All other effect changes are computed lazily by `applySkillModifiers` each frame; no further mutation needed here.
  - `state.skills` contains no duplicates for non-stackable skills.
- **Edge cases**:
  - Calling with a skill already in `state.skills` for a non-stackable skill: returns state unchanged (idempotent; no duplicate added).
  - Quick Order acquired between restaurants: interval reduction is deferred until the next restaurant is initialized.

---

### `hasSkill(state: GameState, skillId: string): boolean`
- **Purpose**: Checks whether the player currently holds the given skill.
- **Preconditions**: None.
- **Postconditions**:
  - Returns `true` if `skillId` is present in `state.skills`, `false` otherwise.
- **Edge cases**:
  - Returns `false` for any unknown or unrecognized `skillId`.

---

### `applySkillModifiers(state: GameState): SkillModifiers`
- **Purpose**: Computes and returns the aggregate modifier object representing the combined effect of all currently held skills. Does NOT modify `state`.
- **Preconditions**: `state.skills` is a valid array (may be empty).
- **Postconditions**:
  - Returns a fully populated `SkillModifiers` object derived from the set of held skills.
  - `grillSlotCount`: base `3` plus `EXTRA_SLOT_COUNT` for each Extra Slot held.
  - `tableCapacity`: base `5` plus `TABLE_EXTENSION_COUNT` for each Table Extension held.
  - `eatingSpeedMultiplier`: `1.0` unless Speed Eater is held (then `SPEED_EATER_MULTIPLIER`). Character-level overrides are handled in `getCharacterModifiers`, not here.
  - `servingIntervalReduction`: `QUICK_ORDER_INTERVAL_REDUCTION` if Quick Order (`'quick-order'`) is held, else `0`.
  - `flipAvailable`: `true` if Tong Master (`'tong-master'`) is held.
  - `heatSensorEnabled`: `true` if Heat Sensor (`'heat-sensor'`) is held.
  - `rawToleranceDurationMultiplier`: `0.0` if Iron Stomach (`'iron-stomach'`) is held (full negation), else `RAW_TOLERANCE_MULTIPLIER` if Raw Tolerance (`'raw-tolerance'`) is held, else `1.0`.
  - `rawPenaltyNegated`: `true` if Iron Stomach is held (takes full precedence over Raw Tolerance even if both are held).
  - `staffWarningThreshold1`: `CHARMING_FIRST_THRESHOLD` if Charming Personality (`'charming-personality'`) is held, else `3`.
  - `staffWarningThreshold2`: `CHARMING_STACK_THRESHOLD` if Charming Personality is held, else `5`.
  - `discardProActive`: `true` if Discard Pro (`'discard-pro'`) is held.
  - `vipStatusActive`: `true` if VIP Status (`'vip-status'`) is held.
  - `fireControlActive`: `true` if Fire Control (`'fire-control'`) is held.
  - `exchangeDiscountMultiplier`: `EXCHANGE_DISCOUNT_MULTIPLIER` if Exchange Discount (`'exchange-discount'`) is held, else `1.0`.
  - `bingeMultiplierActive`: `true` if Binge Mode (`'binge-mode'`) is held.
  - `digestiveProActive`: `true` if Digestive Pro (`'digestive-pro'`) is held.
  - `regularCustomerActive`: `true` if Regular Customer (`'regular-customer'`) is held.
  - `eatingStreakThreshold`: `DIGESTIVE_PRO_STREAK_THRESHOLD` (3) if Digestive Pro is held, else `EATING_STREAK_THRESHOLD` (5).
- **Edge cases**:
  - If both Raw Tolerance and Iron Stomach are held: `rawPenaltyNegated = true`; `rawToleranceDurationMultiplier = 0.0`. The partial-reduction path is never reached.
  - If no skills are held, returns all defaults (no bonuses, base slot/table counts).
  - This function is pure; it reads only `state.skills` and `SKILLS`.

---

## Skill IDs

All skill IDs use kebab-case:

| Skill | ID |
|---|---|
| Tong Master | `'tong-master'` |
| Iron Stomach | `'iron-stomach'` |
| Fast Eater's Wage | `'fast-eaters-wage'` |
| Speed Eater | `'speed-eater'` |
| Quick Order | `'quick-order'` |
| Exchange Discount | `'exchange-discount'` |
| Heat Sensor | `'heat-sensor'` |
| Raw Tolerance | `'raw-tolerance'` |
| Charming Personality | `'charming-personality'` |
| Fire Control | `'fire-control'` |
| Extra Slot | `'extra-slot'` |
| Table Extension | `'table-extension'` |
| Discard Pro | `'discard-pro'` |
| VIP Status | `'vip-status'` |
| Binge Mode | `'binge-mode'` |
| Digestive Pro | `'digestive-pro'` |
| Regular Customer | `'regular-customer'` |
| Tare Conversion | `'tare-conversion'` |
| Char Bonus | `'char-bonus'` |
| Perfect Grill Bonus | `'perfect-grill-bonus'` |
| Slot Efficiency Bonus | `'slot-efficiency-bonus'` |
| Quick Turnover Bonus | `'quick-turnover-bonus'` |
| Eating Streak Bonus | `'eating-streak-bonus'` |
| Regular Customer Bonus | `'regular-customer-bonus'` |

---

## Invariants

- `state.skills` never contains duplicates for non-stackable skills; enforced by `acquireSkill`.
- `applySkillModifiers` is a pure function — it reads state but never mutates it; calling it multiple times with the same state returns identical results.
- `grillSlotCount` returned by `applySkillModifiers` must always equal `state.grill.length` (structural and computed values stay in sync after each `acquireSkill` call).
- `eatingSpeedMultiplier` produced here is always in the range `(0, 1]`; character-level overrides (e.g., Competitive Eater's 0.5) supersede this value — they are not multiplied together.
- All constants are imported from `src/game/data/constants.ts`; no numeric literals appear in function bodies.
- `SKILLS` (not `ALL_SKILLS`) is the canonical export name for the skill definitions array.

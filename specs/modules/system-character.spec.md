# Module Spec: Character System

## Purpose
Provides character-specific modifier resolution, unlock condition evaluation, and Vegan Tashiro's meat exchange mechanic.

## File Path
`src/game/systems/character.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `CharacterId`, `CharacterModifiers`, `PersistentState`, `GrillSlot`
- `src/game/data/characters.ts` — `CHARACTER_DEFINITIONS: readonly CharacterDefinition[]`
- `src/game/data/meats.ts` — `VEGETABLE_PARTS` (for exchange replacement)
- `src/game/data/constants.ts` — all numeric constants

---

## Constants

All constants are imported from `src/game/data/constants.ts`. No local redefinitions.

```ts
// Referenced from data-constants — all values are [TUNE]
// GOURMET_SWEET_SPOT_BONUS = 1                        +1s for Elite and Premium ranks
// GOURMET_COMMON_COIN_MULTIPLIER = 0.5                 −50% coin value for Common meat
// COMPETITIVE_EATER_SPEED_MULTIPLIER = 0.5             eating time ×0.5 (50% reduction)
// COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER = 0.8        sweet_spot narrowed (exact value TBD)
// VEGETABLE_COIN_MULTIPLIER = 3                        vegetables earn ×3 coins (Vegan Tashiro)
// VEGAN_MEAT_EAT_WARNING_PENALTY = 2                   Staff Warning +2 on eating meat
// DELAYED_EXCHANGE_DURATION = 5                        slot occupied time for Delayed Exchange
// TRUE_ENDING_CYCLE = 4                                Boss restaurant of Cycle 4 = "clear the game"
```

---

## Functions

### `getCharacterModifiers(characterId: CharacterId, skills: string[]): CharacterModifiers`
- **Purpose**: Returns the static modifier object for the specified character. Modifier values are character-level and are applied on top of (or instead of) skill-based modifiers.
- **Preconditions**:
  - `characterId` is one of the five valid `CharacterId` values.
  - `skills` is the current `state.skills` array (needed to check for Speed Eater override logic).
- **Postconditions**:
  - Returns a `CharacterModifiers` object populated as follows:

  **Salaryman Tanaka (`'tanaka'`)**:
  - All modifiers at baseline; returns an object with no overrides.
  - `sweetSpotBonus`: `{}` (no per-rank adjustment)
  - `eatSpeedMultiplier`: `undefined` (skill-based Speed Eater applies normally)
  - `coinMultiplierByRank`: `{}` (all ranks at 1.0)
  - `vegetableCoinMultiplier`: `undefined`
  - `meatEatStaffWarningIncrement`: `undefined`
  - `instantGameOverOnBurn`: `undefined`

  **Gourmet Critic (`'gourmet-critic'`)**:
  - `sweetSpotBonus`: `{ elite: GOURMET_SWEET_SPOT_BONUS, premium: GOURMET_SWEET_SPOT_BONUS }` — Upper and Common ranks get no bonus.
  - `coinMultiplierByRank`: `{ common: GOURMET_COMMON_COIN_MULTIPLIER }` — Upper, Premium, and Elite ranks at 1.0 (no penalty or bonus).
  - `eatSpeedMultiplier`: `undefined` (starter is Heat Sensor, no eat speed character modifier).

  **Competitive Eater (`'competitive-eater'`)**:
  - `eatSpeedMultiplier`: `COMPETITIVE_EATER_SPEED_MULTIPLIER` — overrides Speed Eater's skill value; the two do NOT stack.
  - `sweetSpotPenaltyMultiplier`: `COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER` — narrows effective sweet_spot for all meat parts.
  - All other modifiers at baseline.

  **Raw Food Advocate (`'raw-food-advocate'`)**:
  - `instantGameOverOnBurn`: `true` — burning any meat triggers immediate game over, active from restaurant 1 regardless of staged unlock rules. Vegetables burning does NOT trigger this.
  - All other modifiers at baseline (raw penalty is handled via starter Iron Stomach skill, not as a character modifier).

  **Vegan Tashiro (`'vegan-tashiro'`)**:
  - `vegetableCoinMultiplier`: `VEGETABLE_COIN_MULTIPLIER` — eating vegetables earns ×3 coins.
  - `meatEatStaffWarningIncrement`: `VEGAN_MEAT_EAT_WARNING_PENALTY` — eating any meat (not exchanged) increments Staff Warning by 2 instead of 0.
  - Exchange availability is determined by checking `state.character === 'vegan-tashiro'` in the engine — not via a CharacterModifiers field.
  - All other modifiers at baseline.

- **Edge cases**:
  - Competitive Eater + Speed Eater skill: `eatSpeedMultiplier` from character (`COMPETITIVE_EATER_SPEED_MULTIPLIER`) takes full precedence. The skill's multiplier is ignored; the combined eating time is exactly `T × COMPETITIVE_EATER_SPEED_MULTIPLIER`, not stacked.
  - Unknown `characterId`: should not occur in valid game state; treat as Tanaka (no modifiers) defensively.

---

### `canUnlockCharacter(characterId: CharacterId, persistentState: PersistentState): boolean`
- **Purpose**: Evaluates whether the given character's unlock condition is satisfied by the current persistent state.
- **Preconditions**:
  - `persistentState` is a valid `PersistentState` object loaded from localStorage.
- **Postconditions**:
  - **`'tanaka'`**: always returns `true`.
  - **`'gourmet-critic'`** and **`'competitive-eater'`**: returns `true` if `persistentState.clearedWithCharacterIds` contains `'tanaka'` (i.e., Tanaka has achieved a True Ending — Boss of Cycle `TRUE_ENDING_CYCLE` defeated).
  - **`'raw-food-advocate'`** and **`'vegan-tashiro'`**: returns `true` if `persistentState.clearedWithCharacterIds` contains `'gourmet-critic'` or `'competitive-eater'` (any Specialist-type character has cleared).
  - If the character's ID is already in `persistentState.unlockedCharacters`, returns `true` (already unlocked).
- **Edge cases**:
  - Both Specialist characters unlock simultaneously when Tanaka clears; both Peaky characters unlock simultaneously when any Specialist clears.
  - Defeating Boss of Cycle 3 does NOT satisfy the clear condition; only Cycle `TRUE_ENDING_CYCLE` Boss qualifies.
  - `persistentState.unlockedCharacters` always contains `'tanaka'` (per PersistentState invariant); this function returns `true` for Tanaka even on a brand-new save.

---

### `processVeganExchange(state: GameState, slotIndex: number, method: 'instant' | 'delayed', exchangeCost: number): GameState`
- **Purpose**: Handles Vegan Tashiro's meat-to-vegetable exchange for a given grill slot. Deducts coins (Instant) or starts delay timer (Delayed). Only callable when `state.character === 'vegan-tashiro'`.
- **Preconditions**:
  - `state.character === 'vegan-tashiro'`.
  - `state.grill[slotIndex]` exists and contains a meat dish (`part !== null && !part.isVegetable`).
  - `state.grill[slotIndex].disabled === false`.
  - For `method === 'instant'`: `state.coins >= exchangeCost`.
- **Postconditions**:
  - **`method === 'instant'`**:
    - Deducts `exchangeCost` from `state.coins` (never goes below 0).
    - Replaces `grill[slotIndex].part` with a randomly selected `VegetablePart` (uniform random between available `VEGETABLE_PARTS`).
    - Resets `grill[slotIndex].state` to `'raw'` and `timeInState` / `fireTimer` to initial values for the new vegetable.
  - **`method === 'delayed'`**:
    - Does NOT deduct coins.
    - Removes current meat from `grill[slotIndex].part` (sets to `null` or a placeholder sentinel).
    - Marks slot as pending delayed exchange (implementation detail in GrillSlot).
    - Sets `disabledTimer` to `DELAYED_EXCHANGE_DURATION` on the slot.
    - Slot is occupied during delay — it cannot receive new dishes, and its state transitions are halted until the vegetable arrives.
    - When the timer elapses (handled by `gameTick`): replaces slot with a random `VegetablePart` starting from `'raw'`, resets timers, clears the pending state.
  - Returns new `GameState` with the modified slot.
- **Parameter notes**:
  - `exchangeCost` is passed in by the caller (computed via `getExchangeCost(state)` in the economy module). This keeps the character module independent from the economy module.
- **Edge cases**:
  - If player does not have enough coins for Instant Exchange: the UI should disable the button before calling; this function may defensively return state unchanged or throw.
  - If `slotIndex` is out of bounds: return state unchanged (defensive).
  - Exchange is always available without failure conditions — Delayed Exchange has no coin requirement and no precondition beyond the slot holding a meat dish.
  - Non-Vegan characters cannot call this function; it is guarded by character check at call site.
  - Vegetable chosen is uniformly random between all `VEGETABLE_PARTS` (Green Pepper, Eggplant).

---

## GrillSlot canonical fields

```ts
interface GrillSlot {
  part: Part | null;  // Part = MeatPart | VegetablePart
  state: GrillingState;
  timeInState: number;
  fireTimer: number;
  disabled: boolean;
  disabledTimer: number;
}
```

All references to GrillSlot fields in this module use these canonical names. In particular:
- `disabled` (not `isDisabled`)
- `disabledTimer` (not `disabledUntil`)
- `timeInState` (not `remainingTime`)
- `fireTimer` (not `heatSensorWarning` — heat sensor warning is derived, not stored on slot)

---

## Invariants

- `getCharacterModifiers` is a pure function: same `characterId` + `skills` always returns the same result.
- `canUnlockCharacter('tanaka', any)` always returns `true`.
- `processVeganExchange` is callable only when `state.character === 'vegan-tashiro'`; caller is responsible for the guard.
- `processVeganExchange` accepts `exchangeCost` as a parameter rather than importing from economy — keeps modules independent.
- Instant Exchange deducted cost is always the `exchangeCost` argument — the caller computes the correct cost (with any discount applied) before passing it.
- Raw Food Advocate's `instantGameOverOnBurn` applies exclusively to meat parts (`isVegetable === false`); vegetables burning does not trigger it.
- Character modifier `eatSpeedMultiplier` is treated as an absolute override, not as a multiplier stacked on top of skill-based speed reductions.
- `canUnlockCharacter` checks `persistentState.clearedWithCharacterIds` (not a generic `clearedWith` field) to determine True Ending history.

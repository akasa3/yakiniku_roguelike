# Module Spec: Grilling System

## Purpose
Manages the per-slot grill timer, state transitions, and all player actions on grilled items (eat, discard, flip, serve).

## File Path
`src/game/systems/grilling.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `GrillSlot`, `GrillingState`, `MeatPart`
- `src/game/data/meats.ts` — meat/vegetable part definitions
- `src/game/data/constants.ts` — `GRILL_TIME`, `FLIP_TIMER_RESET_FRACTION`, `RAW_MEAT_DISABLE_DURATION`, `SWEET_SPOT_MINIMUM`, `INITIAL_TABLE_CAPACITY`

---

## Types Referenced

```ts
type GrillingState = 'raw' | 'rare' | 'medium' | 'well-done' | 'burnt';

// Canonical GrillSlot — all field names as defined in src/types/index.ts
interface GrillSlot {
  id: number;
  part: Part | null;             // null = empty slot; Part = MeatPart | VegetablePart
  state: GrillingState;
  timeInState: number;          // seconds elapsed in the current state
  fireTimer: number;            // seconds of fire-disable remaining (0 = not on fire)
  disabled: boolean;            // true when Grill Fire is active on this slot
  disabledTimer: number;        // alias for fireTimer; seconds until slot re-enables
}
```

---

## Functions

### `advanceGrilling(slot: GrillSlot, deltaTime: number, skills: string[], cycle: number, random: () => number): GrillSlot`

- **Purpose**: Advances grill timer for a single slot by `deltaTime` seconds. Handles all state transitions, flare_risk checks, Heat Sensor warning, and sweet_spot narrowing per cycle.
- **Preconditions**:
  - `slot.part !== null`
  - `slot.disabled === false`
  - `deltaTime > 0`
  - `cycle >= 1`
  - `random` is a function returning a value in `[0, 1)` — injected for testability (tests use `() => 0` to always trigger, `() => 1` to never trigger)
- **Postconditions**:
  - Returns a new `GrillSlot` object; the input `slot` is not mutated.
  - `timeInState` is incremented by `deltaTime` (before transition resets).
  - When `timeInState >= grillTime` for the current state (raw/rare/medium), state advances and `timeInState` resets to `0`.
  - When in `well-done`: transition to `burnt` occurs when `timeInState >= effectiveSweetSpot`, where `effectiveSweetSpot = max(SWEET_SPOT_MINIMUM, baseSweetSpot - 0.3s × (cycle - 1))`, capped at cycle 5 reduction (i.e., `cycle - 1` is clamped to `[0, 4]`).
  - `burnt` is a terminal state; `timeInState` still increments (used for fire escalation), no further state transition occurs.
  - Flare risk is checked once per integer second boundary crossed in `deltaTime`. Not checked for vegetables (`part.isVegetable === true`).
  - For each full second boundary crossed: call `random()`. If `random() < part.flareRisk`, the flare triggers: `newTimeInState = max(0, timeInState - grillTime * FLIP_TIMER_RESET_FRACTION)`. Does not cause an immediate state jump; can cause the transition to fire in the same tick if `newTimeInState >= grillTime` (or `>= effectiveSweetSpot` in well-done).
  - Heat Sensor warning fires when the slot is in `well-done` and `effectiveSweetSpot - timeInState <= 2.0` and `skills` includes `'heat-sensor'`.
- **Edge cases**:
  - Multiple integer-second boundaries may be crossed in a single `deltaTime` tick; each crossing triggers an independent `random()` call and flare_risk check.
  - A flare_risk trigger while in `well-done` state halves the remaining sweet_spot window, potentially causing immediate `burnt` transition in the same tick.
  - If `effectiveSweetSpot <= 0` (Narrow meat at high cycle), use `SWEET_SPOT_MINIMUM` (defined as `0.1` [TUNE]) to prevent the window collapsing to zero or negative.
  - Heat Sensor warning should be cleared once the slot transitions out of `well-done` (burnt or eaten).
  - If `slot.part === null` or `slot.disabled`, return `slot` unchanged.

---

### `eatMeat(state: GameState, slotIndex: number): GameState`

- **Purpose**: Player eats the meat on `slotIndex`. Removes meat from grill, counts the dish as consumed (for meat only), applies raw-meat penalty if applicable, adds to catalog, awards coins based on skills.
- **Preconditions**:
  - `state.grill[slotIndex].part !== null`
  - `state.grill[slotIndex].state !== 'burnt'` (burnt meat cannot be eaten)
  - `state.actionDisabledTimer === 0` (caller must check; this function does not guard)
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - The slot at `slotIndex` is cleared: `part = null`, `state = 'raw'`, `timeInState = 0`, `fireTimer = 0`.
  - If `slot.state === 'raw'`: `applyRawMeatPenalty` is called on the resulting state (see Penalty System).
  - If `!part.isVegetable`: `state.restaurant.meatDishesEaten` is incremented by 1.
  - Catalog: if `!part.isVegetable` and `part.id` is not in `state.catalog`, it is added via `acquireSkill`-style unlock (catalog unlock function from `system-catalog.ts`).
  - Coin awards (checked in order; multiple can apply):
    - Skill `'fast-eaters-wage'`: `slot.state === 'rare'` → +`FAST_EATER_WAGE_COINS` coins.
    - Skill `'perfect-grill-bonus'`: `slot.state === 'well-done'` → +`PERFECT_GRILL_BONUS_COINS` coins.
    - Skill `'binge-mode'`: increments `state.consecutiveEatCount`; if `consecutiveEatCount % EATING_STREAK_THRESHOLD === 0 && consecutiveEatCount > 0` (i.e., every N eats, where N = `EATING_STREAK_THRESHOLD` = 5 normally, or `DIGESTIVE_PRO_STREAK_THRESHOLD` = 3 if Digestive Pro held), sets `state.bingeNextDishDoubled = true`. Counter is NOT reset — it continues accumulating, so Binge fires again at 10, 15, etc. (if the player never discards).
    - Skill `'eating-streak-bonus'`: every `EATING_STREAK_THRESHOLD` consecutive dishes eaten → +`EATING_STREAK_BONUS_COINS` coins.
  - After clearing the slot, `moveTableToGrill` is called to fill the now-empty slot if dishes are waiting.
- **Edge cases**:
  - Eating raw meat while `'iron-stomach'` is held: `applyRawMeatPenalty` is still called but the penalty system will no-op it.
  - Vegan Tashiro eating meat (not exchanged): penalty system handles staff warning +2; `eatMeat` does NOT call `incrementStaffWarning` — that responsibility belongs to the penalty system via the character modifier.
  - Eating a vegetable does not add to catalog and does not increment `meatDishesEaten`.
  - If `slotIndex` is out of range or slot is empty, return `state` unchanged.

---

### `discardMeat(state: GameState, slotIndex: number): GameState`

- **Purpose**: Player discards the item on `slotIndex`. Removes meat from grill, increments Staff Warning for meat items unless Discard Pro is held, awards coins if Tare Conversion or Char Bonus applies.
- **Preconditions**:
  - `state.grill[slotIndex].part !== null`
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - The slot at `slotIndex` is cleared (same field resets as `eatMeat`).
  - Discard does NOT increment `meatDishesEaten`.
  - Staff Warning increment logic:
    - If `part.isVegetable`: no staff warning increment (vegetables are neutral — discarding a vegetable does NOT call `incrementStaffWarning`).
    - If `!part.isVegetable` and `skills` includes `'discard-pro'` OR `skills` includes `'tare-conversion'`: counter NOT incremented. Both skills independently suppress the warning (they are complementary per GAME_DESIGN.md §9.1).
    - If `!part.isVegetable` and neither `'discard-pro'` nor `'tare-conversion'` is held: `incrementStaffWarning(state, 1)` is called.
  - Coin awards on discard (meat only, non-vegetable):
    - Skill `'tare-conversion'`: +`TARE_CONVERSION_COINS` coins granted.
    - Skill `'char-bonus'` (burnt meat only): additional +`CHAR_BONUS_COINS` coins on top of any Tare Conversion coins.
  - `moveTableToGrill` is called after clearing the slot.
- **Edge cases**:
  - Discarding a vegetable: does NOT increment `staffWarningCount` (vegetables are neutral). Tare Conversion does not grant coins on vegetable discard (meat-only).
  - Discard is always available regardless of `state.actionDisabledTimer` — the disable only blocks Eat, not Discard.
  - If `slotIndex` is out of range or slot is empty, return `state` unchanged.

---

### `flipMeat(slot: GrillSlot): GrillSlot`

- **Purpose**: Resets the grill timer for the meat on `slot`, buying time before the next state transition. The caller is responsible for verifying the player holds the `'tong-master'` skill before calling.
- **Preconditions**:
  - `slot.part !== null`
  - `slot.state !== 'burnt'`
  - Caller has verified `skills.includes('tong-master')`
- **Postconditions**:
  - Returns new `GrillSlot`; no mutation.
  - For non-`well-done` states (raw, rare, medium): `newTimeInState = max(0, timeInState - grillTime * FLIP_TIMER_RESET_FRACTION)` — effectively giving back 50% of the full state duration.
  - For `well-done` state: `newTimeInState = max(0, timeInState - sweetSpot * FLIP_TIMER_RESET_FRACTION)` — giving back 50% of the effective sweet spot window.
  - `slot.state` is unchanged.
  - All other slot fields are unchanged.
- **Edge cases**:
  - Flipping in `well-done` state resets `timeInState` within the sweet_spot window, giving more time before `burnt`. The effective sweet spot window is recalculated from the reset `timeInState`.
  - Flip is valid on any non-burnt state (raw, rare, medium, well-done).
  - Heat Sensor warning may be cleared by a flip if the reset `timeInState` moves the slot back outside the 2s warning threshold.

---

### `serveDish(state: GameState): GameState`

- **Purpose**: Places the next dish from the restaurant's serving queue onto an empty grill slot. If no slot is empty, the dish goes to the table waiting queue. If the table is also full, triggers game over (table overflow).
- **Preconditions**:
  - Restaurant has dishes remaining in its serving queue.
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - The next dish is dequeued from the restaurant's serving queue.
  - If any grill slot has `part === null` and `disabled === false`: the dish is placed on the first available slot (lowest index first).
  - If all grill slots are occupied or disabled: the dish is pushed onto `state.table`.
  - If `state.table.length >= tableCapacity` (would exceed capacity after adding): `state.gameOver = 'table-overflow'` is set. The dish is NOT added to the table in this case.
  - If `state.actionDisabledTimer > 0` at the moment of table overflow: `state.gameOver = 'raw-paralysis'` is set instead (raw paralysis takes precedence when action disable is active and a Boss restaurant has been reached — see system-game-over for staged unlock logic).
- **Edge cases**:
  - A disabled grill slot (`disabled === true`) is treated as occupied for this function.
  - `tableCapacity` is `INITIAL_TABLE_CAPACITY` (5) plus any bonuses from `'table-extension'` skill (+3).
  - If serving queue is empty, return `state` unchanged.

---

### `moveTableToGrill(state: GameState): GameState`

- **Purpose**: Moves dishes from the front of the table waiting queue onto any empty, non-disabled grill slots. Called automatically after `eatMeat` or `discardMeat` frees a slot.
- **Preconditions**:
  - (None strict — safe to call with empty table or full grill)
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - For each empty non-disabled grill slot (in ascending index order), if `state.table` is non-empty, dequeues the first dish from the table and places it on the slot.
  - Continues until either all empty slots are filled or the table is empty.
- **Edge cases**:
  - If `state.table` is empty or all grill slots are occupied/disabled, returns `state` unchanged.
  - Does not trigger further serving from the restaurant queue (that is handled by `tickServing`).

---

## State Transitions

```
raw ──(timeInState >= grillTime)──► rare
                                      │
                                      ▼
                               (timeInState >= grillTime)
                                      │
                                      ▼
                                   medium
                                      │
                                      ▼
                               (timeInState >= grillTime)
                                      │
                                      ▼
                                 well-done  ◄── Heat Sensor warning fires 2s before exit
                                      │
                                      ▼
                        (timeInState >= effectiveSweetSpot)
                                      │
                                      ▼
                                    burnt  (terminal)
```

**Flare risk (meat only, not vegetables):**
- Checked once per integer second boundary crossed in `deltaTime` using the injected `random` function.
- For each boundary crossed: `if (random() < part.flareRisk)` → flare triggers.
- If triggered: `newTimeInState = max(0, timeInState - grillTime * FLIP_TIMER_RESET_FRACTION)`.
- May cause a state transition in the same tick if `newTimeInState >= grillTime` (or `>= effectiveSweetSpot` in well-done).
- Tests inject `() => 0` (always triggers) or `() => 1` (never triggers) for determinism.

**Sweet spot formula:**
```
reductionSteps = clamp(cycle - 1, 0, 4)   // cap at cycle 5 = 4 reductions
effectiveSweetSpot = max(SWEET_SPOT_MINIMUM, baseSweetSpot - 0.3 * reductionSteps)
```

**Flip mechanic:**
- For non-well-done states: `newTimeInState = max(0, timeInState - grillTime * FLIP_TIMER_RESET_FRACTION)` where `FLIP_TIMER_RESET_FRACTION = 0.5` [TUNE].
- For well-done state: `newTimeInState = max(0, timeInState - sweetSpot * FLIP_TIMER_RESET_FRACTION)`.
- Net effect: gives back 50% of the full state duration.

**Grill time constants (from `constants.ts`):**
```
GRILL_TIME.SHORT      = 3   // [TUNE]
GRILL_TIME.MEDIUM     = 5   // [TUNE]
GRILL_TIME.LONG       = 8   // [TUNE]
GRILL_TIME.VERY_LONG  = 12  // [TUNE]
```

---

## Invariants

1. `burnt` is terminal — `advanceGrilling` never transitions out of `burnt`.
2. `timeInState` is always `>= 0`.
3. `slot.state` always follows the linear sequence; no skipping states (flare risk accelerates within a state, it does not jump states).
4. All state fields on returned objects are always defined (no `undefined` values).
5. Vegetables never trigger flare risk; `part.isVegetable === true` skips the flare_risk check entirely.
6. `flipMeat` is only called by the caller after confirming `'tong-master'` skill; this function does not re-check.
7. `eatMeat` and `discardMeat` always call `moveTableToGrill` after clearing a slot, maintaining the invariant that empty slots are filled from the table whenever possible.
8. `serveDish` never mutates the restaurant's serving queue in place; it returns a new state with a new queue array.
9. Discarding a vegetable does NOT increment `staffWarningCount` (neutral action per §4b.1).
10. `eatMeat` does NOT call `incrementStaffWarning` — economy and warning side-effects are the penalty system's responsibility.

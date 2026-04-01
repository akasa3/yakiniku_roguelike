# Module Spec: Penalty System

## Purpose
Manages all active penalty states and debuffs: raw meat action disable, burnt smoke visibility, staff warning counter and speed debuff, grill fire slot disable, and the per-tick decay of all timers.

## File Path
`src/game/systems/penalty.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `GrillSlot`, `GrillingState`
- `src/game/data/constants.ts` — `RAW_MEAT_DISABLE_DURATION`, `RAW_TOLERANCE_MULTIPLIER`, `GRILL_FIRE_DISABLE_DURATION`, `FIRE_CONTROL_MULTIPLIER`, `GRILL_FIRE_GAME_OVER_THRESHOLD`, `STAFF_WARNING_THRESHOLD`, `STAFF_WARNING_STACK_THRESHOLD`, `CHARMING_FIRST_THRESHOLD`, `CHARMING_STACK_THRESHOLD`, `STAFF_WARNING_DEBUFF`, `STAFF_WARNING_STACK_DEBUFF`, `VIP_STATUS_SPEED_BUFF`, `PENALTY_INCREASE_PER_CYCLE`, `PENALTY_SCALING_CAP_CYCLE`

---

## Types Referenced

```ts
// Penalty state is stored as flat fields on GameState (no nested PenaltyState object):
//   state.actionDisabledTimer    — seconds remaining on raw-meat action disable (0 = no disable)
//   state.burntSmokeActive       — true while burnt meat is on any grill slot
//   state.staffWarningCount      — cumulative discard-loss counter for the run
//
// Per-slot fire tracking is stored directly on GrillSlot:
//   slot.fireTimer               — seconds of fire-disable remaining (0 = not on fire)
//   slot.disabled                — true when Grill Fire is active on this slot
//   slot.disabledTimer           — seconds until slot re-enables (same as fireTimer)

type StaffWarningLevel = 'none' | 'warning' | 'stacked';
// 'none'    = count < first threshold
// 'warning' = count >= first threshold but < stack threshold
// 'stacked' = count >= stack threshold
```

---

## Functions

### `applyRawMeatPenalty(state: GameState): GameState`

- **Purpose**: Applies the raw-meat action disable penalty. Duration is reduced by Raw Tolerance, fully negated by Iron Stomach. Duration is also scaled by the difficulty penalty multiplier for the current cycle.
- **Preconditions**:
  - Called immediately after a raw meat eat event.
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - If `state.skills` includes `'iron-stomach'`: return `state` unchanged (penalty fully negated).
  - Otherwise:
    - Base duration = `RAW_MEAT_DISABLE_DURATION`.
    - Apply cycle severity multiplier: `baseDuration × (1 + PENALTY_INCREASE_PER_CYCLE × min(cycle - 1, PENALTY_SCALING_CAP_CYCLE - 1))`.
    - If `state.skills` includes `'raw-tolerance'`: multiply duration by `RAW_TOLERANCE_MULTIPLIER` (e.g., `0.30`).
    - Set `state.actionDisabledTimer = computedDuration`.
    - If an action disable is already active, reset to the new duration (do not stack; current disable is overwritten). [TUNE]
- **Edge cases**:
  - `'raw-tolerance'` and `'iron-stomach'` are mutually exclusive in practice, but the function checks `'iron-stomach'` first and returns early.
  - Duration floor: `max(0, computedDuration)` — never negative.
  - Cycle 1 has no severity increase (multiplier = 1.0 at cycle 1).

---

### `applyBurntSmoke(state: GameState): GameState`

- **Purpose**: Activates the burnt-smoke visibility penalty. Active as long as any grill slot holds burnt meat.
- **Preconditions**:
  - Called when a grill slot transitions to `burnt`.
- **Postconditions**:
  - Returns new `GameState` with `state.burntSmokeActive = true`.
- **Edge cases**:
  - `burntSmokeActive` is set to `true` on trigger; it is not cleared here.
  - Clearing burnt smoke is handled in `tickPenalties` by checking whether any slot still holds burnt meat.
  - Multiple burnt slots do not compound the effect — `burntSmokeActive` is boolean. [TUNE]

---

### `incrementStaffWarning(state: GameState, amount: number): GameState`

- **Purpose**: Increments the staff warning counter by `amount`. Activates or stacks the speed debuff when thresholds are crossed. Thresholds depend on whether the player holds `'charming-personality'`.
- **Preconditions**:
  - `amount > 0` (typically 1, or 2 for Vegan Tashiro eating meat)
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - `state.staffWarningCount += amount`.
  - Resolve thresholds:
    - `firstThreshold = state.skills.includes('charming-personality') ? CHARMING_FIRST_THRESHOLD : STAFF_WARNING_THRESHOLD`
    - `stackThreshold = state.skills.includes('charming-personality') ? CHARMING_STACK_THRESHOLD : STAFF_WARNING_STACK_THRESHOLD`
  - Derive the new `StaffWarningLevel` from the updated count:
    - `count < firstThreshold` → `'none'`
    - `count >= firstThreshold && count < stackThreshold` → `'warning'`
    - `count >= stackThreshold` → `'stacked'`
  - Counter may exceed `stackThreshold`; debuff does not increase further beyond `'stacked'`. [TUNE]
- **Edge cases**:
  - If the count crosses both thresholds in a single increment (e.g., amount = 3 pushes from 2 → 5 at default thresholds), the resulting level is `'stacked'` directly.
  - Counter is never capped; it can grow above `stackThreshold` indefinitely (the debuff level stays at `'stacked'`).

---

### `applyGrillFire(state: GameState, slotIndex: number): GameState`

- **Purpose**: Triggers a grill fire on a specific grill slot, disabling it for a duration determined by whether the player holds `'fire-control'`.
- **Preconditions**:
  - `slotIndex` is a valid grill slot index.
  - The slot contains burnt meat (the burnt meat is removed by this function — the fire replaces it).
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - The grill slot at `slotIndex` is cleared of its meat and set to `disabled = true`.
  - Disable duration:
    - Default: `GRILL_FIRE_DISABLE_DURATION` (10s), scaled by cycle penalty multiplier.
    - With `'fire-control'` skill: `GRILL_FIRE_DISABLE_DURATION × FIRE_CONTROL_MULTIPLIER` (5s), scaled by cycle penalty multiplier.
  - `state.grill[slotIndex].fireTimer = computedDuration`.
  - `state.grill[slotIndex].disabledTimer = computedDuration`.
  - The slot's `fireTimer` tracks escalation separately from the disable timer; on fire trigger the escalation timer is reset (the fire has been triggered).
- **Edge cases**:
  - If a grill fire is already active on the slot (`slot.fireTimer > 0`), the new fire replaces it (timer resets to computed duration). [TUNE]
  - `applyGrillFire` is called by the game loop only — not by player action. The player can discard burnt meat to prevent the trigger threshold from being reached.

---

### `tickPenalties(state: GameState, deltaTime: number): GameState`

- **Purpose**: Decrements all penalty timers by `deltaTime`. Clears expired penalties. Updates `burntSmokeActive` based on current grill state. Re-enables grill slots whose fire timer has expired.
- **Preconditions**:
  - `deltaTime > 0`
  - Called once per game loop tick
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - `state.actionDisabledTimer`: decremented by `deltaTime`; clamped to `max(0, value)`.
  - For each slot `i` in `state.grill`:
    - `slot.fireTimer`: decremented by `deltaTime`; clamped to `max(0, value)`. When timer reaches 0 and `slot.disabled === true`, set `slot.disabled = false` and `slot.disabledTimer = 0`.
    - Escalation tracking: for each slot where `slot.state === 'burnt'` and `slot.part !== null` and `slot.disabled === false`, accumulate burnt time. When accumulated time exceeds `GRILL_FIRE_GAME_OVER_THRESHOLD`, the game loop must call `checkGameOver`. `tickPenalties` itself does NOT set `state.gameOver`; it only updates timer state.
  - `state.burntSmokeActive`: set to `true` if any `slot.state === 'burnt'` and `slot.part !== null`; set to `false` otherwise.
  - Staff warning level is NOT recalculated here (it is calculated in `incrementStaffWarning`). Post-restaurant reductions from `'regular-customer'` skill are handled by the restaurant system.
- **Edge cases**:
  - A slot that is `disabled` due to a grill fire should not have its burnt escalation timer incremented (the fire suppresses further escalation tracking for that slot).
  - If a `slot.fireTimer` exceeds `GRILL_FIRE_GAME_OVER_THRESHOLD` and the grill-fire game-over condition is active for the current restaurant type, the game loop must call `checkGameOver` (in `system-game-over.ts`).

---

### `getSpeedModifier(state: GameState): number`

- **Purpose**: Returns the current timed-action speed multiplier for the player, based on active staff warning level derived from `state.staffWarningCount` and skills.
- **Preconditions**: (none)
- **Postconditions**:
  - Returns a pure `number`; no state mutation.
  - Resolve thresholds from `state.skills` (same as `incrementStaffWarning`):
    - `firstThreshold = state.skills.includes('charming-personality') ? CHARMING_FIRST_THRESHOLD : STAFF_WARNING_THRESHOLD`
    - `stackThreshold = state.skills.includes('charming-personality') ? CHARMING_STACK_THRESHOLD : STAFF_WARNING_STACK_THRESHOLD`
  - Derive level from `state.staffWarningCount`:
    - `count < firstThreshold` → `'none'`
    - `count >= firstThreshold && count < stackThreshold` → `'warning'`
    - `count >= stackThreshold` → `'stacked'`
  - If `state.skills` includes `'vip-status'`:
    - At `'warning'` or `'stacked'`: return `VIP_STATUS_SPEED_BUFF` (e.g., `1.1` [TUNE]).
    - At `'none'`: return `1.0`.
  - Otherwise:
    - `'none'`    → `1.0`
    - `'warning'` → `1.0 - STAFF_WARNING_DEBUFF` (e.g., `0.8`)
    - `'stacked'` → `1.0 - STAFF_WARNING_STACK_DEBUFF` (e.g., `0.6`)
- **Edge cases**:
  - VIP Status replaces the debuff entirely at the threshold. There is no stacking interaction between VIP Status and the two debuff levels.
  - If the counter is at `'none'` and VIP Status is held, the player gets no buff (VIP buff only activates at the threshold, not passively).
  - This function is called by the game loop and UI to adjust action durations and animations; it must be pure and have no side effects.

---

## State Transitions

### Staff Warning Level

```
staffWarningCount = 0 ──────────────────────────────────► level: 'none'    → speedModifier = 1.0
                                                              │
                         (count reaches firstThreshold)       │
                                                              ▼
                                                          level: 'warning'  → speedModifier = 0.8 (or VIP buff)
                                                              │
                         (count reaches stackThreshold)       │
                                                              ▼
                                                          level: 'stacked'  → speedModifier = 0.6 (or VIP buff)
                                                              │
                         (Rest node)                          │
                                                              ▼
                                                          level: 'none'  (count reset to 0)
```

**Default thresholds**: first=3, stack=5
**With Charming Personality**: first=5, stack=7

### Grill Fire Slot State

```
slot (burnt meat present, timer exceeds trigger)
  └─► applyGrillFire called
        └─► slot.disabled = true, slot.fireTimer = 10s (or 5s with 'fire-control')
              └─► tickPenalties decrements slot.fireTimer each tick
                    └─► fireTimer reaches 0 → slot.disabled = false, slot re-enabled
```

---

## Invariants

1. `state.actionDisabledTimer` is always `>= 0`.
2. `slot.fireTimer` is always `>= 0` for all slots.
3. `state.staffWarningCount` is always `>= 0` and never decreases except at Rest nodes or via `'regular-customer'` skill.
4. `state.burntSmokeActive` accurately reflects whether any grill slot currently holds burnt meat — it is recalculated every tick.
5. `getSpeedModifier` is a pure function of `state` — calling it twice with the same state always returns the same value.
6. `applyRawMeatPenalty` with `'iron-stomach'` held always returns the state unchanged (zero-overhead no-op).
7. Difficulty penalty scaling is capped: `min(cycle - 1, PENALTY_SCALING_CAP_CYCLE - 1)` ensures no increases beyond cycle 5.
8. All returned states are new objects — no input state is mutated.
9. All constant names are imported from `src/game/data/constants.ts` — no local redefinitions.

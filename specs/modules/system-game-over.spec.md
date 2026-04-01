# Module Spec: Game Over System

## Purpose
Evaluates all active game-over conditions in priority order and returns the first triggered condition, or `null` if the run continues. Enforces the staged-unlock rules so conditions are only checked when active for the current restaurant context.

## File Path
`src/game/systems/game-over.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `GameOverReason`, `RestaurantType`
- `src/game/data/constants.ts` — `GRILL_FIRE_GAME_OVER_THRESHOLD`, `INITIAL_TABLE_CAPACITY`

---

## Types Referenced

```ts
type GameOverReason = 'table-overflow' | 'grill-fire' | 'raw-paralysis' | 'burnt-instant';
```

> Note: `state.gameOver` is a scalar `GameOverReason | null` — a plain string union or `null`. There is no wrapper object. The engine sets `state.gameOver = reason` on trigger.

---

## Staged Unlock Rules

Conditions become active based on `state.highestRestaurantTypeReached` (numeric index: 0=chain, 1=local, 2=high-end, 3=boss). Once unlocked, conditions remain permanently active for all subsequent restaurants in the run.

| Priority | Condition         | Active when                                                                              |
|---|---|---|
| 1        | `'burnt-instant'` | Character is `'raw-food-advocate'` — always active, ignores staged unlock entirely       |
| 2        | `'table-overflow'`| Always (from the very first restaurant)                                                  |
| 3        | `'grill-fire'`    | `state.highestRestaurantTypeReached >= 2` (player has ever reached High-End or Boss)     |
| 4        | `'raw-paralysis'` | `state.highestRestaurantTypeReached >= 3` (player has ever reached a Boss restaurant)    |

> **Implementation note**: `state.highestRestaurantTypeReached` is updated by `advanceToNextRestaurant` in `system-restaurant.ts` as `max(previousHighest, newIndexInCycle)`. On a brand-new run its initial value is `0` (Chain).

---

## Functions

### `checkGameOver(state: GameState): GameOverReason | null`

- **Purpose**: Evaluates all active conditions in priority order. Returns the `GameOverReason` of the first triggered condition, or `null` if none are triggered.
- **Preconditions**:
  - Called once per game loop tick (after `tickPenalties` and `tickServing` have run).
  - `state.restaurant !== null`
  - `state.gameOver === null` (caller should short-circuit if already set)
- **Postconditions**:
  - Pure function; returns `GameOverReason | null`. No state mutation.
  - Checks conditions in priority order (1 → 4); returns on first match.
  - If no condition is triggered, returns `null`.
- **Evaluation order**:
  1. `'burnt-instant'` — checked first if `isConditionActive('burnt-instant', state)`.
     - Trigger: any `slot.state === 'burnt'` and `slot.part !== null`.
  2. `'table-overflow'` — always active.
     - Trigger: `state.table.length > state.tableCapacity`.
  3. `'grill-fire'` — active if `isConditionActive('grill-fire', state)`.
     - Trigger: any `slot.fireTimer > GRILL_FIRE_GAME_OVER_THRESHOLD`.
  4. `'raw-paralysis'` — active if `isConditionActive('raw-paralysis', state)`.
     - Trigger: `state.table.length > state.tableCapacity` while `state.actionDisabledTimer > 0`.
     - Note: Raw paralysis is a named presentation of a table overflow that occurs during action disable. It takes precedence over plain `'table-overflow'` when both the staged unlock is active and the player is currently disabled.

> **Priority clarification**: `'burnt-instant'` is checked FIRST (highest priority) since it is a character-invariant condition that fires the instant a `burnt` transition occurs, before any other checks could matter.

- **Edge cases**:
  - Multiple conditions can be simultaneously triggered in a single tick. Only the first (highest priority) is returned.
  - When the engine receives a non-null result, it applies it via `state.gameOver = reason` (scalar assignment).

---

### `isConditionActive(condition: GameOverReason, state: GameState): boolean`

- **Purpose**: Returns `true` if the specified game-over condition is currently active for the given game state, based on the staged-unlock rules and character.
- **Preconditions**:
  - `state.restaurant !== null`
- **Postconditions**:
  - Pure function; no mutation.
  - **`'table-overflow'`**: always returns `true`.
  - **`'grill-fire'`**:
    - Returns `true` if `state.highestRestaurantTypeReached >= 2`.
    - Returns `false` if the player has only seen Chain (0) and Local (1) restaurants so far.
  - **`'raw-paralysis'`**:
    - Returns `true` if `state.highestRestaurantTypeReached >= 3`.
    - Returns `false` otherwise.
  - **`'burnt-instant'`**:
    - Returns `true` if `state.character === 'raw-food-advocate'`.
    - Returns `false` for all other characters.
- **Edge cases**:
  - `highestRestaurantTypeReached` is monotonically non-decreasing within a run.
  - On a brand-new run, `highestRestaurantTypeReached = 0` (Chain is the first restaurant).
  - For Raw Food Advocate: `isConditionActive('grill-fire', state)` may still return `false` at a Chain restaurant, but `'burnt-instant'` will return `true`. The two conditions are independent.

---

## Condition Trigger Details

### 1. Burnt Instant (`'burnt-instant'`)

- **Mechanism**: In `advanceGrilling` (grilling system), when any slot transitions to `burnt` state, the game loop checks `checkGameOver`. This condition fires immediately at the transition tick.
- **Character-specific**: only applies when `state.character === 'raw-food-advocate'`.
- **Staged unlock**: explicitly ignored — always active from the first restaurant of the run.
- **No grace period**: the game over triggers at the same tick as the `burnt` transition.

### 2. Table Overflow (`'table-overflow'`)

- **Mechanism**: Triggered in `serveDish` (grilling system) when a new dish arrives and `state.table.length >= state.tableCapacity`. Evaluated inline: `state.table.length > state.tableCapacity`.
- **Active from**: the very first restaurant (Chain, cycle 1).

### 3. Grill Fire (`'grill-fire'`)

- **Mechanism**: A grill slot that holds burnt meat accumulates time tracked via `slot.fireTimer`. This timer is updated by `tickPenalties`. When `slot.fireTimer > GRILL_FIRE_GAME_OVER_THRESHOLD` (15s [TUNE]), this condition fires.
- **Exact threshold**: strictly greater than `GRILL_FIRE_GAME_OVER_THRESHOLD` (at exactly 15s, game over is NOT yet triggered).
- **Active from**: first High-End restaurant seen in the run (`highestRestaurantTypeReached >= 2`); persists for all subsequent restaurants.
- **Per-slot independence**: each slot has its own `fireTimer`; multiple burnt slots can each independently trigger game over.

### 4. Raw Paralysis (`'raw-paralysis'`)

- **Mechanism**: A table overflow that occurs while `state.actionDisabledTimer > 0`. Checked inline in `checkGameOver` — no separate flag object; the condition is derived directly from `state.table.length > state.tableCapacity && state.actionDisabledTimer > 0`.
- **Active from**: first Boss restaurant seen in the run (`highestRestaurantTypeReached >= 3`); persists for all subsequent restaurants.
- **Display purpose**: when `'raw-paralysis'` is the returned reason, the game over screen shows a specific message referencing the action disable.
- **Precedence**: takes priority over plain `'table-overflow'` when both are triggered simultaneously and the staged unlock is active.

---

## State Transitions

```
Every game loop tick:
  tickPenalties(state, dt)
    └─► updates: actionDisabledTimer, slot.fireTimer, burntSmokeActive
  tickServing(state, dt)
    └─► may trigger table overflow (checked inline in checkGameOver)
  advanceGrilling (per slot, in engine)
    └─► may transition slot to 'burnt'
  checkGameOver(state)
    └─► returns null      → run continues
    └─► returns reason    → engine sets state.gameOver = reason  (scalar assignment)
                            → game loop stops; score screen shown
```

---

## Invariants

1. `checkGameOver` is a pure function — it never modifies `state`. The engine applies the returned `GameOverReason` via `state.gameOver = reason`.
2. `isConditionActive` is a pure function.
3. Conditions are evaluated in strict priority order; the first triggered condition is returned and evaluation stops.
4. `'burnt-instant'` is always the highest priority check when the character is `'raw-food-advocate'`.
5. `'table-overflow'` is always active — `isConditionActive('table-overflow', state)` always returns `true`.
6. `state.highestRestaurantTypeReached` is monotonically non-decreasing within a run.
7. No game-over condition directly modifies the game state; they only signal to the engine that the run should end.
8. `'raw-paralysis'` can only be returned when `isConditionActive('raw-paralysis', state)` is `true`. Before Boss is reached, a table overflow during action disable is still reported as `'table-overflow'`.
9. All constant names are imported from `src/game/data/constants.ts` — no local redefinitions.
10. `state.gameOver` is a scalar `GameOverReason | null` — assignment is `state.gameOver = reason`, never an object wrapper.

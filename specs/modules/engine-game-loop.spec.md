# Module Spec: Game Engine

## Purpose
The central game loop: initializes run state, drives per-frame updates (timers, serving, penalties, game-over checks), dispatches player actions, and manages phase transitions.

## File Path
`src/game/engine/game-loop.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `CharacterId`, `PlayerAction`, `GameOverReason`
- `src/game/data/characters.ts` — `CHARACTER_DEFINITIONS`
- `src/game/data/restaurants.ts` — `RESTAURANT_DEFINITIONS`, restaurant cycle helpers
- `src/game/data/meats.ts` — `MEAT_PARTS`, `VEGETABLE_PARTS`, `ALL_PARTS`
- `src/game/data/constants.ts` — all numeric constants
- `src/game/systems/skill.ts` — `acquireSkill`, `applySkillModifiers`, `generateSkillChoices`
- `src/game/systems/economy.ts` — `awardRestaurantClearCoins`, `awardEatCoins`, `awardDiscardCoins`, `awardStreakCoins`, `awardSlotEfficiencyCoins`, `awardQuickTurnoverCoins`, `getExchangeCost`
- `src/game/systems/character.ts` — `getCharacterModifiers`, `processVeganExchange`, `canUnlockCharacter`
- `src/game/systems/catalog.ts` — `unlockCatalogEntry`
- `src/game/systems/node.ts` — `shouldShowNode`
- `src/game/systems/penalty.ts` — penalty application helpers (separate module)
- `src/utils/persistence.ts` — `loadPersistentState`, `savePersistentState`, `saveHighScore`

---

## Constants

All constants are imported from `src/game/data/constants.ts`. No local redefinitions.

```ts
// Referenced from data-constants — all values are [TUNE]
// INITIAL_GRILL_SLOTS = 3                          initial number of grill slots
// INITIAL_TABLE_CAPACITY = 5                        initial table capacity
// (score starts at 0 — no constant needed)
// GRILL_FIRE_DISABLE_DURATION = 10
// GRILL_FIRE_GAME_OVER_THRESHOLD = 15               burnt left this long → game over
// SWEET_SPOT_REDUCTION_PER_CYCLE = 0.3              sweet_spot −0.3s per cycle
// SWEET_SPOT_SCALING_CAP_CYCLE = 5                  difficulty cap at cycle 5
// SERVING_SPEED_REDUCTION_PER_CYCLE = 0.5           interval −0.5s per cycle
// SERVING_SPEED_MAX_REDUCTION = 1.0                 cap: max −1.0s (reached at cycle 3)
// FLIP_TIMER_RESET_FRACTION = 0.5                   flip resets remaining time to 50% of full state duration
// TRUE_ENDING_CYCLE = 4                             Boss of Cycle 4 = "clear the game"
// SKILL_CHOICE_COUNT = 3
```

---

## Canonical GameState shape

```ts
interface GameState {
  character: CharacterId;
  grill: GrillSlot[];
  table: Part[];  // can hold meat and vegetables
  tableCapacity: number;
  restaurant: Restaurant;
  staffWarningCount: number;
  actionDisabledTimer: number;
  burntSmokeActive: boolean;
  consecutiveEatCount: number;
  bingeNextDishDoubled: boolean;
  allSlotsOccupiedLastTick: boolean;
  skills: string[];
  coins: number;
  score: number;
  cycle: number;
  restaurantIndexInCycle: number;
  highestRestaurantTypeReached: number;
  gameOver: GameOverReason | null;
  catalog: string[];
  elapsedTime: number;
  phase: 'playing' | 'skill-select' | 'node-select' | 'game-over' | 'true-ending';
  pendingSkillChoices: SkillDefinition[];
  pendingNodeChoice: boolean;
}
```

`gameOver` is a scalar `GameOverReason | null` — not a nested object. There is no `penalty` sub-object on `GameState`.

### GrillSlot canonical shape

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

### GameOverReason canonical values

```ts
type GameOverReason = 'table-overflow' | 'grill-fire' | 'raw-paralysis' | 'burnt-instant';
```

---

## Functions

### `initGameState(characterId: CharacterId): GameState`
- **Purpose**: Creates and returns the complete initial `GameState` for a new run with the selected character.
- **Preconditions**:
  - `characterId` is a valid, unlocked character (caller is responsible for checking unlock status before calling).
- **Postconditions**:
  - `character` is set to the provided `characterId`.
  - `cycle` = 1, `restaurantIndexInCycle` = 0 (first restaurant is Chain).
  - `score` = 0.
  - `grill`: array of `INITIAL_GRILL_SLOTS` (3) empty `GrillSlot` objects, all `part: null`, `disabled: false`, `disabledTimer: 0`, `timeInState: 0`, `fireTimer: 0`, `state: 'raw'`.
  - `table`: `[]`.
  - `tableCapacity`: `INITIAL_TABLE_CAPACITY` (5).
  - `staffWarningCount`: 0.
  - `actionDisabledTimer`: 0.
  - `burntSmokeActive`: false.
  - `consecutiveEatCount`: 0.
  - `bingeNextDishDoubled`: false.
  - `allSlotsOccupiedLastTick`: false.
  - `skills`: contains only the character's starter skill ID (from `CHARACTER_DEFINITIONS[characterId].starterSkillId`). `acquireSkill` is called for this starter skill so structural effects are applied immediately.
  - `coins`: 0.
  - `phase`: `'playing'`.
  - `gameOver`: `null`.
  - `pendingSkillChoices`: `[]`.
  - `pendingNodeChoice`: false.
  - `catalog`: loaded from `loadCatalog()` (persistent across runs).
  - `highestRestaurantTypeReached`: 0.
  - `elapsedTime`: 0.
  - `restaurant`: initialized via `createRestaurant(1, 0, 0)` — first Chain restaurant at `elapsedTime: 0`; `dishesServed: 0`, `meatDishesEaten: 0`, `timeSinceLastServe: 0`, `startTime: 0`, `effectiveServingInterval` = base Chain interval with cycle 1 scaling applied.
  - Persistent state is loaded via `loadPersistentState()` at init; `clearedWithCharacterIds` from persistent state is available for unlock checks.
- **Edge cases**:
  - Calling with a locked character is a precondition violation; behavior is undefined (should be prevented by UI).
  - Catalog state is loaded from localStorage, so unlocked entries from prior runs are preserved in the new run's state.

---

### `gameTick(state: GameState, deltaTime: number, random: () => number): GameState`
- **Purpose**: The main update function. Advances all real-time game state by `deltaTime` seconds. Called each animation frame. Pure: returns a new `GameState`.
- **Preconditions**:
  - `state.phase === 'playing'` (tick only runs during the playing phase; other phases pause the loop or call different handlers).
  - `deltaTime > 0` and `deltaTime < 1.0` (a full second would be a missed frame; very large values should be clamped by the caller).
  - `state.gameOver === null` on entry.
- **Postconditions — executed in this order**:

  **Step 1 — Advance grill timers (all slots)**:
  - For each non-null, non-disabled slot: call `advanceGrilling(slot, deltaTime, state.skills, state.cycle, random)` from `system-grilling`. This handles `timeInState` advancement, state transitions, flare risk checks, and Heat Sensor warnings.
  - State transitions are driven by `timeInState`: when `timeInState >= grillTime` (or `>= effectiveSweetSpot` for well-done), state advances (`raw → rare → medium → well-done → burnt`) and `timeInState` resets to 0.
  - If the resulting state is `'burnt'` and `state.character === 'raw-food-advocate'` AND the part is meat (not vegetable): set `gameOver = 'burnt-instant'` and `phase = 'game-over'`.

  **Step 2 — Check / apply flare risk**:
  - Delegated to `advanceGrilling` (called in Step 1), which uses the injected `random` function and the per-second boundary check. `gameTick` passes its own `random` parameter through to `advanceGrilling(slot, deltaTime, state.skills, state.cycle, random)`.
  - Flare check per second boundary: `if (random() < part.flareRisk)` → flare triggers; `newTimeInState = max(0, timeInState - grillTime × FLIP_TIMER_RESET_FRACTION)`.
  - If Heat Sensor is held (`applySkillModifiers(state).heatSensorEnabled`) and the slot is in `'well-done'` state with `effectiveSweetSpot - timeInState <= HEAT_SENSOR_WARNING_SECONDS`: signal heat sensor warning (UI concern; not stored on `GrillSlot`).
  - Flare risk on vegetables: `VegetablePart.flareRisk = 0`; skip flare check for vegetables.
  - Tests inject `() => 0` (always triggers flare) or `() => 1` (never triggers flare) for determinism.

  **Step 3 — Tick serving timer; serve dishes if due**:
  - Increment `restaurant.timeSinceLastServe` by `deltaTime`.
  - If `timeSinceLastServe >= effectiveServingInterval` AND dishes remaining:
    - Select next dish to serve (meat or vegetable, based on restaurant rank distribution and vegetable mix ratio [TUNE]).
    - Attempt to place dish on an available grill slot (`part === null` AND `disabled === false`).
    - If an available slot exists: place dish on slot, reset slot state to `'raw'`, set `timeSinceLastServe = 0`, increment `dishesServed`.
    - If no available slot exists: add dish to `table`.
    - If `table.length` would exceed `INITIAL_TABLE_CAPACITY` (or expanded capacity) after adding: set `gameOver = 'table-overflow'`, `phase = 'game-over'` — dish is NOT added.
    - `awardSlotEfficiencyCoins` is called after each slot placement to check the full-occupancy condition (comparing against `state.allSlotsOccupiedLastTick` for edge-trigger).
    - After processing all serves this tick: update `allSlotsOccupiedLastTick` to reflect whether all non-disabled slots are currently occupied.
  - Serving speed scaling: `effectiveServingInterval = baseInterval - min(cycle - 1, 2) * SERVING_SPEED_REDUCTION_PER_CYCLE`. The cap of `SERVING_SPEED_MAX_REDUCTION` (−1.0s) is reached at cycle 3.

  **Step 4 — Tick penalty timers**:
  - Decrement `actionDisabledTimer` by `deltaTime`; clamp to 0 when it reaches 0 (raw meat paralysis lifted).
  - Decrement `disabledTimer` on each disabled slot by `deltaTime`; when `disabledTimer <= 0`: set `disabled = false`, `disabledTimer = 0` (grill fire slot re-enabled).

  **Step 5 — Check grill fire timers**:
  - For each slot in `'burnt'` state with a non-null part:
    - If `timeInState > GRILL_FIRE_GAME_OVER_THRESHOLD` AND the staged game-over condition is active (High-End restaurant or later): set `gameOver = 'grill-fire'`, `phase = 'game-over'`.
    - Else if the slot is not already disabled: start a Grill Fire — set `disabled = true`, set `disabledTimer = GRILL_FIRE_DISABLE_DURATION × (fireControlActive ? FIRE_CONTROL_MULTIPLIER : 1)`. Remove the burnt part from the slot (`part = null`). Set `burntSmokeActive = true`.

  **Step 6 — Check game over conditions**:
  - If `gameOver` is already set from prior steps: skip (game over already resolved in that step).
  - Belt-and-suspenders table overflow check: if `table.length > tableCapacity`, set `gameOver = 'table-overflow'`, `phase = 'game-over'`.

  **Step 7 — Return new state**:
  - Increment `elapsedTime` by `deltaTime`.
  - Return the fully updated `GameState`.

- **Edge cases**:
  - If `state.phase !== 'playing'`: return state unchanged (tick is a no-op outside the playing phase).
  - `deltaTime` of 0 is a no-op (no state changes).
  - Staged game-over conditions: `'grill-fire'` only triggers at `'high-end'` and `'boss'` restaurants; at `'chain'` and `'local'`, burnt meat fires but does NOT escalate to game over. `'raw-paralysis'` only triggers at `'boss'`.
  - Difficulty scaling: sweet_spot reduction uses `min(cycle - 1, SWEET_SPOT_SCALING_CAP_CYCLE - 1) × SWEET_SPOT_REDUCTION_PER_CYCLE`.

---

### `processAction(state: GameState, action: PlayerAction, slotIndex: number): GameState`
- **Purpose**: Dispatches a player action for the specified grill slot to the appropriate system function. Returns the updated state.
- **Preconditions**:
  - `state.phase === 'playing'`.
  - `state.grill[slotIndex]` exists and has `part !== null`.
  - Action-specific preconditions (see per-action notes below).
- **Action-disable rules**:
  - When `actionDisabledTimer > 0` (raw-paralysis active): `'eat'` and `'flip'` are blocked. `'discard'` IS allowed — it can proceed during action-disable.
- **Postconditions**:

  **`'eat'`**:
  - Blocked when `actionDisabledTimer > 0`.
  - Precondition: `slot.state !== 'burnt'` (burnt meat cannot be eaten).
  - If `slot.state === 'raw'` AND raw penalty is NOT negated (`!modifiers.rawPenaltyNegated`): apply raw meat penalty — set `actionDisabledTimer` based on penalty duration (base 3s, multiplied by `rawToleranceDurationMultiplier`).
  - Calls `awardEatCoins(state, slot.state, slot.part)`.
  - Increments `consecutiveEatCount` by 1.
  - Calls `awardStreakCoins` after incrementing.
  - If `hasSkill(state, 'binge-mode')` AND `bingeNextDishDoubled`: apply ×2 coin multiplier to the eat result, then reset `bingeNextDishDoubled = false`.
  - If `hasSkill(state, 'binge-mode')` AND `consecutiveEatCount % modifiers.eatingStreakThreshold === 0 && consecutiveEatCount > 0` (post-increment; threshold = 5 normally, 3 if Digestive Pro held): set `bingeNextDishDoubled = true`. Counter is NOT reset — Binge fires again every N additional eats (at counts N, 2N, 3N, etc.).
  - If `state.character === 'vegan-tashiro'` AND `!slot.part.isVegetable`: increment `staffWarningCount` by `VEGAN_MEAT_EAT_WARNING_PENALTY`.
  - Calls `unlockCatalogEntry(state, slot.part.id)`.
  - Clears the slot (`part = null`, `state = 'raw'`, `timeInState = 0`, `fireTimer = 0`).
  - Increments `restaurant.meatDishesEaten` (only if part was meat, not vegetable).
  - If `table.length > 0`: move first dish from `table` to the now-empty slot (FIFO queue).
  - Calls `checkPhaseTransition` to determine if restaurant is now cleared.
  - `consecutiveEatCount` is NOT reset by eat; it is reset only by discard.

  **`'discard'`**:
  - Allowed even when `actionDisabledTimer > 0`.
  - Available for any grill state.
  - Delegates to `discardMeat(state, slotIndex)` from `system-grilling`, which handles all of: coin awards (Tare Conversion, Char Bonus), staff warning increment logic, slot clearing, and `moveTableToGrill`. No additional staff warning logic is applied here.
  - Resets `consecutiveEatCount` to 0 (discard breaks the eating streak).
  - Does NOT reset `bingeNextDishDoubled` — the binge bonus persists across discards.

  **`'flip'`**:
  - Blocked when `actionDisabledTimer > 0`.
  - Precondition: `applySkillModifiers(state).flipAvailable === true` (Tong Master held).
  - Precondition: `slot.state !== 'burnt'` (burnt meat cannot be flipped).
  - Delegates to `flipMeat(slot)` from `system-grilling`, which operates on `timeInState` only:
    - For non-`well-done` states (raw, rare, medium): `newTimeInState = max(0, timeInState - grillTime × FLIP_TIMER_RESET_FRACTION)`.
    - For `well-done` state: `newTimeInState = max(0, timeInState - sweetSpot × FLIP_TIMER_RESET_FRACTION)`.
  - `fireTimer` is NOT touched by flip.
  - Does NOT reset `consecutiveEatCount`.
  - Does not affect coins, streak, or Staff Warning.

  **`'instant-exchange'`**:
  - Precondition: `state.character === 'vegan-tashiro'`.
  - Precondition: `state.coins >= getExchangeCost(state)`.
  - Delegates to `processVeganExchange(state, slotIndex, 'instant', getExchangeCost(state))`.

  **`'delayed-exchange'`**:
  - Precondition: `state.character === 'vegan-tashiro'`.
  - Delegates to `processVeganExchange(state, slotIndex, 'delayed', 0)`.

- **Edge cases**:
  - Attempting to eat `'burnt'` meat: return state unchanged (guard; should not be reachable from valid UI).
  - Attempting `'flip'` without Tong Master: return state unchanged.
  - Attempting `'instant-exchange'` or `'delayed-exchange'` as non-Vegan Tashiro: return state unchanged.
  - `slotIndex` out of bounds: return state unchanged.

---

### `checkPhaseTransition(state: GameState): GameState`
- **Purpose**: Checks whether the current restaurant has been cleared, and if so, transitions to the appropriate next phase. Also handles True Ending trigger.
- **Preconditions**:
  - Called after each eat action (the only action that can clear a restaurant).
  - `state.phase === 'playing'` on entry.
- **Postconditions**:
  - If `restaurant.meatDishesEaten < restaurant.totalMeatDishes`: restaurant is not cleared — returns state unchanged.
  - **Restaurant cleared**:
    - Increments `score` by 1.
    - Calls `awardRestaurantClearCoins(state)` (base income + Regular Customer Bonus check).
    - Calls `awardQuickTurnoverCoins(state)` (Quick Turnover Bonus check).
    - Updates `highestRestaurantTypeReached` if current restaurant type index > current value.
    - **True Ending check**: if `cycle === TRUE_ENDING_CYCLE` AND `restaurantIndexInCycle === 3` (Boss position):
      - Sets `phase = 'true-ending'`.
      - Adds `state.character` to `clearedWithCharacterIds` in persistent state (via `savePersistentState`).
      - Saves high score.
      - Returns.
    - Otherwise:
      - Generates skill choices via `generateSkillChoices(state, SKILL_CHOICE_COUNT)`.
      - Sets `phase = 'skill-select'`.
      - Determines whether a node will follow skill selection:
        - Calls `shouldShowNode(cycle, restaurantIndexInCycle + 1)` from `system-node` (per-cycle position check, not cumulative restaurants cleared).
        - Sets a pending node flag if a node is due.
      - Returns new state with `phase = 'skill-select'`.
  - After the player selects a skill:
    - If node is pending: transition to `phase = 'node-select'`.
    - If no node pending: advance to next restaurant — increment `restaurantIndexInCycle`; if `restaurantIndexInCycle >= 4`, increment `cycle` and reset `restaurantIndexInCycle` to 0. Initialize `restaurant` via `createRestaurant(newCycle, newIndex, state.elapsedTime)`. Set `phase = 'playing'`.
- **Binge streak across restaurants**:
  - `consecutiveEatCount` carries over into the next restaurant; it is NOT reset on restaurant clear.
  - Streak resets only on discard.
- **Edge cases**:
  - If skill pool is empty (all skills acquired): `generateSkillChoices` returns `[]`; the UI should auto-skip the selection screen and proceed to node/next restaurant immediately.
  - Node frequency: `shouldShowNode(cycle, restaurantIndexInCycle + 1)` is called from the node system (1-based count) — do not compute node frequency inline in the engine.
  - `awardQuickTurnoverCoins` uses `restaurant.startTime` (set to `state.elapsedTime` at restaurant creation via `createRestaurant`) for pure game-time DPM calculation.
  - Cycle advancement: `restaurantIndexInCycle` wraps from 3 to 0; `cycle` increments by 1 after each complete cycle (Chain → Local → High-End → Boss).

---

## Invariants

- `gameTick` is the ONLY function that advances grill timers and serving timers; no other function mutates these values.
- `gameTick` is called exclusively via `requestAnimationFrame` or a fixed-interval ticker; `setTimeout` chains are not used.
- All functions in this module are pure: they receive `state` and return a new `GameState`; no in-place mutation.
- `state.phase` transitions follow a strict directed graph: `'playing' → 'skill-select' → 'node-select' → 'playing'` (or `'playing' → 'game-over'`, `'playing' → 'true-ending'`).
- `checkPhaseTransition` is called after eat actions only; discard and flip do not trigger restaurant-clear checks.
- `score` is incremented only by `checkPhaseTransition` and only when a restaurant is fully cleared; no other code path increments it.
- `gameOver` is set to non-null exactly once and never reset within a run (only cleared when `initGameState` starts a new run).
- `deltaTime` passed to `gameTick` must be clamped to a safe maximum by the caller (e.g., `min(deltaTime, 0.1)`) to prevent simulation jumps on tab-resume.
- `consecutiveEatCount` resets only on discard. Flip does NOT reset it. Restaurant clear does NOT reset it.
- Discard is permitted when `actionDisabledTimer > 0`. Only eat and flip are blocked by action-disable.
- All constants are imported from `src/game/data/constants.ts` using their canonical names. `INITIAL_GRILL_SLOTS` is the canonical name (not `INITIAL_GRILL_SLOTS` renamed to anything else).

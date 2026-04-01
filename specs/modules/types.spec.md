# Module Spec: Shared Type Definitions

## Purpose
Central TypeScript type definitions shared across all game modules — union types, interfaces, and the master GameState shape.

## File Path
`src/types/index.ts`

## Dependencies
- None (this module has no imports; all other modules import from here)

---

## Types / Interfaces

### Union Types

#### `GrillingState`
```ts
type GrillingState = 'raw' | 'rare' | 'medium' | 'well-done' | 'burnt';
```
- Ordered progression; each transition is time-based (determined by `MeatPart.grillTime`)
- `well-done` is the perfect state for most meats
- `burnt` is terminal — no further transitions

#### `MeatRank`
```ts
type MeatRank = 'common' | 'upper' | 'premium' | 'elite';
```
- `common` — available in Chain restaurants from the start
- `upper` — first appears in Local restaurants
- `premium` — first appears in High-End restaurants
- `elite` — appears only in Boss restaurants

#### `RestaurantType`
```ts
type RestaurantType = 'chain' | 'local' | 'high-end' | 'boss';
```
- Fixed cycle order: `chain → local → high-end → boss`, then repeats

#### `NodeType`
```ts
type NodeType = 'shop' | 'rest';
```

#### `CharacterId`
```ts
type CharacterId = 'tanaka' | 'gourmet-critic' | 'competitive-eater' | 'raw-food-advocate' | 'vegan-tashiro';
```

#### `PenaltyType`
```ts
type PenaltyType = 'raw-meat' | 'burnt-smoke' | 'discard-loss' | 'staff-warning' | 'grill-fire';
```

#### `GameOverReason`
```ts
type GameOverReason = 'table-overflow' | 'grill-fire' | 'raw-paralysis' | 'burnt-instant';
```
- `table-overflow` — active from start
- `grill-fire` — staged; unlocks at High-End restaurants
- `raw-paralysis` — staged; unlocks at Boss restaurants
- `burnt-instant` — always active; character-specific only (Raw Food Advocate)

#### `PlayerAction`
```ts
type PlayerAction = 'eat' | 'discard' | 'flip' | 'instant-exchange' | 'delayed-exchange';
```
- `flip` — requires Tong Master skill
- `instant-exchange` / `delayed-exchange` — Vegan Tashiro only

#### `SkillBuild`
```ts
type SkillBuild = 'raw-rush' | 'precision' | 'burnt-exploit' | 'binge' | 'charming' | 'volume' | 'speed' | 'stability' | 'vegan';
```

---

### Interfaces

#### `MeatPart`
```ts
interface MeatPart {
  readonly id: string;
  readonly name: string;           // English name
  readonly nameJP: string;         // Japanese name
  readonly rank: MeatRank;
  readonly grillTime: number;      // seconds per state transition (from GRILL_TIME constants)
  readonly flareRisk: number;      // probability per second of acceleration (from FLARE_RISK constants)
  readonly sweetSpot: number;      // well-done window duration in seconds (from SWEET_SPOT constants)
  readonly flavorText: string;     // humorous text shown in the meat catalog (GAME_DESIGN.md §12)
  readonly isVegetable: false;
}
```

#### `VegetablePart`
```ts
interface VegetablePart {
  readonly id: string;
  readonly name: string;
  readonly nameJP: string;
  readonly grillTime: number;
  readonly flareRisk: 0;           // always 0 for vegetables
  readonly sweetSpot: number;
  readonly isVegetable: true;
}
```

#### `Part`
```ts
type Part = MeatPart | VegetablePart;
```
- Discriminated union on `isVegetable`

#### `GrillSlot`
```ts
interface GrillSlot {
  readonly id: number;             // 0-based index
  readonly part: Part | null;  // null = empty; Part = MeatPart | VegetablePart, discriminated on isVegetable
  readonly state: GrillingState;
  readonly timeInState: number;    // seconds elapsed in current grilling state
  readonly fireTimer: number;      // seconds since meat became burnt (0 if not burnt)
  readonly disabled: boolean;      // true if slot disabled by grill fire
  readonly disabledTimer: number;  // seconds remaining until slot re-enables (0 if not disabled)
}
```
- `remainingTime` is not stored — callers compute it as `grillTime - timeInState` (for pre-well-done states) or `sweetSpot - timeInState` (for well-done state)
- Flip is modelled by resetting `timeInState` to `FLIP_TIMER_RESET_FRACTION × full state duration`; no separate `flipped` field is needed

#### `UnlockCondition`
Discriminated union for character unlock conditions:
```ts
type UnlockCondition =
  | { readonly type: 'default' }
  | { readonly type: 'clear-with'; readonly characterId: CharacterId }
  | { readonly type: 'clear-with-any'; readonly characterType: 'specialist' | 'peaky' };
```

#### `SkillDefinition`
```ts
interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly nameJP: string;
  readonly build: SkillBuild;
  readonly description: string;
  readonly isStackable: boolean;   // true if acquiring multiple copies is permitted (e.g., Extra Slot)
}
```

#### `CharacterDefinition`
```ts
interface CharacterDefinition {
  readonly id: CharacterId;
  readonly name: string;
  readonly nameJP: string;
  readonly type: 'balanced' | 'specialist' | 'peaky';
  readonly starterSkillId: string;
  readonly unlockCondition: UnlockCondition;
  readonly modifiers: CharacterModifiers;
}

interface CharacterModifiers {
  readonly sweetSpotBonus?: Partial<Record<MeatRank, number>>;    // seconds added to sweet_spot per rank
  readonly eatSpeedMultiplier?: number;                           // overrides all skill-based eat speed (e.g., 0.5 for Competitive Eater)
  readonly sweetSpotPenaltyMultiplier?: number;                  // multiplier narrowing sweet_spot (e.g., <1.0 for Competitive Eater) [TUNE]
  readonly coinMultiplierByRank?: Partial<Record<MeatRank, number>>;  // coin value multipliers per rank
  readonly vegetableCoinMultiplier?: number;                     // Vegan Tashiro ×3
  readonly meatEatStaffWarningIncrement?: number;                // Vegan Tashiro +2 on eating meat
  readonly instantGameOverOnBurn?: boolean;                      // Raw Food Advocate
}
```

#### `RestaurantDefinition`
```ts
interface RestaurantDefinition {
  readonly type: RestaurantType;
  readonly nameJP: string;
  readonly totalDishes: number;
  readonly servingInterval: number;               // base seconds between dishes (cycle 1)
  readonly rankDistribution: Record<MeatRank, number>;  // weights summing to 1.0
  readonly activePenalties: readonly PenaltyType[];
}
```

#### `Restaurant`
Runtime restaurant instance (mutable within a run):
```ts
interface Restaurant {
  readonly definition: RestaurantDefinition;
  readonly dishesServed: number;                  // total dishes pushed to table/grill so far
  readonly meatDishesEaten: number;               // count toward clear condition
  readonly totalMeatDishes: number;               // = definition.totalDishes (denormalized for convenience)
  readonly timeSinceLastServe: number;            // seconds elapsed since last dish was served
  readonly effectiveServingInterval: number;      // base interval minus difficulty reduction
  readonly startTime: number;                     // state.elapsedTime when restaurant started (for DPM calculation)
  readonly servingQueue: readonly MeatPart[];     // pre-generated dish queue
  readonly isCleared: boolean;
}
```

#### `GameState`
Master in-memory game state. This is the single source of truth for all in-progress game logic.
```ts
interface GameState {
  // Run metadata
  readonly character: CharacterId;
  readonly cycle: number;                    // 1-based; increments after every Boss clear
  readonly restaurantIndexInCycle: number;   // 0-based position within current cycle (0–3)
  readonly score: number;                    // = restaurants cleared
  readonly highestRestaurantTypeReached: number; // 0–3, monotonically increasing across the run

  // Active restaurant
  readonly restaurant: Restaurant;

  // Grill
  readonly grill: readonly GrillSlot[];

  // Table (dishes waiting to be placed on grill)
  readonly table: readonly Part[];  // dishes waiting — can be meat or vegetables
  readonly tableCapacity: number;            // starts at INITIAL_TABLE_CAPACITY; increased by Table Extension skill

  // Skills
  readonly skills: readonly string[];        // kebab-case skill IDs

  // Coins
  readonly coins: number;

  // Debuffs
  readonly staffWarningCount: number;
  readonly actionDisabledTimer: number;      // seconds remaining; 0 = not disabled
  readonly burntSmokeActive: boolean;

  // Binge tracking
  readonly consecutiveEatCount: number;      // for Binge Mode / Eating Streak Bonus
  readonly bingeNextDishDoubled: boolean;

  // Slot efficiency edge-trigger tracking
  readonly allSlotsOccupiedLastTick: boolean;  // true when all grill slots were occupied at end of last tick

  // Phase
  readonly phase: 'playing' | 'skill-select' | 'node-select' | 'game-over' | 'true-ending';
  readonly gameOver: GameOverReason | null;
  readonly pendingSkillChoices: SkillDefinition[];  // populated after restaurant clear; empty array when none pending
  readonly pendingNodeChoice: boolean;               // true when a node screen is due after skill selection

  // Catalog
  readonly catalog: readonly string[];       // unlocked meat part IDs

  // Timing
  readonly elapsedTime: number;              // seconds elapsed since run start
}
```

#### `PersistentState`
Saved to `localStorage` across runs. Must not contain per-run game state.
```ts
interface PersistentState {
  readonly highScore: number;
  readonly unlockedCharacters: readonly CharacterId[];
  readonly catalog: readonly string[];
  readonly clearedWithCharacterIds: readonly CharacterId[];  // tracks which characters achieved True Ending
}
```

#### `ConsumableItem`
A purchasable one-use item available in the Shop.
```ts
interface ConsumableItem {
  readonly id: string
  readonly name: string
  readonly nameJP: string
  readonly cost: number  // = CONSUMABLE_PURCHASE_COST
  readonly effect: ConsumableEffect
}
```

#### `ConsumableEffect`
Discriminated union of all consumable item effects.
```ts
type ConsumableEffect =
  | { readonly type: 'clear-warning'; readonly amount: number }
  | { readonly type: 'heal-fire'; readonly slotCount: number }
```

---

## Invariants

- `GrillSlot.timeInState` is always ≥ 0; never negative
- `GrillSlot.disabledTimer` is always ≥ 0; 0 when the slot is not disabled
- `GrillSlot.fireTimer` is always ≥ 0; 0 when meat is not in the `burnt` state
- `GameState.table.length` is always ≤ `GameState.tableCapacity`; equality triggers game-over check on next serve
- `GameState.staffWarningCount` is always ≥ 0
- `GameState.coins` is always ≥ 0; spending below 0 is disallowed by the action guard
- `GameState.skills` contains no duplicates (Set semantics enforced)
- `GameState.actionDisabledTimer` is always ≥ 0
- `GameState.consecutiveEatCount` is always ≥ 0
- `GameState.highestRestaurantTypeReached` is always in [0, 3] and never decreases during a run
- `Restaurant.meatDishesEaten` is always ≤ `RestaurantDefinition.totalDishes`
- `RankDistribution` values sum to exactly 1.0
- `PersistentState.unlockedCharacters` always contains `'tanaka'` (always unlocked)
- `PersistentState.clearedWithCharacterIds` is a subset of `PersistentState.unlockedCharacters`
- `GameState` is a plain object — no class instances, no methods, no prototypes
- All state updates return a new `GameState` object; no in-place mutation

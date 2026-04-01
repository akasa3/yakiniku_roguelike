// ---------------------------------------------------------------------------
// Union Types
// ---------------------------------------------------------------------------

export type GrillingState = 'raw' | 'rare' | 'medium' | 'well-done' | 'burnt';

export type MeatRank = 'common' | 'upper' | 'premium' | 'elite';

export type RestaurantType = 'chain' | 'local' | 'high-end' | 'boss';

export type NodeType = 'shop' | 'rest';

export type CharacterId =
  | 'tanaka'
  | 'gourmet-critic'
  | 'competitive-eater'
  | 'raw-food-advocate'
  | 'vegan-tashiro';

export type PenaltyType =
  | 'raw-meat'
  | 'burnt-smoke'
  | 'discard-loss'
  | 'staff-warning'
  | 'grill-fire';

export type GameOverReason =
  | 'table-overflow'
  | 'grill-fire'
  | 'raw-paralysis'
  | 'burnt-instant'
  | 'staff-kicked-out';

export type PlayerAction =
  | 'eat'
  | 'discard'
  | 'flip'
  | 'instant-exchange'
  | 'delayed-exchange';

export type SkillBuild =
  | 'raw-rush'
  | 'precision'
  | 'burnt-exploit'
  | 'binge'
  | 'charming'
  | 'volume'
  | 'speed'
  | 'stability'
  | 'vegan';

// ---------------------------------------------------------------------------
// Interfaces: Parts
// ---------------------------------------------------------------------------

export interface MeatPart {
  readonly id: string;
  readonly name: string;
  readonly nameJP: string;
  readonly rank: MeatRank;
  readonly grillTime: number;
  readonly flareRisk: number;
  readonly sweetSpot: number;
  readonly flavorText: string;
  readonly isVegetable: false;
}

export interface VegetablePart {
  readonly id: string;
  readonly name: string;
  readonly nameJP: string;
  readonly grillTime: number;
  readonly flareRisk: 0;
  readonly sweetSpot: number;
  readonly isVegetable: true;
}

export type Part = MeatPart | VegetablePart;

// ---------------------------------------------------------------------------
// Interfaces: Grill
// ---------------------------------------------------------------------------

export interface GrillSlot {
  readonly id: number;
  readonly part: Part | null;
  readonly state: GrillingState;
  readonly timeInState: number;
  readonly fireTimer: number;
  readonly disabled: boolean;
  readonly disabledTimer: number;
}

// ---------------------------------------------------------------------------
// Interfaces: Unlock Condition
// ---------------------------------------------------------------------------

export type UnlockCondition =
  | { readonly type: 'default' }
  | { readonly type: 'clear-with'; readonly characterId: CharacterId }
  | { readonly type: 'clear-with-any'; readonly characterType: 'specialist' | 'peaky' };

// ---------------------------------------------------------------------------
// Interfaces: Skill
// ---------------------------------------------------------------------------

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly nameJP: string;
  readonly build: SkillBuild;
  readonly description: string;
  readonly isStackable: boolean;
}

// ---------------------------------------------------------------------------
// Interfaces: Character
// ---------------------------------------------------------------------------

export interface CharacterModifiers {
  readonly sweetSpotBonus?: Partial<Record<MeatRank, number>>;
  readonly eatSpeedMultiplier?: number;
  readonly sweetSpotPenaltyMultiplier?: number; // [TUNE]
  readonly coinMultiplierByRank?: Partial<Record<MeatRank, number>>;
  readonly vegetableCoinMultiplier?: number;
  readonly meatEatStaffWarningIncrement?: number;
  readonly instantGameOverOnBurn?: boolean;
}

export interface CharacterDefinition {
  readonly id: CharacterId;
  readonly name: string;
  readonly nameJP: string;
  readonly type: 'balanced' | 'specialist' | 'peaky';
  readonly starterSkillId: string;
  readonly unlockCondition: UnlockCondition;
  readonly modifiers: CharacterModifiers;
}

// ---------------------------------------------------------------------------
// Interfaces: Restaurant
// ---------------------------------------------------------------------------

export interface RestaurantDefinition {
  readonly type: RestaurantType;
  readonly nameJP: string;
  readonly totalDishes: number;
  readonly servingInterval: number;
  readonly rankDistribution: Record<MeatRank, number>;
  readonly activePenalties: readonly (PenaltyType | GameOverReason)[];
}

export interface Restaurant {
  readonly definition: RestaurantDefinition;
  readonly dishesServed: number;
  readonly meatDishesEaten: number;
  readonly totalMeatDishes: number;
  readonly timeSinceLastServe: number;
  readonly effectiveServingInterval: number;
  readonly startTime: number;
  readonly servingQueue: readonly MeatPart[];
  readonly isCleared: boolean;
}

// ---------------------------------------------------------------------------
// Interfaces: GameState
// ---------------------------------------------------------------------------

export interface GameState {
  // Run metadata
  readonly character: CharacterId;
  readonly cycle: number;
  readonly restaurantIndexInCycle: number;
  readonly score: number;
  readonly highestRestaurantTypeReached: number;

  // Active restaurant
  readonly restaurant: Restaurant;

  // Grill
  readonly grill: readonly GrillSlot[];

  // Table
  readonly table: readonly Part[];
  readonly tableCapacity: number;

  // Skills
  readonly skills: readonly string[];

  // Coins
  readonly coins: number;

  // Debuffs
  readonly staffWarningCount: number;
  readonly actionDisabledTimer: number;
  readonly burntSmokeActive: boolean;

  // Binge tracking
  readonly consecutiveEatCount: number;
  readonly bingeNextDishDoubled: boolean;

  // Slot efficiency edge-trigger tracking
  readonly allSlotsOccupiedLastTick: boolean;

  // Phase
  readonly phase: 'playing' | 'skill-select' | 'node-select' | 'game-over' | 'true-ending';
  readonly gameOver: GameOverReason | null;
  readonly pendingSkillChoices: SkillDefinition[];
  readonly pendingNodeChoice: boolean;

  // Catalog
  readonly catalog: readonly string[];

  // Timing
  readonly elapsedTime: number;
}

// ---------------------------------------------------------------------------
// Interfaces: PersistentState
// ---------------------------------------------------------------------------

export interface PersistentState {
  readonly highScore: number;
  readonly unlockedCharacters: readonly CharacterId[];
  readonly catalog: readonly string[];
  readonly clearedWithCharacterIds: readonly CharacterId[];
}

// ---------------------------------------------------------------------------
// Interfaces: Consumables
// ---------------------------------------------------------------------------

export type ConsumableEffect =
  | { readonly type: 'clear-warning'; readonly amount: number }
  | { readonly type: 'heal-fire'; readonly slotCount: number };

export interface ConsumableItem {
  readonly id: string;
  readonly name: string;
  readonly nameJP: string;
  readonly cost: number;
  readonly effect: ConsumableEffect;
}

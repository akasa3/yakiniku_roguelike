/**
 * Type-level tests for src/types/index.ts
 *
 * Red phase: these tests are expected to fail until the implementation exists.
 * They verify the public API shape defined in specs/modules/types.spec.md.
 *
 * Strategy:
 *   - Union types / string literals: verified via compile-time assignability
 *     using `expectTypeOf` from vitest and exhaustive switch helpers.
 *   - Interfaces: verified by constructing conforming objects and checking
 *     that the TypeScript compiler accepts them (structural compatibility).
 *   - Discriminated unions: verified by narrowing on the discriminant field.
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  GrillingState,
  MeatRank,
  RestaurantType,
  NodeType,
  CharacterId,
  PenaltyType,
  GameOverReason,
  PlayerAction,
  SkillBuild,
  MeatPart,
  VegetablePart,
  Part,
  GrillSlot,
  UnlockCondition,
  SkillDefinition,
  CharacterDefinition,
  CharacterModifiers,
  RestaurantDefinition,
  Restaurant,
  GameState,
  PersistentState,
  ConsumableItem,
  ConsumableEffect,
} from '../types/index';

// ---------------------------------------------------------------------------
// Helper: exhaustive check — TypeScript will error if a case is missing
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertNever(_x: never): never {
  throw new Error('Unreachable');
}

// ---------------------------------------------------------------------------
// GrillingState
// ---------------------------------------------------------------------------
describe('GrillingState', () => {
  it('accepts all five literal members', () => {
    const raw: GrillingState = 'raw';
    const rare: GrillingState = 'rare';
    const medium: GrillingState = 'medium';
    const wellDone: GrillingState = 'well-done';
    const burnt: GrillingState = 'burnt';

    expect(raw).toBe('raw');
    expect(rare).toBe('rare');
    expect(medium).toBe('medium');
    expect(wellDone).toBe('well-done');
    expect(burnt).toBe('burnt');
  });

  it('is exhaustively narrowable over all five members', () => {
    const exhaustive = (s: GrillingState): string => {
      switch (s) {
        case 'raw':       return 'raw';
        case 'rare':      return 'rare';
        case 'medium':    return 'medium';
        case 'well-done': return 'well-done';
        case 'burnt':     return 'burnt';
        default:          return assertNever(s);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// MeatRank
// ---------------------------------------------------------------------------
describe('MeatRank', () => {
  it('accepts all four literal members', () => {
    const common: MeatRank = 'common';
    const upper: MeatRank = 'upper';
    const premium: MeatRank = 'premium';
    const elite: MeatRank = 'elite';

    expect(common).toBe('common');
    expect(upper).toBe('upper');
    expect(premium).toBe('premium');
    expect(elite).toBe('elite');
  });

  it('is exhaustively narrowable over all four members', () => {
    const exhaustive = (r: MeatRank): string => {
      switch (r) {
        case 'common':  return 'common';
        case 'upper':   return 'upper';
        case 'premium': return 'premium';
        case 'elite':   return 'elite';
        default:        return assertNever(r);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// RestaurantType
// ---------------------------------------------------------------------------
describe('RestaurantType', () => {
  it('accepts all four literal members', () => {
    const chain: RestaurantType = 'chain';
    const local: RestaurantType = 'local';
    const highEnd: RestaurantType = 'high-end';
    const boss: RestaurantType = 'boss';

    expect(chain).toBe('chain');
    expect(local).toBe('local');
    expect(highEnd).toBe('high-end');
    expect(boss).toBe('boss');
  });

  it('is exhaustively narrowable over all four members', () => {
    const exhaustive = (t: RestaurantType): string => {
      switch (t) {
        case 'chain':    return 'chain';
        case 'local':    return 'local';
        case 'high-end': return 'high-end';
        case 'boss':     return 'boss';
        default:         return assertNever(t);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// NodeType
// ---------------------------------------------------------------------------
describe('NodeType', () => {
  it('accepts both literal members', () => {
    const shop: NodeType = 'shop';
    const rest: NodeType = 'rest';

    expect(shop).toBe('shop');
    expect(rest).toBe('rest');
  });

  it('is exhaustively narrowable', () => {
    const exhaustive = (n: NodeType): string => {
      switch (n) {
        case 'shop': return 'shop';
        case 'rest': return 'rest';
        default:     return assertNever(n);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// CharacterId
// ---------------------------------------------------------------------------
describe('CharacterId', () => {
  it('accepts all five literal members', () => {
    const tanaka: CharacterId = 'tanaka';
    const critic: CharacterId = 'gourmet-critic';
    const eater: CharacterId = 'competitive-eater';
    const raw: CharacterId = 'raw-food-advocate';
    const vegan: CharacterId = 'vegan-tashiro';

    expect(tanaka).toBe('tanaka');
    expect(critic).toBe('gourmet-critic');
    expect(eater).toBe('competitive-eater');
    expect(raw).toBe('raw-food-advocate');
    expect(vegan).toBe('vegan-tashiro');
  });

  it('is exhaustively narrowable over all five members', () => {
    const exhaustive = (c: CharacterId): string => {
      switch (c) {
        case 'tanaka':              return 'tanaka';
        case 'gourmet-critic':      return 'gourmet-critic';
        case 'competitive-eater':   return 'competitive-eater';
        case 'raw-food-advocate':   return 'raw-food-advocate';
        case 'vegan-tashiro':       return 'vegan-tashiro';
        default:                    return assertNever(c);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// PenaltyType
// ---------------------------------------------------------------------------
describe('PenaltyType', () => {
  it('accepts all five literal members', () => {
    const rawMeat: PenaltyType = 'raw-meat';
    const burntSmoke: PenaltyType = 'burnt-smoke';
    const discardLoss: PenaltyType = 'discard-loss';
    const staffWarning: PenaltyType = 'staff-warning';
    const grillFire: PenaltyType = 'grill-fire';

    expect(rawMeat).toBe('raw-meat');
    expect(burntSmoke).toBe('burnt-smoke');
    expect(discardLoss).toBe('discard-loss');
    expect(staffWarning).toBe('staff-warning');
    expect(grillFire).toBe('grill-fire');
  });

  it('is exhaustively narrowable', () => {
    const exhaustive = (p: PenaltyType): string => {
      switch (p) {
        case 'raw-meat':       return 'raw-meat';
        case 'burnt-smoke':    return 'burnt-smoke';
        case 'discard-loss':   return 'discard-loss';
        case 'staff-warning':  return 'staff-warning';
        case 'grill-fire':     return 'grill-fire';
        default:               return assertNever(p);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// GameOverReason
// ---------------------------------------------------------------------------
describe('GameOverReason', () => {
  it('accepts all four literal members', () => {
    const tableOverflow: GameOverReason = 'table-overflow';
    const grillFire: GameOverReason = 'grill-fire';
    const rawParalysis: GameOverReason = 'raw-paralysis';
    const burntInstant: GameOverReason = 'burnt-instant';

    expect(tableOverflow).toBe('table-overflow');
    expect(grillFire).toBe('grill-fire');
    expect(rawParalysis).toBe('raw-paralysis');
    expect(burntInstant).toBe('burnt-instant');
  });

  it('is exhaustively narrowable', () => {
    const exhaustive = (r: GameOverReason): string => {
      switch (r) {
        case 'table-overflow':     return 'table-overflow';
        case 'grill-fire':         return 'grill-fire';
        case 'raw-paralysis':      return 'raw-paralysis';
        case 'burnt-instant':      return 'burnt-instant';
        case 'staff-kicked-out':   return 'staff-kicked-out';
        default:                   return assertNever(r);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// PlayerAction
// ---------------------------------------------------------------------------
describe('PlayerAction', () => {
  it('accepts all five literal members', () => {
    const eat: PlayerAction = 'eat';
    const discard: PlayerAction = 'discard';
    const flip: PlayerAction = 'flip';
    const instantExchange: PlayerAction = 'instant-exchange';
    const delayedExchange: PlayerAction = 'delayed-exchange';

    expect(eat).toBe('eat');
    expect(discard).toBe('discard');
    expect(flip).toBe('flip');
    expect(instantExchange).toBe('instant-exchange');
    expect(delayedExchange).toBe('delayed-exchange');
  });

  it('is exhaustively narrowable', () => {
    const exhaustive = (a: PlayerAction): string => {
      switch (a) {
        case 'eat':              return 'eat';
        case 'discard':          return 'discard';
        case 'flip':             return 'flip';
        case 'instant-exchange': return 'instant-exchange';
        case 'delayed-exchange': return 'delayed-exchange';
        default:                 return assertNever(a);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// SkillBuild
// ---------------------------------------------------------------------------
describe('SkillBuild', () => {
  it('accepts all nine literal members', () => {
    const rawRush: SkillBuild = 'raw-rush';
    const precision: SkillBuild = 'precision';
    const burntExploit: SkillBuild = 'burnt-exploit';
    const binge: SkillBuild = 'binge';
    const charming: SkillBuild = 'charming';
    const volume: SkillBuild = 'volume';
    const speed: SkillBuild = 'speed';
    const stability: SkillBuild = 'stability';
    const vegan: SkillBuild = 'vegan';

    expect(rawRush).toBe('raw-rush');
    expect(precision).toBe('precision');
    expect(burntExploit).toBe('burnt-exploit');
    expect(binge).toBe('binge');
    expect(charming).toBe('charming');
    expect(volume).toBe('volume');
    expect(speed).toBe('speed');
    expect(stability).toBe('stability');
    expect(vegan).toBe('vegan');
  });

  it('is exhaustively narrowable', () => {
    const exhaustive = (b: SkillBuild): string => {
      switch (b) {
        case 'raw-rush':      return 'raw-rush';
        case 'precision':     return 'precision';
        case 'burnt-exploit': return 'burnt-exploit';
        case 'binge':         return 'binge';
        case 'charming':      return 'charming';
        case 'volume':        return 'volume';
        case 'speed':         return 'speed';
        case 'stability':     return 'stability';
        case 'vegan':         return 'vegan';
        default:              return assertNever(b);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// MeatPart
// ---------------------------------------------------------------------------
describe('MeatPart', () => {
  it('has the correct shape with all required fields', () => {
    const sample: MeatPart = {
      id: 'wagyu-sirloin',
      name: 'Wagyu Sirloin',
      nameJP: 'ロース',
      rank: 'elite',
      grillTime: 30,
      flareRisk: 0.05,
      sweetSpot: 10,
      flavorText: 'Melts in your mouth.',
      isVegetable: false,
    };
    expectTypeOf(sample).toMatchTypeOf<MeatPart>();
  });

  it('has isVegetable narrowed to literal false', () => {
    expectTypeOf<MeatPart['isVegetable']>().toEqualTypeOf<false>();
  });

  it('has rank typed as MeatRank', () => {
    expectTypeOf<MeatPart['rank']>().toEqualTypeOf<MeatRank>();
  });

  it('has numeric fields typed as number', () => {
    expectTypeOf<MeatPart['grillTime']>().toEqualTypeOf<number>();
    expectTypeOf<MeatPart['flareRisk']>().toEqualTypeOf<number>();
    expectTypeOf<MeatPart['sweetSpot']>().toEqualTypeOf<number>();
  });
});

// ---------------------------------------------------------------------------
// VegetablePart
// ---------------------------------------------------------------------------
describe('VegetablePart', () => {
  it('has the correct shape with all required fields', () => {
    const sample: VegetablePart = {
      id: 'enoki-mushroom',
      name: 'Enoki Mushroom',
      nameJP: 'えのき',
      grillTime: 20,
      flareRisk: 0,
      sweetSpot: 8,
      isVegetable: true,
    };
    expectTypeOf(sample).toMatchTypeOf<VegetablePart>();
  });

  it('has isVegetable narrowed to literal true', () => {
    expectTypeOf<VegetablePart['isVegetable']>().toEqualTypeOf<true>();
  });

  it('has flareRisk narrowed to literal 0', () => {
    expectTypeOf<VegetablePart['flareRisk']>().toEqualTypeOf<0>();
  });

  it('does NOT have rank or flavorText fields', () => {
    // Structural: VegetablePart must not extend MeatPart
    expectTypeOf<VegetablePart>().not.toMatchTypeOf<MeatPart>();
  });
});

// ---------------------------------------------------------------------------
// Part (discriminated union)
// ---------------------------------------------------------------------------
describe('Part', () => {
  it('is a union of MeatPart and VegetablePart', () => {
    const meat: MeatPart = {
      id: 'karubi',
      name: 'Karubi',
      nameJP: 'カルビ',
      rank: 'common',
      grillTime: 25,
      flareRisk: 0.02,
      sweetSpot: 8,
      flavorText: 'Classic.',
      isVegetable: false,
    };
    const veg: VegetablePart = {
      id: 'garlic',
      name: 'Garlic',
      nameJP: 'にんにく',
      grillTime: 15,
      flareRisk: 0,
      sweetSpot: 5,
      isVegetable: true,
    };
    const asPart1: Part = meat;
    const asPart2: Part = veg;
    expect(asPart1).toBeDefined();
    expect(asPart2).toBeDefined();
  });

  it('narrows correctly on isVegetable discriminant', () => {
    const narrowed = (p: Part) => {
      if (!p.isVegetable) {
        expectTypeOf(p).toEqualTypeOf<MeatPart>();
      } else {
        expectTypeOf(p).toEqualTypeOf<VegetablePart>();
      }
    };
    expectTypeOf(narrowed).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// GrillSlot
// ---------------------------------------------------------------------------
describe('GrillSlot', () => {
  it('has the correct shape with all required fields', () => {
    const sample: GrillSlot = {
      id: 0,
      part: null,
      state: 'raw',
      timeInState: 0,
      fireTimer: 0,
      disabled: false,
      disabledTimer: 0,
    };
    expectTypeOf(sample).toMatchTypeOf<GrillSlot>();
  });

  it('accepts a Part as the part field', () => {
    const withMeat: GrillSlot = {
      id: 1,
      part: {
        id: 'karubi',
        name: 'Karubi',
        nameJP: 'カルビ',
        rank: 'common',
        grillTime: 25,
        flareRisk: 0.02,
        sweetSpot: 8,
        flavorText: 'Classic.',
        isVegetable: false,
      },
      state: 'medium',
      timeInState: 5,
      fireTimer: 0,
      disabled: false,
      disabledTimer: 0,
    };
    expectTypeOf(withMeat).toMatchTypeOf<GrillSlot>();
  });

  it('has state typed as GrillingState', () => {
    expectTypeOf<GrillSlot['state']>().toEqualTypeOf<GrillingState>();
  });

  it('has part typed as Part | null', () => {
    expectTypeOf<GrillSlot['part']>().toEqualTypeOf<Part | null>();
  });

  it('has numeric timer fields typed as number', () => {
    expectTypeOf<GrillSlot['timeInState']>().toEqualTypeOf<number>();
    expectTypeOf<GrillSlot['fireTimer']>().toEqualTypeOf<number>();
    expectTypeOf<GrillSlot['disabledTimer']>().toEqualTypeOf<number>();
  });

  it('has disabled typed as boolean', () => {
    expectTypeOf<GrillSlot['disabled']>().toEqualTypeOf<boolean>();
  });
});

// ---------------------------------------------------------------------------
// UnlockCondition (discriminated union)
// ---------------------------------------------------------------------------
describe('UnlockCondition', () => {
  it('accepts the default variant', () => {
    const cond: UnlockCondition = { type: 'default' };
    expectTypeOf(cond).toMatchTypeOf<UnlockCondition>();
  });

  it('accepts the clear-with variant', () => {
    const cond: UnlockCondition = { type: 'clear-with', characterId: 'tanaka' };
    expectTypeOf(cond).toMatchTypeOf<UnlockCondition>();
    if (cond.type === 'clear-with') {
      expectTypeOf(cond.characterId).toEqualTypeOf<CharacterId>();
    }
  });

  it('accepts the clear-with-any variant', () => {
    const cond: UnlockCondition = { type: 'clear-with-any', characterType: 'specialist' };
    expectTypeOf(cond).toMatchTypeOf<UnlockCondition>();
    if (cond.type === 'clear-with-any') {
      expectTypeOf(cond.characterType).toEqualTypeOf<'specialist' | 'peaky'>();
    }
  });

  it('is exhaustively narrowable on type discriminant', () => {
    const exhaustive = (u: UnlockCondition): string => {
      switch (u.type) {
        case 'default':         return 'default';
        case 'clear-with':      return u.characterId;
        case 'clear-with-any':  return u.characterType;
        default:                return assertNever(u);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// SkillDefinition
// ---------------------------------------------------------------------------
describe('SkillDefinition', () => {
  it('has the correct shape with all required fields', () => {
    const sample: SkillDefinition = {
      id: 'tong-master',
      name: 'Tong Master',
      nameJP: 'トングマスター',
      build: 'precision',
      description: 'Enables the flip action.',
      isStackable: false,
    };
    expectTypeOf(sample).toMatchTypeOf<SkillDefinition>();
  });

  it('has build typed as SkillBuild', () => {
    expectTypeOf<SkillDefinition['build']>().toEqualTypeOf<SkillBuild>();
  });

  it('has isStackable typed as boolean', () => {
    expectTypeOf<SkillDefinition['isStackable']>().toEqualTypeOf<boolean>();
  });
});

// ---------------------------------------------------------------------------
// CharacterModifiers
// ---------------------------------------------------------------------------
describe('CharacterModifiers', () => {
  it('accepts an empty object (all fields optional)', () => {
    const empty: CharacterModifiers = {};
    expectTypeOf(empty).toMatchTypeOf<CharacterModifiers>();
  });

  it('accepts all optional fields', () => {
    const full: CharacterModifiers = {
      sweetSpotBonus: { common: 2, upper: 3 },
      eatSpeedMultiplier: 0.5,
      sweetSpotPenaltyMultiplier: 0.8,
      coinMultiplierByRank: { elite: 2 },
      vegetableCoinMultiplier: 3,
      meatEatStaffWarningIncrement: 2,
      instantGameOverOnBurn: true,
    };
    expectTypeOf(full).toMatchTypeOf<CharacterModifiers>();
  });

  it('has sweetSpotBonus keyed by MeatRank', () => {
    expectTypeOf<CharacterModifiers['sweetSpotBonus']>().toEqualTypeOf<
      Partial<Record<MeatRank, number>> | undefined
    >();
  });

  it('has coinMultiplierByRank keyed by MeatRank', () => {
    expectTypeOf<CharacterModifiers['coinMultiplierByRank']>().toEqualTypeOf<
      Partial<Record<MeatRank, number>> | undefined
    >();
  });
});

// ---------------------------------------------------------------------------
// CharacterDefinition
// ---------------------------------------------------------------------------
describe('CharacterDefinition', () => {
  it('has the correct shape with all required fields', () => {
    const sample: CharacterDefinition = {
      id: 'tanaka',
      name: 'Tanaka',
      nameJP: '田中',
      type: 'balanced',
      starterSkillId: 'meat-sense',
      unlockCondition: { type: 'default' },
      modifiers: {},
    };
    expectTypeOf(sample).toMatchTypeOf<CharacterDefinition>();
  });

  it('has id typed as CharacterId', () => {
    expectTypeOf<CharacterDefinition['id']>().toEqualTypeOf<CharacterId>();
  });

  it('has type narrowed to the three allowed literals', () => {
    expectTypeOf<CharacterDefinition['type']>().toEqualTypeOf<
      'balanced' | 'specialist' | 'peaky'
    >();
  });

  it('has unlockCondition typed as UnlockCondition', () => {
    expectTypeOf<CharacterDefinition['unlockCondition']>().toEqualTypeOf<UnlockCondition>();
  });

  it('has modifiers typed as CharacterModifiers', () => {
    expectTypeOf<CharacterDefinition['modifiers']>().toEqualTypeOf<CharacterModifiers>();
  });
});

// ---------------------------------------------------------------------------
// RestaurantDefinition
// ---------------------------------------------------------------------------
describe('RestaurantDefinition', () => {
  it('has the correct shape with all required fields', () => {
    const sample: RestaurantDefinition = {
      type: 'chain',
      nameJP: '焼肉チェーン',
      totalDishes: 10,
      servingInterval: 15,
      rankDistribution: { common: 1.0, upper: 0, premium: 0, elite: 0 },
      activePenalties: ['raw-meat', 'burnt-smoke'],
    };
    expectTypeOf(sample).toMatchTypeOf<RestaurantDefinition>();
  });

  it('has type typed as RestaurantType', () => {
    expectTypeOf<RestaurantDefinition['type']>().toEqualTypeOf<RestaurantType>();
  });

  it('has rankDistribution typed as Record<MeatRank, number>', () => {
    expectTypeOf<RestaurantDefinition['rankDistribution']>().toEqualTypeOf<
      Record<MeatRank, number>
    >();
  });

  it('has activePenalties typed as readonly (PenaltyType | GameOverReason)[]', () => {
    expectTypeOf<RestaurantDefinition['activePenalties']>().toEqualTypeOf<
      readonly (PenaltyType | GameOverReason)[]
    >();
  });
});

// ---------------------------------------------------------------------------
// Restaurant (runtime instance)
// ---------------------------------------------------------------------------
describe('Restaurant', () => {
  it('has the correct shape with all required fields', () => {
    const definition: RestaurantDefinition = {
      type: 'chain',
      nameJP: '焼肉チェーン',
      totalDishes: 10,
      servingInterval: 15,
      rankDistribution: { common: 1.0, upper: 0, premium: 0, elite: 0 },
      activePenalties: [],
    };
    const sample: Restaurant = {
      definition,
      dishesServed: 0,
      meatDishesEaten: 0,
      totalMeatDishes: 10,
      timeSinceLastServe: 0,
      effectiveServingInterval: 15,
      startTime: 0,
      servingQueue: [],
      isCleared: false,
    };
    expectTypeOf(sample).toMatchTypeOf<Restaurant>();
  });

  it('has servingQueue typed as readonly MeatPart[]', () => {
    expectTypeOf<Restaurant['servingQueue']>().toEqualTypeOf<readonly MeatPart[]>();
  });

  it('has isCleared typed as boolean', () => {
    expectTypeOf<Restaurant['isCleared']>().toEqualTypeOf<boolean>();
  });
});

// ---------------------------------------------------------------------------
// GameState
// ---------------------------------------------------------------------------
describe('GameState', () => {
  it('has phase typed as the five allowed literals', () => {
    expectTypeOf<GameState['phase']>().toEqualTypeOf<
      'playing' | 'skill-select' | 'node-select' | 'game-over' | 'true-ending'
    >();
  });

  it('has character typed as CharacterId', () => {
    expectTypeOf<GameState['character']>().toEqualTypeOf<CharacterId>();
  });

  it('has gameOver typed as GameOverReason | null', () => {
    expectTypeOf<GameState['gameOver']>().toEqualTypeOf<GameOverReason | null>();
  });

  it('has grill typed as readonly GrillSlot[]', () => {
    expectTypeOf<GameState['grill']>().toEqualTypeOf<readonly GrillSlot[]>();
  });

  it('has table typed as readonly Part[]', () => {
    expectTypeOf<GameState['table']>().toEqualTypeOf<readonly Part[]>();
  });

  it('has skills typed as readonly string[]', () => {
    expectTypeOf<GameState['skills']>().toEqualTypeOf<readonly string[]>();
  });

  it('has pendingSkillChoices typed as SkillDefinition[]', () => {
    expectTypeOf<GameState['pendingSkillChoices']>().toEqualTypeOf<SkillDefinition[]>();
  });

  it('has catalog typed as readonly string[]', () => {
    expectTypeOf<GameState['catalog']>().toEqualTypeOf<readonly string[]>();
  });

  it('has numeric metadata fields typed as number', () => {
    expectTypeOf<GameState['cycle']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['restaurantIndexInCycle']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['score']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['highestRestaurantTypeReached']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['coins']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['staffWarningCount']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['actionDisabledTimer']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['consecutiveEatCount']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['tableCapacity']>().toEqualTypeOf<number>();
    expectTypeOf<GameState['elapsedTime']>().toEqualTypeOf<number>();
  });

  it('has boolean flag fields typed as boolean', () => {
    expectTypeOf<GameState['burntSmokeActive']>().toEqualTypeOf<boolean>();
    expectTypeOf<GameState['bingeNextDishDoubled']>().toEqualTypeOf<boolean>();
    expectTypeOf<GameState['allSlotsOccupiedLastTick']>().toEqualTypeOf<boolean>();
    expectTypeOf<GameState['pendingNodeChoice']>().toEqualTypeOf<boolean>();
  });

  it('has restaurant typed as Restaurant', () => {
    expectTypeOf<GameState['restaurant']>().toEqualTypeOf<Restaurant>();
  });
});

// ---------------------------------------------------------------------------
// PersistentState
// ---------------------------------------------------------------------------
describe('PersistentState', () => {
  it('has the correct shape with all required fields', () => {
    const sample: PersistentState = {
      highScore: 0,
      unlockedCharacters: ['tanaka'],
      catalog: [],
      clearedWithCharacterIds: [],
    };
    expectTypeOf(sample).toMatchTypeOf<PersistentState>();
  });

  it('has unlockedCharacters typed as readonly CharacterId[]', () => {
    expectTypeOf<PersistentState['unlockedCharacters']>().toEqualTypeOf<
      readonly CharacterId[]
    >();
  });

  it('has clearedWithCharacterIds typed as readonly CharacterId[]', () => {
    expectTypeOf<PersistentState['clearedWithCharacterIds']>().toEqualTypeOf<
      readonly CharacterId[]
    >();
  });

  it('has catalog typed as readonly string[]', () => {
    expectTypeOf<PersistentState['catalog']>().toEqualTypeOf<readonly string[]>();
  });

  it('has highScore typed as number', () => {
    expectTypeOf<PersistentState['highScore']>().toEqualTypeOf<number>();
  });
});

// ---------------------------------------------------------------------------
// ConsumableEffect (discriminated union)
// ---------------------------------------------------------------------------
describe('ConsumableEffect', () => {
  it('accepts the clear-warning variant', () => {
    const effect: ConsumableEffect = { type: 'clear-warning', amount: 1 };
    expectTypeOf(effect).toMatchTypeOf<ConsumableEffect>();
    if (effect.type === 'clear-warning') {
      expectTypeOf(effect.amount).toEqualTypeOf<number>();
    }
  });

  it('accepts the heal-fire variant', () => {
    const effect: ConsumableEffect = { type: 'heal-fire', slotCount: 2 };
    expectTypeOf(effect).toMatchTypeOf<ConsumableEffect>();
    if (effect.type === 'heal-fire') {
      expectTypeOf(effect.slotCount).toEqualTypeOf<number>();
    }
  });

  it('is exhaustively narrowable on type discriminant', () => {
    const exhaustive = (e: ConsumableEffect): string => {
      switch (e.type) {
        case 'clear-warning': return `clear ${e.amount}`;
        case 'heal-fire':     return `heal ${e.slotCount}`;
        default:              return assertNever(e);
      }
    };
    expectTypeOf(exhaustive).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// ConsumableItem
// ---------------------------------------------------------------------------
describe('ConsumableItem', () => {
  it('has the correct shape with all required fields', () => {
    const sample: ConsumableItem = {
      id: 'staff-apology',
      name: 'Staff Apology',
      nameJP: 'お詫び',
      cost: 3,
      effect: { type: 'clear-warning', amount: 1 },
    };
    expectTypeOf(sample).toMatchTypeOf<ConsumableItem>();
  });

  it('has effect typed as ConsumableEffect', () => {
    expectTypeOf<ConsumableItem['effect']>().toEqualTypeOf<ConsumableEffect>();
  });

  it('has cost typed as number', () => {
    expectTypeOf<ConsumableItem['cost']>().toEqualTypeOf<number>();
  });
});

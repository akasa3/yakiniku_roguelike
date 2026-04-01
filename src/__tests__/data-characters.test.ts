import { describe, it, expect } from 'vitest';
import {
  CHARACTERS,
  getCharacter,
  isCharacterUnlocked,
  getUnlockDescription,
} from '../game/data/characters';
import type { PersistentState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePersistedState(
  overrides: Partial<PersistentState> = {},
): PersistentState {
  return {
    highScore: 0,
    unlockedCharacters: ['tanaka'],
    catalog: [],
    clearedWithCharacterIds: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CHARACTERS array — structural invariants
// ---------------------------------------------------------------------------

describe('CHARACTERS', () => {
  it('exports exactly 5 characters', () => {
    expect(CHARACTERS).toHaveLength(5);
  });

  it('contains no duplicate ids', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has exactly one character with unlockCondition.type === "default"', () => {
    const defaults = CHARACTERS.filter(
      (c) => c.unlockCondition.type === 'default',
    );
    expect(defaults).toHaveLength(1);
    expect(defaults[0]!.id).toBe('tanaka');
  });

  it('has both specialist characters requiring clear-with tanaka', () => {
    const specialists = CHARACTERS.filter((c) => c.type === 'specialist');
    expect(specialists).toHaveLength(2);
    for (const c of specialists) {
      expect(c.unlockCondition).toEqual({
        type: 'clear-with',
        characterId: 'tanaka',
      });
    }
  });

  it('has both peaky characters requiring clear-with-any specialist', () => {
    const peaky = CHARACTERS.filter((c) => c.type === 'peaky');
    expect(peaky).toHaveLength(2);
    for (const c of peaky) {
      expect(c.unlockCondition).toEqual({
        type: 'clear-with-any',
        characterType: 'specialist',
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Character 1: Salaryman Tanaka
// ---------------------------------------------------------------------------

describe('Salaryman Tanaka', () => {
  it('exists in CHARACTERS', () => {
    const found = CHARACTERS.find((c) => c.id === 'tanaka');
    expect(found).toBeDefined();
  });

  it('has correct static fields', () => {
    const c = CHARACTERS.find((c) => c.id === 'tanaka')!;
    expect(c.name).toBe('Salaryman Tanaka');
    expect(c.nameJP).toBe('サラリーマン田中');
    expect(c.type).toBe('balanced');
    expect(c.starterSkillId).toBe('discard-pro');
  });

  it('has unlockCondition { type: "default" }', () => {
    const c = CHARACTERS.find((c) => c.id === 'tanaka')!;
    expect(c.unlockCondition).toEqual({ type: 'default' });
  });

  it('has empty modifiers (no stat bonuses or penalties)', () => {
    const c = CHARACTERS.find((c) => c.id === 'tanaka')!;
    expect(c.modifiers).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Character 2: Gourmet Critic
// ---------------------------------------------------------------------------

describe('Gourmet Critic', () => {
  it('exists in CHARACTERS', () => {
    const found = CHARACTERS.find((c) => c.id === 'gourmet-critic');
    expect(found).toBeDefined();
  });

  it('has correct static fields', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.name).toBe('Gourmet Critic');
    expect(c.nameJP).toBe('グルメ評論家');
    expect(c.type).toBe('specialist');
    expect(c.starterSkillId).toBe('heat-sensor');
  });

  it('has unlockCondition { type: "clear-with", characterId: "tanaka" }', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.unlockCondition).toEqual({
      type: 'clear-with',
      characterId: 'tanaka',
    });
  });

  it('has sweetSpotBonus of +1s for premium rank', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.sweetSpotBonus?.premium).toBe(1);
  });

  it('has sweetSpotBonus of +1s for elite rank', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.sweetSpotBonus?.elite).toBe(1);
  });

  it('has sweetSpotBonus of 0 (neutral) for upper rank', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.sweetSpotBonus?.upper).toBe(0);
  });

  it('has sweetSpotBonus of 0 (neutral) for common rank', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.sweetSpotBonus?.common).toBe(0);
  });

  it('has coinMultiplierByRank.common === 0.50', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.coinMultiplierByRank?.common).toBe(0.5);
  });

  it('has coinMultiplierByRank.upper === 1.0 (no modifier)', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.coinMultiplierByRank?.upper).toBe(1.0);
  });

  it('has coinMultiplierByRank.premium === 1.0 (no modifier)', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.coinMultiplierByRank?.premium).toBe(1.0);
  });

  it('has coinMultiplierByRank.elite === 1.0 (no modifier)', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.coinMultiplierByRank?.elite).toBe(1.0);
  });

  it('does not define eatSpeedMultiplier', () => {
    const c = CHARACTERS.find((c) => c.id === 'gourmet-critic')!;
    expect(c.modifiers.eatSpeedMultiplier).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Character 3: Competitive Eater
// ---------------------------------------------------------------------------

describe('Competitive Eater', () => {
  it('exists in CHARACTERS', () => {
    const found = CHARACTERS.find((c) => c.id === 'competitive-eater');
    expect(found).toBeDefined();
  });

  it('has correct static fields', () => {
    const c = CHARACTERS.find((c) => c.id === 'competitive-eater')!;
    expect(c.name).toBe('Competitive Eater');
    expect(c.nameJP).toBe('大食い選手');
    expect(c.type).toBe('specialist');
    expect(c.starterSkillId).toBe('speed-eater');
  });

  it('has unlockCondition { type: "clear-with", characterId: "tanaka" }', () => {
    const c = CHARACTERS.find((c) => c.id === 'competitive-eater')!;
    expect(c.unlockCondition).toEqual({
      type: 'clear-with',
      characterId: 'tanaka',
    });
  });

  it('has eatSpeedMultiplier === 0.50', () => {
    const c = CHARACTERS.find((c) => c.id === 'competitive-eater')!;
    expect(c.modifiers.eatSpeedMultiplier).toBe(0.5);
  });

  it('has sweetSpotPenaltyMultiplier === 0.80', () => {
    const c = CHARACTERS.find((c) => c.id === 'competitive-eater')!;
    expect(c.modifiers.sweetSpotPenaltyMultiplier).toBe(0.8);
  });

  it('does not define sweetSpotBonus', () => {
    const c = CHARACTERS.find((c) => c.id === 'competitive-eater')!;
    expect(c.modifiers.sweetSpotBonus).toBeUndefined();
  });

  it('does not define coinMultiplierByRank', () => {
    const c = CHARACTERS.find((c) => c.id === 'competitive-eater')!;
    expect(c.modifiers.coinMultiplierByRank).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Character 4: Raw Food Advocate
// ---------------------------------------------------------------------------

describe('Raw Food Advocate', () => {
  it('exists in CHARACTERS', () => {
    const found = CHARACTERS.find((c) => c.id === 'raw-food-advocate');
    expect(found).toBeDefined();
  });

  it('has correct static fields', () => {
    const c = CHARACTERS.find((c) => c.id === 'raw-food-advocate')!;
    expect(c.name).toBe('Raw Food Advocate');
    expect(c.nameJP).toBe('生食主義者');
    expect(c.type).toBe('peaky');
    expect(c.starterSkillId).toBe('iron-stomach');
  });

  it('has unlockCondition { type: "clear-with-any", characterType: "specialist" }', () => {
    const c = CHARACTERS.find((c) => c.id === 'raw-food-advocate')!;
    expect(c.unlockCondition).toEqual({
      type: 'clear-with-any',
      characterType: 'specialist',
    });
  });

  it('has instantGameOverOnBurn === true', () => {
    const c = CHARACTERS.find((c) => c.id === 'raw-food-advocate')!;
    expect(c.modifiers.instantGameOverOnBurn).toBe(true);
  });

  it('does not define eatSpeedMultiplier', () => {
    const c = CHARACTERS.find((c) => c.id === 'raw-food-advocate')!;
    expect(c.modifiers.eatSpeedMultiplier).toBeUndefined();
  });

  it('does not define coinMultiplierByRank', () => {
    const c = CHARACTERS.find((c) => c.id === 'raw-food-advocate')!;
    expect(c.modifiers.coinMultiplierByRank).toBeUndefined();
  });

  it('does not define sweetSpotBonus', () => {
    const c = CHARACTERS.find((c) => c.id === 'raw-food-advocate')!;
    expect(c.modifiers.sweetSpotBonus).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Character 5: Vegan Tashiro
// ---------------------------------------------------------------------------

describe('Vegan Tashiro', () => {
  it('exists in CHARACTERS', () => {
    const found = CHARACTERS.find((c) => c.id === 'vegan-tashiro');
    expect(found).toBeDefined();
  });

  it('has correct static fields', () => {
    const c = CHARACTERS.find((c) => c.id === 'vegan-tashiro')!;
    expect(c.name).toBe('Vegan Tashiro');
    expect(c.nameJP).toBe('ヴィーガン田代');
    expect(c.type).toBe('peaky');
    expect(c.starterSkillId).toBe('exchange-discount');
  });

  it('has unlockCondition { type: "clear-with-any", characterType: "specialist" }', () => {
    const c = CHARACTERS.find((c) => c.id === 'vegan-tashiro')!;
    expect(c.unlockCondition).toEqual({
      type: 'clear-with-any',
      characterType: 'specialist',
    });
  });

  it('has vegetableCoinMultiplier === 3', () => {
    const c = CHARACTERS.find((c) => c.id === 'vegan-tashiro')!;
    expect(c.modifiers.vegetableCoinMultiplier).toBe(3);
  });

  it('has meatEatStaffWarningIncrement === 2', () => {
    const c = CHARACTERS.find((c) => c.id === 'vegan-tashiro')!;
    expect(c.modifiers.meatEatStaffWarningIncrement).toBe(2);
  });

  it('does not define eatSpeedMultiplier', () => {
    const c = CHARACTERS.find((c) => c.id === 'vegan-tashiro')!;
    expect(c.modifiers.eatSpeedMultiplier).toBeUndefined();
  });

  it('does not define instantGameOverOnBurn', () => {
    const c = CHARACTERS.find((c) => c.id === 'vegan-tashiro')!;
    expect(c.modifiers.instantGameOverOnBurn).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCharacter()
// ---------------------------------------------------------------------------

describe('getCharacter()', () => {
  it('returns the correct character for each valid id', () => {
    const ids = [
      'tanaka',
      'gourmet-critic',
      'competitive-eater',
      'raw-food-advocate',
      'vegan-tashiro',
    ] as const;
    for (const id of ids) {
      const c = getCharacter(id);
      expect(c.id).toBe(id);
    }
  });

  it('throws when given an unknown id', () => {
    // @ts-expect-error — intentional invalid input
    expect(() => getCharacter('unknown-character')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// isCharacterUnlocked()
// ---------------------------------------------------------------------------

describe('isCharacterUnlocked()', () => {
  it('always returns true for tanaka regardless of persistent state', () => {
    const state = makePersistedState({ unlockedCharacters: [] });
    expect(isCharacterUnlocked('tanaka', state)).toBe(true);
  });

  it('returns true when the character is in unlockedCharacters', () => {
    const state = makePersistedState({
      unlockedCharacters: ['tanaka', 'gourmet-critic'],
    });
    expect(isCharacterUnlocked('gourmet-critic', state)).toBe(true);
  });

  it('returns false when the character is not in unlockedCharacters', () => {
    const state = makePersistedState({
      unlockedCharacters: ['tanaka'],
    });
    expect(isCharacterUnlocked('competitive-eater', state)).toBe(false);
  });

  it('returns false for raw-food-advocate when not in unlockedCharacters', () => {
    const state = makePersistedState({
      unlockedCharacters: ['tanaka'],
    });
    expect(isCharacterUnlocked('raw-food-advocate', state)).toBe(false);
  });

  it('returns true for raw-food-advocate when present in unlockedCharacters', () => {
    const state = makePersistedState({
      unlockedCharacters: ['tanaka', 'raw-food-advocate'],
    });
    expect(isCharacterUnlocked('raw-food-advocate', state)).toBe(true);
  });

  it('returns false for vegan-tashiro when not in unlockedCharacters', () => {
    const state = makePersistedState({
      unlockedCharacters: ['tanaka'],
    });
    expect(isCharacterUnlocked('vegan-tashiro', state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getUnlockDescription()
// ---------------------------------------------------------------------------

describe('getUnlockDescription()', () => {
  it('returns Japanese "available from start" text for type "default"', () => {
    expect(getUnlockDescription({ type: 'default' })).toBe(
      '最初から使用可能',
    );
  });

  it('returns the correct Japanese string for type "clear-with" characterId "tanaka"', () => {
    expect(
      getUnlockDescription({ type: 'clear-with', characterId: 'tanaka' }),
    ).toBe('サラリーマン田中 で1周クリア（ボス撃破）');
  });

  it('returns the correct Japanese string for type "clear-with-any" characterType "specialist"', () => {
    expect(
      getUnlockDescription({
        type: 'clear-with-any',
        characterType: 'specialist',
      }),
    ).toBe('スペシャリスト キャラクターで1周クリア（ボス撃破）');
  });

  it('returns the correct Japanese string for type "clear-with-any" characterType "peaky"', () => {
    expect(
      getUnlockDescription({
        type: 'clear-with-any',
        characterType: 'peaky',
      }),
    ).toBe('ピーキー キャラクターで1周クリア（ボス撃破）');
  });
});

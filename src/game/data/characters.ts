import type {
  CharacterDefinition,
  CharacterId,
  UnlockCondition,
  PersistentState,
} from '../../types/index';
import {
  GOURMET_SWEET_SPOT_BONUS,
  GOURMET_COMMON_COIN_MULTIPLIER,
  COMPETITIVE_EATER_SPEED_MULTIPLIER,
  COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER,
  VEGETABLE_COIN_MULTIPLIER,
  VEGAN_MEAT_EAT_WARNING_PENALTY,
} from './constants';

// ---------------------------------------------------------------------------
// Character Definitions
// ---------------------------------------------------------------------------

export const CHARACTERS: readonly CharacterDefinition[] = [
  {
    id: 'tanaka',
    name: 'Salaryman Tanaka',
    nameJP: 'サラリーマン田中',
    type: 'balanced',
    starterSkillId: 'discard-pro',
    unlockCondition: { type: 'default' },
    modifiers: {},
  },
  {
    id: 'gourmet-critic',
    name: 'Gourmet Critic',
    nameJP: 'グルメ評論家',
    type: 'specialist',
    starterSkillId: 'heat-sensor',
    unlockCondition: { type: 'clear-with', characterId: 'tanaka' },
    modifiers: {
      sweetSpotBonus: {
        premium: GOURMET_SWEET_SPOT_BONUS, // +1s
        elite:   GOURMET_SWEET_SPOT_BONUS, // +1s
        upper:   0,                        // neutral
        common:  0,                        // neutral
      },
      coinMultiplierByRank: {
        common:  GOURMET_COMMON_COIN_MULTIPLIER, // 0.50
        upper:   1.0,
        premium: 1.0,
        elite:   1.0,
      },
    },
  },
  {
    id: 'competitive-eater',
    name: 'Competitive Eater',
    nameJP: '大食い選手',
    type: 'specialist',
    starterSkillId: 'speed-eater',
    unlockCondition: { type: 'clear-with', characterId: 'tanaka' },
    modifiers: {
      eatSpeedMultiplier:         COMPETITIVE_EATER_SPEED_MULTIPLIER,       // 0.50
      sweetSpotPenaltyMultiplier: COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER,  // 0.80 [TUNE]
    },
  },
  {
    id: 'raw-food-advocate',
    name: 'Raw Food Advocate',
    nameJP: '生食主義者',
    type: 'peaky',
    starterSkillId: 'iron-stomach',
    unlockCondition: { type: 'clear-with-any', characterType: 'specialist' },
    modifiers: {
      instantGameOverOnBurn: true,
    },
  },
  {
    id: 'vegan-tashiro',
    name: 'Vegan Tashiro',
    nameJP: 'ヴィーガン田代',
    type: 'peaky',
    starterSkillId: 'exchange-discount',
    unlockCondition: { type: 'clear-with-any', characterType: 'specialist' },
    modifiers: {
      vegetableCoinMultiplier:      VEGETABLE_COIN_MULTIPLIER,       // 3
      meatEatStaffWarningIncrement: VEGAN_MEAT_EAT_WARNING_PENALTY,  // 2
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Returns the character definition with the matching id.
 * Throws if id is not a valid CharacterId.
 */
export function getCharacter(id: CharacterId): CharacterDefinition {
  const character = CHARACTERS.find((c) => c.id === id);
  if (character === undefined) {
    throw new Error(`Unknown character id: ${id}`);
  }
  return character;
}

/**
 * Returns true if the character is present in persistentState.unlockedCharacters.
 * 'tanaka' always returns true regardless of state.
 */
export function isCharacterUnlocked(
  id: CharacterId,
  persistentState: PersistentState,
): boolean {
  if (id === 'tanaka') {
    return true;
  }
  return persistentState.unlockedCharacters.includes(id);
}

/**
 * Returns a human-readable Japanese unlock description for the character selection screen.
 */
export function getUnlockDescription(condition: UnlockCondition): string {
  switch (condition.type) {
    case 'default':
      return '最初から使用可能';
    case 'clear-with': {
      const character = CHARACTERS.find((c) => c.id === condition.characterId);
      const characterName = character?.nameJP ?? condition.characterId;
      return `${characterName} で1周クリア（ボス撃破）`;
    }
    case 'clear-with-any': {
      const typeNameMap: Record<string, string> = {
        balanced: 'バランス',
        specialist: 'スペシャリスト',
        peaky: 'ピーキー',
      };
      const typeName = typeNameMap[condition.characterType] ?? condition.characterType;
      return `${typeName} キャラクターで1周クリア（ボス撃破）`;
    }
  }
}

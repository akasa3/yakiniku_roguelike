import type {
  CharacterId,
  CharacterModifiers,
  GameState,
  GrillSlot,
  PersistentState,
} from '../../types/index';
import { CHARACTERS } from '../data/characters';
import { VEGETABLE_PARTS } from '../data/meats';
import { DELAYED_EXCHANGE_DURATION } from '../data/constants';

// ---------------------------------------------------------------------------
// getCharacterModifiers
// ---------------------------------------------------------------------------

/**
 * Returns the static CharacterModifiers for the given character.
 * The `skills` parameter is accepted for API completeness (e.g., Speed Eater
 * override check) but modifier values are read directly from character
 * definitions, which already encode the correct behaviour.
 *
 * Unknown characterId is handled defensively: returns empty modifiers (Tanaka
 * baseline).
 */
export function getCharacterModifiers(
  characterId: CharacterId,
  _skills?: readonly string[], // eslint-disable-line @typescript-eslint/no-unused-vars
): CharacterModifiers {
  const character = CHARACTERS.find((c) => c.id === characterId);
  if (character === undefined) {
    // Defensive fallback — treat unknown character as Tanaka (no modifiers).
    return {};
  }
  return character.modifiers;
}

// ---------------------------------------------------------------------------
// canUnlockCharacter
// ---------------------------------------------------------------------------

/**
 * Evaluates whether the given character's unlock condition is satisfied by the
 * current persistent state.
 *
 * Unlock ladder:
 *   tanaka            — always unlocked
 *   gourmet-critic    — tanaka must be in clearedWithCharacterIds
 *   competitive-eater — tanaka must be in clearedWithCharacterIds
 *   raw-food-advocate — gourmet-critic OR competitive-eater in clearedWithCharacterIds
 *   vegan-tashiro     — gourmet-critic OR competitive-eater in clearedWithCharacterIds
 *
 * If the character is already present in persistentState.unlockedCharacters,
 * returns true regardless of the above rules.
 */
export function canUnlockCharacter(
  characterId: CharacterId,
  persistentState: PersistentState,
): boolean {
  // Tanaka is always available.
  if (characterId === 'tanaka') {
    return true;
  }

  // Already unlocked — short-circuit.
  if (persistentState.unlockedCharacters.includes(characterId)) {
    return true;
  }

  const cleared = persistentState.clearedWithCharacterIds;

  switch (characterId) {
    case 'gourmet-critic':
    case 'competitive-eater':
      // Requires Tanaka True Ending (Boss of Cycle TRUE_ENDING_CYCLE).
      return cleared.includes('tanaka');

    case 'raw-food-advocate':
    case 'vegan-tashiro':
      // Requires any Specialist character to have cleared.
      return (
        cleared.includes('gourmet-critic') ||
        cleared.includes('competitive-eater')
      );

    default:
      // Unknown character id — defensive: not unlocked.
      return false;
  }
}

// ---------------------------------------------------------------------------
// processVeganExchange
// ---------------------------------------------------------------------------

/**
 * Handles Vegan Tashiro's meat-to-vegetable exchange for a given grill slot.
 *
 * instant  — deducts exchangeCost coins; replaces slot part with a random
 *            VegetablePart; resets state/timers to raw baseline.
 * delayed  — does not deduct coins; removes meat (part → null); marks slot as
 *            disabled with disabledTimer = DELAYED_EXCHANGE_DURATION.
 *
 * Returns state unchanged if slotIndex is out of bounds.
 * All updates are immutable (returns a new GameState).
 */
export function processVeganExchange(
  state: GameState,
  slotIndex: number,
  method: 'instant' | 'delayed',
  exchangeCost: number,
): GameState {
  // Defensive: out-of-bounds slotIndex.
  if (slotIndex < 0 || slotIndex >= state.grill.length) {
    return state;
  }

  const slot = state.grill[slotIndex];
  if (slot === undefined) {
    return state;
  }

  let updatedSlot: GrillSlot;

  if (method === 'instant') {
    // Pick a random vegetable uniformly.
    const vegIndex = Math.floor(Math.random() * VEGETABLE_PARTS.length);
    const vegetable = VEGETABLE_PARTS[vegIndex]!;

    updatedSlot = {
      ...slot,
      part: vegetable,
      state: 'raw',
      timeInState: 0,
      fireTimer: 0,
    };

    return {
      ...state,
      coins: Math.max(0, state.coins - exchangeCost),
      grill: replaceSlot(state.grill, slotIndex, updatedSlot),
    };
  } else {
    // Delayed exchange: free, replace meat with vegetable, but apply action cooldown.
    const vegIndex = Math.floor(Math.random() * VEGETABLE_PARTS.length);
    const vegetable = VEGETABLE_PARTS[vegIndex]!;

    updatedSlot = {
      ...slot,
      part: vegetable,
      state: 'raw',
      timeInState: 0,
      fireTimer: 0,
    };

    return {
      ...state,
      grill: replaceSlot(state.grill, slotIndex, updatedSlot),
      actionDisabledTimer: DELAYED_EXCHANGE_DURATION,
    };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function replaceSlot(
  grill: readonly GrillSlot[],
  index: number,
  updated: GrillSlot,
): readonly GrillSlot[] {
  return grill.map((slot, i) => (i === index ? updated : slot));
}

import type { GameState, GameOverReason } from '../../types/index';
import { GRILL_FIRE_GAME_OVER_THRESHOLD } from '../data/constants';

/**
 * Returns true if the specified game-over condition is currently active
 * for the given game state, based on staged-unlock rules and character.
 */
export function isConditionActive(condition: GameOverReason, state: GameState): boolean {
  switch (condition) {
    case 'table-overflow':
      return true;

    case 'grill-fire':
      return state.highestRestaurantTypeReached >= 2;

    case 'raw-paralysis':
      return state.highestRestaurantTypeReached >= 3;

    case 'burnt-instant':
      return state.character === 'raw-food-advocate';

    case 'staff-kicked-out':
      // Checked in gameTick, not here (threshold-based, not condition-based)
      return true;
  }
}

/**
 * Evaluates all active game-over conditions in priority order.
 * Returns the GameOverReason of the first triggered condition, or null if none.
 *
 * Priority order:
 *   1. burnt-instant  (highest priority, character-specific)
 *   2. raw-paralysis  (table overflow during action disable, boss+ only)
 *   3. table-overflow (always active)
 *   4. grill-fire     (high-end+ only)
 */
export function checkGameOver(state: GameState): GameOverReason | null {
  // 1. burnt-instant — character-specific, ignores staged unlock
  if (isConditionActive('burnt-instant', state)) {
    const hasBurntSlot = state.grill.some(
      (slot) => slot.state === 'burnt' && slot.part !== null,
    );
    if (hasBurntSlot) {
      return 'burnt-instant';
    }
  }

  const tableOverflowed = state.table.length > state.tableCapacity;

  // 2. raw-paralysis — table overflow during action disable (boss+ staged unlock)
  //    Takes precedence over plain table-overflow when both would trigger simultaneously.
  if (isConditionActive('raw-paralysis', state)) {
    if (tableOverflowed && state.actionDisabledTimer > 0) {
      return 'raw-paralysis';
    }
  }

  // 3. table-overflow — always active
  if (tableOverflowed) {
    return 'table-overflow';
  }

  // 4. grill-fire — high-end+ staged unlock
  if (isConditionActive('grill-fire', state)) {
    const hasFireSlot = state.grill.some(
      (slot) => slot.fireTimer > GRILL_FIRE_GAME_OVER_THRESHOLD,
    );
    if (hasFireSlot) {
      return 'grill-fire';
    }
  }

  return null;
}

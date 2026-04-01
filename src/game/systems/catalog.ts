import type { GameState } from '../../types/index';
import { MEAT_PARTS } from '../data/meats';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_CATALOG_MEAT_PARTS = 11; // [TUNE] must match the number of non-vegetable entries in MEAT_PARTS

// Pre-compute the set of valid meat part IDs for O(1) lookups
const VALID_MEAT_PART_IDS: ReadonlySet<string> = new Set(
  MEAT_PARTS.filter((p) => !p.isVegetable).map((p) => p.id),
);

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Adds meatId to state.catalog if it is a valid meat part (not a vegetable)
 * and is not already present. Returns the same state reference if no change
 * is needed (idempotent, no-op for vegetables and unknown IDs).
 */
export function unlockCatalogEntry(state: GameState, meatId: string): GameState {
  // No-op: unknown or vegetable id
  if (!VALID_MEAT_PART_IDS.has(meatId)) {
    return state;
  }

  // No-op: already unlocked (return same reference for idempotency)
  if (state.catalog.includes(meatId)) {
    return state;
  }

  // Append and return new state (immutable update)
  return {
    ...state,
    catalog: [...state.catalog, meatId],
  };
}

/**
 * Returns true if meatId is present in state.catalog, false otherwise.
 */
export function isCatalogUnlocked(state: GameState, meatId: string): boolean {
  return state.catalog.includes(meatId);
}

/**
 * Returns how many of the 11 meat parts have been unlocked and the total count.
 * Vegetable IDs accidentally present in the catalog are not counted.
 */
export function getCatalogProgress(state: GameState): { unlocked: number; total: number } {
  const unlocked = state.catalog.filter((id) => VALID_MEAT_PART_IDS.has(id)).length;
  return { unlocked, total: TOTAL_CATALOG_MEAT_PARTS };
}

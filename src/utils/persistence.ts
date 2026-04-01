import type { CharacterId, PersistentState } from '../types/index';
import { MEAT_PARTS } from '../game/data/meats';
import { CHARACTERS } from '../game/data/characters';

// ---------------------------------------------------------------------------
// localStorage key constants — never inline these in function bodies
// ---------------------------------------------------------------------------

export const LS_KEY_HIGH_SCORE   = 'yakirogue_highscore';
export const LS_KEY_CHARACTERS   = 'yakirogue_characters';
export const LS_KEY_CATALOG      = 'yakirogue_catalog';
export const LS_KEY_CLEARED_WITH = 'yakirogue_cleared_with';
export const LS_SCHEMA_VERSION   = 1;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_HIGH_SCORE                        = 0;
const DEFAULT_CHARACTERS: CharacterId[]         = ['tanaka'];
const DEFAULT_CATALOG: string[]                 = [];
const DEFAULT_CLEARED_WITH: CharacterId[]       = [];

// ---------------------------------------------------------------------------
// Valid ID sets — derived from data constants for forward-compatibility guards
// ---------------------------------------------------------------------------

const VALID_CHARACTER_IDS: ReadonlySet<string> = new Set(
  CHARACTERS.map((c) => c.id),
);

const VALID_MEAT_PART_IDS: ReadonlySet<string> = new Set(
  MEAT_PARTS.map((m) => m.id),
);

// ---------------------------------------------------------------------------
// saveHighScore / loadHighScore
// ---------------------------------------------------------------------------

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(LS_KEY_HIGH_SCORE);
    if (raw === null || raw === '') return DEFAULT_HIGH_SCORE;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
      return DEFAULT_HIGH_SCORE;
    }
    return Math.max(0, Math.trunc(parsed));
  } catch {
    return DEFAULT_HIGH_SCORE;
  }
}

export function saveHighScore(score: number): void {
  // Write if strictly greater than stored value, OR if nothing is stored yet
  // (score === 0 on first run should still persist)
  let stored: string | null;
  try {
    stored = localStorage.getItem(LS_KEY_HIGH_SCORE);
  } catch {
    return;
  }
  if (stored !== null) {
    const current = loadHighScore();
    if (score <= current) return;
  }
  try {
    localStorage.setItem(LS_KEY_HIGH_SCORE, JSON.stringify(score));
  } catch {
    // silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// saveUnlockedCharacters / loadUnlockedCharacters
// ---------------------------------------------------------------------------

export function loadUnlockedCharacters(): CharacterId[] {
  try {
    const raw = localStorage.getItem(LS_KEY_CHARACTERS);
    if (raw === null) return [...DEFAULT_CHARACTERS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_CHARACTERS];
    // Filter to only known CharacterId values
    const filtered = (parsed as unknown[])
      .filter((v): v is CharacterId => typeof v === 'string' && VALID_CHARACTER_IDS.has(v));
    // Ensure 'tanaka' is always present
    if (!filtered.includes('tanaka')) {
      filtered.unshift('tanaka');
    }
    return filtered;
  } catch {
    return [...DEFAULT_CHARACTERS];
  }
}

export function saveUnlockedCharacters(characters: CharacterId[]): void {
  try {
    localStorage.setItem(LS_KEY_CHARACTERS, JSON.stringify(characters));
  } catch {
    // silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// saveCatalog / loadCatalog
// ---------------------------------------------------------------------------

export function loadCatalog(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY_CATALOG);
    if (raw === null) return [...DEFAULT_CATALOG];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_CATALOG];
    // Filter to only valid meat part IDs (no vegetables, no unknown IDs)
    return (parsed as unknown[]).filter(
      (v): v is string => typeof v === 'string' && VALID_MEAT_PART_IDS.has(v),
    );
  } catch {
    return [...DEFAULT_CATALOG];
  }
}

export function saveCatalog(catalog: string[]): void {
  try {
    localStorage.setItem(LS_KEY_CATALOG, JSON.stringify(catalog));
  } catch {
    // silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// saveClearedWith / loadClearedWith
// ---------------------------------------------------------------------------

export function loadClearedWith(): CharacterId[] {
  try {
    const raw = localStorage.getItem(LS_KEY_CLEARED_WITH);
    if (raw === null) return [...DEFAULT_CLEARED_WITH];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_CLEARED_WITH];
    return (parsed as unknown[]).filter(
      (v): v is CharacterId => typeof v === 'string' && VALID_CHARACTER_IDS.has(v),
    );
  } catch {
    return [...DEFAULT_CLEARED_WITH];
  }
}

export function saveClearedWith(characterIds: CharacterId[]): void {
  try {
    localStorage.setItem(LS_KEY_CLEARED_WITH, JSON.stringify(characterIds));
  } catch {
    // silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// savePersistentState / loadPersistentState
// ---------------------------------------------------------------------------

export function savePersistentState(state: PersistentState): void {
  saveHighScore(state.highScore);
  saveUnlockedCharacters([...state.unlockedCharacters]);
  saveCatalog([...state.catalog]);
  saveClearedWith([...state.clearedWithCharacterIds]);
}

export function loadPersistentState(): PersistentState {
  return {
    highScore: loadHighScore(),
    unlockedCharacters: loadUnlockedCharacters(),
    catalog: loadCatalog(),
    clearedWithCharacterIds: loadClearedWith(),
  };
}

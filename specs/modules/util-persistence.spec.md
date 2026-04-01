# Module Spec: Persistence Utilities

## Purpose
Thin wrapper over `localStorage` for all persistent game data: high score, unlocked characters, the meat catalog, and cleared-with character history. Provides typed load/save functions with safe defaults and a convenience pair for the full `PersistentState` shape.

## File Path
`src/utils/persistence.ts`

## Dependencies
- `src/types/index.ts` — `CharacterId`, `PersistentState`

---

## Constants

```ts
// localStorage key names — defined as named constants, never inlined
const LS_KEY_HIGH_SCORE       = 'yakirogue_highscore';
const LS_KEY_CHARACTERS       = 'yakirogue_characters';
const LS_KEY_CATALOG          = 'yakirogue_catalog';
const LS_KEY_CLEARED_WITH     = 'yakirogue_cleared_with';
const LS_SCHEMA_VERSION       = 1;   // increment when PersistentState shape changes

const DEFAULT_HIGH_SCORE      = 0;
const DEFAULT_CHARACTERS: CharacterId[] = ['tanaka'];
const DEFAULT_CATALOG: string[] = [];
const DEFAULT_CLEARED_WITH: CharacterId[] = [];
```

---

## PersistentState canonical shape

```ts
interface PersistentState {
  highScore: number;
  unlockedCharacters: CharacterId[];
  catalog: string[];
  clearedWithCharacterIds: CharacterId[];
}
```

---

## Functions

### `saveHighScore(score: number): void`
- **Purpose**: Writes `score` to `localStorage` under `LS_KEY_HIGH_SCORE` only if it is strictly greater than the currently stored value.
- **Preconditions**:
  - `score` is a non-negative integer.
- **Postconditions**:
  - If `score > loadHighScore()`: writes `score` to `localStorage[LS_KEY_HIGH_SCORE]` as a JSON-serialized number.
  - If `score <= loadHighScore()`: `localStorage` is not modified.
  - No return value; no thrown errors (storage errors are silently caught).
- **Edge cases**:
  - If `localStorage` is unavailable (private browsing, storage quota exceeded): the function fails silently; no exception propagates to the caller.
  - `score === 0` with no existing record: writes `0` (initial save on first run).

---

### `loadHighScore(): number`
- **Purpose**: Reads and returns the stored high score.
- **Preconditions**: None.
- **Postconditions**:
  - Returns the parsed integer stored under `LS_KEY_HIGH_SCORE`.
  - Returns `DEFAULT_HIGH_SCORE` (0) if the key does not exist or the stored value is not a valid number.
  - Return value is always a non-negative integer.
- **Edge cases**:
  - Corrupted or non-numeric stored value: returns `DEFAULT_HIGH_SCORE` (0); does not throw.
  - If `localStorage` is unavailable: returns `DEFAULT_HIGH_SCORE` (0).

---

### `saveUnlockedCharacters(characters: CharacterId[]): void`
- **Purpose**: Serializes and writes the full list of unlocked character IDs to `localStorage`.
- **Preconditions**:
  - `characters` contains at least `'tanaka'` (always unlocked).
  - `characters` contains no duplicates.
- **Postconditions**:
  - `localStorage[LS_KEY_CHARACTERS]` is set to `JSON.stringify(characters)`.
  - Overwrites any previously stored value; the provided array is the authoritative new state.
- **Edge cases**:
  - Storage errors are silently caught; no exception propagates.
  - Caller is responsible for ensuring `'tanaka'` is always included before calling.

---

### `loadUnlockedCharacters(): CharacterId[]`
- **Purpose**: Reads and returns the stored list of unlocked character IDs.
- **Preconditions**: None.
- **Postconditions**:
  - Returns the parsed array stored under `LS_KEY_CHARACTERS`.
  - Returns `DEFAULT_CHARACTERS` (`['tanaka']`) if the key does not exist, the stored value is not valid JSON, or the parsed value is not an array.
  - The returned array always contains `'tanaka'` (enforced on load; if somehow absent, it is added).
  - Unknown `CharacterId` values in the stored array are filtered out (forward-compatibility guard).
- **Edge cases**:
  - If `localStorage` is unavailable: returns `['tanaka']`.
  - Corrupted JSON: returns `['tanaka']`.
  - Stored array is valid but missing `'tanaka'` (data corruption): `'tanaka'` is re-inserted into the returned array.

---

### `saveCatalog(catalog: string[]): void`
- **Purpose**: Serializes and writes the list of unlocked meat part IDs to `localStorage`.
- **Preconditions**:
  - `catalog` is an array of valid meat part ID strings (no vegetable IDs, no duplicates).
- **Postconditions**:
  - `localStorage[LS_KEY_CATALOG]` is set to `JSON.stringify(catalog)`.
  - Overwrites any previously stored value.
- **Edge cases**:
  - Storage errors are silently caught.
  - An empty array `[]` is a valid value (no catalog entries yet).

---

### `loadCatalog(): string[]`
- **Purpose**: Reads and returns the stored list of unlocked meat part IDs.
- **Preconditions**: None.
- **Postconditions**:
  - Returns the parsed array stored under `LS_KEY_CATALOG`.
  - Returns `DEFAULT_CATALOG` (`[]`) if the key does not exist, the value is not valid JSON, or the parsed value is not an array.
  - Filters out any strings not recognized as valid meat part IDs (forward-compatibility guard; does not include vegetable IDs).
- **Edge cases**:
  - If `localStorage` is unavailable: returns `[]`.
  - Corrupted JSON: returns `[]`.

---

### `saveClearedWith(characterIds: CharacterId[]): void`
- **Purpose**: Serializes and writes the list of character IDs that have achieved a True Ending to `localStorage`.
- **Preconditions**:
  - `characterIds` is an array of valid `CharacterId` values (no duplicates).
- **Postconditions**:
  - `localStorage[LS_KEY_CLEARED_WITH]` is set to `JSON.stringify(characterIds)`.
  - Overwrites any previously stored value; the provided array is the authoritative new state.
- **Edge cases**:
  - Storage errors are silently caught; no exception propagates.
  - An empty array `[]` is a valid value (no True Endings yet).
  - To add a new cleared character without losing existing history: caller must load first, append, then save. This function writes the full array as given.

---

### `loadClearedWith(): CharacterId[]`
- **Purpose**: Reads and returns the stored list of character IDs that have achieved a True Ending.
- **Preconditions**: None.
- **Postconditions**:
  - Returns the parsed array stored under `LS_KEY_CLEARED_WITH`.
  - Returns `DEFAULT_CLEARED_WITH` (`[]`) if the key does not exist, the stored value is not valid JSON, or the parsed value is not an array.
  - Unknown `CharacterId` values in the stored array are filtered out (forward-compatibility guard).
- **Edge cases**:
  - If `localStorage` is unavailable: returns `[]`.
  - Corrupted JSON: returns `[]`.
  - Brand-new save with no True Endings: returns `[]`.

---

### `savePersistentState(state: PersistentState): void`
- **Purpose**: Convenience function that writes all persistent fields to `localStorage` in a single call.
- **Preconditions**:
  - `state` is a valid `PersistentState` object.
- **Postconditions**:
  - Calls `saveHighScore(state.highScore)`.
  - Calls `saveUnlockedCharacters([...state.unlockedCharacters])`.
  - Calls `saveCatalog([...state.catalog])`.
  - Calls `saveClearedWith([...state.clearedWithCharacterIds])`.
- **Edge cases**:
  - If any individual save fails silently, the others still proceed (each call is independent).

---

### `loadPersistentState(): PersistentState`
- **Purpose**: Convenience function that reads all persistent fields from `localStorage` and returns a fully populated `PersistentState` with defaults applied.
- **Preconditions**: None.
- **Postconditions**:
  - Returns:
    ```ts
    {
      highScore: loadHighScore(),
      unlockedCharacters: loadUnlockedCharacters(),
      catalog: loadCatalog(),
      clearedWithCharacterIds: loadClearedWith(),
    }
    ```
  - All fields are guaranteed non-null with valid defaults.
  - `unlockedCharacters` always contains `'tanaka'`.
  - `clearedWithCharacterIds` defaults to `[]` if nothing is stored.
- **Edge cases**:
  - If `localStorage` is completely unavailable: returns a fully defaulted `PersistentState` (`highScore: 0`, `unlockedCharacters: ['tanaka']`, `catalog: []`, `clearedWithCharacterIds: []`).
  - Schema version mismatch (stored version < `LS_SCHEMA_VERSION`): migration logic may be applied here in future; for now, returns defaults for any unrecognized fields.

---

## Invariants

- All functions handle `localStorage` errors silently — no unhandled exceptions escape this module.
- `loadUnlockedCharacters()` always returns an array containing `'tanaka'`, regardless of stored data.
- `loadHighScore()` always returns a non-negative integer.
- `saveHighScore` never decreases the stored high score.
- No function in this module reads from or writes to `GameState` directly; they operate only on `localStorage` and primitive / `PersistentState` types.
- localStorage keys are defined as module-level named constants; no key strings appear as inline literals in function bodies.
- Per-run state (`coins`, `skills`, `staffWarningCount`, etc.) is never written to `localStorage` — only high score, character unlocks, catalog, and cleared-with history are persisted.
- `LS_KEY_CLEARED_WITH = 'yakirogue_cleared_with'` is the canonical localStorage key for cleared-with history.
- `clearedWithCharacterIds` in `PersistentState` is the canonical field name for True Ending history.

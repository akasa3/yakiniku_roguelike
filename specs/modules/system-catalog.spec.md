# Module Spec: Meat Catalog

## Purpose
Manages the persistent meat catalog (図鑑): tracks which of the 11 meat parts have been unlocked via a successful eat action and exposes progress queries.

## File Path
`src/game/systems/catalog.ts`

## Dependencies
- `src/types/index.ts` — `GameState`
- `src/game/data/meats.ts` — `MEAT_PARTS: readonly MeatPart[]` (exactly 11 entries)

---

## Constants

```ts
// Defined in src/game/data/meats.ts
const TOTAL_CATALOG_MEAT_PARTS = 11;  // Kalbi, Beef Tongue, Harami, Upper Kalbi, Thick Tongue, Loin,
                                       // Special Kalbi, Zabuton, Misuji, Chateaubriand, Ichibo
```

The 11 catalogueable meat part IDs (matching `MeatPart.id` values):
- `'kalbi'`
- `'beef-tongue'`
- `'harami'`
- `'upper-kalbi'`
- `'thick-tongue'`
- `'loin'`
- `'special-kalbi'`
- `'zabuton'`
- `'misuji'`
- `'chateaubriand'`
- `'ichibo'`

Vegetables (`'green-pepper'`, `'eggplant'`) are NOT catalog entries; `unlockCatalogEntry` is a no-op for vegetable IDs.

---

## GameState catalog field

The catalog is stored on `GameState` as:

```ts
catalog: string[]   // array of unlocked meat part IDs (no vegetable IDs, no duplicates)
```

This is `state.catalog` — a flat string array. There is no `unlockedPartIds` or nested catalog sub-object.

---

## Functions

### `unlockCatalogEntry(state: GameState, meatId: string): GameState`
- **Purpose**: Adds `meatId` to `state.catalog` if it is not already present and is a valid meat part (not a vegetable).
- **Preconditions**:
  - `meatId` is a non-empty string.
  - Called after a successful eat action (not after discard or burn).
- **Postconditions**:
  - If `meatId` is a valid meat part ID (exists in `MEAT_PARTS` and `!part.isVegetable`) AND `meatId` is not already in `state.catalog`: returns a new `GameState` with `meatId` appended to `state.catalog`.
  - If `meatId` is already in `state.catalog`: returns the same state reference unchanged (idempotent; no duplicate added).
  - If `meatId` is a vegetable ID or unrecognized ID: returns state unchanged (no-op).
  - The unlock persists for the duration of the run in `state.catalog`. Persistence to localStorage is handled separately by `saveCatalog` in `src/utils/persistence.ts`.
- **Edge cases**:
  - Eating raw meat still unlocks the catalog entry (the penalty fires separately; the unlock is not blocked by the penalty state).
  - Eating the same meat part multiple times across multiple runs never creates duplicates (`state.catalog` has Set semantics).
  - `meatId` values are case-sensitive; they must match the `id` field defined in `MEAT_PARTS` exactly.

---

### `isCatalogUnlocked(state: GameState, meatId: string): boolean`
- **Purpose**: Checks whether the catalog entry for `meatId` is currently unlocked.
- **Preconditions**: None.
- **Postconditions**:
  - Returns `true` if `meatId` is present in `state.catalog`, `false` otherwise.
- **Edge cases**:
  - Returns `false` for unknown or vegetable IDs (they are never added to `state.catalog`).
  - Returns `false` on an empty `state.catalog` (fresh run/fresh save).

---

### `getCatalogProgress(state: GameState): { unlocked: number; total: number }`
- **Purpose**: Returns how many of the 11 meat parts have been unlocked and the total count.
- **Preconditions**: None.
- **Postconditions**:
  - `total` is always `TOTAL_CATALOG_MEAT_PARTS` (11) — constant.
  - `unlocked` is the count of entries in `state.catalog` that correspond to valid meat part IDs (i.e., `isVegetable === false`). Vegetable IDs, if accidentally present, are not counted.
  - `unlocked` is always in the range `[0, 11]`.
- **Edge cases**:
  - Returns `{ unlocked: 0, total: 11 }` on a fresh run with no catalog entries.
  - Returns `{ unlocked: 11, total: 11 }` when all parts have been eaten at least once.

---

## Invariants

- `state.catalog` never contains vegetable part IDs.
- `state.catalog` never contains duplicate entries (Set semantics enforced by `unlockCatalogEntry`).
- `getCatalogProgress().total` is always `11`; this value never changes at runtime.
- `getCatalogProgress().unlocked` is always ≤ `getCatalogProgress().total`.
- Catalog unlock is triggered exclusively by eat actions; discard and burn events never call `unlockCatalogEntry`.
- All three functions are pure: they take state and return new state or a value; no side effects, no mutations.
- Catalog data persists across runs via `localStorage`. `state.catalog` is initialized from `loadCatalog()` at game start and saved via `saveCatalog()` when updated.
- The canonical field is `state.catalog` (string array of meat IDs) — never `state.unlockedPartIds` or any other name.

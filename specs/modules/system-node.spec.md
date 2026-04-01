# Module Spec: Node System

## Purpose
Determines when a Node screen appears between restaurants, and implements the effects of Rest and Shop nodes — including skill/consumable offerings, purchasing, and rest-based penalty clearing.

## File Path
`src/game/systems/node.ts`

## Dependencies
- `src/types/index.ts` — `GameState`, `SkillDefinition`, `SkillBuild`, `ConsumableItem`
- `src/game/data/constants.ts` — `NODE_FREQUENCY_BY_CYCLE`, `NODE_FREQUENCY_FLOOR`, `SKILL_PURCHASE_COST`, `CONSUMABLE_PURCHASE_COST`, `SKILL_CHOICE_COUNT`
- `src/game/data/skills.ts` — `SKILLS`: full `SkillDefinition[]` pool
- `src/game/systems/skill.ts` — `acquireSkill`: used by `purchaseSkill` after deducting coins

---

## Types Referenced

```ts
// SkillDefinition and SkillBuild are imported from src/types/index.ts
// (reproduced here for reference only — canonical definition is in types.spec.md)
interface SkillDefinition {
  id: string;
  name: string;
  nameJP: string;
  description: string;
  build: SkillBuild;
  isStackable: boolean;
}

// SkillBuild is defined in src/types/index.ts (no local alias needed)
type SkillBuild = 'raw-rush' | 'precision' | 'burnt-exploit' | 'binge' | 'charming' | 'volume' | 'speed' | 'stability' | 'vegan';

// ConsumableItem and ConsumableEffect are defined in src/types/index.ts
// ConsumableItem: { id, name, nameJP, cost, effect: ConsumableEffect }
// ConsumableEffect: { type: 'clear-warning', amount } | { type: 'heal-fire', slotCount }
```

---

## Functions

### `shouldShowNode(cycle: number, restaurantsCompletedInCycle: number): boolean`

- **Purpose**: Returns `true` if a Node screen should be shown after completing `restaurantsCompletedInCycle` restaurants within the current cycle.
- **Preconditions**:
  - `cycle >= 1`
  - `restaurantsCompletedInCycle` in `[1, 4]` (1 = after Chain, 4 = after Boss)
- **Postconditions**:
  - Pure function; no mutation.
  - Determine the node frequency `freq` from the per-cycle counter:
    - `freq = NODE_FREQUENCY_BY_CYCLE[Math.min(cycle, NODE_FREQUENCY_BY_CYCLE.length) - 1]`
    - Equivalently: cycle 1 → 1, cycle 2 → 2, cycle 3+ → `NODE_FREQUENCY_FLOOR`
  - Returns `restaurantsCompletedInCycle % freq === 0`.
- **Examples**:
  - Cycle 1, freq=1: `restaurantsCompletedInCycle % 1 === 0` → always `true` (after every restaurant).
  - Cycle 2, freq=2: `true` after 2nd (Local) and 4th (Boss); `false` after 1st (Chain) and 3rd (High-End).
  - Cycle 3+, freq=3: `true` after 3rd (High-End); `false` after 1st (Chain), 2nd (Local), and 4th (Boss).
- **Edge cases**:
  - Cycle 1 always returns `true` for every restaurant (freq=1; all values are divisible by 1).
  - Cycle 3+ floor is fixed — frequency never drops below 3 regardless of cycle number.
  - `restaurantsCompletedInCycle = 4` (Boss) with freq=3: `4 % 3 !== 0` → `false` in cycle 3+. The Boss in cycle 3 does NOT trigger a node unless it is the 3rd multiple — confirmed by `FR-03_restaurant-progression.test.md` which states "node after restaurant 3 (High-End)" for cycle 3.
  - This function uses the per-cycle counter `restaurantsCompletedInCycle`, NOT a cumulative count across cycles.

---

### `applyRest(state: GameState): GameState`

- **Purpose**: Applies the effects of a Rest node — clears all active debuffs and resets the staff warning counter to 0.
- **Preconditions**:
  - Player has selected Rest at a Node screen.
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - `state.actionDisabledTimer = 0`
  - `state.burntSmokeActive = false`
  - `state.staffWarningCount = 0`
  - All grill slots: `slot.fireTimer = 0`, `slot.disabled = false`, `slot.disabledTimer = 0`.
- **Edge cases**:
  - Rest occurs between restaurants — the grill should be empty at this point. However, if any slot somehow has a grill fire active (unlikely at node time), the reset still applies.
  - Rest does NOT reset `state.coins`, `state.skills`, `state.score`, or `state.cycle`.
  - Rest does NOT reset `state.catalog` or `state.highestRestaurantTypeReached`.

---

### `getShopOfferings(state: GameState): { skills: SkillDefinition[]; consumables: ConsumableItem[] }`

- **Purpose**: Returns up to 3 randomly selected skills not yet held by the player, plus all currently available consumables.
- **Preconditions**:
  - `state.skills` is the current list of held skill IDs (kebab-case).
- **Postconditions**:
  - Pure function (deterministic given the same random seed — in practice uses `Math.random()`; results are not reproducible across calls).
  - `skills`: pick up to `SKILL_CHOICE_COUNT` (3) items from `SKILLS` (imported from `data-skills.ts`) where `skill.id` is not in `state.skills` and `skill.id` does not equal the character's `starterSkillId` (already acquired at game start). If fewer than 3 unacquired non-starter skills remain, return all remaining eligible skills (may return fewer than 3). [TUNE: behavior when pool is exhausted]
  - `consumables`: return the full list of available `ConsumableItem` definitions. Consumables are not gated by the player's current state. [TBD: restock rules, limits per shop visit]
- **Edge cases**:
  - The character's starter skill is excluded from shop offerings by matching `skill.id === CHARACTER_DEFINITIONS[state.character].starterSkillId` — it was already acquired at game start and must not appear again.
  - If the player already holds all non-starter skills in the pool, `skills` returns an empty array.
  - `'exchange-discount'` is in the general pool and may be offered to non-Vegan characters.

---

### `purchaseSkill(state: GameState, skillId: string): GameState`

- **Purpose**: Deducts `SKILL_PURCHASE_COST` coins and adds the skill to the player's held skills by delegating to `acquireSkill`.
- **Preconditions**:
  - `state.coins >= SKILL_PURCHASE_COST`
  - `skillId` is a valid skill in the pool
  - `skillId` is NOT already in `state.skills`
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - `state.coins -= SKILL_PURCHASE_COST`
  - Delegates skill acquisition to `acquireSkill(state, skillId)` from `system-skill.ts`. All skill-specific side effects (slot additions, table capacity, serving interval adjustments) are handled by `acquireSkill`.
- **Edge cases**:
  - If `state.coins < SKILL_PURCHASE_COST`, the function must return `state` unchanged (no partial purchase). The caller (UI layer via hooks) should guard against this, but this function also enforces it.
  - If `skillId` is already in `state.skills`, return `state` unchanged (idempotent).

---

### `purchaseConsumable(state: GameState, itemId: string): GameState`

- **Purpose**: Deducts `CONSUMABLE_PURCHASE_COST` coins and applies the consumable's effect immediately.
- **Preconditions**:
  - `state.coins >= CONSUMABLE_PURCHASE_COST`
  - `itemId` is a valid consumable ID in the shop's current offerings
- **Postconditions**:
  - Returns new `GameState`; no mutation.
  - `state.coins -= CONSUMABLE_PURCHASE_COST`
  - Apply the consumable effect based on `effect.type`:
    - `'clear-warning'`: `state.staffWarningCount = max(0, state.staffWarningCount - effect.amount)`. Recalculate staff warning level using current thresholds (same logic as `incrementStaffWarning`).
    - `'heal-fire'`: extinguish grill fire on up to `effect.slotCount` burning/disabled slots (reset `fireTimer`, `disabled`, `disabledTimer`).
  - Consumables are single-use — they are NOT added to `state.skills` or any persistent inventory.
- **Edge cases**:
  - If `state.coins < CONSUMABLE_PURCHASE_COST`, return `state` unchanged.
  - If `itemId` is invalid or not in current offerings, return `state` unchanged.
  - A consumable that clears warnings below the debuff threshold should also update the effective staff warning level (recalculate from `state.staffWarningCount`).

---

## Node Flow

```
Restaurant cleared
  └─► Skill selection screen (always — SKILL_CHOICE_COUNT random choices from SKILLS pool)
        └─► Player selects 1 skill (free, awarded by restaurant clear)
              └─► shouldShowNode(cycle, restaurantsCompletedInCycle) ?
                    ├─► false → Next restaurant begins immediately
                    └─► true  → Node screen shown
                                  ├─► Player chooses Rest
                                  │     └─► applyRest(state)
                                  │           └─► Next restaurant begins
                                  └─► Player chooses Shop
                                        └─► getShopOfferings(state) displayed
                                              ├─► purchaseSkill / purchaseConsumable (0 or more times)
                                              └─► Player exits shop → Next restaurant begins
```

> **Skill selection after restaurant clear** is separate from the Shop — it always offers `SKILL_CHOICE_COUNT` free skill choices and always occurs before any Node screen. The Shop additionally offers skills for purchase (at cost).

---

## Invariants

1. `shouldShowNode` is a pure function — same inputs always produce the same output.
2. `applyRest` always results in `state.staffWarningCount === 0`.
3. `purchaseSkill` never adds a skill that is already held.
4. `purchaseConsumable` never reduces `state.coins` below 0.
5. Neither `purchaseSkill` nor `purchaseConsumable` mutates the input `state`.
6. `getShopOfferings` never includes skills already held by the player (`state.skills`).
7. Node frequency floor is `NODE_FREQUENCY_FLOOR = 3` and cannot be reduced further regardless of cycle number.
8. The skill pool queried by `getShopOfferings` is the same `SKILLS` constant from `data-skills.ts` as used by the post-restaurant skill selection — the two screens draw from the same pool, filtered by already-held skills and the character's starter skill ID.
9. `purchaseSkill` delegates to `acquireSkill` from `system-skill.ts`; it does NOT apply skill side effects inline.
10. `shouldShowNode` uses the per-cycle counter `restaurantsCompletedInCycle`, not a cumulative count across cycles.
11. All skill IDs are kebab-case strings matching the canonical IDs in `src/game/data/skills.ts`.

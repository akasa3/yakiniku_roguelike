# Module Spec: Character Definitions

## Purpose
Defines all 5 playable character records as immutable typed constants, including unlock conditions, starter skills, and character-specific modifiers.

## File Path
`src/game/data/characters.ts`

## Dependencies
- `src/types/index.ts` — `CharacterDefinition`, `CharacterId`, `CharacterModifiers`, `UnlockCondition`, `MeatRank`, `PersistentState`
- `src/game/data/constants.ts` — all numeric modifier constants

> All numeric modifier constants are defined in `data-constants.spec.md` and imported from there. Do not redefine them here.

---

## Types / Interfaces

All types are defined in `src/types/index.ts`. The key types used here are:

### `UnlockCondition` (discriminated union)
```ts
type UnlockCondition =
  | { readonly type: 'default' }
  | { readonly type: 'clear-with'; readonly characterId: CharacterId }
  | { readonly type: 'clear-with-any'; readonly characterType: 'specialist' | 'peaky' };
```
- `'default'` — available from the very start; no unlock required
- `'clear-with'` — requires achieving the True Ending (defeating the Boss restaurant of Cycle 4) with the named character; tracked via `PersistentState.clearedWithCharacterIds`
- `'clear-with-any'` — requires achieving the True Ending with any character of the specified `characterType`; checked against `PersistentState.clearedWithCharacterIds`

"Clearing the game" is defined as defeating the Boss restaurant of Cycle 4 (triggers the True Ending), which adds that `CharacterId` to `PersistentState.clearedWithCharacterIds`.

---

## Exports

### `CHARACTERS`: `readonly CharacterDefinition[]`
All 5 characters in unlock order. Exactly 5 entries.

---

#### Character 1: Salaryman Tanaka
```
id:              'tanaka'
name:            'Salaryman Tanaka'
nameJP:          'サラリーマン田中'
type:            'balanced'
starterSkillId:  'discard-pro'
unlockCondition: { type: 'default' }
modifiers:       {} (empty — no stat bonuses or penalties)
```
- No coin multipliers for any rank (all coins at baseline 1.0×)
- No eating speed modification
- Recommended for first-time players

---

#### Character 2: Gourmet Critic
```
id:              'gourmet-critic'
name:            'Gourmet Critic'
nameJP:          'グルメ評論家'
type:            'specialist'
starterSkillId:  'heat-sensor'
unlockCondition: { type: 'clear-with', characterId: 'tanaka' }
modifiers:
  sweetSpotBonus:
    premium: GOURMET_SWEET_SPOT_BONUS   (+1s)
    elite:   GOURMET_SWEET_SPOT_BONUS   (+1s)
    upper:   0                          (neutral; no bonus)
    common:  0                          (neutral; no bonus)
  coinMultiplierByRank:
    common:  GOURMET_COMMON_COIN_MULTIPLIER  (0.50 — 50% of base)
    upper:   1.0                             (no modifier)
    premium: 1.0                             (no modifier)
    elite:   1.0                             (no modifier)
```
- Sweet_spot bonus applies only to Premium and Elite ranks
- Common meat coin penalty applies regardless of grill state when eaten
- No eating speed modification
- Unlock check: `PersistentState.clearedWithCharacterIds.includes('tanaka')`

---

#### Character 3: Competitive Eater
```
id:              'competitive-eater'
name:            'Competitive Eater'
nameJP:          '大食い選手'
type:            'specialist'
starterSkillId:  'speed-eater'
unlockCondition: { type: 'clear-with', characterId: 'tanaka' }
modifiers:
  eatSpeedMultiplier:            COMPETITIVE_EATER_SPEED_MULTIPLIER       (0.50)
  sweetSpotPenaltyMultiplier:    COMPETITIVE_EATER_SWEET_SPOT_MULTIPLIER  (0.80) [TUNE]
```
- `eatSpeedMultiplier: 0.50` means eating actions complete in 50% of base duration
- This value **overrides** Speed Eater's −30% reduction; they do not stack
  - If player acquires Speed Eater: effective eat time = base × 0.50 (character value wins)
- `sweetSpotPenaltyMultiplier: 0.80` multiplies each meat's base sweet_spot, narrowing the window
  - Example: Kalbi base sweet_spot = 2s → effective = 2s × 0.80 = 1.6s [TUNE]
  - Applies to all meat types and ranks
- Unlock check: `PersistentState.clearedWithCharacterIds.includes('tanaka')`

---

#### Character 4: Raw Food Advocate
```
id:              'raw-food-advocate'
name:            'Raw Food Advocate'
nameJP:          '生食主義者'
type:            'peaky'
starterSkillId:  'iron-stomach'
unlockCondition: { type: 'clear-with-any', characterType: 'specialist' }
modifiers:
  instantGameOverOnBurn: true
```
- `instantGameOverOnBurn: true` — any meat transitioning to `burnt` triggers immediate game over (`gameOver: 'burnt-instant'`)
  - Active from the very first restaurant (ignores staged unlock system)
  - Applies to all meat ranks (Common through Elite)
  - Does NOT apply to vegetables — vegetable burns do not trigger game over
- Starter Iron Stomach negates the raw meat action-disable entirely
- High throughput potential: can eat meat at raw/rare without penalty
- Unlock check: `PersistentState.clearedWithCharacterIds` contains at least one `CharacterId` whose character type is `'specialist'`

---

#### Character 5: Vegan Tashiro
```
id:              'vegan-tashiro'
name:            'Vegan Tashiro'
nameJP:          'ヴィーガン田代'
type:            'peaky'
starterSkillId:  'exchange-discount'
unlockCondition: { type: 'clear-with-any', characterType: 'specialist' }
modifiers:
  vegetableCoinMultiplier:          VEGETABLE_COIN_MULTIPLIER              (3)
  meatEatStaffWarningIncrement:     VEGAN_MEAT_EAT_WARNING_PENALTY         (2)
```
- `vegetableCoinMultiplier: 3` — eating any vegetable earns 3× its base coin value; applies in all restaurant types
- `meatEatStaffWarningIncrement: 2` — eating any meat (regardless of rank) increments the Staff Warning counter by 2
- When a meat dish arrives, player may choose:
  - **Instant Exchange** (spend `INSTANT_EXCHANGE_BASE_COST × EXCHANGE_DISCOUNT_MULTIPLIER` coins with starter skill) — meat replaced immediately by a random vegetable
  - **Delayed Exchange** (no coin cost) — grill slot occupied for `DELAYED_EXCHANGE_DURATION` seconds; vegetable arrives after
  - **No action** — meat stays and progresses normally; eating it triggers +2 Staff Warning
- Discarding non-exchanged meat applies standard Discard Loss (Staff Warning +1) unless Discard Pro is held
- Unlock check: same as Raw Food Advocate — `PersistentState.clearedWithCharacterIds` contains at least one specialist character

---

## Functions

### `getCharacter(id: CharacterId): CharacterDefinition`
- Returns the character definition with the matching `id`
- Throws if `id` is not a valid `CharacterId`
- Pure function; no side effects

### `isCharacterUnlocked(id: CharacterId, persistentState: PersistentState): boolean`
- Returns `true` if the character is present in `persistentState.unlockedCharacters`
- `'tanaka'` always returns `true` (always unlocked by definition)
- Pure function; does not write to storage

### `getUnlockDescription(condition: UnlockCondition): string`
- Returns a human-readable English unlock description for display on the character selection screen
- Examples:
  - `{ type: 'default' }` → `'Available from the start'`
  - `{ type: 'clear-with', characterId: 'tanaka' }` → `'Clear a run with Salaryman Tanaka'`
  - `{ type: 'clear-with-any', characterType: 'specialist' }` → `'Clear a run with any Specialist character'`
- "Clear a run" means defeating the Boss restaurant of Cycle 4 (True Ending)

---

## Invariants

- `CHARACTERS.length === 5`
- All `id` values are unique
- Exactly one character has `unlockCondition.type === 'default'` (Salaryman Tanaka)
- Both Specialist characters (`'gourmet-critic'`, `'competitive-eater'`) have `unlockCondition: { type: 'clear-with', characterId: 'tanaka' }`
- Both Peaky characters (`'raw-food-advocate'`, `'vegan-tashiro'`) have `unlockCondition: { type: 'clear-with-any', characterType: 'specialist' }`
- `eatSpeedMultiplier` in `CharacterModifiers`, when defined, takes precedence over any skill-based eat speed reduction — the system must not stack the two
- `CHARACTERS` array is typed `as const` (readonly at compile time)
- No inline magic numbers in character definitions; all numeric modifiers reference named constants from `data-constants.ts`
- Unlock logic reads from `PersistentState.clearedWithCharacterIds`, not `unlockedCharacters`

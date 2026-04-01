# Module Spec: Meat & Vegetable Data

## Purpose
Defines all meat and vegetable part data as immutable typed constants.

## File Path
`src/game/data/meats.ts`

## Dependencies
- `src/types/index.ts` — `MeatPart`, `VegetablePart`, `Part`, `MeatRank`
- `src/game/data/constants.ts` — `GRILL_TIME`, `FLARE_RISK`, `SWEET_SPOT`

> All numeric calibration constants (`GRILL_TIME`, `FLARE_RISK`, `SWEET_SPOT`) are defined in `data-constants.spec.md` and imported from there. Do not redefine them here.

---

## Exports

### `MEAT_PARTS`: `readonly MeatPart[]`
All 11 meat parts. Order matches GAME_DESIGN.md §4.2 (Common → Upper → Premium → Elite).

| id | name | nameJP | rank | grillTime | flareRisk | sweetSpot | flavorText |
|---|---|---|---|---|---|---|---|
| `'kalbi'` | Kalbi | カルビ | `'common'` | `GRILL_TIME.MEDIUM` | `FLARE_RISK.HIGH` | `SWEET_SPOT.MEDIUM` | `'A reliable classic. Burns faster than your motivation on a Monday.'` |
| `'beef-tongue'` | Beef Tongue | 牛タン | `'common'` | `GRILL_TIME.SHORT` | `FLARE_RISK.LOW` | `SWEET_SPOT.NARROW` | `'Thin slice. Blink and it\'s well-done. Blink twice and it\'s charcoal.'` |
| `'harami'` | Harami | ハラミ | `'common'` | `GRILL_TIME.MEDIUM` | `FLARE_RISK.MEDIUM` | `SWEET_SPOT.WIDE` | `'Forgiving on the grill. Even more forgiving on the stomach.'` |
| `'upper-kalbi'` | Upper Kalbi | 上カルビ | `'upper'` | `GRILL_TIME.MEDIUM` | `FLARE_RISK.HIGH` | `SWEET_SPOT.MEDIUM` | `'Marbled ambition. Worth every second of focus.'` |
| `'thick-tongue'` | Thick Tongue | 厚切りタン | `'upper'` | `GRILL_TIME.LONG` | `FLARE_RISK.LOW` | `SWEET_SPOT.NARROW` | `'Patience is a virtue. This cut demands it.'` |
| `'loin'` | Loin | ロース | `'upper'` | `GRILL_TIME.MEDIUM` | `FLARE_RISK.MEDIUM` | `SWEET_SPOT.WIDE` | `'Clean, consistent, comforting. The business casual of BBQ.'` |
| `'special-kalbi'` | Special Kalbi | 特上カルビ | `'premium'` | `GRILL_TIME.MEDIUM` | `FLARE_RISK.VERY_HIGH` | `SWEET_SPOT.MEDIUM` | `'This one WILL flare. It\'s not a question of if.'` |
| `'zabuton'` | Zabuton | ザブトン | `'premium'` | `GRILL_TIME.LONG` | `FLARE_RISK.HIGH` | `SWEET_SPOT.NARROW` | `'Named after a cushion. Treat it gently or it will not forgive you.'` |
| `'misuji'` | Misuji | ミスジ | `'premium'` | `GRILL_TIME.SHORT` | `FLARE_RISK.LOW` | `SWEET_SPOT.VERY_WIDE` | `'Rare and forgiving. Proof the universe occasionally balances out.'` |
| `'chateaubriand'` | Chateaubriand | シャトーブリアン | `'elite'` | `GRILL_TIME.VERY_LONG` | `FLARE_RISK.MEDIUM` | `SWEET_SPOT.VERY_NARROW` | `'The pinnacle of solo BBQ. No one is watching, so you can take 10 minutes on this one.'` |
| `'ichibo'` | Ichibo | イチボ | `'elite'` | `GRILL_TIME.LONG` | `FLARE_RISK.LOW` | `SWEET_SPOT.NARROW` | `'A hidden gem. Reward for those who make it this far.'` |

Constraints:
- Exactly 11 entries — no more, no fewer
- All `id` values are unique strings
- All `nameJP` values are unique Japanese strings
- `isVegetable` is `false` for all entries
- `flavorText` is a non-empty string for every entry (shown in the Meat Catalog, GAME_DESIGN.md §12)
- No raw number literals in definitions; all numeric values must reference `GRILL_TIME`, `FLARE_RISK`, or `SWEET_SPOT` constants imported from `data-constants.ts`

### `VEGETABLE_PARTS`: `readonly VegetablePart[]`
All 2 vegetable parts.

| id | name | nameJP | grillTime | flareRisk | sweetSpot |
|---|---|---|---|---|---|
| `'green-pepper'` | Green Pepper | ピーマン | `GRILL_TIME.SHORT` | `FLARE_RISK.NONE` | `SWEET_SPOT.WIDE` |
| `'eggplant'` | Eggplant | なす | `GRILL_TIME.MEDIUM` | `FLARE_RISK.NONE` | `SWEET_SPOT.WIDE` |

Constraints:
- Exactly 2 entries
- `isVegetable` is `true` for all entries
- `flareRisk` is always `FLARE_RISK.NONE` (0) — no flare check is performed for vegetables

### `ALL_PARTS`: `readonly Part[]`
Concatenation of `MEAT_PARTS` and `VEGETABLE_PARTS`. Total: 13 entries.
- Used when building serving queues that mix meats and vegetables

---

## Functions

### `getMeatPart(id: string): MeatPart`
- Returns the `MeatPart` with the matching `id`
- Throws if `id` is not found
- Precondition: `id` is a valid meat part id (not a vegetable id)

### `getVegetablePart(id: string): VegetablePart`
- Returns the `VegetablePart` with the matching `id`
- Throws if `id` is not found

### `getPart(id: string): Part`
- Returns any `Part` (meat or vegetable) matching `id`
- Throws if `id` is not found

### `getMeatPartsByRank(rank: MeatRank): readonly MeatPart[]`
- Returns all meat parts of the given rank
- Common → 3 results; Upper → 3 results; Premium → 3 results; Elite → 2 results

---

## Invariants

- `MEAT_PARTS.length === 11`
- `VEGETABLE_PARTS.length === 2`
- `ALL_PARTS.length === 13`
- All `id` values across `ALL_PARTS` are unique
- All `MeatPart.flareRisk` values are > 0 (non-zero for all meats)
- All `VegetablePart.flareRisk` values === `FLARE_RISK.NONE` (= 0)
- No meat part has `rank` undefined; every entry maps to a valid `MeatRank`
- All `MeatPart.flavorText` values are non-empty strings
- All data arrays are typed `as const` (readonly at the type level; fields are not reassignable)
- All numeric field values reference named constants from `data-constants.ts` — no inline magic numbers permitted

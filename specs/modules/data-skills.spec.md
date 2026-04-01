# Module Spec: Skill Definitions

## Purpose
Defines all 24 skills (12 core + 12 build-specific) as immutable typed constants.

## File Path
`src/game/data/skills.ts`

## Dependencies
- `src/types/index.ts` — `SkillDefinition`, `SkillBuild`
- `src/game/data/constants.ts` — all numeric effect constants

> All numeric effect constants are defined in `data-constants.spec.md` and imported from there. Do not redefine them here.

---

## Exports

### `SKILLS`: `readonly SkillDefinition[]`
All 24 skills. Grouped logically below; stored in a single flat array.

---

### 9.1 Core Skills (available to all builds)

#### `'tong-master'` — Tong Master
```
id:           'tong-master'
name:         'Tong Master'
nameJP:       'トング職人'
build:        'precision'
isStackable:  false
description:  'Unlocks the Flip action. Flipping resets the meat\'s timeInState to FLIP_TIMER_RESET_FRACTION × full state duration, buying more time before burning.'
```

#### `'heat-sensor'` — Heat Sensor
```
id:           'heat-sensor'
name:         'Heat Sensor'
nameJP:       'ヒートセンサー'
build:        'precision'
isStackable:  false
description:  'Shows a visual warning on a grill slot HEAT_SENSOR_WARNING_SECONDS before the meat transitions to burnt. Also fires when a flare_risk event triggers within the final pre-burnt state and remaining time drops to ≤ HEAT_SENSOR_WARNING_SECONDS.'
```

#### `'extra-slot'` — Extra Slot
```
id:           'extra-slot'
name:         'Extra Slot'
nameJP:       'スロット増設'
build:        'volume'
isStackable:  true
description:  'Adds EXTRA_SLOT_COUNT grill slots. Can be acquired multiple times.'
```

#### `'table-extension'` — Table Extension
```
id:           'table-extension'
name:         'Table Extension'
nameJP:       'テーブル拡張'
build:        'volume'
isStackable:  true
description:  'Increases table capacity by TABLE_EXTENSION_COUNT. Can be acquired multiple times.'
```

#### `'slot-efficiency-bonus'` — Slot Efficiency Bonus
```
id:           'slot-efficiency-bonus'
name:         'Slot Efficiency Bonus'
nameJP:       '全スロットボーナス'
build:        'volume'
isStackable:  false
description:  'Each time all grill slots become simultaneously occupied, earn +SLOT_EFFICIENCY_BONUS_COINS coins.'
```

#### `'speed-eater'` — Speed Eater
```
id:           'speed-eater'
name:         'Speed Eater'
nameJP:       '早食い'
build:        'speed'
isStackable:  false
description:  'Eating action time × SPEED_EATER_MULTIPLIER (−30%). Override: if the character\'s eatSpeedMultiplier is set, the character value takes precedence; Speed Eater does not stack on top.'
```

#### `'quick-order'` — Quick Order
```
id:           'quick-order'
name:         'Quick Order'
nameJP:       'クイックオーダー'
build:        'speed'
isStackable:  false
description:  'Reduces the serving interval by QUICK_ORDER_INTERVAL_REDUCTION second for the current restaurant. Takes effect immediately upon acquisition.'
```

#### `'quick-turnover-bonus'` — Quick Turnover Bonus
```
id:           'quick-turnover-bonus'
name:         'Quick Turnover Bonus'
nameJP:       '回転率ボーナス'
build:        'speed'
isStackable:  false
description:  'Clearing a restaurant with dishes-per-minute above the defined threshold grants +QUICK_TURNOVER_BONUS_COINS coins. [TUNE: threshold value]'
```

#### `'discard-pro'` — Discard Pro
```
id:           'discard-pro'
name:         'Discard Pro'
nameJP:       '廃棄のプロ'
build:        'stability'
isStackable:  false
description:  'Discarding any dish does not increment the Staff Warning counter. Complementary with Tare Conversion: if both are held, counter is suppressed AND Tare Conversion coin reward is granted.'
```

#### `'charming-personality'` — Charming Personality
```
id:           'charming-personality'
name:         'Charming Personality'
nameJP:       '愛嬌キャラ'
build:        'stability'
isStackable:  false
description:  'Raises the Staff Warning first debuff threshold to CHARMING_FIRST_THRESHOLD (from STAFF_WARNING_THRESHOLD) and the stacked debuff threshold to CHARMING_STACK_THRESHOLD (from STAFF_WARNING_STACK_THRESHOLD).'
```

#### `'fire-control'` — Fire Control
```
id:           'fire-control'
name:         'Fire Control'
nameJP:       '消火マスター'
build:        'stability'
isStackable:  false
description:  'Grill fire disable duration × FIRE_CONTROL_MULTIPLIER (halved). Fire auto-extinguishes after FIRE_CONTROL_AUTO_EXTINGUISH_SECONDS.'
```

#### `'exchange-discount'` — Exchange Discount
```
id:           'exchange-discount'
name:         'Exchange Discount'
nameJP:       '交換割引'
build:        'vegan'
isStackable:  false
description:  'Instant Exchange coin cost × EXCHANGE_DISCOUNT_MULTIPLIER (−30%). No effect on Delayed Exchange (already free). Available to all characters in the skill pool.'
```

---

### 9.2 Build-Specific Skills

#### Raw Rush

##### `'raw-tolerance'` — Raw Tolerance
```
id:           'raw-tolerance'
name:         'Raw Tolerance'
nameJP:       '生食耐性'
build:        'raw-rush'
isStackable:  false
description:  'Raw meat action-disable duration × RAW_TOLERANCE_MULTIPLIER (−70% → ~0.9s at base 3s). Superseded by Iron Stomach if both are held.'
```

##### `'iron-stomach'` — Iron Stomach
```
id:           'iron-stomach'
name:         'Iron Stomach'
nameJP:       '鉄の胃袋'
build:        'raw-rush'
isStackable:  false
description:  'Raw meat penalty fully negated (0s disable). Takes full precedence over Raw Tolerance when both are held.'
```

##### `'fast-eaters-wage'` — Fast Eater's Wage
```
id:           'fast-eaters-wage'
name:         "Fast Eater's Wage"
nameJP:       '早食い賃金'
build:        'raw-rush'
isStackable:  false
description:  'Eating meat in the rare state grants +FAST_EATER_WAGE_COINS coins. Does not trigger for medium, well-done, or raw state eats.'
```

#### Burnt Exploit

##### `'tare-conversion'` — Tare Conversion
```
id:           'tare-conversion'
name:         'Tare Conversion'
nameJP:       'タレ変換'
build:        'burnt-exploit'
isStackable:  false
description:  'Discarding any meat grants +TARE_CONVERSION_COINS coins AND does not increment Staff Warning counter. Does not apply to vegetable discards. Complementary with Char Bonus (stacks on burnt discards) and with Discard Pro.'
```

##### `'char-bonus'` — Char Bonus
```
id:           'char-bonus'
name:         'Char Bonus'
nameJP:       '炭ボーナス'
build:        'burnt-exploit'
isStackable:  false
description:  'Discarding burnt meat specifically grants +CHAR_BONUS_COINS coins AND does not increment Staff Warning counter. Stacks with Tare Conversion on burnt discards: both coin amounts are granted.'
```

##### `'perfect-grill-bonus'` — Perfect Grill Bonus
```
id:           'perfect-grill-bonus'
name:         'Perfect Grill Bonus'
nameJP:       '完璧焼きボーナス'
build:        'precision'
isStackable:  false
description:  'Eating meat in the well-done state grants +PERFECT_GRILL_BONUS_COINS coins. Does not trigger for rare, medium, or raw state eats.'
```

#### Binge

##### `'binge-mode'` — Binge Mode
```
id:           'binge-mode'
name:         'Binge Mode'
nameJP:       '暴食モード'
build:        'binge'
isStackable:  false
description:  'Eating EATING_STREAK_THRESHOLD dishes consecutively (without any non-eat action) activates coin value ×2 for the next dish eaten. Streak resets after the ×2 dish is consumed or any non-eat action is taken.'
```

##### `'digestive-pro'` — Digestive Pro
```
id:           'digestive-pro'
name:         'Digestive Pro'
nameJP:       '消化のプロ'
build:        'binge'
isStackable:  false
description:  'Binge Mode consecutive eat count required for the coin-double trigger is reduced from EATING_STREAK_THRESHOLD to DIGESTIVE_PRO_STREAK_THRESHOLD. [TUNE]'
```

##### `'eating-streak-bonus'` — Eating Streak Bonus
```
id:           'eating-streak-bonus'
name:         'Eating Streak Bonus'
nameJP:       '連食ボーナス'
build:        'binge'
isStackable:  false
description:  'Every EATING_STREAK_THRESHOLD consecutive dishes eaten (without a break) grants +EATING_STREAK_BONUS_COINS coins. Triggers again at every subsequent multiple. Streak counter resets to 0 on any non-eat action.'
```

#### Charming

##### `'regular-customer'` — Regular Customer
```
id:           'regular-customer'
name:         'Regular Customer'
nameJP:       '常連客'
build:        'charming'
isStackable:  false
description:  'Staff Warning counter decreases by REGULAR_CUSTOMER_WARNING_REDUCTION per restaurant cleared. Floor: counter cannot go below 0.'
```

##### `'vip-status'` — VIP Status
```
id:           'vip-status'
name:         'VIP Status'
nameJP:       'VIPステータス'
build:        'charming'
isStackable:  false
description:  'Staff Warning debuff is replaced by a small speed buff when the warning threshold is reached. Overrides Charming Personality: if both are held, the speed buff applies at the raised threshold.'
```

##### `'regular-customer-bonus'` — Regular Customer Bonus
```
id:           'regular-customer-bonus'
name:         'Regular Customer Bonus'
nameJP:       '常連ボーナス'
build:        'charming'
isStackable:  false
description:  'Clearing a restaurant with a Staff Warning counter of exactly 0 grants +REGULAR_CUSTOMER_BONUS_COINS coins. Does not trigger if the counter is 1 or higher at the moment of clearing.'
```

---

## Functions

### `getSkill(id: string): SkillDefinition`
- Returns the `SkillDefinition` with the matching `id`
- Throws if `id` is not found
- Pure function

### `getSkillsByBuild(build: SkillBuild): readonly SkillDefinition[]`
- Returns all skills with the matching `build` value
- Returns an empty array if no skills match
- Pure function

### `filterAvailableSkills(allSkills: readonly SkillDefinition[], acquiredIds: readonly string[]): readonly SkillDefinition[]`
- Returns skills from `allSkills` that:
  1. Are not in `acquiredIds`
  2. Have `isStackable === true` OR are not already acquired
- Used to generate valid post-restaurant skill choices and Shop offerings
- Pure function

---

## Invariants

- `SKILLS.length === 24` — exactly 12 core + 12 build-specific
- All `id` values in `SKILLS` are unique strings in kebab-case (e.g., `'tong-master'`, `'heat-sensor'`)
- No two skills share the same `id`
- Skills with `isStackable: true`: only `'extra-slot'` and `'table-extension'`
- `filterAvailableSkills` never returns a skill with a duplicate `id` to what is in `acquiredIds`, unless the skill is `isStackable`
- All numeric effect values referenced in descriptions correspond to constants defined in `data-constants.ts` — no inline magic numbers in skill definitions
- All data is `as const` (readonly at compile time)
- The `SkillDefinition` interface has no `isStarterOnly` field — starter skills are tracked via `CharacterDefinition.starterSkillId` only

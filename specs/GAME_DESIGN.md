# Game Design Document: Yakiniku Roguelike — "Solo BBQ Dungeon"

> Full game mechanics specification. Reference this document for all gameplay logic, data structures, and parameter values. Values marked **[TBD]** or **[TUNE]** are initial drafts to be adjusted during implementation.

---

## 1. Core Loop

```
Character Select
  └─▶ Restaurant starts: meat dishes are served automatically
        └─▶ Player grills meat on available slots (real-time)
              └─▶ Player eats / discards / flips meat
                    ├─▶ Game Over condition triggered → Run ends → Score displayed
                    └─▶ All dishes eaten → Restaurant Cleared
                          └─▶ Skill selection (3 random choices — always)
                                └─▶ Node? (frequency decreases each cycle)
                                      ├─▶ YES → Choose: Shop or Rest
                                      └─▶ NO  → Next restaurant directly
                                            └─▶ (repeat; difficulty increases each full cycle)
```

**Score = total number of restaurants cleared in one run.**

---

## 2. Grilling System

### 2.1 Grill Slots

- Initial slot count: **3**
- Expandable via skill: +2 per upgrade [TUNE]
- Each slot holds one piece of meat.
- Empty slots can receive a new dish from the table at any time.

### 2.2 Grilling States

Each piece of meat progresses through states over time:

```
raw (生) → rare (レア) → medium (ミディアム) → well-done (ウェルダン) → burnt (コゲ)
```

- Time per state is determined by the meat part's `grill_time` parameter.
- `well-done` is the **perfect** state for most meats.
- Eating in each state has different consequences (see Section 5).

### 2.3 Player Actions

| Action | Description | Condition |
|---|---|---|
| **Eat** | Remove meat from grill and consume | Meat is raw / rare / medium / well-done (eating raw triggers penalty; see Section 5) |
| **Discard** | Remove burnt/raw meat without eating | Always available |
| **Flip** | Resets grill timer by 50% [TUNE] | Skill unlock required (Tong Master) |

> All dishes (meat and vegetables) are served automatically to grill slots. There is no manual Order action.

### 2.4 Flip Mechanic (Skill-Unlocked)

- Unlocked via the "Tong Master" skill.
- Flipping a piece of meat resets its timer by 50% [TUNE], giving more time before burning.
- Adds a layer of active management for players who invest in this skill.

---

## 3. Restaurant System

### 3.1 Restaurant Types

| Type | JP Name | Serving Pattern | Active Penalties |
|---|---|---|---|
| Chain | チェーン店 | Steady, slow intervals | Table overflow only |
| Local | 個人店 | Slightly irregular, medium volume | + Staff warning |
| High-End | 高級店 | Batched, high-rank meats | + Grill fire |
| Boss | ボス店舗 | Rapid, random timing | + Raw meat paralysis |

### 3.2 Dishes Per Restaurant [TUNE]

| Type | Total dishes served |
|---|---|
| Chain | 8 |
| Local | 12 |
| High-End | 10 |
| Boss | 15 |

### 3.3 Serving Speed [TUNE]

- Base interval between dishes: **8 seconds** (Chain)
- Each restaurant type reduces interval: Local 6s / High-End 5s / Boss 3s
- Per-cycle speed increase: −0.5s per cycle, floor at −1s total (capped at cycle 3)

### 3.4 Table Overflow

- Table holds a maximum of **5 dishes** waiting to be grilled [TUNE].
- Expandable via skill.
- If a new dish arrives and the table is full → **Game Over**.

---

## 4. Meat Data

### 4.1 Ranks

| Rank | JP | Unlocks at |
|---|---|---|
| Common | 並 | Chain (from start) |
| Upper | 上 | Local restaurant |
| Premium | 特上 | High-End restaurant |
| Elite | 極 | Boss restaurant |

### 4.2 Meat Parts (11 total)

All numeric values are relative units. `grill_time` = turns/seconds until state advances. `flare_risk` = probability of accelerating to burnt. `sweet_spot` = width of the well-done window (wider = more forgiving).

| Rank | Part | JP | grill_time | flare_risk | sweet_spot |
|---|---|---|---|---|---|
| Common | Kalbi | カルビ | Medium | High | Medium |
| Common | Beef Tongue | 牛タン | Short | Low | Narrow |
| Common | Harami | ハラミ | Medium | Medium | Wide |
| Upper | Upper Kalbi | 上カルビ | Medium | High | Medium |
| Upper | Thick Tongue | 厚切りタン | Long | Low | Narrow |
| Upper | Loin | ロース | Medium | Medium | Wide |
| Premium | Special Kalbi | 特上カルビ | Medium | Very High | Medium |
| Premium | Zabuton | ザブトン | Long | High | Narrow |
| Premium | Misuji | ミスジ | Short | Low | Very Wide |
| Elite | Chateaubriand | シャトーブリアン | Very Long | Medium | Very Narrow |
| Elite | Ichibo | イチボ | Long | Low | Narrow |

> **Numeric calibration [TUNE]:** Short=3s, Medium=5s, Long=8s, Very Long=12s. flare_risk: Low=5%, Medium=20%, High=40%, Very High=60%. sweet_spot: Narrow=1s, Medium=2s, Wide=3s, Very Wide=4s. All dishes are served at a fixed interval per restaurant type (see Section 3.3); there is no per-item order delay.

> **flare_risk behaviour:** When triggered (checked each second [TUNE]), the meat's progression to the *next* grilling state is accelerated — the remaining time in the current state is halved [TUNE]. It does NOT jump directly to burnt. Multiple triggers can stack. Heat Sensor's warning fires when flare_risk triggers within the final state before burnt.

---

## 4b. Side Menu Data

Vegetables are available in **all restaurants regardless of tier**. They are served automatically alongside meat dishes. They use the same grill slots and grilling state progression as meat.

### 4b.1 Side Dish Rules

- Served automatically to all players; only Vegan Tashiro earns coins from eating them.
- Non-Vegan characters: eating vegetables is **neutral** (no coins, no penalty).
- Vegetables have **no flare_risk** (they do not flare up).
- Vegetables **do not** count toward the restaurant's required dish count — they are bonus items mixed into the serving queue.

### 4b.2 Vegetable Parts (2 total)

| Part | JP | grill_time | flare_risk | sweet_spot |
|---|---|---|---|---|
| Green Pepper | ピーマン | Short | None | Wide |
| Eggplant | なす | Medium | None | Wide |

---

## 4c. Vegan Tashiro: Meat Exchange Mechanic

When a meat dish is served to Vegan Tashiro's grill slot, the player can exchange it for a vegetable using one of two methods:

| Method | Cost | Result |
|---|---|---|
| **Instant Exchange** | Spend coins [TBD] | Meat is immediately replaced by a random vegetable |
| **Delayed Exchange** | No coin cost | Grill slot is occupied for [TBD] seconds while the exchange processes; vegetable arrives after delay |

**Design intent:**
- When coins are plentiful → use Instant Exchange to maintain throughput
- When coins are scarce → use Delayed Exchange and manage timing carefully
- Exchange is always available (no failure state), eliminating run-based luck dependency

**If the player does not exchange:**
- Meat remains on the grill and progresses normally
- Eating it triggers Staff Warning +2 (character-specific penalty)
- Discarding it triggers normal Discard Loss penalty (Staff Warning +1)

---

## 5. Penalty System

### 5.1 Penalty Types

| Penalty | Trigger | Effect | Mitigation skill |
|---|---|---|---|
| 🩸 Raw Meat | Eating raw meat | Temporary action disable (3s) [TUNE] | Raw Tolerance |
| ⚫ Burnt Smoke | Burnt meat on grill | Grill visibility reduced for next dish | Heat Sensor (prevents by giving early warning; no direct cure) |
| 💸 Discard Loss | Discarding a dish | Staff Warning counter +1 | Tare Conversion |
| 😰 Staff Warning | Warning counter reaches 3 (stacks at 5) | Processing speed debuff: −20% at 3, −40% at 5 [TUNE] | Charming Personality |
| 🔥 Grill Fire | Burnt meat left too long | Grill slot disabled for 10s [TUNE] | Fire Control |

### 5.2 Staff Warning Counter

- Resets to 0 at Rest nodes.
- At count 3: Staff Warning debuff activates (−20% processing speed).
- At count 5: debuff stacks (−40% speed) [TUNE].
- With Charming Personality: first debuff threshold shifts to 5; stacked debuff threshold shifts to 7 [TUNE].
- Does NOT directly cause game over (removes the "instant death" feel).

---

## 6. Game Over Conditions

Staged unlock: players learn one condition at a time.

| Priority | Condition | Trigger | Active from |
|---|---|---|---|
| 1 | 🍽️ Table overflow | Unserved dishes > table limit | Start |
| 2 | 🔥 Grill fire escalation | Grill fire left unattended > 15s [TUNE] | High-End restaurant |
| 3 | 🤢 Raw paralysis overflow | Action disabled → table overflows | Boss restaurant |
| — | 🔥 Raw Food Advocate: instant burn | Burning any meat → immediate game over | Always active (character-specific; ignores staged unlock) |

---

## 7. Difficulty Scaling (Endless Cycles)

Each full cycle (Chain → Local → High-End → Boss) completed increases difficulty.

| Factor | Change per cycle | Cap |
|---|---|---|
| Grill timing strictness | sweet_spot −0.3s | Cycle 5 |
| Penalty weight | +10% severity | Cycle 5 |
| Serving speed | −0.5s interval | Cycle 3 |

---

## 8. Node System

### 8.1 Node Frequency

| Cycle | Node appears after every… |
|---|---|
| 1 | 1 restaurant |
| 2 | 2 restaurants |
| 3+ | 3 restaurants (fixed floor) |

### 8.2 Node Types

**Rest (休憩)**
- Clears all active debuffs (smoke, raw paralysis, speed debuff).
- Resets Staff Warning counter to 0.

**Shop (ショップ)**
- Spend coins to buy skills or consumable items.
- Skill offered: 3 random choices from available pool.
- Consumables: single-use items (e.g., "Extra Tare" → clears 1 warning).

---

## 9. Skill List (Draft)

Organized by build archetype. All effects are [TUNE].

> **Build archetypes** (5 total): Raw Rush, Precision, Burnt Exploit, Binge, Charming. Volume and Speed are **skill categories** within Core Skills — they support any build rather than defining one, and do not have a dedicated build identity. Their coin-generating skills are available to all builds.

### 9.1 Core Skills (available to all)

| Skill | Effect | Build |
|---|---|---|
| Tong Master | Unlocks Flip action; flipping resets the meat's grill timer by 50% [TUNE], buying more time before burning | Precision |
| Heat Sensor | Visual indicator shows 2s warning before burning | Precision |
| Extra Slot | +2 grill slots | Volume |
| Table Extension | +3 table capacity | Volume |
| **Slot Efficiency Bonus** | Each time all grill slots are occupied simultaneously, earn +[TBD] coins | Volume |
| Speed Eater | Eating action time −30% | Speed |
| Quick Order | Serving interval reduced by 1s [TUNE] for the current restaurant (more dishes arrive faster — useful for high-throughput builds) | Speed |
| **Quick Turnover Bonus** | Clearing a restaurant with dishes-per-minute above threshold earns +[TBD] coins [TUNE] | Speed |
| Discard Pro | Discarding does not increment Staff Warning; if Tare Conversion is also held, coin effect still applies (effects are complementary, not redundant) | Stability |
| Charming Personality | Staff Warning first debuff threshold raised to 5; stacked debuff threshold raised to 7 [TUNE] | Stability |
| Fire Control | Grill fire duration halved; fire auto-extinguishes after 5s [TUNE] | Stability |
| **Exchange Discount** | Instant Exchange coin cost −30% [TUNE] (Vegan Tashiro starter; available in pool for all characters) | Vegan |

### 9.2 Build-Specific Skills

| Skill | Effect | Build |
|---|---|---|
| Raw Tolerance | Raw meat penalty duration −70% | Raw Rush |
| Iron Stomach | Raw meat penalty fully negated | Raw Rush (advanced) |
| **Fast Eater's Wage** | Eating meat in rare state grants +[TBD] coins | Raw Rush |
| Tare Conversion | Discarding any meat grants +[TBD] coins and does NOT increment Staff Warning | Burnt Exploit |
| Char Bonus | Discarding burnt meat grants +[TBD] coins and does NOT increment Staff Warning (works standalone; if Tare Conversion is also held, both effects apply and coin rewards stack for burnt discards) | Burnt Exploit |
| **Perfect Grill Bonus** | Eating meat in well-done state grants +[TBD] coins | Precision |
| Binge Mode | Eating 5 dishes in a row activates coin value ×2 for next dish | Binge |
| Digestive Pro | Resets binge counter faster | Binge |
| **Eating Streak Bonus** | Every 5 consecutive pieces eaten grants +[TBD] coins | Binge |
| Regular Customer | Staff Warning counter decreases by 1 per restaurant cleared | Charming |
| VIP Status | Staff Warning debuff replaced with a small speed buff | Charming (advanced) |
| **Regular Customer Bonus** | Clearing a restaurant with 0 Staff Warnings grants +[TBD] coins | Charming |

### 9.3 Character Starter Skills

| Character | Starter Skill |
|---|---|
| Salaryman Tanaka | Discard Pro |
| Gourmet Critic | Heat Sensor |
| Competitive Eater | Speed Eater |
| Raw Food Advocate | Iron Stomach (but: burnt meat = instant game over) |
| Vegan Tashiro | Exchange Discount (Instant Exchange coin cost −30%; eating meat = Staff Warning +2) |

---

## 10. Coin Economy

### 10.1 Base Income (all builds, no skill required)

| Event | Coins earned |
|---|---|
| Restaurant cleared | +10 [TUNE] |

Base income is fixed and equal for all builds. It ensures every player can access the Shop regardless of build or playstyle.

### 10.2 Build-Specific Income (skill required)

Each build has 1–2 dedicated coin-generating skills in the skill pool. These skills trigger on actions that are natural to that build's playstyle.

| Build | Skill | Trigger | Coins |
|---|---|---|---|
| 🩸 Raw Rush | **Fast Eater's Wage** | Eating meat in rare state | +[TBD] per piece |
| 🔥 Precision | **Perfect Grill Bonus** | Eating meat in well-done state | +[TBD] per piece |
| ♻️ Burnt Exploit | **Tare Conversion** | Discarding any meat (grants coins, suppresses Staff Warning) | +[TBD] per discard |
| ♻️ Burnt Exploit | **Char Bonus** | Discarding burnt meat specifically (stacks with Tare Conversion if held) | +[TBD] per burnt discard |
| 😤 Binge | **Eating Streak Bonus** | Every 5 consecutive pieces eaten | +[TBD] |
| 😎 Charming | **Regular Customer Bonus** | Clearing a restaurant with 0 Staff Warnings | +[TBD] |
| 🥦 Vegan Tashiro | *(character trait — no skill required)* | Eating any vegetable | ×3 coin value per vegetable dish |
| 🌐 All builds | **Slot Efficiency Bonus** | All grill slots occupied simultaneously (Volume skill) | +[TBD] |
| 🌐 All builds | **Quick Turnover Bonus** | Clearing restaurant above dishes-per-minute threshold (Speed skill) | +[TBD] |

> All coin amounts are [TUNE]. Target: with a matching build skill active, total coins per restaurant should be roughly 1.5–2× the base income. [TUNE]

### 10.3 Shop Costs [TUNE]

| Shop item | Cost |
|---|---|
| Random skill (3 choices) | 20 coins |
| Specific consumable | 10 coins |

---

## 11. Characters

> **"Clear a run"** means defeating the Boss restaurant of Cycle 4, which triggers the True Ending. This is the unlock condition for all locked characters.

### Balanced
**Salaryman Tanaka (サラリーマン田中)**
- Unlock: available from start
- Starter skill: Discard Pro
- No stat bonuses or penalties
- All meat ranks earn coins normally (no coin value modifiers)
- Recommended for first-time players

### Specialist
**Gourmet Critic (グルメ評論家)**
- Unlock: clear a run with Salaryman Tanaka
- Starter skill: Heat Sensor
- Elite and Premium meats: sweet_spot +1s (more forgiving)
- Upper meat: neutral (no bonus, no penalty)
- Common meat eaten: coin value −50% (eating cheap cuts feels beneath them)

**Competitive Eater (大食い選手)**
- Unlock: clear a run with Salaryman Tanaka
- Starter skill: Speed Eater
- Eating action time −50% (character-specific value; overrides Speed Eater's −30% — does not stack)
- Grill timing window slightly narrower (harder to hit well-done)

### Peaky
**Raw Food Advocate (生食主義者)**
- Unlock: clear a run with any Specialist character
- Starter skill: Iron Stomach (raw penalty negated)
- Burning a piece of meat → **immediate game over** *(character-specific rule; active from the start regardless of staged unlock)*
- Extremely high throughput when played correctly

**Vegan Tashiro (ヴィーガン田代)**
- Unlock: clear a run with any Specialist character
- Starter skill: **Exchange Discount** (Instant Exchange coin cost −30% [TUNE])
- Vegetables: coin value ×3
- Eating any meat → Staff Warning counter +2 (character-specific penalty)
- When a meat dish arrives: choose Instant Exchange (coins) or Delayed Exchange (time) to replace it with a vegetable
- Not exchanging: meat remains on grill and progresses normally; eating it triggers Staff Warning +2; discarding it triggers Discard Loss (Staff Warning +1); leaving it to burn applies standard Grill Fire/Discard penalties
- Stage-independent: vegetables are served in all restaurants, so coin income is consistent throughout the run

---

## 12. Meat Catalog (図鑑)

- Unlocked per part on first successful eat.
- Each entry shows: name (JP/EN), rank, grill tips, and a humorous flavor text.
- Example flavor text for Chateaubriand: *"The pinnacle of solo BBQ. No one is watching, so you can take 10 minutes on this one."*

---

## 13. April Fools' Elements

- Game over screen shows a restaurant bill receipt instead of a typical "Game Over".
- True ending (clearing cycle 4): *"You wake up. The kalbi in front of you has gone cold."*
- Hidden command on title screen unlocks "Solo BBQ Situations" mini-encyclopedia.
- Difficulty "Omakase" mode: the restaurant staff keeps asking *"Is everything cooked?"* every 10 seconds.

---

## 14. Open Items (TBD)

| Item | Notes |
|---|---|
| Boss restaurant special rule | Differentiation from High-End beyond serving speed |
| Full shop inventory | Item types, quantities, restock rules |
| Audio / BGM | Sizzling sounds, staff voice clips |
| Animation spec | Meat color change, fire effect, smoke |
| Accessibility | Colorblind mode for grill state indicators |

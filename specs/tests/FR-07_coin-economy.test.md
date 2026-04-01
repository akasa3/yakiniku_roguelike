# Test: FR-07 Coin Economy

> t_wada TDD-style spec — defines expected behavior BEFORE implementation (Red phase).
> Source references: GAME_DESIGN.md §10, §9.1, §9.2, §4c, §11; requirements.md FR-07.

---

## Base Income

### Test: restaurant clear awards 10 coins to all characters
- **Given**: any character is playing, any restaurant type
- **When**: all required meat dishes in the restaurant have been eaten (restaurant cleared)
- **Then**: the player's coin balance increases by exactly 10 [TUNE value from GDD §10.1]

### Test: base income is equal regardless of build or playstyle
- **Given**: two different characters — e.g., Salaryman Tanaka and Raw Food Advocate — both clear the same restaurant type with no build-specific coin skills equipped
- **When**: each restaurant clear event fires
- **Then**: both characters receive the same flat +10 coins, with no multipliers or deductions applied

### Test: base income does not contribute to score
- **Given**: a player has cleared 3 restaurants and accumulated 30 base-income coins
- **When**: the run ends and the score is displayed
- **Then**: the score reads 3 (restaurants cleared), not 30 (coins), confirming coins are separate from score (GDD §10.1; requirements FR-07)

### Test: base income fires exactly once per restaurant clear, not per dish eaten
- **Given**: a restaurant has 12 dishes (Local type)
- **When**: the twelfth dish is eaten and the restaurant-cleared event fires
- **Then**: the coin counter increments by exactly 10, not 10×12 or any per-dish multiple

---

## Build-Specific Income: Fast Eater's Wage (Raw Rush)

### Test: Fast Eater's Wage grants coins when eating rare-state meat
- **Given**: the player has acquired the Fast Eater's Wage skill
- **When**: the player eats a piece of meat that is currently in the `rare` grilling state
- **Then**: coins are awarded (amount TBD [TUNE]) in addition to any other applicable bonuses

### Test: Fast Eater's Wage does NOT trigger on non-rare states
- **Given**: the player has Fast Eater's Wage
- **When**: the player eats meat in `raw`, `medium`, or `well-done` state
- **Then**: no Fast Eater's Wage coin bonus is awarded; only other applicable bonuses apply

### Test: Fast Eater's Wage does NOT trigger on vegetables
- **Given**: the player has Fast Eater's Wage
- **When**: a vegetable (Green Pepper or Eggplant) is eaten in rare state
- **Then**: no Fast Eater's Wage coin bonus is awarded (skill specifies "eating meat in rare state", GDD §9.2)

---

## Build-Specific Income: Perfect Grill Bonus (Precision)

### Test: Perfect Grill Bonus grants coins when eating well-done meat
- **Given**: the player has acquired the Perfect Grill Bonus skill
- **When**: the player eats a piece of meat that is currently in the `well-done` grilling state
- **Then**: coins are awarded (amount TBD [TUNE])

### Test: Perfect Grill Bonus does NOT trigger on states other than well-done
- **Given**: the player has Perfect Grill Bonus
- **When**: the player eats meat in `raw`, `rare`, or `medium` state
- **Then**: no Perfect Grill Bonus coin bonus is awarded

### Test: Perfect Grill Bonus does NOT trigger on vegetables
- **Given**: the player has Perfect Grill Bonus
- **When**: a vegetable is eaten in well-done state
- **Then**: no Perfect Grill Bonus coin bonus is awarded (skill specifies meat, GDD §9.2)

---

## Build-Specific Income: Tare Conversion (Burnt Exploit)

### Test: Tare Conversion grants coins on any meat discard and suppresses Staff Warning increment
- **Given**: the player has acquired Tare Conversion
- **When**: the player discards any meat piece (any state, any rank)
- **Then**: coins are awarded (amount TBD [TUNE]) AND the Staff Warning counter does NOT increment (GDD §9.2)

### Test: Tare Conversion does not trigger on vegetable discards
- **Given**: the player has Tare Conversion
- **When**: the player discards a vegetable
- **Then**: behavior is determined by vegetable-discard rules; Tare Conversion coin bonus does not apply (skill description says "Discarding any meat")

### Test: Tare Conversion and Discard Pro are complementary, not redundant
- **Given**: the player holds both Tare Conversion and Discard Pro
- **When**: the player discards meat
- **Then**: coins are still awarded (Tare Conversion effect) AND Staff Warning still does not increment (both skills' Staff Warning suppression aligns; no negative interaction) — GDD §9.1 note on Discard Pro

---

## Build-Specific Income: Char Bonus (Burnt Exploit)

### Test: Char Bonus grants coins specifically on burnt meat discards
- **Given**: the player has acquired Char Bonus
- **When**: the player discards a piece of meat that is in the `burnt` state
- **Then**: coins are awarded (amount TBD [TUNE]) and Staff Warning does NOT increment (GDD §9.2)

### Test: Char Bonus does NOT trigger on non-burnt meat discards
- **Given**: the player has Char Bonus but NOT Tare Conversion
- **When**: the player discards meat in `raw`, `rare`, `medium`, or `well-done` state
- **Then**: no Char Bonus coin award; Staff Warning increments normally (Discard Loss, GDD §5.1)

### Test: Char Bonus and Tare Conversion stack on burnt meat discards
- **Given**: the player holds both Char Bonus and Tare Conversion
- **When**: the player discards a burnt piece of meat
- **Then**: coins from BOTH skills are awarded (rewards stack for burnt discards), and Staff Warning does NOT increment (GDD §9.2: "both effects apply and coin rewards stack for burnt discards")

### Test: Char Bonus and Tare Conversion do not double-suppress Staff Warning
- **Given**: the player holds both Char Bonus and Tare Conversion
- **When**: the player discards burnt meat
- **Then**: Staff Warning counter is incremented by 0 (once suppressed is sufficient; no negative value or double-suppression edge case)

---

## Build-Specific Income: Eating Streak Bonus (Binge)

### Test: Eating Streak Bonus grants coins every 5 consecutive pieces eaten
- **Given**: the player has acquired Eating Streak Bonus
- **When**: the player eats 5 consecutive pieces of meat/vegetables without triggering a streak reset
- **Then**: coins are awarded (amount TBD [TUNE]) at the 5th consecutive eat event; the streak counter resets to 0 after the bonus fires

### Test: Eating Streak Bonus does NOT fire before 5 consecutive pieces
- **Given**: the player has Eating Streak Bonus and has eaten 4 consecutive pieces
- **When**: the player eats the 4th piece
- **Then**: no Eating Streak Bonus coin event fires; counter stays at 4

### Test: Eating Streak Bonus fires again at every multiple of 5
- **Given**: the player has Eating Streak Bonus and has accumulated 10 consecutive eats
- **When**: the 10th eat occurs
- **Then**: the bonus fires a second time (two total triggers at 5 and 10)

---

## Build-Specific Income: Regular Customer Bonus (Charming)

### Test: Regular Customer Bonus grants coins when clearing a restaurant at 0 Staff Warnings
- **Given**: the player has acquired Regular Customer Bonus; Staff Warning counter is 0 when the last dish is eaten
- **When**: the restaurant-cleared event fires
- **Then**: coins are awarded (amount TBD [TUNE])

### Test: Regular Customer Bonus does NOT fire if Staff Warning counter is 1 or above at clear
- **Given**: the player has Regular Customer Bonus; Staff Warning counter is 1 when the last dish is eaten
- **When**: the restaurant-cleared event fires
- **Then**: no Regular Customer Bonus coin event fires

### Test: Regular Customer Bonus fires independently of base income
- **Given**: the player has Regular Customer Bonus and clears a restaurant with 0 warnings
- **When**: the restaurant-cleared event fires
- **Then**: both +10 base coins AND the Regular Customer Bonus coins are awarded (they are additive)

---

## Build-Specific Income: Slot Efficiency Bonus (Volume, all builds)

### Test: Slot Efficiency Bonus triggers when all grill slots are simultaneously occupied
- **Given**: the player has acquired Slot Efficiency Bonus; the current grill slot count is 3
- **When**: the third slot becomes occupied (all slots now full simultaneously)
- **Then**: coins are awarded (amount TBD [TUNE]) (GDD §9.1)

### Test: Slot Efficiency Bonus does NOT trigger when fewer than all slots are occupied
- **Given**: the player has Slot Efficiency Bonus; 2 of 3 slots are occupied
- **When**: no further slot fills occur
- **Then**: no Slot Efficiency Bonus coin event fires

### Test: Slot Efficiency Bonus threshold scales with Extra Slot upgrades
- **Given**: the player has both Slot Efficiency Bonus and Extra Slot (+2 slots, total 5)
- **When**: all 5 slots become simultaneously occupied
- **Then**: the bonus fires; it does NOT fire when only 3 of 5 are occupied (threshold = current total slots)

---

## Build-Specific Income: Quick Turnover Bonus (Speed, all builds)

### Test: Quick Turnover Bonus triggers when restaurant is cleared above the DPM threshold
- **Given**: the player has acquired Quick Turnover Bonus; dishes-per-minute rate during the run exceeds the defined threshold [TUNE]
- **When**: the restaurant-cleared event fires
- **Then**: coins are awarded (amount TBD [TUNE]) (GDD §9.1)

### Test: Quick Turnover Bonus does NOT trigger when clearing below the DPM threshold
- **Given**: the player has Quick Turnover Bonus; the dishes-per-minute rate during the run is below the threshold
- **When**: the restaurant-cleared event fires
- **Then**: no Quick Turnover Bonus coin event fires; only base income (+10) is awarded

---

## Vegan Tashiro: Vegetable ×3 Coins

### Test: Vegan Tashiro earns coins from eating vegetables at ×3 value
- **Given**: character is Vegan Tashiro; a vegetable (Green Pepper or Eggplant) is eaten
- **When**: the eat action completes successfully
- **Then**: coins are awarded equal to the vegetable dish's base coin value multiplied by 3 (GDD §10.2, §11)

### Test: non-Vegan characters receive no coins from eating vegetables
- **Given**: character is any character other than Vegan Tashiro; a vegetable is eaten
- **When**: the eat action completes
- **Then**: 0 coins are awarded for the vegetable eat (eating is "neutral", GDD §4b.1)

### Test: Vegan Tashiro vegetable coin income is consistent across all restaurant types
- **Given**: Vegan Tashiro is playing; vegetables are served in Chain, Local, High-End, and Boss restaurants (GDD §4b: "all restaurants regardless of tier")
- **When**: a vegetable is eaten in each restaurant type
- **Then**: ×3 coin value applies in all four restaurant types; there is no restaurant-tier restriction on the vegetable coin bonus

### Test: Vegan Tashiro eating meat triggers Staff Warning +2, not coins
- **Given**: character is Vegan Tashiro; a meat dish is eaten without being exchanged
- **When**: the eat action completes
- **Then**: Staff Warning counter increases by 2 (not 1), and NO build-specific coin bonus for the meat eat is awarded (GDD §4c, §11)

---

## Exchange Discount (Vegan Build)

### Test: Exchange Discount reduces Instant Exchange cost by 30%
- **Given**: the player has the Exchange Discount skill (Vegan Tashiro starter, or acquired from pool)
- **When**: Instant Exchange is used to replace a meat dish with a vegetable
- **Then**: the coin cost of the exchange is reduced by 30% [TUNE] compared to the base Instant Exchange cost (GDD §9.1, §11)

### Test: Exchange Discount does NOT affect Delayed Exchange
- **Given**: the player has Exchange Discount
- **When**: Delayed Exchange is used (no coin cost by design, GDD §4c)
- **Then**: no coin cost is charged; Exchange Discount has no additional effect on a zero-cost action

### Test: Exchange Discount is available to all characters from the skill pool
- **Given**: any character other than Vegan Tashiro is playing
- **When**: the Exchange Discount skill appears in a post-restaurant skill pick or Shop
- **Then**: the character can acquire it; Instant Exchange coin cost is reduced by 30% (GDD §9.1: "available in pool for all characters")

---

## Shop Costs

### Test: purchasing a skill from the Shop costs exactly 20 coins
- **Given**: the player is at a Shop node with at least 20 coins
- **When**: the player selects one of the 3 random skill choices and confirms purchase
- **Then**: 20 coins are deducted from the player's balance; the skill is added to their skill list (GDD §10.3)

### Test: purchasing a consumable from the Shop costs exactly 10 coins
- **Given**: the player is at a Shop node with at least 10 coins
- **When**: the player selects a specific consumable and confirms purchase
- **Then**: 10 coins are deducted from the player's balance; the consumable is added to inventory (GDD §10.3)

### Test: player cannot purchase if coin balance is below the item cost
- **Given**: the player is at a Shop node with fewer than 20 coins (e.g., 15 coins)
- **When**: the player attempts to purchase a skill (cost 20)
- **Then**: the purchase is rejected; coin balance remains unchanged; a visual indicator shows insufficient funds

### Test: coin balance does not go negative after a purchase
- **Given**: the player has exactly 20 coins
- **When**: the player purchases a skill for 20 coins
- **Then**: coin balance is exactly 0; no negative balance state is possible

---

## Coins Are Separate from Score

### Test: coin accumulation has no effect on score
- **Given**: player A accumulates 200 coins in a run; player B accumulates 20 coins in the same number of restaurants
- **When**: both runs end at the same restaurant number
- **Then**: both players have the same score (restaurants cleared); coin totals are not added to or factored into the score display (requirements FR-07)

### Test: spending all coins does not reduce score
- **Given**: the player has a score of 5 (cleared 5 restaurants) and 50 coins
- **When**: the player spends all 50 coins at a Shop node
- **Then**: the score remains 5; the score counter is not affected by coin transactions

---

## Target Balance (1.5–2× Base with Build Skill)

### Test: a single active build-specific coin skill brings per-restaurant income into the 1.5–2× base range
- **Given**: the player has exactly one matching build-specific coin-generating skill; base income = 10 coins per restaurant [TUNE]
- **When**: the player clears a restaurant while naturally triggering that skill's conditions (e.g., eating majority of dishes at the matching state)
- **Then**: total coins per restaurant fall within [15, 20] coins (1.5×–2× of 10) [TUNE] — this is a balance target, not a hard cap; values outside this range should be flagged for tuning

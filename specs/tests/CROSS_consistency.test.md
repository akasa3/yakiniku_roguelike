# Test: CROSS Consistency Checks

> t_wada TDD-style spec — cross-cutting consistency verification across GAME_DESIGN.md sections and requirements.md.
> Each check compares two or more authoritative sources for the same value or rule.
> Status: PASS = values agree exactly; FAIL = values contradict; AMBIGUOUS = one or both sources are TBD/TUNE without a concrete value, or wording differs in a potentially meaningful way.

---

## Grill Time Calibration Values

### Test: Short grill_time numeric value is consistent between §4.2 and the calibration note
- **Source A**: GDD §4.2 meat table — column `grill_time` uses the label "Short" for Beef Tongue (牛タン) and Misuji (ミスジ)
- **Source B**: GDD §4.2 calibration note — `Short = 3s`
- **Result**: PASS — the label "Short" and the value 3s are defined in the same note block; no contradiction exists. Both sources are within §4.2.

### Test: Medium grill_time numeric value is consistent between §4.2 and the calibration note
- **Source A**: GDD §4.2 meat table — "Medium" used by Kalbi, Harami, Upper Kalbi, Loin, Special Kalbi
- **Source B**: GDD §4.2 calibration note — `Medium = 5s`
- **Result**: PASS — defined in the same calibration block; no contradiction.

### Test: Long grill_time numeric value is consistent between §4.2 and the calibration note
- **Source A**: GDD §4.2 meat table — "Long" used by Thick Tongue (厚切りタン), Zabuton, Ichibo (イチボ)
- **Source B**: GDD §4.2 calibration note — `Long = 8s`
- **Result**: PASS — defined in the same calibration block; no contradiction.

### Test: Very Long grill_time numeric value is consistent between §4.2 and the calibration note
- **Source A**: GDD §4.2 meat table — "Very Long" used by Chateaubriand (シャトーブリアン)
- **Source B**: GDD §4.2 calibration note — `Very Long = 12s`
- **Result**: PASS — defined in the same calibration block; no contradiction.

### Test: Vegetable grill_time labels use values defined in the §4.2 calibration table
- **Source A**: GDD §4b.2 — Green Pepper (ピーマン): `Short`; Eggplant (なす): `Medium`
- **Source B**: GDD §4.2 calibration note — Short = 3s, Medium = 5s
- **Result**: PASS — §4b.2 uses the same labels as §4.2 calibration; no separate values defined that could conflict.

---

## Flip Timer Reset Percentage

### Test: flip timer reset percentage is consistent between §2.3 (Player Actions table) and §2.4 (Flip Mechanic)
- **Source A**: GDD §2.3 Player Actions table — "Flip: Resets grill timer by **50%** [TUNE]"
- **Source B**: GDD §2.4 Flip Mechanic — "Flipping a piece of meat resets its timer by **50%** [TUNE]"
- **Result**: PASS — both sections state exactly 50% [TUNE]; values are identical.

### Test: flip timer reset percentage appears in §9.1 skill description for Tong Master
- **Source A**: GDD §2.3 and §2.4 — reset = 50%
- **Source B**: GDD §9.1 Tong Master skill — "flipping resets the meat's grill timer by **50%** [TUNE]"
- **Result**: PASS — all three locations (§2.3, §2.4, §9.1) agree on 50% [TUNE].

---

## Staff Warning Threshold

### Test: Staff Warning debuff activation threshold is consistent between §5.2 and §9.1
- **Source A**: GDD §5.2 Staff Warning Counter — "At count **3**: Staff Warning debuff activates (−20% processing speed)."
- **Source B**: GDD §9.1 Charming Personality skill — "Staff Warning first debuff threshold raised to **5**; stacked debuff threshold raised to **7** [TUNE]"
- **Note**: these are not contradictory; §5.2 defines the default threshold (3) and §9.1 describes a skill that raises it to 5. The default value of 3 is not re-stated in §9.1, but the skill implies the base threshold is lower than 5.
- **Result**: PASS — no contradiction; §5.2 default = 3, §9.1 Charming Personality raises first debuff threshold to 5, consistent with the base being 3.

### Test: Staff Warning second stack threshold and Charming Personality interaction are fully specified in §5.2 and §9.1
- **Source A**: GDD §5.2 — "At count **5**: debuff stacks (−40% speed) [TUNE]"; "With Charming Personality: first debuff threshold shifts to **5**; stacked debuff threshold shifts to **7** [TUNE]"
- **Source B**: GDD §9.1 Charming Personality — "Staff Warning first debuff threshold raised to **5**; stacked debuff threshold raised to **7** [TUNE]"
- **Fix applied (round 1)**: §5.2 fully specifies both threshold shifts when Charming Personality is active.
- **Fix applied (round 2)**: §9.1 skill description updated to mention both the first debuff threshold shift (3→5) and the stacked debuff threshold shift (5→7), matching §5.2 exactly.
- **Result**: PASS — §5.2 and §9.1 now agree on both threshold values (first debuff: 5, stacked debuff: 7). No inconsistency remains.

### Test: Staff Warning threshold in penalty table (§5.1) is consistent with §5.2 body and covers both debuff tiers
- **Source A**: GDD §5.1 Penalty Types table — "😰 Staff Warning: Warning counter reaches **3** (stacks at 5) | Processing speed debuff: **−20% at 3, −40% at 5** [TUNE]"
- **Source B**: GDD §5.2 Staff Warning Counter — "At count **3**: −20% debuff activates. At count **5**: debuff stacks to −40%."
- **Fix applied**: §5.1 table row updated to include both tiers: trigger "reaches 3 (stacks at 5)" and effect "−20% at 3, −40% at 5 [TUNE]".
- **Result**: PASS — §5.1 and §5.2 now agree on both debuff tiers (−20% at count 3, −40% at count 5).

### Test: Charming Personality §9.1 skill description covers both threshold shifts defined in §5.2
- **Source A**: GDD §5.2 — "With Charming Personality: first debuff threshold shifts to **5**; stacked debuff threshold shifts to **7** [TUNE]"
- **Source B**: GDD §9.1 Charming Personality skill entry — "Staff Warning first debuff threshold raised to **5**; stacked debuff threshold raised to **7** [TUNE]"
- **Fix applied**: §9.1 Charming Personality description updated to enumerate both threshold shifts explicitly.
- **Result**: PASS — §9.1 now fully matches §5.2; both threshold shifts are stated in both locations.

---

## Restaurant Dish Counts

### Test: Chain restaurant dish count is consistent between §3.2 and requirements FR-03
- **Source A**: GDD §3.2 — Chain: **8** dishes
- **Source B**: requirements.md FR-03 — "Dishes per restaurant: Chain=8, Local=12, High-End=10, Boss=15 [TUNE]"
- **Fix applied**: FR-03 now explicitly lists dish counts per restaurant type.
- **Result**: PASS — FR-03 value (8) matches §3.2 exactly.

### Test: Local restaurant dish count is consistent between §3.2 and requirements FR-03
- **Source A**: GDD §3.2 — Local: **12** dishes
- **Source B**: requirements.md FR-03 — Local=12
- **Fix applied**: FR-03 now explicitly lists dish counts.
- **Result**: PASS — FR-03 value (12) matches §3.2 exactly.

### Test: High-End restaurant dish count is consistent between §3.2 and requirements FR-03
- **Source A**: GDD §3.2 — High-End: **10** dishes
- **Source B**: requirements.md FR-03 — High-End=10
- **Fix applied**: FR-03 now explicitly lists dish counts.
- **Result**: PASS — FR-03 value (10) matches §3.2 exactly.

### Test: Boss restaurant dish count is consistent between §3.2 and requirements FR-03
- **Source A**: GDD §3.2 — Boss: **15** dishes
- **Source B**: requirements.md FR-03 — Boss=15
- **Fix applied**: FR-03 now explicitly lists dish counts.
- **Result**: PASS — FR-03 value (15) matches §3.2 exactly.

### Test: Serving intervals are consistent between §3.3 and requirements FR-03
- **Source A**: GDD §3.3 — "Base interval between dishes: 8s (Chain); Local 6s / High-End 5s / Boss 3s"
- **Source B**: requirements.md FR-03 — "Serving intervals: Chain=8s, Local=6s, High-End=5s, Boss=3s [TUNE]"
- **Fix applied**: FR-03 now explicitly lists serving intervals per restaurant type.
- **Result**: PASS — all four interval values match exactly across §3.3 and FR-03.

---

## Character Starter Skills

### Test: Salaryman Tanaka starter skill is consistent between §9.3 and §11
- **Source A**: GDD §9.3 Character Starter Skills table — Salaryman Tanaka: **Discard Pro**
- **Source B**: GDD §11 Salaryman Tanaka character entry — "Starter skill: **Discard Pro**"
- **Result**: PASS — both sections agree on Discard Pro.

### Test: Gourmet Critic starter skill is consistent between §9.3 and §11
- **Source A**: GDD §9.3 — Gourmet Critic: **Heat Sensor**
- **Source B**: GDD §11 Gourmet Critic character entry — "Starter skill: **Heat Sensor**"
- **Result**: PASS — both sections agree on Heat Sensor.

### Test: Competitive Eater starter skill is consistent between §9.3 and §11
- **Source A**: GDD §9.3 — Competitive Eater: **Speed Eater**
- **Source B**: GDD §11 Competitive Eater character entry — "Starter skill: **Speed Eater**"
- **Result**: PASS — both sections agree on Speed Eater.

### Test: Raw Food Advocate starter skill is consistent between §9.3 and §11
- **Source A**: GDD §9.3 — Raw Food Advocate: **Iron Stomach** (but: burnt meat = instant game over)
- **Source B**: GDD §11 Raw Food Advocate character entry — "Starter skill: **Iron Stomach** (raw penalty negated)" + "Burning a piece of meat → immediate game over"
- **Result**: PASS — both sections agree on Iron Stomach and the instant-game-over rule for burning meat.

### Test: Vegan Tashiro starter skill is consistent between §9.3 and §11
- **Source A**: GDD §9.3 — Vegan Tashiro: **Exchange Discount** (Instant Exchange coin cost −30%; eating meat = Staff Warning +2)
- **Source B**: GDD §11 Vegan Tashiro character entry — "Starter skill: **Exchange Discount** (Instant Exchange coin cost −30% [TUNE])" + "Eating any meat → Staff Warning counter +2"
- **Result**: PASS — both sections agree on Exchange Discount and the +2 Staff Warning meat-eating penalty.

---

## Game Over Conditions

### Test: Table overflow game over condition is consistent between §6 and FR-02
- **Source A**: GDD §6 — Priority 1: "🍽️ Table overflow: Unserved dishes > table limit; Active from: Start"
- **Source B**: requirements.md FR-02 — "Table overflow: Ungrilled dishes on table exceed the limit; Unlocks at: From start"
- **Result**: PASS — trigger and unlock timing are consistent. Minor wording difference ("unserved" vs "ungrilled") does not represent a semantic contradiction.

### Test: Grill fire escalation game over condition is consistent between §6 and FR-02
- **Source A**: GDD §6 — Priority 2: "🔥 Grill fire escalation: Grill fire left unattended > 15s [TUNE]; Active from: High-End restaurant"
- **Source B**: requirements.md FR-02 — "Grill fire: Burnt meat left on grill too long; Unlocks at: High-end restaurant"
- **Result**: PASS — both agree the condition unlocks at High-End restaurant. GDD §6 specifies the 15s threshold; FR-02 omits the specific duration. No contradiction.

### Test: Raw meat paralysis overflow game over condition is consistent between §6 and FR-02
- **Source A**: GDD §6 — Priority 3: "🤢 Raw paralysis overflow: Action disabled → table overflows; Active from: Boss restaurant"
- **Source B**: requirements.md FR-02 — "Raw meat paralysis: Raw meat eaten → temporary action disable → overflow; Unlocks at: Boss restaurant"
- **Result**: PASS — both agree this condition unlocks at Boss restaurant. Descriptions are consistent in mechanism.

### Test: Raw Food Advocate instant game over rule is consistent between §6 and FR-02
- **Source A**: GDD §6 — "🔥 Raw Food Advocate: instant burn: Burning any meat → immediate game over; Always active (character-specific; ignores staged unlock)"
- **Source B**: requirements.md FR-02 — "Raw Food Advocate: Grill fire: Burning any meat → immediate game over; Always active (character-specific)"
- **Result**: PASS — both agree on immediate game over when burning meat, always active, character-specific.

### Test: FR-02 and GDD §6 agree on the total number of distinct game-over conditions
- **Source A**: GDD §6 — 4 conditions listed (Table overflow, Grill fire escalation, Raw paralysis overflow, Raw Food Advocate)
- **Source B**: requirements.md FR-02 — 4 conditions listed (Table overflow, Grill fire, Raw meat paralysis, Raw Food Advocate: Grill fire)
- **Result**: PASS — both documents list exactly 4 game-over conditions; counts match.

---

## Skill Effects vs. Penalty Mitigations

### Test: Raw Tolerance's penalty mitigation is consistent between §9.2 skill list and §5.1 penalty table
- **Source A**: GDD §5.1 Penalty Types table — Raw Meat penalty, mitigation skill: "**Raw Tolerance**"
- **Source B**: GDD §9.2 Build-Specific Skills — "**Raw Tolerance**: Raw meat penalty duration −70%"
- **Result**: PASS — both reference Raw Tolerance as the mitigation; the −70% duration reduction from §9.2 is consistent with §5.1 identifying it as the mitigation skill. §5.1 does not specify the reduction amount, but no contradiction exists.

### Test: Heat Sensor's penalty mitigation role is consistent between §9.1 skill list and §5.1 penalty table
- **Source A**: GDD §5.1 — Burnt Smoke penalty, mitigation skill: "**Heat Sensor** (prevents by giving early warning; no direct cure)"
- **Source B**: GDD §9.1 Core Skills — "**Heat Sensor**: Visual indicator shows 2s warning before burning"
- **Result**: PASS — both sections describe Heat Sensor as providing an early warning rather than a direct cure. §5.1 and §9.1 are consistent.

### Test: Tare Conversion's Staff Warning suppression is consistent between §9.2 and §5.1
- **Source A**: GDD §5.1 — Discard Loss penalty, mitigation skill: "**Tare Conversion**"
- **Source B**: GDD §9.2 — "**Tare Conversion**: Discarding any meat grants +[TBD] coins and does NOT increment Staff Warning"
- **Result**: PASS — §5.1 names Tare Conversion as the mitigation for Discard Loss (Staff Warning +1); §9.2 confirms it suppresses the Staff Warning increment. Consistent.

### Test: Charming Personality's Staff Warning mitigation is consistent between §9.1 and §5.1
- **Source A**: GDD §5.1 — Staff Warning penalty, mitigation skill: "**Charming Personality**"
- **Source B**: GDD §9.1 Core Skills — "**Charming Personality**: Staff Warning first debuff threshold raised to 5; stacked debuff threshold raised to 7 [TUNE]"
- **Result**: PASS — §5.1 names Charming Personality as the mitigation for Staff Warning debuff; §9.1 describes how (raises both thresholds). Consistent.

### Test: Fire Control's grill fire mitigation is consistent between §9.1 and §5.1
- **Source A**: GDD §5.1 — Grill Fire penalty, mitigation skill: "**Fire Control**"
- **Source B**: GDD §9.1 Core Skills — "**Fire Control**: Grill fire duration halved; fire auto-extinguishes after 5s [TUNE]"
- **Result**: PASS — §5.1 names Fire Control as the mitigation; §9.1 provides the specific effect. Consistent.

---

## Vegan Tashiro Rules

### Test: Vegan Tashiro vegetable coin value multiplier is consistent across §4b.1, §10.2, and §11
- **Source A**: GDD §4b.1 Side Dish Rules — "Only Vegan Tashiro earns coins from eating them."
- **Source B**: GDD §10.2 Build-Specific Income table — Vegan Tashiro: "Eating any vegetable → ×3 coin value per vegetable dish"
- **Source C**: GDD §11 Vegan Tashiro character entry — "Vegetables: coin value ×3"
- **Result**: PASS — all three sections agree the multiplier is ×3 and applies to vegetables. §4b.1 confirms exclusivity; §10.2 and §11 confirm the ×3 value.

### Test: Vegan Tashiro meat-eating Staff Warning penalty is consistent between §4c and §11
- **Source A**: GDD §4c — "Eating it triggers Staff Warning +2 (character-specific penalty)"
- **Source B**: GDD §11 Vegan Tashiro character entry — "Eating any meat → Staff Warning counter +2 (character-specific penalty)"
- **Result**: PASS — both §4c and §11 state +2 Staff Warnings for eating meat.

### Test: Vegan Tashiro meat exchange availability is consistent between §4c and §11
- **Source A**: GDD §4c — "When a meat dish is served to Vegan Tashiro's grill slot, the player can exchange it for a vegetable"
- **Source B**: GDD §11 Vegan Tashiro character entry — "When a meat dish arrives: choose Instant Exchange (coins) or Delayed Exchange (time) to replace it with a vegetable"
- **Result**: PASS — both describe the two-method exchange system (Instant and Delayed) as available options.

### Test: Vegan Tashiro meat exchange availability relative to FR-06
- **Source A**: GDD §4c — exchange available (Instant or Delayed)
- **Source B**: requirements.md FR-01 — "Vegan Tashiro can exchange a meat dish for a vegetable via: Instant Exchange (spend coins) or Delayed Exchange (grill slot occupied for a set time)"
- **Result**: PASS — FR-01 and §4c describe the same two exchange methods. Consistent.

### Test: Vegan Tashiro starter skill (Exchange Discount) is consistent between §9.3, §11, and FR-06
- **Source A**: GDD §9.3 — Vegan Tashiro starter: Exchange Discount
- **Source B**: GDD §11 — Vegan Tashiro: "Starter skill: Exchange Discount (Instant Exchange coin cost −30% [TUNE])"
- **Source C**: requirements.md FR-06 character table — Vegan Tashiro listed as #5, no starter skill column in FR-06 table; FR-06 defers to GAME_DESIGN.md for ability details
- **Result**: PASS — §9.3 and §11 are consistent; FR-06 does not specify starter skills in its table and correctly defers to GDD.

### Test: consequence of NOT exchanging meat is consistent between §4c and §11
- **Source A**: GDD §4c — "If the player does not exchange: Meat remains on the grill and progresses normally; Eating it triggers Staff Warning +2; Discarding it triggers normal Discard Loss penalty (Staff Warning +1)"
- **Source B**: GDD §11 Vegan Tashiro entry — "Not exchanging: meat remains on grill and progresses normally; eating it triggers Staff Warning +2; discarding it triggers Discard Loss (Staff Warning +1); leaving it to burn applies standard Grill Fire/Discard penalties"
- **Fix applied**: §11 now enumerates all three non-exchange branches (eat, discard, burn) explicitly, matching §4c's detail level and adding the burn path.
- **Result**: PASS — §4c and §11 now agree on all enumerated branches. §11 adds the burn path not present in §4c, which is complementary rather than contradictory. Implementation should treat both sections as authoritative; the burn path in §11 extends §4c without contradiction.

---

## Node Types

### Test: Rest node description is consistent between §8.2 and FR-04
- **Source A**: GDD §8.2 Rest node — "Clears all active debuffs (smoke, raw paralysis, speed debuff). Resets Staff Warning counter to 0."
- **Source B**: requirements.md FR-04 — "Rest: resets all active debuffs and staff warning counter."
- **Result**: PASS — both describe Rest as resetting debuffs and the Staff Warning counter. GDD §8.2 enumerates specific debuff types; FR-04 uses a general description. No contradiction.

### Test: Shop node description is consistent between §8.2 and FR-04
- **Source A**: GDD §8.2 Shop node — "Spend coins to buy skills or consumable items. Skill offered: 3 random choices from available pool. Consumables: single-use items."
- **Source B**: requirements.md FR-04 — "Shop: spend coins to purchase skills or consumable items."
- **Result**: PASS — both describe spending coins for skills or consumables. GDD §8.2 adds implementation detail (3 random skill choices) not present in FR-04, but no contradiction.

### Test: node type count is consistent between §8.2 and FR-04
- **Source A**: GDD §8.2 — 2 node types defined: Rest, Shop
- **Source B**: requirements.md FR-04 — 2 node types listed: Shop, Rest
- **Result**: PASS — both list exactly 2 node types (Rest and Shop).

### Test: node frequency schedule is consistent between §8.1 and FR-04
- **Source A**: GDD §8.1 Node Frequency table — Cycle 1: every 1 restaurant; Cycle 2: every 2 restaurants; Cycle 3+: every 3 restaurants (fixed floor)
- **Source B**: requirements.md FR-04 — "Cycle 1: node after every restaurant; Cycle 2: node after every 2 restaurants; Cycle 3+: node after every 3 restaurants (fixed floor)"
- **Result**: PASS — frequency schedules are word-for-word identical across §8.1 and FR-04.

---

## Additional Cross-Cutting Observations

### Test: "clearing the game" definition is consistent between §11 and FR-06
- **Source A**: GDD §11 (opening note) — "'Clear a run' means defeating the Boss restaurant of Cycle 4, which triggers the True Ending."
- **Source B**: requirements.md FR-06 — "'Clearing the game' = defeating the Boss restaurant of Cycle 4 (triggers the True Ending)."
- **Result**: PASS — both define clearing the game as defeating Cycle 4's Boss restaurant. Wording is nearly identical.

### Test: Discard Pro and Tare Conversion interaction is described consistently between §9.1 and §9.2
- **Source A**: GDD §9.1 Discard Pro — "if Tare Conversion is also held, coin effect still applies (effects are complementary, not redundant)"
- **Source B**: GDD §9.2 Tare Conversion — "Discarding any meat grants +[TBD] coins and does NOT increment Staff Warning"
- **Note**: §9.1 asserts the coin effect of Tare Conversion still applies when Discard Pro is held. §9.2 does not address the interaction, but does not contradict it. The descriptions are complementary.
- **Result**: PASS — no contradiction; the interaction note in §9.1 is consistent with the standalone behavior of Tare Conversion in §9.2.

### Test: Char Bonus standalone vs. stacking behavior is consistent between §9.2 skill entry and §10.2 income table
- **Source A**: GDD §9.2 Char Bonus — "Discarding burnt meat grants +[TBD] coins and does NOT increment Staff Warning (works standalone; if Tare Conversion is also held, both effects apply and coin rewards stack for burnt discards)"
- **Source B**: GDD §10.2 Build-Specific Income table — lists Tare Conversion (any discard) and Char Bonus (burnt discard specifically) as separate entries with separate coin amounts; "stacks with Tare Conversion if held"
- **Result**: PASS — both §9.2 and §10.2 describe the same stacking behavior; coin amounts are TBD but the stacking rule is consistent.

### Test: difficulty scaling cap values are internally consistent between §7 and §3.3
- **Source A**: GDD §3.3 serving speed increase — "Per-cycle speed increase: −0.5s per cycle, floor at −1s total (capped at cycle 3)"
- **Source B**: GDD §7 Difficulty Scaling table — "Serving speed: −0.5s interval per cycle; Cap: Cycle 3"
- **Result**: PASS — both §3.3 and §7 agree: −0.5s per cycle, capped at Cycle 3.

### Test: grill timing (sweet_spot) difficulty scaling cap is only stated in §7, not §4
- **Source A**: GDD §7 — "Grill timing strictness: sweet_spot −0.3s per cycle; Cap: Cycle 5"
- **Source B**: GDD §4.2 sweet_spot calibration — defines Narrow=1s, Medium=2s, Wide=3s, Very Wide=4s; no per-cycle reduction mentioned in §4
- **Note**: §4.2 gives base values; §7 gives the per-cycle delta. There is no contradiction, but §4 does not cross-reference §7. Implementation must apply the §7 scaling on top of §4 base values.
- **Result**: PASS (no contradiction) — but flag for implementation: §4.2 sweet_spot values are base values only; §7 −0.3s/cycle reduction must be applied on top.

### Test: requirements.md FR-09 duplicate sentence is resolved
- **Source A**: requirements.md FR-09 — "Character unlocks persist across runs (stored in localStorage)."
- **Fix applied**: The duplicate line has been removed; this sentence now appears exactly once in FR-09.
- **Result**: PASS — FR-09 no longer contains the duplicate line. Four distinct statements remain: score definition, high score persistence, per-run state reset, and character unlock persistence.

---

## Final Sweep — Current State After All Fixes

All previous AMBIGUOUS items have been resolved by the two fixes applied in the latest round:

1. **§5.1 Staff Warning table stacked tier** — Fix added "Warning counter reaches 3 (stacks at 5)" as the trigger and "−20% at 3, −40% at 5 [TUNE]" as the effect to the §5.1 penalty table row. Both debuff tiers are now present in §5.1, matching §5.2 exactly. Previously AMBIGUOUS; now PASS.

2. **§9.1 Charming Personality missing stacked threshold** — Fix updated the §9.1 skill description to read "Staff Warning first debuff threshold raised to 5; stacked debuff threshold raised to 7 [TUNE]", explicitly covering both threshold shifts. §9.1 now matches §5.2 in full. Previously AMBIGUOUS; now PASS.

**No remaining FAIL or AMBIGUOUS items.** All tests in this document are PASS.

**Final new-inconsistency sweep (post-fix):**

- §5.1, §5.2, and §9.1 now form a consistent triangle: §5.1 states both debuff tiers (−20% at 3, −40% at 5); §5.2 defines both tiers and both Charming Personality shifts (first debuff→5, stacked→7); §9.1 Charming Personality lists both shifts. No contradiction anywhere in this triangle.
- No other sections reference the Staff Warning threshold values numerically; no new downstream inconsistencies introduced.
- The §5.1 Charming Personality mitigation skill column correctly names the skill without specifying thresholds, so no update was needed there.
- All other previously-PASS tests are unaffected by the two fixes.

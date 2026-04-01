# Test: FR-05 Skill System

Reference: GAME_DESIGN.md §9, §10, requirements.md FR-05

---

## Skill Acquisition — Post-Restaurant Selection

### Test: exactly 3 skill choices are offered after every restaurant clear
- **Given**: the player has cleared any restaurant
- **When**: the post-restaurant skill selection screen appears
- **Then**: exactly 3 skill choices are displayed, always (not conditional on node availability)

### Test: skill choices do not include skills the player already owns
- **Given**: the player already owns Heat Sensor and Tong Master
- **When**: the post-restaurant skill selection screen appears
- **Then**: neither Heat Sensor nor Tong Master appears among the 3 choices

### Test: player must select exactly 1 skill from the 3 choices
- **Given**: the player is on the post-restaurant skill selection screen
- **When**: the player selects one of the 3 choices and confirms
- **Then**: that skill is added to the player's skill set and the selection screen closes

### Test: player cannot skip skill selection (selection is mandatory)
- **Given**: the player is on the post-restaurant skill selection screen
- **When**: the player attempts to close or skip without selecting
- **Then**: the screen remains open and the game does not proceed

### Test: skill selection occurs before the node choice is presented
- **Given**: the player has cleared a restaurant in a cycle/position where a node will appear
- **When**: the restaurant-clear transition runs
- **Then**: the skill selection screen is shown first; only after a skill is chosen does the node screen (if applicable) appear

---

## Skill Acquisition — Shop Purchase

### Test: skill purchased from Shop is immediately added to the player's skill set
- **Given**: the player is in a Shop node with at least 20 coins
- **When**: the player purchases a skill from the 3 offered choices
- **Then**: the skill is added to the player's active skill set and its effects apply from the next applicable action

### Test: purchasing the same skill twice is not possible
- **Given**: the player already owns Tong Master (acquired post-restaurant)
- **When**: the player visits a Shop node
- **Then**: Tong Master does not appear among the Shop's 3 skill choices

---

## Core Skills — Tong Master

### Test: Flip action is not available without Tong Master
- **Given**: the player does not own Tong Master
- **When**: a piece of meat is on a grill slot
- **Then**: the Flip action button is not shown or is disabled for that slot

### Test: Flip action becomes available after acquiring Tong Master
- **Given**: the player acquires Tong Master
- **When**: a piece of meat is on a grill slot
- **Then**: the Flip action button is shown and enabled for that slot

### Test: Flip resets the meat's grill timer by 50%
- **Given**: the player owns Tong Master and a piece of meat has 2s remaining in its current grill state
- **When**: the player flips the meat
- **Then**: the remaining time in the current state is reset to 50% of the full state duration (not 50% of the remaining 2s — the timer resets to half the total state time) [TUNE: exact reset behavior]

### Test: Flip can be used multiple times on the same piece of meat
- **Given**: the player owns Tong Master and has flipped a piece of meat once
- **When**: the meat approaches the end of its current grill state again
- **Then**: the player can flip again to reset the timer a second time

---

## Core Skills — Heat Sensor

### Test: Heat Sensor shows a visual warning 2 seconds before burning
- **Given**: the player owns Heat Sensor and a piece of meat is in the final state before burnt
- **When**: the meat has 2s remaining before transitioning to burnt
- **Then**: a visual indicator is displayed on that grill slot warning the player

### Test: Heat Sensor warning fires when flare_risk triggers within the final pre-burnt state
- **Given**: the player owns Heat Sensor and meat is in the well-done state
- **When**: a flare_risk event triggers (remaining time in well-done is halved by flare acceleration)
- **Then**: if the resulting remaining time is ≤2s, the Heat Sensor warning activates immediately

### Test: Heat Sensor does not prevent burning — it only warns
- **Given**: the player owns Heat Sensor and the warning is active
- **When**: the player takes no action within the 2s warning window
- **Then**: the meat transitions to burnt as normal; Heat Sensor does not stop the transition

---

## Core Skills — Extra Slot

### Test: Extra Slot increases grill slot count by 2
- **Given**: the player has 3 grill slots and acquires Extra Slot
- **When**: Extra Slot is applied
- **Then**: the grill slot count becomes 5

### Test: acquiring Extra Slot a second time increases slots by another 2
- **Given**: the player has 5 grill slots (one Extra Slot already acquired) and acquires Extra Slot again
- **When**: the second Extra Slot is applied
- **Then**: the grill slot count becomes 7 [TUNE]

### Test: new grill slots are immediately available for use
- **Given**: the player acquires Extra Slot mid-run
- **When**: a new dish arrives after the acquisition
- **Then**: the dish can be placed on one of the newly added slots

---

## Core Skills — Table Extension

### Test: Table Extension increases table capacity by 3
- **Given**: the table holds a maximum of 5 dishes and the player acquires Table Extension
- **When**: Table Extension is applied
- **Then**: the table capacity becomes 8

### Test: Table Extension prevents game over that would otherwise occur from overflow
- **Given**: the table has 5 dishes waiting (at the original 5-dish limit) and the player has Table Extension (capacity now 8)
- **When**: a new dish arrives
- **Then**: the dish is added to the table (count becomes 6) and game over is NOT triggered

---

## Core Skills — Slot Efficiency Bonus

### Test: Slot Efficiency Bonus triggers when all grill slots are simultaneously occupied
- **Given**: the player owns Slot Efficiency Bonus and has 3 grill slots
- **When**: all 3 slots are occupied at the same time
- **Then**: a coin reward of +[TBD] is granted

### Test: Slot Efficiency Bonus does not trigger when only some slots are occupied
- **Given**: the player owns Slot Efficiency Bonus and has 3 grill slots, 2 of which are occupied
- **When**: no further dishes are placed immediately
- **Then**: no coin reward is granted

### Test: Slot Efficiency Bonus triggers again each time all slots become simultaneously full after a gap
- **Given**: the player owns Slot Efficiency Bonus, all slots were full (bonus triggered), then one slot was freed by eating
- **When**: a new dish fills the last empty slot again
- **Then**: the coin bonus triggers again

---

## Core Skills — Speed Eater

### Test: Speed Eater reduces eating action time by 30%
- **Given**: the base eating action duration is T seconds
- **When**: the player owns Speed Eater and eats a piece of meat
- **Then**: the eating action completes in T × 0.70 seconds

### Test: Speed Eater applies to all meat ranks and types
- **Given**: the player owns Speed Eater
- **When**: the player eats Common, Upper, Premium, and Elite meats
- **Then**: all eating actions are completed 30% faster than their baseline duration

---

## Core Skills — Quick Order

### Test: Quick Order reduces the serving interval by 1 second for the current restaurant
- **Given**: the current restaurant has a base serving interval of 6s (Local) and the player acquires Quick Order
- **When**: Quick Order is applied during an active restaurant
- **Then**: the serving interval for the remainder of that restaurant becomes 5s

### Test: Quick Order effect applies to the restaurant in which it was acquired
- **Given**: the player acquires Quick Order during a High-End restaurant (base interval 5s)
- **When**: the next dish is served in the same restaurant
- **Then**: the dish arrives 4s after the previous dish (5s − 1s reduction)

### Test: Quick Order does not reduce the interval below the speed floor
- **Given**: the serving interval is already at minimum due to cycle speed scaling
- **When**: the player acquires Quick Order
- **Then**: the interval is reduced by 1s if it is above the floor, or is clamped at the floor if the reduction would push it below [TUNE: exact floor value]

---

## Core Skills — Quick Turnover Bonus

### Test: Quick Turnover Bonus grants coins when dishes-per-minute exceeds the threshold
- **Given**: the player owns Quick Turnover Bonus and clears a restaurant with a dishes-per-minute rate above the defined threshold
- **When**: the restaurant is cleared
- **Then**: a coin reward of +[TBD] is granted in addition to the base +10 clear reward

### Test: Quick Turnover Bonus does not grant coins when dishes-per-minute is at or below the threshold
- **Given**: the player owns Quick Turnover Bonus and clears a restaurant slowly
- **When**: the dishes-per-minute rate is at or below the threshold at the time of clearing
- **Then**: no Quick Turnover Bonus coin reward is given (only the base +10 is granted)

---

## Core Skills — Discard Pro

### Test: Discard Pro prevents Staff Warning counter from incrementing on discard
- **Given**: the player owns Discard Pro and the Staff Warning counter is at 1
- **When**: the player discards a dish
- **Then**: the Staff Warning counter remains at 1 (does not become 2)

### Test: Discard Pro works for any discarded meat or vegetable
- **Given**: the player owns Discard Pro
- **When**: the player discards burnt meat, raw meat, or a vegetable
- **Then**: in all cases the Staff Warning counter does not increment

### Test: Discard Pro and Tare Conversion together — counter suppressed AND coins granted on discard
- **Given**: the player owns both Discard Pro and Tare Conversion
- **When**: the player discards any meat
- **Then**: the Staff Warning counter does NOT increment (Discard Pro) AND coins of +[TBD] are granted (Tare Conversion) — effects are complementary, not redundant

---

## Core Skills — Charming Personality

### Test: Charming Personality raises the Staff Warning debuff threshold from 3 to 5
- **Given**: the player owns Charming Personality and the Staff Warning counter is at 3
- **When**: the counter reaches 3
- **Then**: the −20% speed debuff does NOT activate (threshold has moved to 5)

### Test: Staff Warning debuff activates at count 5 when Charming Personality is held
- **Given**: the player owns Charming Personality and the counter reaches 5
- **When**: the counter hits 5
- **Then**: the speed debuff activates at count 5 instead of count 3

### Test: Charming Personality does not prevent the debuff at count 5, only delays it
- **Given**: the player owns Charming Personality
- **When**: the counter reaches 5
- **Then**: the speed debuff is applied (it is raised to 5, not removed entirely)

---

## Core Skills — Fire Control

### Test: Fire Control halves the Grill Fire slot-disable duration (10s → 5s)
- **Given**: the player owns Fire Control and a Grill Fire triggers on a slot
- **When**: the fire starts
- **Then**: the slot is disabled for 5 seconds instead of the standard 10s [TUNE]

### Test: Fire Control auto-extinguishes fire after 5 seconds
- **Given**: the player owns Fire Control and a Grill Fire is active on a slot
- **When**: 5 seconds elapse
- **Then**: the fire automatically extinguishes and the slot becomes available again

### Test: without Fire Control, Grill Fire disables the slot for the full 10 seconds
- **Given**: the player does not own Fire Control and a Grill Fire triggers
- **When**: the fire starts
- **Then**: the slot remains disabled for 10s

---

## Core Skills — Exchange Discount

### Test: Exchange Discount reduces Instant Exchange coin cost by 30%
- **Given**: the Instant Exchange base cost is C coins and the player owns Exchange Discount
- **When**: the player performs an Instant Exchange
- **Then**: C × 0.70 coins are deducted (rounded per spec convention)

### Test: Exchange Discount does not affect Delayed Exchange (no-cost method)
- **Given**: the player owns Exchange Discount
- **When**: the player performs a Delayed Exchange
- **Then**: no coins are deducted (Delayed Exchange still has no coin cost)

### Test: Exchange Discount is available in the general skill pool (not only as Vegan Tashiro's starter)
- **Given**: the player is playing as any character other than Vegan Tashiro
- **When**: the skill pool is rolled for post-restaurant selection or Shop offerings
- **Then**: Exchange Discount can appear as an option

---

## Build-Specific Skills — Raw Rush

### Test: Raw Tolerance reduces Raw Meat penalty duration by 70%
- **Given**: the base Raw Meat action-disable duration is 3s and the player owns Raw Tolerance
- **When**: the player eats raw meat
- **Then**: the action disable lasts 3s × 0.30 = 0.9s

### Test: Iron Stomach fully negates the Raw Meat penalty
- **Given**: the player owns Iron Stomach
- **When**: the player eats raw meat
- **Then**: no action disable occurs; the player can immediately perform further actions

### Test: Iron Stomach supersedes Raw Tolerance (full negation, no 0.9s disable)
- **Given**: the player owns both Raw Tolerance and Iron Stomach
- **When**: the player eats raw meat
- **Then**: the action disable is fully negated (Iron Stomach takes precedence; Raw Tolerance's 0.9s disable does not apply)

### Test: Fast Eater's Wage grants coins for eating meat in rare state
- **Given**: the player owns Fast Eater's Wage and a piece of meat is in the rare state
- **When**: the player eats the meat
- **Then**: a coin reward of +[TBD] is granted in addition to any other applicable rewards

### Test: Fast Eater's Wage does not grant coins for eating in medium or well-done state
- **Given**: the player owns Fast Eater's Wage and a piece of meat is in medium state
- **When**: the player eats the meat
- **Then**: no Fast Eater's Wage coin bonus is granted

---

## Build-Specific Skills — Burnt Exploit

### Test: Tare Conversion grants coins on discarding any meat and suppresses Staff Warning increment
- **Given**: the player owns Tare Conversion and the Staff Warning counter is at 1
- **When**: the player discards any meat (at any grill state)
- **Then**: +[TBD] coins are granted AND the Staff Warning counter remains at 1 (not incremented)

### Test: Tare Conversion does not grant coins when discarding vegetables
- **Given**: the player owns Tare Conversion
- **When**: the player discards a vegetable (Green Pepper or Eggplant)
- **Then**: no Tare Conversion coin bonus is granted (vegetable discards are neutral)

### Test: Char Bonus grants coins specifically for discarding burnt meat
- **Given**: the player owns Char Bonus and a piece of meat is in the burnt state
- **When**: the player discards the burnt meat
- **Then**: +[TBD] coins are granted AND the Staff Warning counter is not incremented

### Test: Char Bonus does not grant coins for discarding non-burnt meat
- **Given**: the player owns Char Bonus and a piece of meat is in the raw or well-done state
- **When**: the player discards the meat
- **Then**: no Char Bonus coin grant occurs

### Test: Tare Conversion and Char Bonus stack on burnt meat discards
- **Given**: the player owns both Tare Conversion and Char Bonus and discards burnt meat
- **When**: the discard action completes
- **Then**: both coin rewards apply (Tare Conversion's amount + Char Bonus's amount are both granted), and Staff Warning is not incremented

### Test: Tare Conversion alone (no Char Bonus) does not produce the Char Bonus coin reward on burnt discards
- **Given**: the player owns Tare Conversion but not Char Bonus
- **When**: the player discards burnt meat
- **Then**: only Tare Conversion's coin reward is granted (one source, not both)

---

## Build-Specific Skills — Precision

### Test: Perfect Grill Bonus grants coins for eating meat in well-done state
- **Given**: the player owns Perfect Grill Bonus and meat is in the well-done state
- **When**: the player eats the meat
- **Then**: +[TBD] coins are granted

### Test: Perfect Grill Bonus does not grant coins for eating in medium or rare state
- **Given**: the player owns Perfect Grill Bonus and meat is in medium state
- **When**: the player eats the meat
- **Then**: no Perfect Grill Bonus coin reward is granted

---

## Build-Specific Skills — Binge

### Test: Binge Mode activates coin value ×2 after eating 5 dishes in a row
- **Given**: the player owns Binge Mode and has eaten 5 dishes consecutively without any non-eat action in between
- **When**: the 5th consecutive dish is eaten
- **Then**: the next dish eaten grants coin value ×2

### Test: Binge Mode ×2 applies to the 6th dish (the one immediately after the streak)
- **Given**: the player owns Binge Mode and has just triggered the 5-in-a-row streak
- **When**: the player eats the 6th consecutive dish
- **Then**: that dish's coin value is multiplied by 2

### Test: Binge Mode streak does NOT reset after bonus — fires again via modulo
- **Given**: the player owns Binge Mode and has eaten 5 consecutive dishes (bonus triggered)
- **When**: the player eats 5 more dishes (reaching 10 consecutive eats total)
- **Then**: ×2 bonus triggers again at count 10 (counter does NOT reset — only discard resets it)

### Test: Digestive Pro reduces binge threshold to 3
- **Given**: the player owns both Binge Mode and Digestive Pro
- **When**: the player eats 3 consecutive dishes
- **Then**: ×2 bonus triggers at count 3 (instead of 5), and again at 6, 9, etc.

### Test: Eating Streak Bonus grants coins every 5 consecutive pieces eaten
- **Given**: the player owns Eating Streak Bonus
- **When**: the player eats the 5th consecutive piece (without a break in the streak)
- **Then**: +[TBD] coins are granted

### Test: Eating Streak Bonus triggers again at every subsequent multiple of 5
- **Given**: the player owns Eating Streak Bonus and has already triggered the 5-streak bonus
- **When**: the player eats 5 more consecutive pieces (total 10 in the streak)
- **Then**: the coin bonus triggers again at the 10th piece

### Test: Eating Streak Bonus streak counter resets if the eating sequence is broken
- **Given**: the player owns Eating Streak Bonus and has a streak of 4
- **When**: the player discards a dish (breaking the eating sequence)
- **Then**: the streak counter resets to 0 and must reach 5 again for the next bonus

---

## Build-Specific Skills — Charming

### Test: Regular Customer decreases Staff Warning counter by 1 per restaurant cleared
- **Given**: the player owns Regular Customer and the Staff Warning counter is at 2
- **When**: a restaurant is cleared
- **Then**: the Staff Warning counter decreases to 1

### Test: Regular Customer does not reduce the Staff Warning counter below 0
- **Given**: the player owns Regular Customer and the Staff Warning counter is at 0
- **When**: a restaurant is cleared
- **Then**: the Staff Warning counter remains at 0 (floor of 0)

### Test: Regular Customer removes the Staff Warning speed debuff when counter drops below the threshold
- **Given**: the player owns Regular Customer, the Staff Warning counter is at 3 (debuff active at −20%), and a restaurant is cleared
- **When**: the counter decreases from 3 to 2 via Regular Customer
- **Then**: the −20% speed debuff is deactivated (counter is now below the debuff threshold)

### Test: VIP Status replaces Staff Warning speed debuff with a small speed buff
- **Given**: the player owns VIP Status and the Staff Warning counter reaches the debuff threshold
- **When**: the debuff would normally activate
- **Then**: instead of the −20% speed penalty, a small positive speed buff is applied

### Test: VIP Status overrides Charming Personality threshold changes
- **Given**: the player owns both VIP Status and Charming Personality
- **When**: the Staff Warning counter reaches 5 (Charming Personality's raised threshold)
- **Then**: the speed buff from VIP Status is applied instead of a debuff

### Test: Regular Customer Bonus grants coins when a restaurant is cleared with 0 Staff Warnings
- **Given**: the player owns Regular Customer Bonus and completes a restaurant with Staff Warning counter at 0
- **When**: the restaurant is cleared
- **Then**: +[TBD] coins are granted in addition to the base +10 clear reward

### Test: Regular Customer Bonus does not trigger if Staff Warning counter is 1 or higher at clear
- **Given**: the player owns Regular Customer Bonus and the Staff Warning counter is at 1 when the restaurant is cleared
- **When**: the clear is processed
- **Then**: no Regular Customer Bonus coin reward is given

---

## Skill Interactions

### Test: Tare Conversion + Char Bonus — coin rewards stack on burnt discard
- **Given**: the player holds both Tare Conversion and Char Bonus
- **When**: burnt meat is discarded
- **Then**: coin reward = Tare Conversion amount + Char Bonus amount (additive stack), and Staff Warning counter is not incremented

### Test: Tare Conversion + Char Bonus — only Tare Conversion fires on non-burnt discard
- **Given**: the player holds both Tare Conversion and Char Bonus
- **When**: a non-burnt piece of meat is discarded (e.g., raw or well-done)
- **Then**: only Tare Conversion's coin reward is granted; Char Bonus does not fire

### Test: Discard Pro + Tare Conversion — complementary, not redundant
- **Given**: the player holds both Discard Pro and Tare Conversion
- **When**: any meat is discarded
- **Then**: Staff Warning counter is suppressed (Discard Pro) AND Tare Conversion coin reward is granted — both effects activate; there is no conflict or override

### Test: Discard Pro + Tare Conversion + Char Bonus triple stack on burnt discard
- **Given**: the player holds Discard Pro, Tare Conversion, and Char Bonus
- **When**: burnt meat is discarded
- **Then**: Staff Warning counter is not incremented, Tare Conversion coins are granted, and Char Bonus coins are granted — all three effects apply

### Test: Raw Tolerance + Iron Stomach — Iron Stomach takes full precedence
- **Given**: the player holds both Raw Tolerance and Iron Stomach
- **When**: raw meat is eaten
- **Then**: the penalty is fully negated (0s disable), not merely reduced to 0.9s

### Test: Speed Eater and Competitive Eater character bonus do not stack
- **Given**: the player is playing Competitive Eater (character eating time −50%) and acquires Speed Eater (−30%)
- **When**: the player eats a piece of meat
- **Then**: the eating time is reduced by 50% (the character's value overrides Speed Eater's −30%; they do not stack to −80%)

### Test: Regular Customer + Charming Personality interaction — counter floor enforced
- **Given**: the player holds both Regular Customer (−1 per clear) and Charming Personality (threshold raised to 5)
- **When**: the counter is at 1 and a restaurant is cleared
- **Then**: Regular Customer reduces the counter to 0; it does not go negative

---

## Edge Cases

### Test: no duplicate skills can be held (acquiring same skill twice is prevented)
- **Given**: the player owns Tong Master
- **When**: the post-restaurant skill choices or Shop offerings are generated
- **Then**: Tong Master is excluded from the offered choices

### Test: skill effects apply from the moment they are acquired (no delay to next restaurant)
- **Given**: the player acquires Speed Eater from a post-restaurant skill choice
- **When**: the next restaurant starts and the player eats a dish
- **Then**: the −30% eating time reduction is immediately in effect

### Test: skills acquired via post-restaurant selection are functionally identical to those acquired via Shop
- **Given**: the player acquires Heat Sensor via post-restaurant selection in one test and via Shop in another
- **When**: meat approaches burning in both cases
- **Then**: the 2s visual warning fires identically in both cases — acquisition source does not affect skill behavior

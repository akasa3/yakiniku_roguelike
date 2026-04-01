# Test: FR-06 Character Selection

Reference: GAME_DESIGN.md §11, §9.3, requirements.md FR-06

---

## Character Unlock Conditions

### Test: Salaryman Tanaka is available from the very start
- **Given**: a brand-new save file with no runs completed
- **When**: the character selection screen is displayed
- **Then**: Salaryman Tanaka (サラリーマン田中) is selectable

### Test: Gourmet Critic is locked until Salaryman Tanaka clears the game
- **Given**: Salaryman Tanaka has NOT yet cleared the game (no Boss restaurant of Cycle 4 defeated)
- **When**: the character selection screen is displayed
- **Then**: Gourmet Critic (グルメ評論家) is shown as locked and cannot be selected

### Test: Gourmet Critic unlocks after clearing the game with Salaryman Tanaka
- **Given**: the player defeats the Boss restaurant of Cycle 4 while playing as Salaryman Tanaka
- **When**: the character selection screen is displayed on the next run
- **Then**: Gourmet Critic is unlocked and selectable

### Test: Competitive Eater is locked until Salaryman Tanaka clears the game
- **Given**: Salaryman Tanaka has NOT yet cleared the game
- **When**: the character selection screen is displayed
- **Then**: Competitive Eater (大食い選手) is shown as locked and cannot be selected

### Test: Competitive Eater unlocks after clearing the game with Salaryman Tanaka
- **Given**: the player defeats the Boss restaurant of Cycle 4 while playing as Salaryman Tanaka
- **When**: the character selection screen is displayed on the next run
- **Then**: Competitive Eater is unlocked and selectable

### Test: both Specialist characters unlock simultaneously when Tanaka clears the game
- **Given**: the player clears the game with Salaryman Tanaka for the first time
- **When**: the character selection screen is displayed on the next run
- **Then**: both Gourmet Critic and Competitive Eater are unlocked in the same save state

### Test: Raw Food Advocate is locked until any Specialist character clears the game
- **Given**: neither Gourmet Critic nor Competitive Eater has cleared the game
- **When**: the character selection screen is displayed
- **Then**: Raw Food Advocate (生食主義者) is locked and cannot be selected

### Test: Raw Food Advocate unlocks after clearing the game with Gourmet Critic
- **Given**: the player defeats the Boss restaurant of Cycle 4 while playing as Gourmet Critic
- **When**: the character selection screen is displayed on the next run
- **Then**: Raw Food Advocate is unlocked and selectable

### Test: Raw Food Advocate unlocks after clearing the game with Competitive Eater
- **Given**: the player defeats the Boss restaurant of Cycle 4 while playing as Competitive Eater
- **When**: the character selection screen is displayed on the next run
- **Then**: Raw Food Advocate is unlocked and selectable

### Test: Vegan Tashiro is locked until any Specialist character clears the game
- **Given**: neither Gourmet Critic nor Competitive Eater has cleared the game
- **When**: the character selection screen is displayed
- **Then**: Vegan Tashiro (ヴィーガン田代) is locked and cannot be selected

### Test: Vegan Tashiro unlocks after clearing the game with any Specialist
- **Given**: the player clears the game with Gourmet Critic or Competitive Eater
- **When**: the character selection screen is displayed on the next run
- **Then**: Vegan Tashiro is unlocked and selectable

### Test: both Peaky characters unlock simultaneously when any Specialist clears the game
- **Given**: the player clears the game with Gourmet Critic for the first time
- **When**: the character selection screen is displayed on the next run
- **Then**: both Raw Food Advocate and Vegan Tashiro are unlocked in the same save state

### Test: "clearing the game" is defined as defeating the Boss restaurant of Cycle 4
- **Given**: the player defeats the Boss restaurant of Cycle 4
- **When**: the run-end sequence triggers
- **Then**: the True Ending is triggered and the appropriate character(s) are marked as unlocked in localStorage

### Test: defeating the Boss restaurant of Cycle 3 does NOT count as clearing the game
- **Given**: the player defeats the Boss restaurant of Cycle 3
- **When**: the run-end sequence triggers
- **Then**: no new character unlocks occur (Cycle 4 Boss is the requirement)

### Test: character unlock state persists across runs via localStorage
- **Given**: the player has unlocked Gourmet Critic by clearing with Tanaka
- **When**: the browser is refreshed and the character selection screen is displayed
- **Then**: Gourmet Critic remains unlocked (state is read from localStorage)

---

## Salaryman Tanaka — Balanced Character

### Test: Tanaka starts with Discard Pro as his starter skill
- **Given**: the player selects Salaryman Tanaka and starts a run
- **When**: the first restaurant begins
- **Then**: Discard Pro is already active in the player's skill set

### Test: Tanaka has no stat bonuses or penalties
- **Given**: the player is playing as Salaryman Tanaka
- **When**: any meat is grilled, eaten, or discarded
- **Then**: all base parameter values apply without modification (grill timings, eating times, coin values are all at baseline)

### Test: Tanaka earns coins normally from all meat ranks
- **Given**: the player is playing as Salaryman Tanaka and eats Common, Upper, Premium, and Elite meats
- **When**: each piece is consumed
- **Then**: the coin value for each piece is the unmodified base value (no coin multiplier bonuses or penalties for any rank)

### Test: Tanaka's Discard Pro is functionally active from restaurant 1
- **Given**: the player is playing as Salaryman Tanaka in restaurant 1 and the Staff Warning counter is at 0
- **When**: the player discards a dish
- **Then**: the Staff Warning counter remains at 0 (Discard Pro is active from the start)

---

## Gourmet Critic — Specialist Character

### Test: Gourmet Critic starts with Heat Sensor as their starter skill
- **Given**: the player selects Gourmet Critic and starts a run
- **When**: the first restaurant begins
- **Then**: Heat Sensor is already active in the player's skill set

### Test: Gourmet Critic's sweet_spot is extended by +1s for Elite meats
- **Given**: the player is playing as Gourmet Critic and an Elite-rank meat is on the grill
- **When**: the meat enters the well-done state
- **Then**: the well-done window lasts the base sweet_spot duration + 1 additional second

### Test: Gourmet Critic's sweet_spot is extended by +1s for Premium meats
- **Given**: the player is playing as Gourmet Critic and a Premium-rank meat (e.g., Special Kalbi) is on the grill
- **When**: the meat enters the well-done state
- **Then**: the well-done window lasts base sweet_spot + 1s

### Test: Gourmet Critic receives no sweet_spot modifier for Upper-rank meats
- **Given**: the player is playing as Gourmet Critic and an Upper-rank meat (e.g., Loin) is on the grill
- **When**: the meat enters the well-done state
- **Then**: the well-done window lasts the standard base sweet_spot duration (no bonus, no penalty)

### Test: Gourmet Critic receives no sweet_spot modifier for Common-rank meats
- **Given**: the player is playing as Gourmet Critic and a Common-rank meat (e.g., Kalbi) is on the grill
- **When**: the meat enters the well-done state
- **Then**: the well-done window lasts the standard base sweet_spot duration

### Test: Gourmet Critic's coin value is halved for eating Common-rank meats
- **Given**: the player is playing as Gourmet Critic and eats a Common-rank meat (Kalbi, Beef Tongue, or Harami)
- **When**: the eating action completes
- **Then**: the coin value of that piece is 50% of the normal base value

### Test: Gourmet Critic's Common meat coin penalty applies regardless of grill state
- **Given**: the player is playing as Gourmet Critic and eats Common Kalbi in the rare state
- **When**: the eating action completes
- **Then**: the coin value is 50% of the base rare-state value for that meat

### Test: Gourmet Critic does not have a coin penalty for Upper, Premium, or Elite meats
- **Given**: the player is playing as Gourmet Critic and eats Upper, Premium, and Elite meats
- **When**: each eating action completes
- **Then**: the coin values are the standard base amounts (no penalty, no bonus for non-Common meats)

---

## Competitive Eater — Specialist Character

### Test: Competitive Eater starts with Speed Eater as their starter skill
- **Given**: the player selects Competitive Eater and starts a run
- **When**: the first restaurant begins
- **Then**: Speed Eater is already active in the player's skill set

### Test: Competitive Eater's eating time is reduced by 50% (character modifier)
- **Given**: the base eating action duration is T seconds
- **When**: the player plays as Competitive Eater and eats any meat
- **Then**: the eating action completes in T × 0.50 seconds

### Test: Competitive Eater's 50% eating speed overrides Speed Eater's 30% — they do not stack
- **Given**: the player is playing as Competitive Eater (−50% eating time) and also holds the Speed Eater skill (−30%)
- **When**: the player eats a piece of meat
- **Then**: the eating time is reduced by exactly 50% (the character modifier applies; Speed Eater's −30% does not add on top)

### Test: Competitive Eater has a narrower grill timing window than the base
- **Given**: a piece of Kalbi has a base well-done sweet_spot of 2s
- **When**: the player is playing as Competitive Eater
- **Then**: the effective well-done window is shorter than 2s (exact amount [TUNE])

### Test: Competitive Eater's narrow grill window applies to all meat types
- **Given**: the player is playing as Competitive Eater and grills Common, Upper, Premium, and Elite meats
- **When**: each piece reaches the well-done state
- **Then**: each piece has a slightly narrower sweet_spot window than the standard character would experience

---

## Raw Food Advocate — Peaky Character

### Test: Raw Food Advocate starts with Iron Stomach as their starter skill
- **Given**: the player selects Raw Food Advocate and starts a run
- **When**: the first restaurant begins
- **Then**: Iron Stomach is already active in the player's skill set (raw meat penalty fully negated)

### Test: Raw Food Advocate triggers immediate game over when any meat burns
- **Given**: the player is playing as Raw Food Advocate and a piece of meat transitions to the burnt state
- **When**: the burnt transition occurs
- **Then**: game over is triggered immediately, regardless of the current restaurant type or cycle

### Test: Raw Food Advocate's burn-instant-game-over is active from restaurant 1 (ignores staged unlock)
- **Given**: the player is playing as Raw Food Advocate in the first Chain restaurant (before High-End unlocks Grill Fire for other characters)
- **When**: a piece of meat burns
- **Then**: game over triggers immediately — the staged unlock system does not delay this rule for Raw Food Advocate

### Test: Raw Food Advocate's game-over-on-burn applies to all meat ranks
- **Given**: the player is playing as Raw Food Advocate
- **When**: a Common-rank meat burns on the grill
- **Then**: game over triggers immediately (it is not limited to Premium/Elite meats)

### Test: Raw Food Advocate's Iron Stomach starter negates the raw meat action disable
- **Given**: the player is playing as Raw Food Advocate
- **When**: the player eats raw meat
- **Then**: no action disable occurs (Iron Stomach is active from the start)

### Test: Raw Food Advocate achieves extremely high throughput by eating at the raw stage
- **Given**: the player is playing as Raw Food Advocate with Iron Stomach active
- **When**: the player eats multiple pieces of meat consecutively in the raw state
- **Then**: no penalties are applied and eating proceeds without interruption (high throughput enabled)

### Test: Raw Food Advocate — vegetables do not trigger the burn instant game over
- **Given**: the player is playing as Raw Food Advocate and a vegetable (Green Pepper or Eggplant) burns on the grill
- **When**: the vegetable transitions to burnt
- **Then**: game over is NOT triggered (the rule applies to meat only; vegetables have no flare_risk and are not subject to the instant game-over rule)

---

## Vegan Tashiro — Peaky Character

### Test: Vegan Tashiro starts with Exchange Discount as their starter skill
- **Given**: the player selects Vegan Tashiro and starts a run
- **When**: the first restaurant begins
- **Then**: Exchange Discount is already active (Instant Exchange coin cost −30%)

### Test: Vegan Tashiro earns ×3 coin value for eating any vegetable
- **Given**: the player is playing as Vegan Tashiro and a vegetable (Green Pepper or Eggplant) is eaten
- **When**: the eating action completes
- **Then**: the coin earned is 3× the base vegetable coin value

### Test: Vegan Tashiro's vegetable coin bonus applies in all restaurant types
- **Given**: the player is playing as Vegan Tashiro in a Chain, Local, High-End, and Boss restaurant
- **When**: a vegetable is eaten in each restaurant type
- **Then**: the ×3 coin multiplier applies in all cases (vegetables are served in all restaurants regardless of tier)

### Test: Vegan Tashiro triggers Staff Warning +2 when eating any meat
- **Given**: the player is playing as Vegan Tashiro and the Staff Warning counter is at 0
- **When**: the player eats any meat
- **Then**: the Staff Warning counter increases by 2 (becomes 2)

### Test: Vegan Tashiro's Staff Warning +2 per meat eat can rapidly reach the debuff threshold
- **Given**: the player is playing as Vegan Tashiro and the Staff Warning counter is at 1
- **When**: the player eats one piece of meat
- **Then**: the counter becomes 3, immediately triggering the −20% speed debuff

### Test: Vegan Tashiro's +2 increment applies regardless of meat rank
- **Given**: the player is playing as Vegan Tashiro
- **When**: the player eats Common, Upper, Premium, or Elite meat
- **Then**: the Staff Warning counter increments by 2 in all cases

---

## Vegan Tashiro — Instant Exchange Mechanic

### Test: Instant Exchange option appears when a meat dish is served to Vegan Tashiro's slot
- **Given**: the player is playing as Vegan Tashiro and a meat dish arrives on a grill slot
- **When**: the meat appears on the slot
- **Then**: an "Instant Exchange" action button is available for that slot

### Test: Instant Exchange immediately replaces the meat with a random vegetable
- **Given**: the player is playing as Vegan Tashiro and selects Instant Exchange on a meat slot
- **When**: the exchange is performed
- **Then**: the meat is removed from the slot and a random vegetable (Green Pepper or Eggplant) appears in its place, starting from the raw state

### Test: Instant Exchange costs coins (base cost TBD, reduced 30% with Exchange Discount)
- **Given**: the player is playing as Vegan Tashiro with Exchange Discount active and the base Instant Exchange cost is C coins
- **When**: the player performs an Instant Exchange
- **Then**: exactly C × 0.70 coins are deducted

### Test: Instant Exchange is not available if the player has insufficient coins
- **Given**: the player is playing as Vegan Tashiro and has 0 coins
- **When**: a meat dish arrives on a grill slot
- **Then**: the Instant Exchange button is disabled or shows insufficient-funds feedback; Delayed Exchange remains available

---

## Vegan Tashiro — Delayed Exchange Mechanic

### Test: Delayed Exchange option appears when a meat dish is served to Vegan Tashiro's slot
- **Given**: the player is playing as Vegan Tashiro and a meat dish arrives on a grill slot
- **When**: the meat appears on the slot
- **Then**: a "Delayed Exchange" action button is available alongside Instant Exchange

### Test: Delayed Exchange has no coin cost
- **Given**: the player is playing as Vegan Tashiro and has 0 coins
- **When**: the player selects Delayed Exchange
- **Then**: no coins are deducted and the exchange process begins

### Test: Delayed Exchange occupies the grill slot for a set duration during processing
- **Given**: the player selects Delayed Exchange on a slot
- **When**: the exchange is in progress
- **Then**: the slot is occupied and cannot receive a new dish until the delay elapses

### Test: the vegetable arrives after the Delayed Exchange timer completes
- **Given**: the Delayed Exchange timer is [TBD] seconds
- **When**: that duration elapses
- **Then**: a random vegetable appears on the slot in the raw state, ready to grill

### Test: Delayed Exchange slot cannot be used for other meat during the exchange delay
- **Given**: a Delayed Exchange is in progress on slot 2
- **When**: a new dish arrives and all other slots are occupied
- **Then**: slot 2 is not available as a placement target; the new dish goes to the table queue

---

## Vegan Tashiro — Not Exchanging Behavior

### Test: meat that is not exchanged progresses normally through grill states
- **Given**: the player is playing as Vegan Tashiro and does not initiate an exchange on a meat dish
- **When**: time passes
- **Then**: the meat progresses through raw → rare → medium → well-done → burnt as normal

### Test: eating non-exchanged meat applies Staff Warning +2
- **Given**: the player is playing as Vegan Tashiro and eats a meat that was not exchanged
- **When**: the eating action completes
- **Then**: the Staff Warning counter increases by 2

### Test: discarding non-exchanged meat applies standard Discard Loss penalty
- **Given**: the player is playing as Vegan Tashiro and discards a meat that was not exchanged (not using Discard Pro)
- **When**: the discard action completes
- **Then**: the Staff Warning counter increases by 1 (standard Discard Loss)

### Test: non-exchanged meat that burns applies standard Grill Fire penalty
- **Given**: the player is playing as Vegan Tashiro and a non-exchanged meat burns and is left on the grill
- **When**: the Grill Fire triggers
- **Then**: the slot is disabled for 10s (standard Grill Fire; or 5s if Fire Control is held) — no special Vegan Tashiro modifier for this case

---

## Edge Cases

### Test: character selection screen shows unlock requirements for locked characters
- **Given**: a locked character (e.g., Gourmet Critic) is shown on the character selection screen
- **When**: the player views the locked entry
- **Then**: the unlock condition is displayed (e.g., "Clear a run with Salaryman Tanaka")

### Test: character unlocks are stored separately from per-run state in localStorage
- **Given**: the player has unlocked Gourmet Critic and starts a new run
- **When**: the run ends in game over and per-run state resets
- **Then**: Gourmet Critic remains unlocked (the unlock flag in localStorage is not cleared on game over)

### Test: selecting a character persists that choice through the entire run
- **Given**: the player selects Gourmet Critic at the character selection screen
- **When**: the run progresses through multiple restaurants and cycles
- **Then**: all Gourmet Critic-specific modifiers (Heat Sensor starter, sweet_spot bonus, Common meat coin penalty) remain active throughout the run

### Test: Vegan Tashiro's Exchange Discount starter does not appear again as a skill choice during the run
- **Given**: the player is playing as Vegan Tashiro (Exchange Discount is the starter skill)
- **When**: post-restaurant skill choices or Shop offerings are generated
- **Then**: Exchange Discount does not appear as a choice (already owned)

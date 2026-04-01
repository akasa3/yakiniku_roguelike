# Test: FR-04 Node System

Reference: GAME_DESIGN.md §8, requirements.md FR-04

---

## Node Frequency — Cycle 1 (every restaurant)

### Test: node appears after the first restaurant in cycle 1
- **Given**: the player is in cycle 1 and has just cleared the first restaurant (Chain)
- **When**: the restaurant-clear transition runs
- **Then**: a node choice (Shop or Rest) is presented before the next restaurant begins

### Test: node appears after every restaurant in cycle 1
- **Given**: the player is in cycle 1
- **When**: each of the 4 restaurants (Chain, Local, High-End, Boss) is cleared in sequence
- **Then**: a node is presented after each of the 4 clears — a total of 4 nodes in cycle 1

### Test: no restaurant is skipped when a node is not taken in cycle 1
- **Given**: the player is in cycle 1 and presented with a node after restaurant 1
- **When**: the player selects a node option (Shop or Rest) and completes it
- **Then**: the next restaurant (restaurant 2 of cycle 1) starts immediately afterward

---

## Node Frequency — Cycle 2 (every 2 restaurants)

### Test: no node after the first restaurant of cycle 2
- **Given**: the player has completed cycle 1 and cycle 2 has just started (restaurant 1 of cycle 2)
- **When**: the first restaurant of cycle 2 is cleared
- **Then**: no node choice is presented; the next restaurant starts immediately

### Test: node appears after the second restaurant of cycle 2
- **Given**: the player is in cycle 2 and has cleared 2 restaurants
- **When**: the second restaurant of cycle 2 is cleared
- **Then**: a node choice is presented

### Test: node frequency is exactly every 2 restaurants in cycle 2
- **Given**: the player is in cycle 2 (4 restaurants total: Chain, Local, High-End, Boss)
- **When**: all 4 restaurants are cleared
- **Then**: nodes are presented after restaurants 2 and 4 — a total of 2 nodes in cycle 2

---

## Node Frequency — Cycle 3+ (every 3 restaurants, fixed floor)

### Test: node appears after every 3rd restaurant in cycle 3
- **Given**: the player is in cycle 3
- **When**: restaurants 1, 2, and 3 are cleared in sequence
- **Then**: no node after restaurant 1, no node after restaurant 2, node after restaurant 3

### Test: node appears after the Boss (4th restaurant) of cycle 3 due to cycle boundary
- **Given**: the player is in cycle 3 and has already received 1 node (after restaurant 3)
- **When**: the Boss restaurant (restaurant 4) is cleared
- **Then**: the system evaluates whether a node is due; with 4 restaurants and a floor of 3, the node triggers at position 3 and does not trigger again at position 4 within the same cycle

### Test: frequency does not decrease below every 3 restaurants in cycle 4 and beyond
- **Given**: the player has reached cycle 4 or higher
- **When**: restaurants are cleared
- **Then**: the node frequency remains every 3 restaurants and does not decrease further (fixed floor)

### Test: cycle 5 node frequency equals cycle 3 node frequency
- **Given**: the player is in cycle 5
- **When**: any 3 consecutive restaurants are cleared
- **Then**: exactly 1 node is presented after the 3rd clear — same behavior as cycle 3

---

## Node Choice — Shop vs. Rest

### Test: player is presented with both Shop and Rest options at every node
- **Given**: a node has been triggered
- **When**: the node screen is displayed
- **Then**: both "Shop" and "Rest" options are shown and selectable

### Test: selecting Rest closes the node screen and resumes game
- **Given**: the player is at a node screen
- **When**: the player selects Rest
- **Then**: the Rest effects are applied and the game proceeds to the next restaurant

### Test: selecting Shop opens the Shop interface
- **Given**: the player is at a node screen
- **When**: the player selects Shop
- **Then**: the Shop screen is displayed with purchasable items

---

## Rest Node — Debuff Clearing

### Test: Rest clears active Burnt Smoke debuff
- **Given**: the player has an active Burnt Smoke visibility reduction
- **When**: the player selects Rest at a node
- **Then**: the Burnt Smoke debuff is removed and grill visibility is fully restored

### Test: Rest clears active Raw Meat paralysis
- **Given**: the player is currently under Raw Meat temporary action disable (3s timer still active)
- **When**: the player selects Rest at a node
- **Then**: the action disable is immediately cleared and all actions become available

### Test: Rest clears active Staff Warning speed debuff
- **Given**: the player has a −20% processing speed debuff from Staff Warning count reaching 3
- **When**: the player selects Rest at a node
- **Then**: the speed debuff is removed and processing speed returns to baseline

### Test: Rest clears stacked Staff Warning speed debuff
- **Given**: the player has a −40% processing speed debuff from Staff Warning count reaching 5
- **When**: the player selects Rest at a node
- **Then**: the stacked speed debuff is removed and processing speed returns to baseline

### Test: Rest clears multiple simultaneous debuffs
- **Given**: the player has Burnt Smoke, Staff Warning speed debuff, and active Raw Meat paralysis all active at the same time
- **When**: the player selects Rest
- **Then**: all three debuffs are cleared simultaneously in one Rest action

### Test: Rest does not restore Grill slot disabled by Grill Fire mid-restaurant (node is between restaurants)
- **Given**: a Grill Fire slot disable (10s) occurred during the last restaurant
- **When**: the player selects Rest at the post-restaurant node
- **Then**: since nodes appear between restaurants and the disable timer resets with each restaurant start, the slot is available when the next restaurant begins (Rest guarantees a clean start)

---

## Rest Node — Staff Warning Counter Reset

### Test: Rest resets Staff Warning counter from 3 to 0
- **Given**: the Staff Warning counter is at 3 (debuff active)
- **When**: the player selects Rest
- **Then**: the Staff Warning counter is reset to 0 and the debuff is deactivated

### Test: Rest resets Staff Warning counter from 5 to 0
- **Given**: the Staff Warning counter is at 5 (stacked debuff active, −40% speed)
- **When**: the player selects Rest
- **Then**: the Staff Warning counter is reset to 0 and both speed debuffs are cleared

### Test: Rest resets a partial Staff Warning counter (below threshold)
- **Given**: the Staff Warning counter is at 2 (below the debuff threshold of 3)
- **When**: the player selects Rest
- **Then**: the Staff Warning counter is reset to 0

### Test: Staff Warning counter is 0 after Rest regardless of starting value
- **Given**: the Staff Warning counter is at any value (0–5+)
- **When**: the player selects Rest
- **Then**: the Staff Warning counter is exactly 0 after the Rest completes

---

## Shop Node — Skill Offering

### Test: Shop presents exactly 3 random skill choices
- **Given**: the player opens a Shop node
- **When**: the Shop screen is displayed
- **Then**: exactly 3 skill choices are shown

### Test: Shop skill choices are drawn from the available skill pool
- **Given**: the player opens a Shop node
- **When**: the Shop screen is displayed
- **Then**: each of the 3 offered skills exists in the defined skill pool (core + build-specific)

### Test: Shop does not offer skills the player already owns
- **Given**: the player already holds Tong Master and Heat Sensor
- **When**: the Shop screen is displayed
- **Then**: neither Tong Master nor Heat Sensor appears among the 3 offered choices

### Test: Shop skill purchase costs 20 coins
- **Given**: the player has at least 20 coins and opens a Shop node
- **When**: the player selects one of the 3 offered skills and confirms purchase
- **Then**: 20 coins are deducted from the player's coin total and the skill is added to their skill set

### Test: player cannot purchase a skill with insufficient coins
- **Given**: the player has 15 coins (less than the 20-coin skill cost)
- **When**: the player attempts to purchase a skill from the Shop
- **Then**: the purchase is blocked and no coins are deducted

### Test: purchasing one skill does not prevent viewing the other two choices
- **Given**: the player has enough coins and purchases 1 of the 3 offered skills
- **When**: the purchase is confirmed
- **Then**: the Shop session ends (one skill per Shop visit is the standard behavior) OR remaining choices remain available (whichever the spec finalises — test should assert the defined behavior consistently)

---

## Shop Node — Consumable Items

### Test: Shop offers consumable items alongside skills
- **Given**: the player opens a Shop node
- **When**: the Shop screen is displayed
- **Then**: consumable items are listed separately from the 3 skill choices

### Test: consumable item purchase costs 10 coins
- **Given**: the player has at least 10 coins and a consumable item (e.g., "Extra Tare") is listed in the Shop
- **When**: the player purchases the consumable
- **Then**: exactly 10 coins are deducted and the consumable is added to the player's inventory

### Test: "Extra Tare" consumable clears 1 Staff Warning counter increment
- **Given**: the player's Staff Warning counter is at 2
- **When**: the player uses the "Extra Tare" consumable
- **Then**: the Staff Warning counter decreases by 1, becoming 1

### Test: consumable is removed from inventory after single use
- **Given**: the player has 1 "Extra Tare" consumable in their inventory
- **When**: the player uses it once
- **Then**: the consumable count becomes 0 and it is no longer usable

### Test: player cannot purchase a consumable with insufficient coins
- **Given**: the player has 5 coins (less than the 10-coin consumable cost)
- **When**: the player attempts to purchase a consumable
- **Then**: the purchase is blocked and no coins are deducted

---

## Edge Cases

### Test: node is not presented at the very start of the game (before any restaurant)
- **Given**: the player has just selected a character and the game is initializing
- **When**: the first restaurant is about to start
- **Then**: no node screen is shown; the first restaurant begins directly

### Test: node frequency calculation resets correctly at each new cycle boundary
- **Given**: the player is transitioning from cycle 1 (node every restaurant) to cycle 2 (node every 2 restaurants)
- **When**: the first restaurant of cycle 2 is cleared
- **Then**: the node counter is evaluated under cycle-2 rules (next node after 2 restaurants), not cycle-1 rules

### Test: Shop with empty skill pool (all skills acquired) still shows consumables
- **Given**: the player owns every skill in the pool
- **When**: the player opens a Shop node
- **Then**: the Shop still displays consumable items for purchase; no skill slots are shown (or a "no skills available" message is shown instead of the 3 choices)

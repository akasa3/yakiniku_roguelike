# Test: FR-01 Core Gameplay Loop

> t_wada TDD-style specification — Red phase.
> These tests define expected behavior BEFORE implementation.
> Reference: GAME_DESIGN.md §2, §3, §4, §4b; requirements.md FR-01.

---

## Grilling State Progression

### Test: meat advances from raw to rare after grill_time elapses
- **Given**: a piece of Kalbi (grill_time = Medium = 5s) is placed on a grill slot in the `raw` state
- **When**: 5 seconds elapse with no player action
- **Then**: the meat's state transitions to `rare`

### Test: meat advances from rare to medium after grill_time elapses
- **Given**: a piece of Kalbi (grill_time = Medium = 5s) is in the `rare` state on a grill slot
- **When**: a further 5 seconds elapse
- **Then**: the meat's state transitions to `medium`

### Test: meat advances from medium to well-done after grill_time elapses
- **Given**: a piece of Kalbi is in the `medium` state
- **When**: a further 5 seconds elapse
- **Then**: the meat's state transitions to `well-done`

### Test: meat advances from well-done to burnt after grill_time elapses
- **Given**: a piece of Kalbi is in the `well-done` state
- **When**: a further 5 seconds elapse
- **Then**: the meat's state transitions to `burnt`

### Test: burnt is the terminal grilling state — meat does not advance further
- **Given**: a piece of meat is in the `burnt` state
- **When**: any amount of time elapses
- **Then**: the state remains `burnt` (no further state change occurs)

### Test: state progression uses the meat part's specific grill_time
- **Given**: a Beef Tongue (grill_time = Short = 3s) is placed in the `raw` state
- **When**: 3 seconds elapse
- **Then**: the state transitions to `rare`

### Test: state progression for Long grill_time meat
- **Given**: a Thick Tongue (grill_time = Long = 8s) is placed in the `raw` state
- **When**: 8 seconds elapse
- **Then**: the state transitions to `rare`

### Test: state progression for Very Long grill_time meat
- **Given**: a Chateaubriand (grill_time = Very Long = 12s) is placed in the `raw` state
- **When**: 12 seconds elapse
- **Then**: the state transitions to `rare`

### Test: state progression applies per-state (each state takes its own grill_time)
- **Given**: a Beef Tongue (Short = 3s) starts in `raw`
- **When**: 3s elapse (raw→rare), then another 3s elapse (rare→medium)
- **Then**: the meat is in the `medium` state at the 6-second mark

### Test: vegetable follows the same state progression as meat
- **Given**: a Green Pepper (grill_time = Short = 3s) is placed on a grill slot in the `raw` state
- **When**: 3 seconds elapse
- **Then**: the state transitions to `rare`

---

## Player Action: Eat

### Test: player can eat meat in the raw state
- **Given**: a piece of meat is in the `raw` state on a grill slot
- **When**: the player triggers the Eat action
- **Then**: the meat is removed from the grill slot; the raw meat penalty is applied (3s action disable); the dish is counted as consumed

### Test: player can eat meat in the rare state
- **Given**: a piece of meat is in the `rare` state on a grill slot
- **When**: the player triggers the Eat action
- **Then**: the meat is removed from the grill slot with no penalty; the dish is counted as consumed

### Test: player can eat meat in the medium state
- **Given**: a piece of meat is in the `medium` state
- **When**: the player triggers the Eat action
- **Then**: the meat is removed from the grill slot with no penalty; the dish is counted as consumed

### Test: player can eat meat in the well-done state
- **Given**: a piece of meat is in the `well-done` state
- **When**: the player triggers the Eat action
- **Then**: the meat is removed from the grill slot with no penalty; the dish is counted as consumed

### Test: player cannot eat meat in the burnt state
- **Given**: a piece of meat is in the `burnt` state
- **When**: the player attempts the Eat action
- **Then**: the Eat action is not available; the meat remains on the grill slot

### Test: eating meat while raw meat action-disable is active has no effect
- **Given**: the player is in a 3s raw-meat action-disable state
- **When**: the player attempts any Eat action
- **Then**: the action is rejected; no meat is consumed; the disable timer continues normally

---

## Player Action: Discard

### Test: player can discard burnt meat
- **Given**: a piece of meat is in the `burnt` state
- **When**: the player triggers the Discard action
- **Then**: the meat is removed from the grill slot; the Staff Warning counter increments by 1; the dish is NOT counted toward the restaurant's required eat count

### Test: player can discard raw meat
- **Given**: a piece of meat is in the `raw` state
- **When**: the player triggers the Discard action
- **Then**: the meat is removed from the grill slot; the Staff Warning counter increments by 1

### Test: discard is always available regardless of meat state
- **Given**: a piece of meat in any state (raw / rare / medium / well-done / burnt) is on a grill slot
- **When**: the player triggers the Discard action
- **Then**: the meat is removed and the Staff Warning counter increments by 1

### Test: discard increments Staff Warning counter by exactly 1
- **Given**: the Staff Warning counter is at 1
- **When**: the player discards one dish
- **Then**: the Staff Warning counter becomes 2

---

## Player Action: Flip

### Test: flip action is unavailable without Tong Master skill
- **Given**: the player does not have the Tong Master skill
- **When**: a piece of meat is on a grill slot
- **Then**: the Flip action is not available (not rendered / not triggerable)

### Test: flip resets the grill timer by 50% when Tong Master is active
- **Given**: the player has the Tong Master skill; a piece of Kalbi (Medium = 5s per state) has been on the grill for 4 seconds in the `raw` state (1 second remaining)
- **When**: the player triggers the Flip action
- **Then**: the remaining time in the `raw` state is reset to 50% of grill_time = 2.5s; the meat does not advance a state

### Test: flip does not change the meat's current state
- **Given**: the player has Tong Master; a piece of meat is in the `medium` state
- **When**: the player triggers Flip
- **Then**: the meat remains in the `medium` state; only the timer resets by 50%

### Test: flip is available on any non-burnt meat state when Tong Master is held
- **Given**: the player has Tong Master; meat is in the `rare` state
- **When**: the player triggers Flip
- **Then**: the remaining time in `rare` is reset by 50%; the state remains `rare`

---

## Automatic Serving to Grill Slots

### Test: a new dish is served to an empty grill slot automatically
- **Given**: the restaurant is active; at least one grill slot is empty; the serving interval has elapsed
- **When**: the next serving interval fires
- **Then**: a dish from the table queue is moved onto an empty grill slot automatically (no player action required)

### Test: no dish is served automatically when all grill slots are occupied
- **Given**: all 3 grill slots (default) are occupied by meat
- **When**: the serving interval fires
- **Then**: the new dish is placed on the table waiting queue, not on a grill slot

### Test: dishes on the table wait until a grill slot becomes available
- **Given**: all grill slots are full; 2 dishes are on the table
- **When**: the player eats one piece of meat (a grill slot becomes empty)
- **Then**: the first dish in the table queue is automatically moved to the now-empty grill slot

### Test: initial grill slot count is 3
- **Given**: a new run starts with no slot-expanding skills
- **When**: the first restaurant begins
- **Then**: the player has exactly 3 grill slots available

### Test: Extra Slot skill increases grill slot count by 2
- **Given**: the player acquires the Extra Slot skill (initial slots = 3)
- **When**: the next restaurant begins (or immediately)
- **Then**: the player now has 5 grill slots available

---

## Vegetable Behavior

### Test: vegetables are served automatically in all restaurant types
- **Given**: any restaurant type (Chain, Local, High-End, or Boss) is active
- **When**: the serving queue is processed
- **Then**: vegetable dishes (Green Pepper, Eggplant) can appear in the queue alongside meat dishes

### Test: vegetables have no flare_risk
- **Given**: a Green Pepper or Eggplant is on a grill slot
- **When**: each second passes (flare_risk check)
- **Then**: no flare_risk event is triggered; time is never halved; state advances at the normal rate

### Test: eating a vegetable is neutral for non-Vegan characters
- **Given**: the player is NOT Vegan Tashiro; a vegetable is in a grillable state
- **When**: the player eats the vegetable
- **Then**: no coins are earned; no penalty is applied; the dish is removed from the grill slot

### Test: vegetables do not count toward the restaurant's required dish count
- **Given**: a restaurant requires 8 dishes to be eaten (Chain); 2 vegetable dishes and 8 meat dishes have been served
- **When**: the player eats all 8 meat dishes (and some vegetables)
- **Then**: the restaurant is cleared; the vegetable dishes eaten (or not) do not affect the cleared condition

### Test: vegetables use the same grill states as meat
- **Given**: an Eggplant (grill_time = Medium = 5s) is on a grill slot in `raw`
- **When**: 5 seconds elapse
- **Then**: the Eggplant transitions to `rare`

---

## Restaurant Clearing Condition

### Test: restaurant is cleared when all served meat dishes have been eaten
- **Given**: a Chain restaurant with 8 meat dishes total; the player has eaten 7 dishes
- **When**: the player eats the 8th dish
- **Then**: the restaurant is marked as cleared; the skill selection screen is presented

### Test: discarded dishes do not contribute to clearing
- **Given**: a Chain restaurant with 8 dishes; the player has eaten 6 and discarded 1
- **When**: the player eats the 7th dish (only 7 eaten, 1 discarded)
- **Then**: the restaurant is NOT yet cleared (only eaten dishes count)

### Test: clearing requires eating, not just serving all dishes
- **Given**: all 8 dishes of a Chain restaurant have been served
- **When**: one dish remains uneaten on the grill
- **Then**: the restaurant is NOT cleared until that dish is also eaten

### Test: restaurant is NOT cleared if any meat dish remains on the table or grill
- **Given**: a Local restaurant has 12 dishes; 11 have been eaten; 1 is still on the grill in `medium` state
- **When**: no eat action is taken
- **Then**: the cleared condition is not triggered; the game continues

### Test: skill selection always occurs after clearing a restaurant
- **Given**: any restaurant is cleared
- **When**: the cleared condition fires
- **Then**: a skill selection screen with exactly 3 random skill choices is presented

---

## Grill Slot Management

### Test: an empty grill slot can receive a new dish at any time
- **Given**: a grill slot is empty
- **When**: a dish is on the table queue
- **Then**: the dish moves to the grill slot automatically at the next opportunity

### Test: a grill slot becomes empty immediately when its dish is eaten or discarded
- **Given**: a grill slot holds a piece of meat in `well-done`
- **When**: the player eats it
- **Then**: the slot is empty and available for the next dish immediately

### Test: table capacity defaults to 5 dishes
- **Given**: a new run with no table-extension skills
- **When**: the restaurant begins serving
- **Then**: the table can hold a maximum of 5 dishes in the waiting queue

### Test: Table Extension skill increases table capacity by 3
- **Given**: the player acquires the Table Extension skill (base capacity = 5)
- **When**: checking table capacity
- **Then**: the table can now hold up to 8 dishes

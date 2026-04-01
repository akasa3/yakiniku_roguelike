# Test: FR-03 Restaurant Progression

> t_wada TDD-style specification — Red phase.
> These tests define expected behavior BEFORE implementation.
> Reference: GAME_DESIGN.md §3, §7; requirements.md FR-03.

---

## Restaurant Cycle Order

### Test: restaurants appear in the fixed order Chain → Local → High-End → Boss
- **Given**: a new run starts at cycle 1
- **When**: the player clears each restaurant in sequence
- **Then**: the order is Chain (restaurant 1), Local (restaurant 2), High-End (restaurant 3), Boss (restaurant 4)

### Test: after clearing Boss the cycle repeats starting with Chain
- **Given**: the player has cleared the Boss restaurant (restaurant 4, cycle 1)
- **When**: the next restaurant begins
- **Then**: the restaurant type is Chain (cycle 2 begins)

### Test: cycle 2 follows the same Chain → Local → High-End → Boss order
- **Given**: cycle 2 has started
- **When**: the player clears each restaurant in cycle 2
- **Then**: the order is Chain, Local, High-End, Boss (same fixed cycle)

### Test: cycle count increments by exactly 1 when all 4 restaurant types are cleared
- **Given**: the player is in cycle N, restaurant 4 (Boss) is cleared
- **When**: the next restaurant begins
- **Then**: the cycle count is N + 1

### Test: the run never ends due to cycle count alone — it only ends on game over
- **Given**: the player has cleared cycle 3 Boss (12 restaurants total)
- **When**: the cycle-4 Chain begins
- **Then**: the run continues indefinitely; there is no "win" state from reaching a certain cycle (except True Ending at cycle 4 Boss)

---

## Dish Count Per Restaurant Type

### Test: Chain restaurant serves exactly 8 meat dishes
- **Given**: a Chain restaurant begins
- **When**: all dishes are served and tracked
- **Then**: exactly 8 meat dishes were served to the player before the restaurant-cleared condition can trigger

### Test: Local restaurant serves exactly 12 meat dishes
- **Given**: a Local restaurant begins
- **When**: all dishes are served
- **Then**: exactly 12 meat dishes were served

### Test: High-End restaurant serves exactly 10 meat dishes
- **Given**: a High-End restaurant begins
- **When**: all dishes are served
- **Then**: exactly 10 meat dishes were served

### Test: Boss restaurant serves exactly 15 meat dishes
- **Given**: a Boss restaurant begins
- **When**: all dishes are served
- **Then**: exactly 15 meat dishes were served

### Test: vegetable dishes are served in addition to the required meat count
- **Given**: a Chain restaurant (8 required meat dishes) is in progress
- **When**: the serving queue includes vegetable dishes
- **Then**: the total dishes served can exceed 8; the extra dishes are vegetables; the clear condition triggers when 8 meat dishes have been eaten

---

## Serving Speed Per Restaurant Type

### Test: Chain restaurant base serving interval is 8 seconds
- **Given**: a Chain restaurant begins in cycle 1
- **When**: dishes are served
- **Then**: the time between each served dish is 8 seconds

### Test: Local restaurant base serving interval is 6 seconds
- **Given**: a Local restaurant begins in cycle 1
- **When**: dishes are served
- **Then**: the time between each served dish is 6 seconds

### Test: High-End restaurant base serving interval is 5 seconds
- **Given**: a High-End restaurant begins in cycle 1
- **When**: dishes are served
- **Then**: the time between each served dish is 5 seconds

### Test: Boss restaurant base serving interval is 3 seconds
- **Given**: a Boss restaurant begins in cycle 1
- **When**: dishes are served
- **Then**: the time between each served dish is 3 seconds

---

## Difficulty Scaling — Serving Speed

### Test: serving interval decreases by 0.5s per cycle completed
- **Given**: the player has completed cycle 1 (i.e., is now in cycle 2)
- **When**: a Chain restaurant begins in cycle 2
- **Then**: the serving interval is 8s − 0.5s = 7.5 seconds

### Test: serving interval decreases by 1.0s total in cycle 3
- **Given**: the player has completed cycle 2 (now in cycle 3)
- **When**: a Chain restaurant begins in cycle 3
- **Then**: the serving interval is 8s − 1.0s = 7 seconds

### Test: serving speed reduction is capped at −1s total (cycle 3 cap)
- **Given**: the player has completed cycle 3 (now in cycle 4)
- **When**: a Chain restaurant begins in cycle 4
- **Then**: the serving interval is 8s − 1s = 7 seconds (not further reduced beyond the cap)

### Test: serving speed cap applies in cycle 4 and all subsequent cycles
- **Given**: the player is in cycle 5 or beyond
- **When**: a Chain restaurant begins
- **Then**: the serving interval is still 8s − 1s = 7 seconds (cap holds; no further reduction)

### Test: serving speed reduction applies to all restaurant types equally
- **Given**: the player is in cycle 2 (−0.5s reduction)
- **When**: any restaurant type (Chain, Local, High-End, Boss) begins
- **Then**:
  - Chain: 7.5s interval
  - Local: 5.5s interval
  - High-End: 4.5s interval
  - Boss: 2.5s interval

### Test: serving speed reduction cap preserves the 2-second floor for Boss restaurants
- **Given**: the player is in cycle 3+ (maximum −1s reduction)
- **When**: a Boss restaurant begins
- **Then**: the Boss interval is 3s − 1s = 2 seconds; this is the minimum serving interval for Boss

---

## Difficulty Scaling — Grill Timing (sweet_spot)

### Test: sweet_spot decreases by 0.3s per cycle
- **Given**: the player has completed cycle 1 (in cycle 2); a Kalbi (sweet_spot = Medium = 2s normally)
- **When**: the Kalbi reaches `well-done`
- **Then**: the effective sweet_spot window is 2s − 0.3s = 1.7s

### Test: sweet_spot decrease applies at cycle 2 (first scaling cycle)
- **Given**: cycle 1 has no scaling; cycle 2 adds −0.3s
- **When**: comparing a meat's sweet_spot in cycle 1 vs cycle 2
- **Then**: the well-done window is exactly 0.3s shorter in cycle 2

### Test: sweet_spot scaling is capped at cycle 5 (−1.2s total reduction)
- **Given**: the player is in cycle 5; Kalbi has a base sweet_spot of Medium = 2s
- **When**: the Kalbi reaches `well-done`
- **Then**: the effective sweet_spot is 2s − (4 × 0.3s) = 2s − 1.2s = 0.8s

### Test: sweet_spot does not decrease further beyond cycle 5
- **Given**: the player is in cycle 6 or beyond
- **When**: checking a meat's effective sweet_spot
- **Then**: the reduction is still capped at −1.2s (same as cycle 5)

### Test: a Narrow sweet_spot meat at cycle 5 has an effective window of at most its base minus cap
- **Given**: Beef Tongue has sweet_spot = Narrow = 1s; player is in cycle 5 (−1.2s cap)
- **When**: Beef Tongue reaches `well-done`
- **Then**: the effective sweet_spot is 1s − 1.2s = −0.2s; NOTE: the implementation must handle this edge case — the window cannot be negative; define behavior (minimum floor of 0s or a minimum positive value is required)

> IMPLEMENTATION NOTE: The sweet_spot cap at cycle 5 can reduce Narrow-window meats below zero. A minimum floor (e.g., 0.1s or 0s) must be defined and tested.

---

## Difficulty Scaling — Penalty Weight

### Test: penalty severity increases by 10% per cycle
- **Given**: the player has completed cycle 1 (in cycle 2); the raw meat penalty is normally 3s
- **When**: the player eats raw meat
- **Then**: the action-disable duration is 3s × 1.10 = 3.3 seconds

### Test: penalty weight scaling is capped at cycle 5 (+40% severity total)
- **Given**: the player is in cycle 5; base raw meat penalty is 3s
- **When**: the player eats raw meat
- **Then**: the action-disable duration is 3s × 1.40 = 4.2 seconds

### Test: penalty weight does not increase further beyond cycle 5
- **Given**: the player is in cycle 6; base raw meat penalty is 3s
- **When**: the player eats raw meat
- **Then**: the action-disable duration is still 3s × 1.40 = 4.2 seconds (cap holds)

### Test: penalty weight applies to all penalty types proportionally
- **Given**: cycle 2 (+10% severity); grill fire disabled duration is normally 10s
- **When**: a grill fire occurs in cycle 2
- **Then**: the slot is disabled for 10s × 1.10 = 11 seconds

---

## Meat Rank Distribution Per Restaurant Type

### Test: Chain restaurant serves only Common rank meat
- **Given**: a Chain restaurant is active
- **When**: a meat dish is served (not a vegetable)
- **Then**: the meat's rank is Common (並); Upper/Premium/Elite meats never appear

### Test: Local restaurant serves 40% Common and 60% Upper rank meat
- **Given**: a Local restaurant is active; a large sample of meat dishes is served
- **When**: the rank distribution is measured over many dishes
- **Then**: approximately 40% are Common rank and 60% are Upper rank; no Premium or Elite appear

### Test: High-End restaurant serves 30% Upper and 70% Premium rank meat
- **Given**: a High-End restaurant is active; a large sample of meat dishes is served
- **When**: the rank distribution is measured
- **Then**: approximately 30% are Upper rank and 70% are Premium rank; no Common or Elite appear

### Test: Boss restaurant serves 40% Premium and 60% Elite rank meat
- **Given**: a Boss restaurant is active; a large sample of meat dishes is served
- **When**: the rank distribution is measured
- **Then**: approximately 40% are Premium rank and 60% are Elite rank; no Common or Upper appear

### Test: Common rank meat never appears in High-End restaurants
- **Given**: a High-End restaurant
- **When**: any meat dish is served
- **Then**: the meat rank is never Common (並)

### Test: Elite rank meat only appears in Boss restaurants
- **Given**: any restaurant other than Boss (Chain, Local, High-End)
- **When**: any meat dish is served
- **Then**: the meat rank is never Elite (極)

### Test: rank distribution is applied per dish served, not per restaurant session
- **Given**: a Local restaurant begins; the first dish is served
- **When**: the rank of the first dish is determined
- **Then**: it is independently rolled (40% Common / 60% Upper); the previous dish's rank has no influence

---

## Node Appearance Frequency

### Test: in cycle 1, a node appears after every restaurant
- **Given**: the player is in cycle 1
- **When**: each restaurant is cleared (Chain, Local, High-End, Boss)
- **Then**: a node prompt (Shop or Rest) appears after each of the 4 restaurants

### Test: in cycle 2, a node appears after every 2 restaurants
- **Given**: the player is in cycle 2
- **When**: the player clears restaurants in order
- **Then**: a node appears after restaurant 2 (Local) and after restaurant 4 (Boss); no node appears after restaurant 1 (Chain) or restaurant 3 (High-End) alone

### Test: in cycle 3 and beyond, a node appears after every 3 restaurants
- **Given**: the player is in cycle 3 (or any cycle ≥ 3)
- **When**: the player clears restaurants in order
- **Then**: a node appears after restaurant 3 (High-End); the next node would be after 3 more (restaurant 6 in cycle 4 = Local); no earlier nodes appear

### Test: node frequency floor is fixed at 3 restaurants and does not decrease further in cycle 4+
- **Given**: the player is in cycle 4
- **When**: tracking node appearances
- **Then**: nodes still appear every 3 restaurants (same as cycle 3); the frequency does not decrease to every 4 restaurants

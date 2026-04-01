# Test: DATA Meat and Side Dish Definitions

> t_wada TDD-style specification — Red phase.
> These tests define expected behavior BEFORE implementation.
> Reference: GAME_DESIGN.md §4, §4b; requirements.md FR-01.

---

## Numeric Calibration Constants

### Test: Short grill_time constant equals 3 seconds
- **Given**: the numeric calibration table defines Short = 3s
- **When**: any meat with `grill_time = Short` is placed on the grill
- **Then**: each grilling state (raw→rare, rare→medium, etc.) takes exactly 3 seconds to advance

### Test: Medium grill_time constant equals 5 seconds
- **Given**: the numeric calibration table defines Medium = 5s
- **When**: any meat with `grill_time = Medium` is placed on the grill
- **Then**: each grilling state takes exactly 5 seconds to advance

### Test: Long grill_time constant equals 8 seconds
- **Given**: the numeric calibration table defines Long = 8s
- **When**: any meat with `grill_time = Long` is placed on the grill
- **Then**: each grilling state takes exactly 8 seconds to advance

### Test: Very Long grill_time constant equals 12 seconds
- **Given**: the numeric calibration table defines Very Long = 12s
- **When**: any meat with `grill_time = Very Long` is placed on the grill
- **Then**: each grilling state takes exactly 12 seconds to advance

### Test: flare_risk Low constant equals 5%
- **Given**: the numeric calibration defines Low flare_risk = 5%
- **When**: the flare_risk check fires each second for a meat with Low flare_risk
- **Then**: the probability of triggering an acceleration event is 5% per second

### Test: flare_risk Medium constant equals 20%
- **Given**: the numeric calibration defines Medium flare_risk = 20%
- **When**: the flare_risk check fires each second
- **Then**: the probability is 20% per second

### Test: flare_risk High constant equals 40%
- **Given**: the numeric calibration defines High flare_risk = 40%
- **When**: the flare_risk check fires each second
- **Then**: the probability is 40% per second

### Test: flare_risk Very High constant equals 60%
- **Given**: the numeric calibration defines Very High flare_risk = 60%
- **When**: the flare_risk check fires each second
- **Then**: the probability is 60% per second

### Test: sweet_spot Narrow constant equals 1 second
- **Given**: the numeric calibration defines Narrow sweet_spot = 1s
- **When**: a meat with Narrow sweet_spot reaches `well-done`
- **Then**: the well-done window lasts exactly 1 second before transitioning to `burnt`

### Test: sweet_spot Medium constant equals 2 seconds
- **Given**: the numeric calibration defines Medium sweet_spot = 2s
- **When**: a meat with Medium sweet_spot reaches `well-done`
- **Then**: the well-done window lasts exactly 2 seconds

### Test: sweet_spot Wide constant equals 3 seconds
- **Given**: the numeric calibration defines Wide sweet_spot = 3s
- **When**: a meat with Wide sweet_spot reaches `well-done`
- **Then**: the well-done window lasts exactly 3 seconds

### Test: sweet_spot Very Wide constant equals 4 seconds
- **Given**: the numeric calibration defines Very Wide sweet_spot = 4s
- **When**: a meat with Very Wide sweet_spot reaches `well-done`
- **Then**: the well-done window lasts exactly 4 seconds

---

## Common Rank Meat Parts

### Test: Kalbi data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Kalbi (カルビ)
- **When**: the data is read
- **Then**:
  - rank = Common (並)
  - grill_time = Medium (5s per state)
  - flare_risk = High (40%)
  - sweet_spot = Medium (2s)

### Test: Beef Tongue data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Beef Tongue (牛タン)
- **When**: the data is read
- **Then**:
  - rank = Common
  - grill_time = Short (3s per state)
  - flare_risk = Low (5%)
  - sweet_spot = Narrow (1s)

### Test: Harami data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Harami (ハラミ)
- **When**: the data is read
- **Then**:
  - rank = Common
  - grill_time = Medium (5s per state)
  - flare_risk = Medium (20%)
  - sweet_spot = Wide (3s)

---

## Upper Rank Meat Parts

### Test: Upper Kalbi data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Upper Kalbi (上カルビ)
- **When**: the data is read
- **Then**:
  - rank = Upper (上)
  - grill_time = Medium (5s per state)
  - flare_risk = High (40%)
  - sweet_spot = Medium (2s)

### Test: Thick Tongue data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Thick Tongue (厚切りタン)
- **When**: the data is read
- **Then**:
  - rank = Upper
  - grill_time = Long (8s per state)
  - flare_risk = Low (5%)
  - sweet_spot = Narrow (1s)

### Test: Loin data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Loin (ロース)
- **When**: the data is read
- **Then**:
  - rank = Upper
  - grill_time = Medium (5s per state)
  - flare_risk = Medium (20%)
  - sweet_spot = Wide (3s)

---

## Premium Rank Meat Parts

### Test: Special Kalbi data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Special Kalbi (特上カルビ)
- **When**: the data is read
- **Then**:
  - rank = Premium (特上)
  - grill_time = Medium (5s per state)
  - flare_risk = Very High (60%)
  - sweet_spot = Medium (2s)

### Test: Zabuton data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Zabuton (ザブトン)
- **When**: the data is read
- **Then**:
  - rank = Premium
  - grill_time = Long (8s per state)
  - flare_risk = High (40%)
  - sweet_spot = Narrow (1s)

### Test: Misuji data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Misuji (ミスジ)
- **When**: the data is read
- **Then**:
  - rank = Premium
  - grill_time = Short (3s per state)
  - flare_risk = Low (5%)
  - sweet_spot = Very Wide (4s)

---

## Elite Rank Meat Parts

### Test: Chateaubriand data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Chateaubriand (シャトーブリアン)
- **When**: the data is read
- **Then**:
  - rank = Elite (極)
  - grill_time = Very Long (12s per state)
  - flare_risk = Medium (20%)
  - sweet_spot = Very Narrow (1s or narrower — see note)

> NOTE: The spec lists Chateaubriand sweet_spot as "Very Narrow", but the numeric calibration table only defines: Narrow=1s, Medium=2s, Wide=3s, Very Wide=4s. "Very Narrow" is not explicitly defined. Implementation must define this value (e.g., 0.5s) as a named constant before testing this exact value.

### Test: Ichibo data — rank, grill_time, flare_risk, sweet_spot
- **Given**: the meat data definition for Ichibo (イチボ)
- **When**: the data is read
- **Then**:
  - rank = Elite
  - grill_time = Long (8s per state)
  - flare_risk = Low (5%)
  - sweet_spot = Narrow (1s)

---

## Complete Meat Roster Count

### Test: total meat part count is exactly 11
- **Given**: the meat data definitions
- **When**: all meat parts are enumerated
- **Then**: there are exactly 11 distinct meat parts:
  1. Kalbi (Common)
  2. Beef Tongue (Common)
  3. Harami (Common)
  4. Upper Kalbi (Upper)
  5. Thick Tongue (Upper)
  6. Loin (Upper)
  7. Special Kalbi (Premium)
  8. Zabuton (Premium)
  9. Misuji (Premium)
  10. Chateaubriand (Elite)
  11. Ichibo (Elite)

---

## Side Dish (Vegetable) Data

### Test: Green Pepper data — grill_time, flare_risk, sweet_spot
- **Given**: the side dish definition for Green Pepper (ピーマン)
- **When**: the data is read
- **Then**:
  - grill_time = Short (3s per state)
  - flare_risk = None (0%)
  - sweet_spot = Wide (3s)

### Test: Eggplant data — grill_time, flare_risk, sweet_spot
- **Given**: the side dish definition for Eggplant (なす)
- **When**: the data is read
- **Then**:
  - grill_time = Medium (5s per state)
  - flare_risk = None (0%)
  - sweet_spot = Wide (3s)

### Test: total vegetable count is exactly 2
- **Given**: the side dish data definitions
- **When**: all vegetable parts are enumerated
- **Then**: there are exactly 2: Green Pepper and Eggplant

---

## flare_risk Behavior

### Test: flare_risk is checked once per second
- **Given**: a piece of Special Kalbi (flare_risk = Very High = 60%) is on the grill
- **When**: 1 second elapses
- **Then**: a single flare_risk roll is performed; the roll has a 60% chance of triggering an acceleration event

### Test: flare_risk halves the remaining time in the current state when triggered
- **Given**: a piece of Kalbi (grill_time = Medium = 5s, flare_risk = High = 40%) is in the `raw` state with 4 seconds remaining
- **When**: the flare_risk check triggers (probability event fires)
- **Then**: the remaining time in `raw` is halved from 4s to 2s; the state does NOT skip to `burnt` directly

### Test: flare_risk does not cause a direct state jump to burnt
- **Given**: a piece of meat is in the `medium` state with 3 seconds remaining
- **When**: a flare_risk event triggers
- **Then**: the remaining time is halved to 1.5s; the state is still `medium`; the meat does not jump to `well-done` or `burnt` immediately

### Test: flare_risk can trigger multiple times stacking the halving effect
- **Given**: a piece of Kalbi is in the `raw` state with 4 seconds remaining; a first flare_risk event fires (remaining → 2s)
- **When**: before the state advances, a second flare_risk event fires
- **Then**: the remaining time is halved again: 2s → 1s; stacking is permitted

### Test: three consecutive flare_risk triggers on a Medium meat cause rapid state advance
- **Given**: a piece of Special Kalbi (grill_time = Medium = 5s per state) has just entered `rare` with 5s remaining; flare_risk = 60%
- **When**: three separate flare_risk triggers fire (5s → 2.5s → 1.25s → 0.625s)
- **Then**: the meat enters `medium` after approximately 0.625s of actual elapsed time

### Test: flare_risk does not apply to vegetables (no flare_risk field or 0%)
- **Given**: a Green Pepper is on a grill slot
- **When**: 1 second elapses (flare_risk check would normally fire)
- **Then**: no flare_risk roll occurs; remaining time is not halved; the state advances at the normal rate only

### Test: flare_risk halving applies to the current state only, not future states
- **Given**: a piece of meat is in the `medium` state; a flare_risk triggers and halves remaining time
- **When**: the meat transitions to `well-done`
- **Then**: the `well-done` duration starts fresh at the full sweet_spot value; the halving effect does not carry over

### Test: flare_risk can trigger even in the final state before burnt (well-done)
- **Given**: a piece of meat is in the `well-done` state with 2 seconds remaining; flare_risk = High = 40%
- **When**: a flare_risk event triggers
- **Then**: the remaining well-done time is halved to 1 second; the state transitions to `burnt` sooner; this is the scenario Heat Sensor warns about

### Test: Heat Sensor fires a warning when flare_risk triggers within the final state before burnt
- **Given**: the player has the Heat Sensor skill; a piece of meat is in the `well-done` state; a flare_risk event fires
- **When**: the flare_risk triggers during `well-done` (the final state before `burnt`)
- **Then**: the Heat Sensor visual warning activates immediately; the warning gives the player a 2-second notice window

---

## flare_risk Behavior — Edge Cases

### Test: flare_risk triggering at exactly 1 second remaining halves to 0.5 seconds
- **Given**: a piece of meat is in a state with exactly 1 second remaining; a flare_risk triggers
- **When**: the halving is applied
- **Then**: remaining time becomes 0.5 seconds; the meat transitions to the next state 0.5 seconds later

### Test: flare_risk triggering at very small remaining time does not cause immediate state skip
- **Given**: a piece of meat has 0.1 seconds remaining in a state; a flare_risk triggers
- **When**: the halving is applied (0.1s → 0.05s)
- **Then**: the meat still transitions via the normal state progression (not a direct jump); it transitions after 0.05 more seconds

---

## Data Integrity — No Missing or Duplicate Entries

### Test: all 11 meat parts have unique Japanese names
- **Given**: the meat data definitions
- **When**: JP names are enumerated
- **Then**: all 11 JP names are distinct; no two entries share the same name

### Test: all 11 meat parts have a defined rank
- **Given**: the meat data definitions
- **When**: each entry's rank is checked
- **Then**: every entry has a rank value that is one of: Common, Upper, Premium, Elite

### Test: all 11 meat parts have a defined grill_time
- **Given**: the meat data definitions
- **When**: each entry's grill_time is checked
- **Then**: every entry's grill_time is one of the defined symbolic values: Short, Medium, Long, Very Long

### Test: all 11 meat parts have a defined flare_risk
- **Given**: the meat data definitions
- **When**: each entry's flare_risk is checked
- **Then**: every entry's flare_risk is one of: Low, Medium, High, Very High

### Test: all meat data is defined as readonly typed constants
- **Given**: the TypeScript source files in `src/game/data/`
- **When**: the meat data object is inspected at the type level
- **Then**: the meat data array is typed with `readonly` and individual fields are not reassignable at compile time

### Test: all numeric parameter values are defined as named constants, never inline magic numbers
- **Given**: the TypeScript source files defining grill_time, flare_risk, and sweet_spot numeric values
- **When**: the source is reviewed
- **Then**: no raw number literals (e.g., `5`, `0.4`, `2`) appear in meat data definitions; all values reference named constants (e.g., `GRILL_TIME.MEDIUM`, `FLARE_RISK.HIGH`, `SWEET_SPOT.MEDIUM`)

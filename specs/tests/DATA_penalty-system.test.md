# Test: DATA Penalty System

Reference: GAME_DESIGN.md §5, §6, requirements.md FR-02

---

## Penalty Type 1 — Raw Meat (🩸)

### Test: eating raw meat triggers the action disable penalty
- **Given**: a piece of meat is in the raw state (first state in the progression)
- **When**: the player eats it
- **Then**: all player actions (Eat, Discard, Flip) are disabled for 3 seconds [TUNE]

### Test: action disable duration is exactly 3 seconds
- **Given**: the player has eaten raw meat and the action disable has started
- **When**: 3 seconds elapse
- **Then**: all player actions become available again

### Test: action disable lifts automatically after the timer expires (no player action required)
- **Given**: the player has eaten raw meat and is in the 3s action disable
- **When**: 3 seconds pass without any input
- **Then**: actions are restored automatically

### Test: Raw Meat penalty does not trigger for meat in the rare state
- **Given**: a piece of meat is in the rare state
- **When**: the player eats it
- **Then**: no action disable is applied (rare is not raw)

### Test: action disable during Raw Meat penalty can cause table overflow
- **Given**: the player eats raw meat (3s action disable) and the table is at maximum capacity
- **When**: a new dish arrives during the 3s window (Boss restaurant context)
- **Then**: the table overflows and game over triggers (raw paralysis overflow condition)

### Test: Raw Meat penalty stacks if a second raw piece is eaten during the disable window
- **Given**: the player eats raw meat (3s disable active) and eats a second raw piece during the disable
- **When**: the second eat occurs (if the eating action somehow completes while disabled — edge case)
- **Then**: the disable timer behavior is defined consistently (reset to 3s, or extend, per implementation) [TUNE]

---

## Penalty Type 1 — Raw Meat Mitigation: Raw Tolerance

### Test: Raw Tolerance reduces Raw Meat penalty duration by 70% (3s → 0.9s)
- **Given**: the player owns Raw Tolerance and the base penalty duration is 3s
- **When**: the player eats raw meat
- **Then**: the action disable lasts 0.9s (3 × 0.30)

### Test: Raw Tolerance reduces the disable but does not eliminate it entirely
- **Given**: the player owns Raw Tolerance (but not Iron Stomach)
- **When**: the player eats raw meat
- **Then**: a 0.9s action disable occurs (the penalty is reduced, not negated)

---

## Penalty Type 1 — Raw Meat Mitigation: Iron Stomach

### Test: Iron Stomach fully negates the Raw Meat action disable
- **Given**: the player owns Iron Stomach
- **When**: the player eats raw meat
- **Then**: no action disable occurs whatsoever; all actions remain available immediately

### Test: Iron Stomach negation is consistent across all meat types and ranks
- **Given**: the player owns Iron Stomach
- **When**: the player eats raw Common, Upper, Premium, or Elite meat
- **Then**: no action disable is triggered in any case

---

## Penalty Type 2 — Burnt Smoke (⚫)

### Test: Burnt Smoke reduces grill visibility when burnt meat is on the grill
- **Given**: a piece of meat has transitioned to the burnt state and remains on a grill slot
- **When**: the next dish arrives and is placed on a grill slot
- **Then**: the grill visibility is reduced for that incoming dish (the player has a harder time seeing its state)

### Test: Burnt Smoke visibility reduction affects the "next dish" specifically
- **Given**: burnt meat is present on the grill and Burnt Smoke is active
- **When**: a new dish arrives
- **Then**: the new dish's grill state indicator is obscured or degraded (not all slots permanently affected)

### Test: Burnt Smoke resolves after the burnt meat is removed from the grill
- **Given**: Burnt Smoke is active due to burnt meat on a slot
- **When**: the player discards the burnt meat (or it is otherwise removed)
- **Then**: the visibility degradation is lifted for subsequent dishes

### Test: multiple burnt pieces on the grill do not compound the visibility reduction beyond one layer (or stack per implementation)
- **Given**: two grill slots both have burnt meat
- **When**: a new dish arrives
- **Then**: the visibility behavior is consistently defined — either it stacks or it caps at one layer [TUNE]

---

## Penalty Type 2 — Burnt Smoke Mitigation: Heat Sensor

### Test: Heat Sensor provides 2-second advance warning before burning, allowing preventive action
- **Given**: the player owns Heat Sensor and meat is in the final pre-burnt state
- **When**: 2 seconds remain before burning
- **Then**: a visual warning indicator fires on that slot

### Test: Heat Sensor warning allows the player to eat or discard before the burn occurs
- **Given**: the player sees the Heat Sensor 2s warning
- **When**: the player discards or eats the meat within the 2s window
- **Then**: the meat is removed before burning, preventing Burnt Smoke from triggering

### Test: Heat Sensor does not directly cure Burnt Smoke — it only prevents by enabling timely action
- **Given**: the player owns Heat Sensor and a piece of meat has already burned (Burnt Smoke is active)
- **When**: the Burnt Smoke visibility reduction is applied
- **Then**: Heat Sensor does not remove or reduce the existing Burnt Smoke effect — it only helps prevent future burns

---

## Penalty Type 3 — Discard Loss (💸)

### Test: discarding any dish increments the Staff Warning counter by 1
- **Given**: the Staff Warning counter is at 0
- **When**: the player discards a dish (at any grill state)
- **Then**: the Staff Warning counter becomes 1

### Test: Discard Loss applies regardless of the meat's grill state at discard time
- **Given**: the Staff Warning counter is at 1
- **When**: the player discards a raw, rare, medium, well-done, or burnt piece of meat
- **Then**: the Staff Warning counter increments to 2 in each case

### Test: Discard Loss does NOT increment the counter when discarding vegetables
- **Given**: the Staff Warning counter is at 0 and the player does not own Discard Pro
- **When**: the player discards a vegetable (Green Pepper or Eggplant)
- **Then**: the Staff Warning counter remains 0 (discarding vegetables is neutral — §4b.1)

---

## Penalty Type 3 — Discard Loss Mitigation: Tare Conversion

### Test: Tare Conversion suppresses Staff Warning increment on meat discard
- **Given**: the player owns Tare Conversion and the Staff Warning counter is at 1
- **When**: the player discards any meat
- **Then**: the Staff Warning counter remains at 1 (not incremented) AND coins of +[TBD] are granted

### Test: Tare Conversion coin reward fires for every meat discard
- **Given**: the player owns Tare Conversion
- **When**: the player discards 3 pieces of meat in succession
- **Then**: +[TBD] coins are granted for each discard (3 separate coin grants)

### Test: Tare Conversion only suppresses increment for meat, not necessarily all item types
- **Given**: the player owns Tare Conversion and discards a vegetable
- **When**: the discard completes
- **Then**: behavior is defined consistently — either the counter is suppressed (Tare Conversion covers all discards) or it is not (meat-only); the spec should be implemented uniformly [spec note: "discarding any meat" — vegetable discard is neutral by default for non-Tare skills, but the Staff Warning increment from discarding vegetables should be explicitly specified]

---

## Penalty Type 4 — Staff Warning (😰)

### Test: Staff Warning debuff activates when the counter reaches 3
- **Given**: the Staff Warning counter is at 2
- **When**: the counter is incremented to 3 (by a Discard Loss or other trigger)
- **Then**: a −20% processing speed debuff is applied immediately

### Test: Staff Warning −20% speed debuff reduces all timed actions by 20%
- **Given**: the Staff Warning debuff is active (−20%)
- **When**: the player performs any timed action (eating, flipping, etc.)
- **Then**: the action takes 20% longer than its base duration

### Test: Staff Warning counter reaching 5 stacks the debuff to −40% speed
- **Given**: the Staff Warning counter is at 4 and the −20% debuff is already active
- **When**: the counter is incremented to 5
- **Then**: the speed debuff becomes −40% (stacked) [TUNE]

### Test: Staff Warning −40% replaces (or stacks on top of) the −20% debuff
- **Given**: the player is at counter 5 with −40% speed debuff active
- **When**: any timed action is performed
- **Then**: the action takes 40% longer than base (the full stacked debuff applies)

### Test: Staff Warning does not directly cause game over
- **Given**: the Staff Warning counter is at 5 (maximum speed penalty active)
- **When**: the player continues playing
- **Then**: no game over is triggered solely by the Staff Warning state — it is a debuff, not a kill condition

### Test: the Staff Warning counter can exceed 5 but the debuff does not increase further (or behavior is defined)
- **Given**: the Staff Warning counter is at 5 and the player discards another dish (without Discard Pro/Tare Conversion)
- **When**: the counter would increment to 6
- **Then**: the counter increments to 6 but the debuff remains at −40% (or the counter is capped at 5 — whichever the spec finalises) [TUNE]

---

## Penalty Type 4 — Staff Warning Mitigation: Charming Personality

### Test: Charming Personality raises the debuff activation threshold from 3 to 5
- **Given**: the player owns Charming Personality and the Staff Warning counter reaches 3
- **When**: the counter hits 3
- **Then**: no speed debuff is applied (the threshold has been moved to 5)

### Test: Charming Personality — debuff activates at count 5
- **Given**: the player owns Charming Personality and the counter reaches 5
- **When**: the counter hits 5
- **Then**: the speed debuff activates at count 5

### Test: Charming Personality raises the stacking threshold to 7
- **Given**: the player owns Charming Personality (first debuff at 5)
- **When**: the counter reaches 7
- **Then**: the stacked debuff (−40% speed) activates at count 7 (shifted from default 5)

---

## Penalty Type 4 — Staff Warning Mitigation: VIP Status

### Test: VIP Status replaces the Staff Warning debuff with a speed buff
- **Given**: the player owns VIP Status and the Staff Warning counter reaches the debuff threshold
- **When**: the debuff would normally activate
- **Then**: a positive speed buff is applied instead of a negative debuff

### Test: VIP Status speed buff applies to all timed actions
- **Given**: the player owns VIP Status and the Staff Warning counter is at the threshold
- **When**: the player performs any timed action
- **Then**: the action completes faster than baseline (the buff magnitude is [TUNE])

---

## Penalty Type 5 — Grill Fire (🔥)

### Test: Grill Fire triggers when burnt meat is left on the grill too long
- **Given**: a piece of meat has transitioned to the burnt state and remains on its slot
- **When**: the meat has been in the burnt state for more than [TUNE] seconds without the player acting
- **Then**: a Grill Fire triggers on that slot

### Test: Grill Fire disables the affected grill slot for 10 seconds
- **Given**: a Grill Fire has triggered on slot 2
- **When**: the fire starts
- **Then**: slot 2 cannot receive new dishes or be interacted with for 10s [TUNE]

### Test: Grill Fire slot disability begins immediately when the fire triggers
- **Given**: a Grill Fire has just triggered on a slot
- **When**: the fire event fires
- **Then**: the slot is immediately marked as unavailable

### Test: Grill Fire slot becomes available again after 10 seconds
- **Given**: a Grill Fire disabled slot 2 at time T
- **When**: time T + 10s is reached
- **Then**: slot 2 becomes available again and can receive a new dish

### Test: Grill Fire can trigger game over if escalated (left unattended > 15 seconds)
- **Given**: the game is at or past the High-End restaurant stage (Grill Fire game-over condition is unlocked) and a Grill Fire has been burning for more than 15s unattended [TUNE]
- **When**: the 15s escalation timer elapses
- **Then**: game over is triggered

### Test: Grill Fire escalation game-over condition is NOT active before High-End restaurants
- **Given**: the player is in a Chain or Local restaurant (before High-End unlocks the Grill Fire game-over)
- **When**: a Grill Fire triggers and is left unattended for more than 15s
- **Then**: game over is NOT triggered by the Grill Fire escalation (the condition is not yet active)

### Test: multiple simultaneous Grill Fires can occur on separate slots
- **Given**: two slots each have burnt meat that has been left too long
- **When**: both Grill Fires trigger
- **Then**: both slots are independently disabled for 10s each

---

## Penalty Type 5 — Grill Fire Mitigation: Fire Control

### Test: Fire Control halves the Grill Fire slot-disable duration from 10s to 5s
- **Given**: the player owns Fire Control and a Grill Fire triggers
- **When**: the fire starts
- **Then**: the slot is disabled for 5 seconds (not 10s)

### Test: Fire Control auto-extinguishes the fire at 5 seconds
- **Given**: the player owns Fire Control and a Grill Fire is active
- **When**: 5 seconds elapse from the fire start
- **Then**: the fire automatically extinguishes and the slot becomes available without player action

### Test: Fire Control does not prevent Grill Fire from triggering — it only mitigates duration
- **Given**: the player owns Fire Control and burnt meat is left on the grill beyond the trigger threshold
- **When**: the Grill Fire trigger condition is met
- **Then**: the fire still triggers; Fire Control only shortens the disable duration to 5s

### Test: Fire Control auto-extinguish at 5s prevents the 15s escalation game-over
- **Given**: the player owns Fire Control, a Grill Fire triggers at time T, and the game-over escalation threshold is 15s
- **When**: 5s elapses (auto-extinguish fires)
- **Then**: the slot is restored and the escalation timer stops well before 15s — game over via escalation cannot occur for this fire

---

## Staff Warning Counter — Behavior and State Management

### Test: Staff Warning counter starts at 0 at the beginning of each run
- **Given**: a new run has started
- **When**: the first restaurant begins
- **Then**: the Staff Warning counter is exactly 0

### Test: Staff Warning counter persists across restaurants within a run (not reset between restaurants)
- **Given**: the Staff Warning counter is at 2 at the end of restaurant 1
- **When**: restaurant 2 begins
- **Then**: the Staff Warning counter starts restaurant 2 at 2 (not reset)

### Test: Staff Warning counter resets to 0 at a Rest node
- **Given**: the Staff Warning counter is at 4 (debuff active)
- **When**: the player selects Rest at a node
- **Then**: the counter resets to 0 and the speed debuff is deactivated

### Test: Staff Warning counter of 0 after Rest means no debuff is active
- **Given**: the player has just taken Rest (counter reset to 0)
- **When**: the next restaurant begins
- **Then**: no speed debuff is active

### Test: staff Warning debuff deactivates immediately when counter drops below threshold via Regular Customer skill
- **Given**: the Staff Warning counter is at 3 (−20% debuff active) and the player owns Regular Customer
- **When**: a restaurant is cleared (counter decreases from 3 to 2)
- **Then**: the −20% speed debuff is deactivated because the counter is now below the threshold

### Test: Staff Warning counter at count 3 (debuff active) — further discards increase count and maintain debuff
- **Given**: the Staff Warning counter is at 3 (debuff active) and the player discards a dish
- **When**: the counter increments from 3 to 4
- **Then**: the −20% speed debuff remains active (threshold was already crossed; additional discards do not trigger a second debuff until count 5)

### Test: Staff Warning counter reaching 5 applies stacked −40% debuff
- **Given**: the Staff Warning counter is at 4 (−20% debuff active)
- **When**: the counter increments to 5
- **Then**: the speed debuff becomes −40%

### Test: Staff Warning counter resets correctly via Rest even when stacked debuff is active
- **Given**: the Staff Warning counter is at 5 (−40% debuff active)
- **When**: the player takes Rest
- **Then**: the counter resets to 0, both the −20% and −40% layers are cleared, and processing speed returns to baseline

---

## Cross-Penalty Interactions and Edge Cases

### Test: multiple active penalties can compound (Raw Meat disable + Staff Warning speed debuff)
- **Given**: the player has a −20% speed debuff from Staff Warning AND then eats raw meat
- **When**: the raw meat penalty triggers the 3s action disable
- **Then**: both penalties are independently active — the disable lasts 3s, and the speed debuff remains throughout

### Test: Rest clears all active penalties simultaneously
- **Given**: the player has Burnt Smoke, Raw Meat paralysis (if mid-restaurant — edge case for node timing), and Staff Warning −40% all active
- **When**: the player takes Rest
- **Then**: all three are cleared at once

### Test: Grill Fire and Raw Meat paralysis together can create a cascading overflow risk
- **Given**: one slot is disabled by Grill Fire (10s) and the player is in a 3s Raw Meat action disable simultaneously
- **When**: new dishes arrive during this overlap
- **Then**: the table receives dishes normally; if the table reaches capacity during the overlap, game over triggers via table overflow — the system does not special-case this combination

### Test: Discard Pro + Tare Conversion together prevent all Discard Loss penalties while granting coins
- **Given**: the player owns both Discard Pro and Tare Conversion
- **When**: the player discards any number of meat dishes
- **Then**: the Staff Warning counter never increments due to discards (Discard Pro), and coins are granted per discard (Tare Conversion)

### Test: penalty system enforces staged unlocks for non-character-specific conditions
- **Given**: the player is in a Chain restaurant (first restaurant of the game)
- **When**: burnt meat is left unattended for >15s
- **Then**: game over via Grill Fire escalation does NOT trigger (this condition is only active from High-End restaurants onward)

### Test: Raw Food Advocate's burn instant-game-over is NOT governed by staged unlock rules
- **Given**: the player is playing as Raw Food Advocate in a Chain restaurant (before the High-End stage)
- **When**: any piece of meat burns
- **Then**: game over triggers immediately — the character-specific rule bypasses the staged unlock system entirely

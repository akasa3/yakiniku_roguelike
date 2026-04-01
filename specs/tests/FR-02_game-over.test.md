# Test: FR-02 Game Over Conditions

> t_wada TDD-style specification — Red phase.
> These tests define expected behavior BEFORE implementation.
> Reference: GAME_DESIGN.md §6, §3.4, §5; requirements.md FR-02.

---

## Condition 1: Table Overflow (Active from Start)

### Test: table overflow triggers game over when a new dish arrives and the table is full
- **Given**: the table holds the maximum of 5 dishes (no Table Extension skill); all 3 grill slots are occupied; a 6th dish is due to be served
- **When**: the serving interval fires and a new dish is generated
- **Then**: game over is triggered immediately; the run ends; the score screen is shown

### Test: table overflow does NOT trigger when the table has at least one free slot
- **Given**: the table currently holds 4 of 5 dishes
- **When**: a new dish is served
- **Then**: the dish is placed on the table (count = 5); game over is NOT triggered

### Test: table overflow threshold is exactly at limit + 1 arrival
- **Given**: the table holds exactly 5 dishes (at capacity)
- **When**: a new dish arrives
- **Then**: game over triggers; the dish that caused the overflow is the 6th item attempting to enter

### Test: Table Extension skill raises the overflow threshold
- **Given**: the player has the Table Extension skill (capacity = 5 + 3 = 8); the table holds 8 dishes; all grill slots are full
- **When**: a 9th dish arrives
- **Then**: game over triggers at the 9th dish (not the 6th)

### Test: table overflow is active at Chain restaurants (first restaurant of any run)
- **Given**: the run has just started; the player is in a Chain restaurant (cycle 1, restaurant 1)
- **When**: the table exceeds its capacity limit
- **Then**: game over triggers; this condition is always active from the first restaurant

### Test: freeing a grill slot prevents overflow if the table was at capacity
- **Given**: all 3 grill slots are full; the table holds 5 dishes; a new dish has NOT yet arrived
- **When**: the player eats a piece of meat (freeing a slot), which pulls a dish from the table; then the next serving interval fires
- **Then**: the table now holds 4 dishes and can receive the new dish without overflowing

---

## Condition 2: Grill Fire Escalation (Active from High-End Onward)

### Test: grill fire escalation triggers game over when burnt meat is left unattended for more than 15 seconds
- **Given**: the player is at a High-End restaurant (or later); a piece of meat has transitioned to `burnt` and has been on the grill for exactly 15 seconds since burning
- **When**: 1 more second elapses (total 16 seconds in burnt state)
- **Then**: game over is triggered

### Test: grill fire escalation does NOT trigger at exactly 15 seconds
- **Given**: a burnt piece of meat has been on the grill for exactly 15 seconds
- **When**: the state is evaluated at the 15-second mark
- **Then**: game over is NOT yet triggered; the player still has an opportunity to discard

### Test: discarding burnt meat before 15 seconds prevents grill fire escalation
- **Given**: a piece of meat has been burnt for 12 seconds
- **When**: the player discards it
- **Then**: the grill fire escalation timer is cleared; game over is NOT triggered

### Test: grill fire escalation is NOT active at Chain restaurants
- **Given**: the player is at a Chain restaurant (regardless of cycle)
- **When**: a piece of meat burns and remains on the grill for more than 15 seconds
- **Then**: game over is NOT triggered by the grill fire escalation condition (only table overflow applies)

### Test: grill fire escalation is NOT active at Local restaurants
- **Given**: the player is at a Local restaurant (regardless of cycle)
- **When**: a piece of meat burns and remains on the grill for more than 15 seconds
- **Then**: game over is NOT triggered by the grill fire escalation condition

### Test: grill fire escalation IS active at High-End restaurants
- **Given**: the player is at a High-End restaurant
- **When**: a piece of meat burns and remains on the grill for more than 15 seconds
- **Then**: game over is triggered by grill fire escalation

### Test: grill fire escalation IS active at Boss restaurants
- **Given**: the player is at a Boss restaurant
- **When**: a piece of meat burns and remains on the grill for more than 15 seconds
- **Then**: game over is triggered (grill fire escalation is active in addition to table overflow and raw paralysis overflow)

### Test: grill fire escalation IS active in all later cycles once unlocked
- **Given**: the player is in cycle 2 at a Chain restaurant
- **When**: a piece of meat burns and remains for 16+ seconds
- **Then**: game over is triggered (grill fire escalation unlocks at High-End restaurant type, not per-cycle — it stays active for all subsequent Chain/Local restaurants too)

> NOTE: Implementation must clarify whether staged unlock is per-restaurant-type-ever-seen or per-current-restaurant-type. This test captures the most natural reading: once the player has seen a High-End restaurant, the condition becomes permanently active. This should be confirmed during implementation.

### Test: each burnt grill slot tracks its own 15-second escalation timer independently
- **Given**: two grill slots each hold burnt meat; slot A has been burnt for 10s, slot B for 14s
- **When**: 1 more second elapses
- **Then**: slot B's timer reaches 15s (no game over yet at exact threshold); both timers are independent

---

## Condition 3: Raw Paralysis Overflow (Active from Boss Onward)

### Test: raw paralysis overflow triggers game over via chain reaction
- **Given**: the player is at a Boss restaurant; the player eats raw meat (3s action disable begins); during the 3s window, the table is at 4 dishes with all grill slots full; a new dish arrives
- **When**: the new dish arrives while the player is action-disabled (cannot eat/discard to free a slot)
- **Then**: the table overflows (5+1 = 6 dishes); game over is triggered

### Test: raw paralysis overflow does NOT directly trigger game over — overflow does
- **Given**: the player is at a Boss restaurant; the player eats raw meat (action disabled for 3s)
- **When**: no dish arrives during the 3s disable window (no overflow occurs)
- **Then**: game over is NOT triggered by raw paralysis alone; the run continues normally after the disable expires

### Test: raw paralysis overflow is NOT active at Chain restaurants
- **Given**: the player is at a Chain restaurant (cycle 1)
- **When**: the player eats raw meat, is action-disabled, and a dish arrives to overflow the table
- **Then**: table overflow game over triggers (that condition IS active), but the raw paralysis overflow condition is not independently active; the net result is still game over via table overflow (conditions are cumulative in effect, but the raw paralysis condition as described is about it enabling overflow — at a Chain the result is the same via condition 1)

> NOTE: This test highlights that at a Chain restaurant, table overflow is still active; the distinction is that raw paralysis overflow is the specific staged condition at Boss, making it the new introduced danger. The raw paralysis disable can cause overflow at any restaurant; the staged label means the Boss is when raw meat eating becomes a named escalation condition.

### Test: raw paralysis overflow IS active as a named condition at Boss restaurants
- **Given**: the player is at a Boss restaurant; the table holds 4 dishes; all 3 grill slots are full
- **When**: the player eats raw meat (3s action disable) AND a new dish is served within the disable window
- **Then**: table capacity is exceeded; game over triggers; the cause is logged/displayed as raw paralysis overflow

### Test: Raw Tolerance skill reduces the action-disable window, shrinking the overflow risk window
- **Given**: the player has Raw Tolerance (raw meat penalty duration −70%); the raw meat penalty duration is normally 3s
- **When**: the player eats raw meat
- **Then**: the action-disable duration is 0.9s (3s × 0.30 = 0.9s); the window during which a new dish can cause overflow is shorter

### Test: Iron Stomach skill fully negates raw meat action disable
- **Given**: the player has Iron Stomach
- **When**: the player eats raw meat
- **Then**: no action-disable occurs; raw paralysis overflow is impossible

---

## Condition 4: Raw Food Advocate Instant Burn (Always Active, Character-Specific)

### Test: burning any meat triggers immediate game over for Raw Food Advocate
- **Given**: the player is playing as Raw Food Advocate; a piece of meat is in the `well-done` state (transitioning toward burnt)
- **When**: the meat transitions to the `burnt` state
- **Then**: game over is triggered immediately; the run ends; no 15-second escalation window applies

### Test: Raw Food Advocate game over triggers in a Chain restaurant (ignores staged unlock)
- **Given**: the player is Raw Food Advocate at a Chain restaurant (cycle 1, restaurant 1)
- **When**: a piece of meat burns
- **Then**: game over triggers immediately; the staged unlock rules for other conditions are irrelevant for this condition

### Test: Raw Food Advocate game over triggers regardless of which meat burns
- **Given**: the player is Raw Food Advocate; any meat part (Kalbi, Beef Tongue, Chateaubriand, etc.) or vegetable reaches `burnt`
- **When**: the transition to `burnt` completes
- **Then**: game over triggers immediately

### Test: Raw Food Advocate instant burn triggers on the first burnt item, not after any delay
- **Given**: the player is Raw Food Advocate; a piece of Kalbi (5s per state) has been in `well-done` for 4.9 seconds
- **When**: the 5th second elapses and the state becomes `burnt`
- **Then**: game over triggers at the moment of the `burnt` transition; there is no grace period

### Test: Raw Food Advocate's Iron Stomach does NOT prevent the instant burn rule
- **Given**: the player is Raw Food Advocate (starter skill: Iron Stomach, which negates raw meat penalty)
- **When**: a piece of meat burns
- **Then**: Iron Stomach has no effect on the burnt condition; game over still triggers immediately

### Test: Raw Food Advocate game over is independent of grill fire escalation unlock
- **Given**: the player is Raw Food Advocate at a Local restaurant (where grill fire escalation is NOT yet unlocked for other characters)
- **When**: meat burns
- **Then**: game over triggers immediately via the character-specific rule, not via the standard grill fire escalation condition

---

## Staged Unlock Rules — Summary Verification

### Test: at a Chain restaurant only table overflow is a game over condition (non-Raw-Food-Advocate)
- **Given**: the player is any character except Raw Food Advocate; the restaurant is a Chain type
- **When**: grill fire lasts 20s AND raw paralysis + table pressure occurs but table does NOT overflow
- **Then**: game over does NOT trigger from grill fire or raw paralysis overflow; ONLY a table overflow (if triggered) causes game over

### Test: at a Local restaurant table overflow and grill fire escalation are NOT both active
- **Given**: the player is at a Local restaurant
- **When**: evaluating active game-over conditions
- **Then**: only table overflow is active; grill fire escalation is NOT yet a game over condition (unlocks at High-End)

### Test: at a High-End restaurant both table overflow and grill fire escalation are active
- **Given**: the player is at a High-End restaurant
- **When**: evaluating active game-over conditions
- **Then**: table overflow AND grill fire escalation (>15s burnt) are both active game-over conditions; raw paralysis overflow is NOT yet active

### Test: at a Boss restaurant all three standard conditions plus character-specific condition are potentially active
- **Given**: the player is Raw Food Advocate at a Boss restaurant
- **When**: evaluating active game-over conditions
- **Then**: all four conditions are active: table overflow, grill fire escalation, raw paralysis overflow, and instant burn

### Test: non-Raw-Food-Advocate character does not have instant burn condition at any restaurant
- **Given**: the player is Salaryman Tanaka at a Boss restaurant
- **When**: a piece of meat burns and stays for 12 seconds
- **Then**: game over is NOT triggered (grill fire escalation only triggers at >15s); no instant burn rule applies

---

## Staff Warning (Not a Game Over — Verification)

### Test: Staff Warning counter reaching 3 does not cause game over
- **Given**: the player's Staff Warning counter is at 2; the player discards a dish (counter → 3)
- **When**: the counter reaches 3
- **Then**: the Staff Warning debuff activates (processing speed −20%); game over is NOT triggered

### Test: Staff Warning counter at 5 does not cause game over
- **Given**: the player's Staff Warning counter is at 4; the player discards a dish (counter → 5)
- **When**: the counter reaches 5
- **Then**: the debuff stacks (processing speed −40%); game over is NOT triggered; the run continues

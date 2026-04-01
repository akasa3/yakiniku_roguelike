# Test: FR-09 Score and Persistence

> t_wada TDD-style spec — defines expected behavior BEFORE implementation (Red phase).
> Source references: GAME_DESIGN.md §1, §11, §13; requirements.md FR-09, FR-06.

---

## Score Definition

### Test: score equals the number of restaurants cleared in a single run
- **Given**: a player has cleared 7 restaurants before getting a game over
- **When**: the game over screen is displayed
- **Then**: the score shown is 7; score is not derived from coins, time, meat quality, or any other metric (GDD §1: "Score = total number of restaurants cleared in one run"; requirements FR-09)

### Test: score increments by exactly 1 per restaurant cleared
- **Given**: the player's current score is 4
- **When**: the player clears the next restaurant (all required dishes eaten, no game over)
- **Then**: the score becomes 5; it increments by exactly 1, not by dish count, coin amount, or restaurant type weight

### Test: score does not increment on game over within a restaurant
- **Given**: the player has a score of 3 and is in their 4th restaurant
- **When**: a game-over condition is triggered before clearing the 4th restaurant
- **Then**: the final score is 3, not 4; a restaurant that is not cleared does not add to the score

### Test: score does not increment when visiting a node (Shop or Rest)
- **Given**: the player has cleared 2 restaurants and is at a node
- **When**: the player completes the node interaction (purchases at Shop, or rests)
- **Then**: the score remains 2; node visits do not count as restaurant clears

### Test: score is visible to the player during a run
- **Given**: the player is mid-run
- **When**: the player looks at the game UI
- **Then**: the current score (restaurants cleared so far) is visible on screen

---

## High Score Saved to localStorage

### Test: high score is saved to localStorage after a run ends
- **Given**: the player completes a run with a score of 8; no previous high score exists
- **When**: the game over screen is displayed
- **Then**: a high score value of 8 is written to localStorage under a defined key (e.g., `highScore`)

### Test: high score is updated when a new run exceeds the previous high score
- **Given**: the current localStorage high score is 5; the player completes a run with score 9
- **When**: the game over screen is displayed
- **Then**: the localStorage high score is updated to 9

### Test: high score is NOT updated when a new run is less than or equal to the previous high score
- **Given**: the current localStorage high score is 10; the player completes a run with score 7
- **When**: the game over screen is displayed
- **Then**: the localStorage high score remains 10; it is not overwritten with 7

### Test: high score is retrieved from localStorage and displayed on game start
- **Given**: localStorage contains a high score of 12
- **When**: the title screen or main menu is loaded
- **Then**: the high score of 12 is displayed to the player

### Test: missing high score localStorage key is handled gracefully
- **Given**: localStorage has no high score key (fresh install or cleared storage)
- **When**: the title screen is loaded
- **Then**: the high score displays as 0, "—", or an equivalent "no record" state; no error or crash occurs

### Test: high score persists after browser close and reopen
- **Given**: the player achieves a high score of 6, which is written to localStorage
- **When**: the browser is closed completely and reopened to the game URL
- **Then**: the high score of 6 is still displayed; localStorage was not cleared by browser close

---

## Per-Run State Resets

### Test: score resets to 0 at the start of each new run
- **Given**: the player finished a previous run with score 5 and starts a new run
- **When**: the first restaurant of the new run begins
- **Then**: the current score counter is 0; restaurants cleared in the new run are counted from 0

### Test: skills reset at the start of each new run
- **Given**: the player acquired Tong Master and Heat Sensor in a previous run
- **When**: the player starts a new run (regardless of character choice)
- **Then**: only the character's starter skill is active; previously acquired skills are not carried over (requirements FR-09: "Per-run state (score, skills, coins) resets")

### Test: coins reset to 0 at the start of each new run
- **Given**: the player ended a previous run with 45 unspent coins
- **When**: the player starts a new run
- **Then**: the coin balance begins at 0; leftover coins from the previous run are not carried over (requirements FR-09)

### Test: per-run state reset does not affect high score
- **Given**: localStorage high score is 7; the player starts a new run
- **When**: the new run begins
- **Then**: the high score in localStorage remains 7; only the current-run score counter is reset to 0

### Test: per-run state reset does not affect catalog unlocks
- **Given**: the player had unlocked 5 catalog entries in a previous run
- **When**: a new run starts
- **Then**: all 5 previously unlocked catalog entries remain unlocked; catalog data is not per-run state

### Test: per-run state reset does not affect character unlocks
- **Given**: the player unlocked Gourmet Critic in a previous run
- **When**: a new run starts
- **Then**: Gourmet Critic is still listed as unlocked and selectable; character unlock data is not per-run state (requirements FR-09)

### Test: Staff Warning counter resets at the start of each new run
- **Given**: the player ended the previous run with a Staff Warning counter of 4
- **When**: the player starts a new run
- **Then**: the Staff Warning counter begins at 0 in the new run

---

## Character Unlocks Persist Across Runs

### Test: character unlocks are saved to localStorage
- **Given**: the player clears a run with Salaryman Tanaka, unlocking Gourmet Critic and Competitive Eater
- **When**: the run ends and the game over / clear screen is displayed
- **Then**: the unlock state for Gourmet Critic and Competitive Eater is written to localStorage

### Test: unlocked characters remain selectable after browser close and reopen
- **Given**: Gourmet Critic is saved as unlocked in localStorage
- **When**: the browser is closed and reopened
- **Then**: Gourmet Critic is still listed as selectable in the character select screen; the unlock was not lost

### Test: locked characters cannot be selected before their unlock condition is met
- **Given**: Raw Food Advocate (生食主義者) requires clearing a run with any Specialist; no Specialist run has been cleared yet
- **When**: the player views the character select screen
- **Then**: Raw Food Advocate is shown as locked (greyed out, padlock icon, or equivalent); selecting it is not possible

### Test: unlocking a character does not reset previously unlocked characters
- **Given**: Gourmet Critic is already unlocked in localStorage; the player then clears a run with a Specialist, unlocking Raw Food Advocate
- **When**: the character select screen is displayed
- **Then**: both Gourmet Critic AND Raw Food Advocate are shown as unlocked; previously earned unlocks are preserved

### Test: clearing localStorage resets all character unlocks (expected behavior)
- **Given**: Gourmet Critic and Competitive Eater are unlocked in localStorage
- **When**: localStorage is cleared
- **Then**: both characters revert to locked state on next page load; only Salaryman Tanaka is available

### Test: Salaryman Tanaka is always available without any unlock condition
- **Given**: fresh game state with empty localStorage
- **When**: the player views the character select screen
- **Then**: Salaryman Tanaka (サラリーマン田中) is immediately selectable; no prior action is required (requirements FR-06)

---

## "Clearing the Game" — True Ending (Cycle 4 Boss)

### Test: defeating the Boss restaurant of Cycle 4 triggers the True Ending
- **Given**: the player has completed Cycle 1 through 3 fully and is in Cycle 4
- **When**: the player clears the Boss restaurant (4th restaurant) of Cycle 4
- **Then**: the True Ending sequence is triggered (GDD §11: "defeating the Boss restaurant of Cycle 4, which triggers the True Ending"; requirements FR-06: "Clearing the game = defeating the Boss restaurant of Cycle 4")

### Test: True Ending displays the specific ending text
- **Given**: the True Ending sequence is triggered
- **When**: the True Ending screen is shown
- **Then**: the text *"You wake up. The kalbi in front of you has gone cold."* is displayed (GDD §13)

### Test: True Ending counts as a run clear for character unlock purposes
- **Given**: the player clears the game (Boss of Cycle 4) as Salaryman Tanaka
- **When**: the True Ending screen resolves and the game returns to the title
- **Then**: Gourmet Critic and Competitive Eater are now unlocked (requirements FR-06 unlock conditions for Specialists)

### Test: clearing Cycle 1–3 Boss does not trigger the True Ending
- **Given**: the player clears the Boss restaurant of Cycle 1, 2, or 3
- **When**: the post-boss flow executes
- **Then**: no True Ending triggers; the game continues into the next cycle; score increments by 1 normally

### Test: score at True Ending equals the number of restaurants cleared across all 4 cycles
- **Given**: each cycle has 4 restaurants (Chain, Local, High-End, Boss); the player clears all of Cycles 1–4 without game over
- **When**: the True Ending fires
- **Then**: the score is 16 (4 restaurants × 4 cycles); this is saved as the high score if it exceeds the previous record

### Test: game over on the Cycle 4 Boss without clearing does NOT trigger the True Ending
- **Given**: the player reaches the Cycle 4 Boss restaurant but triggers a game over mid-restaurant
- **When**: the game over screen is displayed
- **Then**: no True Ending fires; score reflects restaurants cleared so far (15 restaurants cleared, Boss not completed); unlock conditions from True Ending are not applied

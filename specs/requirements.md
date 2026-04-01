# Requirements: Yakiniku Roguelike — "Solo BBQ Dungeon"

> April Fools' Day 2026 project. A real-time roguelike game set in an all-you-can-eat yakiniku (Japanese BBQ) restaurant.

---

## Project Overview

| Item | Detail |
|---|---|
| Genre | Real-time roguelike |
| Theme | Solo all-you-can-eat yakiniku |
| Platform | Browser (GitHub Pages) |
| Tech Stack | TypeScript + React + Vite |
| Target | April Fools' Day 2026 release |

---

## Core Concept

The player visits a series of yakiniku restaurants in an endless chain. Each restaurant serves a fixed number of meat dishes; the player must grill and eat all of them before the table overflows. The game ends when the player fails a restaurant. **Score = number of restaurants cleared.**

Between restaurants, the player chooses a node (Shop or Rest) to build their character.

---

## Functional Requirements

### FR-01: Core Gameplay Loop

- Restaurants serve meat dishes automatically to grill slots at a rate determined by restaurant rank.
- Vegetables (ピーマン・なす) are also served automatically, mixed into the serving queue in all restaurants.
- Meat and vegetables are placed directly onto available grill slots; there is no manual Order action.
- Meat progresses through grilling states over time: `raw → rare → medium → well-done → burnt`. Vegetables follow the same states but have no flare_risk.
- The player must act on each piece of meat/vegetable: **eat**, **discard**, or (if skill unlocked) **flip**.
- Vegan Tashiro can **exchange** a meat dish for a vegetable via: Instant Exchange (spend coins) or Delayed Exchange (grill slot occupied for a set time).
- A restaurant is cleared when all served meat dishes have been eaten.
- The game ends (game over) when any game-over condition is triggered.

### FR-02: Game Over Conditions (staged unlock)

| Condition | Trigger | Unlocks at |
|---|---|---|
| Table overflow | Ungrilled dishes on table exceed the limit | From start |
| Grill fire | Burnt meat left on grill too long | High-end restaurant |
| Raw meat paralysis | Raw meat eaten → temporary action disable → overflow | Boss restaurant |
| Raw Food Advocate: Grill fire | Burning any meat → immediate game over | Always active (character-specific) |

> Discarding too many dishes triggers a **Staff Warning debuff** (processing speed down), not immediate game over.

### FR-03: Restaurant Progression

- Restaurants appear in a fixed cycle: **Chain → Local → High-End → Boss**, then repeat.
- Each cycle increases difficulty (stricter grilling windows + faster serving speed), capped at cycle 5 for difficulty, cycle 3 for speed.
- Dishes per restaurant: Chain=8, Local=12, High-End=10, Boss=15 [TUNE]
- Serving intervals: Chain=8s, Local=6s, High-End=5s, Boss=3s [TUNE]
- Meat rank distribution per restaurant type:

| Restaurant | Common (並) | Upper (上) | Premium (特上) | Elite (極) |
|---|---|---|---|---|
| Chain (チェーン) | 100% | — | — | — |
| Local (個人店) | 40% | 60% | — | — |
| High-End (高級店) | — | 30% | 70% | — |
| Boss (ボス) | — | — | 40% | 60% |

### FR-04: Node System

- After each restaurant, the player chooses a node: **Shop** or **Rest**.
- Node frequency decreases as cycles progress:
  - Cycle 1: node after every restaurant
  - Cycle 2: node after every 2 restaurants
  - Cycle 3+: node after every 3 restaurants (fixed floor)
- **Rest**: resets all active debuffs and staff warning counter.
- **Shop**: spend coins to purchase skills or consumable items.

### FR-05: Skill System

- Skills are acquired by:
  1. Choosing 1 of 3 random options after clearing a restaurant.
  2. Purchasing from the Shop using coins.
- Skills modify core mechanics (grill timing, eating speed, slot count, penalty reduction, etc.).
- See `GAME_DESIGN.md` for the full skill list.

### FR-06: Character Selection

- Player selects a character at game start. Each has a different starting skill and playstyle.
- Characters are progressively unlocked by clearing the game with previous characters.
- **"Clearing the game"** = defeating the Boss restaurant of Cycle 4 (triggers the True Ending).

| # | Character | Type | Unlock Condition |
|---|---|---|---|
| 1 | Salaryman Tanaka (サラリーマン田中) | Balanced | Available from start |
| 2 | Gourmet Critic (グルメ評論家) | Specialist | Clear with Tanaka |
| 3 | Competitive Eater (大食い選手) | Specialist | Clear with Tanaka |
| 4 | Raw Food Advocate (生食主義者) | Peaky | Clear with any Specialist |
| 5 | Vegan Tashiro (ヴィーガン田代) | Peaky | Clear with any Specialist |

### FR-07: Coin Economy

- Coins are a currency **separate from score**.
- **Base income**: fixed coins awarded on every restaurant clear, equal for all builds and playstyles.
- **Build income**: each build has 1–2 dedicated coin-generating skills in the skill pool. When acquired, these skills trigger on actions natural to that build (e.g., eating rare meat for Raw Rush, eating well-done for Precision).- Spent at: Shop nodes.
- Coins do NOT affect the final score.
- Target balance: with a matching build skill active, total coins per restaurant ≈ 1.5–2× base income. [TUNE]

### FR-08: Meat Catalog (図鑑)

- Each meat part is unlocked in the catalog the first time it is eaten.
- Each entry includes a humorous April Fools' flavor text.

### FR-09: Score & Persistence

- Score = number of restaurants cleared in a single run.
- High score is saved locally (localStorage).
- Per-run state (score, skills, coins) resets on each new run.
- Character unlocks persist across runs (stored in localStorage).

---

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Runs entirely in the browser with no backend |
| NFR-02 | Deployable to GitHub Pages as a static site |
| NFR-03 | Playable on both desktop and mobile browsers |
| NFR-04 | No external API calls required for core gameplay |
| NFR-05 | Initial load time under 3 seconds on a standard connection |

---

## Out of Scope (for initial release)

- Online leaderboard (may be added later via Supabase or similar)
- Multiplayer
- Event nodes (random encounters) — removed from scope to reduce complexity
- Boss restaurant special rules — TBD, to be added after core loop is stable
- Shop inventory details and coin quantity balance — TBD, to be tuned during implementation

---

## Reference

See `GAME_DESIGN.md` for full game mechanics specification including:
- All meat parts and parameters
- Full skill list (draft)
- Detailed penalty mechanics
- Character ability details

# CLAUDE.md

## Project Overview

**Yakiniku Roguelike — "Solo BBQ Dungeon"**
An April Fools' Day 2026 browser game. Real-time roguelike set in an all-you-can-eat Japanese BBQ restaurant. The player grills and eats meat dishes served by the restaurant; the run ends when the player fails. Score = restaurants cleared.

- Full game spec: [`GAME_DESIGN.md`](./GAME_DESIGN.md)
- Functional requirements: [`requirements.md`](./requirements.md)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Framework | React |
| Build tool | Vite |
| Deployment | GitHub Pages |
| Package manager | npm |

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run typecheck    # Run tsc --noEmit
npm run lint         # Run ESLint
npm test             # Run Vitest
```

Always run `typecheck` and `lint` after a series of code changes.

---

## Project Structure

```
src/
  components/     # React UI components
  game/           # Core game logic (no React dependencies)
    engine/       # Game loop, state machine
    data/         # Meat, skill, character definitions (typed constants)
    systems/      # Grilling, penalty, restaurant, node systems
  hooks/          # Custom React hooks bridging game logic and UI
  types/          # Shared TypeScript types and interfaces
  utils/          # Pure utility functions
public/           # Static assets
```

Keep game logic in `src/game/` fully decoupled from React. UI reads game state via hooks; it does not modify game state directly.

---

## Spec Files

### Game Design
- [`specs/GAME_DESIGN.md`](./specs/GAME_DESIGN.md) — Full game mechanics specification
- [`specs/requirements.md`](./specs/requirements.md) — Functional and non-functional requirements
- [`specs/DEVELOPMENT_PROCESS.md`](./specs/DEVELOPMENT_PROCESS.md) — Development process and TDD workflow

### Spec Tests (`specs/tests/`) — Design validation checklists
| File | Validates |
|------|-----------|
| `FR-01_core-gameplay.test.md` | Grilling states, player actions, serving, clearing |
| `FR-02_game-over.test.md` | 4 game-over conditions, staged unlock |
| `FR-03_restaurant-progression.test.md` | Restaurant cycle, difficulty scaling, rank distribution |
| `FR-04_node-system.test.md` | Node frequency, rest/shop effects |
| `FR-05_skill-system.test.md` | Skill acquisition, 24 skill effects, interactions |
| `FR-06_character-selection.test.md` | 5 characters, unlock conditions, Vegan exchange |
| `FR-07_coin-economy.test.md` | Base/build income, shop costs, balance |
| `FR-08_meat-catalog.test.md` | Catalog unlock, persistence, display |
| `FR-09_score-persistence.test.md` | Score, high score, localStorage, True Ending |
| `DATA_meat-and-sides.test.md` | 11 meats + 2 vegetables, numeric params |
| `DATA_penalty-system.test.md` | 5 penalty types, mitigations, staff warning |
| `CROSS_consistency.test.md` | Cross-section consistency checks |

### Module Specs (`specs/modules/`) — Implementation blueprints
| File | Module | File Path |
|------|--------|-----------|
| `types.spec.md` | Shared types and interfaces | `src/types/index.ts` |
| `data-constants.spec.md` | Game-wide numeric constants | `src/game/data/constants.ts` |
| `data-meats.spec.md` | Meat and vegetable data | `src/game/data/meats.ts` |
| `data-characters.spec.md` | Character definitions | `src/game/data/characters.ts` |
| `data-restaurants.spec.md` | Restaurant definitions | `src/game/data/restaurants.ts` |
| `data-skills.spec.md` | Skill definitions | `src/game/data/skills.ts` |
| `system-grilling.spec.md` | Grilling state machine | `src/game/systems/grilling.ts` |
| `system-penalty.spec.md` | Penalty system | `src/game/systems/penalty.ts` |
| `system-restaurant.spec.md` | Restaurant flow | `src/game/systems/restaurant.ts` |
| `system-game-over.spec.md` | Game over conditions | `src/game/systems/game-over.ts` |
| `system-node.spec.md` | Node system | `src/game/systems/node.ts` |
| `system-skill.spec.md` | Skill system | `src/game/systems/skill.ts` |
| `system-economy.spec.md` | Coin economy | `src/game/systems/economy.ts` |
| `system-character.spec.md` | Character modifiers | `src/game/systems/character.ts` |
| `system-catalog.spec.md` | Meat catalog | `src/game/systems/catalog.ts` |
| `engine-game-loop.spec.md` | Game engine | `src/game/engine/game-loop.ts` |
| `util-persistence.spec.md` | localStorage persistence | `src/utils/persistence.ts` |

---

## Code Style

- Use ES modules (`import/export`), never CommonJS
- Prefer named exports over default exports (except React components and pages)
- Use `const` by default; `let` only when reassignment is necessary
- Define game data (meats, skills, characters) as `readonly` typed constants in `src/game/data/`
- All numeric game parameters should be defined as named constants, never as inline magic numbers
- Use `[TUNE]` comments to mark values that need balance tuning

---

## Architecture Rules

- **Game state is a plain object** — no classes, no inheritance in game logic
- **Immutable state updates** — always return new state; never mutate in place
- **No side effects in game logic** — `src/game/` functions must be pure and testable
- **Real-time loop** — use `requestAnimationFrame` or a fixed-interval ticker; do not use `setTimeout` chains for game timing
- Persistence via `localStorage` only (no backend required)

---

## Game Design Reference

All game mechanics, data definitions, and parameter values are specified in `GAME_DESIGN.md`. Functional requirements are in `requirements.md`. **Do not duplicate game design content here.**

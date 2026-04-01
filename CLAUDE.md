# CLAUDE.md

## Project Overview

**Yakiniku Roguelike — "Solo BBQ Dungeon" (ソロBBQダンジョン)**
An April Fools' Day 2026 browser game. Real-time roguelike set in an all-you-can-eat Japanese BBQ restaurant. The player grills and eats meat dishes served by the restaurant; the run ends when the player fails. Score = restaurants cleared.

- Full game spec: [`specs/GAME_DESIGN.md`](./specs/GAME_DESIGN.md)
- Functional requirements: [`specs/requirements.md`](./specs/requirements.md)
- Development process: [`specs/DEVELOPMENT_PROCESS.md`](./specs/DEVELOPMENT_PROCESS.md)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | React 19 |
| Build tool | Vite 6 |
| Testing | Vitest + @testing-library/react |
| Linting | ESLint + typescript-eslint |
| Deployment | GitHub Pages (via GitHub Actions) |
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
npm test             # Run Vitest (1413+ tests)
```

Always run `typecheck` and `lint` after a series of code changes.

---

## Project Structure

```
src/
  components/     # React UI components (9 screens)
  game/           # Core game logic (no React dependencies)
    engine/       # Game loop, state machine
    data/         # Meat, skill, character, restaurant definitions
    systems/      # Grilling, penalty, restaurant, node, economy, etc.
  hooks/          # Custom React hooks (useGameEngine, usePersistence)
  types/          # Shared TypeScript types and interfaces
  utils/          # Persistence (localStorage)
  __tests__/      # All tests (unit, component, e2e)
    components/   # React component tests (jsdom)
    hooks/        # Hook tests (jsdom)
specs/            # Game design docs and module specs
  modules/        # Per-module implementation blueprints
  tests/          # Design validation checklists
.github/
  workflows/      # GitHub Actions deployment
```

Keep game logic in `src/game/` fully decoupled from React. UI reads game state via hooks; it does not modify game state directly.

---

## Architecture

### Game State Flow

```
initGameState(characterId)
  → gameTick(state, deltaTime, random)    ← rAF loop (60fps)
  → processAction(state, action, slot)    ← user click
  → checkPhaseTransition(state)           ← after eat
```

All game functions are **pure** — they take state and return new state, never mutate.

### Phases

```
TitleScreen → playing → skill-select → node-select → playing → ... → true-ending
                ↓                                        ↓
            game-over                                game-over
```

### Key Systems

| System | File | Purpose |
|---|---|---|
| Grilling | `systems/grilling.ts` | State machine (raw→rare→medium→well-done→burnt), flare risk, flip |
| Penalty | `systems/penalty.ts` | Raw meat disable, staff warning, grill fire |
| Economy | `systems/economy.ts` | Coin awards (eat, discard, clear, streaks) |
| Restaurant | `systems/restaurant.ts` | Serving queue, clearing, advancement, difficulty scaling |
| Skill | `systems/skill.ts` | Skill acquisition, modifiers, slot expansion |
| Character | `systems/character.ts` | Character modifiers, Vegan exchange |
| Node | `systems/node.ts` | Rest/shop between restaurants |
| Game Over | `systems/game-over.ts` | 5 game-over conditions |
| Game Loop | `engine/game-loop.ts` | Orchestrates all systems |

### React Layer

| Hook | Purpose |
|---|---|
| `useGameEngine` | Central hook: owns GameState, rAF loop, action dispatchers |
| `usePersistence` | Loads/saves high score, unlocked characters, catalog |

---

## Game Mechanics Summary

### Characters (5)

| Character | Type | Starter Skill | Key Mechanic |
|---|---|---|---|
| Salaryman Tanaka | Balanced | Discard Pro | No warning on discard |
| Gourmet Critic | Specialist | Heat Sensor | Wider sweet spot on premium/elite |
| Competitive Eater | Specialist | Speed Eater | Faster eating (0.15s cooldown) |
| Raw Food Advocate | Peaky | Iron Stomach | No raw penalty, but burnt = instant death |
| Vegan Tashiro | Peaky | Exchange Discount | Exchange meat→veg, ×3 veg coins |

### Game Over Conditions

| Condition | Trigger | Active From |
|---|---|---|
| Table Overflow | Table exceeds capacity | All restaurants |
| Grill Fire | Burnt meat left >15s | High-End+ |
| Raw Paralysis | Action disabled + table overflow | Boss+ |
| Burnt Instant | Any meat burns | Raw Food Advocate only |
| Staff Kicked Out | Staff warning reaches 8 | All restaurants |

### Staff Warning (店員の怒り)

| Count | Effect |
|---|---|
| 0-2 | Normal |
| 3-4 | Visual warning (注意) |
| 5-7 | 1s eat cooldown (激怒) |
| 8 | Game Over — kicked out |

### Eat Cooldown

Every eat action has a cooldown:
- Base: 0.3s
- Staff angry (≥5): 1.0s
- Speed Eater skill: ×0.7 reduction
- Competitive Eater character: ×0.5 reduction

---

## Code Style

- Use ES modules (`import/export`), never CommonJS
- Prefer named exports over default exports (except App.tsx)
- Use `const` by default; `let` only when reassignment is necessary
- Define game data as `readonly` typed constants in `src/game/data/`
- All numeric game parameters as named constants, never inline magic numbers
- Use `[TUNE]` comments to mark values that need balance tuning
- UI text in Japanese (primary) with English subtitles where helpful

---

## Architecture Rules

- **Game state is a plain object** — no classes, no inheritance in game logic
- **Immutable state updates** — always return new state; never mutate in place
- **No side effects in game logic** — `src/game/` functions must be pure and testable
- **Real-time loop** — uses `requestAnimationFrame` with delta time capping (100ms max)
- Persistence via `localStorage` only (no backend)
- **rAF pauses during actions** — eat/discard pause the loop to prevent race conditions

---

## Testing

```bash
npm test                    # Run all 1413+ tests
npm test -- --reporter=verbose  # Verbose output
```

### Test Organization

| Directory | Count | Environment | Purpose |
|---|---|---|---|
| `__tests__/*.test.ts` | ~1100 | node | Game logic unit tests |
| `__tests__/components/` | ~80 | jsdom | React component tests |
| `__tests__/hooks/` | ~52 | jsdom | Hook tests |
| `__tests__/e2e-scenarios.test.ts` | ~30 | node | Integration scenarios |

### E2E Scenarios Cover

- Full restaurant clear for all 5 characters
- Burnt dish recovery (queue refill)
- Grill fire staging (chain=no fire, high-end=fire)
- Table overflow game over
- True Ending at cycle 4 boss
- Staff warning kicked out at 8
- Vegan exchange loop (delayed + instant)

---

## Deployment

- **GitHub Pages**: Auto-deploys on push to `main` via `.github/workflows/deploy.yml`
- **Base path**: `/yakiniku_roguelike/` (configured in `vite.config.ts`)
- **Local dev**: `npm run dev` → `http://localhost:5173/yakiniku_roguelike/`

---

## Spec Files Reference

### Game Design
- [`specs/GAME_DESIGN.md`](./specs/GAME_DESIGN.md) — Full game mechanics
- [`specs/requirements.md`](./specs/requirements.md) — Functional/non-functional requirements
- [`specs/DEVELOPMENT_PROCESS.md`](./specs/DEVELOPMENT_PROCESS.md) — TDD workflow

### Module Specs (`specs/modules/`)
Implementation blueprints for each module with function signatures, types, and behavioral contracts.

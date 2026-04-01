# Development Process: Yakiniku Roguelike

---

## 1. TDD Approach (t_wada Style)

This project follows spec-first TDD in the t_wada style. Tests are written as specifications — they define the expected behavior before any implementation exists.

**Phase order:**

```
Game Design (GAME_DESIGN.md)
  └─▶ Spec test docs (specs/tests/) — validate the design is consistent and complete
        └─▶ Module specs (specs/modules/) — define function signatures, types, constants
              └─▶ TypeScript tests (__tests__/) — Red (failing)
                    └─▶ Implementation — Green (passing)
                          └─▶ Refactor — keep tests green
```

**Principles:**
- Each test file is a specification, not just a safety net
- Work in small incremental steps: one module at a time
- Never write implementation before a failing test exists
- Tests drive the design of the public API

---

## 2. Spec Phase Summary

The spec phase is complete. The following work was done before any implementation began.

### What was produced

- **12 spec test docs** (`specs/tests/`) — checklists that validate the game design for correctness, completeness, and internal consistency
- **17 module specs** (`specs/modules/`) — implementation blueprints defining function signatures, TypeScript types, exported constants, and behavioral contracts for every module

### Review process

Specs were reviewed from 4 agent perspectives in each round:
1. **Game designer** — does the spec faithfully reflect the design intent?
2. **Architect** — are the interfaces clean, the dependencies minimal, the types correct?
3. **QA** — are edge cases covered, are the test cases sufficient?
4. **Consistency** — do the specs agree with each other and with `GAME_DESIGN.md`?

5 iterative fix-review rounds were completed until 0 critical issues remained.

### Key design decisions resolved during the spec phase

| Topic | Decision |
|-------|----------|
| Flip mechanic | Resets `timeInState` by 50% of the full state duration |
| Serving speed cap | Max −1.0 s reduction, capped at cycle 3 |
| Binge counter | Does NOT reset on trigger; fires via modulo (5, 10, 15…); resets only on discard |
| Flare risk | Per-second boundary check with injectable RNG for deterministic testing |
| Vegetable discard | Neutral — no staff warning triggered |
| Charming Personality | Shifts warning thresholds to 5 (first warning) and 7 (stacked) |
| `GrillSlot.part` type | `Part \| null` (union of `MeatPart \| VegetablePart`) |
| Constants location | All numeric constants in a single source of truth: `data-constants.ts` |
| Game state shape | Flat object — no nested penalty sub-object |
| Discard during action-disable | Allowed; only eat and flip are blocked |

---

## 3. Implementation Order

Implement bottom-up following the dependency graph. Do not implement a layer until all layers it depends on are complete and tested.

### Layer 1: Types + Data (no dependencies)

| Step | Source file | Spec |
|------|------------|------|
| 1 | `src/types/index.ts` | `types.spec.md` |
| 2 | `src/game/data/constants.ts` | `data-constants.spec.md` |
| 3 | `src/game/data/meats.ts` | `data-meats.spec.md` |
| 4 | `src/game/data/characters.ts` | `data-characters.spec.md` |
| 5 | `src/game/data/restaurants.ts` | `data-restaurants.spec.md` |
| 6 | `src/game/data/skills.ts` | `data-skills.spec.md` |

### Layer 2: Systems (depend on types + data)

| Step | Source file | Spec |
|------|------------|------|
| 7 | `src/game/systems/grilling.ts` | `system-grilling.spec.md` |
| 8 | `src/game/systems/penalty.ts` | `system-penalty.spec.md` |
| 9 | `src/game/systems/catalog.ts` | `system-catalog.spec.md` |
| 10 | `src/game/systems/skill.ts` | `system-skill.spec.md` |
| 11 | `src/game/systems/economy.ts` | `system-economy.spec.md` |
| 12 | `src/game/systems/character.ts` | `system-character.spec.md` |
| 13 | `src/game/systems/restaurant.ts` | `system-restaurant.spec.md` |
| 14 | `src/game/systems/game-over.ts` | `system-game-over.spec.md` |
| 15 | `src/game/systems/node.ts` | `system-node.spec.md` |

### Layer 3: Engine + Utils (depend on systems)

| Step | Source file | Spec |
|------|------------|------|
| 16 | `src/utils/persistence.ts` | `util-persistence.spec.md` |
| 17 | `src/game/engine/game-loop.ts` | `engine-game-loop.spec.md` |

### Layer 4: UI (React components + hooks)

React components and hooks — no spec yet, to be designed once the engine layer is stable.

---

## 4. TDD Workflow Per Module

Follow this workflow for each module in the implementation order above:

1. **Read** the corresponding `.spec.md` file in `specs/modules/`
2. **Write** `src/__tests__/<module>.test.ts` with failing tests — Red
3. **Implement** the module to make tests pass — Green
4. **Refactor** while keeping all tests green
5. **Verify** with:

```bash
npm run typecheck && npm run lint && npm test
```

Do not proceed to the next module until the current module is green, typed, and lint-clean.

---

## 5. Dev Container

All dev commands must run inside the dev container — not natively on the host machine.

- **Config:** `.devcontainer/devcontainer.json` (Node 22, auto `npm install` on container start)
- **Start:** open the project folder in VS Code → "Reopen in Container"
- **Commands that must run in the container:** `npm install`, `npm run build`, `npm test`, `npm run lint`, `npm run typecheck`

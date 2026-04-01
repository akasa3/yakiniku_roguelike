# 🥩 ソロBBQダンジョン — Solo BBQ Dungeon

An April Fools' 2026 browser game. A real-time roguelike set in an all-you-can-eat Japanese BBQ restaurant.

**▶ [Play Now](https://akasa3.github.io/yakiniku_roguelike/)**

## How to Play

Meat arrives on your grill automatically. Watch it cook:

**生 (Raw)** → **レア (Rare)** → **ミディアム (Medium)** → **ウェルダン (Well-Done)** → **コゲ (Burnt)**

- 🟤 **Eat at Well-Done** for +3 coins — that's the sweet spot!
- 🔴 Eating raw meat disables your actions for 3 seconds
- ⚫ Burnt meat can't be eaten — discard it (but the staff gets angry)
- 😤 8 staff warnings = kicked out (Game Over)

Clear all dishes to beat the restaurant → pick a skill → advance to harder restaurants.

## Characters

| Character | Style | Special |
|---|---|---|
| サラリーマン田中 | Balanced | Discard without staff warning |
| グルメ評論家 | Specialist | Wider sweet spot on premium meat |
| 大食い選手 | Specialist | Eats faster |
| 生食主義者 | Peaky | No raw penalty, but burnt = instant death |
| ヴィーガン田代 | Peaky | Exchange meat for vegetables, ×3 veggie coins |

## Tech Stack

TypeScript / React 19 / Vite 6 / Vitest (1400+ tests)

## Development

```bash
npm install
npm run dev        # http://localhost:5173/yakiniku_roguelike/
npm test           # Run all tests
npm run build      # Production build
```

## License

MIT

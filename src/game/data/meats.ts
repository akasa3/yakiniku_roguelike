import type { MeatPart, VegetablePart, Part, MeatRank } from '../../types/index';
import { GRILL_TIME, FLARE_RISK, SWEET_SPOT } from './constants';

// ---------------------------------------------------------------------------
// Meat parts — 11 entries total, ordered Common → Upper → Premium → Elite
// ---------------------------------------------------------------------------

export const MEAT_PARTS = [
  {
    id: 'kalbi',
    name: 'Kalbi',
    nameJP: 'カルビ',
    rank: 'common' as MeatRank,
    grillTime: GRILL_TIME.MEDIUM,
    flareRisk: FLARE_RISK.HIGH,
    sweetSpot: SWEET_SPOT.MEDIUM,
    flavorText: "A reliable classic. Burns faster than your motivation on a Monday.",
    isVegetable: false as const,
  },
  {
    id: 'beef-tongue',
    name: 'Beef Tongue',
    nameJP: '牛タン',
    rank: 'common' as MeatRank,
    grillTime: GRILL_TIME.SHORT,
    flareRisk: FLARE_RISK.LOW,
    sweetSpot: SWEET_SPOT.NARROW,
    flavorText: "Thin slice. Blink and it's well-done. Blink twice and it's charcoal.",
    isVegetable: false as const,
  },
  {
    id: 'harami',
    name: 'Harami',
    nameJP: 'ハラミ',
    rank: 'common' as MeatRank,
    grillTime: GRILL_TIME.MEDIUM,
    flareRisk: FLARE_RISK.MEDIUM,
    sweetSpot: SWEET_SPOT.WIDE,
    flavorText: 'Forgiving on the grill. Even more forgiving on the stomach.',
    isVegetable: false as const,
  },
  {
    id: 'upper-kalbi',
    name: 'Upper Kalbi',
    nameJP: '上カルビ',
    rank: 'upper' as MeatRank,
    grillTime: GRILL_TIME.MEDIUM,
    flareRisk: FLARE_RISK.HIGH,
    sweetSpot: SWEET_SPOT.MEDIUM,
    flavorText: 'Marbled ambition. Worth every second of focus.',
    isVegetable: false as const,
  },
  {
    id: 'thick-tongue',
    name: 'Thick Tongue',
    nameJP: '厚切りタン',
    rank: 'upper' as MeatRank,
    grillTime: GRILL_TIME.LONG,
    flareRisk: FLARE_RISK.LOW,
    sweetSpot: SWEET_SPOT.NARROW,
    flavorText: 'Patience is a virtue. This cut demands it.',
    isVegetable: false as const,
  },
  {
    id: 'loin',
    name: 'Loin',
    nameJP: 'ロース',
    rank: 'upper' as MeatRank,
    grillTime: GRILL_TIME.MEDIUM,
    flareRisk: FLARE_RISK.MEDIUM,
    sweetSpot: SWEET_SPOT.WIDE,
    flavorText: 'Clean, consistent, comforting. The business casual of BBQ.',
    isVegetable: false as const,
  },
  {
    id: 'special-kalbi',
    name: 'Special Kalbi',
    nameJP: '特上カルビ',
    rank: 'premium' as MeatRank,
    grillTime: GRILL_TIME.MEDIUM,
    flareRisk: FLARE_RISK.VERY_HIGH,
    sweetSpot: SWEET_SPOT.MEDIUM,
    flavorText: "This one WILL flare. It's not a question of if.",
    isVegetable: false as const,
  },
  {
    id: 'zabuton',
    name: 'Zabuton',
    nameJP: 'ザブトン',
    rank: 'premium' as MeatRank,
    grillTime: GRILL_TIME.LONG,
    flareRisk: FLARE_RISK.HIGH,
    sweetSpot: SWEET_SPOT.NARROW,
    flavorText: 'Named after a cushion. Treat it gently or it will not forgive you.',
    isVegetable: false as const,
  },
  {
    id: 'misuji',
    name: 'Misuji',
    nameJP: 'ミスジ',
    rank: 'premium' as MeatRank,
    grillTime: GRILL_TIME.SHORT,
    flareRisk: FLARE_RISK.LOW,
    sweetSpot: SWEET_SPOT.VERY_WIDE,
    flavorText: 'Rare and forgiving. Proof the universe occasionally balances out.',
    isVegetable: false as const,
  },
  {
    id: 'chateaubriand',
    name: 'Chateaubriand',
    nameJP: 'シャトーブリアン',
    rank: 'elite' as MeatRank,
    grillTime: GRILL_TIME.VERY_LONG,
    flareRisk: FLARE_RISK.MEDIUM,
    sweetSpot: SWEET_SPOT.VERY_NARROW,
    flavorText: "The pinnacle of solo BBQ. No one is watching, so you can take 10 minutes on this one.",
    isVegetable: false as const,
  },
  {
    id: 'ichibo',
    name: 'Ichibo',
    nameJP: 'イチボ',
    rank: 'elite' as MeatRank,
    grillTime: GRILL_TIME.LONG,
    flareRisk: FLARE_RISK.LOW,
    sweetSpot: SWEET_SPOT.NARROW,
    flavorText: 'A hidden gem. Reward for those who make it this far.',
    isVegetable: false as const,
  },
] as const satisfies readonly MeatPart[];

// ---------------------------------------------------------------------------
// Vegetable parts — 2 entries
// ---------------------------------------------------------------------------

export const VEGETABLE_PARTS = [
  {
    id: 'green-pepper',
    name: 'Green Pepper',
    nameJP: 'ピーマン',
    grillTime: GRILL_TIME.SHORT,
    flareRisk: FLARE_RISK.NONE,
    sweetSpot: SWEET_SPOT.WIDE,
    isVegetable: true as const,
  },
  {
    id: 'eggplant',
    name: 'Eggplant',
    nameJP: 'なす',
    grillTime: GRILL_TIME.MEDIUM,
    flareRisk: FLARE_RISK.NONE,
    sweetSpot: SWEET_SPOT.WIDE,
    isVegetable: true as const,
  },
] as const satisfies readonly VegetablePart[];

// ---------------------------------------------------------------------------
// Combined array — 13 entries
// ---------------------------------------------------------------------------

export const ALL_PARTS: readonly Part[] = [...MEAT_PARTS, ...VEGETABLE_PARTS];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getMeatPart(id: string): MeatPart {
  const part = MEAT_PARTS.find((m) => m.id === id);
  if (part === undefined) {
    throw new Error(`MeatPart not found: "${id}"`);
  }
  return part;
}

export function getVegetablePart(id: string): VegetablePart {
  const part = VEGETABLE_PARTS.find((v) => v.id === id);
  if (part === undefined) {
    throw new Error(`VegetablePart not found: "${id}"`);
  }
  return part;
}

export function getPart(id: string): Part {
  const part = ALL_PARTS.find((p) => p.id === id);
  if (part === undefined) {
    throw new Error(`Part not found: "${id}"`);
  }
  return part;
}

export function getMeatPartsByRank(rank: MeatRank): readonly MeatPart[] {
  return MEAT_PARTS.filter((m) => m.rank === rank);
}

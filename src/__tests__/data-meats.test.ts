import { describe, it, expect } from 'vitest';
import {
  MEAT_PARTS,
  VEGETABLE_PARTS,
  ALL_PARTS,
  getMeatPart,
  getVegetablePart,
  getPart,
  getMeatPartsByRank,
} from '../game/data/meats';

// ---------------------------------------------------------------------------
// Array invariants
// ---------------------------------------------------------------------------

describe('MEAT_PARTS array', () => {
  it('has exactly 11 entries', () => {
    expect(MEAT_PARTS.length).toBe(11);
  });

  it('has unique id values', () => {
    const ids = MEAT_PARTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique nameJP values', () => {
    const names = MEAT_PARTS.map((m) => m.nameJP);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has isVegetable === false for all entries', () => {
    for (const part of MEAT_PARTS) {
      expect(part.isVegetable).toBe(false);
    }
  });

  it('has non-empty flavorText for all entries', () => {
    for (const part of MEAT_PARTS) {
      expect(typeof part.flavorText).toBe('string');
      expect(part.flavorText.length).toBeGreaterThan(0);
    }
  });

  it('has flareRisk > 0 for all meat entries', () => {
    for (const part of MEAT_PARTS) {
      expect(part.flareRisk).toBeGreaterThan(0);
    }
  });

  it('has a valid rank for all entries', () => {
    const validRanks = ['common', 'upper', 'premium', 'elite'] as const;
    for (const part of MEAT_PARTS) {
      expect(validRanks).toContain(part.rank);
    }
  });
});

describe('VEGETABLE_PARTS array', () => {
  it('has exactly 2 entries', () => {
    expect(VEGETABLE_PARTS.length).toBe(2);
  });

  it('has isVegetable === true for all entries', () => {
    for (const part of VEGETABLE_PARTS) {
      expect(part.isVegetable).toBe(true);
    }
  });

  it('has flareRisk === 0 for all vegetable entries', () => {
    for (const part of VEGETABLE_PARTS) {
      expect(part.flareRisk).toBe(0);
    }
  });
});

describe('ALL_PARTS array', () => {
  it('has exactly 13 entries', () => {
    expect(ALL_PARTS.length).toBe(13);
  });

  it('is a concatenation of MEAT_PARTS and VEGETABLE_PARTS', () => {
    expect(ALL_PARTS.length).toBe(MEAT_PARTS.length + VEGETABLE_PARTS.length);
  });

  it('has unique id values across all parts', () => {
    const ids = ALL_PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Individual meat definitions
// ---------------------------------------------------------------------------

describe('kalbi', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'kalbi');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Kalbi');
    expect(part!.nameJP).toBe('カルビ');
    expect(part!.rank).toBe('common');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      "A reliable classic. Burns faster than your motivation on a Monday."
    );
  });

  it('has grillTime === GRILL_TIME.MEDIUM (5)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'kalbi')!;
    expect(part.grillTime).toBe(5);
  });

  it('has flareRisk === FLARE_RISK.HIGH (0.40)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'kalbi')!;
    expect(part.flareRisk).toBe(0.40);
  });

  it('has sweetSpot === SWEET_SPOT.MEDIUM (2)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'kalbi')!;
    expect(part.sweetSpot).toBe(2);
  });
});

describe('beef-tongue', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'beef-tongue');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Beef Tongue');
    expect(part!.nameJP).toBe('牛タン');
    expect(part!.rank).toBe('common');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      "Thin slice. Blink and it's well-done. Blink twice and it's charcoal."
    );
  });

  it('has grillTime === GRILL_TIME.SHORT (3)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'beef-tongue')!;
    expect(part.grillTime).toBe(3);
  });

  it('has flareRisk === FLARE_RISK.LOW (0.05)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'beef-tongue')!;
    expect(part.flareRisk).toBe(0.05);
  });

  it('has sweetSpot === SWEET_SPOT.NARROW (1)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'beef-tongue')!;
    expect(part.sweetSpot).toBe(1);
  });
});

describe('harami', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'harami');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Harami');
    expect(part!.nameJP).toBe('ハラミ');
    expect(part!.rank).toBe('common');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      'Forgiving on the grill. Even more forgiving on the stomach.'
    );
  });

  it('has grillTime === GRILL_TIME.MEDIUM (5)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'harami')!;
    expect(part.grillTime).toBe(5);
  });

  it('has flareRisk === FLARE_RISK.MEDIUM (0.20)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'harami')!;
    expect(part.flareRisk).toBe(0.20);
  });

  it('has sweetSpot === SWEET_SPOT.WIDE (3)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'harami')!;
    expect(part.sweetSpot).toBe(3);
  });
});

describe('upper-kalbi', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'upper-kalbi');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Upper Kalbi');
    expect(part!.nameJP).toBe('上カルビ');
    expect(part!.rank).toBe('upper');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe('Marbled ambition. Worth every second of focus.');
  });

  it('has grillTime === GRILL_TIME.MEDIUM (5)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'upper-kalbi')!;
    expect(part.grillTime).toBe(5);
  });

  it('has flareRisk === FLARE_RISK.HIGH (0.40)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'upper-kalbi')!;
    expect(part.flareRisk).toBe(0.40);
  });

  it('has sweetSpot === SWEET_SPOT.MEDIUM (2)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'upper-kalbi')!;
    expect(part.sweetSpot).toBe(2);
  });
});

describe('thick-tongue', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'thick-tongue');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Thick Tongue');
    expect(part!.nameJP).toBe('厚切りタン');
    expect(part!.rank).toBe('upper');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe('Patience is a virtue. This cut demands it.');
  });

  it('has grillTime === GRILL_TIME.LONG (8)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'thick-tongue')!;
    expect(part.grillTime).toBe(8);
  });

  it('has flareRisk === FLARE_RISK.LOW (0.05)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'thick-tongue')!;
    expect(part.flareRisk).toBe(0.05);
  });

  it('has sweetSpot === SWEET_SPOT.NARROW (1)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'thick-tongue')!;
    expect(part.sweetSpot).toBe(1);
  });
});

describe('loin', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'loin');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Loin');
    expect(part!.nameJP).toBe('ロース');
    expect(part!.rank).toBe('upper');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      'Clean, consistent, comforting. The business casual of BBQ.'
    );
  });

  it('has grillTime === GRILL_TIME.MEDIUM (5)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'loin')!;
    expect(part.grillTime).toBe(5);
  });

  it('has flareRisk === FLARE_RISK.MEDIUM (0.20)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'loin')!;
    expect(part.flareRisk).toBe(0.20);
  });

  it('has sweetSpot === SWEET_SPOT.WIDE (3)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'loin')!;
    expect(part.sweetSpot).toBe(3);
  });
});

describe('special-kalbi', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'special-kalbi');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Special Kalbi');
    expect(part!.nameJP).toBe('特上カルビ');
    expect(part!.rank).toBe('premium');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe("This one WILL flare. It's not a question of if.");
  });

  it('has grillTime === GRILL_TIME.MEDIUM (5)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'special-kalbi')!;
    expect(part.grillTime).toBe(5);
  });

  it('has flareRisk === FLARE_RISK.VERY_HIGH (0.60)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'special-kalbi')!;
    expect(part.flareRisk).toBe(0.60);
  });

  it('has sweetSpot === SWEET_SPOT.MEDIUM (2)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'special-kalbi')!;
    expect(part.sweetSpot).toBe(2);
  });
});

describe('zabuton', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'zabuton');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Zabuton');
    expect(part!.nameJP).toBe('ザブトン');
    expect(part!.rank).toBe('premium');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      'Named after a cushion. Treat it gently or it will not forgive you.'
    );
  });

  it('has grillTime === GRILL_TIME.LONG (8)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'zabuton')!;
    expect(part.grillTime).toBe(8);
  });

  it('has flareRisk === FLARE_RISK.HIGH (0.40)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'zabuton')!;
    expect(part.flareRisk).toBe(0.40);
  });

  it('has sweetSpot === SWEET_SPOT.NARROW (1)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'zabuton')!;
    expect(part.sweetSpot).toBe(1);
  });
});

describe('misuji', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'misuji');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Misuji');
    expect(part!.nameJP).toBe('ミスジ');
    expect(part!.rank).toBe('premium');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      'Rare and forgiving. Proof the universe occasionally balances out.'
    );
  });

  it('has grillTime === GRILL_TIME.SHORT (3)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'misuji')!;
    expect(part.grillTime).toBe(3);
  });

  it('has flareRisk === FLARE_RISK.LOW (0.05)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'misuji')!;
    expect(part.flareRisk).toBe(0.05);
  });

  it('has sweetSpot === SWEET_SPOT.VERY_WIDE (4)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'misuji')!;
    expect(part.sweetSpot).toBe(4);
  });
});

describe('chateaubriand', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'chateaubriand');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Chateaubriand');
    expect(part!.nameJP).toBe('シャトーブリアン');
    expect(part!.rank).toBe('elite');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      "The pinnacle of solo BBQ. No one is watching, so you can take 10 minutes on this one."
    );
  });

  it('has grillTime === GRILL_TIME.VERY_LONG (12)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'chateaubriand')!;
    expect(part.grillTime).toBe(12);
  });

  it('has flareRisk === FLARE_RISK.MEDIUM (0.20)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'chateaubriand')!;
    expect(part.flareRisk).toBe(0.20);
  });

  it('has sweetSpot === SWEET_SPOT.VERY_NARROW (0.5)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'chateaubriand')!;
    expect(part.sweetSpot).toBe(0.5);
  });
});

describe('ichibo', () => {
  it('has correct static properties', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'ichibo');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Ichibo');
    expect(part!.nameJP).toBe('イチボ');
    expect(part!.rank).toBe('elite');
    expect(part!.isVegetable).toBe(false);
    expect(part!.flavorText).toBe(
      'A hidden gem. Reward for those who make it this far.'
    );
  });

  it('has grillTime === GRILL_TIME.LONG (8)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'ichibo')!;
    expect(part.grillTime).toBe(8);
  });

  it('has flareRisk === FLARE_RISK.LOW (0.05)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'ichibo')!;
    expect(part.flareRisk).toBe(0.05);
  });

  it('has sweetSpot === SWEET_SPOT.NARROW (1)', () => {
    const part = MEAT_PARTS.find((m) => m.id === 'ichibo')!;
    expect(part.sweetSpot).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Individual vegetable definitions
// ---------------------------------------------------------------------------

describe('green-pepper', () => {
  it('has correct static properties', () => {
    const part = VEGETABLE_PARTS.find((v) => v.id === 'green-pepper');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Green Pepper');
    expect(part!.nameJP).toBe('ピーマン');
    expect(part!.isVegetable).toBe(true);
    expect(part!.flareRisk).toBe(0);
  });

  it('has grillTime === GRILL_TIME.SHORT (3)', () => {
    const part = VEGETABLE_PARTS.find((v) => v.id === 'green-pepper')!;
    expect(part.grillTime).toBe(3);
  });

  it('has sweetSpot === SWEET_SPOT.WIDE (3)', () => {
    const part = VEGETABLE_PARTS.find((v) => v.id === 'green-pepper')!;
    expect(part.sweetSpot).toBe(3);
  });
});

describe('eggplant', () => {
  it('has correct static properties', () => {
    const part = VEGETABLE_PARTS.find((v) => v.id === 'eggplant');
    expect(part).toBeDefined();
    expect(part!.name).toBe('Eggplant');
    expect(part!.nameJP).toBe('なす');
    expect(part!.isVegetable).toBe(true);
    expect(part!.flareRisk).toBe(0);
  });

  it('has grillTime === GRILL_TIME.MEDIUM (5)', () => {
    const part = VEGETABLE_PARTS.find((v) => v.id === 'eggplant')!;
    expect(part.grillTime).toBe(5);
  });

  it('has sweetSpot === SWEET_SPOT.WIDE (3)', () => {
    const part = VEGETABLE_PARTS.find((v) => v.id === 'eggplant')!;
    expect(part.sweetSpot).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getMeatPartsByRank
// ---------------------------------------------------------------------------

describe('getMeatPartsByRank', () => {
  it('returns 3 common parts', () => {
    const result = getMeatPartsByRank('common');
    expect(result.length).toBe(3);
    for (const part of result) {
      expect(part.rank).toBe('common');
    }
  });

  it('returns the correct common parts (kalbi, beef-tongue, harami)', () => {
    const result = getMeatPartsByRank('common');
    const ids = result.map((p) => p.id);
    expect(ids).toContain('kalbi');
    expect(ids).toContain('beef-tongue');
    expect(ids).toContain('harami');
  });

  it('returns 3 upper parts', () => {
    const result = getMeatPartsByRank('upper');
    expect(result.length).toBe(3);
    for (const part of result) {
      expect(part.rank).toBe('upper');
    }
  });

  it('returns the correct upper parts (upper-kalbi, thick-tongue, loin)', () => {
    const result = getMeatPartsByRank('upper');
    const ids = result.map((p) => p.id);
    expect(ids).toContain('upper-kalbi');
    expect(ids).toContain('thick-tongue');
    expect(ids).toContain('loin');
  });

  it('returns 3 premium parts', () => {
    const result = getMeatPartsByRank('premium');
    expect(result.length).toBe(3);
    for (const part of result) {
      expect(part.rank).toBe('premium');
    }
  });

  it('returns the correct premium parts (special-kalbi, zabuton, misuji)', () => {
    const result = getMeatPartsByRank('premium');
    const ids = result.map((p) => p.id);
    expect(ids).toContain('special-kalbi');
    expect(ids).toContain('zabuton');
    expect(ids).toContain('misuji');
  });

  it('returns 2 elite parts', () => {
    const result = getMeatPartsByRank('elite');
    expect(result.length).toBe(2);
    for (const part of result) {
      expect(part.rank).toBe('elite');
    }
  });

  it('returns the correct elite parts (chateaubriand, ichibo)', () => {
    const result = getMeatPartsByRank('elite');
    const ids = result.map((p) => p.id);
    expect(ids).toContain('chateaubriand');
    expect(ids).toContain('ichibo');
  });
});

// ---------------------------------------------------------------------------
// getMeatPart
// ---------------------------------------------------------------------------

describe('getMeatPart', () => {
  it('returns the correct MeatPart for a valid meat id', () => {
    const part = getMeatPart('kalbi');
    expect(part.id).toBe('kalbi');
    expect(part.isVegetable).toBe(false);
  });

  it('throws when id is not found', () => {
    expect(() => getMeatPart('nonexistent-id')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getVegetablePart
// ---------------------------------------------------------------------------

describe('getVegetablePart', () => {
  it('returns the correct VegetablePart for a valid vegetable id', () => {
    const part = getVegetablePart('green-pepper');
    expect(part.id).toBe('green-pepper');
    expect(part.isVegetable).toBe(true);
  });

  it('throws when id is not found', () => {
    expect(() => getVegetablePart('nonexistent-id')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getPart
// ---------------------------------------------------------------------------

describe('getPart', () => {
  it('returns a meat part when given a meat id', () => {
    const part = getPart('loin');
    expect(part.id).toBe('loin');
    expect(part.isVegetable).toBe(false);
  });

  it('returns a vegetable part when given a vegetable id', () => {
    const part = getPart('eggplant');
    expect(part.id).toBe('eggplant');
    expect(part.isVegetable).toBe(true);
  });

  it('throws when id is not found', () => {
    expect(() => getPart('nonexistent-id')).toThrow();
  });
});

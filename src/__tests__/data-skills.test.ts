import { describe, it, expect } from 'vitest';
import { SKILLS, getSkill, getSkillsByBuild, filterAvailableSkills } from '../game/data/skills';

// ---------------------------------------------------------------------------
// SKILLS array — invariants
// ---------------------------------------------------------------------------

describe('SKILLS array', () => {
  it('exports a readonly array', () => {
    expect(Array.isArray(SKILLS)).toBe(true);
  });

  it('contains exactly 24 skills', () => {
    expect(SKILLS).toHaveLength(24);
  });

  it('has unique ids across all skills', () => {
    const ids = SKILLS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(SKILLS.length);
  });

  it('has all ids in kebab-case', () => {
    const kebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
    for (const skill of SKILLS) {
      expect(skill.id).toMatch(kebabCase);
    }
  });

  it('only extra-slot and table-extension are stackable', () => {
    const stackableIds = SKILLS.filter((s) => s.isStackable).map((s) => s.id);
    expect(stackableIds.sort()).toEqual(['extra-slot', 'table-extension'].sort());
  });

  it('every skill has required SkillDefinition fields', () => {
    for (const skill of SKILLS) {
      expect(typeof skill.id).toBe('string');
      expect(typeof skill.name).toBe('string');
      expect(typeof skill.nameJP).toBe('string');
      expect(typeof skill.build).toBe('string');
      expect(typeof skill.description).toBe('string');
      expect(typeof skill.isStackable).toBe('boolean');
    }
  });

  it('has no isStarterOnly field on any skill', () => {
    for (const skill of SKILLS) {
      expect(skill).not.toHaveProperty('isStarterOnly');
    }
  });
});

// ---------------------------------------------------------------------------
// Core Skills (§9.1) — 12 skills
// ---------------------------------------------------------------------------

describe('Core Skills', () => {
  describe("'tong-master' — Tong Master", () => {
    it('exists in SKILLS', () => {
      const skill = SKILLS.find((s) => s.id === 'tong-master');
      expect(skill).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'tong-master')!;
      expect(skill.name).toBe('Tong Master');
      expect(skill.nameJP).toBe('トング職人');
      expect(skill.build).toBe('precision');
      expect(skill.isStackable).toBe(false);
    });

    it('has a non-empty description', () => {
      const skill = SKILLS.find((s) => s.id === 'tong-master')!;
      expect(skill.description.length).toBeGreaterThan(0);
    });
  });

  describe("'heat-sensor' — Heat Sensor", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'heat-sensor')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'heat-sensor')!;
      expect(skill.name).toBe('Heat Sensor');
      expect(skill.nameJP).toBe('ヒートセンサー');
      expect(skill.build).toBe('precision');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'extra-slot' — Extra Slot", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'extra-slot')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'extra-slot')!;
      expect(skill.name).toBe('Extra Slot');
      expect(skill.nameJP).toBe('スロット増設');
      expect(skill.build).toBe('volume');
      expect(skill.isStackable).toBe(true);
    });
  });

  describe("'table-extension' — Table Extension", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'table-extension')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'table-extension')!;
      expect(skill.name).toBe('Table Extension');
      expect(skill.nameJP).toBe('テーブル拡張');
      expect(skill.build).toBe('volume');
      expect(skill.isStackable).toBe(true);
    });
  });

  describe("'slot-efficiency-bonus' — Slot Efficiency Bonus", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'slot-efficiency-bonus')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'slot-efficiency-bonus')!;
      expect(skill.name).toBe('Slot Efficiency Bonus');
      expect(skill.nameJP).toBe('全スロットボーナス');
      expect(skill.build).toBe('volume');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'speed-eater' — Speed Eater", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'speed-eater')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'speed-eater')!;
      expect(skill.name).toBe('Speed Eater');
      expect(skill.nameJP).toBe('早食い');
      expect(skill.build).toBe('speed');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'quick-order' — Quick Order", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'quick-order')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'quick-order')!;
      expect(skill.name).toBe('Quick Order');
      expect(skill.nameJP).toBe('クイックオーダー');
      expect(skill.build).toBe('speed');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'quick-turnover-bonus' — Quick Turnover Bonus", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'quick-turnover-bonus')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'quick-turnover-bonus')!;
      expect(skill.name).toBe('Quick Turnover Bonus');
      expect(skill.nameJP).toBe('回転率ボーナス');
      expect(skill.build).toBe('speed');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'discard-pro' — Discard Pro", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'discard-pro')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'discard-pro')!;
      expect(skill.name).toBe('Discard Pro');
      expect(skill.nameJP).toBe('廃棄のプロ');
      expect(skill.build).toBe('stability');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'charming-personality' — Charming Personality", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'charming-personality')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'charming-personality')!;
      expect(skill.name).toBe('Charming Personality');
      expect(skill.nameJP).toBe('愛嬌キャラ');
      expect(skill.build).toBe('stability');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'fire-control' — Fire Control", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'fire-control')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'fire-control')!;
      expect(skill.name).toBe('Fire Control');
      expect(skill.nameJP).toBe('消火マスター');
      expect(skill.build).toBe('stability');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'exchange-discount' — Exchange Discount", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'exchange-discount')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'exchange-discount')!;
      expect(skill.name).toBe('Exchange Discount');
      expect(skill.nameJP).toBe('交換割引');
      expect(skill.build).toBe('vegan');
      expect(skill.isStackable).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Build-Specific Skills (§9.2) — 12 skills
// ---------------------------------------------------------------------------

describe('Build-Specific Skills — raw-rush', () => {
  describe("'raw-tolerance' — Raw Tolerance", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'raw-tolerance')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'raw-tolerance')!;
      expect(skill.name).toBe('Raw Tolerance');
      expect(skill.nameJP).toBe('生食耐性');
      expect(skill.build).toBe('raw-rush');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'iron-stomach' — Iron Stomach", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'iron-stomach')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'iron-stomach')!;
      expect(skill.name).toBe('Iron Stomach');
      expect(skill.nameJP).toBe('鉄の胃袋');
      expect(skill.build).toBe('raw-rush');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'fast-eaters-wage' — Fast Eater's Wage", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'fast-eaters-wage')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'fast-eaters-wage')!;
      expect(skill.name).toBe("Fast Eater's Wage");
      expect(skill.nameJP).toBe('早食い賃金');
      expect(skill.build).toBe('raw-rush');
      expect(skill.isStackable).toBe(false);
    });
  });
});

describe('Build-Specific Skills — burnt-exploit', () => {
  describe("'tare-conversion' — Tare Conversion", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'tare-conversion')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'tare-conversion')!;
      expect(skill.name).toBe('Tare Conversion');
      expect(skill.nameJP).toBe('タレ変換');
      expect(skill.build).toBe('burnt-exploit');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'char-bonus' — Char Bonus", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'char-bonus')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'char-bonus')!;
      expect(skill.name).toBe('Char Bonus');
      expect(skill.nameJP).toBe('炭ボーナス');
      expect(skill.build).toBe('burnt-exploit');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'perfect-grill-bonus' — Perfect Grill Bonus", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'perfect-grill-bonus')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'perfect-grill-bonus')!;
      expect(skill.name).toBe('Perfect Grill Bonus');
      expect(skill.nameJP).toBe('完璧焼きボーナス');
      expect(skill.build).toBe('precision');
      expect(skill.isStackable).toBe(false);
    });
  });
});

describe('Build-Specific Skills — binge', () => {
  describe("'binge-mode' — Binge Mode", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'binge-mode')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'binge-mode')!;
      expect(skill.name).toBe('Binge Mode');
      expect(skill.nameJP).toBe('暴食モード');
      expect(skill.build).toBe('binge');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'digestive-pro' — Digestive Pro", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'digestive-pro')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'digestive-pro')!;
      expect(skill.name).toBe('Digestive Pro');
      expect(skill.nameJP).toBe('消化のプロ');
      expect(skill.build).toBe('binge');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'eating-streak-bonus' — Eating Streak Bonus", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'eating-streak-bonus')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'eating-streak-bonus')!;
      expect(skill.name).toBe('Eating Streak Bonus');
      expect(skill.nameJP).toBe('連食ボーナス');
      expect(skill.build).toBe('binge');
      expect(skill.isStackable).toBe(false);
    });
  });
});

describe('Build-Specific Skills — charming', () => {
  describe("'regular-customer' — Regular Customer", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'regular-customer')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'regular-customer')!;
      expect(skill.name).toBe('Regular Customer');
      expect(skill.nameJP).toBe('常連客');
      expect(skill.build).toBe('charming');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'vip-status' — VIP Status", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'vip-status')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'vip-status')!;
      expect(skill.name).toBe('VIP Status');
      expect(skill.nameJP).toBe('VIPステータス');
      expect(skill.build).toBe('charming');
      expect(skill.isStackable).toBe(false);
    });
  });

  describe("'regular-customer-bonus' — Regular Customer Bonus", () => {
    it('exists in SKILLS', () => {
      expect(SKILLS.find((s) => s.id === 'regular-customer-bonus')).toBeDefined();
    });

    it('has correct static properties', () => {
      const skill = SKILLS.find((s) => s.id === 'regular-customer-bonus')!;
      expect(skill.name).toBe('Regular Customer Bonus');
      expect(skill.nameJP).toBe('常連ボーナス');
      expect(skill.build).toBe('charming');
      expect(skill.isStackable).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// getSkill()
// ---------------------------------------------------------------------------

describe('getSkill()', () => {
  it('returns the matching SkillDefinition for a valid id', () => {
    const skill = getSkill('tong-master');
    expect(skill.id).toBe('tong-master');
    expect(skill.name).toBe('Tong Master');
  });

  it('returns the correct skill for a build-specific id', () => {
    const skill = getSkill('iron-stomach');
    expect(skill.id).toBe('iron-stomach');
    expect(skill.build).toBe('raw-rush');
  });

  it('throws when the id is not found', () => {
    expect(() => getSkill('non-existent-skill')).toThrow();
  });

  it('throws when given an empty string', () => {
    expect(() => getSkill('')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getSkillsByBuild()
// ---------------------------------------------------------------------------

describe('getSkillsByBuild()', () => {
  it('returns all skills for the precision build', () => {
    const skills = getSkillsByBuild('precision');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('tong-master');
    expect(ids).toContain('heat-sensor');
    expect(ids).toContain('perfect-grill-bonus');
    expect(skills.every((s) => s.build === 'precision')).toBe(true);
  });

  it('returns all skills for the raw-rush build', () => {
    const skills = getSkillsByBuild('raw-rush');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('raw-tolerance');
    expect(ids).toContain('iron-stomach');
    expect(ids).toContain('fast-eaters-wage');
    expect(skills.every((s) => s.build === 'raw-rush')).toBe(true);
  });

  it('returns all skills for the volume build', () => {
    const skills = getSkillsByBuild('volume');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('extra-slot');
    expect(ids).toContain('table-extension');
    expect(ids).toContain('slot-efficiency-bonus');
    expect(skills.every((s) => s.build === 'volume')).toBe(true);
  });

  it('returns all skills for the speed build', () => {
    const skills = getSkillsByBuild('speed');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('speed-eater');
    expect(ids).toContain('quick-order');
    expect(ids).toContain('quick-turnover-bonus');
    expect(skills.every((s) => s.build === 'speed')).toBe(true);
  });

  it('returns all skills for the stability build', () => {
    const skills = getSkillsByBuild('stability');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('discard-pro');
    expect(ids).toContain('charming-personality');
    expect(ids).toContain('fire-control');
    expect(skills.every((s) => s.build === 'stability')).toBe(true);
  });

  it('returns all skills for the burnt-exploit build', () => {
    const skills = getSkillsByBuild('burnt-exploit');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('tare-conversion');
    expect(ids).toContain('char-bonus');
    expect(skills.every((s) => s.build === 'burnt-exploit')).toBe(true);
  });

  it('returns all skills for the binge build', () => {
    const skills = getSkillsByBuild('binge');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('binge-mode');
    expect(ids).toContain('digestive-pro');
    expect(ids).toContain('eating-streak-bonus');
    expect(skills.every((s) => s.build === 'binge')).toBe(true);
  });

  it('returns all skills for the charming build', () => {
    const skills = getSkillsByBuild('charming');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('regular-customer');
    expect(ids).toContain('vip-status');
    expect(ids).toContain('regular-customer-bonus');
    expect(skills.every((s) => s.build === 'charming')).toBe(true);
  });

  it('returns the exchange-discount skill for the vegan build', () => {
    const skills = getSkillsByBuild('vegan');
    expect(skills.map((s) => s.id)).toContain('exchange-discount');
    expect(skills.every((s) => s.build === 'vegan')).toBe(true);
  });

  it('returns a readonly array', () => {
    const skills = getSkillsByBuild('precision');
    expect(Array.isArray(skills)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// filterAvailableSkills()
// ---------------------------------------------------------------------------

describe('filterAvailableSkills()', () => {
  it('returns all skills when acquiredIds is empty', () => {
    const available = filterAvailableSkills(SKILLS, []);
    expect(available).toHaveLength(SKILLS.length);
  });

  it('excludes non-stackable acquired skills', () => {
    const available = filterAvailableSkills(SKILLS, ['tong-master', 'heat-sensor']);
    const ids = available.map((s) => s.id);
    expect(ids).not.toContain('tong-master');
    expect(ids).not.toContain('heat-sensor');
  });

  it('still includes stackable skills even when already acquired', () => {
    const available = filterAvailableSkills(SKILLS, ['extra-slot']);
    const ids = available.map((s) => s.id);
    expect(ids).toContain('extra-slot');
  });

  it('still includes table-extension when already acquired (stackable)', () => {
    const available = filterAvailableSkills(SKILLS, ['table-extension']);
    const ids = available.map((s) => s.id);
    expect(ids).toContain('table-extension');
  });

  it('excludes all acquired non-stackable skills', () => {
    const acquiredIds = [
      'tong-master',
      'heat-sensor',
      'speed-eater',
      'quick-order',
      'discard-pro',
    ];
    const available = filterAvailableSkills(SKILLS, acquiredIds);
    for (const id of acquiredIds) {
      expect(available.map((s) => s.id)).not.toContain(id);
    }
  });

  it('returns a readonly array', () => {
    const available = filterAvailableSkills(SKILLS, []);
    expect(Array.isArray(available)).toBe(true);
  });

  it('returns an empty array when all non-stackable skills are acquired', () => {
    const nonStackableIds = SKILLS.filter((s) => !s.isStackable).map((s) => s.id);
    const available = filterAvailableSkills(
      SKILLS.filter((s) => !s.isStackable),
      nonStackableIds
    );
    expect(available).toHaveLength(0);
  });

  it('works correctly with a subset of all skills as the first argument', () => {
    const subset = SKILLS.filter((s) => s.build === 'precision');
    const available = filterAvailableSkills(subset, ['tong-master']);
    expect(available.map((s) => s.id)).not.toContain('tong-master');
    expect(available.map((s) => s.id)).toContain('heat-sensor');
  });
});

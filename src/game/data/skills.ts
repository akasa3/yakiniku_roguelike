import type { SkillDefinition, SkillBuild } from '../../types/index';

// ---------------------------------------------------------------------------
// Core Skills (§9.1) — 12 skills, available to all builds
// ---------------------------------------------------------------------------

const CORE_SKILLS: readonly SkillDefinition[] = [
  {
    id: 'tong-master',
    name: 'Tong Master',
    nameJP: 'トング職人',
    build: 'precision',
    isStackable: false,
    description: '「裏返す」アクションが使えるようになる。肉の焼き時間を50%リセットし、焦げるまでの猶予を稼げる。',
  },
  {
    id: 'heat-sensor',
    name: 'Heat Sensor',
    nameJP: 'ヒートセンサー',
    build: 'precision',
    isStackable: false,
    description: '肉がコゲになる2秒前に警告を表示。焦げる前に食べるか裏返すタイミングが分かる。',
  },
  {
    id: 'extra-slot',
    name: 'Extra Slot',
    nameJP: 'スロット増設',
    build: 'volume',
    isStackable: true,
    description: 'グリルスロットを2枠追加。何度でも取得可能。',
  },
  {
    id: 'table-extension',
    name: 'Table Extension',
    nameJP: 'テーブル拡張',
    build: 'volume',
    isStackable: true,
    description: 'テーブル容量を3枠拡張。何度でも取得可能。',
  },
  {
    id: 'slot-efficiency-bonus',
    name: 'Slot Efficiency Bonus',
    nameJP: '全スロットボーナス',
    build: 'volume',
    isStackable: false,
    description: '全グリルスロットが同時に埋まるたびに+2コイン獲得。',
  },
  {
    id: 'speed-eater',
    name: 'Speed Eater',
    nameJP: '早食い',
    build: 'speed',
    isStackable: false,
    description: '食べる速度が30%アップ。キャラ固有の速度がある場合はそちらが優先。',
  },
  {
    id: 'quick-order',
    name: 'Quick Order',
    nameJP: 'クイックオーダー',
    build: 'speed',
    isStackable: false,
    description: '提供間隔を1秒短縮。料理がより早く届くようになる。',
  },
  {
    id: 'quick-turnover-bonus',
    name: 'Quick Turnover Bonus',
    nameJP: '回転率ボーナス',
    build: 'speed',
    isStackable: false,
    description: '高い回転率でクリアすると+5コイン獲得。',
  },
  {
    id: 'discard-pro',
    name: 'Discard Pro',
    nameJP: '廃棄のプロ',
    build: 'stability',
    isStackable: false,
    description: '肉を捨ててもスタッフ警告が増えない。タレ変換と併用可能。',
  },
  {
    id: 'charming-personality',
    name: 'Charming Personality',
    nameJP: '愛嬌キャラ',
    build: 'stability',
    isStackable: false,
    description: 'スタッフ警告のデバフ発動を遅らせる。最初の減速は警告5回、重い減速は7回から。',
  },
  {
    id: 'fire-control',
    name: 'Fire Control',
    nameJP: '消火マスター',
    build: 'stability',
    isStackable: false,
    description: 'グリル炎上の持続時間が半分（5秒）になる。火災を素早く鎮火。',
  },
  {
    id: 'exchange-discount',
    name: 'Exchange Discount',
    nameJP: '交換割引',
    build: 'vegan',
    isStackable: false,
    description: '即時交換のコストが30%オフ。遅延交換（無料）には影響なし。',
  },
] as const;

// ---------------------------------------------------------------------------
// Build-Specific Skills (§9.2) — 12 skills
// ---------------------------------------------------------------------------

const BUILD_SPECIFIC_SKILLS: readonly SkillDefinition[] = [
  // --- Raw Rush ---
  {
    id: 'raw-tolerance',
    name: 'Raw Tolerance',
    nameJP: '生食耐性',
    build: 'raw-rush',
    isStackable: false,
    description: '生肉を食べた時の行動不能時間を70%短縮（約0.9秒）。鉄の胃袋と併用時はそちらが優先。',
  },
  {
    id: 'iron-stomach',
    name: 'Iron Stomach',
    nameJP: '鉄の胃袋',
    build: 'raw-rush',
    isStackable: false,
    description: '生肉を食べてもペナルティなし（行動不能0秒）。生食耐性より優先。',
  },
  {
    id: 'fast-eaters-wage',
    name: "Fast Eater's Wage",
    nameJP: '早食い賃金',
    build: 'raw-rush',
    isStackable: false,
    description: 'レア状態の肉を食べると+3コイン獲得。他の焼き加減では発動しない。',
  },

  // --- Burnt Exploit ---
  {
    id: 'tare-conversion',
    name: 'Tare Conversion',
    nameJP: 'タレ変換',
    build: 'burnt-exploit',
    isStackable: false,
    description: '肉を捨てると+2コイン獲得＆スタッフ警告が増えない。炭ボーナスと重複可能。野菜には適用されない。',
  },
  {
    id: 'char-bonus',
    name: 'Char Bonus',
    nameJP: '炭ボーナス',
    build: 'burnt-exploit',
    isStackable: false,
    description: 'コゲ肉を捨てると+3コイン獲得。タレ変換と併用で合計+5コイン。',
  },
  {
    id: 'perfect-grill-bonus',
    name: 'Perfect Grill Bonus',
    nameJP: '完璧焼きボーナス',
    build: 'precision',
    isStackable: false,
    description: 'ウェルダン状態の肉を食べると追加+3コイン獲得（基本+3に上乗せで合計+6）。',
  },

  // --- Binge ---
  {
    id: 'binge-mode',
    name: 'Binge Mode',
    nameJP: '暴食モード',
    build: 'binge',
    isStackable: false,
    description: '5回連続で食べるとコイン×2発動。食べる以外の行動でリセット。',
  },
  {
    id: 'digestive-pro',
    name: 'Digestive Pro',
    nameJP: '消化のプロ',
    build: 'binge',
    isStackable: false,
    description: '暴食モードの連食必要数を5回から3回に短縮。より頻繁に×2ボーナスが発動。',
  },
  {
    id: 'eating-streak-bonus',
    name: 'Eating Streak Bonus',
    nameJP: '連食ボーナス',
    build: 'binge',
    isStackable: false,
    description: '5回連続で食べるたびに+5コイン獲得（5, 10, 15…回目に発動）。食べる以外の行動でリセット。',
  },

  // --- Charming ---
  {
    id: 'regular-customer',
    name: 'Regular Customer',
    nameJP: '常連客',
    build: 'charming',
    isStackable: false,
    description: 'レストランクリアごとにスタッフ警告が1減少。0未満にはならない。',
  },
  {
    id: 'vip-status',
    name: 'VIP Status',
    nameJP: 'VIPステータス',
    build: 'charming',
    isStackable: false,
    description: 'スタッフ警告のデバフが速度バフに変わる。愛嬌キャラとの併用で高い閾値でもバフ発動。',
  },
  {
    id: 'regular-customer-bonus',
    name: 'Regular Customer Bonus',
    nameJP: '常連ボーナス',
    build: 'charming',
    isStackable: false,
    description: 'スタッフ警告0の状態でクリアすると+5コイン獲得。警告1以上では発動しない。',
  },
] as const;

// ---------------------------------------------------------------------------
// SKILLS — flat array of all 24 skills
// ---------------------------------------------------------------------------

export const SKILLS: readonly SkillDefinition[] = [
  ...CORE_SKILLS,
  ...BUILD_SPECIFIC_SKILLS,
] as const;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the SkillDefinition with the matching id.
 * Throws if the id is not found.
 */
export const getSkill = (id: string): SkillDefinition => {
  const skill = SKILLS.find((s) => s.id === id);
  if (skill === undefined) {
    throw new Error(`Skill not found: "${id}"`);
  }
  return skill;
};

/**
 * Returns all skills with the matching build value.
 * Returns an empty array if no skills match.
 */
export const getSkillsByBuild = (build: SkillBuild): readonly SkillDefinition[] => {
  return SKILLS.filter((s) => s.build === build);
};

/**
 * Returns skills from allSkills that are available to acquire:
 * - Not already acquired (unless isStackable === true)
 * Used to generate valid post-restaurant skill choices and Shop offerings.
 */
export const filterAvailableSkills = (
  allSkills: readonly SkillDefinition[],
  acquiredIds: readonly string[]
): readonly SkillDefinition[] => {
  const acquiredSet = new Set(acquiredIds);
  return allSkills.filter((skill) => {
    if (skill.isStackable) {
      return true;
    }
    return !acquiredSet.has(skill.id);
  });
};

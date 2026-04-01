import type { GameState, SkillDefinition, ConsumableItem } from '../../types/index';
import {
  NODE_FREQUENCY_BY_CYCLE,
  SKILL_PURCHASE_COST,
  CONSUMABLE_PURCHASE_COST,
  SKILL_CHOICE_COUNT,
} from '../data/constants';
import { SKILLS, filterAvailableSkills } from '../data/skills';
import { CHARACTERS } from '../data/characters';
import { acquireSkill, hasSkill } from './skill';

// ---------------------------------------------------------------------------
// Consumable Definitions
// ---------------------------------------------------------------------------

const CONSUMABLES: readonly ConsumableItem[] = [
  {
    id: 'warning-reducer',
    name: 'Apology Drink',
    nameJP: 'お詫びドリンク',
    cost: CONSUMABLE_PURCHASE_COST,
    effect: { type: 'clear-warning', amount: 2 },
  },
  {
    id: 'fire-extinguisher',
    name: 'Fire Extinguisher',
    nameJP: '消火器',
    cost: CONSUMABLE_PURCHASE_COST,
    effect: { type: 'heal-fire', slotCount: 1 },
  },
] as const;

// ---------------------------------------------------------------------------
// shouldShowNode
// ---------------------------------------------------------------------------

/**
 * Returns true if a Node screen should be shown after completing
 * `restaurantsCompletedInCycle` restaurants in the given cycle.
 */
export function shouldShowNode(
  cycle: number,
  restaurantsCompletedInCycle: number
): boolean {
  const index = Math.min(cycle, NODE_FREQUENCY_BY_CYCLE.length) - 1;
  const freq = NODE_FREQUENCY_BY_CYCLE[index]!;
  return restaurantsCompletedInCycle % freq === 0;
}

// ---------------------------------------------------------------------------
// applyRest
// ---------------------------------------------------------------------------

/**
 * Applies the effects of a Rest node: clears all debuffs and resets
 * the staff warning counter and all grill slot fire/disable timers.
 */
export function applyRest(state: GameState): GameState {
  return {
    ...state,
    actionDisabledTimer: 0,
    burntSmokeActive: false,
    staffWarningCount: 0,
    grill: state.grill.map((slot) => ({
      ...slot,
      fireTimer: 0,
      disabled: false,
      disabledTimer: 0,
    })),
  };
}

// ---------------------------------------------------------------------------
// getShopOfferings
// ---------------------------------------------------------------------------

/**
 * Returns up to SKILL_CHOICE_COUNT randomly selected skills not yet held
 * by the player (excluding the character's starter skill), plus all
 * available consumable items.
 */
export function getShopOfferings(
  state: GameState
): { skills: SkillDefinition[]; consumables: ConsumableItem[] } {
  const characterDef = CHARACTERS.find((c) => c.id === state.character);
  const starterSkillId = characterDef?.starterSkillId;

  // Filter available skills: not already held (non-stackable filter) and not the starter skill
  const available = filterAvailableSkills(SKILLS, state.skills).filter(
    (skill) => skill.id !== starterSkillId
  );

  let selectedSkills: SkillDefinition[];
  if (available.length <= SKILL_CHOICE_COUNT) {
    selectedSkills = [...available];
  } else {
    // Fisher-Yates shuffle on a copy, then take first SKILL_CHOICE_COUNT
    const pool = [...available];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = temp;
    }
    selectedSkills = pool.slice(0, SKILL_CHOICE_COUNT);
  }

  return {
    skills: selectedSkills,
    consumables: [...CONSUMABLES],
  };
}

// ---------------------------------------------------------------------------
// purchaseSkill
// ---------------------------------------------------------------------------

/**
 * Deducts SKILL_PURCHASE_COST coins and adds the skill to the player's
 * held skills by delegating to acquireSkill.
 * Returns state unchanged if coins are insufficient or skill is already held
 * (for non-stackable skills).
 */
export function purchaseSkill(state: GameState, skillId: string): GameState {
  // Guard: insufficient coins
  if (state.coins < SKILL_PURCHASE_COST) {
    return state;
  }

  // Guard: non-stackable skill already held (idempotent)
  const skillDef = SKILLS.find((s) => s.id === skillId);
  if (!skillDef?.isStackable && hasSkill(state, skillId)) {
    return state;
  }

  const stateAfterDeduction: GameState = {
    ...state,
    coins: state.coins - SKILL_PURCHASE_COST,
  };

  return acquireSkill(stateAfterDeduction, skillId);
}

// ---------------------------------------------------------------------------
// purchaseConsumable
// ---------------------------------------------------------------------------

/**
 * Deducts CONSUMABLE_PURCHASE_COST coins and applies the consumable's
 * effect immediately.
 * Returns state unchanged if coins are insufficient or itemId is invalid.
 */
export function purchaseConsumable(state: GameState, itemId: string): GameState {
  // Guard: insufficient coins
  if (state.coins < CONSUMABLE_PURCHASE_COST) {
    return state;
  }

  // Find consumable definition
  const consumable = CONSUMABLES.find((c) => c.id === itemId);
  if (consumable === undefined) {
    return state;
  }

  const stateAfterDeduction: GameState = {
    ...state,
    coins: state.coins - CONSUMABLE_PURCHASE_COST,
  };

  const effect = consumable.effect;

  if (effect.type === 'clear-warning') {
    return {
      ...stateAfterDeduction,
      staffWarningCount: Math.max(0, stateAfterDeduction.staffWarningCount - effect.amount),
    };
  }

  if (effect.type === 'heal-fire') {
    let healed = 0;
    const newGrill = stateAfterDeduction.grill.map((slot) => {
      if (healed < effect.slotCount && slot.disabled) {
        healed++;
        return {
          ...slot,
          fireTimer: 0,
          disabled: false,
          disabledTimer: 0,
        };
      }
      return slot;
    });
    return {
      ...stateAfterDeduction,
      grill: newGrill,
    };
  }

  return stateAfterDeduction;
}

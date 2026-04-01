import type { GameState } from '../../types/index';
import {
  RAW_MEAT_DISABLE_DURATION,
  RAW_TOLERANCE_MULTIPLIER,
  GRILL_FIRE_DISABLE_DURATION,
  FIRE_CONTROL_MULTIPLIER,
  STAFF_WARNING_THRESHOLD,
  STAFF_WARNING_STACK_THRESHOLD,
  CHARMING_FIRST_THRESHOLD,
  CHARMING_STACK_THRESHOLD,
  VIP_STATUS_SPEED_BUFF,
  PENALTY_INCREASE_PER_CYCLE,
  PENALTY_SCALING_CAP_CYCLE,
} from '../data/constants';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type StaffWarningLevel = 'none' | 'warning' | 'stacked';

function cycleSeverityMultiplier(cycle: number): number {
  return 1 + PENALTY_INCREASE_PER_CYCLE * Math.min(cycle - 1, PENALTY_SCALING_CAP_CYCLE - 1);
}

function resolveStaffWarningLevel(
  count: number,
  firstThreshold: number,
  stackThreshold: number,
): StaffWarningLevel {
  if (count >= stackThreshold) return 'stacked';
  if (count >= firstThreshold) return 'warning';
  return 'none';
}

function resolveThresholds(skills: readonly string[]): {
  firstThreshold: number;
  stackThreshold: number;
} {
  const charming = skills.includes('charming-personality');
  return {
    firstThreshold: charming ? CHARMING_FIRST_THRESHOLD : STAFF_WARNING_THRESHOLD,
    stackThreshold: charming ? CHARMING_STACK_THRESHOLD : STAFF_WARNING_STACK_THRESHOLD,
  };
}

// ---------------------------------------------------------------------------
// applyRawMeatPenalty
// ---------------------------------------------------------------------------

/**
 * Applies the raw-meat action disable penalty.
 * Iron Stomach fully negates the penalty.
 * Raw Tolerance reduces the duration.
 * Duration scales with cycle severity.
 */
export function applyRawMeatPenalty(state: GameState): GameState {
  if (state.skills.includes('iron-stomach')) {
    return state;
  }

  let duration = RAW_MEAT_DISABLE_DURATION * cycleSeverityMultiplier(state.cycle);

  if (state.skills.includes('raw-tolerance')) {
    duration = duration * RAW_TOLERANCE_MULTIPLIER;
  }

  duration = Math.max(0, duration);

  return { ...state, actionDisabledTimer: duration };
}

// ---------------------------------------------------------------------------
// applyBurntSmoke
// ---------------------------------------------------------------------------

/**
 * Activates the burnt-smoke visibility penalty.
 * Simply sets burntSmokeActive = true.
 * Clearing is handled by tickPenalties.
 */
export function applyBurntSmoke(state: GameState): GameState {
  return { ...state, burntSmokeActive: true };
}

// ---------------------------------------------------------------------------
// incrementStaffWarning
// ---------------------------------------------------------------------------

/**
 * Increments the staff warning counter by amount.
 * Thresholds depend on whether charming-personality skill is held.
 */
export function incrementStaffWarning(state: GameState, amount: number): GameState {
  const newCount = state.staffWarningCount + amount;
  return { ...state, staffWarningCount: newCount };
}

// ---------------------------------------------------------------------------
// applyGrillFire
// ---------------------------------------------------------------------------

/**
 * Triggers a grill fire on a specific grill slot.
 * Disables the slot for a duration (halved by fire-control skill), scaled by cycle.
 * Clears the meat from the slot.
 */
export function applyGrillFire(state: GameState, slotIndex: number): GameState {
  const baseDuration = state.skills.includes('fire-control')
    ? GRILL_FIRE_DISABLE_DURATION * FIRE_CONTROL_MULTIPLIER
    : GRILL_FIRE_DISABLE_DURATION;

  const duration = baseDuration * cycleSeverityMultiplier(state.cycle);

  const newGrill = state.grill.map((slot, i) => {
    if (i !== slotIndex) return slot;
    return {
      ...slot,
      part: null,
      disabled: true,
      fireTimer: duration,
      disabledTimer: duration,
    };
  });

  return { ...state, grill: newGrill };
}

// ---------------------------------------------------------------------------
// tickPenalties
// ---------------------------------------------------------------------------

/**
 * Decrements all penalty timers by deltaTime.
 * Re-enables grill slots whose fire timer has expired.
 * Recalculates burntSmokeActive based on current grill state.
 * Does NOT set gameOver — that responsibility belongs to the game loop.
 */
export function tickPenalties(state: GameState, deltaTime: number): GameState {
  const newActionDisabledTimer = Math.max(0, state.actionDisabledTimer - deltaTime);

  const newGrill = state.grill.map((slot) => {
    if (slot.fireTimer <= 0 && !slot.disabled) {
      // No fire, no change needed for fire-related fields
      return slot;
    }

    const newFireTimer = Math.max(0, slot.fireTimer - deltaTime);

    if (slot.disabled && newFireTimer === 0) {
      // Fire expired: re-enable the slot
      return {
        ...slot,
        fireTimer: 0,
        disabledTimer: 0,
        disabled: false,
      };
    }

    if (slot.fireTimer > 0) {
      // Fire still active: decrement timer
      return {
        ...slot,
        fireTimer: newFireTimer,
        disabledTimer: newFireTimer,
      };
    }

    return slot;
  });

  const burntSmokeActive = newGrill.some(
    (slot) => slot.state === 'burnt' && slot.part !== null,
  );

  return {
    ...state,
    actionDisabledTimer: newActionDisabledTimer,
    grill: newGrill,
    burntSmokeActive,
  };
}

// ---------------------------------------------------------------------------
// getSpeedModifier
// ---------------------------------------------------------------------------

/**
 * Returns the current timed-action speed multiplier for the player.
 * Based on staffWarningCount, skills (charming-personality, vip-status).
 * Pure function — no side effects.
 */
export function getSpeedModifier(state: GameState): number {
  const { firstThreshold, stackThreshold } = resolveThresholds(state.skills);
  const level = resolveStaffWarningLevel(
    state.staffWarningCount,
    firstThreshold,
    stackThreshold,
  );

  if (state.skills.includes('vip-status')) {
    if (level === 'warning' || level === 'stacked') {
      return VIP_STATUS_SPEED_BUFF;
    }
    return 1.0;
  }

  // Speed debuff replaced by eat cooldown + game-over in game-loop.
  // getSpeedModifier now only returns VIP buff or 1.0.
  return 1.0;
}

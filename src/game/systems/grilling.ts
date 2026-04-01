import type { GameState, GrillSlot, GrillingState } from '../../types/index';
import {
  FLIP_TIMER_RESET_FRACTION,
  SWEET_SPOT_MINIMUM,
  SWEET_SPOT_REDUCTION_PER_CYCLE,
  EATING_STREAK_THRESHOLD,
  DIGESTIVE_PRO_STREAK_THRESHOLD,
} from '../data/constants';
import { applyRawMeatPenalty, incrementStaffWarning } from './penalty';
import { unlockCatalogEntry } from './catalog';
import { awardEatCoins, awardDiscardCoins, awardStreakCoins } from './economy';
import { hasSkill } from './skill';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Clamp a number to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute the effective sweet-spot window for a given base sweetSpot and cycle.
 * effectiveSweetSpot = max(SWEET_SPOT_MINIMUM, base - 0.3 * min(cycle - 1, 4))
 */
function computeEffectiveSweetSpot(baseSweetSpot: number, cycle: number): number {
  const reductionSteps = clamp(cycle - 1, 0, 4);
  return Math.max(
    SWEET_SPOT_MINIMUM,
    baseSweetSpot - SWEET_SPOT_REDUCTION_PER_CYCLE * reductionSteps,
  );
}

/**
 * Returns the grill time for the given state (raw/rare/medium use part.grillTime;
 * well-done uses the effective sweet-spot window).
 */
function grillTimeForState(
  state: GrillingState,
  partGrillTime: number,
  effectiveSweetSpot: number,
): number {
  if (state === 'well-done') return effectiveSweetSpot;
  return partGrillTime;
}

/** Maps the current state to the next state in the linear sequence. */
function nextState(current: GrillingState): GrillingState {
  switch (current) {
    case 'raw':       return 'rare';
    case 'rare':      return 'medium';
    case 'medium':    return 'well-done';
    case 'well-done': return 'burnt';
    default:          return 'burnt'; // burnt is terminal; callers must not call nextState on burnt
  }
}

// ---------------------------------------------------------------------------
// advanceGrilling
// ---------------------------------------------------------------------------

/**
 * Advances grill timer for a single slot by deltaTime seconds.
 * Handles state transitions, flare risk, and Heat Sensor warning.
 * Pure function — returns new GrillSlot; input is not mutated.
 */
export function advanceGrilling(
  slot: GrillSlot,
  deltaTime: number,
  _skills: string[],
  cycle: number,
  random: () => number,
): GrillSlot {
  // Guard: empty or disabled slots are returned unchanged.
  if (slot.part === null || slot.disabled) {
    return slot;
  }

  const part = slot.part;
  const partGrillTime = part.grillTime;
  const baseSweetSpot = part.sweetSpot;
  const effectiveSweetSpot = computeEffectiveSweetSpot(baseSweetSpot, cycle);
  const isVegetable = part.isVegetable;

  let currentState: GrillingState = slot.state;
  let timeInState = slot.timeInState;

  // Flare risk is "once per integer-second boundary crossed in deltaTime".
  // Integer-second boundaries are in the delta itself: at cumulative delta = 1, 2, 3, ...
  // We track elapsed delta time separately from timeInState (which resets on state transition).
  let elapsed = 0; // how much of deltaTime has been processed
  // nextFlareThreshold is the next integer delta value to trigger a flare check.
  let nextFlareThreshold = 1; // first boundary at delta == 1

  while (elapsed < deltaTime) {
    if (currentState === 'burnt') {
      timeInState += deltaTime - elapsed;
      break;
    }

    // Chain immediate transitions when overflow exceeds next threshold
    const threshold = grillTimeForState(currentState, partGrillTime, effectiveSweetSpot);
    if (timeInState >= threshold) {
      const overflow = timeInState - threshold;
      currentState = nextState(currentState);
      timeInState = overflow;
      continue;
    }

    const remaining = deltaTime - elapsed;
    const timeToTransition = threshold - timeInState;
    const timeToNextFlare = nextFlareThreshold - elapsed;

    // Advance to the earliest of: next flare boundary, state transition, or end of delta
    const step = Math.min(timeToTransition, timeToNextFlare, remaining);

    timeInState += step;
    elapsed += step;

    // Check flare boundary (reached when elapsed == nextFlareThreshold)
    if (elapsed >= nextFlareThreshold) {
      if (!isVegetable && random() < part.flareRisk) {
        timeInState = Math.max(0, timeInState - partGrillTime * FLIP_TIMER_RESET_FRACTION);
      }
      nextFlareThreshold++;
    }

    // Check state transition
    if (timeInState >= threshold) {
      const overflow = timeInState - threshold;
      currentState = nextState(currentState);
      timeInState = overflow;
    }
  }

  // Heat Sensor: a warning fires when timeInState is within HEAT_SENSOR_WARNING_SECONDS of
  // the effectiveSweetSpot threshold. The actual UI side-effect is handled by the caller;
  // advanceGrilling returns the updated slot and callers can inspect the warning condition.
  // We expose the warning via the returned slot (well-done state + close to threshold).
  // No extra field change needed; caller uses: effectiveSweetSpot - slot.timeInState <= HEAT_SENSOR_WARNING_SECONDS

  return {
    ...slot,
    state: currentState,
    timeInState,
  };
}

// ---------------------------------------------------------------------------
// flipMeat
// ---------------------------------------------------------------------------

/**
 * Resets the grill timer for the meat on the slot, buying time before transition.
 * Caller is responsible for verifying 'tong-master' skill before calling.
 * Pure function — returns new GrillSlot; input is not mutated.
 */
export function flipMeat(slot: GrillSlot): GrillSlot {
  if (slot.part === null) return slot;

  const part = slot.part;
  const grillTime = part.grillTime;
  const sweetSpot = part.sweetSpot;

  let resetAmount: number;
  if (slot.state === 'well-done') {
    resetAmount = sweetSpot * FLIP_TIMER_RESET_FRACTION;
  } else {
    resetAmount = grillTime * FLIP_TIMER_RESET_FRACTION;
  }

  const newTimeInState = Math.max(0, slot.timeInState - resetAmount);

  return {
    ...slot,
    timeInState: newTimeInState,
  };
}

// ---------------------------------------------------------------------------
// Internal: clearSlot
// ---------------------------------------------------------------------------

function clearSlot(slot: GrillSlot): GrillSlot {
  return {
    ...slot,
    part: null,
    state: 'raw' as GrillingState,
    timeInState: 0,
    fireTimer: 0,
  };
}

// ---------------------------------------------------------------------------
// moveTableToGrill
// ---------------------------------------------------------------------------

/**
 * Moves dishes from the front of the table waiting queue onto any empty,
 * non-disabled grill slots (FIFO, ascending slot index).
 * Pure function — returns new GameState; input is not mutated.
 */
export function moveTableToGrill(state: GameState): GameState {
  if (state.table.length === 0) return state;

  // Check if there are any available slots
  const hasAvailableSlot = state.grill.some((slot) => !slot.disabled && slot.part === null);
  if (!hasAvailableSlot) return state;

  const newGrill = [...state.grill];
  const tableQueue = [...state.table];

  for (let i = 0; i < newGrill.length; i++) {
    if (tableQueue.length === 0) break;
    const slot = newGrill[i]!;
    if (!slot.disabled && slot.part === null) {
      const part = tableQueue.shift()!;
      newGrill[i] = {
        ...slot,
        part,
        state: 'raw' as GrillingState,
        timeInState: 0,
        fireTimer: 0,
      };
    }
  }

  return {
    ...state,
    grill: newGrill,
    table: tableQueue,
  };
}

// ---------------------------------------------------------------------------
// eatMeat
// ---------------------------------------------------------------------------

/**
 * Player eats the meat on slotIndex.
 * Pure function — returns new GameState; input is not mutated.
 */
export function eatMeat(state: GameState, slotIndex: number): GameState {
  // Guard: out of range
  if (slotIndex < 0 || slotIndex >= state.grill.length) return state;

  const slot = state.grill[slotIndex]!;
  // Guard: empty slot
  if (slot.part === null) return state;

  const part = slot.part;
  const meatState = slot.state;

  // Clear the slot
  const newGrill = state.grill.map((s, i) => (i === slotIndex ? clearSlot(s) : s));
  let newState: GameState = { ...state, grill: newGrill };

  // Increment meatDishesEaten for non-vegetables
  if (!part.isVegetable) {
    newState = {
      ...newState,
      restaurant: {
        ...newState.restaurant,
        meatDishesEaten: newState.restaurant.meatDishesEaten + 1,
      },
    };
  }

  // Catalog unlock for non-vegetables
  if (!part.isVegetable) {
    newState = unlockCatalogEntry(newState, part.id);
  }

  // Apply raw meat penalty if eating raw
  if (meatState === 'raw') {
    newState = applyRawMeatPenalty(newState);
  }

  // Coin awards from eat action
  newState = awardEatCoins(newState, meatState, part);

  // Binge-mode tracking
  if (hasSkill(newState, 'binge-mode')) {
    const newConsecutiveEatCount = newState.consecutiveEatCount + 1;
    const threshold = hasSkill(newState, 'digestive-pro')
      ? DIGESTIVE_PRO_STREAK_THRESHOLD
      : EATING_STREAK_THRESHOLD;
    const bingeNextDishDoubled =
      newConsecutiveEatCount > 0 && newConsecutiveEatCount % threshold === 0
        ? true
        : newState.bingeNextDishDoubled;
    newState = {
      ...newState,
      consecutiveEatCount: newConsecutiveEatCount,
      bingeNextDishDoubled,
    };
  }

  // Eating streak bonus (streak coins)
  if (hasSkill(newState, 'eating-streak-bonus')) {
    newState = awardStreakCoins(newState);
  }

  // Move table items to freed grill slot
  newState = moveTableToGrill(newState);

  return newState;
}

// ---------------------------------------------------------------------------
// discardMeat
// ---------------------------------------------------------------------------

/**
 * Player discards the item on slotIndex.
 * Pure function — returns new GameState; input is not mutated.
 */
export function discardMeat(state: GameState, slotIndex: number): GameState {
  // Guard: out of range
  if (slotIndex < 0 || slotIndex >= state.grill.length) return state;

  const slot = state.grill[slotIndex]!;
  // Guard: empty slot
  if (slot.part === null) return state;

  const part = slot.part;
  const meatState = slot.state;

  // Clear the slot
  const newGrill = state.grill.map((s, i) => (i === slotIndex ? clearSlot(s) : s));
  let newState: GameState = { ...state, grill: newGrill };

  // Staff Warning increment for meat (vegetables are neutral)
  if (!part.isVegetable) {
    const discardProtected =
      hasSkill(newState, 'discard-pro') || hasSkill(newState, 'tare-conversion');
    if (!discardProtected) {
      newState = incrementStaffWarning(newState, 1);
    }
  }

  // Coin awards on discard (meat only)
  if (!part.isVegetable) {
    newState = awardDiscardCoins(newState, part, meatState);
  }

  // Move table items to freed grill slot
  newState = moveTableToGrill(newState);

  return newState;
}

// ---------------------------------------------------------------------------
// serveDish
// ---------------------------------------------------------------------------

/**
 * Places the next dish from the restaurant's serving queue onto an empty grill
 * slot. If no slot is available, places on the table. If the table is full,
 * triggers game over.
 * Pure function — returns new GameState; input is not mutated.
 */
export function serveDish(state: GameState): GameState {
  // Guard: no dishes in queue
  if (state.restaurant.servingQueue.length === 0) return state;

  const [dish, ...remainingQueue] = state.restaurant.servingQueue;
  const newRestaurant = {
    ...state.restaurant,
    servingQueue: remainingQueue,
  };
  const newState: GameState = { ...state, restaurant: newRestaurant };

  // Find first available (non-disabled, empty) grill slot
  const availableSlotIndex = newState.grill.findIndex(
    (slot) => !slot.disabled && slot.part === null,
  );

  if (availableSlotIndex !== -1) {
    // Place dish on grill
    const newGrill = newState.grill.map((slot, i) => {
      if (i !== availableSlotIndex) return slot;
      return {
        ...slot,
        part: dish!,
        state: 'raw' as GrillingState,
        timeInState: 0,
        fireTimer: 0,
      };
    });
    return { ...newState, grill: newGrill };
  }

  // All grill slots occupied or disabled → try to place on table
  const tableCapacity = newState.tableCapacity;

  if (newState.table.length >= tableCapacity) {
    // Table overflow game over
    const gameOver =
      newState.actionDisabledTimer > 0 ? 'raw-paralysis' : 'table-overflow';
    return { ...newState, gameOver };
  }

  // Place on table
  return {
    ...newState,
    table: [...newState.table, dish!],
  };
}

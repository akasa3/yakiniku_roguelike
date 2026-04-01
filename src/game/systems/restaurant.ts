import type { GameState, GrillSlot, Restaurant, MeatPart } from '../../types/index';
import {
  SERVING_SPEED_REDUCTION_PER_CYCLE,
  SERVING_SPEED_MAX_REDUCTION,
  SWEET_SPOT_REDUCTION_PER_CYCLE,
  SWEET_SPOT_SCALING_CAP_CYCLE,
  PENALTY_INCREASE_PER_CYCLE,
  PENALTY_SCALING_CAP_CYCLE,
} from '../data/constants';
import {
  getRestaurantAtIndex,
  pickMeatRank,
} from '../data/restaurants';
import { MEAT_PARTS } from '../data/meats';
import { serveDish } from './grilling';
import { hasSkill } from './skill';

// ---------------------------------------------------------------------------
// generateDish
// ---------------------------------------------------------------------------

/**
 * Picks one random meat part from the restaurant's rank distribution.
 * Never returns a vegetable.
 * Pure function.
 */
export function generateDish(restaurant: Restaurant): MeatPart {
  const rank = pickMeatRank(restaurant.definition, Math.random);
  const partsOfRank = MEAT_PARTS.filter((p) => p.rank === rank);

  if (partsOfRank.length === 0) {
    throw new Error(`No meat parts defined for rank: "${rank}"`);
  }

  const index = Math.floor(Math.random() * partsOfRank.length);
  return partsOfRank[index]!;
}

// ---------------------------------------------------------------------------
// createRestaurant
// ---------------------------------------------------------------------------

/**
 * Constructs a fully initialized Restaurant object for the given position in the cycle.
 * Applies difficulty scaling to the serving interval.
 * Pre-generates the full serving queue with optional interleaved vegetables.
 * Pure function.
 */
export function createRestaurant(
  cycle: number,
  indexInCycle: number,
  currentElapsedTime: number,
): Restaurant {
  const definition = getRestaurantAtIndex(indexInCycle);

  // Effective serving interval with difficulty scaling
  const reduction = Math.min(
    (cycle - 1) * SERVING_SPEED_REDUCTION_PER_CYCLE,
    SERVING_SPEED_MAX_REDUCTION,
  );
  // Floor: effectiveServingInterval may not be less than 1.0 [TUNE]
  const effectiveServingInterval = Math.max(1.0, definition.servingInterval - reduction);

  const totalMeatDishes = definition.totalDishes;

  // Build serving queue: meat dishes only (vegetables are NOT stored in servingQueue per the
  // MeatPart[] type constraint; the VEGETABLE_INSERT_CHANCE is used for future expansion).
  const queue: MeatPart[] = [];

  // Create a temporary partial restaurant for generateDish usage
  const tempRestaurant: Restaurant = {
    definition,
    dishesServed: 0,
    meatDishesEaten: 0,
    totalMeatDishes,
    timeSinceLastServe: 0,
    effectiveServingInterval,
    startTime: currentElapsedTime,
    servingQueue: [],
    isCleared: false,
  };

  // Pre-generate the initial serving queue
  for (let i = 0; i < totalMeatDishes; i++) {
    queue.push(generateDish(tempRestaurant));
  }

  return {
    definition,
    dishesServed: 0,
    meatDishesEaten: 0,
    totalMeatDishes,
    timeSinceLastServe: 0,
    effectiveServingInterval,
    startTime: currentElapsedTime,
    servingQueue: queue,
    isCleared: false,
  };
}

// ---------------------------------------------------------------------------
// tickServing
// ---------------------------------------------------------------------------

/**
 * Advances the serving timer. Dequeues and serves dishes when the interval elapses.
 * Handles multiple dishes in a single tick (large deltaTime).
 * Pure function — returns new GameState; no mutation.
 */
export function tickServing(state: GameState, deltaTime: number): GameState {
  let currentState = {
    ...state,
    restaurant: {
      ...state.restaurant,
      timeSinceLastServe: state.restaurant.timeSinceLastServe + deltaTime,
    },
  };

  // Serve dishes while interval elapses — refill queue if empty but not cleared
  while (
    currentState.restaurant.timeSinceLastServe >= currentState.restaurant.effectiveServingInterval
  ) {
    // If queue is empty, generate more dishes (all-you-can-eat: keep serving until cleared)
    if (
      currentState.restaurant.servingQueue.length === 0 &&
      currentState.restaurant.meatDishesEaten < currentState.restaurant.totalMeatDishes
    ) {
      const extraDish = generateDish(currentState.restaurant);
      currentState = {
        ...currentState,
        restaurant: {
          ...currentState.restaurant,
          servingQueue: [extraDish],
        },
      };
    }

    // If still no dishes to serve (restaurant cleared), stop
    if (currentState.restaurant.servingQueue.length === 0) break;
    // Consume one interval
    currentState = {
      ...currentState,
      restaurant: {
        ...currentState.restaurant,
        timeSinceLastServe:
          currentState.restaurant.timeSinceLastServe -
          currentState.restaurant.effectiveServingInterval,
      },
    };

    // serveDish dequeues the next dish from servingQueue internally
    const afterServe = serveDish(currentState);

    // If game-over was triggered (table overflow), stop and return immediately
    if (afterServe.gameOver !== null) {
      return afterServe;
    }

    currentState = afterServe;
  }

  return currentState;
}

// ---------------------------------------------------------------------------
// checkRestaurantCleared
// ---------------------------------------------------------------------------

/**
 * Returns true when all required meat dishes have been eaten for the current restaurant.
 * Pure function — no state mutation.
 */
export function checkRestaurantCleared(state: GameState): boolean {
  return state.restaurant.meatDishesEaten >= state.restaurant.totalMeatDishes;
}

// ---------------------------------------------------------------------------
// advanceToNextRestaurant
// ---------------------------------------------------------------------------

/**
 * Moves to the next restaurant in the cycle. Increments restaurantIndexInCycle,
 * incrementing cycle when wrapping from Boss (3) back to Chain (0).
 * Awards coins, updates score and highestRestaurantTypeReached.
 * Pure function — returns new GameState; no mutation.
 */
export function advanceToNextRestaurant(state: GameState): GameState {
  const nextIndex = (state.restaurantIndexInCycle + 1) % 4;
  const nextCycle = nextIndex === 0 ? state.cycle + 1 : state.cycle;

  // NOTE: Score and coin awards are handled by checkPhaseTransition.
  // This function only advances the restaurant, clears the grill/table,
  // and applies the regular-customer skill effect.

  // Regular Customer: reduce staffWarningCount by 1
  const newStaffWarningCount = hasSkill(state, 'regular-customer')
    ? Math.max(0, state.staffWarningCount - 1)
    : state.staffWarningCount;

  // highestRestaurantTypeReached is monotonically non-decreasing
  const newHighestRestaurantTypeReached = Math.max(
    state.highestRestaurantTypeReached,
    nextIndex,
  );

  // Create new restaurant
  const newRestaurant = createRestaurant(nextCycle, nextIndex, state.elapsedTime);

  // Reset grill slots (keep same count, clear contents)
  const freshGrill: GrillSlot[] = state.grill.map((slot) => ({
    id: slot.id,
    part: null,
    state: 'raw' as const,
    timeInState: 0,
    fireTimer: 0,
    disabled: false,
    disabledTimer: 0,
  }));

  return {
    ...state,
    cycle: nextCycle,
    restaurantIndexInCycle: nextIndex,
    staffWarningCount: newStaffWarningCount,
    highestRestaurantTypeReached: newHighestRestaurantTypeReached,
    restaurant: newRestaurant,
    grill: freshGrill,
    table: [],
    burntSmokeActive: false,
    actionDisabledTimer: 0,
  };
}

// ---------------------------------------------------------------------------
// getDifficultyModifiers
// ---------------------------------------------------------------------------

/**
 * Returns the three difficulty scaling values for a given cycle.
 * Pure function — same cycle always returns the same result.
 */
export function getDifficultyModifiers(cycle: number): {
  sweetSpotReduction: number;
  penaltyMultiplier: number;
  servingSpeedReduction: number;
} {
  // Serving speed reduction: capped at SERVING_SPEED_MAX_REDUCTION
  const servingSpeedReduction = Math.min(
    (cycle - 1) * SERVING_SPEED_REDUCTION_PER_CYCLE,
    SERVING_SPEED_MAX_REDUCTION,
  );

  // Sweet spot reduction: capped at (SWEET_SPOT_SCALING_CAP_CYCLE - 1) steps
  const sweetSpotSteps = Math.min(cycle - 1, SWEET_SPOT_SCALING_CAP_CYCLE - 1);
  const sweetSpotReduction = sweetSpotSteps * SWEET_SPOT_REDUCTION_PER_CYCLE;

  // Penalty multiplier: 1.0 + increments × PENALTY_INCREASE_PER_CYCLE
  const penaltyIncrements = Math.min(cycle - 1, PENALTY_SCALING_CAP_CYCLE - 1);
  const penaltyMultiplier = 1.0 + penaltyIncrements * PENALTY_INCREASE_PER_CYCLE;

  return {
    servingSpeedReduction,
    sweetSpotReduction,
    penaltyMultiplier,
  };
}

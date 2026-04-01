import type {
  GameState,
  GrillSlot,
  CharacterId,
  PlayerAction,
} from '../../types/index';
import {
  INITIAL_GRILL_SLOTS,
  INITIAL_TABLE_CAPACITY,
  SKILL_CHOICE_COUNT,
  TRUE_ENDING_CYCLE,
  GRILL_FIRE_GAME_OVER_THRESHOLD,
  VEGAN_MEAT_EAT_WARNING_PENALTY,
  STAFF_WARNING_GAME_OVER_THRESHOLD,
  STAFF_WARNING_STACK_THRESHOLD,
  BASE_EAT_COOLDOWN,
  STAFF_WARNING_EAT_COOLDOWN,
} from '../data/constants';
import { getCharacter, CHARACTERS } from '../data/characters';
import { canUnlockCharacter } from '../systems/character';
import { advanceGrilling, flipMeat, discardMeat } from '../systems/grilling';
import { applyRawMeatPenalty } from '../systems/penalty';
import { unlockCatalogEntry } from '../systems/catalog';
import {
  acquireSkill,
  applySkillModifiers,
  generateSkillChoices,
  hasSkill,
} from '../systems/skill';
import {
  awardRestaurantClearCoins,
  awardEatCoins,
  awardStreakCoins,
  awardQuickTurnoverCoins,
  getExchangeCost,
} from '../systems/economy';
import { processVeganExchange } from '../systems/character';
import { createRestaurant } from '../systems/restaurant';
import { tickServing } from '../systems/restaurant';
import { shouldShowNode } from '../systems/node';
import { loadPersistentState, loadCatalog, savePersistentState, saveHighScore } from '../../utils/persistence';

// ---------------------------------------------------------------------------
// initGameState
// ---------------------------------------------------------------------------

/**
 * Creates and returns the complete initial GameState for a new run with the
 * selected character. Caller is responsible for verifying the character is
 * unlocked before calling.
 */
export function initGameState(characterId: CharacterId): GameState {
  const character = getCharacter(characterId);

  // Build initial grill slots
  const grill: GrillSlot[] = Array.from({ length: INITIAL_GRILL_SLOTS }, (_, i) => ({
    id: i,
    part: null,
    state: 'raw' as const,
    timeInState: 0,
    fireTimer: 0,
    disabled: false,
    disabledTimer: 0,
  }));

  // Load persistent catalog state
  const catalog = loadCatalog();

  // Create first restaurant (cycle 1, index 0 = chain)
  const restaurant = createRestaurant(1, 0, 0);

  // Build base state (no skills yet)
  let state: GameState = {
    character: characterId,
    cycle: 1,
    restaurantIndexInCycle: 0,
    score: 0,
    highestRestaurantTypeReached: 0,
    restaurant,
    grill,
    table: [],
    tableCapacity: INITIAL_TABLE_CAPACITY,
    skills: [],
    coins: characterId === 'vegan-tashiro' ? 10 : 0, // Vegan starts with coins for exchanges
    staffWarningCount: 0,
    actionDisabledTimer: 0,
    burntSmokeActive: false,
    consecutiveEatCount: 0,
    bingeNextDishDoubled: false,
    allSlotsOccupiedLastTick: false,
    phase: 'playing',
    gameOver: null,
    pendingSkillChoices: [],
    pendingNodeChoice: false,
    catalog,
    elapsedTime: 0,
  };

  // Apply the character's starter skill
  state = acquireSkill(state, character.starterSkillId);

  return state;
}

// ---------------------------------------------------------------------------
// gameTick
// ---------------------------------------------------------------------------

/**
 * The main update function. Advances all real-time game state by deltaTime seconds.
 * Pure: returns a new GameState. No-op when phase !== 'playing'.
 */
export function gameTick(
  state: GameState,
  deltaTime: number,
  random: () => number,
): GameState {
  // No-op outside the playing phase
  if (state.phase !== 'playing') {
    return state;
  }

  let current = { ...state };

  // -----------------------------------------------------------------------
  // Step 1 — Advance grill timers (all slots)
  // -----------------------------------------------------------------------
  const newGrill = current.grill.map((slot) => {
    if (slot.part === null || slot.disabled) return slot;
    return advanceGrilling(slot, deltaTime, [...current.skills], current.cycle, random);
  });

  // Check for raw-food-advocate burnt-instant game over
  let gameOver = current.gameOver;
  let phase = current.phase;

  if (current.character === 'raw-food-advocate') {
    for (let i = 0; i < newGrill.length; i++) {
      const slot = newGrill[i]!;
      const originalSlot = current.grill[i]!;
      // If a meat part (not vegetable) just transitioned to burnt
      if (
        slot.state === 'burnt' &&
        originalSlot.state !== 'burnt' &&
        slot.part !== null &&
        !slot.part.isVegetable
      ) {
        gameOver = 'burnt-instant';
        phase = 'game-over';
        break;
      }
    }
  }

  current = { ...current, grill: newGrill, gameOver, phase };

  // If game over triggered in step 1, still continue to update timers but skip further checks
  if (current.gameOver !== null) {
    return {
      ...current,
      elapsedTime: current.elapsedTime + deltaTime,
    };
  }

  // -----------------------------------------------------------------------
  // Step 3 — Tick serving timer; serve dishes if due
  // -----------------------------------------------------------------------
  // tickServing handles: timer accumulation, queue refill when empty, dish serving,
  // and game-over on table overflow.
  if (current.restaurant.meatDishesEaten < current.restaurant.totalMeatDishes) {
    const afterServing = tickServing(current, deltaTime);

    if (afterServing.gameOver !== null) {
      return {
        ...afterServing,
        phase: 'game-over',
        elapsedTime: afterServing.elapsedTime + deltaTime,
      };
    }

    current = afterServing;
  }

  // -----------------------------------------------------------------------
  // Step 4 — Tick penalty timers
  // -----------------------------------------------------------------------
  // Decrement actionDisabledTimer
  const newActionDisabledTimer = Math.max(0, current.actionDisabledTimer - deltaTime);

  // Decrement disabledTimer on each disabled slot; re-enable when expired
  const grillAfterPenalty = current.grill.map((slot) => {
    if (!slot.disabled) return slot;
    const newDisabledTimer = slot.disabledTimer - deltaTime;
    if (newDisabledTimer <= 0) {
      return { ...slot, disabled: false, disabledTimer: 0 };
    }
    return { ...slot, disabledTimer: newDisabledTimer };
  });

  current = {
    ...current,
    actionDisabledTimer: newActionDisabledTimer,
    grill: grillAfterPenalty,
  };

  // -----------------------------------------------------------------------
  // Step 4b — Check staff warning game over (kicked out)
  // -----------------------------------------------------------------------
  if (current.staffWarningCount >= STAFF_WARNING_GAME_OVER_THRESHOLD) {
    return {
      ...current,
      gameOver: 'staff-kicked-out',
      phase: 'game-over',
      elapsedTime: current.elapsedTime + deltaTime,
    };
  }

  // -----------------------------------------------------------------------
  // Step 5 — Check grill fire timers
  // -----------------------------------------------------------------------
  const grillAfterFire = [...current.grill];
  let burntSmokeActive = current.burntSmokeActive;
  let gameOverFromFire = current.gameOver;
  let phaseFromFire = current.phase;

  for (let i = 0; i < grillAfterFire.length; i++) {
    const slot = grillAfterFire[i]!;
    if (slot.state !== 'burnt' || slot.part === null) continue;

    const restaurantType = current.restaurant.definition.type;
    const grillFireActive =
      restaurantType === 'high-end' || restaurantType === 'boss';

    if (!grillFireActive) {
      // No fire mechanic at this restaurant — burnt meat just sits on grill
      burntSmokeActive = true;
      continue;
    }

    // Burnt meat accumulates timeInState; game over if it exceeds threshold
    burntSmokeActive = true;
    if (slot.timeInState > GRILL_FIRE_GAME_OVER_THRESHOLD) {
      gameOverFromFire = 'grill-fire';
      phaseFromFire = 'game-over';
      break;
    }
  }

  current = {
    ...current,
    grill: grillAfterFire,
    burntSmokeActive,
    gameOver: gameOverFromFire,
    phase: phaseFromFire,
  };

  if (current.gameOver !== null) {
    return {
      ...current,
      elapsedTime: current.elapsedTime + deltaTime,
    };
  }

  // -----------------------------------------------------------------------
  // Step 6 — Belt-and-suspenders table overflow check
  // -----------------------------------------------------------------------
  if (current.table.length > current.tableCapacity) {
    return {
      ...current,
      gameOver: 'table-overflow',
      phase: 'game-over',
      elapsedTime: current.elapsedTime + deltaTime,
    };
  }

  // -----------------------------------------------------------------------
  // Step 7 — Return new state
  // -----------------------------------------------------------------------
  return {
    ...current,
    elapsedTime: current.elapsedTime + deltaTime,
  };
}

// ---------------------------------------------------------------------------
// processAction
// ---------------------------------------------------------------------------

/**
 * Dispatches a player action for the specified grill slot to the appropriate
 * system function. Returns the updated state.
 */
export function processAction(
  state: GameState,
  action: PlayerAction,
  slotIndex: number,
): GameState {
  // Guard: phase must be playing
  if (state.phase !== 'playing') return state;

  // Guard: out-of-bounds slotIndex
  if (slotIndex < 0 || slotIndex >= state.grill.length) return state;

  const slot = state.grill[slotIndex]!;

  switch (action) {
    case 'eat': {
      // Blocked when actionDisabledTimer > 0
      if (state.actionDisabledTimer > 0) return state;
      // Cannot eat burnt meat
      if (slot.state === 'burnt') return state;
      // Guard: empty slot
      if (slot.part === null) return state;

      const part = slot.part;
      const meatState = slot.state;
      const modifiers = applySkillModifiers(state);

      let newState = { ...state };

      // Apply raw meat penalty if eating raw MEAT (not vegetables, and not negated)
      if (meatState === 'raw' && !part.isVegetable && !modifiers.rawPenaltyNegated) {
        newState = applyRawMeatPenalty(newState);
      }

      // Award eat coins
      newState = awardEatCoins(newState, meatState, part);

      // Increment consecutiveEatCount
      const newConsecutiveEatCount = newState.consecutiveEatCount + 1;
      newState = { ...newState, consecutiveEatCount: newConsecutiveEatCount };

      // Award streak coins
      newState = awardStreakCoins(newState);

      // Binge mode tracking
      if (hasSkill(newState, 'binge-mode')) {
        const threshold = modifiers.eatingStreakThreshold;
        if (newConsecutiveEatCount > 0 && newConsecutiveEatCount % threshold === 0) {
          newState = { ...newState, bingeNextDishDoubled: true };
        }
      }

      // Vegan Tashiro: eating meat increments staffWarningCount
      if (newState.character === 'vegan-tashiro' && !part.isVegetable) {
        newState = {
          ...newState,
          staffWarningCount: newState.staffWarningCount + VEGAN_MEAT_EAT_WARNING_PENALTY,
        };
      }

      // Unlock catalog entry (only for meat, not vegetables)
      if (!part.isVegetable) {
        newState = unlockCatalogEntry(newState, part.id);
      }

      // Clear the slot
      const newGrill = newState.grill.map((s, i) =>
        i === slotIndex
          ? { ...s, part: null as null, state: 'raw' as const, timeInState: 0, fireTimer: 0 }
          : s
      );
      newState = { ...newState, grill: newGrill };

      // Increment meatDishesEaten (meat always counts; vegetables count for vegan since they exchange meat→veg)
      if (!part.isVegetable || state.character === 'vegan-tashiro') {
        newState = {
          ...newState,
          restaurant: {
            ...newState.restaurant,
            meatDishesEaten: newState.restaurant.meatDishesEaten + 1,
          },
        };
      }

      // Move first table dish to the now-empty slot (FIFO)
      if (newState.table.length > 0) {
        const [firstItem, ...remainingTable] = newState.table;
        const grillWithTableItem = newState.grill.map((s, i) =>
          i === slotIndex
            ? { ...s, part: firstItem!, state: 'raw' as const, timeInState: 0, fireTimer: 0 }
            : s
        );
        newState = { ...newState, grill: grillWithTableItem, table: remainingTable };
      }

      // Apply eat cooldown — base cooldown always, longer when staff is angry
      {
        const baseCooldown = newState.staffWarningCount >= STAFF_WARNING_STACK_THRESHOLD
          ? STAFF_WARNING_EAT_COOLDOWN
          : BASE_EAT_COOLDOWN;
        // Speed Eater / Competitive Eater reduces cooldown
        const cooldown = baseCooldown * modifiers.eatingSpeedMultiplier;
        newState = { ...newState, actionDisabledTimer: cooldown };
      }

      // Check phase transition
      newState = checkPhaseTransition(newState);

      return newState;
    }

    case 'discard': {
      // Guard: empty slot
      if (slot.part === null) return state;

      // Discard is allowed even when actionDisabledTimer > 0
      // Delegate to discardMeat (handles coins, staff warning, slot clearing, moveTableToGrill)
      let newState = discardMeat(state, slotIndex);

      // Reset consecutiveEatCount to 0 (discard breaks eating streak)
      newState = { ...newState, consecutiveEatCount: 0 };

      // bingeNextDishDoubled is NOT reset by discard

      return newState;
    }

    case 'flip': {
      // Blocked when actionDisabledTimer > 0
      if (state.actionDisabledTimer > 0) return state;
      // Guard: empty slot
      if (slot.part === null) return state;
      // Cannot flip burnt meat
      if (slot.state === 'burnt') return state;

      // Precondition: Tong Master skill must be held
      const modifiers = applySkillModifiers(state);
      if (!modifiers.flipAvailable) return state;

      const newGrill = state.grill.map((s, i) => (i === slotIndex ? flipMeat(s) : s));
      return { ...state, grill: newGrill };
      // Does NOT reset consecutiveEatCount
    }

    case 'instant-exchange': {
      // Only for vegan-tashiro
      if (state.character !== 'vegan-tashiro') return state;
      // Need sufficient coins
      const cost = getExchangeCost(state);
      if (state.coins < cost) return state;
      return processVeganExchange(state, slotIndex, 'instant', cost);
    }

    case 'delayed-exchange': {
      // Only for vegan-tashiro
      if (state.character !== 'vegan-tashiro') return state;
      return processVeganExchange(state, slotIndex, 'delayed', 0);
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// checkPhaseTransition
// ---------------------------------------------------------------------------

/**
 * Checks whether the current restaurant has been cleared, and if so,
 * transitions to the appropriate next phase. Handles True Ending trigger.
 * Called after each eat action.
 */
export function checkPhaseTransition(state: GameState): GameState {
  // Restaurant not yet cleared
  if (state.restaurant.meatDishesEaten < state.restaurant.totalMeatDishes) {
    return state;
  }

  // Restaurant cleared — increment score
  let newState = { ...state, score: state.score + 1 };

  // Award restaurant clear coins
  newState = awardRestaurantClearCoins(newState);

  // Award quick turnover coins
  newState = awardQuickTurnoverCoins(newState);

  // Update highestRestaurantTypeReached
  const currentTypeIndex = newState.restaurantIndexInCycle;
  newState = {
    ...newState,
    highestRestaurantTypeReached: Math.max(
      newState.highestRestaurantTypeReached,
      currentTypeIndex,
    ),
  };

  // Boss cleared (restaurantIndexInCycle === 3) — save character unlock progress
  if (newState.restaurantIndexInCycle === 3) {
    const persistent = loadPersistentState();
    const clearedWith = persistent.clearedWithCharacterIds.includes(newState.character)
      ? [...persistent.clearedWithCharacterIds]
      : [...persistent.clearedWithCharacterIds, newState.character];

    // Check which characters can now be unlocked
    const unlocked = [...persistent.unlockedCharacters];
    for (const char of CHARACTERS) {
      if (!unlocked.includes(char.id) && canUnlockCharacter(char.id, { ...persistent, clearedWithCharacterIds: clearedWith })) {
        unlocked.push(char.id);
      }
    }

    savePersistentState({
      ...persistent,
      clearedWithCharacterIds: clearedWith,
      unlockedCharacters: unlocked,
    });
    saveHighScore(newState.score);
  }

  // True Ending check: cycle === TRUE_ENDING_CYCLE AND restaurantIndexInCycle === 3 (Boss)
  if (newState.cycle === TRUE_ENDING_CYCLE && newState.restaurantIndexInCycle === 3) {
    return { ...newState, phase: 'true-ending' };
  }

  // Generate skill choices
  const pendingSkillChoices = generateSkillChoices(newState, SKILL_CHOICE_COUNT);

  // Determine if a node will follow skill selection.
  // shouldShowNode uses 1-based restaurantsCompletedInCycle count.
  // After clearing restaurantIndexInCycle N, the next would be N+1.
  const pendingNodeChoice = shouldShowNode(newState.cycle, newState.restaurantIndexInCycle + 1);

  return {
    ...newState,
    phase: 'skill-select',
    pendingSkillChoices,
    pendingNodeChoice,
  };
}

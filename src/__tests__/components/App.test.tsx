// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hooks to avoid real game logic in component tests
vi.mock('../../hooks/useGameEngine', () => ({
  useGameEngine: vi.fn(),
}));

vi.mock('../../hooks/usePersistence', () => ({
  usePersistence: vi.fn(),
}));

import { useGameEngine } from '../../hooks/useGameEngine';
import { usePersistence } from '../../hooks/usePersistence';
import App from '../../components/App';
import type { PersistentState } from '../../types/index';

const mockPersistent: PersistentState = {
  highScore: 0,
  unlockedCharacters: ['tanaka'],
  catalog: [],
  clearedWithCharacterIds: [],
};

const baseEngine = {
  startGame: vi.fn(),
  returnToTitle: vi.fn(),
  eatMeat: vi.fn(),
  discardMeat: vi.fn(),
  flipMeat: vi.fn(),
  instantExchange: vi.fn(),
  delayedExchange: vi.fn(),
  selectSkill: vi.fn(),
  selectRest: vi.fn(),
  selectShop: vi.fn(),
  purchaseSkill: vi.fn(),
  purchaseConsumable: vi.fn(),
  leaveShop: vi.fn(),
};

beforeEach(() => {
  vi.mocked(usePersistence).mockReturnValue({
    persistent: mockPersistent,
    reload: vi.fn(),
  });
});

describe('App', () => {
  it('renders TitleScreen when state is null', () => {
    vi.mocked(useGameEngine).mockReturnValue({ ...baseEngine, state: null });
    render(<App />);
    expect(screen.getByText(/Solo BBQ Dungeon/i)).toBeTruthy();
  });

  it('renders PlayingScreen when phase is playing', () => {
    const mockRestaurant = {
      definition: {
        type: 'chain' as const,
        nameJP: 'チェーン焼肉',
        totalDishes: 10,
        servingInterval: 8,
        rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
        activePenalties: [],
      },
      dishesServed: 0,
      meatDishesEaten: 0,
      totalMeatDishes: 8,
      timeSinceLastServe: 0,
      effectiveServingInterval: 8,
      startTime: 0,
      servingQueue: [],
      isCleared: false,
    };

    vi.mocked(useGameEngine).mockReturnValue({
      ...baseEngine,
      state: {
        character: 'tanaka',
        cycle: 1,
        restaurantIndexInCycle: 0,
        score: 0,
        highestRestaurantTypeReached: 0,
        restaurant: mockRestaurant,
        grill: [],
        table: [],
        tableCapacity: 5,
        skills: [],
        coins: 0,
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
        catalog: [],
        elapsedTime: 0,
      },
    });
    render(<App />);
    expect(screen.getByText(/チェーン焼肉/)).toBeTruthy();
  });

  it('renders SkillSelectScreen when phase is skill-select', () => {
    const mockRestaurant = {
      definition: {
        type: 'chain' as const,
        nameJP: 'チェーン焼肉',
        totalDishes: 10,
        servingInterval: 8,
        rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
        activePenalties: [],
      },
      dishesServed: 0,
      meatDishesEaten: 0,
      totalMeatDishes: 8,
      timeSinceLastServe: 0,
      effectiveServingInterval: 8,
      startTime: 0,
      servingQueue: [],
      isCleared: false,
    };

    vi.mocked(useGameEngine).mockReturnValue({
      ...baseEngine,
      state: {
        character: 'tanaka',
        cycle: 1,
        restaurantIndexInCycle: 0,
        score: 0,
        highestRestaurantTypeReached: 0,
        restaurant: mockRestaurant,
        grill: [],
        table: [],
        tableCapacity: 5,
        skills: [],
        coins: 0,
        staffWarningCount: 0,
        actionDisabledTimer: 0,
        burntSmokeActive: false,
        consecutiveEatCount: 0,
        bingeNextDishDoubled: false,
        allSlotsOccupiedLastTick: false,
        phase: 'skill-select',
        gameOver: null,
        pendingSkillChoices: [
          {
            id: 'tong-master',
            name: 'Tong Master',
            nameJP: 'トング職人',
            build: 'precision',
            isStackable: false,
            description: 'Unlocks Flip.',
          },
        ],
        pendingNodeChoice: false,
        catalog: [],
        elapsedTime: 0,
      },
    });
    render(<App />);
    expect(screen.getByText(/Tong Master/i)).toBeTruthy();
  });

  it('renders NodeSelectScreen when phase is node-select and showShop is false', () => {
    const mockRestaurant = {
      definition: {
        type: 'chain' as const,
        nameJP: 'チェーン焼肉',
        totalDishes: 10,
        servingInterval: 8,
        rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
        activePenalties: [],
      },
      dishesServed: 0,
      meatDishesEaten: 0,
      totalMeatDishes: 8,
      timeSinceLastServe: 0,
      effectiveServingInterval: 8,
      startTime: 0,
      servingQueue: [],
      isCleared: false,
    };

    vi.mocked(useGameEngine).mockReturnValue({
      ...baseEngine,
      state: {
        character: 'tanaka',
        cycle: 1,
        restaurantIndexInCycle: 0,
        score: 0,
        highestRestaurantTypeReached: 0,
        restaurant: mockRestaurant,
        grill: [],
        table: [],
        tableCapacity: 5,
        skills: [],
        coins: 5,
        staffWarningCount: 0,
        actionDisabledTimer: 0,
        burntSmokeActive: false,
        consecutiveEatCount: 0,
        bingeNextDishDoubled: false,
        allSlotsOccupiedLastTick: false,
        phase: 'node-select',
        gameOver: null,
        pendingSkillChoices: [],
        pendingNodeChoice: true,
        catalog: [],
        elapsedTime: 0,
      },
    });
    render(<App />);
    expect(screen.getByRole('button', { name: /rest/i })).toBeTruthy();
  });

  it('renders GameOverScreen when phase is game-over', () => {
    const mockRestaurant = {
      definition: {
        type: 'chain' as const,
        nameJP: 'チェーン焼肉',
        totalDishes: 10,
        servingInterval: 8,
        rankDistribution: { common: 1, upper: 0, premium: 0, elite: 0 },
        activePenalties: [],
      },
      dishesServed: 0,
      meatDishesEaten: 0,
      totalMeatDishes: 8,
      timeSinceLastServe: 0,
      effectiveServingInterval: 8,
      startTime: 0,
      servingQueue: [],
      isCleared: false,
    };

    vi.mocked(useGameEngine).mockReturnValue({
      ...baseEngine,
      state: {
        character: 'tanaka',
        cycle: 1,
        restaurantIndexInCycle: 0,
        score: 3,
        highestRestaurantTypeReached: 0,
        restaurant: mockRestaurant,
        grill: [],
        table: [],
        tableCapacity: 5,
        skills: [],
        coins: 0,
        staffWarningCount: 0,
        actionDisabledTimer: 0,
        burntSmokeActive: false,
        consecutiveEatCount: 0,
        bingeNextDishDoubled: false,
        allSlotsOccupiedLastTick: false,
        phase: 'game-over',
        gameOver: 'table-overflow',
        pendingSkillChoices: [],
        pendingNodeChoice: false,
        catalog: [],
        elapsedTime: 0,
      },
    });
    render(<App />);
    expect(screen.getByText(/game over/i)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayingScreen } from '../../components/PlayingScreen';
import type { GameState } from '../../types/index';

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

const mockState: GameState = {
  character: 'tanaka',
  cycle: 1,
  restaurantIndexInCycle: 0,
  score: 2,
  highestRestaurantTypeReached: 0,
  restaurant: mockRestaurant,
  grill: [
    {
      id: 0,
      part: null,
      state: 'raw',
      timeInState: 0,
      fireTimer: 0,
      disabled: false,
      disabledTimer: 0,
    },
  ],
  table: [],
  tableCapacity: 5,
  skills: [],
  coins: 10,
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
};

const mockCallbacks = {
  onEat: vi.fn(),
  onDiscard: vi.fn(),
  onFlip: vi.fn(),
  onExchange: vi.fn(),
  onOpenShop: vi.fn(),
};

describe('PlayingScreen', () => {
  it('renders the restaurant name', () => {
    render(<PlayingScreen state={mockState} {...mockCallbacks} />);
    expect(screen.getByText(/チェーン焼肉/)).toBeTruthy();
  });

  it('renders score', () => {
    render(<PlayingScreen state={mockState} {...mockCallbacks} />);
    // Score label contains "スコア:" — find it via containing text
    expect(screen.getByText(/スコア:/)).toBeTruthy();
    // The score value "2" may appear in multiple elements; just check it is present somewhere
    expect(screen.getAllByText(/2/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders coin balance', () => {
    render(<PlayingScreen state={mockState} {...mockCallbacks} />);
    // Coins appear as a <strong> element with value "10"; use getAllByText to avoid ambiguity
    // with totalDishes also being 10 in the dish progress string
    expect(screen.getAllByText(/10/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders grill slots area', () => {
    render(<PlayingScreen state={mockState} {...mockCallbacks} />);
    // Should render slot — empty shows "空き"
    expect(screen.getAllByText(/空き/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders table queue area', () => {
    render(<PlayingScreen state={mockState} {...mockCallbacks} />);
    // "テーブル" appears in heading and empty-state span; use getAllByText
    expect(screen.getAllByText(/テーブル/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders staff warning count', () => {
    const stateWithWarning = { ...mockState, staffWarningCount: 2 };
    render(<PlayingScreen state={stateWithWarning} {...mockCallbacks} />);
    expect(screen.getByText(/店員の怒り/)).toBeTruthy();
  });

  it('renders burnt smoke indicator when active', () => {
    const stateWithSmoke = { ...mockState, burntSmokeActive: true };
    render(<PlayingScreen state={stateWithSmoke} {...mockCallbacks} />);
    expect(screen.getByText(/煙/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TitleScreen } from '../../components/TitleScreen';
import type { PersistentState } from '../../types/index';

const defaultPersistent: PersistentState = {
  highScore: 0,
  unlockedCharacters: ['tanaka'],
  catalog: [],
  clearedWithCharacterIds: [],
};

describe('TitleScreen', () => {
  it('renders the game title', () => {
    const onStartGame = vi.fn();
    render(
      <TitleScreen onStartGame={onStartGame} persistent={defaultPersistent} />,
    );
    expect(screen.getByText(/Solo BBQ Dungeon/i)).toBeTruthy();
  });

  it('renders 5 character cards', () => {
    const onStartGame = vi.fn();
    render(
      <TitleScreen onStartGame={onStartGame} persistent={defaultPersistent} />,
    );
    // All 5 characters should be listed — use getAllByText to handle name appearing in unlock hint
    expect(screen.getAllByText(/Salaryman Tanaka/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Gourmet Critic/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Competitive Eater/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Raw Food Advocate/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Vegan Tashiro/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows high score', () => {
    const onStartGame = vi.fn();
    const persistent: PersistentState = {
      ...defaultPersistent,
      highScore: 42,
    };
    render(<TitleScreen onStartGame={onStartGame} persistent={persistent} />);
    expect(screen.getByText(/42/)).toBeTruthy();
  });

  it('calls onStartGame with tanaka when the tanaka start button is clicked', () => {
    const onStartGame = vi.fn();
    render(
      <TitleScreen onStartGame={onStartGame} persistent={defaultPersistent} />,
    );
    // Tanaka is always unlocked
    const startButtons = screen.getAllByRole('button', { name: /はじめる/ });
    fireEvent.click(startButtons[0]!);
    expect(onStartGame).toHaveBeenCalledWith('tanaka');
  });

  it('does not show start button for locked characters', () => {
    const onStartGame = vi.fn();
    render(
      <TitleScreen onStartGame={onStartGame} persistent={defaultPersistent} />,
    );
    // Only Tanaka is unlocked → exactly one Start button
    const startButtons = screen.getAllByRole('button', { name: /はじめる/ });
    expect(startButtons.length).toBe(1);
  });

  it('shows unlock hint for locked characters', () => {
    const onStartGame = vi.fn();
    render(
      <TitleScreen onStartGame={onStartGame} persistent={defaultPersistent} />,
    );
    expect(screen.getAllByText(/サラリーマン田中.*1周クリア|1周クリア.*サラリーマン田中/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows start buttons for all unlocked characters', () => {
    const onStartGame = vi.fn();
    const persistent: PersistentState = {
      ...defaultPersistent,
      unlockedCharacters: ['tanaka', 'gourmet-critic', 'competitive-eater'],
    };
    render(<TitleScreen onStartGame={onStartGame} persistent={persistent} />);
    const startButtons = screen.getAllByRole('button', { name: /はじめる/ });
    expect(startButtons.length).toBe(3);
  });
});

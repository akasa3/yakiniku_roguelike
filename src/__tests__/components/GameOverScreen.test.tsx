// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameOverScreen } from '../../components/GameOverScreen';
import type { GameOverReason, CharacterId, SkillDefinition } from '../../types/index';

const mockSkills: SkillDefinition[] = [
  {
    id: 'tong-master',
    name: 'Tong Master',
    nameJP: 'トング職人',
    build: 'precision',
    isStackable: false,
    description: 'Unlocks the Flip action.',
  },
];

describe('GameOverScreen', () => {
  it('renders game over heading', () => {
    render(
      <GameOverScreen
        reason={'table-overflow' as GameOverReason}
        score={5}
        character={'tanaka' as CharacterId}
        skills={mockSkills}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/ゲームオーバー/)).toBeTruthy();
  });

  it('renders the game over reason', () => {
    render(
      <GameOverScreen
        reason={'table-overflow' as GameOverReason}
        score={5}
        character={'tanaka' as CharacterId}
        skills={mockSkills}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/table/i)).toBeTruthy();
  });

  it('renders score', () => {
    render(
      <GameOverScreen
        reason={'grill-fire' as GameOverReason}
        score={7}
        character={'tanaka' as CharacterId}
        skills={mockSkills}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/7/)).toBeTruthy();
  });

  it('renders character name', () => {
    render(
      <GameOverScreen
        reason={'raw-paralysis' as GameOverReason}
        score={3}
        character={'gourmet-critic' as CharacterId}
        skills={mockSkills}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/Gourmet Critic/i)).toBeTruthy();
  });

  it('renders skills used in the run', () => {
    render(
      <GameOverScreen
        reason={'burnt-instant' as GameOverReason}
        score={2}
        character={'tanaka' as CharacterId}
        skills={mockSkills}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/Tong Master/i)).toBeTruthy();
  });

  it('calls onReturnToTitle when button clicked', () => {
    const onReturnToTitle = vi.fn();
    render(
      <GameOverScreen
        reason={'table-overflow' as GameOverReason}
        score={0}
        character={'tanaka' as CharacterId}
        skills={[]}
        onReturnToTitle={onReturnToTitle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /タイトルに戻る|title|return|retry|menu/i }));
    expect(onReturnToTitle).toHaveBeenCalledOnce();
  });

  it('renders different reasons correctly', () => {
    const { rerender } = render(
      <GameOverScreen
        reason={'grill-fire' as GameOverReason}
        score={1}
        character={'tanaka' as CharacterId}
        skills={[]}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/fire/i)).toBeTruthy();

    rerender(
      <GameOverScreen
        reason={'raw-paralysis' as GameOverReason}
        score={1}
        character={'tanaka' as CharacterId}
        skills={[]}
        onReturnToTitle={vi.fn()}
      />,
    );
    expect(screen.getByText(/raw|paralysis/i)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillSelectScreen } from '../../components/SkillSelectScreen';
import type { SkillDefinition } from '../../types/index';

const mockSkills: SkillDefinition[] = [
  {
    id: 'tong-master',
    name: 'Tong Master',
    nameJP: 'トング職人',
    build: 'precision',
    isStackable: false,
    description: 'Unlocks the Flip action.',
  },
  {
    id: 'extra-slot',
    name: 'Extra Slot',
    nameJP: 'スロット増設',
    build: 'volume',
    isStackable: true,
    description: 'Adds grill slots.',
  },
  {
    id: 'speed-eater',
    name: 'Speed Eater',
    nameJP: '早食い',
    build: 'speed',
    isStackable: false,
    description: 'Eating action time reduced.',
  },
];

describe('SkillSelectScreen', () => {
  it('renders the skill select heading', () => {
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={vi.fn()}
      />,
    );
    // Use getByRole heading to avoid ambiguity with "Choose 1 skill to acquire" paragraph
    expect(screen.getByRole('heading', { name: /skill/i })).toBeTruthy();
  });

  it('renders all skill cards', () => {
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={vi.fn()}
      />,
    );
    expect(screen.getByText(/Tong Master/i)).toBeTruthy();
    expect(screen.getByText(/Extra Slot/i)).toBeTruthy();
    expect(screen.getByText(/Speed Eater/i)).toBeTruthy();
  });

  it('renders skill descriptions', () => {
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={vi.fn()}
      />,
    );
    expect(screen.getByText(/Unlocks the Flip action/i)).toBeTruthy();
  });

  it('renders Japanese names', () => {
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={vi.fn()}
      />,
    );
    expect(screen.getByText(/トング職人/)).toBeTruthy();
  });

  it('calls onSelectSkill with skill id when card is clicked', () => {
    const onSelectSkill = vi.fn();
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={onSelectSkill}
      />,
    );
    fireEvent.click(screen.getByText(/Tong Master/i));
    expect(onSelectSkill).toHaveBeenCalledWith('tong-master');
  });

  it('renders select buttons for each skill', () => {
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={vi.fn()}
      />,
    );
    const selectButtons = screen.getAllByRole('button', { name: /選択/ });
    expect(selectButtons.length).toBe(3);
  });

  it('calls onSelectSkill when select button clicked', () => {
    const onSelectSkill = vi.fn();
    render(
      <SkillSelectScreen
        pendingSkillChoices={mockSkills}
        score={3}
        coins={25}
        restaurantName="テストチェーン"
        restaurantType="chain"
        onSelectSkill={onSelectSkill}
      />,
    );
    const selectButtons = screen.getAllByRole('button', { name: /選択/ });
    fireEvent.click(selectButtons[1]!);
    expect(onSelectSkill).toHaveBeenCalledWith('extra-slot');
  });
});

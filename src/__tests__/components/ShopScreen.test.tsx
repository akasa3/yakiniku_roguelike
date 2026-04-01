// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShopScreen } from '../../components/ShopScreen';
import type { SkillDefinition, ConsumableItem } from '../../types/index';

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

const mockConsumables: ConsumableItem[] = [
  {
    id: 'warning-reducer',
    name: 'Apology Drink',
    nameJP: 'お詫びドリンク',
    cost: 3,
    effect: { type: 'clear-warning', amount: 2 },
  },
];

describe('ShopScreen', () => {
  it('renders shop heading', () => {
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={vi.fn()}
      />,
    );
    // Use getByRole heading to avoid ambiguity with "Leave Shop" button also matching /shop/i
    expect(screen.getByRole('heading', { name: /shop/i })).toBeTruthy();
  });

  it('renders coin balance', () => {
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/50/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders skill names', () => {
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={vi.fn()}
      />,
    );
    expect(screen.getByText(/Tong Master/i)).toBeTruthy();
  });

  it('renders consumable names', () => {
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={vi.fn()}
      />,
    );
    expect(screen.getByText(/Apology Drink/i)).toBeTruthy();
  });

  it('calls onPurchaseSkill when buy skill button clicked', () => {
    const onPurchaseSkill = vi.fn();
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={onPurchaseSkill}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={vi.fn()}
      />,
    );
    const buyButtons = screen.getAllByRole('button', { name: /購入/ });
    fireEvent.click(buyButtons[0]!);
    expect(onPurchaseSkill).toHaveBeenCalledWith('tong-master');
  });

  it('calls onPurchaseConsumable when buy consumable button clicked', () => {
    const onPurchaseConsumable = vi.fn();
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={onPurchaseConsumable}
        onLeaveShop={vi.fn()}
      />,
    );
    const buyButtons = screen.getAllByRole('button', { name: /購入/ });
    // Second buy button is for the consumable
    fireEvent.click(buyButtons[1]!);
    expect(onPurchaseConsumable).toHaveBeenCalledWith('warning-reducer');
  });

  it('calls onLeaveShop when leave button clicked', () => {
    const onLeaveShop = vi.fn();
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={onLeaveShop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /leave|exit|close/i }));
    expect(onLeaveShop).toHaveBeenCalledOnce();
  });

  it('shows cost for consumables', () => {
    render(
      <ShopScreen
        coins={50}
        skills={mockSkills}
        consumables={mockConsumables}
        onPurchaseSkill={vi.fn()}
        onPurchaseConsumable={vi.fn()}
        onLeaveShop={vi.fn()}
      />,
    );
    // Cost "💰3" rendered in a span — use getAllByText to handle parent elements also matching
    expect(screen.getAllByText(/3/).length).toBeGreaterThanOrEqual(1);
  });
});

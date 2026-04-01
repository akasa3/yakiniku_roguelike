// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NodeSelectScreen } from '../../components/NodeSelectScreen';

describe('NodeSelectScreen', () => {
  it('renders node select heading', () => {
    render(
      <NodeSelectScreen
        onSelectRest={vi.fn()}
        onSelectShop={vi.fn()}
      />,
    );
    // Use getByRole heading to avoid matching button text and description paragraphs
    expect(screen.getByRole('heading', { name: /choose|node|path/i })).toBeTruthy();
  });

  it('renders Rest option', () => {
    render(
      <NodeSelectScreen
        onSelectRest={vi.fn()}
        onSelectShop={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /rest/i })).toBeTruthy();
  });

  it('renders Shop option', () => {
    render(
      <NodeSelectScreen
        onSelectRest={vi.fn()}
        onSelectShop={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /shop/i })).toBeTruthy();
  });

  it('calls onSelectRest when Rest button clicked', () => {
    const onSelectRest = vi.fn();
    render(
      <NodeSelectScreen
        onSelectRest={onSelectRest}
        onSelectShop={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /rest/i }));
    expect(onSelectRest).toHaveBeenCalledOnce();
  });

  it('calls onSelectShop when Shop button clicked', () => {
    const onSelectShop = vi.fn();
    render(
      <NodeSelectScreen
        onSelectRest={vi.fn()}
        onSelectShop={onSelectShop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /shop/i }));
    expect(onSelectShop).toHaveBeenCalledOnce();
  });

  it('shows rest description', () => {
    render(
      <NodeSelectScreen
        onSelectRest={vi.fn()}
        onSelectShop={vi.fn()}
      />,
    );
    // Rest description mentions デバフ解除 (debuff removal) or スタッフ警告 (staff warning reset)
    expect(screen.getAllByText(/デバフ|警告|リセット|解除/).length).toBeGreaterThanOrEqual(1);
  });
});

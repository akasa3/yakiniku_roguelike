// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GrillSlotComponent } from '../../components/GrillSlot';
import type { GrillSlot, Part } from '../../types/index';

const mockMeat: Part = {
  id: 'karubi',
  name: 'Karubi',
  nameJP: 'カルビ',
  rank: 'common',
  grillTime: 10,
  flareRisk: 0.2,
  sweetSpot: 2,
  flavorText: 'Classic BBQ beef rib.',
  isVegetable: false,
};

const emptySlot: GrillSlot = {
  id: 0,
  part: null,
  state: 'raw',
  timeInState: 0,
  fireTimer: 0,
  disabled: false,
  disabledTimer: 0,
};

const occupiedSlot: GrillSlot = {
  id: 1,
  part: mockMeat,
  state: 'medium',
  timeInState: 5,
  fireTimer: 0,
  disabled: false,
  disabledTimer: 0,
};

const disabledSlot: GrillSlot = {
  id: 2,
  part: null,
  state: 'raw',
  timeInState: 0,
  fireTimer: 5,
  disabled: true,
  disabledTimer: 5,
};

describe('GrillSlotComponent', () => {
  it('renders empty state when no part', () => {
    render(
      <GrillSlotComponent
        slot={emptySlot}
        slotIndex={0}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByText(/空き/)).toBeTruthy();
  });

  it('renders meat name when occupied', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Karubi/i)).toBeTruthy();
  });

  it('renders grilling state label', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByText(/ミディアム/)).toBeTruthy();
  });

  it('shows Eat and Discard buttons when occupied', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /食べる/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /捨てる/ })).toBeTruthy();
  });

  it('calls onEat with slotIndex when Eat button clicked', () => {
    const onEat = vi.fn();
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={onEat}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /食べる/ }));
    expect(onEat).toHaveBeenCalledWith(1);
  });

  it('calls onDiscard with slotIndex when Discard button clicked', () => {
    const onDiscard = vi.fn();
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={onDiscard}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /捨てる/ }));
    expect(onDiscard).toHaveBeenCalledWith(1);
  });

  it('shows Flip button when hasTongMaster and occupied', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={true}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /裏返す/ })).toBeTruthy();
  });

  it('does not show Flip button without tongMaster', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /裏返す/ })).toBeNull();
  });

  it('calls onFlip with slotIndex when Flip clicked', () => {
    const onFlip = vi.fn();
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={true}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={onFlip}
        onExchange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /裏返す/ }));
    expect(onFlip).toHaveBeenCalledWith(1);
  });

  it('shows Exchange button when isVegan and occupied with meat', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={true}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /交換/ })).toBeTruthy();
  });

  it('does not show Exchange button when not vegan', () => {
    render(
      <GrillSlotComponent
        slot={occupiedSlot}
        slotIndex={1}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /交換/ })).toBeNull();
  });

  it('renders disabled/fire state visually', () => {
    render(
      <GrillSlotComponent
        slot={disabledSlot}
        slotIndex={2}
        hasTongMaster={false}
        isVegan={false}
        onEat={vi.fn()}
        onDiscard={vi.fn()}
        onFlip={vi.fn()}
        onExchange={vi.fn()}
      />,
    );
    expect(screen.getByText(/炎上中/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrueEndingScreen } from '../../components/TrueEndingScreen';

describe('TrueEndingScreen', () => {
  it('renders congratulations or victory message', () => {
    render(
      <TrueEndingScreen
        score={20}
        character={'tanaka'}
        onReturnToTitle={vi.fn()}
      />,
    );
    // "TRUE ENDING!" heading is the most specific match — use getByRole to avoid ambiguity
    // with "Congratulations" paragraph also matching /congrat|true|ending/
    expect(screen.getAllByText(/congrat|victory|clear|ending|true/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the score', () => {
    render(
      <TrueEndingScreen
        score={20}
        character={'tanaka'}
        onReturnToTitle={vi.fn()}
      />,
    );
    // "20" appears in both <strong> and its parent <div>; use getAllByText
    expect(screen.getAllByText(/20/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the character name', () => {
    render(
      <TrueEndingScreen
        score={20}
        character={'competitive-eater'}
        onReturnToTitle={vi.fn()}
      />,
    );
    // Character name appears in <strong> and its parent <p>; use getAllByText
    expect(screen.getAllByText(/Competitive Eater/i).length).toBeGreaterThanOrEqual(1);
  });

  it('calls onReturnToTitle when return button clicked', () => {
    const onReturnToTitle = vi.fn();
    render(
      <TrueEndingScreen
        score={20}
        character={'tanaka'}
        onReturnToTitle={onReturnToTitle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /タイトルに戻る|title|return|menu/i }));
    expect(onReturnToTitle).toHaveBeenCalledOnce();
  });

  it('renders some Japanese text for theme', () => {
    render(
      <TrueEndingScreen
        score={20}
        character={'tanaka'}
        onReturnToTitle={vi.fn()}
      />,
    );
    // Check for any Japanese characters in the document
    const allText = document.body.textContent ?? '';
    const hasJapanese = /[\u3000-\u9fff\uff00-\uffef]/.test(allText);
    expect(hasJapanese).toBe(true);
  });
});

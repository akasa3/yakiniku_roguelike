import type React from 'react';
import type { GrillSlot } from '../types/index';

interface GrillSlotProps {
  readonly slot: GrillSlot;
  readonly slotIndex: number;
  readonly hasTongMaster: boolean;
  readonly isVegan: boolean;
  readonly onEat: (slotIndex: number) => void;
  readonly onDiscard: (slotIndex: number) => void;
  readonly onFlip: (slotIndex: number) => void;
  readonly onExchange: (slotIndex: number) => void;
  readonly onDelayedExchange?: (slotIndex: number) => void;
  readonly coins?: number;
}

const STATE_COLORS: Record<string, string> = {
  raw: '#ff7043',
  rare: '#e91e63',
  medium: '#ff9800',
  'well-done': '#8d6e63',
  burnt: '#212121',
};

const STATE_LABELS_JP: Record<string, string> = {
  raw: '生',
  rare: 'レア',
  medium: 'ミディアム',
  'well-done': 'ウェルダン',
  burnt: 'コゲ',
};

export function GrillSlotComponent({
  slot,
  slotIndex,
  hasTongMaster,
  isVegan,
  onEat,
  onDiscard,
  onFlip,
  onDelayedExchange,
  coins = 0,
  onExchange,
}: GrillSlotProps) {
  const btnStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    padding: '0.2rem 0.5rem',
    border: '1px solid #666',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#2a2a2a',
    color: '#eee',
  };

  if (slot.disabled) {
    return (
      <div
        style={{
          border: '2px solid #f44336',
          borderRadius: '4px',
          padding: '0.5rem',
          minHeight: '80px',
          background: '#1a0000',
        }}
      >
        <div style={{ color: '#f44336', fontWeight: 'bold' }}>🔥 炎上中！</div>
        <div style={{ color: '#888', fontSize: '0.75rem' }}>
          行動不能 ({slot.disabledTimer.toFixed(1)}s)
        </div>
      </div>
    );
  }

  if (slot.part === null) {
    return (
      <div
        style={{
          border: '1px dashed #444',
          borderRadius: '4px',
          padding: '0.5rem',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555',
        }}
      >
        — 空き —
      </div>
    );
  }

  const part = slot.part;
  const stateColor = STATE_COLORS[slot.state] ?? '#aaa';
  const isVegetable = part.isVegetable;
  const showExchange = isVegan && !isVegetable;

  // Progress within the current grilling state
  const threshold = slot.state === 'well-done' ? part.sweetSpot : part.grillTime;
  const progressPct = slot.state === 'burnt'
    ? 100
    : Math.min(100, (slot.timeInState / (threshold || 1)) * 100);

  return (
    <div
      style={{
        border: `2px solid ${stateColor}`,
        borderRadius: '4px',
        padding: '0.5rem',
        minHeight: '80px',
        background: '#1a1a1a',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 'bold' }}>
          {part.name} {!part.isVegetable ? `(${part.rank})` : '🥦'}
        </span>
        <span style={{ color: stateColor, fontWeight: 'bold', fontSize: '0.85rem' }}>
          {STATE_LABELS_JP[slot.state] ?? slot.state}
        </span>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.25rem' }}>
        {part.nameJP}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '4px',
          background: '#333',
          borderRadius: '2px',
          marginBottom: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: stateColor,
          }}
        />
      </div>

      {slot.state === 'well-done' && (
        <div style={{ color: '#4caf50', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          ✨ 最高！— 今すぐ食べて！
        </div>
      )}
      {slot.state === 'burnt' && (
        <div style={{ color: '#f44336', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          ❌ 焦げた — 捨てるしかない
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        <button
          style={{
            ...btnStyle,
            ...(slot.state === 'burnt' ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
            ...(slot.state === 'well-done' ? { background: '#1b5e20', color: '#a5d6a7' } : {}),
          }}
          onClick={() => onEat(slotIndex)}
          disabled={slot.state === 'burnt'}
        >
          食べる
        </button>
        <button style={btnStyle} onClick={() => onDiscard(slotIndex)}>
          捨てる
        </button>
        {hasTongMaster && (
          <button style={btnStyle} onClick={() => onFlip(slotIndex)}>
            裏返す
          </button>
        )}
        {showExchange && (
          <>
            <button
              style={{
                ...btnStyle,
                color: '#a5d6a7',
                ...(coins < 3 ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
              onClick={() => onExchange(slotIndex)}
              disabled={coins < 3}
            >
              即交換💰3
            </button>
            {onDelayedExchange && (
              <button
                style={{ ...btnStyle, color: '#81c784' }}
                onClick={() => onDelayedExchange(slotIndex)}
              >
                遅延交換(無料)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

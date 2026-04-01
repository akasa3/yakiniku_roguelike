import type { GameState } from '../types/index';
import { GrillSlotComponent } from './GrillSlot';

interface PlayingScreenProps {
  readonly state: GameState;
  readonly onEat: (slotIndex: number) => void;
  readonly onDiscard: (slotIndex: number) => void;
  readonly onFlip: (slotIndex: number) => void;
  readonly onExchange: (slotIndex: number) => void;
  readonly onDelayedExchange?: (slotIndex: number) => void;
  readonly onOpenShop?: () => void;
}

export function PlayingScreen({
  state,
  onEat,
  onDiscard,
  onFlip,
  onExchange,
  onDelayedExchange,
}: PlayingScreenProps) {
  const hasTongMaster = state.skills.includes('tong-master');
  const isVegan = state.character === 'vegan-tashiro';

  const eaten = state.restaurant.meatDishesEaten;
  const total = state.restaurant.totalMeatDishes;
  const remaining = Math.max(0, total - eaten);
  const dishProgress = `${eaten} / ${total}`;

  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem', maxWidth: '700px', margin: '0 auto' }}>
      {/* Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #444',
          paddingBottom: '0.5rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {state.restaurant.definition.nameJP}
          </span>
          <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.85rem' }}>
            [{state.restaurant.definition.type}]
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <span>スコア: <strong>{state.score}</strong></span>
          <span>💰 <strong>{state.coins}</strong></span>
          <span>食べた: {dishProgress}</span>
          <span style={{ color: '#888' }}>残り: {remaining}</span>
        </div>
      </div>

      {/* Staff Anger Meter — always visible */}
      <div
        style={{
          background: '#1a0a00',
          border: `1px solid ${state.staffWarningCount >= 5 ? '#f44336' : state.staffWarningCount >= 3 ? '#ff9800' : '#8d4e00'}`,
          borderRadius: '4px',
          padding: '0.4rem 0.75rem',
          marginBottom: '0.75rem',
          display: 'flex',
          gap: '1rem',
          fontSize: '0.85rem',
        }}
      >
        <span style={{
          color: state.staffWarningCount >= 7 ? '#f44336'
            : state.staffWarningCount >= 5 ? '#ff5722'
            : state.staffWarningCount >= 3 ? '#ff9800'
            : state.staffWarningCount > 0 ? '#ffb74d'
            : '#666',
        }}>
          😤 店員の怒り: {state.staffWarningCount}/8
          {state.staffWarningCount >= 7 && ' 🚪 もうすぐ退店！'}
          {state.staffWarningCount >= 5 && state.staffWarningCount < 7 && ' 😡 激怒（食べる速度低下）'}
          {state.staffWarningCount >= 3 && state.staffWarningCount < 5 && ' ⚠ 注意'}
        </span>
        {state.burntSmokeActive && (
          <span style={{ color: '#bdbdbd' }}>💨 煙</span>
        )}
        {state.actionDisabledTimer > 0 && (
          <span style={{ color: '#ef9a9a' }}>
            🚫 行動不能 ({state.actionDisabledTimer.toFixed(1)}s)
          </span>
        )}
      </div>

      {/* Restaurant Info */}
      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>
        {state.cycle}周目 — 提供間隔: {state.restaurant.effectiveServingInterval.toFixed(1)}s
      </div>

      {/* Grill Area */}
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>
        グリル <small style={{ color: '#888', fontSize: '0.75rem' }}>Grill</small> ({state.grill.length} 枠)
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {state.grill.map((slot, i) => (
          <GrillSlotComponent
            key={`${slot.id}-${slot.part?.id ?? 'empty'}-${slot.state}`}
            slot={slot}
            slotIndex={i}
            hasTongMaster={hasTongMaster}
            isVegan={isVegan}
            onEat={onEat}
            onDiscard={onDiscard}
            onFlip={onFlip}
            onExchange={onExchange}
            onDelayedExchange={onDelayedExchange}
            coins={state.coins}
          />
        ))}
      </div>

      {/* Table Queue */}
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>
        テーブル待ち <small style={{ color: '#888', fontSize: '0.75rem' }}>Table Queue</small> ({state.table.length}/{state.tableCapacity})
      </h3>
      <div
        style={{
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '0.5rem',
          minHeight: '48px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          alignItems: 'center',
        }}
      >
        {state.table.length === 0 ? (
          <span style={{ color: '#555', fontSize: '0.85rem' }}>— テーブル空き —</span>
        ) : (
          state.table.map((part, i) => (
            <span
              key={i}
              style={{
                background: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: '3px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.8rem',
              }}
            >
              {part.nameJP}
            </span>
          ))
        )}
      </div>

      {/* Skills */}
      {state.skills.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888' }}>
          スキル: {state.skills.join(', ')}
        </div>
      )}
    </div>
  );
}

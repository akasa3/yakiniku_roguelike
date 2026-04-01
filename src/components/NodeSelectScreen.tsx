import type React from 'react';

interface NodeSelectScreenProps {
  readonly onSelectRest: () => void;
  readonly onSelectShop: () => void;
}

export function NodeSelectScreen({ onSelectRest, onSelectShop }: NodeSelectScreenProps) {
  const btnStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '1rem',
    padding: '0.75rem 2rem',
    border: '1px solid #666',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>🍽 次の行き先を選択 <small style={{ color: '#888', fontSize: '0.7rem' }}>Choose Your Path</small></h2>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem' }}>
        クリア！次はどうする？
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            border: '1px solid #2e7d32',
            borderRadius: '4px',
            padding: '1rem',
            background: '#0a1a0a',
          }}
        >
          <button
            style={{ ...btnStyle, background: '#1b5e20', color: '#a5d6a7' }}
            onClick={onSelectRest}
          >
            😴 休憩 <small style={{ color: '#81c784', fontSize: '0.75rem' }}>Rest</small>
          </button>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#81c784' }}>
            デバフを全解除 — スタッフ警告・煙・炎上タイマーをリセット
          </p>
        </div>

        <div
          style={{
            border: '1px solid #e65100',
            borderRadius: '4px',
            padding: '1rem',
            background: '#1a0d00',
          }}
        >
          <button
            style={{ ...btnStyle, background: '#bf360c', color: '#ffcc80' }}
            onClick={onSelectShop}
          >
            🛒 ショップ <small style={{ color: '#ffcc80', fontSize: '0.75rem' }}>Shop</small>
          </button>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#ffb74d' }}>
            コインでスキルや消耗品を購入できます。
          </p>
        </div>
      </div>
    </div>
  );
}

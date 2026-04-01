import type { CharacterId } from '../types/index';
import { CHARACTERS } from '../game/data/characters';

interface TrueEndingScreenProps {
  readonly score: number;
  readonly character: CharacterId;
  readonly onReturnToTitle: () => void;
}

export function TrueEndingScreen({ score, character, onReturnToTitle }: TrueEndingScreenProps) {
  const charDef = CHARACTERS.find((c) => c.id === character);
  const charName = charDef?.name ?? character;

  return (
    <div
      style={{
        fontFamily: 'monospace',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆🥩🔥</div>

      <h1 style={{ color: '#ffd54f', margin: '0 0 0.25rem' }}>トゥルーエンド！</h1>
      <p style={{ color: '#aaa', margin: '0 0 2rem' }}>
        TRUE ENDING — 完全制覇！
      </p>

      <div
        style={{
          border: '1px solid #ffd54f',
          borderRadius: '4px',
          padding: '1.5rem',
          background: '#1a1500',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ margin: '0 0 0.5rem', color: '#fff8e1' }}>
          おめでとうございます、<strong>{charName}</strong>！
        </p>
        <p style={{ margin: '0 0 0.5rem', color: '#aaa', fontSize: '0.9rem' }}>
          Congratulations! 全レストランを制覇しました！
        </p>
        <div style={{ fontSize: '1.5rem', color: '#ffd54f', marginTop: '1rem' }}>
          最終スコア: <strong>{score}</strong>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        ダンジョン内の全レストランを食べ尽くした。<br />
        焼肉の神様が喜んでいます。
      </p>

      <button
        onClick={onReturnToTitle}
        style={{
          fontFamily: 'monospace',
          padding: '0.6rem 2rem',
          background: '#b8860b',
          color: '#fff',
          border: '1px solid #ffd54f',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        タイトルに戻る
      </button>
    </div>
  );
}

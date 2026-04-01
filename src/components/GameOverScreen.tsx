import type { GameOverReason, CharacterId, SkillDefinition } from '../types/index';
import { CHARACTERS } from '../game/data/characters';

interface GameOverScreenProps {
  readonly reason: GameOverReason;
  readonly score: number;
  readonly character: CharacterId;
  readonly skills: readonly SkillDefinition[];
  readonly onReturnToTitle: () => void;
}

const REASON_TEXT: Record<GameOverReason, { en: string; jp: string }> = {
  'table-overflow': { en: 'Table Overflow', jp: 'テーブル満杯' },
  'grill-fire': { en: 'Grill Fire', jp: 'グリル炎上' },
  'raw-paralysis': { en: 'Raw Meat Paralysis', jp: '生肉麻痺' },
  'burnt-instant': { en: 'Instant KO by Burnt Meat', jp: '焦げ肉即死' },
  'staff-kicked-out': { en: 'Kicked Out by Staff', jp: '🚪 お客様、お帰りください' },
};

export function GameOverScreen({
  reason,
  score,
  character,
  skills,
  onReturnToTitle,
}: GameOverScreenProps) {
  const charDef = CHARACTERS.find((c) => c.id === character);
  const charName = charDef?.name ?? character;
  const reasonInfo = REASON_TEXT[reason];

  return (
    <div
      style={{
        fontFamily: 'monospace',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      {/* Receipt header */}
      <div
        style={{
          border: '1px solid #555',
          borderRadius: '4px',
          padding: '1.5rem',
          background: '#0f0f0f',
        }}
      >
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #555', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#f44336' }}>ゲームオーバー</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#888', fontSize: '0.9rem' }}>
            GAME OVER
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa' }}>原因:</span>
            <span style={{ color: '#ef9a9a' }}>
              {reasonInfo.jp} ({reasonInfo.en})
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa' }}>キャラクター:</span>
            <span>{charName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa' }}>スコア:</span>
            <span style={{ color: '#ffd54f', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {score}
            </span>
          </div>
        </div>

        {skills.length > 0 && (
          <div style={{ borderTop: '1px dashed #555', paddingTop: '0.75rem' }}>
            <div style={{ color: '#aaa', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              今回のスキル:
            </div>
            {skills.map((skill) => (
              <div key={skill.id} style={{ fontSize: '0.85rem', color: '#bbb', paddingLeft: '0.5rem' }}>
                • {skill.name} ({skill.nameJP})
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={onReturnToTitle}
            style={{
              fontFamily: 'monospace',
              padding: '0.6rem 2rem',
              background: '#c62828',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            タイトルに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

import type { SkillDefinition } from '../types/index';

interface SkillSelectScreenProps {
  readonly pendingSkillChoices: readonly SkillDefinition[];
  readonly onSelectSkill: (skillId: string) => void;
  readonly score: number;
  readonly coins: number;
  readonly restaurantName: string;
  readonly restaurantType: string;
}

export function SkillSelectScreen({
  pendingSkillChoices,
  onSelectSkill,
  score,
  coins,
  restaurantName,
  restaurantType,
}: SkillSelectScreenProps) {
  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Phase result summary */}
      <div
        style={{
          background: '#0a1a0a',
          border: '1px solid #4caf50',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>
          ✅ クリア！
        </div>
        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
          {restaurantName} [{restaurantType}]
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          <span>スコア: <strong style={{ color: '#fff' }}>{score}</strong></span>
          <span>💰 <strong style={{ color: '#ffb74d' }}>{coins}</strong> コイン</span>
        </div>
      </div>

      <h2 style={{ textAlign: 'center' }}>🎯 スキル選択 <small style={{ color: '#888', fontSize: '0.7rem' }}>Skill Select</small></h2>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '1.5rem' }}>
        スキルを1つ選んで習得
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {pendingSkillChoices.map((skill) => (
          <div
            key={skill.id}
            onClick={() => onSelectSkill(skill.id)}
            style={{
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '1rem',
              background: '#1a1a1a',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{skill.name}</span>
                <span style={{ marginLeft: '0.5rem', color: '#aaa', fontSize: '0.85rem' }}>
                  {skill.nameJP}
                </span>
                {skill.isStackable && (
                  <span style={{ marginLeft: '0.5rem', color: '#81c784', fontSize: '0.75rem' }}>
                    [重複可]
                  </span>
                )}
              </div>
              <span style={{ color: '#64b5f6', fontSize: '0.8rem' }}>{skill.build}</span>
            </div>
            <p style={{ margin: '0.5rem 0 0.75rem', fontSize: '0.85rem', color: '#bbb' }}>
              {skill.description}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectSkill(skill.id);
              }}
              style={{
                background: '#1565c0',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.9rem',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              選択
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { PersistentState, CharacterId } from '../types/index';
import { CHARACTERS, isCharacterUnlocked, getUnlockDescription } from '../game/data/characters';
import { getSkill } from '../game/data/skills';

const CHARACTER_DESCRIPTIONS: Record<string, { desc: string; trait: string }> = {
  tanaka: {
    desc: '仕事終わりに静かな焼肉を楽しみたいだけの普通のサラリーマン。特殊能力はないが弱点もない。',
    trait: '肉を捨てても スタッフ警告 が増えない',
  },
  'gourmet-critic': {
    desc: '洗練された舌を持つ評論家。プレミアム・エリート肉のスイートスポットが広いが、一般肉のコイン収入が少ない。',
    trait: 'プレミアム/エリート +1sスイートスポット、一般肉コイン×0.5',
  },
  'competitive-eater': {
    desc: '電光石火の速食い選手。食べるのは速いがスイートスポットの幅が少し狭い。量より質より量。',
    trait: '食べる速さ×0.5、スイートスポット倍率×0.8',
  },
  'raw-food-advocate': {
    desc: '生が一番という主義者。生肉を食べてもペナルティなし。ただし焦げ肉を食べると即ゲームオーバー！',
    trait: '⚠️ 焦げ肉 = 即死！ 生肉ペナルティなし。',
  },
  'vegan-tashiro': {
    desc: 'グリルの肉を野菜に交換できる。野菜を食べるとコイン×3だが、肉を食べるとスタッフ警告+2。',
    trait: '肉→野菜交換可、野菜コイン×3、肉を食べるたびに警告+2',
  },
};

interface TitleScreenProps {
  readonly onStartGame: (characterId: CharacterId) => void;
  readonly persistent: PersistentState;
}

export function TitleScreen({ onStartGame, persistent }: TitleScreenProps) {
  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem' }}>
        🥩 ソロBBQダンジョン
      </h1>
      <p style={{ textAlign: 'center', color: '#888' }}>Solo BBQ Dungeon</p>

      <div style={{ textAlign: 'center', margin: '1rem 0', fontSize: '1.2rem' }}>
        <strong>ハイスコア: {persistent.highScore}</strong>
      </div>

      <h2 style={{ marginTop: '2rem' }}>キャラクター選択 <small style={{ color: '#888', fontSize: '0.75rem' }}>Select Character</small></h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {CHARACTERS.map((char) => {
          const unlocked = isCharacterUnlocked(char.id, persistent);
          return (
            <div
              key={char.id}
              style={{
                border: '1px solid #555',
                borderRadius: '4px',
                padding: '0.75rem 1rem',
                background: unlocked ? '#1a1a1a' : '#0d0d0d',
                opacity: unlocked ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{char.name}</span>
                  <span style={{ marginLeft: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>
                    {char.nameJP}
                  </span>
                  <span
                    style={{
                      marginLeft: '0.75rem',
                      fontSize: '0.75rem',
                      color: char.type === 'balanced' ? '#4caf50' : char.type === 'specialist' ? '#2196f3' : '#ff9800',
                    }}
                  >
                    [{char.type}]
                  </span>
                </div>
                {unlocked ? (
                  <button
                    onClick={() => onStartGame(char.id)}
                    style={{
                      background: '#c62828',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.4rem 1rem',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                  >
                    はじめる
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>🔒 未解放</span>
                )}
              </div>
              {/* Character description — always shown */}
              {(() => {
                const info = CHARACTER_DESCRIPTIONS[char.id];
                const starterSkill = (() => { try { return getSkill(char.starterSkillId); } catch { return null; } })();
                return (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    <div style={{ color: '#bbb' }}>{info?.desc}</div>
                    <div style={{ color: '#ffb74d', marginTop: '0.25rem' }}>
                      ⚡ {info?.trait}
                    </div>
                    {starterSkill && (
                      <div style={{ color: '#81c784', marginTop: '0.2rem' }}>
                        🎯 初期スキル: {starterSkill.nameJP} ({starterSkill.name})
                      </div>
                    )}
                    {!unlocked && (
                      <div style={{ color: '#777', marginTop: '0.2rem' }}>
                        🔒 {getUnlockDescription(char.unlockCondition)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Game Rules */}
      <div
        style={{
          marginTop: '2rem',
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '1rem 1.2rem',
          background: '#111',
          fontSize: '0.8rem',
          lineHeight: '1.6',
          color: '#bbb',
        }}
      >
        <h3 style={{ margin: '0 0 0.75rem', color: '#ffb74d', fontSize: '0.95rem' }}>
          📖 遊び方
        </h3>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ color: '#fff' }}>🥩 基本ルール</strong>
          <div>一人焼肉ローグライク。次々と運ばれてくる肉を焼いて食べよう。</div>
          <div>レストランの全料理を食べればクリア！スコア＝クリアしたレストラン数。</div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ color: '#fff' }}>🔥 焼き加減</strong>
          <div>
            <span style={{ color: '#ff7043' }}>生</span> →{' '}
            <span style={{ color: '#e91e63' }}>レア</span> →{' '}
            <span style={{ color: '#ff9800' }}>ミディアム</span> →{' '}
            <span style={{ color: '#8d6e63' }}>ウェルダン</span> →{' '}
            <span style={{ color: '#616161' }}>コゲ</span>
          </div>
          <div>ウェルダンで食べると<span style={{ color: '#4caf50' }}>+3コイン</span>！コゲは食べられない。</div>
          <div>生のまま食べると<span style={{ color: '#ef9a9a' }}>3秒間行動不能</span>になるので注意。</div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ color: '#fff' }}>🎮 操作</strong>
          <div>「食べる」— グリルの肉を食べる（コゲは不可）</div>
          <div>「捨てる」— 肉を廃棄（スタッフ警告+1、行動不能中も可）</div>
          <div>「裏返す」— 焼き時間を50%リセット（トング職人スキルが必要）</div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ color: '#fff' }}>😤 店員の怒り（スタッフ警告）</strong>
          <div>肉を捨てると警告+1。肉の種類によっては警告なしのスキルもある。</div>
          <div>
            <span style={{ color: '#ff9800' }}>3回</span>で注意、
            <span style={{ color: '#ff5722' }}>5回</span>で激怒（食べる速度低下）、
            <span style={{ color: '#f44336' }}>8回で強制退店（ゲームオーバー）</span>
          </div>
          <div>休憩ノードで警告はリセットされる。</div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ color: '#fff' }}>🏪 レストラン進行</strong>
          <div>チェーン店 → 個人店 → 高級店 → ボス店舗 の4店で1周。</div>
          <div>周回ごとに提供速度が上がり、スイートスポットが狭くなる。</div>
          <div>クリアするたびにスキル選択 → ノード（休憩/ショップ）が発生。</div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ color: '#fff' }}>💀 ゲームオーバー条件</strong>
          <div>🍽️ テーブル溢れ — 置き場がなくなった（全レストラン）</div>
          <div>🔥 グリル炎上 — コゲ肉を15秒放置（高級店から）</div>
          <div>🤢 生肉マヒ — 行動不能中にテーブル溢れ（ボス店から）</div>
          <div>🚪 強制退店 — スタッフ警告が8回に到達</div>
        </div>

        <div>
          <strong style={{ color: '#fff' }}>🏆 トゥルーエンド</strong>
          <div>4周目のボス店舗をクリアすると真のエンディング！</div>
          <div>ボス撃破でキャラクター解放。全キャラでクリアを目指せ！</div>
        </div>
      </div>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#555' }}>
        エイプリルフール 2026 🎉
      </p>
    </div>
  );
}

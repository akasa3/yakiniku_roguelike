import type React from 'react';
import type { SkillDefinition, ConsumableItem } from '../types/index';
import { SKILL_PURCHASE_COST } from '../game/data/constants';

interface ShopScreenProps {
  readonly coins: number;
  readonly skills: readonly SkillDefinition[];
  readonly consumables: readonly ConsumableItem[];
  readonly onPurchaseSkill: (skillId: string) => void;
  readonly onPurchaseConsumable: (itemId: string) => void;
  readonly onLeaveShop: () => void;
}

export function ShopScreen({
  coins,
  skills,
  consumables,
  onPurchaseSkill,
  onPurchaseConsumable,
  onLeaveShop,
}: ShopScreenProps) {
  const buyBtnStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    padding: '0.25rem 0.6rem',
    border: '1px solid #555',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#1a3a1a',
    color: '#a5d6a7',
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🛒 ショップ <small style={{ color: '#888', fontSize: '0.7rem' }}>Shop</small></h2>
        <span style={{ fontSize: '1.2rem' }}>💰 <strong>{coins}</strong> コイン</span>
      </div>
      <hr style={{ borderColor: '#444', margin: '1rem 0' }} />

      {/* Skills for sale */}
      {skills.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#64b5f6' }}>
            スキル <small style={{ color: '#888', fontSize: '0.75rem' }}>Skills</small>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {skills.map((skill) => (
              <div
                key={skill.id}
                style={{
                  border: '1px solid #444',
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  background: '#1a1a1a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>{skill.name}</span>
                  <span style={{ marginLeft: '0.4rem', color: '#aaa', fontSize: '0.8rem' }}>
                    {skill.nameJP}
                  </span>
                  <span style={{ marginLeft: '0.5rem', color: '#64b5f6', fontSize: '0.85rem' }}>
                    💰{SKILL_PURCHASE_COST}
                  </span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#888' }}>
                    {skill.description}
                  </p>
                </div>
                <button
                  style={{
                    ...buyBtnStyle,
                    ...(coins < SKILL_PURCHASE_COST ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                  }}
                  onClick={() => onPurchaseSkill(skill.id)}
                  disabled={coins < SKILL_PURCHASE_COST}
                >
                  購入
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Consumables for sale */}
      {consumables.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#ffb74d' }}>
            消耗品 <small style={{ color: '#888', fontSize: '0.75rem' }}>Consumables</small>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {consumables.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #444',
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  background: '#1a1a1a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                  <span style={{ marginLeft: '0.4rem', color: '#aaa', fontSize: '0.8rem' }}>
                    {item.nameJP}
                  </span>
                  <span style={{ marginLeft: '0.5rem', color: '#ffb74d', fontSize: '0.85rem' }}>
                    💰{item.cost}
                  </span>
                </div>
                <button
                  style={{
                    ...buyBtnStyle,
                    background: '#3a2a00',
                    color: '#ffcc80',
                    ...(coins < item.cost ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                  }}
                  onClick={() => onPurchaseConsumable(item.id)}
                  disabled={coins < item.cost}
                >
                  購入
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        onClick={onLeaveShop}
        style={{
          fontFamily: 'monospace',
          padding: '0.5rem 1.5rem',
          background: '#333',
          color: '#ccc',
          border: '1px solid #666',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        退店 <small style={{ color: '#aaa', fontSize: '0.75rem' }}>Leave Shop</small>
      </button>
    </div>
  );
}

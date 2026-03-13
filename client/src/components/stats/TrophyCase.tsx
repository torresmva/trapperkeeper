import { useState, useEffect, ComponentType } from 'react';
import { api } from '../../api/client';
import { Trophy } from '../../types';
import {
  PixelTrophy, PixelSword, PixelScroll, PixelShield, PixelCrown,
  PixelFire, PixelLightning, PixelGhost, PixelCoffee, PixelFolder,
  PixelStar, PixelRocket, PixelKey,
} from '../shared/PixelArt';

const iconMap: Record<string, ComponentType<{ size?: number; color?: string }>> = {
  sword: PixelSword,
  scroll: PixelScroll,
  shield: PixelShield,
  crown: PixelCrown,
  fire: PixelFire,
  lightning: PixelLightning,
  ghost: PixelGhost,
  coffee: PixelCoffee,
  folder: PixelFolder,
  star: PixelStar,
  rocket: PixelRocket,
  key: PixelKey,
};

export function TrophyCase() {
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.checkTrophies()
      .then(() => api.getTrophies())
      .then(setTrophies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const unlocked = trophies.filter(t => t.unlockedAt);
  const total = trophies.length;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <PixelTrophy size={12} color="var(--accent-tertiary)" />
          trophy case
        </div>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          {unlocked.length}/{total} unlocked
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}>
        {trophies.map(trophy => {
          const isUnlocked = !!trophy.unlockedAt;
          const Icon = iconMap[trophy.icon] || PixelTrophy;
          const progress = Math.min(trophy.progress / trophy.threshold, 1);

          return (
            <div
              key={trophy.id}
              style={{
                background: 'var(--bg-surface)',
                padding: '12px 8px',
                textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.25,
                borderBottom: isUnlocked ? '2px solid var(--accent-primary)' : '2px solid transparent',
                boxShadow: isUnlocked ? '0 2px 8px var(--glow)' : 'none',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                <Icon
                  size={20}
                  color={isUnlocked ? 'var(--accent-primary)' : 'var(--text-muted)'}
                />
              </div>
              <div style={{
                fontSize: '10px',
                color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {isUnlocked ? trophy.name : '???'}
              </div>
              {isUnlocked && (
                <div style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.3,
                }}>
                  {trophy.description}
                </div>
              )}
              {!isUnlocked && progress > 0 && progress < 1 && (
                <div style={{
                  marginTop: 4,
                  height: 3,
                  background: 'var(--border)',
                  position: 'relative',
                }}>
                  <div style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: '100%',
                    background: 'var(--accent-primary)',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

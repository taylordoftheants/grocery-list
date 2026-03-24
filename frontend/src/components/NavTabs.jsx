import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, shadows } from '../theme';

const TABS = [
  { id: 'mealplan', label: 'Meal Plan' },
  { id: 'lists',    label: 'Shopping Lists' },
  { id: 'recipes',  label: 'Recipes' },
];

export default function NavTabs({ currentView, onChangeView, user, onProfileClick }) {
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const [antHovered, setAntHovered] = useState(false);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      background: colors.navy,
      flexShrink: 0,
      minHeight: '3.5rem',
      boxShadow: shadows.nav,
      fontFamily: fonts.sans,
    }}>
      {TABS.map(tab => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeView(tab.id)}
            style={{
              padding: '0.625rem 0.875rem',
              border: 'none',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: isActive ? colors.white : 'rgba(255,255,255,0.65)',
              fontWeight: isActive ? fontWeights.semibold : fontWeights.normal,
              fontSize: fontSizes.base,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderRadius: radii.md,
              margin: '0.5rem 0.25rem',
              minHeight: '44px',
              fontFamily: fonts.sans,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        );
      })}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '0.75rem', gap: '0.25rem' }}>
        {/* Ant easter egg 🐜 */}
        <span
          title="For the colony"
          onMouseEnter={() => setAntHovered(true)}
          onMouseLeave={() => setAntHovered(false)}
          style={{
            fontSize: '1rem',
            opacity: antHovered ? 0.9 : 0.45,
            cursor: 'default',
            userSelect: 'none',
            display: 'inline-block',
            transform: antHovered ? 'scale(1.5) rotate(-20deg)' : 'scale(1) rotate(0deg)',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
        >
          🐜
        </span>

        <button
          onClick={onProfileClick}
          aria-label="Profile"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: radii.full,
            background: 'rgba(255,255,255,0.2)',
            color: colors.white,
            border: 'none',
            fontSize: fontSizes.base,
            fontWeight: fontWeights.bold,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          {initial}
        </button>
      </div>
    </div>
  );
}

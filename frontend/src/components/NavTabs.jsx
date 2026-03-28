import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, shadows } from '../theme';

const TABS = [
  { id: 'mealplan',    label: 'Meal Plan',     icon: '🗓' },
  { id: 'lists',       label: 'Lists',         icon: '🛒' },
  { id: 'recipes',     label: 'Recipes',       icon: '📖' },
  { id: 'howitworks',  label: 'How Ant Works', icon: '💡' },
];

// ── Desktop top nav bar ────────────────────────────────────────────────────────
function DesktopNav({ currentView, onChangeView, user, onProfileClick }) {
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const [antHovered, setAntHovered] = useState(false);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      background: colors.charcoal,
      flexShrink: 0,
      minHeight: '3.5rem',
      boxShadow: shadows.nav,
      fontFamily: fonts.display,
    }}>
      {/* Brand mark */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '1rem',
        paddingRight: '0.25rem',
        color: colors.white,
        fontFamily: fonts.display,
        fontWeight: fontWeights.bold,
        fontSize: fontSizes.lg,
        letterSpacing: '0.03em',
        userSelect: 'none',
        flexShrink: 0,
      }}>
        Assist<span style={{ color: colors.amber }}>.</span>ant
      </div>

      <div style={{ width: '1px', background: colors.charcoalBorder, margin: '0.75rem 0.5rem' }} />

      {TABS.map(tab => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeView(tab.id)}
            style={{
              position: 'relative',
              padding: '0.625rem 0.875rem',
              border: 'none',
              background: 'transparent',
              color: isActive ? colors.amber : 'rgba(255,255,255,0.55)',
              fontWeight: isActive ? fontWeights.semibold : fontWeights.normal,
              fontSize: fontSizes.base,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              margin: '0.5rem 0.125rem',
              minHeight: '44px',
              fontFamily: fonts.display,
              transition: 'color 0.15s ease',
              borderRadius: radii.md,
            }}
          >
            {tab.label}
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '2px',
                background: colors.amber,
                borderRadius: radii.full,
                transition: 'width 0.2s ease',
              }} />
            )}
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
            opacity: antHovered ? 0.9 : 0.4,
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
            background: 'rgba(245,158,11,0.2)',
            color: colors.amber,
            border: `1px solid rgba(245,158,11,0.3)`,
            fontSize: fontSizes.base,
            fontWeight: fontWeights.bold,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.display,
            transition: 'background 0.15s ease',
          }}
        >
          {initial}
        </button>
      </div>
    </div>
  );
}

// ── Mobile: top mini-bar + fixed bottom tab bar ────────────────────────────────
function MobileTopBar({ user, onProfileClick }) {
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const [antHovered, setAntHovered] = useState(false);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: colors.charcoal,
      height: '48px',
      paddingLeft: '1rem',
      paddingRight: '0.75rem',
      flexShrink: 0,
      boxShadow: shadows.nav,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {/* Brand */}
      <span style={{
        color: colors.white,
        fontFamily: fonts.display,
        fontWeight: fontWeights.bold,
        fontSize: fontSizes.lg,
        letterSpacing: '0.03em',
        userSelect: 'none',
      }}>
        Assist<span style={{ color: colors.amber }}>.</span>ant
      </span>

      {/* Right: ant + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span
          title="For the colony"
          onMouseEnter={() => setAntHovered(true)}
          onMouseLeave={() => setAntHovered(false)}
          style={{
            fontSize: '1rem',
            opacity: antHovered ? 0.9 : 0.4,
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
            width: '2rem',
            height: '2rem',
            borderRadius: radii.full,
            background: 'rgba(245,158,11,0.2)',
            color: colors.amber,
            border: `1px solid rgba(245,158,11,0.3)`,
            fontSize: fontSizes.base,
            fontWeight: fontWeights.bold,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.display,
          }}
        >
          {initial}
        </button>
      </div>
    </div>
  );
}

function MobileBottomTabs({ currentView, onChangeView }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: colors.charcoal,
      display: 'flex',
      alignItems: 'stretch',
      boxShadow: shadows.navBottom,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(tab => {
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeView(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '0.5rem 0.25rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              minHeight: '56px',
              position: 'relative',
              transition: 'opacity 0.15s ease',
            }}
          >
            {/* Active indicator bar at top */}
            <span style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isActive ? '28px' : '0px',
              height: '2px',
              background: colors.amber,
              borderRadius: '0 0 2px 2px',
              transition: 'width 0.2s ease',
            }} />
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: fontSizes.xs,
              fontWeight: isActive ? fontWeights.semibold : fontWeights.normal,
              color: isActive ? colors.amber : 'rgba(255,255,255,0.5)',
              fontFamily: fonts.display,
              letterSpacing: '0.02em',
              transition: 'color 0.15s ease',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main export: renders correct layout based on isMobile ─────────────────────
export default function NavTabs({ currentView, onChangeView, user, onProfileClick, isMobile }) {
  if (isMobile) {
    return (
      <>
        <MobileTopBar user={user} onProfileClick={onProfileClick} />
        <MobileBottomTabs currentView={currentView} onChangeView={onChangeView} />
      </>
    );
  }

  return (
    <DesktopNav
      currentView={currentView}
      onChangeView={onChangeView}
      user={user}
      onProfileClick={onProfileClick}
    />
  );
}

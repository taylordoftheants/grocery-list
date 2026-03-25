// Design tokens — single source of truth for all styling
// All components import from here instead of using hardcoded values.

// ── Colors ────────────────────────────────────────────────────────────────────
export const colors = {
  // App shell / dark surfaces
  charcoal:       '#1a1a2e',
  charcoalMid:    '#16213e',
  charcoalLight:  '#1e2d4a',
  charcoalBorder: '#2a3a5c',

  // Accent — warm amber
  amber:       '#f59e0b',
  amberDark:   '#d97706',
  amberLight:  '#fef3c7',
  amberBorder: '#fcd34d',

  // Content surfaces (warm cream palette)
  warmWhite: '#faf7f2',  // alias for clarity
  bgPage:    '#faf7f2',  // warm off-white body
  bgSurface: '#f5f0e8',  // warm cream surface
  bgCard:    '#ffffff',

  // Borders
  border:      '#e8e0d0',
  borderLight: '#f0ebe0',
  borderMid:   '#d4c9b8',

  // Text
  textPrimary:   '#1a1508',
  textSecondary: '#3d3420',
  textMuted:     '#7a6e5c',
  textSubtle:    '#a09284',
  textDisabled:  '#c8bfb0',

  white: '#ffffff',

  // Semantic
  success:     '#16a34a',
  successBg:   '#dcfce7',
  successText: '#166534',
  error:       '#dc2626',
  errorBg:     '#fee2e2',
  errorText:   '#991b1b',
  errorBorder: '#fca5a5',

  // Recipe category colors — preserved
  sides:     { label: '#92400e', bg: '#fffbeb', border: '#fde68a', chip: '#78350f' },
  protein:   { label: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', chip: '#1e40af' },
  spices:    { label: '#065f46', bg: '#d1fae5', border: '#6ee7b7', chip: '#065f46' },
  custom:    { bg: '#f0fdf4', border: '#bbf7d0' },
  leftovers: { bg: '#f3f0ea', border: '#d4c9b8', text: '#7a6e5c' },

  // Landing page brand (on dark bg)
  cream: '#f5f0e8',

  // ── Backward-compatible aliases (existing components reference these) ──────
  navy:       '#1a1a2e',   // = charcoal
  navyDark:   '#16213e',   // = charcoalMid
  blue:       '#f59e0b',   // = amber  (primary actions)
  blueDark:   '#d97706',   // = amberDark
  blueLight:  '#fef3c7',   // = amberLight
  blueBorder: '#fcd34d',   // = amberBorder
};

// ── Typography ────────────────────────────────────────────────────────────────
export const fonts = {
  sans:    "'Outfit', system-ui, sans-serif",
  display: "'Syne', system-ui, sans-serif",  // nav, headings, brand
  serif:   "'Syne', system-ui, sans-serif",  // landing page title (was Cinzel)
};

export const fontSizes = {
  xs:   '0.6875rem', // 11px — category labels, badge text
  sm:   '0.75rem',   // 12px — timestamps, minor labels
  base: '0.875rem',  // 14px — body, buttons
  md:   '1rem',      // 16px — inputs (16px prevents iOS Safari zoom)
  lg:   '1rem',      // 16px
  xl:   '1.125rem',  // 18px — modal titles
  '2xl':'1.25rem',   // 20px — page headings
  '3xl':'1.5rem',    // 24px
  '4xl':'2rem',      // 32px — landing hero
};

export const fontWeights = {
  normal:   '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const radii = {
  sm:   '0.25rem',  // 4px
  md:   '0.375rem', // 6px — inputs, small buttons
  lg:   '0.5rem',   // 8px — cards, panels
  xl:   '0.75rem',  // 12px — modals, auth card
  full: '9999px',   // pill badges, avatars
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadows = {
  sm:        '0 1px 3px rgba(26,26,46,0.10)',
  md:        '0 4px 12px rgba(26,26,46,0.10)',
  lg:        '0 8px 24px rgba(26,26,46,0.14)',
  xl:        '0 20px 60px rgba(26,26,46,0.22)',
  nav:       '0 2px 8px rgba(26,26,46,0.20)',
  navBottom: '0 -2px 12px rgba(26,26,46,0.18)',
  card:      '0 1px 4px rgba(26,26,46,0.07)',
  modal:     '0 20px 60px rgba(26,26,46,0.26)',
  amber:     '0 0 0 3px rgba(245,158,11,0.25)',  // amber focus ring
};

// ── Composite tokens (pre-built style objects) ────────────────────────────────
export const card = {
  background:   colors.bgCard,
  borderRadius: radii.lg,
  border:       `1px solid ${colors.border}`,
  boxShadow:    shadows.card,
};

export const input = {
  padding:      '0.625rem 0.75rem',
  border:       `1px solid ${colors.borderMid}`,
  borderRadius: radii.md,
  fontSize:     fontSizes.md,   // 1rem = 16px — prevents iOS Safari zoom
  background:   colors.white,
  color:        colors.textPrimary,
  width:        '100%',
  minHeight:    '44px',
  boxSizing:    'border-box',
  fontFamily:   fonts.sans,
  outline:      'none',
};

export const btnPrimary = {
  padding:      '0.625rem 1.25rem',
  background:   colors.amber,
  color:        colors.charcoal,
  border:       'none',
  borderRadius: radii.md,
  fontSize:     fontSizes.base,
  fontWeight:   fontWeights.semibold,
  cursor:       'pointer',
  minHeight:    '44px',
  fontFamily:   fonts.sans,
  transition:   'background 0.15s ease, transform 0.1s ease',
};

export const btnSecondary = {
  padding:      '0.625rem 1rem',
  background:   'transparent',
  color:        colors.textSecondary,
  border:       `1px solid ${colors.borderMid}`,
  borderRadius: radii.md,
  fontSize:     fontSizes.base,
  fontWeight:   fontWeights.medium,
  cursor:       'pointer',
  minHeight:    '44px',
  fontFamily:   fonts.sans,
  transition:   'background 0.15s ease',
};

export const btnDanger = {
  ...btnSecondary,
  color:  colors.error,
  border: `1px solid ${colors.errorBorder}`,
};

export const sectionLabel = {
  fontSize:      fontSizes.xs,
  fontWeight:    fontWeights.semibold,
  color:         colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontFamily:    fonts.display,
};

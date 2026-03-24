// Design tokens — single source of truth for all styling
// All components import from here instead of using hardcoded values.

// ── Colors ────────────────────────────────────────────────────────────────────
export const colors = {
  // Brand
  navy:       '#1a2744',
  navyDark:   '#111c33',
  blue:       '#2563eb',
  blueDark:   '#1d4ed8',
  blueLight:  '#eff6ff',
  blueBorder: '#bfdbfe',
  white:      '#ffffff',

  // Page surfaces
  bgPage:    '#f8fafc',
  bgSurface: '#f1f5f9',
  bgCard:    '#ffffff',

  // Borders
  border:      '#e2e8f0',
  borderLight: '#f1f5f9',
  borderMid:   '#d1d5db',

  // Text
  textPrimary:   '#111827',
  textSecondary: '#374151',
  textMuted:     '#6b7280',
  textSubtle:    '#9ca3af',
  textDisabled:  '#d1d5db',

  // Semantic
  success:     '#16a34a',
  successBg:   '#dcfce7',
  successText: '#166534',
  error:       '#dc2626',
  errorBg:     '#fee2e2',
  errorText:   '#991b1b',
  errorBorder: '#fca5a5',

  // Recipe category colors — preserved exactly
  sides:     { label: '#92400e', bg: '#fffbeb', border: '#fde68a', chip: '#78350f' },
  protein:   { label: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', chip: '#1e40af' },
  spices:    { label: '#065f46', bg: '#d1fae5', border: '#6ee7b7', chip: '#065f46' },
  custom:    { bg: '#f0fdf4', border: '#bbf7d0' },
  leftovers: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },

  // Landing page brand (used on dark bg)
  cream: '#f2ead8',
};

// ── Typography ────────────────────────────────────────────────────────────────
export const fonts = {
  sans:  '-apple-system, system-ui, sans-serif',
  serif: "'Cinzel', serif", // landing page brand title only
};

export const fontSizes = {
  xs:   '0.6875rem', // 11px — category labels, badge text
  sm:   '0.75rem',   // 12px — timestamps, minor labels
  base: '0.875rem',  // 14px — body, buttons
  md:   '0.9375rem', // 15px — inputs, list items
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
  sm:    '0 1px 3px rgba(0,0,0,0.08)',
  md:    '0 4px 12px rgba(0,0,0,0.08)',
  lg:    '0 8px 24px rgba(0,0,0,0.12)',
  xl:    '0 20px 60px rgba(0,0,0,0.18)',
  nav:   '0 2px 8px rgba(26,39,68,0.15)',
  card:  '0 1px 4px rgba(0,0,0,0.06)',
  modal: '0 20px 60px rgba(0,0,0,0.22)',
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
  fontSize:     fontSizes.md,
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
  background:   colors.blue,
  color:        colors.white,
  border:       'none',
  borderRadius: radii.md,
  fontSize:     fontSizes.base,
  fontWeight:   fontWeights.semibold,
  cursor:       'pointer',
  minHeight:    '44px',
  fontFamily:   fonts.sans,
  transition:   'background 0.15s ease',
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
};

import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii } from '../theme';

function MacroPill({ label, value, unit, highlight }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0.375rem 0.625rem',
      background: highlight ? colors.amberLight : colors.bgSurface,
      border: `1px solid ${highlight ? colors.amberBorder : colors.border}`,
      borderRadius: radii.lg,
      minWidth: '64px',
    }}>
      <span style={{
        fontSize: fontSizes.xs,
        color: colors.textMuted,
        fontFamily: fonts.sans,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: fontWeights.medium,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.bold,
        color: highlight ? colors.amberDark : colors.textPrimary,
        fontFamily: fonts.sans,
        lineHeight: 1.2,
      }}>
        {value.toLocaleString()}
        <span style={{ fontSize: fontSizes.xs, fontWeight: fontWeights.normal, color: colors.textMuted }}>{unit}</span>
      </span>
    </div>
  );
}

export default function NutritionSummary({ data, loading, error }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        fontFamily: fonts.sans,
        fontSize: fontSizes.base,
        color: colors.textMuted,
      }}>
        Looking up nutrition data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        fontFamily: fonts.sans,
        fontSize: fontSizes.base,
        color: colors.textMuted,
      }}>
        Nutrition data unavailable
      </div>
    );
  }

  if (!data) return null;

  const { weeklyTotal, byEntry } = data;
  const hasData = weeklyTotal.calories > 0 || byEntry.length > 0;

  // Group entries by date for the breakdown
  const byDate = {};
  for (const entry of byEntry) {
    const key = entry.is_weekly ? '__weekly__' : entry.date;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(entry);
  }
  const dateKeys = Object.keys(byDate).sort((a, b) => {
    if (a === '__weekly__') return -1;
    if (b === '__weekly__') return 1;
    return a.localeCompare(b);
  });

  return (
    <div style={{
      background: colors.bgSurface,
      border: `1px solid ${colors.border}`,
      borderRadius: radii.lg,
      overflow: 'hidden',
      fontFamily: fonts.sans,
    }}>
      {/* Summary row */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {!hasData ? (
          <span style={{ fontSize: fontSizes.base, color: colors.textMuted, flex: 1 }}>
            Add recipes to the week to see nutrition estimates.
          </span>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <MacroPill label="Cal / wk" value={weeklyTotal.calories} unit="" highlight />
              <MacroPill label="Protein"  value={weeklyTotal.protein}  unit="g" />
              <MacroPill label="Carbs"    value={weeklyTotal.carbs}    unit="g" />
              <MacroPill label="Fat"      value={weeklyTotal.fat}      unit="g" />
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                marginLeft: 'auto',
                padding: '0.25rem 0.625rem',
                border: `1px solid ${colors.borderMid}`,
                borderRadius: radii.md,
                background: 'transparent',
                color: colors.textMuted,
                fontSize: fontSizes.sm,
                cursor: 'pointer',
                fontFamily: fonts.sans,
                whiteSpace: 'nowrap',
              }}
            >
              {expanded ? 'Hide ↑' : 'By recipe ↓'}
            </button>
          </>
        )}
        <span style={{
          fontSize: fontSizes.xs,
          color: colors.textSubtle,
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
        }}>
          est.
        </span>
      </div>

      {/* Per-recipe breakdown */}
      {expanded && hasData && (
        <div style={{ borderTop: `1px solid ${colors.borderLight}`, padding: '0.5rem 1rem 0.75rem' }}>
          {dateKeys.map(dateKey => {
            const entries = byDate[dateKey];
            const dayLabel = dateKey === '__weekly__'
              ? 'For the Week'
              : new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            return (
              <div key={dateKey} style={{ marginBottom: '0.625rem' }}>
                <p style={{
                  fontSize: fontSizes.xs,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: fontWeights.semibold,
                  marginBottom: '0.25rem',
                }}>
                  {dayLabel}
                </p>
                {entries.map(entry => (
                  <div
                    key={entry.entryId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      padding: '0.25rem 0',
                      borderBottom: `1px solid ${colors.borderLight}`,
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: fontSizes.base, color: colors.textSecondary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.label}
                    </span>
                    <span style={{ fontSize: fontSizes.sm, color: colors.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {entry.nutrition.calories.toLocaleString()} cal
                      {' · '}{entry.nutrition.protein}g P
                      {' · '}{entry.nutrition.carbs}g C
                      {' · '}{entry.nutrition.fat}g F
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

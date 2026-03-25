import { useState } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, btnPrimary, btnSecondary } from '../theme';

export default function KrogerCartModal({ list, isMobile, onClose }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'adding' | 'result'
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleAddToCart() {
    setStep('adding');
    try {
      const data = await api.krogerAddToCart(list.id);
      setResult(data);
      setStep('result');
    } catch (e) {
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setStep('result');
    }
  }

  const modalCard = isMobile ? {
    ...card,
    borderRadius: '1rem 1rem 0 0',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: shadows.modal,
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
  } : {
    ...card,
    borderRadius: radii.xl,
    padding: '1.5rem',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: shadows.modal,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
    }}>
      <div style={modalCard}>
        {step === 'confirm' && (
          <>
            <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.25rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
              Add to Kroger Cart
            </h2>
            <p style={{ fontSize: fontSizes.base, color: colors.textMuted, marginBottom: '1rem', fontFamily: fonts.sans }}>
              Ready to send your <strong style={{ color: colors.textSecondary }}>{list.name}</strong> items to Harris Teeter?
            </p>
            <button
              onClick={handleAddToCart}
              style={{ ...btnPrimary, width: '100%', marginBottom: '0.75rem' }}
            >
              Add all to cart
            </button>
            <button onClick={onClose} style={{ ...btnSecondary, width: '100%' }}>
              Cancel
            </button>
          </>
        )}

        {step === 'adding' && (
          <>
            <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.75rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
              Adding to your cart...
            </h2>
            <p style={{ fontSize: fontSizes.base, color: colors.textMuted, fontFamily: fonts.sans }}>
              Searching for products and adding them to your Kroger cart. This may take a moment.
            </p>
          </>
        )}

        {step === 'result' && errorMsg && (
          <>
            <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.75rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: fontSizes.base, color: colors.error, marginBottom: '1rem', fontFamily: fonts.sans }}>
              {errorMsg}
            </p>
            <button onClick={onClose} style={{ ...btnSecondary, width: '100%' }}>
              Close
            </button>
          </>
        )}

        {step === 'result' && result && (
          <>
            <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.75rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
              Done!
            </h2>
            <p style={{ fontSize: fontSizes.base, color: colors.success, fontFamily: fonts.sans, marginBottom: result.skipped > 0 ? '0.75rem' : '1rem' }}>
              {result.added} {result.added === 1 ? 'item' : 'items'} added to your cart.
            </p>
            {result.skipped > 0 && (
              <div style={{
                background: colors.bgSurface,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                padding: '0.75rem',
                marginBottom: '1rem',
              }}>
                <p style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans, marginBottom: '0.375rem' }}>
                  {result.skipped} {result.skipped === 1 ? 'item' : 'items'} couldn't be matched and were skipped:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {result.skippedNames.map(name => (
                    <li key={name} style={{ fontSize: fontSizes.sm, color: colors.textMuted, fontFamily: fonts.sans }}>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={onClose} style={{ ...btnPrimary, width: '100%' }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

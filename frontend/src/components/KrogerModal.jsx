import { useState } from 'react';
import { api } from '../api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows, card, btnPrimary, btnSecondary } from '../theme';

const HARRIS_TEETER_CHAIN = 'HART';

export default function KrogerModal({ isMobile, onClose }) {
  const [step, setStep] = useState('zip'); // 'zip' | 'loading' | 'store' | 'error'
  const [zipCode, setZipCode] = useState('');
  const [locations, setLocations] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zipCode)) {
      setErrorMsg('Please enter a valid 5-digit zip code.');
      setStep('error');
      return;
    }
    setStep('loading');
    try {
      const data = await api.krogerGetLocations(zipCode, HARRIS_TEETER_CHAIN);
      setLocations(data);
      setStep('store');
    } catch (e) {
      setErrorMsg(e.message || 'Could not load store locations.');
      setStep('error');
    }
  }

  function selectStore(locationId) {
    window.location.href = `/api/kroger/auth/start?locationId=${locationId}`;
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
    maxWidth: '380px',
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
        <h2 style={{ fontSize: fontSizes.xl, fontWeight: fontWeights.bold, marginBottom: '0.25rem', color: colors.textPrimary, fontFamily: fonts.sans }}>
          Buy em, ant!
        </h2>
        <p style={{ fontSize: fontSizes.base, color: colors.textMuted, marginBottom: '1.25rem', fontFamily: fonts.sans }}>
          Where do you want to shop?
        </p>

        {step === 'zip' && (
          <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter zip code"
              value={zipCode}
              onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: `1px solid ${colors.border}`,
                borderRadius: radii.md,
                fontFamily: fonts.sans,
                fontSize: fontSizes.base,
                color: colors.textPrimary,
                background: colors.bgCard,
                marginBottom: '0.75rem',
                boxSizing: 'border-box',
              }}
            />
            <button type="submit" style={{ ...btnPrimary, width: '100%' }}>
              Find Stores
            </button>
          </form>
        )}

        {step === 'loading' && (
          <p style={{ color: colors.textMuted, fontSize: fontSizes.base, fontFamily: fonts.sans, marginBottom: '1rem' }}>
            Finding nearby Harris Teeter locations...
          </p>
        )}

        {step === 'error' && (
          <>
            <p style={{ color: colors.error, fontSize: fontSizes.base, fontFamily: fonts.sans, marginBottom: '0.75rem' }}>
              {errorMsg}
            </p>
            <button onClick={() => setStep('zip')} style={{ ...btnSecondary, width: '100%', marginBottom: '0.75rem' }}>
              Try Again
            </button>
          </>
        )}

        {step === 'store' && (
          <>
            {locations.length === 0 ? (
              <>
                <p style={{ color: colors.textMuted, fontSize: fontSizes.base, fontFamily: fonts.sans, marginBottom: '0.75rem' }}>
                  No Harris Teeter locations found near {zipCode}.
                </p>
                <button onClick={() => setStep('zip')} style={{ ...btnSecondary, width: '100%', marginBottom: '0.75rem' }}>
                  Try a Different Zip
                </button>
              </>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                {locations.map(loc => (
                  <li key={loc.locationId}>
                    <button
                      onClick={() => selectStore(loc.locationId)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem',
                        border: `1px solid ${colors.border}`,
                        borderRadius: radii.md,
                        background: colors.bgCard,
                        cursor: 'pointer',
                        marginBottom: '0.375rem',
                        fontFamily: fonts.sans,
                      }}
                    >
                      <div style={{ fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary }}>
                        {loc.name}
                      </div>
                      <div style={{ fontSize: fontSizes.sm, color: colors.textMuted, marginTop: '0.125rem' }}>
                        {loc.address}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <button onClick={onClose} style={{ ...btnSecondary, width: '100%' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

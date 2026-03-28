import React from 'react';

// ── Design tokens (scoped to this component) ─────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@500&display=swap');

  @keyframes hiwFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes hiwAntWiggle {
    0%, 100% { transform: rotate(-6deg) scale(1); }
    50%       { transform: rotate(6deg) scale(1.06); }
  }

  .hiw-section {
    animation: hiwFadeUp 0.55s ease both;
  }
  .hiw-section:nth-child(1) { animation-delay: 0.05s; }
  .hiw-section:nth-child(2) { animation-delay: 0.12s; }
  .hiw-section:nth-child(3) { animation-delay: 0.20s; }
  .hiw-section:nth-child(4) { animation-delay: 0.28s; }
  .hiw-section:nth-child(5) { animation-delay: 0.36s; }
  .hiw-section:nth-child(6) { animation-delay: 0.44s; }

  .hiw-hero-ant {
    display: inline-block;
    animation: hiwAntWiggle 3.2s ease-in-out infinite;
  }

  .hiw-step-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .hiw-step-card:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 14px 36px rgba(26,18,8,0.15) !important;
  }

  .hiw-chip {
    transition: transform 0.18s ease;
    cursor: default;
  }
  .hiw-chip:hover {
    transform: translateX(5px);
  }

  .hiw-kroger-step {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .hiw-kroger-step:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(26,18,8,0.10) !important;
  }
`;

const C = {
  // Text — all high-contrast on light backgrounds
  headingInk:   '#1a1208',   // near-black warm brown — on white: ~18:1
  bodyInk:      '#3d3020',   // dark brown — on white: ~10:1
  mutedInk:     '#5c4d3d',   // medium brown — on white: ~7:1
  subtleInk:    '#7a6548',   // muted — on white: ~4.8:1  ✓ AA

  // Backgrounds
  cardBg:       '#ffffff',
  cardBorder:   '#ddd5bf',

  // Amber / warm accent
  amber:        '#f59e0b',
  amberDark:    '#92400e',   // on light bg: ~6.9:1  ✓ AA
  amberBg:      '#fef3c7',
  amberBorder:  '#fcd34d',

  // Forest green (primary accent)
  forest:       '#1e4d2b',
  forestMid:    '#166534',
  forestBg:     '#dcfce7',
  forestBorder: '#86efac',
  forestText:   '#166534',   // on light green bg: ~5.2:1  ✓ AA

  // Closing section (dark bg)
  closingBg1:   '#1e4d2b',
  closingBg2:   '#0f2d18',
  closingHeading: '#ffffff',        // on forest dark: ~16:1 ✓
  closingBody:    '#d4ead9',        // soft sage-white — on forest dark: ~8:1 ✓

  // Chip: Pantry Staple
  stapleText:   '#5c4d3d',   // on cream #f5f0e8: ~6.9:1 ✓
  staleBg:      '#f5f0e8',
  staleBorder:  '#ddd5bf',
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  mono:    "'DM Mono', 'Courier New', monospace",
  body:    "'Outfit', system-ui, sans-serif",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionMarker({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.4rem' }}>
      <div style={{ width: '1.75rem', height: '2px', background: C.amber, borderRadius: '1px', flexShrink: 0 }} />
      <span style={{
        fontSize: '0.6375rem', fontWeight: '500', color: C.amberDark,
        fontFamily: F.mono, letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 style={{
      margin: '0 0 0.4rem',
      fontSize: '1.375rem',
      fontWeight: '800',
      fontStyle: 'italic',
      color: C.headingInk,
      fontFamily: F.display,
      lineHeight: 1.15,
    }}>
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }) {
  return (
    <p style={{
      margin: '0 0 1.5rem',
      fontSize: '0.875rem',
      color: C.mutedInk,
      fontFamily: F.body,
      lineHeight: 1.65,
      maxWidth: 540,
    }}>
      {children}
    </p>
  );
}

function StepNumber({ n }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: C.forest,
      color: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '500', fontSize: '0.8125rem',
      fontFamily: F.mono, flexShrink: 0,
      letterSpacing: '-0.01em',
      boxShadow: '0 2px 8px rgba(30,77,43,0.32)',
    }}>
      {String(n).padStart(2, '0')}
    </div>
  );
}

function Arrow({ isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: C.amberDark,
      fontFamily: F.mono,
      opacity: 0.7,
      ...(isMobile
        ? { height: 22, fontSize: '0.875rem' }
        : { width: 22, fontSize: '0.875rem' }),
    }}>
      {isMobile ? '↓' : '→'}
    </div>
  );
}

function StepCard({ n, icon, title, body, isMobile }) {
  return (
    <div className="hiw-step-card" style={{
      background: C.cardBg,
      border: `1px solid ${C.cardBorder}`,
      borderLeft: `4px solid ${C.amber}`,
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(26,18,8,0.07)',
      padding: '1.125rem 1.125rem 1.125rem 1rem',
      flex: isMobile ? 'none' : '1 1 0',
      minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <StepNumber n={n} />
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
      </div>
      <p style={{
        margin: 0, fontWeight: '700', fontSize: '0.9375rem',
        color: C.headingInk, fontFamily: F.display, fontStyle: 'italic',
        lineHeight: 1.25,
      }}>
        {title}
      </p>
      <p style={{
        margin: 0, fontSize: '0.8125rem',
        color: C.bodyInk, fontFamily: F.body, lineHeight: 1.6,
      }}>
        {body}
      </p>
    </div>
  );
}

function CategoryChip({ emoji, label, description, chipColor, chipBg, chipBorder }) {
  return (
    <div className="hiw-chip" style={{
      background: C.cardBg,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(26,18,8,0.055)',
      padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
    }}>
      <span style={{ fontSize: '1.625rem', lineHeight: 1, flexShrink: 0, marginTop: '3px' }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.6375rem',
          fontWeight: '500',
          color: chipColor,
          background: chipBg,
          border: `1px solid ${chipBorder}`,
          borderRadius: '9999px',
          padding: '0.175rem 0.6rem',
          marginBottom: '0.375rem',
          fontFamily: F.mono,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <p style={{
          margin: 0, fontSize: '0.8125rem',
          color: C.bodyInk, fontFamily: F.body, lineHeight: 1.6,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <div className="hiw-chip" style={{
      background: C.cardBg,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(26,18,8,0.055)',
      padding: '1.125rem 1.25rem',
      display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1.625rem', flexShrink: 0, lineHeight: 1, marginTop: '3px' }}>{icon}</span>
      <div>
        <p style={{
          margin: '0 0 0.3rem', fontWeight: '700', fontSize: '0.9375rem',
          color: C.headingInk, fontFamily: F.display, fontStyle: 'italic',
        }}>
          {title}
        </p>
        <p style={{
          margin: 0, fontSize: '0.8125rem',
          color: C.bodyInk, fontFamily: F.body, lineHeight: 1.6,
        }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function KrogerStep({ icon, title, body }) {
  return (
    <div className="hiw-kroger-step" style={{
      background: C.cardBg,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(26,18,8,0.055)',
      padding: '0.875rem 1.125rem',
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: C.amberBg, border: `1px solid ${C.amberBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '1rem', lineHeight: 1,
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          margin: '0 0 0.2rem', fontWeight: '700', fontSize: '0.9375rem',
          color: C.headingInk, fontFamily: F.display, fontStyle: 'italic',
        }}>
          {title}
        </p>
        <p style={{
          margin: 0, fontSize: '0.8125rem',
          color: C.bodyInk, fontFamily: F.body, lineHeight: 1.6,
        }}>
          {body}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HowItWorks({ isMobile }) {
  const pad = isMobile ? '1.25rem' : '2rem 2.5rem';

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ padding: pad, maxWidth: 800, margin: '0 auto', fontFamily: F.body }}>

        {/* ── Hero ── */}
        <div className="hiw-section" style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: '1.25rem',
          }}>
            {/* Ant badge */}
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              background: C.amberBg,
              border: `2px solid ${C.amberBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(245,158,11,0.20)',
            }}>
              <span className="hiw-hero-ant" style={{ fontSize: '2.25rem', lineHeight: 1 }}>🐜</span>
            </div>

            {/* Title block */}
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <SectionMarker label="Your grocery helper" />
              <h1 style={{
                margin: '0.2rem 0 0.6rem',
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: '800',
                fontStyle: 'italic',
                fontFamily: F.display,
                color: C.headingInk,
                lineHeight: 1.1,
              }}>
                How Ant Works
              </h1>
              <p style={{
                margin: isMobile ? '0 auto' : 0,
                fontSize: '0.9375rem',
                color: C.mutedInk,
                fontFamily: F.body,
                lineHeight: 1.65,
                maxWidth: 480,
              }}>
                Ant is your grocery helper. You tell it what you're cooking — it handles the rest.
                Here's the whole story, start to finish.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4-Step Flow ── */}
        <div className="hiw-section" style={{ marginBottom: '3rem' }}>
          <SectionMarker label="The process" />
          <SectionHeading>The 4-Step Magic ✨</SectionHeading>
          <SectionSubtitle>
            From meal plan to groceries in your cart — no copy-pasting, no typing, no headaches.
          </SectionSubtitle>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: isMobile ? 0 : '0.375rem',
          }}>
            <StepCard n={1} icon="🗓"
              title="Plan Your Week"
              body="Pick recipes for each day. Mix and match as many as you like. Add the same meal twice!"
              isMobile={isMobile}
            />
            <Arrow isMobile={isMobile} />
            <StepCard n={2} icon="🐜"
              title="Ant Grabs the Ingredients"
              body="Ant reads every recipe and pulls out all the ingredients automatically. No typing. No copy-paste."
              isMobile={isMobile}
            />
            <Arrow isMobile={isMobile} />
            <StepCard n={3} icon="🧠"
              title="Ant Sorts the List"
              body="Ant figures out what you probably already have vs. what you definitely need to buy."
              isMobile={isMobile}
            />
            <Arrow isMobile={isMobile} />
            <StepCard n={4} icon="🛒"
              title="Add to Your Kroger Cart"
              body={`Hit "Buy 'em, ant!" and your whole list flies straight into your Kroger cart. Done!`}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* ── Smart Sorting ── */}
        <div className="hiw-section" style={{ marginBottom: '3rem' }}>
          <SectionMarker label="Smart sorting" />
          <SectionHeading>How Ant Sorts Your List 🧠</SectionHeading>
          <SectionSubtitle>
            Every item goes into one of three buckets. Ant uses a smart AI brain to make the call —
            kind of like how you'd think about your own kitchen.
          </SectionSubtitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <CategoryChip
              emoji="🌿"
              label="Buy These"
              description="Fresh stuff that's definitely not sitting in your pantry — produce, meat, fish, milk, fresh bread, fresh herbs. Always checked and ready to add."
              chipColor={C.forestText}
              chipBg={C.forestBg}
              chipBorder={C.forestBorder}
            />
            <CategoryChip
              emoji="⚠️"
              label="Check Pantry First"
              description="Canned goods, sauces, butter, eggs, broth. You might have them — or you might be out. Checked by default, but with an amber badge as a reminder to peek in your pantry first."
              chipColor={C.amberDark}
              chipBg={C.amberBg}
              chipBorder={C.amberBorder}
            />
            <CategoryChip
              emoji="🫙"
              label="Pantry Staple"
              description="Spices, salt, pepper, cooking oils, vinegar, flour, sugar — the stuff that lives in your pantry forever. Unchecked by default, because you almost certainly already have them."
              chipColor={C.stapleText}
              chipBg={C.staleBg}
              chipBorder={C.staleBorder}
            />
          </div>
        </div>

        {/* ── Teach Ant ── */}
        <div className="hiw-section" style={{ marginBottom: '3rem' }}>
          <SectionMarker label="Personalization" />
          <SectionHeading>Teach Ant About Your Kitchen 🏠</SectionHeading>
          <SectionSubtitle>
            Ant doesn't know your kitchen perfectly at first — but it gets smarter the more you use it.
            Two things help it learn:
          </SectionSubtitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <InfoCard
              icon="✋"
              title='"I have this"'
              body={
                <>
                  See an item Ant thinks you need, but you already have it? Tap{' '}
                  <span style={{ color: C.amberDark, fontStyle: 'italic' }}>+ I have this</span>.
                  From now on, Ant will remind you to check your pantry before ordering it — instead of assuming you need to buy it.
                  (It never assumes you always have it, because everything runs out eventually!)
                </>
              }
            />
            <InfoCard
              icon="🕐"
              title="Your shopping history"
              body="Ant remembers everything you've ordered through the app. If you bought butter just 10 days ago, it figures you probably still have some — so it moves it to the 'check first' pile automatically."
            />
          </div>
        </div>

        {/* ── Kroger Connection ── */}
        <div className="hiw-section" style={{ marginBottom: '3rem' }}>
          <SectionMarker label="Store integration" />
          <SectionHeading>How the Kroger Connection Works 🔗</SectionHeading>
          <SectionSubtitle>
            Ant connects to your real Kroger (or Harris Teeter) account so it can add items directly to your cart.
          </SectionSubtitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              ['🏪', 'Pick your store', 'Enter your zip code and choose the location you shop at. Ant remembers it for next time.'],
              ['🔑', 'Log in once', 'Sign in to your Kroger account one time. After that, Ant handles everything automatically — no passwords to type again.'],
              ['🛍️', 'Choose your products', 'For each item on your list, Ant shows you real products from your store. Pick what you like best. Ant remembers your picks for next time too!'],
              ['✅', 'One tap to cart', 'Hit the big button and everything you selected gets added to your Kroger cart at once. Then just check out — in the app or at the store.'],
            ].map(([icon, title, body]) => (
              <KrogerStep key={title} icon={icon} title={title} body={body} />
            ))}
          </div>
        </div>

        {/* ── Closing ── */}
        <div className="hiw-section" style={{
          background: `linear-gradient(135deg, ${C.closingBg1} 0%, ${C.closingBg2} 100%)`,
          borderRadius: '14px',
          padding: isMobile ? '1.5rem 1.25rem' : '2rem 2.5rem',
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative background circles */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 130, height: 130, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -25, left: -25,
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(245,158,11,0.10)', pointerEvents: 'none',
          }} />
          {/* Subtle amber top line */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 60, height: '3px', background: C.amber, borderRadius: '0 0 3px 3px',
          }} />

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.625rem' }}>🐜</div>
            <p style={{
              margin: '0 0 0.5rem',
              fontWeight: '800', fontStyle: 'italic',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              color: C.closingHeading,   // #ffffff — on dark forest green: ~16:1 ✓
              fontFamily: F.display,
              lineHeight: 1.2,
            }}>
              That's all there is to it!
            </p>
            <p style={{
              margin: '0 auto',
              fontSize: '0.875rem',
              color: C.closingBody,       // #d4ead9 — on dark forest green: ~8:1 ✓
              fontFamily: F.body,
              lineHeight: 1.65,
              maxWidth: 400,
            }}>
              Ant does the boring stuff — counting ingredients, looking up products,
              sorting your pantry — so you can just cook and eat.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

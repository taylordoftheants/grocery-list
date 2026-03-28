import { colors, fonts, fontSizes, fontWeights, radii, shadows } from '../theme';

// ── Small reusable pieces ─────────────────────────────────────────────────────

function StepNumber({ n }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: colors.amber, color: colors.charcoal,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: fontWeights.bold, fontSize: fontSizes.base,
      fontFamily: fonts.display, flexShrink: 0,
    }}>
      {n}
    </div>
  );
}

function Arrow({ isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      ...(isMobile
        ? { height: 28, fontSize: '1.25rem', color: colors.amber }
        : { width: 36, fontSize: '1.5rem', color: colors.amber }),
    }}>
      {isMobile ? '↓' : '→'}
    </div>
  );
}

function StepCard({ n, icon, title, body, isMobile }) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: radii.lg,
      boxShadow: shadows.card,
      padding: '1.25rem',
      flex: isMobile ? 'none' : '1 1 0',
      minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <StepNumber n={n} />
        <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontWeight: fontWeights.bold, fontSize: fontSizes.lg, color: colors.textPrimary, fontFamily: fonts.display }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: fontSizes.base, color: colors.textSecondary, fontFamily: fonts.sans, lineHeight: 1.55 }}>
        {body}
      </p>
    </div>
  );
}

function CategoryChip({ emoji, label, description, chipColor, chipBg, chipBorder }) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: radii.lg,
      boxShadow: shadows.card,
      padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
    }}>
      <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
      <div>
        <span style={{
          display: 'inline-block',
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.bold,
          color: chipColor,
          background: chipBg,
          border: `1px solid ${chipBorder}`,
          borderRadius: radii.full,
          padding: '0.15rem 0.6rem',
          marginBottom: '0.375rem',
          fontFamily: fonts.sans,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textSecondary, fontFamily: fonts.sans, lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 style={{
      margin: '0 0 1rem',
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.textPrimary,
      fontFamily: fonts.display,
    }}>
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }) {
  return (
    <p style={{
      margin: '0 0 1.5rem',
      fontSize: fontSizes.base,
      color: colors.textMuted,
      fontFamily: fonts.sans,
      lineHeight: 1.6,
      maxWidth: 560,
    }}>
      {children}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HowItWorks({ isMobile }) {
  const pad = isMobile ? '1.25rem' : '2rem 2.5rem';

  return (
    <div style={{
      padding: pad,
      maxWidth: 780,
      margin: '0 auto',
      fontFamily: fonts.sans,
    }}>

      {/* Hero */}
      <div style={{ marginBottom: '2.5rem', textAlign: isMobile ? 'center' : 'left' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐜</div>
        <h1 style={{
          margin: '0 0 0.5rem',
          fontSize: isMobile ? fontSizes['3xl'] : '2rem',
          fontWeight: fontWeights.bold,
          fontFamily: fonts.display,
          color: colors.textPrimary,
          lineHeight: 1.2,
        }}>
          How Ant Works
        </h1>
        <p style={{
          margin: 0,
          fontSize: fontSizes.base,
          color: colors.textMuted,
          fontFamily: fonts.sans,
          lineHeight: 1.6,
          maxWidth: 520,
          ...(isMobile ? { margin: '0 auto' } : {}),
        }}>
          Ant is your grocery helper. You tell it what you're cooking — it handles the rest.
          Here's the whole story, start to finish.
        </p>
      </div>

      {/* ── Step-by-step flow ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SectionHeading>The 4-Step Magic ✨</SectionHeading>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          gap: isMobile ? 0 : '0.5rem',
        }}>
          <StepCard
            n={1} icon="🗓"
            title="Plan Your Week"
            body="Pick recipes for each day. Mix and match as many as you like. You can even add the same meal twice!"
            isMobile={isMobile}
          />
          <Arrow isMobile={isMobile} />
          <StepCard
            n={2} icon="🐜"
            title="Ant Grabs the Ingredients"
            body="Ant reads every recipe and pulls out all the ingredients automatically. No typing. No copy-paste."
            isMobile={isMobile}
          />
          <Arrow isMobile={isMobile} />
          <StepCard
            n={3} icon="🧠"
            title="Ant Sorts the List"
            body="Ant figures out what you probably already have at home vs. what you definitely need to buy. More on this below!"
            isMobile={isMobile}
          />
          <Arrow isMobile={isMobile} />
          <StepCard
            n={4} icon="🛒"
            title="Add to Your Kroger Cart"
            body={`Hit "Buy 'em, ant!" and your whole shopping list flies straight into your Kroger cart. Done!`}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* ── Smart sorting explainer ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SectionHeading>How Ant Sorts Your List 🧠</SectionHeading>
        <SectionSubtitle>
          When you open the shopping modal, Ant looks at every item and puts it into one of three buckets.
          It uses a smart AI brain to make the call — kind of like how you'd think about your own kitchen.
        </SectionSubtitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <CategoryChip
            emoji="🌿"
            label="Buy These"
            description="Fresh stuff that's definitely not sitting in your pantry right now — produce, meat, fish, milk, fresh bread, fresh herbs. These are always checked and ready to add."
            chipColor="#166534"
            chipBg="#dcfce7"
            chipBorder="#86efac"
          />
          <CategoryChip
            emoji="⚠️"
            label="Check Pantry First"
            description="Things like canned goods, sauces, butter, eggs, and broth. You might have them — or you might be out. Ant checks these by default but gives you an amber badge as a reminder to peek in your pantry before ordering."
            chipColor={colors.amberDark}
            chipBg={colors.amberLight}
            chipBorder={colors.amberBorder}
          />
          <CategoryChip
            emoji="🫙"
            label="Pantry Staple"
            description="Spices, salt, pepper, cooking oils, vinegar, flour, sugar, baking powder — the stuff that lives in your pantry forever. These are unchecked by default, because you almost certainly already have them."
            chipColor={colors.textMuted}
            chipBg={colors.bgSurface}
            chipBorder={colors.border}
          />
        </div>
      </div>

      {/* ── Teach Ant about your kitchen ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SectionHeading>Teach Ant About Your Kitchen 🏠</SectionHeading>
        <SectionSubtitle>
          Ant doesn't know your kitchen perfectly at first — but it gets smarter the more you use it.
          Two things help it learn:
        </SectionSubtitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* I Have This */}
          <div style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.lg,
            boxShadow: shadows.card,
            padding: '1.25rem',
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>✋</span>
            <div>
              <p style={{ margin: '0 0 0.375rem', fontWeight: fontWeights.bold, fontSize: fontSizes.base, color: colors.textPrimary, fontFamily: fonts.display }}>
                "I have this"
              </p>
              <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textSecondary, fontFamily: fonts.sans, lineHeight: 1.55 }}>
                See an item that Ant thinks you need to buy, but you already have it at home? Tap{' '}
                <span style={{ color: colors.textSubtle, fontStyle: 'italic' }}>+ I have this</span>{' '}
                next to it. From now on, Ant will remind you to check your pantry before ordering it — instead of assuming you need to buy it. (It never assumes you <em>always</em> have it, because everything runs out eventually!)
              </p>
            </div>
          </div>

          {/* Purchase history */}
          <div style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.lg,
            boxShadow: shadows.card,
            padding: '1.25rem',
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>🕐</span>
            <div>
              <p style={{ margin: '0 0 0.375rem', fontWeight: fontWeights.bold, fontSize: fontSizes.base, color: colors.textPrimary, fontFamily: fonts.display }}>
                Your shopping history
              </p>
              <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textSecondary, fontFamily: fonts.sans, lineHeight: 1.55 }}>
                Ant remembers everything you've ordered through the app. If you bought butter just 10 days ago, it figures you probably still have some — so it moves it to the "check first" pile automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Kroger connection ── */}
      <div style={{ marginBottom: '3rem' }}>
        <SectionHeading>How the Kroger Connection Works 🔗</SectionHeading>
        <SectionSubtitle>
          Ant connects to your real Kroger (or Harris Teeter) account so it can add items directly to your cart.
        </SectionSubtitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            ['🏪', 'Pick your store', 'Enter your zip code and choose the location you shop at. Ant remembers it for next time.'],
            ['🔑', 'Log in once', 'You sign in to your Kroger account one time. After that, Ant handles everything automatically — no passwords to type again.'],
            ['🛍️', 'Choose your products', 'For each item on your list, Ant shows you real products from your store. Pick the one you like best. Ant remembers your picks for next time too!'],
            ['✅', 'One tap to cart', 'Hit the big button and everything you selected gets added to your Kroger cart at once. Then just check out — either in the app or at the store.'],
          ].map(([icon, title, body]) => (
            <div key={title} style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.lg,
              boxShadow: shadows.card,
              padding: '1rem 1.25rem',
              display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{icon}</span>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: fontWeights.semibold, fontSize: fontSizes.base, color: colors.textPrimary, fontFamily: fonts.display }}>{title}</p>
                <p style={{ margin: 0, fontSize: fontSizes.sm, color: colors.textSecondary, fontFamily: fonts.sans, lineHeight: 1.55 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Closing ── */}
      <div style={{
        background: colors.charcoal,
        borderRadius: radii.xl,
        padding: '1.5rem',
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : 0,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐜</div>
        <p style={{ margin: '0 0 0.25rem', fontWeight: fontWeights.bold, fontSize: fontSizes.lg, color: colors.white, fontFamily: fonts.display }}>
          That's all there is to it!
        </p>
        <p style={{ margin: 0, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.sans, lineHeight: 1.6 }}>
          Ant does the boring stuff — counting ingredients, looking up products,
          sorting your pantry — so you can just cook and eat.
        </p>
      </div>

    </div>
  );
}

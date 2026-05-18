import { m, AnimatePresence } from 'motion/react';

/**
 * Animated SVG illustrations for each onboarding step.
 * Right-panel visual that changes per step.
 */
export function OnboardingIllustration({ step }: { step: number }) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={step}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-full w-full items-center justify-center"
      >
        {step === 1 && <ProfileIllustration />}
        {step === 2 && <IntentIllustration />}
        {step === 3 && <HelmetIllustration />}
        {step === 4 && <TeamIllustration />}
        {step === 5 && <NotificationIllustration />}
        {step === 6 && <CameraIllustration />}
        {step === 7 && <CheckeredFlagIllustration />}
      </m.div>
    </AnimatePresence>
  );
}

// ─── Step 1: Profile / Identity ──────────────────────────────────────────────

function ProfileIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Outer ring */}
      <m.circle
        cx="200"
        cy="200"
        r="150"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* Inner ring */}
      <m.circle
        cx="200"
        cy="200"
        r="110"
        stroke="rgba(220,38,38,0.3)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        initial={{ pathLength: 0, rotate: 0 }}
        animate={{ pathLength: 1, rotate: 360 }}
        transition={{
          pathLength: { duration: 1 },
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
        }}
      />
      {/* Head */}
      <m.circle
        cx="200"
        cy="165"
        r="38"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      />
      {/* Body arc */}
      <m.path
        d="M140 280 C140 235 160 215 200 215 C240 215 260 235 260 280"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      />
      {/* Name line placeholder */}
      <m.rect
        x="160"
        y="305"
        width="80"
        height="6"
        rx="3"
        fill="rgba(220,38,38,0.4)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
      <m.rect
        x="175"
        y="320"
        width="50"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.1)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      />
    </svg>
  );
}

// ─── Step 2: Intent / Dashboard ──────────────────────────────────────────────

function IntentIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Grid cards */}
      {[
        { x: 60, y: 80, w: 130, h: 130, delay: 0 },
        { x: 210, y: 80, w: 130, h: 60, delay: 0.1 },
        { x: 210, y: 155, w: 130, h: 55, delay: 0.2 },
        { x: 60, y: 230, w: 130, h: 60, delay: 0.15 },
        { x: 210, y: 230, w: 130, h: 90, delay: 0.25 },
        { x: 60, y: 305, w: 130, h: 55, delay: 0.3 },
      ].map((card, i) => (
        <m.rect
          key={i}
          x={card.x}
          y={card.y}
          width={card.w}
          height={card.h}
          rx="10"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay, duration: 0.5 }}
        />
      ))}
      {/* Highlight active card */}
      <m.rect
        x="60"
        y="80"
        width="130"
        height="130"
        rx="10"
        fill="rgba(220,38,38,0.06)"
        stroke="rgba(220,38,38,0.3)"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.7, 1] }}
        transition={{ delay: 0.6, duration: 1.5 }}
      />
      {/* Emoji in highlighted card */}
      <m.text
        x="125"
        y="155"
        textAnchor="middle"
        fontSize="32"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      >
        📊
      </m.text>
      {/* Bar chart in bottom-right card */}
      {[0, 1, 2, 3].map((i) => (
        <m.rect
          key={`bar-${i}`}
          x={225 + i * 25}
          y={290 - [30, 45, 25, 50][i]}
          width="14"
          height={[30, 45, 25, 50][i]}
          rx="3"
          fill={i === 3 ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.1)'}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
          style={{ transformOrigin: `${232 + i * 25}px 290px` }}
        />
      ))}
    </svg>
  );
}

// ─── Step 3: Racing Helmet ───────────────────────────────────────────────────

function HelmetIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Speed lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <m.line
          key={i}
          x1={50 + i * 20}
          y1={150 + i * 30}
          x2={100 + i * 20}
          y2={150 + i * 30}
          stroke="rgba(220,38,38,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0] }}
          transition={{ delay: i * 0.15, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
      {/* Helmet shape */}
      <m.path
        d="M160 280 C160 280 145 270 140 250 C130 210 140 170 170 150 C190 137 220 130 250 140 C280 150 300 175 300 210 C300 240 290 260 280 270 L270 275 L260 280 Z"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {/* Visor */}
      <m.path
        d="M165 230 C170 215 190 195 230 190 C260 187 280 195 285 210 L275 225 C265 235 240 240 210 238 C185 236 170 235 165 230 Z"
        fill="rgba(220,38,38,0.15)"
        stroke="rgba(220,38,38,0.5)"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      />
      {/* Stripe */}
      <m.path
        d="M200 140 C200 140 215 130 240 140 L235 160 C220 155 210 155 200 160 Z"
        fill="rgba(220,38,38,0.4)"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      />
      {/* Number */}
      <m.text
        x="240"
        y="168"
        fill="rgba(255,255,255,0.6)"
        fontSize="18"
        fontWeight="bold"
        fontFamily="monospace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        01
      </m.text>
    </svg>
  );
}

// ─── Step 4: Team / Constructor ──────────────────────────────────────────────

function TeamIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Shield / crest shape */}
      <m.path
        d="M200 70 L300 120 L300 230 C300 280 260 320 200 350 C140 320 100 280 100 230 L100 120 Z"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      {/* Inner shield */}
      <m.path
        d="M200 100 L275 138 L275 225 C275 265 245 295 200 320 C155 295 125 265 125 225 L125 138 Z"
        fill="rgba(220,38,38,0.05)"
        stroke="rgba(220,38,38,0.25)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      />
      {/* Horizontal divider */}
      <m.line
        x1="140"
        y1="220"
        x2="260"
        y2="220"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
      {/* Star */}
      <m.path
        d="M200 145 L207 170 L233 170 L212 185 L219 210 L200 196 L181 210 L188 185 L167 170 L193 170 Z"
        fill="rgba(220,38,38,0.5)"
        stroke="rgba(220,38,38,0.7)"
        strokeWidth="1"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1, type: 'spring', stiffness: 150 }}
      />
      {/* Team name placeholder bars */}
      <m.rect
        x="165"
        y="240"
        width="70"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.15)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />
      <m.rect
        x="175"
        y="255"
        width="50"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.08)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
      />
    </svg>
  );
}

// ─── Step 5: Notifications / Bell ────────────────────────────────────────────

function NotificationIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Notification rings */}
      {[0, 1, 2].map((i) => (
        <m.circle
          key={i}
          cx="200"
          cy="200"
          r={80 + i * 40}
          stroke="rgba(220,38,38,0.15)"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ delay: i * 0.4, duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      ))}
      {/* Bell body */}
      <m.path
        d="M200 120 C165 120 145 150 145 185 L145 230 L135 245 L265 245 L255 230 L255 185 C255 150 235 120 200 120 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      />
      {/* Bell clapper */}
      <m.ellipse
        cx="200"
        cy="265"
        rx="18"
        ry="12"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      />
      {/* Bell top */}
      <m.circle
        cx="200"
        cy="115"
        r="8"
        fill="rgba(220,38,38,0.6)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      />
      {/* Notification badge */}
      <m.circle
        cx="245"
        cy="145"
        r="14"
        fill="rgba(220,38,38,0.8)"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />
      <m.text
        x="245"
        y="150"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        3
      </m.text>
    </svg>
  );
}

// ─── Step 6: Camera / Photo ──────────────────────────────────────────────────

function CameraIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Camera body */}
      <m.rect
        x="110"
        y="160"
        width="180"
        height="130"
        rx="16"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      />
      {/* Camera top bump */}
      <m.path
        d="M165 160 L175 140 L225 140 L235 160"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />
      {/* Lens outer */}
      <m.circle
        cx="200"
        cy="225"
        r="42"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
      />
      {/* Lens inner */}
      <m.circle
        cx="200"
        cy="225"
        r="28"
        fill="rgba(220,38,38,0.1)"
        stroke="rgba(220,38,38,0.4)"
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      />
      {/* Lens center */}
      <m.circle
        cx="200"
        cy="225"
        r="12"
        fill="rgba(220,38,38,0.3)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      />
      {/* Flash */}
      <m.circle
        cx="255"
        cy="180"
        r="6"
        fill="rgba(255,255,255,0.3)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{ delay: 1, duration: 0.8 }}
      />
      {/* Shutter animation */}
      <m.circle
        cx="200"
        cy="225"
        r="42"
        fill="rgba(255,255,255,0.1)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ delay: 1.5, duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
      />
    </svg>
  );
}

// ─── Step 7: Checkered Flag / Finish ─────────────────────────────────────────

function CheckeredFlagIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" className="w-full max-w-[320px]">
      {/* Flag pole */}
      <m.line
        x1="130"
        y1="80"
        x2="130"
        y2="340"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      {/* Flag body with wave */}
      <m.path
        d="M130 80 C180 80 180 100 230 100 C280 100 280 80 330 80 L330 200 C280 200 280 220 230 220 C180 220 180 200 130 200 Z"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      />
      {/* Checkered pattern squares */}
      {[
        [145, 95],
        [175, 95],
        [205, 100],
        [235, 100],
        [265, 95],
        [295, 90],
        [155, 120],
        [185, 122],
        [215, 125],
        [245, 123],
        [275, 118],
        [305, 110],
        [145, 145],
        [175, 150],
        [205, 155],
        [235, 153],
        [265, 148],
        [295, 140],
        [155, 170],
        [185, 175],
        [215, 178],
        [245, 176],
        [275, 172],
      ].map(([x, y], i) => (
        <m.rect
          key={i}
          x={x}
          y={y}
          width="16"
          height="16"
          rx="2"
          fill={i % 2 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(220,38,38,0.3)'}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.03, duration: 0.3 }}
        />
      ))}
      {/* Trophy below */}
      <m.path
        d="M185 280 L185 310 L175 330 L225 330 L215 310 L215 280 Z"
        fill="rgba(220,38,38,0.15)"
        stroke="rgba(220,38,38,0.4)"
        strokeWidth="1.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      />
      <m.ellipse
        cx="200"
        cy="278"
        rx="25"
        ry="8"
        fill="rgba(220,38,38,0.2)"
        stroke="rgba(220,38,38,0.4)"
        strokeWidth="1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.4, type: 'spring' }}
      />
    </svg>
  );
}

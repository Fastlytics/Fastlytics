import { m } from 'motion/react';

/**
 * Animated SVG illustration for auth pages.
 * Shows a stylized telemetry/race dashboard with animated elements.
 */
export function AuthIllustration({ variant = 'signup' }: { variant?: 'signup' | 'login' }) {
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden">
      {/* Background atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/[0.03] blur-[150px]" />

      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <svg
          width="420"
          height="380"
          viewBox="0 0 420 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_80px_rgba(220,38,38,0.08)]"
        >
          {/* Main card frame */}
          <rect
            x="40"
            y="30"
            width="340"
            height="320"
            rx="16"
            fill="#0c0c0e"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />

          {/* Header bar */}
          <rect x="40" y="30" width="340" height="48" rx="16" fill="#0c0c0e" />
          <rect x="40" y="62" width="340" height="16" fill="#0c0c0e" />
          <line x1="40" y1="78" x2="380" y2="78" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

          {/* Window dots */}
          <circle cx="64" cy="54" r="4" fill="rgba(255,255,255,0.08)" />
          <circle cx="80" cy="54" r="4" fill="rgba(255,255,255,0.08)" />
          <circle cx="96" cy="54" r="4" fill="rgba(255,255,255,0.08)" />

          {/* Title text placeholder */}
          <rect x="130" y="48" width="80" height="12" rx="3" fill="rgba(255,255,255,0.06)" />

          {/* Live indicator */}
          <m.circle
            cx="350"
            cy="54"
            r="3"
            fill="#10b981"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <rect x="330" y="48" width="12" height="12" rx="3" fill="transparent" />

          {/* Speed trace chart */}
          <m.path
            d="M 70 200 Q 100 180, 130 195 T 190 170 T 250 190 T 310 160 T 350 175"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.3, ease: 'easeOut' }}
          />
          <m.path
            d="M 70 210 Q 100 200, 130 215 T 190 195 T 250 210 T 310 185 T 350 200"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.6, ease: 'easeOut' }}
          />

          {/* Chart label */}
          <rect x="70" y="96" width="60" height="10" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="70" y="112" width="40" height="8" rx="2" fill="rgba(255,255,255,0.03)" />

          {/* Telemetry bars */}
          {variant === 'signup' ? (
            <>
              {/* Throttle bar */}
              <rect x="70" y="260" width="280" height="6" rx="3" fill="rgba(255,255,255,0.04)" />
              <m.rect
                x="70"
                y="260"
                width="280"
                height="6"
                rx="3"
                fill="#10b981"
                initial={{ width: 0 }}
                animate={{ width: 280 }}
                transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
              />
              <rect x="70" y="250" width="40" height="6" rx="2" fill="rgba(255,255,255,0.04)" />

              {/* Brake bar */}
              <rect x="70" y="286" width="280" height="6" rx="3" fill="rgba(255,255,255,0.04)" />
              <m.rect
                x="70"
                y="286"
                width="0"
                height="6"
                rx="3"
                fill="#ef4444"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 0.8, delay: 1.2, ease: 'easeOut' }}
              />
              <rect x="70" y="276" width="28" height="6" rx="2" fill="rgba(255,255,255,0.04)" />

              {/* DRS bar */}
              <rect x="70" y="312" width="280" height="6" rx="3" fill="rgba(255,255,255,0.04)" />
              <m.rect
                x="70"
                y="312"
                width="0"
                height="6"
                rx="3"
                fill="#3b82f6"
                initial={{ width: 0 }}
                animate={{ width: 200 }}
                transition={{ duration: 1.2, delay: 1.0, ease: 'easeOut' }}
              />
              <rect x="70" y="302" width="20" height="6" rx="2" fill="rgba(255,255,255,0.04)" />
            </>
          ) : (
            <>
              {/* Position cards for login variant */}
              {[0, 1, 2, 3].map((i) => (
                <m.g
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                >
                  <rect
                    x="70"
                    y={255 + i * 24}
                    width="280"
                    height="20"
                    rx="4"
                    fill="rgba(255,255,255,0.02)"
                  />
                  <rect
                    x="78"
                    y={260 + i * 24}
                    width="12"
                    height="10"
                    rx="2"
                    fill="rgba(255,255,255,0.06)"
                  />
                  <rect
                    x="98"
                    y={261 + i * 24}
                    width="3"
                    height="8"
                    rx="1.5"
                    fill={['#dc2626', '#ff8700', '#ff8700', '#6c779f'][i]}
                  />
                  <rect
                    x="110"
                    y={261 + i * 24}
                    width={[40, 36, 38, 34][i]}
                    height="8"
                    rx="2"
                    fill="rgba(255,255,255,0.08)"
                  />
                  <rect
                    x="310"
                    y={261 + i * 24}
                    width="30"
                    height="8"
                    rx="2"
                    fill="rgba(255,255,255,0.04)"
                  />
                </m.g>
              ))}
            </>
          )}

          {/* Floating data points on chart */}
          <m.circle
            cx="190"
            cy="170"
            r="4"
            fill="#dc2626"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3, type: 'spring' }}
          />
          <m.circle
            cx="310"
            cy="160"
            r="4"
            fill="#dc2626"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.8, duration: 0.3, type: 'spring' }}
          />
        </svg>

        {/* Caption below illustration */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            {variant === 'signup' ? (
              <>
                Race intelligence, <span className="text-white/40">simplified</span>
              </>
            ) : (
              <>
                Your race desk <span className="text-white/40">awaits</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-white/40">
            {variant === 'signup'
              ? 'Telemetry, strategy, pace and championship context wired into one live race desk.'
              : 'Pick up where you left off with personalized insights and live session data.'}
          </p>
        </m.div>
      </m.div>
    </div>
  );
}

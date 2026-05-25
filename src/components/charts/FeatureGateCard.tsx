import { Cancel01Icon, ArrowUpRight01Icon } from 'hugeicons-react';

interface FeatureGateCardProps {
  onClose: () => void;
  onUpgrade: () => void;
}

function LimitGaugeIllustration() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer decorative ring */}
      <circle cx="70" cy="70" r="64" stroke="white" strokeOpacity="0.03" strokeWidth="1" />
      <circle
        cx="70"
        cy="70"
        r="58"
        stroke="white"
        strokeOpacity="0.04"
        strokeWidth="0.5"
        strokeDasharray="3 8"
      />

      {/* Track ring */}
      <circle cx="70" cy="70" r="46" stroke="white" strokeOpacity="0.06" strokeWidth="9" />

      {/* Filled arc (~94% of circle — visually "at capacity") */}
      <circle
        cx="70"
        cy="70"
        r="46"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="271.7 17.3"
        transform="rotate(-90 70 70)"
        fill="none"
      />

      {/* Subtle cardinal tick marks */}
      <g stroke="white" strokeOpacity="0.08" strokeWidth="2" strokeLinecap="round">
        <line x1="70" y1="19" x2="70" y2="13" />
        <line x1="121" y1="70" x2="127" y2="70" />
        <line x1="70" y1="121" x2="70" y2="127" />
        <line x1="19" y1="70" x2="13" y2="70" />
      </g>

      {/* End-of-arc indicator dot */}
      <circle cx="71.3" cy="24.1" r="6" fill="white" fillOpacity="0.06" />
      <circle cx="71.3" cy="24.1" r="2.5" fill="white" fillOpacity="0.35" />

      {/* Center text */}
      <text
        x="70"
        y="66"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="18"
        fontWeight="700"
      >
        LIMIT
      </text>
      <text
        x="70"
        y="84"
        textAnchor="middle"
        fill="white"
        fillOpacity="0.35"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="11"
        fontWeight="500"
        letterSpacing="0.12em"
      >
        REACHED
      </text>
    </svg>
  );
}

export function FeatureGateCard({ onClose, onUpgrade }: FeatureGateCardProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
        <h3 className="min-w-0 text-[24px] font-semibold leading-none text-white"></h3>

        <button
          type="button"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-white transition-colors hover:bg-white/[0.04]"
        >
          <Cancel01Icon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="flex flex-col items-center gap-7 text-center">
          <div className="pt-5">
            <LimitGaugeIllustration />
          </div>

          <div className="max-w-xs text-white">
            <p className="text-[15px] leading-7 text-white/70">
              You&apos;ve used all your monthly telemetry analysis credits.
            </p>
            <p className="mt-3 text-[14px] leading-7 text-white/50">
              Upgrade to <span className="font-semibold text-white">Pro</span> for{' '}
              <span className="font-semibold text-white">100 analyses/month</span> and unlock
              advanced telemetry insights.
            </p>
          </div>

          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-white/90"
          >
            Upgrade to Pro
            <ArrowUpRight01Icon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

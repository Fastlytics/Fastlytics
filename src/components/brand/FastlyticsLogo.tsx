/**
 * FastlyticsLogo — cyber brutalist telemetry mark.
 * A deconstructed "F" built from raw geometric blocks and telemetry
 * data lines, evoking a race control terminal. On hover, the mark
 * activates with a glitch shift, scan-line sweep, and red pulse.
 */
import { useState } from 'react';

const FastlyticsLogo = ({ size = 28 }: { size?: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fastlytics"
      role="img"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <style>{`
        .fl-logo { transition: filter 0.3s ease; }
        .fl-logo:hover { filter: drop-shadow(0 0 6px rgba(255, 40, 0, 0.5)); }

        .fl-block {
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 0.25s ease;
        }
        .fl-logo:hover .fl-block-1 { transform: translateX(-1.5px) translateY(0.5px); }
        .fl-logo:hover .fl-block-2 { transform: translateX(1.5px) translateY(-0.5px); }
        .fl-logo:hover .fl-block-3 { transform: translateX(-1px); }

        .fl-pulse {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 0.3s ease;
          opacity: 0;
        }
        .fl-logo:hover .fl-pulse {
          stroke-dashoffset: 0;
          opacity: 1;
        }

        .fl-scan {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          transform: translateY(32px);
        }
        .fl-logo:hover .fl-scan {
          transform: translateY(-32px);
        }

        .fl-grid line {
          transition: opacity 0.3s ease;
          opacity: 0;
        }
        .fl-logo:hover .fl-grid line {
          opacity: 1;
        }

        .fl-data-dot {
          transition: opacity 0.3s ease 0.15s;
          opacity: 0;
        }
        .fl-logo:hover .fl-data-dot {
          opacity: 1;
        }

        @keyframes fl-glitch {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-1px, 0); }
          40% { transform: translate(1px, -0.5px); }
          60% { transform: translate(-0.5px, 0.5px); }
          80% { transform: translate(0.5px, 0); }
        }
        .fl-logo:hover .fl-glitch-layer {
          animation: fl-glitch 0.4s steps(5) 1;
        }
      `}</style>

      <g className="fl-logo">
        {/* Background — brutalist dark slab */}
        <rect width="32" height="32" rx="4" fill="#08080A" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="3.5" stroke="white" strokeOpacity="0.06" />

        {/* Exposed grid structure — revealed on hover */}
        <g className="fl-grid">
          <line
            x1="8"
            y1="0"
            x2="8"
            y2="32"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="16"
            y1="0"
            x2="16"
            y2="32"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="24"
            y1="0"
            x2="24"
            y2="32"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="8"
            x2="32"
            y2="8"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="16"
            x2="32"
            y2="16"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="24"
            x2="32"
            y2="24"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
        </g>

        {/* Scan line sweep — hover reveal */}
        <rect
          className="fl-scan"
          x="0"
          y="0"
          width="32"
          height="3"
          fill="url(#fl-scan-grad)"
          opacity="0.5"
        />

        {/* === The F mark — deconstructed geometric blocks === */}

        {/* Vertical stem — raw slab */}
        <rect
          className="fl-block fl-block-1"
          x="7"
          y="6"
          width="3.5"
          height="20"
          fill="white"
          rx="0.5"
        />

        {/* Top horizontal bar — extends past stem (brutalist overreach) */}
        <rect
          className="fl-block fl-block-2"
          x="7"
          y="6"
          width="16"
          height="3.5"
          fill="white"
          rx="0.5"
        />

        {/* Middle bar — shorter, offset for tension */}
        <rect
          className="fl-block fl-block-3"
          x="10.5"
          y="13.5"
          width="11"
          height="2.5"
          fill="white"
          rx="0.5"
        />

        {/* Telemetry data dots — raw data points */}
        <circle className="fl-data-dot" cx="23" cy="7.75" r="1.2" fill="#EF4444" />
        <circle className="fl-data-dot" cx="23" cy="14.75" r="1.2" fill="#EF4444" />
        <circle className="fl-data-dot" cx="23" cy="22" r="1" fill="#EF4444" opacity="0.6" />

        {/* Speed notch — cut out of top bar */}
        <rect className="fl-block fl-block-2" x="20" y="6" width="3" height="3.5" fill="#08080A" />

        {/* Telemetry pulse line — animates in on hover */}
        <polyline
          className="fl-pulse"
          points="4,27 8,27 10,24 12,29 14,25 16,28 18,26 20,27 28,27"
          stroke="#EF4444"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glitch double — offset shadow on hover */}
        <g className="fl-glitch-layer" opacity={hovered ? 0.08 : 0}>
          <rect x="8" y="6.5" width="3.5" height="20" fill="#EF4444" rx="0.5" />
          <rect x="8" y="6.5" width="16" height="3.5" fill="#EF4444" rx="0.5" />
        </g>

        {/* Corner registration marks — brutalist print detail */}
        <line x1="2" y1="2" x2="4.5" y2="2" stroke="white" strokeOpacity="0.12" strokeWidth="0.5" />
        <line x1="2" y1="2" x2="2" y2="4.5" stroke="white" strokeOpacity="0.12" strokeWidth="0.5" />
        <line
          x1="30"
          y1="2"
          x2="27.5"
          y2="2"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />
        <line
          x1="30"
          y1="2"
          x2="30"
          y2="4.5"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />
        <line
          x1="2"
          y1="30"
          x2="4.5"
          y2="30"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />
        <line
          x1="2"
          y1="30"
          x2="2"
          y2="27.5"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />
        <line
          x1="30"
          y1="30"
          x2="27.5"
          y2="30"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />
        <line
          x1="30"
          y1="30"
          x2="30"
          y2="27.5"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="fl-scan-grad" x1="0" y1="0" x2="32" y2="0">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
            <stop offset="50%" stopColor="#EF4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
};

export { FastlyticsLogo };
export default FastlyticsLogo;

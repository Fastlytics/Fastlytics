/**
 * FastlyticsLogo — minimalist cyber-brutalist mark.
 * A bold geometric F paired with raw telemetry bars.
 * On hover: deconstruct shift, glitch shadow, scan sweep, grid reveal.
 */
const FastlyticsLogo = ({ size = 28 }: { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fastlytics"
      role="img"
      style={{ cursor: 'pointer' }}
    >
      <style>{`
        .fl-container { transition: filter 0.3s ease; }
        .fl-container:hover { filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.35)); }

        /* Deconstruct: F blocks drift apart on hover */
        .fl-stem {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .fl-container:hover .fl-stem { transform: translate(-1px, 0); }

        .fl-top {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .fl-container:hover .fl-top { transform: translate(1px, -1px); }

        .fl-mid {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .fl-container:hover .fl-mid { transform: translate(-0.5px, 1px); }

        /* Telemetry bars: staggered lift on hover */
        .fl-bar {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.3s ease;
        }
        .fl-container:hover .fl-bar-1 { transform: translateY(-2px); transition-delay: 0.05s; }
        .fl-container:hover .fl-bar-2 { transform: translateY(-3px); transition-delay: 0.1s; }
        .fl-container:hover .fl-bar-3 { transform: translateY(-4px); transition-delay: 0.15s; }

        /* Glitch shadow layer */
        .fl-glitch {
          transition: opacity 0.25s ease, transform 0.25s ease;
          opacity: 0;
          transform: translate(0, 0);
        }
        .fl-container:hover .fl-glitch {
          opacity: 0.12;
          transform: translate(1.5px, 0.5px);
        }

        /* Scan line sweep */
        .fl-scan {
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          transform: translateY(-36px);
        }
        .fl-container:hover .fl-scan {
          transform: translateY(36px);
        }

        /* Grid reveal */
        .fl-grid line {
          transition: opacity 0.35s ease;
          opacity: 0;
        }
        .fl-container:hover .fl-grid line {
          opacity: 1;
        }

        /* Corner marks */
        .fl-reg {
          stroke-opacity: 0.1;
          transition: stroke-opacity 0.3s ease;
        }
        .fl-container:hover .fl-reg {
          stroke-opacity: 0.3;
        }
      `}</style>

      <g className="fl-container">
        {/* Background slab */}
        <rect width="32" height="32" rx="4" fill="#0A0A0C" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="3.5" stroke="white" strokeOpacity="0.05" />

        {/* Exposed grid */}
        <g className="fl-grid" stroke="white" strokeOpacity="0.03" strokeWidth="0.5">
          <line x1="8" y1="0" x2="8" y2="32" />
          <line x1="16" y1="0" x2="16" y2="32" />
          <line x1="24" y1="0" x2="24" y2="32" />
          <line x1="0" y1="8" x2="32" y2="8" />
          <line x1="0" y1="16" x2="32" y2="16" />
          <line x1="0" y1="24" x2="32" y2="24" />
        </g>

        {/* Scan line */}
        <rect
          className="fl-scan"
          x="0"
          y="0"
          width="32"
          height="2.5"
          fill="url(#fl-scan-grad)"
          opacity="0.6"
        />

        {/* The F mark */}
        <rect className="fl-stem" x="6" y="5" width="5" height="22" rx="1" fill="white" />
        <rect className="fl-top" x="6" y="5" width="18" height="5" rx="1" fill="white" />
        <rect className="fl-mid" x="6" y="14" width="12" height="4" rx="1" fill="white" />

        {/* Telemetry bars */}
        <rect className="fl-bar fl-bar-1" x="20" y="20" width="2.5" height="7" fill="#EF4444" />
        <rect className="fl-bar fl-bar-2" x="24" y="16" width="2.5" height="11" fill="#EF4444" />
        <rect className="fl-bar fl-bar-3" x="28" y="12" width="2.5" height="15" fill="#EF4444" />

        {/* Glitch layer */}
        <g className="fl-glitch">
          <rect x="6" y="5" width="5" height="22" rx="1" fill="#EF4444" />
          <rect x="6" y="5" width="18" height="5" rx="1" fill="#EF4444" />
          <rect x="6" y="14" width="12" height="4" rx="1" fill="#EF4444" />
        </g>

        {/* Corner registration marks */}
        <g className="fl-reg" stroke="white" strokeWidth="0.5">
          <line x1="2" y1="2" x2="5" y2="2" />
          <line x1="2" y1="2" x2="2" y2="5" />
          <line x1="30" y1="2" x2="27" y2="2" />
          <line x1="30" y1="2" x2="30" y2="5" />
          <line x1="2" y1="30" x2="5" y2="30" />
          <line x1="2" y1="30" x2="2" y2="27" />
          <line x1="30" y1="30" x2="27" y2="30" />
          <line x1="30" y1="30" x2="30" y2="27" />
        </g>

        <defs>
          <linearGradient id="fl-scan-grad" x1="0" y1="0" x2="32" y2="0">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
            <stop offset="50%" stopColor="#EF4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
};

export { FastlyticsLogo };
export default FastlyticsLogo;

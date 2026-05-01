import { cn } from '@/lib/utils';

const letters = 'fastlytics'.split('');

interface FastlyticsLogoProps {
  size?: number;
  className?: string;
}

/**
 * FastlyticsLogo — hi-tech telemetry wordmark.
 * Full text rendered in brand font with data-themed decorations:
 * corner brackets, telemetry bars, scan sweep, glitch shadow,
 * blinking terminal cursor, data dots, and a travelling pulse baseline.
 */
const FastlyticsLogo = ({ size = 28, className }: FastlyticsLogoProps) => {
  return (
    <span
      className={cn('inline-flex items-center select-none cursor-pointer', className)}
      style={{
        fontFamily: "'Geist', 'Inter', sans-serif",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.15,
        color: '#ffffff',
      }}
      aria-label="Fastlytics"
      role="img"
    >
      <style>{`
        @keyframes fl-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }

        .fl-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.35em;
          padding: 0.2em 0.35em;
          transform: skewX(-6deg);
        }

        .fl-text {
          position: relative;
          display: inline-flex;
          letter-spacing: -0.04em;
        }

        .fl-letter {
          display: inline-block;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      color 0.3s ease,
                      text-shadow 0.3s ease;
        }

        .fl-wrap:hover .fl-letter {
          color: #ef4444;
          text-shadow: 0 0 0.35em rgba(239, 68, 68, 0.4);
        }
        .fl-wrap:hover .fl-letter:nth-child(1)  { transform: translateY(-0.06em); transition-delay: 0.00s; }
        .fl-wrap:hover .fl-letter:nth-child(2)  { transform: translateY(-0.14em); transition-delay: 0.03s; }
        .fl-wrap:hover .fl-letter:nth-child(3)  { transform: translateY(-0.06em); transition-delay: 0.06s; }
        .fl-wrap:hover .fl-letter:nth-child(4)  { transform: translateY(-0.14em); transition-delay: 0.09s; }
        .fl-wrap:hover .fl-letter:nth-child(5)  { transform: translateY(-0.06em); transition-delay: 0.12s; }
        .fl-wrap:hover .fl-letter:nth-child(6)  { transform: translateY(-0.14em); transition-delay: 0.15s; }
        .fl-wrap:hover .fl-letter:nth-child(7)  { transform: translateY(-0.06em); transition-delay: 0.18s; }
        .fl-wrap:hover .fl-letter:nth-child(8)  { transform: translateY(-0.14em); transition-delay: 0.21s; }
        .fl-wrap:hover .fl-letter:nth-child(9)  { transform: translateY(-0.06em); transition-delay: 0.24s; }
        .fl-wrap:hover .fl-letter:nth-child(10) { transform: translateY(-0.14em); transition-delay: 0.27s; }

        /* Glitch shadow layer */
        .fl-glitch {
          position: absolute;
          inset: 0;
          display: inline-flex;
          letter-spacing: -0.04em;
          color: #ef4444;
          opacity: 0;
          transform: translate(0.05em, 0.03em);
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .fl-wrap:hover .fl-glitch {
          opacity: 0.15;
        }

        /* Baseline with travelling data pulse */
        .fl-baseline {
          position: absolute;
          bottom: -0.08em;
          left: -0.05em;
          right: -0.05em;
          height: 0.06em;
          background: rgba(255,255,255,0.12);
          border-radius: 0.02em;
          transition: background 0.3s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: left;
          pointer-events: none;
          overflow: hidden;
        }
        .fl-baseline::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 0.45em;
          height: 100%;
          background: #ef4444;
          opacity: 0;
          border-radius: 0.02em;
          box-shadow: 0 0 0.25em rgba(239, 68, 68, 0.6);
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s;
        }
        .fl-wrap:hover .fl-baseline {
          background: rgba(239, 68, 68, 0.25);
          transform: scaleX(1.04);
        }
        .fl-wrap:hover .fl-baseline::after {
          opacity: 0.9;
          transform: translateX(6em);
        }

        /* Vertical scan sweep */
        .fl-scan {
          position: absolute;
          top: -0.15em;
          bottom: -0.15em;
          left: -0.3em;
          width: 0.12em;
          background: linear-gradient(to bottom, transparent, rgba(239,68,68,0.55), transparent);
          opacity: 0;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.1s;
          pointer-events: none;
        }
        .fl-wrap:hover .fl-scan {
          opacity: 0.8;
          transform: translateX(5.8em);
        }

        /* Telemetry bars */
        .fl-bar {
          display: inline-block;
          width: 0.1em;
          background: #ef4444;
          border-radius: 0.02em;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.3s ease,
                      box-shadow 0.3s ease;
          opacity: 0.6;
        }
        .fl-bar-1 { height: 0.45em; }
        .fl-bar-2 { height: 0.65em; }
        .fl-bar-3 { height: 0.85em; }
        .fl-wrap:hover .fl-bar-1 { transform: translateY(-0.12em); transition-delay: 0.05s; opacity: 1; box-shadow: 0 0 0.35em rgba(239,68,68,0.4); }
        .fl-wrap:hover .fl-bar-2 { transform: translateY(-0.2em);  transition-delay: 0.10s; opacity: 1; box-shadow: 0 0 0.35em rgba(239,68,68,0.4); }
        .fl-wrap:hover .fl-bar-3 { transform: translateY(-0.28em); transition-delay: 0.15s; opacity: 1; box-shadow: 0 0 0.35em rgba(239,68,68,0.4); }

        /* Corner brackets */
        .fl-corner {
          position: absolute;
          width: 0.3em;
          height: 0.3em;
          transition: border-color 0.3s ease;
        }
        .fl-corner-tl { top: -0.02em; left: -0.02em; border-top: 0.07em solid rgba(255,255,255,0.15); border-left: 0.07em solid rgba(255,255,255,0.15); }
        .fl-corner-tr { top: -0.02em; right: -0.02em; border-top: 0.07em solid rgba(255,255,255,0.15); border-right: 0.07em solid rgba(255,255,255,0.15); }
        .fl-corner-bl { bottom: -0.02em; left: -0.02em; border-bottom: 0.07em solid rgba(255,255,255,0.15); border-left: 0.07em solid rgba(255,255,255,0.15); }
        .fl-corner-br { bottom: -0.02em; right: -0.02em; border-bottom: 0.07em solid rgba(255,255,255,0.15); border-right: 0.07em solid rgba(255,255,255,0.15); }
        .fl-wrap:hover .fl-corner { border-color: rgba(239, 68, 68, 0.4); }

        /* Data dots */
        .fl-dot {
          position: absolute;
          width: 0.08em;
          height: 0.08em;
          background: rgba(239, 68, 68, 0.3);
          border-radius: 50%;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .fl-wrap:hover .fl-dot {
          opacity: 1;
          transform: scale(1.8);
          background: rgba(239, 68, 68, 0.8);
        }

        /* Terminal cursor */
        .fl-cursor {
          display: inline-block;
          width: 0.1em;
          height: 0.75em;
          background: rgba(239, 68, 68, 0.4);
          margin-left: 0.06em;
          vertical-align: middle;
          animation: fl-cursor-blink 1.2s step-end infinite;
        }
        .fl-wrap:hover .fl-cursor {
          background: #ef4444;
        }
      `}</style>

      <span className="fl-wrap">
        {/* Corner brackets */}
        <span className="fl-corner fl-corner-tl" aria-hidden="true" />
        <span className="fl-corner fl-corner-tr" aria-hidden="true" />
        <span className="fl-corner fl-corner-bl" aria-hidden="true" />
        <span className="fl-corner fl-corner-br" aria-hidden="true" />

        {/* Wordmark */}
        <span className="fl-text">
          {letters.map((letter, i) => (
            <span key={i} className="fl-letter">
              {letter}
            </span>
          ))}

          {/* Glitch duplicate */}
          <span className="fl-glitch" aria-hidden="true">
            {letters.map((letter, i) => (
              <span key={i} className="fl-letter">
                {letter}
              </span>
            ))}
          </span>

          {/* Baseline with data pulse */}
          <span className="fl-baseline" aria-hidden="true" />

          {/* Scan sweep */}
          <span className="fl-scan" aria-hidden="true" />

          {/* Data dots */}
          <span className="fl-dot" style={{ top: '-0.18em', left: '0.2em' }} aria-hidden="true" />
          <span className="fl-dot" style={{ top: '-0.1em', left: '0.9em' }} aria-hidden="true" />
          <span className="fl-dot" style={{ top: '-0.22em', left: '1.8em' }} aria-hidden="true" />
          <span className="fl-dot" style={{ top: '-0.14em', left: '2.7em' }} aria-hidden="true" />
          <span className="fl-dot" style={{ top: '-0.2em', left: '3.6em' }} aria-hidden="true" />
          <span className="fl-dot" style={{ top: '-0.08em', left: '4.5em' }} aria-hidden="true" />
        </span>

        {/* Telemetry bars */}
        <span
          style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '0.06em', height: '0.9em' }}
          aria-hidden="true"
        >
          <span className="fl-bar fl-bar-1" />
          <span className="fl-bar fl-bar-2" />
          <span className="fl-bar fl-bar-3" />
        </span>

        {/* Terminal cursor */}
        <span className="fl-cursor" aria-hidden="true" />
      </span>
    </span>
  );
};

export { FastlyticsLogo };
export default FastlyticsLogo;

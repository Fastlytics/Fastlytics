import { cn } from '@/lib/utils';

interface FastlyticsLogoProps {
  size?: number;
  className?: string;
}

/**
 * FastlyticsLogo — brand mark with skewed racing bars.
 * Matches the logo used in LandingFooter and scales proportionally.
 */
const FastlyticsLogo = ({ size = 28, className }: FastlyticsLogoProps) => {
  return (
    <span
      className={cn('group inline-flex items-center select-none', className)}
      style={{ fontSize: `${size}px`, gap: '0.4em' }}
      aria-label="Fastlytics"
      role="img"
    >
      {/* Icon: two skewed bars */}
      <span
        className="relative inline-flex items-center"
        style={{ width: '1.45em', height: '1.05em' }}
      >
        <span
          className="absolute left-0 skew-x-[-24deg] bg-[#ff2a1a] transition-transform group-hover:translate-x-1"
          style={{ top: '0.13em', width: '1.2em', height: '0.4em' }}
        />
        <span
          className="absolute right-0 skew-x-[-24deg] bg-white transition-transform group-hover:-translate-x-1"
          style={{ bottom: '0.13em', width: '1.05em', height: '0.4em' }}
        />
      </span>

      {/* Wordmark */}
      <span className="race-display leading-none">
        Fast<span className="text-[#ff2a1a]">lytics</span>
      </span>
    </span>
  );
};

export { FastlyticsLogo };
export default FastlyticsLogo;

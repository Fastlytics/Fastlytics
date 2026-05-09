import { cn } from '@/lib/utils';

interface FastlyticsLogoProps {
  size?: number;
  className?: string;
  disableAnimation?: boolean;
  forceFinalState?: boolean;
  theme?: 'dark' | 'light';
  showText?: boolean;
}

/**
 * FastlyticsLogo — brand mark with skewed racing bars.
 * Matches the logo used in LandingFooter and scales proportionally.
 */
const FastlyticsLogo = ({
  size = 28,
  className,
  disableAnimation,
  forceFinalState,
  theme = 'dark',
  showText = true,
}: FastlyticsLogoProps) => {
  const isLight = theme === 'light';

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
          className={cn(
            'absolute left-0 skew-x-[-24deg] bg-[#ff2a1a]',
            !disableAnimation && 'transition-transform group-hover:translate-x-1',
            forceFinalState && 'translate-x-1'
          )}
          style={{ top: '0.13em', width: '1.2em', height: '0.4em' }}
        />
        <span
          className={cn(
            'absolute right-0 skew-x-[-24deg]',
            isLight ? 'bg-[#09090b]' : 'bg-white',
            !disableAnimation && 'transition-transform group-hover:-translate-x-1',
            forceFinalState && '-translate-x-1'
          )}
          style={{ bottom: '0.13em', width: '1.05em', height: '0.4em' }}
        />
      </span>

      {/* Wordmark */}
      {showText && (
        <span
          className={cn('race-display leading-none', isLight ? 'text-[#09090b]' : 'text-white')}
        >
          Fast<span className="text-[#ff2a1a]">lytics</span>
        </span>
      )}
    </span>
  );
};

export { FastlyticsLogo };
export default FastlyticsLogo;

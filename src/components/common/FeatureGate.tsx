import React from 'react';
import { useLocation } from 'react-router-dom';
import { LockKeyIcon } from 'hugeicons-react';

interface FeatureGateProps {
  featureName: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  shellClassName?: string;
}

/**
 * FeatureGate — full-width auth gate for unauthenticated users.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureName,
  description = 'Sign in to unlock this feature',
  children,
  className = '',
  shellClassName,
}) => {
  const location = useLocation();
  const returnTo = location.pathname + location.search;
  const authHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  const overlayCard = (
    <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0d0d10]/95 p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
      <div className="inline-flex size-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <LockKeyIcon className="size-4 text-red-400" />
      </div>

      <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-white">{featureName}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">{description}</p>
      <p className="mt-2 text-[11px] text-white/30">Free account · No credit card required</p>

      <a
        href={authHref}
        className="mt-5 inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-white/90"
      >
        Sign In to Unlock
      </a>
    </div>
  );

  if (shellClassName) {
    return (
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0c] ${shellClassName} ${className}`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        <div className="relative z-10 flex h-11 shrink-0 items-center border-b border-white/[0.06] bg-white/[0.02] px-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-white/20" />
            <span className="size-2 rounded-full bg-white/10" />
            <span className="size-2 rounded-full bg-white/10" />
          </div>
        </div>

        {children && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 scale-[1.02] blur-md opacity-12 saturate-50">
              {children}
            </div>
            <div className="absolute inset-0 bg-[#0a0a0c]/55 backdrop-blur-[1px]" />
          </div>
        )}

        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-5 sm:p-6">
          {overlayCard}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0c] ${className}`}
    >
      {children && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 scale-[1.02] blur-md opacity-12 saturate-50">
            {children}
          </div>
          <div className="absolute inset-0 bg-[#0a0a0c]/70 backdrop-blur-[1px]" />
        </div>
      )}

      <div className="relative flex w-full flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <LockKeyIcon className="size-4 text-red-400" />
          </div>

          <div className="min-w-0 text-left">
            <h2 className="text-[16px] font-semibold tracking-tight text-white">{featureName}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-white/50">{description}</p>
            <p className="mt-2 text-[11px] text-white/30">Free account · No credit card required</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center lg:self-center">
          <a
            href={authHref}
            className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-white/90"
          >
            Sign In to Unlock
          </a>
        </div>
      </div>
    </div>
  );
};

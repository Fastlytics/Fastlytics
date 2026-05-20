import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from './FeatureGate';
import { Link } from 'react-router-dom';
import { LockKeyIcon } from 'hugeicons-react';

interface GatedRouteProps {
  featureName: string;
  description?: string;
  requiredTier?: 'pro' | 'ultra';
  children: React.ReactNode;
  gateShellClassName?: string;
}

/**
 * GatedRoute - Shows FeatureGate for unauthenticated users.
 * Shows upgrade prompt for users on lower subscription tiers.
 */
export const GatedRoute = ({
  featureName,
  description,
  requiredTier,
  children,
  gateShellClassName,
}: GatedRouteProps) => {
  const { user, loading, isSubscribed } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <svg className="size-7 text-red-400" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <span className="text-xs text-white/40">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <FeatureGate
        featureName={featureName}
        description={description}
        shellClassName={gateShellClassName}
      />
    );
  }

  if (requiredTier && !isSubscribed(requiredTier)) {
    const tierLabel = requiredTier === 'ultra' ? 'Ultra' : 'Pro';

    const overlayCard = (
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0d0d10]/95 p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
        <div className="inline-flex size-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <LockKeyIcon className="size-4 text-red-400" />
        </div>

        <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-white">{featureName}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-white/50">
          Upgrade to {tierLabel} to unlock {featureName}
        </p>
        <p className="mt-2 text-[11px] text-white/30">
          Historical archive, unlimited replay, deeper analysis
        </p>

        <Link
          to="/pricing"
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-white/90"
        >
          View Plans
        </Link>
      </div>
    );

    if (gateShellClassName) {
      return (
        <div
          className={`relative flex w-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0c] ${gateShellClassName}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

          <div className="relative z-10 flex h-11 shrink-0 items-center border-b border-white/[0.06] bg-white/[0.02] px-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/10" />
              <span className="size-2 rounded-full bg-white/10" />
            </div>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-5 sm:p-6">
            {overlayCard}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0c]">
        <div className="flex w-full flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex min-w-0 items-start gap-4">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <LockKeyIcon className="size-4 text-red-400" />
            </div>

            <div className="min-w-0 text-left">
              <h2 className="text-[16px] font-semibold tracking-tight text-white">{featureName}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-white/50">
                Upgrade to {tierLabel} to unlock {featureName}
              </p>
              <p className="mt-2 text-[11px] text-white/30">
                Historical archive, unlimited replay, deeper analysis
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center lg:self-center">
            <Link
              to="/pricing"
              className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

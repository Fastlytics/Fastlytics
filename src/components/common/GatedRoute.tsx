import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from './FeatureGate';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { LockKeyIcon } from 'hugeicons-react';

interface GatedRouteProps {
  featureName: string;
  description?: string;
  requiredTier?: 'pro' | 'ultra';
  children: React.ReactNode;
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
}: GatedRouteProps) => {
  const { user, loading, isSubscribed } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <svg className="size-7 text-[#ff2a1a]" fill="none" viewBox="0 0 24 24">
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
          <span className="text-xs text-white/40 uppercase tracking-wider">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <FeatureGate featureName={featureName} description={description} />;
  }

  if (requiredTier && !isSubscribed(requiredTier)) {
    return (
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-10 md:py-14">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 text-center max-w-md mx-auto px-6 md:px-8">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center size-14 md:w-16 md:h-16 rounded-2xl bg-[#ff2a1a]/10 mb-5 md:mb-6"
          >
            <LockKeyIcon className="size-7 md:w-8 md:h-8 text-[#ff2a1a]" />
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-xl md:text-2xl uppercase font-semibold text-white mb-2 md:mb-3">
              {featureName}
            </h3>
            <p className="text-xs md:text-sm text-white/40 mb-7 md:mb-8 max-w-[280px] md:max-w-full mx-auto uppercase tracking-wider">
              Upgrade to {requiredTier === 'ultra' ? 'Ultra' : 'Pro'} to unlock {featureName}
            </p>
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-semibold text-white bg-[#ff2a1a] hover:bg-[#e02617] rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,42,26,0.25)]"
            >
              View Plans
            </Link>
          </m.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

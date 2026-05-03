import React from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LockKeyIcon } from 'hugeicons-react';

interface FeatureGateProps {
  featureName: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * FeatureGate - Shows a blurred teaser with login prompt for gated features
 *
 * Usage:
 * - For full content blur: <FeatureGate featureName="Session Replay" />
 * - For partial blur: <FeatureGate featureName="Tyre Analysis">{previewContent}</FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureName,
  description = 'Sign in to unlock this feature',
  children,
  className = '',
}) => {
  const location = useLocation();
  const returnTo = location.pathname + location.search;
  const authHref = `/auth?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-10 md:py-14 ${className}`}
    >
      {children && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 blur-md opacity-20 scale-105 transform grayscale">
            {children}
          </div>
          <div className="absolute inset-0 bg-[#0c0c0e]/70 backdrop-blur-sm" />
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
      )}

      {!children && (
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
      )}

      <div className="relative z-10 text-center max-w-md mx-auto px-6 md:px-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#ff2a1a]/10 mb-5 md:mb-6"
        >
          <LockKeyIcon className="w-7 h-7 md:w-8 md:h-8 text-[#ff2a1a]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-xl md:text-2xl uppercase font-bold text-white mb-2 md:mb-3">
            {featureName}
          </h3>
          <p className="text-xs md:text-sm text-white/40 mb-7 md:mb-8 max-w-[280px] md:max-w-full mx-auto uppercase tracking-wider">
            {description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-[#ff2a1a] hover:bg-[#e02617] text-white font-semibold h-11 md:h-12 px-6 md:px-8 text-sm md:text-base rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,42,26,0.25)]"
          >
            <a href={authHref}>Sign In to Unlock</a>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-[10px] md:text-xs text-white/30 uppercase tracking-widest"
        >
          Free Account &middot; No Credit Card Required
        </motion.p>
      </div>
    </div>
  );
};

export default FeatureGate;

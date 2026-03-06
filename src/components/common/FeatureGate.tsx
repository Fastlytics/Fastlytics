import React from 'react';
import { motion } from 'framer-motion';
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
      className={`relative flex items-center justify-center bg-black border border-white/10 py-8 md:py-12 ${className}`}
    >
      {children && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 blur-md opacity-20 scale-105 transform grayscale">
            {children}
          </div>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Cyber-brutalist grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
      )}

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600 z-20" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600 z-20" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600 z-20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600 z-20" />

      <div className="relative z-10 text-center max-w-md mx-auto p-6 md:p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-zinc-900 border-2 border-red-600 mb-4 md:mb-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)]"
        >
          <LockKeyIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-xl md:text-2xl font-black uppercase italic text-white mb-2 md:mb-3 tracking-tighter">
            {featureName} <span className="text-red-600">Locked</span>
          </h3>
          <p className="text-xs md:text-sm font-mono text-gray-400 mb-6 md:mb-8 uppercase tracking-wider max-w-[280px] md:max-w-full mx-auto">
            {description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest h-12 md:h-14 px-6 md:px-8 text-sm md:text-base border-2 border-transparent hover:border-white transition-all transform hover:-translate-y-1 hover:shadow-lg rounded-none skew-x-[-10deg]"
          >
            <a href={authHref} className="skew-x-[10deg]">
              Sign In to Unlock
            </a>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-[10px] md:text-xs text-gray-500 font-mono uppercase tracking-widest"
        >
          Free Account • No Credit Card
        </motion.p>
      </div>
    </div>
  );
};

export default FeatureGate;

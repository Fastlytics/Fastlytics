import { Link } from 'react-router-dom';
import { Cancel01Icon } from 'hugeicons-react';

interface FeatureGateCardProps {
  onClose: () => void;
}

export function FeatureGateCard({ onClose }: FeatureGateCardProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
        <div className="min-w-0 space-y-2 text-white">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-[14px]">
              ✦
            </span>
            <span className="text-[12px] font-medium uppercase tracking-wider text-violet-400/80">
              Pro Feature
            </span>
          </div>
          <h3 className="text-[24px] font-semibold leading-none text-white">
            AI Analysis Limit Reached
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-white transition-colors hover:bg-white/[0.04]"
        >
          <Cancel01Icon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="pt-8 text-white">
            <p className="text-[15px] leading-7 text-white/70">
              You've used all your monthly AI telemetry analysis credits.
            </p>
            <p className="mt-2 text-[15px] leading-7 text-white/70">
              Upgrade to <span className="font-semibold text-white">Pro</span> for{' '}
              <span className="font-semibold text-violet-400">100 analyses/month</span> and unlock
              advanced AI-powered telemetry insights.
            </p>
          </div>

          <Link
            to="/settings?section=subscription"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

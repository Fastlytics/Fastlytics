import React from 'react';
import * as Sentry from '@sentry/react';
import { m } from 'motion/react';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { GatedRoute } from '@/components/common/GatedRoute';
import { SessionReplay } from '@/components/replay/SessionReplay';

export default function ReplaySection() {
  const ctx = useRaceLayoutContext();

  // Build the replay session target
  let replaySessionTarget = ctx.analysisSession;
  if (ctx.isTestingSession) {
    if (ctx.isTestingSplitSession && ctx.testingSessionAlias) {
      replaySessionTarget = `${ctx.analysisSession}_${ctx.testingSessionAlias.toUpperCase()}`;
    } else if (ctx.effectiveTestingWindow !== 'full') {
      replaySessionTarget = `${ctx.analysisSession}_${ctx.effectiveTestingWindow.toUpperCase()}`;
    }
  }

  return (
    <GatedRoute
      featureName="Session Replay"
      description="Real-time car positions and data overlays"
    >
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <div className="relative h-[85vh] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0c]">
          <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-sm space-y-3">
                  <p className="text-[14px] font-medium text-red-400">Replay crashed</p>
                  <p className="text-[12px] text-white/80 leading-relaxed">
                    {(error as Error)?.message || 'An unexpected error occurred.'}
                  </p>
                  <button
                    onClick={resetError}
                    className="px-4 py-2 rounded-lg border border-white/[0.04] text-[12px] font-medium text-white/80 hover:text-white hover:border-white/[0.08] transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
            beforeCapture={(scope) => {
              scope.setTag('feature', 'session-replay');
              scope.setContext('replay_params', {
                year: ctx.year,
                event: ctx.eventSlug,
                session: replaySessionTarget,
              });
            }}
          >
            <React.Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
                    <span className="text-[12px] text-white/80">Loading replay</span>
                  </div>
                </div>
              }
            >
              <SessionReplay
                year={ctx.year}
                event={ctx.eventSlug}
                session={replaySessionTarget}
                className="h-full"
              />
            </React.Suspense>
          </Sentry.ErrorBoundary>
        </div>
      </m.div>
    </GatedRoute>
  );
}

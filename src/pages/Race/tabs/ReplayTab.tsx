import React from 'react';
import * as Sentry from '@sentry/react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { SessionReplay } from '@/components/replay/SessionReplay';

interface ReplayTabProps {
  year: number;
  eventSlug: string;
  analysisSession: string;
  isTestingSession: boolean;
  isTestingSplitSession: boolean;
  testingSessionAlias?: { window: string } | null;
  effectiveTestingWindow: string;
}

const ReplayErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center max-w-sm space-y-3">
      <div className="text-[13px] font-medium text-red-400">Replay crashed</div>
      <p className="text-[11px] text-white/50 leading-relaxed">
        {error.message || 'An unexpected error occurred while loading the session replay.'}
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[12px] font-medium text-white hover:bg-white/[0.1] transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

export const ReplayTab: React.FC<ReplayTabProps> = ({
  year,
  eventSlug,
  analysisSession,
  isTestingSession,
  isTestingSplitSession,
  testingSessionAlias,
  effectiveTestingWindow,
}) => {
  let replaySessionTarget = analysisSession;
  if (isTestingSession) {
    if (isTestingSplitSession && testingSessionAlias) {
      replaySessionTarget = `${analysisSession}_${testingSessionAlias.window.toUpperCase()}`;
    } else if (effectiveTestingWindow !== 'full') {
      replaySessionTarget = `${analysisSession}_${effectiveTestingWindow.toUpperCase()}`;
    }
  }

  return (
    <GatedRoute
      featureName="Session Replay"
      description="Experience immersive race telemetry with real-time car positions and data overlays"
    >
      <div className="space-y-6">
        <div className="relative h-[80vh] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
          <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
              <ReplayErrorFallback error={error as Error} resetError={resetError} />
            )}
            beforeCapture={(scope) => {
              scope.setTag('feature', 'session-replay');
              scope.setContext('replay_params', {
                year,
                event: eventSlug,
                session: replaySessionTarget,
              });
            }}
          >
            <React.Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
                    <div className="text-[11px] text-white/30">Loading replay…</div>
                  </div>
                </div>
              }
            >
              <SessionReplay
                year={year}
                event={eventSlug}
                session={replaySessionTarget}
                className="h-full"
              />
            </React.Suspense>
          </Sentry.ErrorBoundary>
        </div>
      </div>
    </GatedRoute>
  );
};

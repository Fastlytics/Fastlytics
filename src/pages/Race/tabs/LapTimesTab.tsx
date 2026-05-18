import React from 'react';
import { m } from 'motion/react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { RacingChart } from '@/components/charts/RacingChart';
import { PaceAnalysisChart } from '@/components/charts/PaceAnalysisChart';
import { GapToLeaderChart } from '@/components/charts/GapToLeaderChart';
import { DetailedRaceResult } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER } from '@/lib/card-styles';

interface LapTimesTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
  sessionResults?: DetailedRaceResult[];
  favoriteDriver?: string | null;
  lapAnalysisMode: 'history' | 'pace' | 'gap';
  setLapAnalysisMode: (mode: 'history' | 'pace' | 'gap') => void;
}

export const LapTimesTab: React.FC<LapTimesTabProps> = ({
  year,
  eventName,
  analysisSession,
  sessionResults,
  favoriteDriver,
  lapAnalysisMode,
  setLapAnalysisMode,
}) => {
  const { trackInteraction } = useAnalytics();

  const getRivalDriverCode = () => {
    let rivalDriverCode: string | null = null;
    if (favoriteDriver && sessionResults) {
      const favResult = sessionResults.find(
        (r) =>
          r.driverCode === favoriteDriver ||
          r.fullName.toLowerCase().includes(favoriteDriver.toLowerCase())
      );
      if (favResult && favResult.position) {
        const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
        const rivalResult = sessionResults.find((r) => r.position === rivalPos);
        if (rivalResult) rivalDriverCode = rivalResult.driverCode;
      }
    }
    return rivalDriverCode;
  };

  const rivalDriverCode = getRivalDriverCode();

  const modes = [
    { key: 'history', label: 'Lap History' },
    { key: 'pace', label: 'Pace Distribution' },
    { key: 'gap', label: 'Gap to Leader' },
  ] as const;

  return (
    <GatedRoute
      featureName="Lap Times Analysis"
      description="Detailed lap-by-lap timing data with pace distribution analysis and comparison charts"
    >
      <m.section
        id="laptimes"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="animate-in fade-in duration-200"
      >
        <div className={CARD_CONTAINER}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5">
            <h2 className="text-[15px] font-medium uppercase tracking-wider text-white">
              Lap Times
            </h2>

            {/* Mode toggle */}
            <div className="flex items-center gap-0.5 rounded-md border border-white/[0.06] p-0.5">
              {modes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => {
                    setLapAnalysisMode(mode.key);
                    trackInteraction('desktop_analysis_tab_changed', { tab: mode.key });
                  }}
                  className={cn(
                    'rounded px-2.5 py-1 text-[15px] font-medium uppercase tracking-wider transition-colors',
                    lapAnalysisMode === mode.key
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white hover:text-white'
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {lapAnalysisMode === 'history' && (
              <RacingChart
                year={year}
                event={eventName}
                session={analysisSession}
                title="Lap Time Comparison"
                autoLoad={true}
                favoriteDriver={favoriteDriver || undefined}
                rivalDriver={rivalDriverCode || undefined}
              />
            )}

            {lapAnalysisMode === 'pace' && (
              <PaceAnalysisChart
                year={year}
                event={eventName}
                session={analysisSession}
                initialDrivers={
                  favoriteDriver
                    ? ([favoriteDriver, rivalDriverCode].filter(Boolean) as string[])
                    : []
                }
              />
            )}

            {lapAnalysisMode === 'gap' && (
              <GapToLeaderChart
                year={year}
                event={eventName}
                session={analysisSession}
                autoLoad={true}
                favoriteDriver={favoriteDriver || undefined}
                rivalDriver={rivalDriverCode || undefined}
              />
            )}
          </div>
        </div>
      </m.section>
    </GatedRoute>
  );
};

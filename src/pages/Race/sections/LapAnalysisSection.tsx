import { useSearchParams } from 'react-router-dom';
import { m } from 'motion/react';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { GatedRoute } from '@/components/common/GatedRoute';
import PositionsTabContent from '@/components/race/PositionsTabContent';
import { RacingChart } from '@/components/charts/RacingChart';
import { PaceAnalysisChart } from '@/components/charts/PaceAnalysisChart';
import { GapToLeaderChart } from '@/components/charts/GapToLeaderChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

type LapAnalysisMode = 'positions' | 'history' | 'pace' | 'gap';

const VALID_MODES: LapAnalysisMode[] = ['positions', 'history', 'pace', 'gap'];

const MODE_DESCRIPTIONS: Record<LapAnalysisMode, string> = {
  positions: 'Track how drivers move through the field lap by lap',
  history: 'Compare lap time progression across drivers',
  pace: 'Visualize pace distribution and consistency',
  gap: 'Measure time gaps relative to the race leader',
};

export default function LapAnalysisSection() {
  const ctx = useRaceLayoutContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackInteraction } = useAnalytics();
  const isHistoricalSeason = ctx.year < getCurrentSeasonYear();

  const isRaceOrSprint = ctx.selectedSession === 'R' || ctx.selectedSession === 'Sprint';

  const rawView = searchParams.get('view') as LapAnalysisMode | null;
  let activeMode: LapAnalysisMode;

  if (rawView && VALID_MODES.includes(rawView)) {
    if (rawView === 'positions' && !isRaceOrSprint) {
      activeMode = 'history';
    } else {
      activeMode = rawView;
    }
  } else {
    activeMode = isRaceOrSprint ? 'positions' : 'history';
  }

  const handleModeChange = (mode: LapAnalysisMode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', mode);
        return next;
      },
      { replace: true }
    );
    trackInteraction('lap_analysis_mode_changed', { mode });
  };

  const favoriteDriver = ctx.profile?.favorite_driver;
  let rivalDriverCode: string | null = null;
  if (favoriteDriver && ctx.sessionResults) {
    const favResult = ctx.sessionResults.find(
      (r) =>
        r.driverCode === favoriteDriver ||
        r.fullName.toLowerCase().includes(favoriteDriver.toLowerCase())
    );
    if (favResult && favResult.position) {
      const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
      const rivalResult = ctx.sessionResults.find((r) => r.position === rivalPos);
      if (rivalResult) rivalDriverCode = rivalResult.driverCode;
    }
  }

  const modes: { value: LapAnalysisMode; label: string; raceOnly?: boolean }[] = [
    { value: 'positions', label: 'Positions', raceOnly: true },
    { value: 'history', label: 'Lap History' },
    { value: 'pace', label: 'Pace Distribution' },
    { value: 'gap', label: 'Gap to Leader' },
  ];

  return (
    <GatedRoute
      featureName="Lap Analysis"
      description="Position tracking, lap time history, pace distribution, and gap analysis"
      requiredTier={isHistoricalSeason ? 'pro' : undefined}
      gateShellClassName="min-h-[640px]"
    >
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={CARD_CONTAINER}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h3 className="text-[16px] font-semibold text-white">Lap Analysis</h3>
            <p className="mt-0.5 text-[12px] text-white/80">{MODE_DESCRIPTIONS[activeMode]}</p>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 px-5 pt-0 pb-2">
          {modes
            .filter((m) => !m.raceOnly || isRaceOrSprint)
            .map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                  activeMode === mode.value
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/80 hover:text-white'
                )}
              >
                {mode.label}
              </button>
            ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-2">
          {activeMode === 'positions' && isRaceOrSprint && (
            <PositionsTabContent
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              favoriteDriver={favoriteDriver}
              embedded
            />
          )}

          {activeMode === 'history' && (
            <RacingChart
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              title="Lap Time Comparison"
              autoLoad={true}
              favoriteDriver={favoriteDriver || undefined}
              rivalDriver={rivalDriverCode || undefined}
            />
          )}

          {activeMode === 'pace' && (
            <PaceAnalysisChart
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              initialDrivers={
                favoriteDriver
                  ? ([favoriteDriver, rivalDriverCode].filter(Boolean) as string[])
                  : []
              }
            />
          )}

          {activeMode === 'gap' && (
            <GapToLeaderChart
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              autoLoad={true}
              favoriteDriver={favoriteDriver || undefined}
              rivalDriver={rivalDriverCode || undefined}
            />
          )}
        </div>
      </m.div>
    </GatedRoute>
  );
}

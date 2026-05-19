import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { F1Card } from '@/components/race/F1Card';
import { TestingDashboard } from '@/pages/Race/TestingDashboard';
import { SessionResultsTable } from '@/pages/Race/SessionResultsTable';
import { Alert02Icon, Clock01Icon, TradeUpIcon } from 'hugeicons-react';
import { ChampionIcon, FlashIcon } from 'hugeicons-react';

import { getTeamColorClass } from '@/lib/teamColors';
import { getDriverImage } from '@/utils/imageMapping';
import { formatRaceSessionTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { DetailedRaceResult, AvailableSession } from '@/lib/api';

interface TestingInsights {
  fastest: DetailedRaceResult | null;
  mileage: DetailedRaceResult | null;
  totalLaps: number;
  totalDistance: number;
  averageLaps: number;
  circuitLength: number;
}

interface OverviewTabProps {
  year: number;
  eventName: string;
  availableSessions: AvailableSession[];
  selectedSession: string;
  isTestingSession: boolean;
  isTestingSplitSession: boolean;
  testingWindow: string;
  setTestingWindow: (window: string) => void;
  testingInsights: TestingInsights;
  getSessionWindowLapTime: (res: DetailedRaceResult) => string | undefined;
  getSessionWindowLaps: (res: DetailedRaceResult) => number;
  raceWinner?: DetailedRaceResult | null;
  poleSitter?: DetailedRaceResult | null;
  fastestLapHolder?: DetailedRaceResult | null;
  topPerformers: DetailedRaceResult[];
  sessionResults?: DetailedRaceResult[];
  effectiveSessionResults?: DetailedRaceResult[];
  profile?: { favorite_driver?: string | null } | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  year,
  eventName,
  availableSessions,
  selectedSession,
  isTestingSession,
  isTestingSplitSession,
  testingWindow,
  setTestingWindow,
  testingInsights,
  getSessionWindowLapTime,
  getSessionWindowLaps,
  raceWinner,
  poleSitter,
  fastestLapHolder,
  topPerformers,
  sessionResults,
  effectiveSessionResults,
  profile,
}) => {
  const { trackInteraction } = useAnalytics();

  return (
    <div className="space-y-10">
      <section id="overview">
        <SectionHeader
          title={`${availableSessions.find((s) => s.type === selectedSession)?.name || 'Race'} Overview`}
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {selectedSession === 'R' || selectedSession === 'Sprint' ? (
            <>
              {raceWinner && (
                <F1Card
                  title="WINNER"
                  value={raceWinner.fullName}
                  subValue={formatRaceSessionTime(raceWinner.time, true)}
                  team={getTeamColorClass(raceWinner.team)}
                  icon={<ChampionIcon />}
                  imageUrl={getDriverImage(raceWinner.driverCode, year)}
                />
              )}
              {poleSitter && (
                <F1Card
                  title="POLE POSITION"
                  value={poleSitter.fullName}
                  subValue={poleSitter.poleLapTimeValue}
                  team={getTeamColorClass(poleSitter.team)}
                  icon={<FlashIcon />}
                  imageUrl={getDriverImage(poleSitter.driverCode, year)}
                />
              )}
              {fastestLapHolder && (
                <F1Card
                  title="FASTEST LAP"
                  value={fastestLapHolder.fullName}
                  subValue={fastestLapHolder.driverFastestLapTime}
                  team={getTeamColorClass(fastestLapHolder.team)}
                  icon={<Clock01Icon />}
                  imageUrl={getDriverImage(fastestLapHolder.driverCode, year)}
                />
              )}
            </>
          ) : isTestingSession ? (
            <TestingDashboard
              testingInsights={testingInsights}
              getSessionWindowLapTime={getSessionWindowLapTime}
              getSessionWindowLaps={getSessionWindowLaps}
              year={year}
            />
          ) : (
            topPerformers.map((p, i) => (
              <F1Card
                key={p.driverCode}
                title={`P${i + 1}`}
                value={p.fullName}
                subValue={p.fastestLapTimeValue ?? p.fastestLapTime ?? ''}
                team={getTeamColorClass(p.team)}
                icon={i === 0 ? <ChampionIcon /> : <TradeUpIcon />}
                imageUrl={getDriverImage(p.driverCode, year)}
              />
            ))
          )}
        </div>
      </section>

      <section id="results">
        <SectionHeader title="Session Results" />

        {isTestingSession && !isTestingSplitSession && selectedSession !== 'Summary' && (
          <div className="mb-5 flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 w-fit">
            {(
              [
                ['full', 'Full Day'],
                ['morning', 'Morning'],
                ['afternoon', 'Afternoon'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setTestingWindow(value);
                  trackInteraction('testing_window_toggled', { window: value });
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  testingWindow === value
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Provisional Results Banner */}
        {sessionResults && sessionResults.some((r) => r.isProvisional) && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-5 py-4">
            <Alert02Icon className="size-4 shrink-0 text-amber-400" />
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-amber-400">
                Provisional Results
              </div>
              <div className="text-[13px] text-amber-400/60">
                Official results are still being processed. Positions shown are provisional.
              </div>
            </div>
          </div>
        )}

        {isTestingSession && selectedSession !== 'Summary' && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4">
            <Alert02Icon className="size-4 shrink-0 text-blue-400" />
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-blue-400">
                Testing Focus
              </div>
              <div className="text-[13px] text-blue-400/60">
                Sorted by fastest lap. Mileage and reliability columns highlight long-run
                robustness.
              </div>
            </div>
          </div>
        )}

        {isTestingSession && selectedSession === 'Summary' && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4">
            <Alert02Icon className="size-4 shrink-0 text-blue-400" />
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-blue-400">
                3-Day Testing Summary
              </div>
              <div className="text-[13px] text-blue-400/60">
                Aggregated data from all pre-season testing sessions.
              </div>
            </div>
          </div>
        )}

        {effectiveSessionResults && (
          <SessionResultsTable
            results={effectiveSessionResults}
            sessionType={selectedSession}
            favoriteDriver={profile?.favorite_driver}
            fastestLapHolder={fastestLapHolder}
            isTestingSession={isTestingSession}
            isTestingSplitSession={isTestingSplitSession}
            testingWindow={testingWindow}
            eventName={eventName}
          />
        )}
      </section>
    </div>
  );
};

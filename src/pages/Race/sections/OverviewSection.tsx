import { useMemo } from 'react';
import { m } from 'motion/react';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { F1Card } from '@/components/race/F1Card';
import { TestingDashboard } from '@/pages/Race/TestingDashboard';
import { getTeamColorClass } from '@/lib/teamColors';
import { getDriverImage } from '@/utils/imageMapping';
import { formatRaceSessionTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { DetailedRaceResult } from '@/lib/api';

/* ─── Results Table (redesigned — Inter only, no mono, no grey) ─── */
function ResultsTable({
  results,
  isRaceOrSprint,
  selectedSession,
  isTestingSession,
  favoriteDriver,
  fastestLapHolder,
  year,
}: {
  results: DetailedRaceResult[];
  isRaceOrSprint: boolean;
  selectedSession: string;
  isTestingSession: boolean;
  favoriteDriver?: string | null;
  fastestLapHolder: DetailedRaceResult | null;
  year: number;
}) {
  const isQualifying = selectedSession.startsWith('Q') || selectedSession.startsWith('SQ');

  // Find the overall fastest lap time in the field
  const overallFastestLapTime = useMemo(() => {
    if (!isRaceOrSprint) return null;
    const fastest: string | null = null;
    const fastestParsed = Infinity;
    for (const r of results) {
      if (r.driverFastestLapTime) {
        const parsed = parseFloat(r.driverFastestLapTime.replace(/[^0-9.]/g, '')) || Infinity;
        // Simple comparison — the fastestLapHolder from context is more reliable
        if (fastestLapHolder?.driverCode === r.driverCode) {
          return r.driverFastestLapTime;
        }
      }
    }
    return fastestLapHolder?.driverFastestLapTime ?? null;
  }, [results, isRaceOrSprint, fastestLapHolder]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.04]">
            <th className="px-4 py-3 text-[12px] font-medium text-white/80">Pos</th>
            <th className="px-4 py-3 text-[12px] font-medium text-white/80">Driver</th>
            <th className="px-4 py-3 text-[12px] font-medium text-white/80">Team</th>
            {isRaceOrSprint ? (
              <>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Grid</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Time / Gap</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Fastest Lap</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Pits</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Laps</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Pts</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Status</th>
              </>
            ) : isQualifying ? (
              <>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Best Lap</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">S1</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">S2</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">S3</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Laps</th>
              </>
            ) : (
              <>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Best Lap</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">S1</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">S2</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">S3</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Laps</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Gap</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const isFav =
              favoriteDriver &&
              (r.driverCode === favoriteDriver ||
                r.fullName.toLowerCase().includes(favoriteDriver.toLowerCase()));
            const isFastestLap = fastestLapHolder?.driverCode === r.driverCode;
            const teamColor = getTeamColorClass(r.team);
            const isWinner = r.position === 1;
            const isRetired = [
              'Retired',
              'DNF',
              'DNS',
              'Disqualified',
              'DSQ',
              'EXC',
              'Withdrew',
            ].includes(r.status);
            const laps = r.lapsCompleted ?? r.laps ?? null;
            const headshotUrl = getDriverImage(r.driverCode, year) || r.headshotUrl || '';

            // Format time
            let timeDisplay = '—';
            if (isRaceOrSprint) {
              if (isWinner && r.time) {
                timeDisplay = formatRaceSessionTime(r.time, true);
              } else if (r.time) {
                timeDisplay = formatRaceSessionTime(r.time, false);
              } else if (isRetired) {
                timeDisplay = '—';
              }
            }

            // Status: anything that isn't "Finished" shows
            let statusDisplay = '';
            if (isRaceOrSprint && r.status && r.status !== 'Finished') {
              statusDisplay = r.status;
            }

            // Grid delta
            const gridPos = r.gridPosition ?? null;
            const finalPos = r.position ?? i + 1;
            const gridDelta = gridPos != null ? gridPos - finalPos : null;

            // Gap to leader for practice
            let gapDisplay = '—';
            if (!isRaceOrSprint && !isQualifying && i > 0) {
              const leaderTime = results[0]?.fastestLapTime;
              if (leaderTime && r.fastestLapTime) {
                // Simple string display — the API may provide this
                gapDisplay =
                  r.fastestLapTime !== leaderTime
                    ? `+${(parseFloat(r.fastestLapTime?.replace(/[^0-9.]/g, '') || '0') - parseFloat(leaderTime?.replace(/[^0-9.]/g, '') || '0')).toFixed(3)}`
                    : '—';
              }
            }

            return (
              <tr
                key={r.driverCode}
                className={cn(
                  'border-b border-white/[0.02] transition-colors hover:bg-white/[0.02]',
                  isFav && 'bg-white/[0.03]'
                )}
              >
                <td className="px-4 py-3 text-[13px] font-medium text-white">
                  {r.position ?? i + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* Driver headshot */}
                    {headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt=""
                        className="size-7 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                      />
                    ) : (
                      <div className="size-7 shrink-0 rounded-full border border-white/[0.06] bg-white/[0.03]" />
                    )}
                    <span
                      aria-hidden="true"
                      className={cn('h-5 w-0.5 shrink-0 rounded-full', `bg-f1-${teamColor}`)}
                    />
                    <span className="text-[13px] font-medium text-white">{r.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-white/80">{r.team}</td>
                {isRaceOrSprint ? (
                  <>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {gridPos != null ? (
                        <span className="flex items-center gap-1.5">
                          <span>{gridPos}</span>
                          {gridDelta != null && gridDelta !== 0 && (
                            <span
                              className={cn(
                                'text-[11px]',
                                gridDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                              )}
                            >
                              {gridDelta > 0 ? `+${gridDelta}` : gridDelta}
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white">{timeDisplay}</td>
                    <td
                      className={cn(
                        'px-4 py-3 text-[13px]',
                        isFastestLap ? 'text-purple-400 font-semibold' : 'text-white/80'
                      )}
                    >
                      {r.driverFastestLapTime ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.totalStints != null ? r.totalStints : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">{laps ?? '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.points != null && r.points > 0 ? r.points : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">{statusDisplay}</td>
                  </>
                ) : isQualifying ? (
                  <>
                    <td className="px-4 py-3 text-[13px] text-white">
                      {r.fastestLapTimeValue ?? r.fastestLapTime ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.fastestLapSector1 ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.fastestLapSector2 ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.fastestLapSector3 ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">{laps ?? '—'}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-[13px] text-white">
                      {r.fastestLapTimeValue ?? r.fastestLapTime ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.fastestLapSector1 ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.fastestLapSector2 ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {r.fastestLapSector3 ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/80">{laps ?? '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-white/80">
                      {i === 0 ? 'Leader' : gapDisplay}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main Section ─── */
export default function OverviewSection() {
  const ctx = useRaceLayoutContext();
  const { trackInteraction } = useAnalytics();

  const {
    year,
    eventName,
    selectedSession,
    availableSessions,
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
    effectiveSessionResults,
    profile,
  } = ctx;

  const sessionName = useMemo(
    () => availableSessions.find((s) => s.type === selectedSession)?.name || selectedSession,
    [availableSessions, selectedSession]
  );

  const isRaceOrSprint = selectedSession === 'R' || selectedSession === 'Sprint';

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* 3-card highlight grid — Race/Sprint */}
      {isRaceOrSprint && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {raceWinner && (
            <F1Card
              title="Winner"
              value={raceWinner.fullName}
              subValue={formatRaceSessionTime(raceWinner.time, true)}
              team={getTeamColorClass(raceWinner.team)}
              imageUrl={getDriverImage(raceWinner.driverCode, year)}
            />
          )}
          {poleSitter && (
            <F1Card
              title="Pole Position"
              value={poleSitter.fullName}
              subValue={poleSitter.poleLapTimeValue}
              team={getTeamColorClass(poleSitter.team)}
              imageUrl={getDriverImage(poleSitter.driverCode, year)}
            />
          )}
          {fastestLapHolder && (
            <F1Card
              title="Fastest Lap"
              value={fastestLapHolder.fullName}
              subValue={fastestLapHolder.driverFastestLapTime}
              team={getTeamColorClass(fastestLapHolder.team)}
              imageUrl={getDriverImage(fastestLapHolder.driverCode, year)}
            />
          )}
        </div>
      )}

      {/* 3-card highlight grid — Qualifying / Practice (top 3) */}
      {!isRaceOrSprint && !isTestingSession && topPerformers.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {topPerformers.map((p, i) => (
            <F1Card
              key={p.driverCode}
              title={`P${i + 1}`}
              value={p.fullName}
              subValue={p.fastestLapTimeValue ?? p.fastestLapTime}
              team={getTeamColorClass(p.team)}
              imageUrl={getDriverImage(p.driverCode, year)}
            />
          ))}
        </div>
      )}

      {/* Testing dashboard */}
      {isTestingSession && (
        <TestingDashboard
          testingInsights={testingInsights}
          getSessionWindowLapTime={getSessionWindowLapTime}
          getSessionWindowLaps={getSessionWindowLaps}
          year={year}
        />
      )}

      {/* Testing window toggle */}
      {isTestingSession && !isTestingSplitSession && selectedSession !== 'Summary' && (
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.04] p-1 w-fit">
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
                'rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
                testingWindow === value
                  ? 'bg-white/[0.06] text-white'
                  : 'text-white/60 hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Full classification — redesigned table */}
      {effectiveSessionResults && effectiveSessionResults.length > 0 && (
        <div className={CARD_CONTAINER}>
          <div className="px-5 pt-5 pb-3">
            <span className={CARD_LABEL}>Full classification</span>
          </div>
          <div className="border-t border-white/[0.04]">
            <ResultsTable
              results={effectiveSessionResults}
              isRaceOrSprint={isRaceOrSprint}
              selectedSession={selectedSession}
              isTestingSession={isTestingSession}
              favoriteDriver={profile?.favorite_driver}
              fastestLapHolder={fastestLapHolder}
              year={year}
            />
          </div>
        </div>
      )}
    </m.div>
  );
}

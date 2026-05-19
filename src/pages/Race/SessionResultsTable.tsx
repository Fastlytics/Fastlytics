import React, { useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock01Icon } from 'hugeicons-react';
import { getTeamColorClass } from '@/lib/teamColors';
import { getDriverImage } from '@/utils/imageMapping';
import { DetailedRaceResult, calculateDistance, formatDistance, getCircuitLength } from '@/lib/api';
import { formatRaceSessionTime } from '@/utils/formatters';
import { parseRaceLapTime as parseLapTime } from '@/pages/Race/race-utils';
import { cn } from '@/lib/utils';
export const SessionResultsTable: React.FC<{
  results: DetailedRaceResult[];
  sessionType: string;
  favoriteDriver?: string | null;
  fastestLapHolder?: DetailedRaceResult | null;
  isTestingSession?: boolean;
  isTestingSplitSession?: boolean;
  testingWindow?: 'full' | 'morning' | 'afternoon';
  eventName?: string;
}> = ({
  results,
  sessionType,
  favoriteDriver,
  fastestLapHolder,
  isTestingSession = false,
  isTestingSplitSession = false,
  testingWindow = 'full',
  eventName,
}) => {
  const isPractice = sessionType.startsWith('FP') || isTestingSession;
  const isQualifying = sessionType.startsWith('Q') || sessionType.startsWith('SQ');
  const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';

  const getPracticeLapTime = useCallback(
    (result: DetailedRaceResult): string | null | undefined => {
      if (!isTestingSession || isTestingSplitSession) return result.fastestLapTime;
      if (testingWindow === 'morning') return result.morningFastestLapTime ?? result.fastestLapTime;
      if (testingWindow === 'afternoon') {
        return result.afternoonFastestLapTime ?? result.fastestLapTime;
      }
      return result.fastestLapTime;
    },
    [isTestingSession, isTestingSplitSession, testingWindow]
  );

  const getPracticeLaps = useCallback(
    (result: DetailedRaceResult): number => {
      if (!isTestingSession || isTestingSplitSession) return result.lapsCompleted ?? 0;
      if (testingWindow === 'morning')
        return result.morningLapsCompleted ?? result.lapsCompleted ?? 0;
      if (testingWindow === 'afternoon') {
        return result.afternoonLapsCompleted ?? result.lapsCompleted ?? 0;
      }
      return result.lapsCompleted ?? 0;
    },
    [isTestingSession, isTestingSplitSession, testingWindow]
  );

  const sortedResults = useMemo(() => {
    if ((isPractice || isQualifying) && results) {
      return results.toSorted((a, b) => {
        const lapDelta = parseLapTime(getPracticeLapTime(a)) - parseLapTime(getPracticeLapTime(b));
        if (lapDelta !== 0) return lapDelta;
        return getPracticeLaps(b) - getPracticeLaps(a);
      });
    }
    return results;
  }, [results, isPractice, isQualifying, getPracticeLapTime, getPracticeLaps]);

  const leaderLaps = useMemo(
    () => sortedResults.reduce((max, res) => Math.max(max, getPracticeLaps(res)), 0),
    [sortedResults, getPracticeLaps]
  );

  // Calculate circuit length for distance conversion (for testing sessions)
  const circuitLength = useMemo(() => getCircuitLength(eventName), [eventName]);

  // Calculate leader distance in km
  const leaderDistance = useMemo(
    () => calculateDistance(leaderLaps, circuitLength),
    [leaderLaps, circuitLength]
  );

  const columns: {
    key:
      | keyof DetailedRaceResult
      | 'driver'
      | 'team'
      | 'displayPosition'
      | 'mileage'
      | 'reliability';
    label: string;
    className?: string;
  }[] = [
    {
      key: 'displayPosition',
      label: 'POS',
      className: 'w-[60px] text-center font-mono font-black text-zinc-400',
    },
    { key: 'driver', label: 'DRIVER' },
    { key: 'team', label: 'TEAM' },
  ];

  if (isRaceOrSprint) {
    columns.push({ key: 'time', label: 'TIME/GAP', className: 'text-right font-mono' });
    columns.push({
      key: 'driverFastestLapTime',
      label: 'FASTEST LAP',
      className: 'text-right font-mono',
    });
    columns.push({ key: 'laps', label: 'LAPS', className: 'text-center font-mono' });
    columns.push({ key: 'points', label: 'PTS', className: 'text-right font-black text-red-500' });
  } else if (isQualifying) {
    columns.push({
      key: 'fastestLapTime',
      label: 'FASTEST LAP',
      className: 'text-right font-mono',
    });
  } else if (isPractice) {
    columns.push({
      key: 'fastestLapTime',
      label: 'FASTEST LAP',
      className: 'text-right font-mono',
    });
    columns.push({ key: 'lapsCompleted', label: 'LAPS', className: 'text-center font-mono' });
    if (isTestingSession) {
      columns.push({ key: 'mileage', label: 'MILEAGE', className: 'text-right font-mono' });
      columns.push({
        key: 'reliability',
        label: 'RELIABILITY',
        className: 'text-right font-mono',
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  'text-[12px] font-medium uppercase tracking-wider text-white/35 py-4',
                  col.className
                )}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResults?.map((res, index) => {
            const isFavorite =
              favoriteDriver &&
              (res.driverCode === favoriteDriver ||
                res.fullName.toLowerCase().includes(favoriteDriver.toLowerCase()));
            return (
              <TableRow
                key={res.driverCode}
                className={cn(
                  'border-b border-white/[0.04] transition-colors group last:border-b-0',
                  isFavorite ? 'bg-red-500/[0.05] hover:bg-red-500/[0.08]' : 'hover:bg-white/[0.02]'
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${res.driverCode}-${String(col.key)}`}
                    className={cn('py-4', col.className)}
                  >
                    {col.key === 'displayPosition' ? (
                      isPractice || isQualifying ? (
                        <span className="text-[15px] font-bold text-white/40">{index + 1}</span>
                      ) : (
                        <span className="text-[15px] font-bold text-white/40">
                          {res.position ?? '-'}
                        </span>
                      )
                    ) : col.key === 'driver' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-semibold text-white group-hover:text-red-400 transition-colors">
                          {res.fullName}
                        </span>
                        {((fastestLapHolder && res.driverCode === fastestLapHolder.driverCode) ||
                          (!fastestLapHolder && res.isFastestLap)) && (
                          <Clock01Icon className="size-3 text-purple-500" />
                        )}
                      </div>
                    ) : col.key === 'team' ? (
                      <span className="flex items-center gap-2 text-[13px] text-white/45">
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            `bg-f1-${getTeamColorClass(res.team)}`
                          )}
                        />
                        {res.team}
                      </span>
                    ) : col.key === 'points' ? (
                      <span
                        className={cn(
                          'flex items-center justify-end gap-2 font-bold',
                          res.isProvisional ? 'text-amber-400' : 'text-red-400'
                        )}
                      >
                        {res.points !== null ? res.points : '-'}
                        {res.isProvisional && (
                          <span className="text-[10px] uppercase tracking-tighter rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
                            Prov
                          </span>
                        )}
                      </span>
                    ) : col.key === 'time' ? (
                      <span className="text-white/60">
                        {(() => {
                          const isLapped = res.status.includes('Lap');
                          const isFinished =
                            res.status === 'Finished' || res.status.startsWith('+') || isLapped;

                          if (isFinished) {
                            if (res.time)
                              return formatRaceSessionTime(res.time, res.position === 1);
                            if (isLapped) return res.status;
                            return '-';
                          }
                          return (
                            <span className="text-red-400 font-semibold uppercase text-[10px]">
                              {res.status}
                            </span>
                          );
                        })()}
                      </span>
                    ) : col.key === 'laps' ? (
                      <span className="text-white/35">{res.laps ?? '-'}</span>
                    ) : col.key === 'fastestLapTime' && isPractice ? (
                      <span className="text-white/60">{getPracticeLapTime(res) ?? '-'}</span>
                    ) : col.key === 'lapsCompleted' && isPractice ? (
                      <span className="text-white/35">{getPracticeLaps(res) || '-'}</span>
                    ) : col.key === 'mileage' ? (
                      <span className="text-white/60">
                        {(() => {
                          const laps = getPracticeLaps(res);
                          const distance = calculateDistance(laps, circuitLength);
                          const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                          return `${formatDistance(distance)} (${pct}%)`;
                        })()}
                      </span>
                    ) : col.key === 'reliability' ? (
                      <span
                        className={cn(
                          'font-semibold',
                          (() => {
                            const laps = getPracticeLaps(res);
                            const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                            if (pct >= 90) return 'text-emerald-400';
                            if (pct >= 75) return 'text-amber-400';
                            return 'text-red-400';
                          })()
                        )}
                      >
                        {(() => {
                          const laps = getPracticeLaps(res);
                          const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                          if (pct >= 90) return 'HIGH';
                          if (pct >= 75) return 'MEDIUM';
                          return 'LOW';
                        })()}
                      </span>
                    ) : col.key === 'driverFastestLapTime' ? (
                      res.driverFastestLapTime ? (
                        <span
                          className={cn(
                            (fastestLapHolder && res.driverCode === fastestLapHolder.driverCode) ||
                              (!fastestLapHolder && res.isFastestLap)
                              ? 'text-purple-400 font-bold'
                              : 'text-white/40'
                          )}
                        >
                          {res.driverFastestLapTime}
                        </span>
                      ) : (
                        '-'
                      )
                    ) : (
                      (res[col.key as keyof DetailedRaceResult] ?? '-')
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

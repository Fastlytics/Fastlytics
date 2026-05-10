// knip-ignore
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailedRaceResult } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ArrowDown01Icon, ArrowUp01Icon, MinusSignIcon } from 'hugeicons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/teamColors';

const rookiesByYear: { [year: string]: string[] } = {
  '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW', 'COL'],
  '2024': ['BEA', 'COL'],
  '2023': ['PIA', 'SAR', 'DEV'],
  '2022': ['ZHO'],
  '2021': ['MSC', 'MAZ', 'TSU'],
  '2020': ['LAT'],
  '2019': ['NOR', 'RUS', 'ALB'],
};

const isRookie = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

const formatRaceTime = (timeStr: string | null | undefined, isWinner: boolean = false): string => {
  if (!timeStr) return '-';

  if (isWinner) {
    try {
      const parts = timeStr.split(/[:.]/);
      if (parts.length === 3) {
        const totalMinutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const milliseconds = parts[2];
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
      }
    } catch (e) {
      return timeStr;
    }
    return timeStr;
  }

  if (timeStr.match(/^[A-Za-z]/)) return timeStr;

  const processedTime = timeStr.startsWith('+') ? timeStr.substring(1) : timeStr;
  try {
    const parts = processedTime.split(/[:.]/);
    if (parts.length === 3) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const milliseconds = parts[2];
      const totalSeconds = minutes * 60 + seconds;
      if (totalSeconds >= 60) {
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        return `+${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds}`;
      } else {
        return `+${totalSeconds}.${milliseconds}`;
      }
    } else if (parts.length === 2) {
      const seconds = parseFloat(processedTime);
      if (seconds >= 60) {
        const displayMinutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.round((seconds % 1) * 1000)
          .toString()
          .padStart(3, '0');
        return `+${displayMinutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds}`;
      } else {
        return `+${processedTime}`;
      }
    }
  } catch (e) {
    if (processedTime.match(/^\d/)) return `+${processedTime}`;
  }
  return timeStr;
};

interface PositionsSummaryTableProps {
  sessionResults?: DetailedRaceResult[];
  year: number;
}

const PositionsSummaryTable: React.FC<PositionsSummaryTableProps> = ({ sessionResults, year }) => {
  if (!sessionResults || sessionResults.length === 0) {
    return null;
  }

  const calculatedResults = sessionResults
    .map((result) => {
      let placesChanged: number | null = null;
      if (
        typeof result.gridPosition === 'number' &&
        typeof result.position === 'number' &&
        result.gridPosition !== 0
      ) {
        placesChanged = result.gridPosition - result.position;
      } else if (result.gridPosition === 0 && typeof result.position === 'number') {
        const effectiveGrid = sessionResults.length > 0 ? sessionResults.length : 22;
        placesChanged = effectiveGrid - result.position;
      }
      return { ...result, placesChanged };
    })
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
      <div className="border-b border-white/[0.04] px-5 py-4">
        <h4 className="text-[13px] font-medium uppercase tracking-wider text-white/80">
          Places Gained/Lost
        </h4>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
              <TableHead className="w-[50px] text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Pos
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-white">
                Driver
              </TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-white">
                Team
              </TableHead>
              <TableHead className="w-[90px] text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Change
              </TableHead>
              <TableHead className="w-[120px] text-right text-[11px] font-medium uppercase tracking-wider text-white">
                Time
              </TableHead>
              <TableHead className="w-[60px] text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Laps
              </TableHead>
              <TableHead className="w-[70px] text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Grid
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedResults.map((res) => (
              <TableRow
                key={res.driverCode}
                className="border-b border-white/[0.04] transition-colors last:border-b-0 group hover:bg-white/[0.02]"
              >
                <TableCell className="text-center text-[14px] font-bold text-white group-hover:text-white">
                  {res.position ?? '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7 shrink-0 border border-white/[0.08]">
                      <AvatarImage
                        src={getDriverImage(res.driverCode, year)}
                        className="object-cover object-top"
                      />
                      <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                        {res.driverCode}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-white truncate">
                          {res.fullName}
                        </span>
                        {isRookie(res.driverCode, year) && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400 shrink-0">
                            R
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/80">{res.driverCode}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        `bg-f1-${getTeamColorClass(res.team)}`
                      )}
                    />
                    <span className="text-[12px] text-white">{res.team}</span>
                  </span>
                </TableCell>
                <TableCell className="text-center text-[12px]">
                  <PlacesChanged change={res.placesChanged} gridPos={res.gridPosition} />
                </TableCell>
                <TableCell className="text-right text-[13px] text-white">
                  {formatRaceTime(res.time, res.position === 1)}
                </TableCell>
                <TableCell className="text-center text-[13px] text-white">
                  {res.laps ?? '-'}
                </TableCell>
                <TableCell className="text-center text-[13px] text-white">
                  {res.gridPosition === 0 ? 'PL' : (res.gridPosition ?? '-')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const PlacesChanged = ({
  change,
  gridPos,
}: {
  change: number | null;
  gridPos: number | undefined;
}) => {
  if (gridPos === 0) return <span className="text-white text-xs italic">PIT</span>;
  if (change === null || change === 0) {
    return (
      <span
        className="text-white flex items-center justify-center"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <MinusSignIcon className="size-3 mr-1 opacity-50" /> 0
      </span>
    );
  } else if (change > 0) {
    return (
      <span
        className="text-emerald-400 flex items-center justify-center font-bold"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowUp01Icon className="size-3 mr-1" /> +{change}
      </span>
    );
  } else {
    return (
      <span
        className="text-red-400 flex items-center justify-center font-bold"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowDown01Icon className="size-3 mr-1" /> {change}
      </span>
    );
  }
};

export { PositionsSummaryTable };
export default PositionsSummaryTable;

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

const getTeamColorClass = (teamName: string | undefined): string => {
  if (!teamName) return 'gray';
  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (simpleName.includes('mclaren')) return 'mclaren';
  if (simpleName.includes('mercedes')) return 'mercedes';
  if (simpleName.includes('redbull')) return 'redbull';
  if (simpleName.includes('ferrari')) return 'ferrari';
  if (simpleName.includes('alpine')) return 'alpine';
  if (simpleName.includes('astonmartin')) return 'astonmartin';
  if (simpleName.includes('williams')) return 'williams';
  if (simpleName.includes('haas')) return 'haas';
  if (simpleName.includes('sauber')) return 'alfaromeo';
  if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
  return 'gray';
};

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

  const renderPlacesChanged = (change: number | null, gridPos: number | undefined) => {
    if (gridPos === 0) return <span className="text-gray-500 text-xs italic">PIT</span>;
    if (change === null || change === 0) {
      return (
        <span className="text-gray-600 flex items-center justify-center font-mono">
          <MinusSignIcon className="w-3 h-3 mr-1 opacity-50" /> 0
        </span>
      );
    } else if (change > 0) {
      return (
        <span className="text-green-500 flex items-center justify-center font-mono font-black">
          <ArrowUp01Icon className="w-3 h-3 mr-1" /> +{change}
        </span>
      );
    } else {
      return (
        <span className="text-red-500 flex items-center justify-center font-mono font-black">
          <ArrowDown01Icon className="w-3 h-3 mr-1" /> {change}
        </span>
      );
    }
  };

  return (
    <div className="bg-black border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-black uppercase tracking-wider text-white">
          Places Gained/Lost
        </h4>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-black border-b border-gray-700">
            <TableRow className="border-gray-700 hover:bg-transparent">
              <TableHead className="w-[50px] text-center text-gray-400 font-black uppercase text-xs">
                Pos
              </TableHead>
              <TableHead className="text-gray-400 font-black uppercase text-xs">Driver</TableHead>
              <TableHead className="text-gray-400 font-black uppercase text-xs">Team</TableHead>
              <TableHead className="w-[90px] text-center text-gray-400 font-black uppercase text-xs">
                Change
              </TableHead>
              <TableHead className="w-[120px] text-right text-gray-400 font-black uppercase text-xs">
                Time
              </TableHead>
              <TableHead className="w-[60px] text-center text-gray-400 font-black uppercase text-xs">
                Laps
              </TableHead>
              <TableHead className="w-[70px] text-center text-gray-400 font-black uppercase text-xs">
                Grid
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedResults.map((res) => (
              <TableRow
                key={res.driverCode}
                className="border-gray-700/50 hover:bg-gray-800/30 transition-colors group"
              >
                <TableCell className="text-center font-mono font-black text-gray-400 group-hover:text-white">
                  {res.position ?? '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{res.fullName}</span>
                    {isRookie(res.driverCode, year) && (
                      <span className="text-[10px] px-1 py-0.5 bg-blue-900/50 text-blue-300 rounded border border-blue-800 font-mono">
                        R
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        `bg-f1-${getTeamColorClass(res.team)}`
                      )}
                    ></span>
                    <span className="text-xs text-gray-400 uppercase">{res.team}</span>
                  </span>
                </TableCell>
                <TableCell className="text-center text-xs">
                  {renderPlacesChanged(res.placesChanged, res.gridPosition)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono text-gray-500">
                  {formatRaceTime(res.time, res.position === 1)}
                </TableCell>
                <TableCell className="text-center font-mono text-gray-500">
                  {res.laps ?? '-'}
                </TableCell>
                <TableCell className="text-center font-mono text-gray-500">
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

export { PositionsSummaryTable };
export default PositionsSummaryTable;

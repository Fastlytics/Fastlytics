import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { StintAnalysisData, LapDetail, fetchStintAnalysis } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getCompoundColor } from '@/lib/utils';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import {
  AlertCircleIcon,
  ArrowUpDownIcon,
  Analytics01Icon,
  ChartDecreaseIcon,
  ChartIncreaseIcon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Helper function to format seconds into MM:SS.mmm
const formatLapTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};

// Helper function to calculate standard deviation
const calculateStdDev = (arr: number[]): number | null => {
  if (!arr || arr.length < 2) return null;
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

// Helper function to calculate degradation using linear regression
const calculateDegradation = (lapDetails: LapDetail[]): number | null => {
  const validLaps = lapDetails.length > 2 ? lapDetails.slice(1, -1) : [];

  if (validLaps.length < 2) {
    return null;
  }

  const n = validLaps.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  validLaps.forEach((lap) => {
    const x = lap.lapNumber;
    const y = lap.lapTime;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) {
    return 0;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return slope;
};

interface ProcessedStint extends StintAnalysisData {
  id: string;
  stintLength: number;
  avgLapTime: number | null;
  fastestLap: number | null;
  consistency: number | null;
  degradation: number | null;
  driverColor: string;
  compoundColor: string;
}

interface StintAnalysisTableProps {
  year: number;
  event: string;
  session: string;
}

const StintAnalysisTable: React.FC<StintAnalysisTableProps> = ({ year, event, session }) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    data: rawStintData,
    isLoading,
    error,
    isError,
  } = useQuery<StintAnalysisData[]>({
    queryKey: ['stintAnalysis', year, event, session],
    queryFn: () => fetchStintAnalysis(year, event, session),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
  });

  const processedData = useMemo((): ProcessedStint[] => {
    if (!rawStintData) return [];
    return rawStintData
      .map((stint) => {
        const allValidLapDetails = stint.lapDetails;
        const allValidLapTimes = allValidLapDetails.map((detail) => detail.lapTime);

        const fastLapDetails = allValidLapDetails.length > 2 ? allValidLapDetails.slice(1, -1) : [];
        const fastLapTimes = fastLapDetails.map((detail) => detail.lapTime);

        const avgLapTime =
          fastLapTimes.length > 0
            ? fastLapTimes.reduce((a, b) => a + b, 0) / fastLapTimes.length
            : null;
        const fastestLap = allValidLapTimes.length > 0 ? Math.min(...allValidLapTimes) : null;
        const consistency = calculateStdDev(fastLapTimes);
        const degradation = calculateDegradation(allValidLapDetails);
        const dColor = driverColor(stint.driverCode, year);
        const cColor = getCompoundColor(stint.compound);

        return {
          ...stint,
          id: `${stint.driverCode}-${stint.stintNumber}`,
          stintLength: stint.endLap - stint.startLap + 1,
          avgLapTime,
          fastestLap,
          consistency,
          degradation,
          driverColor: dColor,
          compoundColor: cColor,
        };
      })
      .sort((a, b) => {
        if (a.driverCode < b.driverCode) return -1;
        if (a.driverCode > b.driverCode) return 1;
        return a.stintNumber - b.stintNumber;
      });
  }, [rawStintData, year]);

  const columns = useMemo<ColumnDef<ProcessedStint>[]>(() => {
    const baseColumns: ColumnDef<ProcessedStint>[] = [
      {
        accessorKey: 'driverCode',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent hover:text-white text-neutral-500 font-semibold text-xs"
          >
            Driver
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-black font-mono" style={{ color: row.original.driverColor }}>
            {row.original.driverCode}
          </span>
        ),
        sortingFn: 'alphanumeric',
        enableSorting: true,
      },
      {
        accessorKey: 'stintNumber',
        header: 'Stint',
        cell: ({ row }) => (
          <span className="text-center block font-mono text-neutral-400">
            {row.original.stintNumber}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'compound',
        header: 'Compound',
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <span
              className="w-3 h-3 rounded-full inline-block mr-2 shadow-sm"
              style={{ backgroundColor: row.original.compoundColor }}
              title={row.original.compound}
            ></span>
            <span className="hidden md:inline font-black text-xs uppercase text-neutral-300">
              {row.original.compound}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'stintLength',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent hover:text-white text-neutral-500 font-semibold text-xs"
          >
            Length
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono text-white">{row.original.stintLength} Laps</span>
            <span className="text-[10px] text-neutral-500 font-mono">
              L{row.original.startLap} - L{row.original.endLap}
            </span>
          </div>
        ),
        sortingFn: 'basic',
        enableSorting: true,
      },
      {
        accessorKey: 'fastestLap',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent hover:text-white text-neutral-500 font-semibold text-xs"
          >
            Fastest
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-purple-400">
            {formatLapTime(row.original.fastestLap)}
          </span>
        ),
        sortingFn: 'basic',
        enableSorting: true,
      },
      {
        accessorKey: 'avgLapTime',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent hover:text-white text-neutral-500 font-semibold text-xs"
          >
            Average
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-neutral-300">{formatLapTime(row.original.avgLapTime)}</span>
        ),
        sortingFn: 'basic',
        enableSorting: true,
      },
    ];

    const raceSpecificColumns: ColumnDef<ProcessedStint>[] = [
      {
        accessorKey: 'consistency',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent hover:text-white text-neutral-500 font-semibold text-xs"
          >
            Consist. (σ)
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-neutral-400">
            {row.original.consistency?.toFixed(3) ?? 'N/A'}
          </span>
        ),
        sortingFn: 'basic',
        enableSorting: true,
      },
      {
        accessorKey: 'degradation',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent hover:text-white text-neutral-500 font-semibold text-xs"
          >
            Degr. (Δ/lap)
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const deg = row.original.degradation;
          if (deg === null || deg === undefined) return 'N/A';
          const color = deg < 0 ? 'text-green-500' : 'text-red-500';
          const Icon = deg < 0 ? ChartDecreaseIcon : ChartIncreaseIcon;
          return (
            <span className={`flex items-center ${color} font-mono font-bold`}>
              <Icon className={`mr-1 h-3 w-3 ${deg === 0 ? 'opacity-50' : ''}`} />
              {deg.toFixed(3)}
            </span>
          );
        },
        sortingFn: 'basic',
        enableSorting: true,
      },
    ];

    if (session === 'R' || session === 'Sprint') {
      return [...baseColumns, ...raceSpecificColumns];
    } else {
      return baseColumns;
    }
  }, [year, session]);

  const table = useReactTable({
    data: processedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin" />
        <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider animate-pulse">Loading stint data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-red-400">
        <AlertCircleIcon className="w-6 h-6 mb-2 opacity-60" />
        <p className="text-sm font-semibold">Error Loading Stint Analysis</p>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          {(error as Error)?.message || 'Could not fetch stint analysis data.'}
        </p>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <span className="text-xs font-mono uppercase tracking-widest">No stint data available for analysis</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-neutral-800/50 hover:bg-transparent bg-neutral-900/20">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-b border-neutral-800/30 hover:bg-neutral-800/15 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-sm font-mono">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-neutral-500 font-mono uppercase"
                >
                  No stint data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="px-5 py-3.5 border-t border-neutral-800/30 bg-neutral-900/10">
        <h4 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Metric Definitions
        </h4>
        <ul className="space-y-0.5 text-[10px] text-neutral-600 font-mono">
          <li className={cn(session !== 'R' && session !== 'Sprint' && 'opacity-40')}>
            <span className="text-neutral-400">CONSISTENCY (σ):</span> Standard Deviation of lap times.
            Lower is better.
          </li>
          <li className={cn(session !== 'R' && session !== 'Sprint' && 'opacity-40')}>
            <span className="text-neutral-400">DEGRADATION (Δ/lap):</span> Lap time loss per lap.
            Positive = Slower over time.
          </li>
        </ul>
      </div>
    </div>
  );
};

export { StintAnalysisTable };
export default StintAnalysisTable;

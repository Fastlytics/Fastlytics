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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';

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
  driverNameMap?: Map<string, string>;
}

const StintAnalysisTable: React.FC<StintAnalysisTableProps> = ({
  year,
  event,
  session,
  driverNameMap,
}) => {
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
            className="p-0 hover:bg-transparent hover:text-white text-white text-[11px] font-medium uppercase tracking-wider"
          >
            Driver
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const code = row.original.driverCode;
          const fullName = driverNameMap?.get(code) || code;
          const headshot = getDriverImage(code, year);
          return (
            <div className="flex flex-col items-center gap-1 py-1">
              <Avatar className="h-14 w-14 shrink-0 border border-white/[0.08]">
                <AvatarImage src={headshot} className="object-cover object-top" />
                <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                  {code}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-semibold text-white text-center leading-tight">
                {fullName}
              </span>
              <span className="text-[9px] font-medium text-white/80">{code}</span>
            </div>
          );
        },
        sortingFn: 'alphanumeric',
        enableSorting: true,
      },
      {
        accessorKey: 'stintNumber',
        header: 'Stint',
        cell: ({ row }) => (
          <span className="block text-center text-white">{row.original.stintNumber}</span>
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
            <span className="hidden text-[11px] font-semibold uppercase text-white md:inline">
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
            className="p-0 hover:bg-transparent hover:text-white text-white text-[11px] font-medium uppercase tracking-wider"
          >
            Length
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[13px] text-white">{row.original.stintLength} Laps</span>
            <span className="text-[10px] text-white">
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
            className="p-0 hover:bg-transparent hover:text-white text-white text-[11px] font-medium uppercase tracking-wider"
          >
            Fastest
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-purple-400">{formatLapTime(row.original.fastestLap)}</span>
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
            className="p-0 hover:bg-transparent hover:text-white text-white text-[11px] font-medium uppercase tracking-wider"
          >
            Average
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-white">{formatLapTime(row.original.avgLapTime)}</span>
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
            className="p-0 hover:bg-transparent hover:text-white text-white text-[11px] font-medium uppercase tracking-wider"
          >
            Consist. (σ)
            <ArrowUpDownIcon className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-white">{row.original.consistency?.toFixed(3) ?? 'N/A'}</span>
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
            className="p-0 hover:bg-transparent hover:text-white text-white text-[11px] font-medium uppercase tracking-wider"
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
  }, [year, session, driverNameMap]);

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
      <div className="mt-6 flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <LoadingSpinnerF1 />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-red-400">
        <AlertCircleIcon className="mb-2 h-7 w-7" />
        <p className="text-[13px] font-semibold uppercase">Error Loading Stint Analysis</p>
        <p className="mt-1 text-[12px] text-white">
          {(error as Error)?.message || 'Could not fetch stint analysis data.'}
        </p>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 text-center text-[13px] text-white">
        No stint data available for analysis in this session.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-white/[0.04] hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-white"
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
                  className="border-b border-white/[0.04] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-[13px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-[13px] text-white"
                >
                  No stint data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t border-white/[0.04] px-4 py-3">
        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white">
          Metric Definitions:
        </h4>
        <ul className="space-y-1 text-[11px] text-white">
          <li className={cn(session !== 'R' && session !== 'Sprint' && 'opacity-50')}>
            <span className="text-white">CONSISTENCY (σ):</span> Standard Deviation of lap times.
            Lower is better.
          </li>
          <li className={cn(session !== 'R' && session !== 'Sprint' && 'opacity-50')}>
            <span className="text-white">DEGRADATION (Δ/lap):</span> Lap time loss per lap. Positive
            = Slower over time.
          </li>
        </ul>
      </div>
    </div>
  );
};

export { StintAnalysisTable };
export default StintAnalysisTable;

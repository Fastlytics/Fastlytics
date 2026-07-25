// knip-ignore
import React, { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon, LockKeyIcon } from 'hugeicons-react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchStintAnalysis, StintAnalysisData } from '@/lib/api';
import { CARD_LABEL } from '@/lib/card-styles';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

import { buildStintColumns } from './stint-analysis-table/columns';
import { buildProcessedStints } from './stint-analysis-table/helpers';
import { MetricDefinitions } from './stint-analysis-table/MetricDefinitions';
import { StintLapTimeChart } from './stint-analysis-table/StintLapTimeChart';

interface StintAnalysisTableProps {
  year: number;
  event: string;
  session: string;
  driverNameMap?: Map<string, string>;
  driverTeamMap?: Map<string, string>;
}

const StintAnalysisTable: React.FC<StintAnalysisTableProps> = ({
  year,
  event,
  session,
  driverNameMap,
  driverTeamMap,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const { user, isSubscribed } = useAuth();
  const isPro = user && isSubscribed('pro');

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

  const processedData = useMemo(
    () => buildProcessedStints(rawStintData, year),
    [rawStintData, year]
  );
  const columns = useMemo(
    () => buildStintColumns({ year, session, driverNameMap, driverTeamMap }),
    [year, session, driverNameMap, driverTeamMap]
  );

  // TanStack Table exposes imperative functions from the hook; the lint rule is a known false positive here.
  // eslint-disable-next-line react-hooks/incompatible-library
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
      <div className="flex items-center justify-center py-8">
        <LoadingSpinnerF1 />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.05] p-6 text-red-400">
        <AlertCircleIcon className="mb-2 size-7" />
        <p className="text-[13px] font-semibold uppercase">Error Loading Stint Analysis</p>
        <p className="mt-1 text-[12px] text-white">
          {(error as Error)?.message || 'Could not fetch stint analysis data.'}
        </p>
      </div>
    );
  }

  if (!processedData.length) {
    return (
      <div className="py-6 text-center text-[13px] text-white/80">
        No stint data available for analysis in this session.
      </div>
    );
  }

  return (
    <div>
      <div className="border-t border-white/[0.04]">
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
                      className="whitespace-nowrap px-4 py-3 text-left text-[12px] font-medium text-white/80"
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const isExpanded = expandedRowId === row.original.id;
                  const lapCount = row.original.lapDetails?.length ?? 0;

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        className={cn(
                          'border-b border-white/[0.02] transition-colors last:border-b-0 hover:bg-white/[0.02] cursor-pointer',
                          isExpanded && 'bg-white/[0.03]'
                        )}
                        onClick={() => setExpandedRowId(isExpanded ? null : row.original.id)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="border-b border-white/[0.02] bg-white/[0.01]">
                          <TableCell colSpan={columns.length} className="p-0">
                            {!isPro ? (
                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                <LockKeyIcon className="mb-2 size-4 text-white/30" />
                                <p className="text-[12px] font-medium text-white/60">
                                  Lap time chart is a Pro feature
                                </p>
                                <Link
                                  to="/pricing"
                                  className="mt-2 inline-flex h-7 items-center rounded-md bg-white/[0.08] px-3 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.14]"
                                >
                                  Upgrade to Pro
                                </Link>
                              </div>
                            ) : lapCount >= 2 ? (
                              <StintLapTimeChart
                                lapDetails={row.original.lapDetails}
                                compoundColor={row.original.compoundColor}
                                driverName={driverNameMap?.get(row.original.driverCode) || row.original.driverCode}
                                stintStart={row.original.startLap}
                                stintEnd={row.original.endLap}
                              />
                            ) : (
                              <div className="py-4 text-center text-[12px] text-white/50">
                                Not enough lap data for this stint
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-[13px] text-white/80"
                  >
                    No stint data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <MetricDefinitions session={session} />
    </div>
  );
};

export { StintAnalysisTable };
export default StintAnalysisTable;

// knip-ignore
import React, { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon } from 'hugeicons-react';
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

import { buildStintColumns } from './stint-analysis-table/columns';
import { buildProcessedStints } from './stint-analysis-table/helpers';
import { MetricDefinitions } from './stint-analysis-table/MetricDefinitions';

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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="border-b border-white/[0.02] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
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

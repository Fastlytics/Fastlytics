import { ArrowUpDownIcon, ChartDecreaseIcon, ChartIncreaseIcon } from 'hugeicons-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getDriverImage } from '@/utils/imageMapping';

import { formatLapTime, ProcessedStint } from './helpers';

interface BuildColumnsArgs {
  year: number;
  session: string;
  driverNameMap?: Map<string, string>;
}

const renderSortableHeader = ({
  column,
  label,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void };
  label: string;
}) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    className="p-0 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-transparent hover:text-white"
  >
    {label}
    <ArrowUpDownIcon className="ml-1.5 size-3" />
  </Button>
);

export const buildStintColumns = ({ year, session, driverNameMap }: BuildColumnsArgs) => {
  const baseColumns: ColumnDef<ProcessedStint>[] = [
    {
      accessorKey: 'driverCode',
      header: ({ column }) => renderSortableHeader({ column, label: 'Driver' }),
      cell: ({ row }) => {
        const code = row.original.driverCode;
        const fullName = driverNameMap?.get(code) || code;
        const headshot = getDriverImage(code, year);

        return (
          <div className="flex flex-col items-center gap-1 py-1">
            <Avatar className="size-14 shrink-0 border border-white/[0.08]">
              <AvatarImage src={headshot} className="object-cover object-top" />
              <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                {code}
              </AvatarFallback>
            </Avatar>
            <span className="text-center text-[11px] font-semibold leading-tight text-white">
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
            className="mr-2 inline-block size-3 rounded-full shadow-sm"
            style={{ backgroundColor: row.original.compoundColor }}
            title={row.original.compound}
          />
          <span className="hidden text-[11px] font-semibold uppercase text-white md:inline">
            {row.original.compound}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'stintLength',
      header: ({ column }) => renderSortableHeader({ column, label: 'Length' }),
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
      header: ({ column }) => renderSortableHeader({ column, label: 'Fastest' }),
      cell: ({ row }) => (
        <span className="text-purple-400">{formatLapTime(row.original.fastestLap)}</span>
      ),
      sortingFn: 'basic',
      enableSorting: true,
    },
    {
      accessorKey: 'avgLapTime',
      header: ({ column }) => renderSortableHeader({ column, label: 'Average' }),
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
      header: ({ column }) => renderSortableHeader({ column, label: 'Consist. (σ)' }),
      cell: ({ row }) => (
        <span className="text-white">{row.original.consistency?.toFixed(3) ?? 'N/A'}</span>
      ),
      sortingFn: 'basic',
      enableSorting: true,
    },
    {
      accessorKey: 'degradation',
      header: ({ column }) => renderSortableHeader({ column, label: 'Degr. (Δ/lap)' }),
      cell: ({ row }) => {
        const degradation = row.original.degradation;
        if (degradation === null || degradation === undefined) return 'N/A';

        const color = degradation < 0 ? 'text-green-500' : 'text-red-500';
        const Icon = degradation < 0 ? ChartDecreaseIcon : ChartIncreaseIcon;
        return (
          <span className={`flex items-center font-mono font-bold ${color}`}>
            <Icon className={`mr-1 size-3 ${degradation === 0 ? 'opacity-50' : ''}`} />
            {degradation.toFixed(3)}
          </span>
        );
      },
      sortingFn: 'basic',
      enableSorting: true,
    },
  ];

  return session === 'R' || session === 'Sprint'
    ? [...baseColumns, ...raceSpecificColumns]
    : baseColumns;
};

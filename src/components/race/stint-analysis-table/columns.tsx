import { ArrowUpDownIcon, ChartDecreaseIcon, ChartIncreaseIcon } from 'hugeicons-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getDriverImage } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/teamColors';
import { cn } from '@/lib/utils';

import { formatLapTime, ProcessedStint } from './helpers';

interface BuildColumnsArgs {
  year: number;
  session: string;
  driverNameMap?: Map<string, string>;
  driverTeamMap?: Map<string, string>;
}

const renderSortButton = ({
  column,
  label,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void };
  label: string;
}) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    className="h-auto px-0 py-0 text-[12px] font-medium text-white/80 hover:bg-transparent hover:text-white"
  >
    {label}
    <ArrowUpDownIcon className="ml-1.5 size-3 opacity-60" />
  </Button>
);

const renderLapTimeCell = (value: number | null, highlighted = false) => (
  <span className={cn('text-[13px]', highlighted ? 'font-semibold text-purple-400' : 'text-white')}>
    {formatLapTime(value)}
  </span>
);

const renderNumericCell = (value: number | null | undefined, decimals = 0) => {
  if (value === null || value === undefined) {
    return <span className="text-[13px] text-white/50">—</span>;
  }
  return (
    <span className="text-[13px] text-white">{decimals > 0 ? value.toFixed(decimals) : value}</span>
  );
};

const renderCompoundBadge = (compound: string, color: string) => {
  const label = compound?.toUpperCase() || '?';
  const initial = label[0];
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-5 w-7 items-center justify-center rounded"
        style={{ backgroundColor: color }}
      >
        <span className="text-[10px] font-bold text-black">{initial}</span>
      </div>
      <span className="hidden text-[13px] text-white md:inline">{label}</span>
    </div>
  );
};

export const buildStintColumns = ({
  year,
  session,
  driverNameMap,
  driverTeamMap,
}: BuildColumnsArgs) => {
  const baseColumns: ColumnDef<ProcessedStint>[] = [
    {
      accessorKey: 'driverCode',
      header: ({ column }) => renderSortButton({ column, label: 'Driver' }),
      cell: ({ row }) => {
        const code = row.original.driverCode;
        const fullName = driverNameMap?.get(code) || code;
        const headshot = getDriverImage(code, year);
        const team = driverTeamMap?.get(code);
        const teamColor = team ? getTeamColorClass(team) : null;

        return (
          <div className="flex items-center gap-2.5">
            <img
              src={headshot}
              alt=""
              className="size-7 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
            />
            {teamColor && (
              <span
                aria-hidden="true"
                className={cn('h-5 w-0.5 shrink-0 rounded-full', `bg-f1-${teamColor}`)}
              />
            )}
            <span className="truncate text-[13px] font-medium text-white">{fullName}</span>
          </div>
        );
      },
      sortingFn: 'alphanumeric',
      enableSorting: true,
    },
    {
      accessorKey: 'stintNumber',
      header: 'Stint no.',
      cell: ({ row }) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[12px] font-medium text-white">
          {row.original.stintNumber}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'compound',
      header: 'Compound',
      cell: ({ row }) => renderCompoundBadge(row.original.compound, row.original.compoundColor),
      enableSorting: false,
    },
    {
      accessorKey: 'stintLength',
      header: ({ column }) => renderSortButton({ column, label: 'Length' }),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] text-white">
            {row.original.stintLength} <span className="text-white/60">laps</span>
          </span>
          <span className="text-[11px] text-white/60">
            L{row.original.startLap}–L{row.original.endLap}
          </span>
        </div>
      ),
      sortingFn: 'basic',
      enableSorting: true,
    },
    {
      accessorKey: 'fastestLap',
      header: ({ column }) => renderSortButton({ column, label: 'Fastest' }),
      cell: ({ row }) => renderLapTimeCell(row.original.fastestLap, true),
      sortingFn: 'basic',
      enableSorting: true,
    },
    {
      accessorKey: 'avgLapTime',
      header: ({ column }) => renderSortButton({ column, label: 'Average' }),
      cell: ({ row }) => renderLapTimeCell(row.original.avgLapTime, false),
      sortingFn: 'basic',
      enableSorting: true,
    },
  ];

  const raceSpecificColumns: ColumnDef<ProcessedStint>[] = [
    {
      accessorKey: 'consistency',
      header: ({ column }) => renderSortButton({ column, label: 'Consistency (σ)' }),
      cell: ({ row }) => renderNumericCell(row.original.consistency, 3),
      sortingFn: 'basic',
      enableSorting: true,
    },
    {
      accessorKey: 'degradation',
      header: ({ column }) => renderSortButton({ column, label: 'Degradation (Δ/lap)' }),
      cell: ({ row }) => {
        const degradation = row.original.degradation;
        if (degradation === null || degradation === undefined) {
          return <span className="text-[13px] text-white/50">—</span>;
        }

        const isNegative = degradation < 0;
        const isZero = degradation === 0;
        const colorClass = isNegative ? 'text-emerald-400' : 'text-red-400';
        const Icon = isNegative ? ChartDecreaseIcon : ChartIncreaseIcon;
        return (
          <span className={cn('flex items-center gap-1 text-[13px] font-medium', colorClass)}>
            <Icon className={cn('size-3', isZero && 'opacity-50')} />
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

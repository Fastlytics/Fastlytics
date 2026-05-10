import React from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';

export interface StatBoxProps {
  label: string;
  value: string | number;
  delay?: number;
}

export const StatBox: React.FC<StatBoxProps> = ({ label, value, delay = 0 }) => (
  <m.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4 text-center"
  >
    <div className="text-2xl font-bold tabular-nums text-white">{value}</div>
    <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
      {label}
    </div>
  </m.div>
);

interface ProfileSeasonRowBadge {
  label: string;
  color: 'red' | 'amber';
}

interface ProfileSeasonRowProps {
  season: { season: number; position?: number };
  index: number;
  isCurrent: boolean;
  isChampion: boolean;
  badges?: ProfileSeasonRowBadge[];
  columns: React.ReactNode[];
}

const EMPTY_BADGES: ProfileSeasonRowBadge[] = [];

export const ProfileSeasonRow: React.FC<ProfileSeasonRowProps> = ({
  season,
  index,
  isCurrent,
  isChampion,
  badges = EMPTY_BADGES,
  columns,
}) => (
  <m.tr
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.025 }}
    className={cn(
      'border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]',
      isCurrent && 'border-l-2 border-l-red-500 bg-red-500/[0.02]',
      isChampion && !isCurrent && 'border-l-2 border-l-amber-500 bg-amber-500/[0.02]'
    )}
  >
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-bold tabular-nums text-white">{season.season}</span>
        {isCurrent && (
          <span className="rounded-full border border-red-500/20 bg-red-500/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Current
          </span>
        )}
        {badges.map((badge) => (
          <span
            key={`${badge.color}-${badge.label}`}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              badge.color === 'amber'
                ? 'border-amber-500/20 bg-amber-500/[0.07] text-amber-400'
                : 'border-red-500/20 bg-red-500/[0.07] text-red-400'
            )}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </td>
    {columns.map((col) => (
      <td
        key={
          React.isValidElement(col) && col.key != null
            ? String(col.key)
            : `${season.season}-${String(col)}`
        }
        className="py-3 px-4 text-center"
      >
        {col}
      </td>
    ))}
    <td className="py-3 px-4 text-center">
      {season.position ? (
        <span
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
            season.position === 1 && 'bg-amber-500/20 text-amber-400',
            season.position === 2 && 'bg-zinc-500/20 text-zinc-300',
            season.position === 3 && 'bg-orange-500/20 text-orange-400',
            season.position > 3 && 'bg-white/[0.04] text-white/40'
          )}
        >
          {season.position}
        </span>
      ) : (
        <span className="text-[12px] text-white/20">—</span>
      )}
    </td>
  </m.tr>
);

/** Shared season history table */
interface SeasonHistoryTableProps {
  title?: string;
  children: React.ReactNode;
}

export const SeasonHistoryTable: React.FC<SeasonHistoryTableProps> = ({
  title = 'Season by Season',
  children,
}) => (
  <m.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <h2 className="mb-4 text-xl font-semibold uppercase italic tracking-[-0.025em] text-white">
      {title}
    </h2>
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm">{children}</table>
    </div>
  </m.div>
);

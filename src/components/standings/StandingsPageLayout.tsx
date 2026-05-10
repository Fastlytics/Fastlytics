// knip-ignore
import React, { useMemo } from 'react';
import { m } from 'motion/react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { SEO } from '@/components/layout/SEO';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

interface StandingsLayoutProps {
  title: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  selectedYear: number;
  children: ReactNode;
}

/** Shared page shell for standings pages — handles navbar, header, SEO */
export const StandingsLayout: React.FC<StandingsLayoutProps> = ({
  title,
  subtitle,
  seoTitle,
  seoDescription,
  selectedYear,
  children,
}) => (
  <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
    <SEO title={seoTitle} description={seoDescription} />
    <DashboardNavbar />

    <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
      <div className="mb-10">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
              </span>
              Season {selectedYear}
            </span>
          </div>
          <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-[15px] text-white/50">{subtitle}</p>
        </m.div>
        <div className="mt-8 h-px w-full bg-white/[0.05]" />
      </div>

      {children}
    </main>
  </div>
);

const SKELETON_IDS_1 = Array.from({ length: 3 }, (_, i) => `sk-${i}`);
const SKELETON_IDS_2 = Array.from({ length: 7 }, (_, i) => `sk-${i}`);

/** Shared loading skeleton for standings pages */
export const StandingsLoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {SKELETON_IDS_1.map((id) => (
        <div
          key={id}
          className="h-72 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
        />
      ))}
    </div>
    <div className="mt-6 space-y-3">
      {SKELETON_IDS_2.map((id) => (
        <div
          key={id}
          className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
        />
      ))}
    </div>
  </div>
);

/** Shared error state for standings pages */
export const StandingsErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
      <span className="text-lg text-red-400">!</span>
    </div>
    <h3 className="text-[18px] font-semibold uppercase italic text-white">Data Unavailable</h3>
    <p className="mt-1 text-[14px] text-white/40">{message}</p>
  </div>
);

/** Shared empty state */
export const StandingsEmptyState: React.FC<{ year: number }> = ({ year }) => (
  <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
    <p className="text-[14px] text-white/40">No standings found for {year}.</p>
  </div>
);

/** Shared standings table row */
interface StandingsTableRowProps {
  rank: number;
  colorClass: string;
  name: string;
  team?: string;
  wins: number;
  podiums: number;
  points: number;
  pointsChange?: number;
  delay: number;
  indicator: { color: string; icon: ReactNode } | null;
  beforeName?: ReactNode;
  nameExtras?: ReactNode;
  teamBadge?: ReactNode;
}

export const StandingsTableRow: React.FC<StandingsTableRowProps> = ({
  rank,
  colorClass,
  name,
  team,
  wins,
  podiums,
  points,
  pointsChange,
  delay,
  indicator,
  beforeName,
  nameExtras,
  teamBadge,
}) => (
  <m.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
  >
    <span className="w-6 shrink-0 text-[15px] tabular-nums font-medium text-white/40">{rank}</span>

    <div className={cn('h-8 w-0.5 shrink-0 rounded-full', `bg-f1-${colorClass}`)} />

    {beforeName}

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-[15px] font-semibold text-white group-hover:text-red-400 transition-colors">
          {name}
        </span>
        {nameExtras}
      </div>
      {team && <div className="text-[12px] text-white/40">{team}</div>}
      {teamBadge}
    </div>

    <div className="hidden items-center gap-6 md:flex">
      <div className="text-right">
        <div className="text-[14px] font-semibold tabular-nums text-white">{wins}</div>
        <div className="text-[10px] text-white/30 uppercase">Wins</div>
      </div>
      <div className="text-right">
        <div className="text-[14px] font-semibold tabular-nums text-white">{podiums}</div>
        <div className="text-[10px] text-white/30 uppercase">Podiums</div>
      </div>
    </div>

    <div className="shrink-0 text-right">
      <div className="flex items-baseline justify-end gap-2">
        <span className="text-[18px] font-bold tabular-nums text-white">{points}</span>
        {indicator && (
          <span
            className={cn('flex items-center gap-0.5 text-[12px] font-medium', indicator.color)}
          >
            {indicator.icon}
            {pointsChange !== undefined && pointsChange !== 0 && (
              <span>{Math.abs(pointsChange)}</span>
            )}
          </span>
        )}
      </div>
      <div className="text-[10px] text-white/40">PTS</div>
    </div>
  </m.div>
);

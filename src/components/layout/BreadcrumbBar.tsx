import { Link } from 'react-router-dom';
import { BreadcrumbSegment } from '@/lib/breadcrumbs';
import { useSeason } from '@/contexts/SeasonContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UpgradeModal from '@/components/payments/UpgradeModal';

export interface BreadcrumbBarProps {
  segments: BreadcrumbSegment[];
  onSearchClick?: () => void;
}

/**
 * Top header bar — Vercel-style thin bar with breadcrumbs on the left
 * and season picker + user avatar on the right.
 * Height: 48px. Border-bottom barely visible.
 */
export function BreadcrumbBar({ segments, onSearchClick }: BreadcrumbBarProps) {
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const { user, profile, isSubscribed } = useAuth();
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const seasonRef = useRef<HTMLDivElement>(null);

  const currentSeasonYear = getCurrentSeasonYear();
  const isFreeTierUser = !!user && !isSubscribed('pro');
  const isYearLocked = (year: number) => isFreeTierUser && year < currentSeasonYear;

  const years = availableYears.length > 0 ? availableYears : [2026, 2025, 2024, 2023, 2022];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (seasonRef.current && !seasonRef.current.contains(e.target as Node)) {
        setSeasonOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-white/[0.04] px-6">
        {/* Left: Breadcrumbs */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;

              return (
                <li
                  key={segment.label + (segment.path ?? '')}
                  className="flex items-center gap-1.5"
                >
                  {index > 0 && (
                    <span aria-hidden="true" className="text-[13px] text-white/40 select-none">
                      /
                    </span>
                  )}
                  {isLast || !segment.path ? (
                    <span aria-current="page" className="text-[15px] font-semibold text-white">
                      {segment.label}
                    </span>
                  ) : (
                    <Link
                      to={segment.path}
                      className="text-[12px] font-medium text-white/80 transition-colors hover:text-white"
                    >
                      {segment.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Right: Search + Season picker + User avatar */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          {onSearchClick && (
            <button
              type="button"
              onClick={onSearchClick}
              className="flex w-full items-center gap-1.5 rounded-md border border-white/[0.04] px-4 py-1 text-[12px] font-medium text-white/80 transition-colors hover:border-white/[0.08] hover:text-white min-w-[190px]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="text-[14px] font-semibold">Search</span>
              <span className="flex-1" />
              <kbd className="text-[14px] font-semibold text-white">⌘K</kbd>
            </button>
          )}

          {/* Season picker */}
          <div ref={seasonRef} className="relative">
            <button
              type="button"
              onClick={() => setSeasonOpen(!seasonOpen)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-all ${
                seasonOpen
                  ? 'border-white/[0.08] bg-white/[0.04] text-white'
                  : 'border-white/[0.04] text-white hover:border-white/[0.08] hover:text-white'
              }`}
            >
              <span className="font-mono tabular-nums">{selectedYear}</span>
              <svg
                width="8"
                height="8"
                viewBox="0 0 10 10"
                fill="none"
                className={`text-white/60 transition-transform ${seasonOpen ? 'rotate-180' : ''}`}
              >
                <path
                  d="M2 4l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <AnimatePresence>
              {seasonOpen && (
                <m.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                >
                  <div className="p-1">
                    {years.map((year) => {
                      const locked = isYearLocked(year);
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => {
                            if (locked) {
                              setSeasonOpen(false);
                              setUpgradeOpen(true);
                              return;
                            }
                            setSelectedYear(year);
                            setSeasonOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                            locked
                              ? 'cursor-not-allowed text-white/50'
                              : year === selectedYear
                                ? 'bg-white/[0.04] text-white'
                                : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                          }`}
                        >
                          <span className="font-mono tabular-nums">{year}</span>
                          {locked && (
                            <span className="rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-sky-300">
                              PRO
                            </span>
                          )}
                          {!locked && year === selectedYear && (
                            <span className="size-1 rounded-full bg-white/60" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar or Sign in */}
          {user ? (
            <Link to="/settings">
              <Avatar className="size-7 border border-white/[0.06] transition-colors hover:border-white/[0.12]">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/[0.04] text-[10px] font-medium text-white/80">
                  {profile?.full_name
                    ? profile.full_name.charAt(0).toUpperCase()
                    : (user.email?.charAt(0).toUpperCase() ?? 'U')}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} cancelPath="" />
    </>
  );
}

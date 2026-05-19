import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import type { DriverStanding } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { getTeamColorClass, isRookie } from '@/lib/standingsUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER, CARD_LABEL, CARD_DATA_VALUE } from '@/lib/card-styles';
import { PointsChange } from './PointsChange';
import { getDriverSlug } from '@/lib/driverSlugs';

interface DriverStandingsCardProps {
  driver: DriverStanding;
  year: number;
  /** Hero cards (P1/P2/P3) get a slightly taller layout + leader pill. */
  variant: 'hero' | 'regular';
  /** Shown on the P1 hero card only. */
  leaderLabel?: string;
  /** Highlight for the user's favourite driver. */
  isFavorite?: boolean;
  delay?: number;
}

/**
 * Horizontal driver card — built from the shared CARD_CONTAINER token so it
 * sits in the same design family as the Calendar `EventHeroCard` and the
 * Dashboard `RaceCard`.
 *
 * Layout:
 *   ┌─────────────────────────────┬──────────┐
 *   │  rank  name                 │          │
 *   │        team                 │ portrait │
 *   │                             │  (torso) │
 *   ├─────────────────────────────┤          │
 *   │  points   W · P · change    │          │
 *   └─────────────────────────────┴──────────┘
 *
 * The whole card is a <Link> to /drivers/<slug>.
 */
export const DriverStandingsCard: React.FC<DriverStandingsCardProps> = ({
  driver,
  year,
  variant,
  leaderLabel,
  isFavorite,
  delay = 0,
}) => {
  const colorClass = getTeamColorClass(driver.team);
  const isHero = variant === 'hero';
  const isP1 = isHero && driver.rank === 1;
  const rookie = isRookie(driver.code, year);
  const driverImage = getDriverImage(driver.code, year);

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
    >
      <Link
        to={`/drivers/${getDriverSlug(driver.code, driver.name)}`}
        aria-label={`${driver.name} — P${driver.rank}, ${driver.points} points`}
        className={cn(
          CARD_CONTAINER,
          'group relative block overflow-hidden transition-colors',
          'hover:border-white/[0.08] focus-visible:outline-none focus-visible:border-white/[0.12]',
          isHero && 'border-white/[0.08]',
          isP1 && 'border-white/[0.12]'
        )}
      >
        {/* Team color accent strip — top edge, same pattern as F1Card + DriverStatCard */}
        <div
          className={cn('absolute left-0 top-0 h-[2px] w-full', `bg-f1-${colorClass}`)}
          aria-hidden
        />

        <div className="flex">
          {/* Left: info column */}
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col justify-between gap-4',
              isHero ? 'p-5' : 'p-4'
            )}
          >
            {/* Top row: rank + badges */}
            <div className="flex items-start gap-3">
              <span className={cn(CARD_LABEL, 'font-mono tabular-nums')}>P{driver.rank}</span>

              {/* Leader / rookie / fav badges */}
              <div className="flex flex-wrap items-center gap-2">
                {isP1 && leaderLabel && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-400">
                    <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                    {leaderLabel}
                  </span>
                )}
                {rookie && <span className="text-[11px] font-medium text-sky-400">Rookie</span>}
                {isFavorite && <span className="text-[12px] font-medium text-red-400">★</span>}
              </div>
            </div>

            {/* Middle: name + team */}
            <div className="min-w-0">
              <h3
                className={cn(
                  'truncate font-medium tracking-[-0.01em] text-white',
                  isHero ? 'text-[18px]' : 'text-[16px]'
                )}
              >
                {driver.name}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-white/80">
                <span className={cn('size-1.5 rounded-full', `bg-f1-${colorClass}`)} aria-hidden />
                <span className="truncate">{driver.team}</span>
              </div>
            </div>

            {/* Bottom: points + stats row (inside the card via bordered top) */}
            <div className="flex items-end justify-between border-t border-white/[0.04] pt-3">
              <div className="flex items-baseline gap-1.5">
                <span className={cn(CARD_DATA_VALUE, isHero ? 'text-[20px]' : 'text-[18px]')}>
                  {driver.points}
                </span>
                <span className="text-[11px] text-white/80">pts</span>
                <PointsChange change={driver.points_change} size="md" className="ml-1" />
              </div>

              <div className="flex items-center gap-3 font-mono text-[12px] tabular-nums text-white/80">
                <span>
                  <span className="text-white">{driver.wins}</span>W
                </span>
                <span className="text-white/50">·</span>
                <span>
                  <span className="text-white">{driver.podiums}</span>P
                </span>
              </div>
            </div>
          </div>

          {/* Right: portrait column — torso crop via object-top */}
          <div
            className={cn(
              'relative shrink-0 border-l border-white/[0.04]',
              isHero ? 'w-[120px]' : 'w-[96px]'
            )}
          >
            {/* Subtle team-color wash behind the portrait */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                background: `linear-gradient(to top, var(--color-f1-${colorClass}), transparent 70%)`,
              }}
              aria-hidden
            />

            {driverImage ? (
              <Avatar
                className={cn(
                  'absolute inset-0 size-full rounded-none border-0',
                  'transition-transform duration-300 ease-out group-hover:scale-[1.02]'
                )}
              >
                <AvatarImage src={driverImage} alt="" className="object-cover object-top" />
                <AvatarFallback className="rounded-none bg-transparent font-mono text-[14px] font-medium text-white/40">
                  {driver.code}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-mono text-[14px] font-medium text-white/40">
                  {driver.code}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </m.div>
  );
};

import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import type { TeamStanding } from '@/lib/api';
import { getCarImage } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getTeamLogo } from '@/lib/teamUtils';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER, CARD_LABEL, CARD_DATA_VALUE } from '@/lib/card-styles';
import { PointsChange } from './PointsChange';

const teamSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

interface TeamStandingsCardProps {
  team: TeamStanding;
  year: number;
  variant: 'hero' | 'regular';
  /** Shown on the P1 hero card only. */
  leaderLabel?: string;
  /** Highlight for the user's favourite team. */
  isFavorite?: boolean;
  delay?: number;
}

/**
 * Horizontal team card — mirrors DriverStandingsCard but with a team logo
 * chip on the left and a car image in the right column.
 *
 * Links to /teams/<slug>.
 */
export const TeamStandingsCard: React.FC<TeamStandingsCardProps> = ({
  team,
  year,
  variant,
  leaderLabel,
  isFavorite,
  delay = 0,
}) => {
  const colorClass = getTeamColorClass(team.team);
  const isHero = variant === 'hero';
  const isP1 = isHero && team.rank === 1;
  const logo = getTeamLogo(team.team);
  const carImage = getCarImage(team.team, year);

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
    >
      <Link
        to={`/teams/${teamSlug(team.team)}`}
        aria-label={`${team.team} — P${team.rank}, ${team.points} points`}
        className={cn(
          CARD_CONTAINER,
          'group relative block overflow-hidden transition-colors',
          'hover:border-white/[0.08] focus-visible:outline-none focus-visible:border-white/[0.12]',
          isHero && 'border-white/[0.08]',
          isP1 && 'border-white/[0.12]'
        )}
      >
        {/* Team color accent strip — top edge */}
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
              <span className={cn(CARD_LABEL, 'font-mono tabular-nums')}>P{team.rank}</span>

              <div className="flex flex-wrap items-center gap-2">
                {isP1 && leaderLabel && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-400">
                    <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                    {leaderLabel}
                  </span>
                )}
                {isFavorite && <span className="text-[12px] font-medium text-red-400">★</span>}
              </div>
            </div>

            {/* Middle: logo + team name */}
            <div className="flex min-w-0 items-center gap-3">
              {logo && (
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded border border-white/[0.06]',
                    isHero ? 'size-10' : 'size-9'
                  )}
                >
                  <img
                    src={logo}
                    alt=""
                    aria-hidden
                    className={cn('object-contain', isHero ? 'size-7' : 'size-6')}
                  />
                </div>
              )}
              <h3
                className={cn(
                  'truncate font-medium tracking-[-0.01em] text-white',
                  isHero ? 'text-[18px]' : 'text-[16px]'
                )}
              >
                {team.team}
              </h3>
            </div>

            {/* Bottom: points + stats */}
            <div className="flex items-end justify-between border-t border-white/[0.04] pt-3">
              <div className="flex items-baseline gap-1.5">
                <span className={cn(CARD_DATA_VALUE, isHero ? 'text-[20px]' : 'text-[18px]')}>
                  {team.points}
                </span>
                <span className="text-[11px] text-white/80">pts</span>
                <PointsChange change={team.points_change} size="md" className="ml-1" />
              </div>

              <div className="flex items-center gap-3 font-mono text-[12px] tabular-nums text-white/80">
                <span>
                  <span className="text-white">{team.wins}</span>W
                </span>
                <span className="text-white/50">·</span>
                <span>
                  <span className="text-white">{team.podiums}</span>P
                </span>
              </div>
            </div>
          </div>

          {/* Right: car image column */}
          <div
            className={cn(
              'relative shrink-0 border-l border-white/[0.04]',
              isHero ? 'w-[160px]' : 'w-[120px]'
            )}
          >
            {/* Subtle team-color wash */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                background: `linear-gradient(to left, var(--color-f1-${colorClass}), transparent 80%)`,
              }}
              aria-hidden
            />

            {carImage ? (
              <img
                src={carImage}
                alt=""
                aria-hidden
                loading="eager"
                className={cn(
                  'absolute right-0 top-1/2 w-full max-w-none -translate-y-1/2 object-contain [mix-blend-mode:lighten]',
                  'transition-transform duration-300 ease-out',
                  'group-hover:translate-x-[-2px] group-hover:-translate-y-1/2'
                )}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-mono text-[14px] font-medium text-white/40">
                  {team.team.substring(0, 3).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </m.div>
  );
};

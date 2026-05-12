import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchTeamStandings, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { CARD_CONTAINER, CARD_GAP } from '@/lib/card-styles';
import { SEO } from '@/components/layout/SEO';

const teamSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

/**
 * Teams — directory page listing every constructor in the selected season.
 * Backed by the existing team-standings data so we avoid an extra endpoint.
 */
const Teams = () => {
  const { selectedYear } = useSeason();
  const { data: teams = [], isLoading } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  return (
    <>
      <SEO title="Teams" description={`All F1 constructors for the ${selectedYear} season.`} />

      <div className="mb-8">
        <h1 className="text-[20px] font-semibold tracking-tight text-white">Teams</h1>
        <p className="mt-0.5 text-[12px] text-white/80">
          Explore every constructor in the {selectedYear} championship
        </p>
      </div>

      {isLoading ? (
        <div className={`grid ${CARD_GAP} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`h-28 animate-pulse ${CARD_CONTAINER}`} />
          ))}
        </div>
      ) : (
        <div className={`grid ${CARD_GAP} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
          {teams.map((team, i) => {
            const logo = getTeamLogo(team.team);
            return (
              <m.div
                key={team.team}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <Link
                  to={`/teams/${teamSlug(team.team)}`}
                  className={`${CARD_CONTAINER} flex items-center gap-3 p-4 transition-colors hover:border-white/[0.08]`}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded border border-white/[0.06] bg-white/[0.02] p-2">
                    {logo ? (
                      <img src={logo} alt={team.team} className="size-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-medium text-white/80">
                        {team.team.substring(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-white">{team.team}</div>
                    <div className="truncate text-[12px] text-white/80">
                      {team.wins} {team.wins === 1 ? 'win' : 'wins'} · {team.podiums}{' '}
                      {team.podiums === 1 ? 'podium' : 'podiums'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[13px] tabular-nums text-white">
                      P{team.rank}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-white/80">
                      {team.points} pts
                    </div>
                  </div>
                </Link>
              </m.div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Teams;

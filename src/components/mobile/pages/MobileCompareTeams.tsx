import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Cancel01Icon, GitCompareIcon, PlusSignIcon, Search01Icon } from 'hugeicons-react';
import {
  fetchTeamCareer,
  fetchTeamStandings,
  fetchGlobalSearch,
  TeamCareer,
  SearchResultTeam,
} from '@/lib/api';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getTeamSlug, getTeamLogo } from '@/lib/teamUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const MAX_TEAMS = 3;

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.04] bg-[#0a0a0a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="mb-3 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-white/10" />
            </div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-white/30 transition-colors active:text-white/60"
              >
                <Cancel01Icon className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function MobileCompareTeams() {
  const { selectedYear } = useSeason();
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: standings = [] } = useQuery({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
    staleTime: 1000 * 60 * 60,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => fetchGlobalSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60,
  });

  const searchTeams = useMemo(
    () => (searchResults?.teams ?? []).filter((t) => !selected.includes(t.id)),
    [searchResults, selected]
  );

  const quickPicks = useMemo(
    () => standings.filter((t) => !selected.includes(getTeamSlug(t.team))).slice(0, 10),
    [standings, selected]
  );

  const { data: careers, isLoading: careersLoading } = useQuery<TeamCareer[]>({
    queryKey: ['compareTeamsCareers', selected],
    queryFn: async () => {
      const results = await Promise.all(selected.map((slug) => fetchTeamCareer(slug)));
      return results;
    },
    enabled: selected.length >= 2,
  });

  const careerMap = useMemo(() => {
    const map = new Map<string, TeamCareer>();
    (careers ?? []).forEach((c) => map.set(c.constructorId, c));
    return map;
  }, [careers]);

  const allSeasons = useMemo(() => {
    if (!careers || careers.length === 0) return [];
    const set = new Set<number>();
    careers.forEach((c) => c.seasons.forEach((s) => set.add(s.season)));
    return Array.from(set).sort((a, b) => b - a);
  }, [careers]);

  const summaryRows: { label: string; get: (c: TeamCareer) => string }[] = [
    { label: 'Seasons', get: (c) => String(c.careerSummary.seasons) },
    { label: 'Races', get: (c) => String(c.careerSummary.races) },
    { label: 'Wins', get: (c) => String(c.careerSummary.wins) },
    { label: 'Podiums', get: (c) => String(c.careerSummary.podiums) },
    { label: 'Poles', get: (c) => String(c.careerSummary.poles) },
    { label: 'WCC Titles', get: (c) => String(c.careerSummary.constructorsChampionships) },
    { label: 'Points', get: (c) => c.careerSummary.points.toLocaleString() },
  ];

  const toggleTeam = (slug: string) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_TEAMS) return prev;
      return [...prev, slug];
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sticky logo header */}
      <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pt-3 pb-2 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4 pb-24">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.01em] text-white">Compare Teams</h1>
          <p className="mt-0.5 text-[12px] text-white/40">
            Select 2-3 teams to compare career stats side-by-side
          </p>
        </div>

        {/* Selected chips */}
        <div className="flex flex-wrap gap-2">
          {selected.map((slug) => {
            const career = careerMap.get(slug);
            const logo = career ? getTeamLogo(career.name) : null;
            return (
              <div
                key={slug}
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pr-2 pl-1.5"
              >
                {logo ? (
                  <img src={logo} alt="" className="h-5 w-8 object-contain" />
                ) : (
                  <span className="font-mono text-[10px] text-white/40">
                    {(career?.name ?? slug).slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[120px] truncate text-[12px] font-medium text-white">
                  {career?.name ?? slug}
                </span>
                <button
                  onClick={() => toggleTeam(slug)}
                  className="text-white/30 transition-colors active:text-white/70"
                  aria-label={`Remove ${slug}`}
                >
                  <Cancel01Icon className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add team */}
        {selected.length < MAX_TEAMS && (
          <button
            onClick={() => setPickerOpen(true)}
            className={cn(
              CARD_CONTAINER,
              'flex w-full items-center justify-center gap-2 border-dashed py-4 text-[13px] font-medium text-white/50 transition-colors active:scale-[0.98] active:text-white/80'
            )}
          >
            <PlusSignIcon className="size-4" />
            Add team
          </button>
        )}

        {/* Empty state */}
        {selected.length < 2 && (
          <div className={`${CARD_CONTAINER} flex flex-col items-center px-4 py-14 text-center`}>
            <GitCompareIcon className="mb-3 size-8 text-white/20" />
            <p className="text-[14px] font-medium text-white/60">
              {selected.length === 0 ? 'Pick 2-3 teams to begin' : 'Add one more team to compare'}
            </p>
            <p className="mt-1 text-[12px] text-white/40">
              Career wins, podiums, poles, constructors titles and season records
            </p>
          </div>
        )}

        {/* Comparison */}
        {selected.length >= 2 && (
          <>
            {careersLoading || (careers ?? []).length !== selected.length ? (
              <div className="space-y-3">
                <div className={`${CARD_CONTAINER} h-40 animate-pulse`} />
                <div className={`${CARD_CONTAINER} h-64 animate-pulse`} />
              </div>
            ) : (
              <>
                {/* Career summary */}
                <div className={`${CARD_CONTAINER} overflow-hidden`}>
                  <div className="border-b border-white/[0.04] px-4 py-3">
                    <span className={CARD_LABEL}>Career Totals</span>
                  </div>
                  <div className="divide-y divide-white/[0.03]">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="flex items-center gap-2 px-4 py-2.5">
                        <span className="w-24 shrink-0 text-[11px] text-white/40">{row.label}</span>
                        <div
                          className="grid flex-1 gap-2"
                          style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}
                        >
                          {selected.map((slug) => {
                            const career = careerMap.get(slug);
                            const values = careers!.map((c) => row.get(c));
                            const best = Math.max(...values.map(Number));
                            const isBest = career ? Number(row.get(career)) === best : false;
                            return (
                              <span
                                key={slug}
                                className={cn(
                                  'text-right font-mono text-[13px] tabular-nums',
                                  isBest ? 'font-semibold text-white' : 'text-white/50'
                                )}
                              >
                                {career ? row.get(career) : '—'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Season-by-season */}
                <div className={`${CARD_CONTAINER} overflow-hidden`}>
                  <div className="border-b border-white/[0.04] px-4 py-3">
                    <span className={CARD_LABEL}>Season by Season</span>
                  </div>
                  <div className="divide-y divide-white/[0.03]">
                    {allSeasons.map((season) => (
                      <div key={season} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 shrink-0 font-mono text-[12px] text-white/30">
                            {season}
                          </span>
                          <div
                            className="grid flex-1 gap-2"
                            style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}
                          >
                            {selected.map((slug) => {
                              const career = careerMap.get(slug);
                              const s = career?.seasons.find((x) => x.season === season);
                              return (
                                <Link
                                  key={slug}
                                  to={`/teams/${slug}`}
                                  className="rounded-md border border-white/[0.03] bg-white/[0.02] px-2 py-1.5 active:bg-white/[0.04]"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        'h-3 w-0.5 shrink-0 rounded-full',
                                        `bg-f1-${getTeamColorClass(career?.name)}`
                                      )}
                                    />
                                    <span className="truncate text-[11px] text-white/70">
                                      {s ? s.drivers.join(' / ') : '—'}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                    <span className="font-mono text-[13px] font-semibold tabular-nums text-white">
                                      {s ? s.points : '—'}
                                    </span>
                                    {s?.position && (
                                      <span className="text-[10px] text-white/40">
                                        P{s.position}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Picker bottom sheet */}
      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add teams">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <Search01Icon className="size-4 shrink-0 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any F1 team…"
              className="w-full bg-transparent text-[13px] text-white placeholder-white/30 outline-none"
            />
          </div>

          {query.trim().length >= 2 ? (
            <div className="divide-y divide-white/[0.03]">
              {searchTeams.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-white/40">No teams found</p>
              ) : (
                searchTeams.slice(0, 8).map((team: SearchResultTeam) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      toggleTeam(team.id);
                      setPickerOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-colors active:bg-white/[0.03]"
                  >
                    {getTeamLogo(team.name) ? (
                      <img
                        src={getTeamLogo(team.name)!}
                        alt=""
                        className="h-5 w-8 shrink-0 object-contain"
                      />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] font-mono text-[10px] text-white/40">
                        {team.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                      {team.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
                {selectedYear} grid
              </p>
              <div className="divide-y divide-white/[0.03]">
                {quickPicks.map((team) => (
                  <button
                    key={team.team}
                    onClick={() => {
                      toggleTeam(getTeamSlug(team.team));
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-colors active:bg-white/[0.03]"
                  >
                    {getTeamLogo(team.team) ? (
                      <img
                        src={getTeamLogo(team.team)!}
                        alt=""
                        className="h-5 w-8 shrink-0 object-contain"
                      />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] font-mono text-[10px] text-white/40">
                        {team.team.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                      {team.team}
                    </span>
                    <span className="font-mono text-[10px] text-white/30">P{team.rank}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

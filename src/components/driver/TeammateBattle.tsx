import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchTeammateBattle, type TeammateBattleEntry } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER, CARD_LABEL, CARD_PADDING } from '@/lib/card-styles';

type ViewMode = 'overall' | 'season-wise';

interface Props {
  driverCode: string;
  driverName: string;
  slug: string;
}

export function TeammateBattle({ driverCode, driverName, slug }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('overall');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teammateBattle', slug],
    queryFn: () => fetchTeammateBattle(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className={cn(CARD_CONTAINER, CARD_PADDING, 'flex items-center justify-center py-16')}>
        <p className="text-[13px] italic text-white">Loading teammate comparisons…</p>
      </div>
    );
  }

  if (isError || !data || !data.battles.length) {
    return (
      <div className={cn(CARD_CONTAINER, CARD_PADDING, 'flex items-center justify-center py-16')}>
        <p className="text-[13px] italic text-white">No teammate data available.</p>
      </div>
    );
  }

  const displayBattles = getDisplayBattles(data.battles, viewMode);

  return (
    <div className="space-y-5">
      <CareerTimeline battles={data.battles} />

      <ViewFilter mode={viewMode} onChange={setViewMode} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayBattles.map((battle) => (
          <TeammateCard
            key={`${battle.teammate.slug}-${battle.seasons.join('-')}`}
            battle={battle}
            driverCode={driverCode}
            driverName={driverName}
            showSeasonBreakdown={viewMode === 'overall' && battle.seasons.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

function getDisplayBattles(battles: TeammateBattleEntry[], mode: ViewMode): TeammateBattleEntry[] {
  if (mode === 'overall') return battles;

  const seasonCards = battles.flatMap((battle) =>
    battle.perSeason.map((season) => ({
      ...battle,
      team: season.team,
      teamColor: season.teamColor,
      seasons: [season.year],
      racesTogether: season.races,
      qualiH2h: season.qualiH2h,
      raceH2h: season.raceH2h,
      points: season.points,
      wins: season.wins ?? { driver: 0, teammate: 0 },
      podiums: season.podiums ?? { driver: 0, teammate: 0 },
      championshipPositionsWon: { driver: 0, teammate: 0 },
      perSeason: [season],
    }))
  );

  return seasonCards.sort((a, b) => b.seasons[0] - a.seasons[0]);
}

function ViewFilter({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      {(['overall', 'season-wise'] as ViewMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
            mode === m ? 'bg-white text-black' : 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
          )}
        >
          {m === 'overall' ? 'Overall' : 'Season-wise'}
        </button>
      ))}
    </div>
  );
}

function TeammateCard({
  battle,
  driverCode,
  driverName,
  showSeasonBreakdown,
}: {
  battle: TeammateBattleEntry;
  driverCode: string;
  driverName: string;
  showSeasonBreakdown?: boolean;
}) {
  const teamLogo = getTeamLogo(battle.team);
  const latestYear = battle.seasons[battle.seasons.length - 1] ?? 2026;
  const driverImg = getDriverImage(driverCode, latestYear);
  const teammateImg = getDriverImage(battle.teammate.code, latestYear);
  const driverLastName = driverName.split(' ').pop() || driverCode;
  const teammateLastName = battle.teammate.name.split(' ').pop() || battle.teammate.code;

  const totalRaces = battle.racesTogether;
  const qualiTotal = battle.qualiH2h.driver + battle.qualiH2h.teammate;
  const raceTotal = battle.raceH2h.driver + battle.raceH2h.teammate;
  const pointsTotal = battle.points.driver + battle.points.teammate;

  // Defensive defaults for cached responses that predate the wins/podiums fields.
  const wins = battle.wins ?? { driver: 0, teammate: 0 };
  const podiums = battle.podiums ?? { driver: 0, teammate: 0 };
  const perSeason = battle.perSeason.map((season) => ({
    ...season,
    wins: season.wins ?? { driver: 0, teammate: 0 },
    podiums: season.podiums ?? { driver: 0, teammate: 0 },
  }));

  return (
    <div className={cn(CARD_CONTAINER, 'overflow-hidden p-4')}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.04] pb-3">
        <div className="flex items-center gap-2.5">
          {teamLogo ? (
            <img src={teamLogo} alt="" className="h-5 w-5 object-contain" />
          ) : (
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: battle.teamColor }}
            />
          )}
          <span className="text-[13px] font-semibold text-white">{battle.team}</span>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-medium text-white">
            {battle.seasons.length === 1
              ? battle.seasons[0]
              : `${battle.seasons[0]}–${battle.seasons[battle.seasons.length - 1]}`}
          </div>
          <div className="text-[10px] font-normal uppercase tracking-wider text-white">
            {totalRaces} race{totalRaces !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Drivers */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <DriverBadge img={driverImg} name={driverLastName} highlight />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white">vs</span>
        <DriverBadge img={teammateImg} name={teammateLastName} />
      </div>

      {/* Stat grid */}
      <div className="mb-4 grid grid-cols-5 gap-1">
        <StatBlock label="Q" driver={battle.qualiH2h.driver} teammate={battle.qualiH2h.teammate} />
        <StatBlock label="R" driver={battle.raceH2h.driver} teammate={battle.raceH2h.teammate} />
        <StatBlock
          label="Pts"
          driver={battle.points.driver}
          teammate={battle.points.teammate}
          points
        />
        <StatBlock label="W" driver={wins.driver} teammate={wins.teammate} />
        <StatBlock label="Pod" driver={podiums.driver} teammate={podiums.teammate} />
      </div>

      {/* Progress bars */}
      <div className="space-y-2">
        {qualiTotal > 0 && (
          <StatBar
            label="Q"
            driverWins={battle.qualiH2h.driver}
            teammateWins={battle.qualiH2h.teammate}
            teamColor={battle.teamColor}
          />
        )}
        {raceTotal > 0 && (
          <StatBar
            label="R"
            driverWins={battle.raceH2h.driver}
            teammateWins={battle.raceH2h.teammate}
            teamColor={battle.teamColor}
          />
        )}
        {pointsTotal > 0 && (
          <StatBar
            label="Pts"
            driverWins={battle.points.driver}
            teammateWins={battle.points.teammate}
            teamColor={battle.teamColor}
            points
          />
        )}
        {wins.driver + wins.teammate > 0 && (
          <StatBar
            label="W"
            driverWins={wins.driver}
            teammateWins={wins.teammate}
            teamColor={battle.teamColor}
          />
        )}
        {podiums.driver + podiums.teammate > 0 && (
          <StatBar
            label="Pod"
            driverWins={podiums.driver}
            teammateWins={podiums.teammate}
            teamColor={battle.teamColor}
          />
        )}
      </div>

      {/* Championship summary */}
      {battle.championshipPositionsWon.driver > 0 ||
      battle.championshipPositionsWon.teammate > 0 ? (
        <div className="mt-3 rounded-md bg-white/[0.02] px-3 py-2">
          <p className="text-[11px] text-white">
            {battle.championshipPositionsWon.driver === battle.championshipPositionsWon.teammate ? (
              <>
                <span className="italic">tied in championship</span>{' '}
                <span className="font-bold">
                  {battle.championshipPositionsWon.driver}–
                  {battle.championshipPositionsWon.teammate}
                </span>
              </>
            ) : battle.championshipPositionsWon.driver >
              battle.championshipPositionsWon.teammate ? (
              <>
                <span className="font-semibold">{driverLastName}</span>{' '}
                <span className="italic">ahead in championship</span>{' '}
                <span className="font-bold">
                  {battle.championshipPositionsWon.driver}–
                  {battle.championshipPositionsWon.teammate}
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">{battle.teammate.name.split(' ').pop()}</span>{' '}
                <span className="italic">ahead in championship</span>{' '}
                <span className="font-bold">
                  {battle.championshipPositionsWon.teammate}–
                  {battle.championshipPositionsWon.driver}
                </span>
              </>
            )}
          </p>
        </div>
      ) : null}

      {/* Per-season breakdown */}
      {showSeasonBreakdown && battle.perSeason.length > 0 && (
        <div className="mt-3 border-t border-white/[0.04] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
              Season Breakdown
            </span>
            <span className="text-[10px] italic text-white">{driverLastName} first</span>
          </div>
          <div className="grid gap-1">
            <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_1fr] gap-1 px-1 text-[10px] uppercase tracking-wider text-white">
              <span className="italic">Year</span>
              <span className="text-center italic">Q</span>
              <span className="text-center italic">R</span>
              <span className="text-center italic">Pts</span>
              <span className="text-center italic">W</span>
              <span className="text-center italic">Pod</span>
            </div>
            {perSeason.map((season) => (
              <SeasonRow key={season.year} season={season} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DriverBadge({
  img,
  name,
  highlight,
}: {
  img: string | null;
  name: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div
        className={cn(
          'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 bg-white/[0.04] sm:h-16 sm:w-16',
          highlight ? 'border-white/20' : 'border-white/[0.06]'
        )}
      >
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover object-top" />
        ) : (
          <span className="text-[14px] font-bold text-white sm:text-[16px]">
            {name.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="text-[12px] font-bold leading-tight text-white">{name}</div>
    </div>
  );
}

function StatBlock({
  label,
  driver,
  teammate,
  points,
}: {
  label: string;
  driver: number;
  teammate: number;
  points?: boolean;
}) {
  const driverWins = driver > teammate;
  const teammateWins = teammate > driver;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white/[0.02] px-0.5 py-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-white">{label}</span>
      <div className="mt-0.5 flex items-center gap-0.5">
        <span
          className={cn(
            'tabular-nums transition-all',
            driverWins
              ? 'text-[16px] font-extrabold text-white sm:text-[18px]'
              : 'text-[11px] font-normal text-white/80 sm:text-[12px]'
          )}
        >
          {points ? driver.toLocaleString() : driver}
        </span>
        <span className="text-[10px] font-light text-white">–</span>
        <span
          className={cn(
            'tabular-nums transition-all',
            teammateWins
              ? 'text-[16px] font-extrabold text-white sm:text-[18px]'
              : 'text-[11px] font-normal text-white/80 sm:text-[12px]'
          )}
        >
          {points ? teammate.toLocaleString() : teammate}
        </span>
      </div>
    </div>
  );
}

function StatBar({
  label,
  driverWins,
  teammateWins,
  teamColor,
  points,
}: {
  label: string;
  driverWins: number;
  teammateWins: number;
  teamColor: string;
  points?: boolean;
}) {
  const total = driverWins + teammateWins;
  if (total === 0) return null;

  const driverPct = Math.round((driverWins / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-[10px] font-semibold uppercase tracking-wider text-white">
        {label}
      </span>
      <span className="w-8 text-right text-[11px] tabular-nums font-semibold text-white">
        {points ? driverWins.toLocaleString() : driverWins}
      </span>
      <div className="flex flex-1 gap-0.5">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${driverPct}%`,
              backgroundColor: driverPct >= 50 ? teamColor : '#52525b',
            }}
          />
        </div>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${100 - driverPct}%`,
              backgroundColor: driverPct <= 50 ? teamColor : '#52525b',
            }}
          />
        </div>
      </div>
      <span className="w-8 text-left text-[11px] tabular-nums font-normal text-white">
        {points ? teammateWins.toLocaleString() : teammateWins}
      </span>
    </div>
  );
}

function SeasonRow({ season }: { season: TeammateBattleEntry['perSeason'][number] }) {
  return (
    <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_1fr] gap-1 rounded-md bg-white/[0.02] px-1 py-1.5 text-[11px] sm:text-[12px]">
      <span className="font-bold tabular-nums text-white">{season.year}</span>
      <span className="text-center font-medium tabular-nums text-white">
        {season.qualiH2h.driver}–{season.qualiH2h.teammate}
      </span>
      <span className="text-center font-medium tabular-nums text-white">
        {season.raceH2h.driver}–{season.raceH2h.teammate}
      </span>
      <span className="text-center font-medium tabular-nums text-white">
        {season.points.driver}–{season.points.teammate}
      </span>
      <span className="text-center font-medium tabular-nums text-white">
        {season.wins.driver}–{season.wins.teammate}
      </span>
      <span className="text-center font-medium tabular-nums text-white">
        {season.podiums.driver}–{season.podiums.teammate}
      </span>
    </div>
  );
}

function CareerTimeline({ battles }: { battles: TeammateBattleEntry[] }) {
  const allItems = battles
    .flatMap((b) =>
      b.seasons.map((year) => ({
        year,
        teammateName: b.teammate.name.split(' ').pop() || b.teammate.code,
        team: b.team,
        teamColor: b.teamColor,
      }))
    )
    .sort((a, b) => a.year - b.year);

  if (allItems.length < 2) return null;

  return (
    <div className={cn(CARD_CONTAINER, CARD_PADDING)}>
      <span className={CARD_LABEL}>Teammate Timeline</span>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {allItems.map((item, i) => (
          <div key={`${item.year}-${item.teammateName}`} className="flex items-center gap-2">
            {i > 0 && <span className="font-light text-white">→</span>}
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
              style={{
                borderColor: `${item.teamColor}30`,
                backgroundColor: `${item.teamColor}10`,
              }}
            >
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: item.teamColor }}
              />
              <span className="text-[11px] font-medium tabular-nums text-white">{item.year}</span>
              <span className="text-[11px] font-normal text-white">{item.teammateName}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

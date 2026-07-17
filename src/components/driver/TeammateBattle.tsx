import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { fetchTeammateBattle, type TeammateBattleEntry } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER, CARD_LABEL, CARD_PADDING } from '@/lib/card-styles';

interface Props {
  driverCode: string;
  driverName: string;
  slug: string;
}

export function TeammateBattle({ driverCode, driverName, slug }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teammateBattle', slug],
    queryFn: () => fetchTeammateBattle(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className={cn(CARD_CONTAINER, CARD_PADDING, 'flex items-center justify-center py-16')}>
        <p className="text-[13px] text-white/40">Loading teammate comparisons…</p>
      </div>
    );
  }

  if (isError || !data || !data.battles.length) {
    return (
      <div className={cn(CARD_CONTAINER, CARD_PADDING, 'flex items-center justify-center py-16')}>
        <p className="text-[13px] text-white/40">No teammate data available.</p>
      </div>
    );
  }

  const battles = data.battles;

  return (
    <div className="space-y-5">
      {battles.map((battle, idx) => (
        <TeammateCard
          key={battle.teammate.slug}
          battle={battle}
          driverCode={driverCode}
          driverName={driverName}
          isCurrent={idx === 0}
        />
      ))}

      <CareerTimeline battles={battles} driverCode={driverCode} />
    </div>
  );
}

function TeammateCard({
  battle,
  driverCode,
  driverName,
  isCurrent,
}: {
  battle: TeammateBattleEntry;
  driverCode: string;
  driverName: string;
  isCurrent: boolean;
}) {
  const [expanded, setExpanded] = useState(isCurrent);
  const teamLogo = getTeamLogo(battle.team);
  const latestYear = battle.seasons[battle.seasons.length - 1] ?? 2026;
  const driverImg = getDriverImage(driverCode, latestYear);
  const teammateImg = getDriverImage(battle.teammate.code, latestYear);

  const qualWinPct =
    battle.qualiH2h.driver + battle.qualiH2h.teammate > 0
      ? Math.round(
          (battle.qualiH2h.driver / (battle.qualiH2h.driver + battle.qualiH2h.teammate)) * 100
        )
      : 50;
  const raceWinPct =
    battle.raceH2h.driver + battle.raceH2h.teammate > 0
      ? Math.round(
          (battle.raceH2h.driver / (battle.raceH2h.driver + battle.raceH2h.teammate)) * 100
        )
      : 50;

  return (
    <div className={cn(CARD_CONTAINER, 'overflow-hidden')}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.01]"
      >
        {/* Team badge */}
        <div className="flex shrink-0 items-center gap-2">
          {teamLogo ? (
            <img src={teamLogo} alt="" className="h-5 w-5 object-contain opacity-60" />
          ) : (
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: battle.teamColor }}
            />
          )}
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            {battle.team}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* Quick stats */}
          <span className="text-[12px] tabular-nums text-white/60">
            Q <span className="text-white">{battle.qualiH2h.driver}</span>
            <span className="text-white/20">–</span>
            <span className="text-white/40">{battle.qualiH2h.teammate}</span>
          </span>
          <span className="text-[12px] tabular-nums text-white/60">
            R <span className="text-white">{battle.raceH2h.driver}</span>
            <span className="text-white/20">–</span>
            <span className="text-white/40">{battle.raceH2h.teammate}</span>
          </span>
          <span className="text-[12px] tabular-nums text-white/60">
            <span className="text-white">{battle.points.driver}</span>
            <span className="text-white/20">–</span>
            <span className="text-white/40">{battle.points.teammate}</span>
            <span className="ml-0.5 text-white/40">pts</span>
          </span>
        </div>

        <Chevron expanded={expanded} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.04] px-5 pb-5 pt-4">
              {/* Face-off */}
              <div className="mb-5 flex items-center gap-3">
                <DriverBadge
                  img={driverImg}
                  code={driverCode}
                  name={driverName.split(' ').pop() || driverCode}
                  side="left"
                />
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex flex-1 flex-col items-end">
                    <span className="text-[11px] font-medium text-white/30">Qualifying</span>
                    <span className="text-[13px] font-semibold tabular-nums text-white">
                      {battle.qualiH2h.driver}
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-white/15">vs</span>
                  <div className="flex flex-1 flex-col items-start">
                    <span className="text-[11px] font-medium text-white/30">Qualifying</span>
                    <span className="text-[13px] font-semibold tabular-nums text-white/50">
                      {battle.qualiH2h.teammate}
                    </span>
                  </div>
                </div>
                <DriverBadge
                  img={teammateImg}
                  code={battle.teammate.code}
                  name={battle.teammate.name.split(' ').pop() || ''}
                  side="right"
                />
              </div>

              {/* Dominance bars */}
              <div className="mb-5 space-y-2.5">
                <StatBar
                  label="Qualifying"
                  driverWins={battle.qualiH2h.driver}
                  teammateWins={battle.qualiH2h.teammate}
                  teamColor={battle.teamColor}
                  pct={qualWinPct}
                />
                <StatBar
                  label="Races"
                  driverWins={battle.raceH2h.driver}
                  teammateWins={battle.raceH2h.teammate}
                  teamColor={battle.teamColor}
                  pct={raceWinPct}
                />
                <StatBar
                  label="Points"
                  driverWins={battle.points.driver}
                  teammateWins={battle.points.teammate}
                  teamColor={battle.teamColor}
                  points
                />
              </div>

              {/* Summary line */}
              <p className="mb-4 text-[13px] leading-relaxed text-white/50">
                Across{' '}
                <span className="font-semibold text-white">{battle.racesTogether} races</span> in{' '}
                <span className="font-medium text-white">{battle.seasons.length} seasons</span>
                {battle.championshipPositionsWon.driver >
                battle.championshipPositionsWon.teammate ? (
                  <span>
                    . <span className="text-white">{driverCode}</span> finished ahead in the
                    championship{' '}
                    <span className="font-semibold text-white">
                      {battle.championshipPositionsWon.driver}
                    </span>
                    <span className="text-white/20">–</span>
                    <span className="text-white/40">
                      {battle.championshipPositionsWon.teammate}
                    </span>
                    .
                  </span>
                ) : battle.championshipPositionsWon.teammate >
                  battle.championshipPositionsWon.driver ? (
                  <span>
                    . <span className="text-white">{battle.teammate.code}</span> finished ahead in
                    the championship{' '}
                    <span className="font-semibold text-white">
                      {battle.championshipPositionsWon.teammate}
                    </span>
                    <span className="text-white/20">–</span>
                    <span className="text-white/40">{battle.championshipPositionsWon.driver}</span>.
                  </span>
                ) : (
                  <span>. Even in championship finishes.</span>
                )}
              </p>

              {/* Per-season breakdown */}
              {battle.perSeason.length > 0 && (
                <div className="border-t border-white/[0.04] pt-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Season Breakdown
                  </span>
                  <div className="mt-3 space-y-1.5">
                    {battle.perSeason.map((s) => (
                      <SeasonRow key={s.year} season={s} driverCode={driverCode} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DriverBadge({
  img,
  code,
  name,
  side,
}: {
  img: string | null;
  code: string;
  name: string;
  side: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2.5',
        side === 'right' && 'flex-row-reverse text-right'
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.04]">
        {img ? (
          <img src={img} alt={code} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[14px] font-bold text-white/20">{code}</span>
        )}
      </div>
      <div>
        <div className="text-[13px] font-semibold tabular-nums text-white">{code}</div>
        <div className="text-[10px] text-white/30">{name}</div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  driverWins,
  teammateWins,
  teamColor,
  pct,
  points,
}: {
  label: string;
  driverWins: number;
  teammateWins: number;
  teamColor: string;
  pct?: number;
  points?: boolean;
}) {
  const total = driverWins + teammateWins;
  if (total === 0) return null;

  const driverPct = points ? Math.round((driverWins / total) * 100) : (pct ?? 50);

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[11px] font-medium text-white/40">{label}</span>
      <div className="flex flex-1 items-center gap-2">
        <span className="w-8 text-right text-[12px] tabular-nums font-semibold text-white">
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
        <span className="w-8 text-left text-[12px] tabular-nums text-white/40">
          {points ? teammateWins.toLocaleString() : teammateWins}
        </span>
      </div>
    </div>
  );
}

function SeasonRow({
  season,
  driverCode,
}: {
  season: TeammateBattleEntry['perSeason'][number];
  driverCode: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-white/[0.02]">
      <span className="w-10 shrink-0 text-[13px] font-semibold tabular-nums text-white">
        {season.year}
      </span>
      <span className="w-24 shrink-0 text-[11px] text-white/40">{season.team}</span>
      <div className="flex flex-1 items-center gap-4 text-[12px]">
        <span className="tabular-nums">
          <span className="font-medium text-white">{season.qualiH2h.driver}</span>
          <span className="text-white/20">–</span>
          <span className="text-white/30">{season.qualiH2h.teammate}</span>
          <span className="ml-1 text-white/30">Q</span>
        </span>
        <span className="tabular-nums">
          <span className="font-medium text-white">{season.raceH2h.driver}</span>
          <span className="text-white/20">–</span>
          <span className="text-white/30">{season.raceH2h.teammate}</span>
          <span className="ml-1 text-white/30">R</span>
        </span>
        <span className="tabular-nums text-white/40">
          <span className="text-white">{season.points.driver}</span>
          <span className="text-white/20">–</span>
          <span className="text-white/30">{season.points.teammate}</span>
          <span className="ml-0.5 text-white/30">pts</span>
        </span>
      </div>
    </div>
  );
}

function CareerTimeline({
  battles,
  driverCode,
}: {
  battles: TeammateBattleEntry[];
  driverCode: string;
}) {
  const allItems = battles
    .flatMap((b) =>
      b.seasons.map((year) => ({
        year,
        teammateCode: b.teammate.code,
        teammateName: b.teammate.name.split(' ').pop() || b.teammate.code,
        team: b.team,
        teamColor: b.teamColor,
      }))
    )
    .sort((a, b) => a.year - b.year);

  if (allItems.length < 2) return null;

  return (
    <div className={cn(CARD_CONTAINER, CARD_PADDING)}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
        Teammate Timeline
      </span>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {allItems.map((item, i) => (
          <div key={`${item.year}-${item.teammateCode}`} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/10">→</span>}
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
              <span className="text-[11px] font-medium tabular-nums text-white/80">
                {item.year}
              </span>
              <span className="text-[11px] text-white/40">{item.teammateCode}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn('shrink-0 text-white/20 transition-transform', expanded && 'rotate-180')}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

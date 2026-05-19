import { m } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { FlashIcon } from 'hugeicons-react';
import { ScheduleEvent, RaceResult } from '@/lib/api';
import { CARD_CONTAINER } from '@/lib/card-styles';

interface RaceCardProps {
  event: ScheduleEvent;
  result?: RaceResult;
  status: 'finished' | 'upcoming' | 'next' | 'testing';
  isSprint: boolean;
  countryCode?: string;
  displayLocation?: string;
  displayDate: string;
  selectedYear: number;
}

const StatusBadge = ({ status }: { status: RaceCardProps['status'] }) => {
  const config = {
    finished: { dot: 'bg-emerald-400', label: 'Finished', text: 'text-emerald-400' },
    next: { dot: 'bg-amber-400', label: 'Next', text: 'text-amber-400' },
    upcoming: { dot: 'bg-white/20', label: 'Upcoming', text: 'text-white/50' },
    testing: { dot: 'bg-white/15', label: 'Testing', text: 'text-white/50' },
  }[status];

  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-medium ${config.text}`}>
      <span className={`inline-block size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const PodiumRow = ({
  position,
  driver,
  teamColor,
  team,
}: {
  position: number;
  driver: string;
  teamColor: string;
  team: string;
}) => {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-5 text-center text-[13px]">{medals[position - 1]}</span>
      <span className="flex-1 text-[13px] font-medium text-white/85">{driver}</span>
      <div
        className="size-2 rounded-full"
        style={{ backgroundColor: `var(--color-f1-${teamColor})` }}
        title={team}
      />
    </div>
  );
};

const RaceCard: React.FC<RaceCardProps> = ({
  event,
  result,
  status,
  isSprint,
  countryCode,
  displayLocation,
  displayDate,
  selectedYear,
}) => {
  const navigate = useNavigate();
  const isTesting = status === 'testing';
  const isFinished = status === 'finished';
  const isNext = status === 'next';

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      onClick={() =>
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`)
      }
      className={`${CARD_CONTAINER} cursor-pointer p-5 transition-all hover:border-white/[0.1] ${
        isNext ? 'border-white/[0.08]' : ''
      } ${isSprint && !isTesting ? 'border-l-[3px] border-l-violet-500/25' : ''} ${
        status === 'upcoming' ? 'opacity-55 hover:opacity-75' : ''
      }`}
    >
      {/* Top section: round + flag + status */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Round number */}
          {!isTesting && (
            <div className="flex size-10 items-center justify-center rounded-md bg-white/[0.04]">
              <span className="font-mono text-[15px] font-semibold text-white/90">
                {String(event.RoundNumber).padStart(2, '0')}
              </span>
            </div>
          )}
          {isTesting && (
            <div className="flex size-10 items-center justify-center rounded-md bg-white/[0.04]">
              <span className="text-[10px] font-medium text-white/60">TST</span>
            </div>
          )}

          {/* Flag */}
          {countryCode ? (
            <img
              src={`https://flagcdn.com/${countryCode}.svg`}
              alt={event.Country || event.Location}
              className="h-8 w-auto rounded-[3px] shadow-sm"
            />
          ) : (
            <div className="h-8 w-12 rounded-[3px] bg-white/[0.04]" />
          )}
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Event name */}
      <h3 className="mb-1 text-[15px] font-medium leading-snug text-white">{event.EventName}</h3>

      {/* Location + Date + Sprint row */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-white/65">
        <span>{displayLocation || event.Location}</span>
        <span className="text-white/40">·</span>
        <span className="font-mono text-white/70">{displayDate}</span>
        {isSprint && !isTesting && (
          <>
            <span className="text-white/40">·</span>
            <span className="flex items-center gap-1 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
              Sprint
            </span>
          </>
        )}
      </div>

      {/* Podium for finished races */}
      {isFinished && result?.podium && result.podium.length > 0 && (
        <div className="mt-4 border-t border-white/[0.05] pt-3.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Podium
          </p>
          <div className="space-y-0.5">
            {result.podium.slice(0, 3).map((p) => (
              <PodiumRow
                key={p.position}
                position={p.position}
                driver={p.driver}
                teamColor={p.teamColor}
                team={p.team}
              />
            ))}
          </div>
        </div>
      )}

      {/* Winner only fallback */}
      {isFinished && result && !result.podium && (
        <div className="mt-4 border-t border-white/[0.05] pt-3.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Winner
          </p>
          <p className="text-[13px] font-medium text-white/85">{result.driver}</p>
        </div>
      )}
    </m.div>
  );
};

export default RaceCard;

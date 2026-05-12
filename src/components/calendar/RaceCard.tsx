import { m } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { FlashIcon } from 'hugeicons-react';
import { ScheduleEvent, RaceResult } from '@/lib/api';
import { CARD_CONTAINER, CARD_LABEL, CARD_DATA_VALUE } from '@/lib/card-styles';

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

const StatusDot = ({ status }: { status: RaceCardProps['status'] }) => {
  const color = {
    finished: 'bg-emerald-400',
    next: 'bg-amber-400',
    upcoming: 'bg-white/20',
    testing: 'bg-white/15',
  }[status];

  return <span className={`inline-block size-1.5 rounded-full ${color}`} />;
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

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25 }}
      onClick={() =>
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`)
      }
      className={`${CARD_CONTAINER} cursor-pointer p-4 transition-colors hover:border-white/[0.08] ${
        status === 'next' ? 'border-white/[0.08]' : ''
      } ${status === 'upcoming' ? 'opacity-60' : ''}`}
    >
      {/* Top row: round + status dot */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isTesting && (
            <span className="font-mono text-[11px] text-white/80">
              R{String(event.RoundNumber).padStart(2, '0')}
            </span>
          )}
          {isTesting && <span className="text-[11px] text-white/80">Pre-season</span>}
          {isSprint && !isTesting && (
            <span className="flex items-center gap-0.5 text-[11px] text-white/80">
              <FlashIcon className="size-2.5" />
              Sprint
            </span>
          )}
        </div>
        <StatusDot status={status} />
      </div>

      {/* Event name */}
      <h3 className="mb-1 text-[14px] font-medium text-white">{event.EventName}</h3>

      {/* Location · Date */}
      <div className="flex items-center gap-1.5 text-[12px] text-white/80">
        {countryCode && (
          <img
            src={`https://flagcdn.com/${countryCode}.svg`}
            alt={event.Country || event.Location}
            className="h-2.5 rounded-[1px]"
          />
        )}
        <span>{displayLocation || event.Location}</span>
        <span className="text-white/50">·</span>
        <span className="font-mono text-white/80">{displayDate}</span>
      </div>

      {/* Podium results for finished races */}
      {isFinished && result?.podium && (
        <div className="mt-3 border-t border-white/[0.04] pt-3">
          <div className="space-y-1">
            {result.podium.slice(0, 3).map((p) => (
              <div key={p.position} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${CARD_DATA_VALUE} w-3 text-[11px] text-white`}>
                    {p.position}
                  </span>
                  <span className="text-[12px] text-white/80">{p.driver}</span>
                </div>
                <div
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: `var(--color-f1-${p.teamColor})` }}
                  title={p.team}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Winner only fallback */}
      {isFinished && result && !result.podium && (
        <div className="mt-3 border-t border-white/[0.04] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/80">{result.driver}</span>
            <span className={CARD_LABEL}>{result.team}</span>
          </div>
        </div>
      )}
    </m.div>
  );
};

export default RaceCard;

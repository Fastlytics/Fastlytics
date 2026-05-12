import React, { useState, useEffect } from 'react';
import { m } from 'motion/react';
import {
  Sun02Icon,
  SunCloud01Icon,
  CloudIcon,
  CloudMidRainIcon,
  CloudAngledRainZapIcon,
  CloudSnowIcon,
  CloudFastWindIcon,
} from 'hugeicons-react';
import { ScheduleEvent } from '@/lib/api';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import type { CircuitWeather } from '@/hooks/useCircuitWeather';

interface LastYearData {
  driver: string;
  headshotUrl?: string | null;
}

interface LastYearPoleData extends LastYearData {
  lapTime: string;
}

interface LastYearWinnerData extends LastYearData {
  team: string;
}

interface LastYearFastestLapData extends LastYearData {
  lapTime: string;
}

interface CircuitPreviewProps {
  nextRace: ScheduleEvent | undefined;
  circuitLengthKm: number;
  countryCode?: string;
  lastYearPole?: LastYearPoleData | null;
  lastYearWinner?: LastYearWinnerData | null;
  lastYearFastestLap?: LastYearFastestLapData | null;
  weather?: CircuitWeather | null;
  isLoadingWeather?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
}

interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
}

const getNextUpcomingSession = (event: ScheduleEvent): { date: Date; name: string } | null => {
  const sessions = [
    { name: event.Session1, date: event.Session1Date },
    { name: event.Session2, date: event.Session2Date },
    { name: event.Session3, date: event.Session3Date },
    { name: event.Session4, date: event.Session4Date },
    { name: event.Session5, date: event.Session5Date },
  ].filter((s): s is { name: string; date: string } => !!s.name && !!s.date);

  const now = new Date();
  let next: { date: Date; name: string } | null = null;

  for (const session of sessions) {
    const date = new Date(session.date);
    if (date > now && (!next || date < next.date)) {
      next = { date, name: session.name };
    }
  }

  return next;
};

const useCountdown = (targetDate: Date | null): TimeLeft | null => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) return null;

  const diff = targetDate.getTime() - now;
  if (diff <= 0) return null;

  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
};

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '—';
  }
};

/** Map our internal icon keys to hugeicons components. */
const WeatherIcon: React.FC<{
  icon: CircuitWeather['icon'];
  className?: string;
}> = ({ icon, className }) => {
  const Cmp =
    icon === 'sun'
      ? Sun02Icon
      : icon === 'partly-cloudy'
        ? SunCloud01Icon
        : icon === 'cloud'
          ? CloudIcon
          : icon === 'rain'
            ? CloudMidRainIcon
            : icon === 'storm'
              ? CloudAngledRainZapIcon
              : icon === 'snow'
                ? CloudSnowIcon
                : icon === 'fog'
                  ? CloudFastWindIcon
                  : CloudIcon;
  return <Cmp className={className} strokeWidth={1.8} />;
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="font-mono text-[22px] font-semibold tabular-nums leading-none text-white">
      {String(value).padStart(2, '0')}
    </span>
    <span className="mt-1.5 text-[9px] font-medium uppercase tracking-wider text-white/50">
      {label}
    </span>
  </div>
);

const CircuitPreview: React.FC<CircuitPreviewProps> = ({
  nextRace,
  circuitLengthKm,
  countryCode,
  lastYearPole,
  lastYearWinner,
  weather,
  isLoadingWeather,
  onClick,
  isLoading,
}) => {
  const nextSession = nextRace ? getNextUpcomingSession(nextRace) : null;
  const targetDate = nextSession?.date ?? null;
  const timeLeft = useCountdown(targetDate);

  if (isLoading) {
    return <div className={`${CARD_CONTAINER} h-full animate-pulse`} />;
  }

  if (!nextRace) {
    return (
      <div className={`${CARD_CONTAINER} flex h-full flex-col items-start justify-between p-5`}>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/80">
            Next race
          </span>
          <h3 className="mt-1 text-[16px] font-medium text-white">Season complete</h3>
          <p className="mt-1 text-[13px] text-white/80">
            All scheduled rounds have finished — off-season until next year.
          </p>
        </div>
      </div>
    );
  }

  const roundLabel = nextRace.RoundNumber
    ? `R${String(nextRace.RoundNumber).padStart(2, '0')}`
    : '—';

  return (
    <m.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${CARD_CONTAINER} group flex h-full w-full flex-col text-left transition-opacity hover:opacity-95`}
    >
      {/* Header: label + round/date */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/80">
          Next race
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[12px] tabular-nums text-white/80">{roundLabel}</span>
          <span className="font-mono text-[12px] tabular-nums text-white/40">·</span>
          <span className="font-mono text-[12px] tabular-nums text-white/80">
            {formatDate(nextRace.EventDate)}
          </span>
        </div>
      </div>

      {/* Main content: flag above name on left, countdown on right */}
      <div className="flex flex-1 items-center gap-6 px-5 py-2">
        <div className="flex flex-col items-start gap-3">
          {countryCode && countryCode !== 'xx' && (
            <img
              src={`https://flagcdn.com/${countryCode}.svg`}
              alt={nextRace.Country || ''}
              className="h-20 w-auto rounded-[2px] border border-white/[0.06]"
            />
          )}
          <div>
            <h3 className="text-[18px] font-semibold leading-tight text-white">
              {nextRace.EventName}
            </h3>
            <p className="mt-0.5 text-[13px] text-white/80">
              {nextRace.Location}
              {nextRace.Country ? ` · ${nextRace.Country}` : ''}
            </p>
          </div>
        </div>

        <div className="ml-auto shrink-0">
          {timeLeft ? (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/80">
                {nextSession?.name}
              </span>
              <div className="flex items-start gap-1.5">
                <CountdownUnit value={timeLeft.d} label="Days" />
                <span className="mt-[-1px] font-mono text-[20px] font-semibold text-white/20">
                  :
                </span>
                <CountdownUnit value={timeLeft.h} label="Hrs" />
                <span className="mt-[-1px] font-mono text-[20px] font-semibold text-white/20">
                  :
                </span>
                <CountdownUnit value={timeLeft.m} label="Min" />
                <span className="mt-[-1px] font-mono text-[20px] font-semibold text-white/20">
                  :
                </span>
                <CountdownUnit value={timeLeft.s} label="Sec" />
              </div>
            </div>
          ) : (
            <div className="text-right">
              <span className="font-mono text-[18px] font-semibold text-emerald-400">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row — 4 cells: Track length · Pole · Winner · Weather */}
      <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.04] border-t border-white/[0.04] sm:grid-cols-4 sm:divide-y-0">
        {/* Track length */}
        <div className="px-5 py-4">
          <div className={CARD_LABEL}>Track length</div>
          <div className="mt-1 font-mono text-[14px] font-medium tabular-nums text-white">
            {circuitLengthKm.toFixed(3)}
            <span className="ml-1 text-[12px] font-normal text-white/80">km</span>
          </div>
        </div>

        {/* Last year pole */}
        <div className="px-5 py-4">
          <div className={CARD_LABEL}>Last year pole</div>
          <div className="mt-1 truncate text-[14px] font-medium text-white">
            {lastYearPole?.driver ?? '—'}
          </div>
          {lastYearPole?.lapTime && (
            <div className="truncate font-mono text-[12px] tabular-nums text-white/80">
              {lastYearPole.lapTime}
            </div>
          )}
        </div>

        {/* Last year winner */}
        <div className="px-5 py-4">
          <div className={CARD_LABEL}>Last year winner</div>
          <div className="mt-1 truncate text-[14px] font-medium text-white">
            {lastYearWinner?.driver ?? '—'}
          </div>
          {lastYearWinner?.team && (
            <div className="truncate font-mono text-[12px] tabular-nums text-white/80">
              {lastYearWinner.team}
            </div>
          )}
        </div>

        {/* Race-day weather */}
        <div className="px-5 py-4">
          <div className={CARD_LABEL}>Race-day weather</div>
          {isLoadingWeather ? (
            <div className="mt-1 text-[13px] text-white/80">—</div>
          ) : weather ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <WeatherIcon
                  icon={weather.icon}
                  className={`size-3.5 shrink-0 ${weather.isWet ? 'text-sky-400' : 'text-white/80'}`}
                />
                <span
                  className={`font-mono text-[14px] font-medium tabular-nums ${
                    weather.isWet ? 'text-sky-400' : 'text-white'
                  }`}
                >
                  {weather.temperatureC}°C
                </span>
              </div>
              <div className="truncate text-[12px] text-white/80">
                {weather.description}
                {weather.precipitationProbability > 0 && (
                  <span className="font-mono tabular-nums">
                    {' · '}
                    {weather.precipitationProbability}%
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 text-[14px] font-medium text-white/80">—</div>
              <div className="truncate text-[12px] text-white/80">No forecast available</div>
            </>
          )}
        </div>
      </div>
    </m.button>
  );
};

export default CircuitPreview;

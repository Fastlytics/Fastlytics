import React from 'react';
import { cn } from '@/lib/utils';
import { EventSessionSchedule, AvailableSession } from '@/lib/api';
import EventHeroCard from '@/components/calendar/EventHeroCard';

interface ScheduleSidebarProps {
  sessionSchedule: EventSessionSchedule | undefined;
  scheduleHeroDate: string;
  scheduleHeroCountryCode: string | undefined;
  nextSessionDate: { name: string; date: Date } | null;
  countdown: { days: number; hours: number; minutes: number; seconds: number } | null;
  is24Hour: boolean;
  setIs24Hour: (val: boolean) => void;
  trackInteraction: (action: string, data: Record<string, unknown>) => void;
  now: Date;
  availableSessions: AvailableSession[];
  setSelectedSession: (session: string) => void;
  setShowAnalysis: (show: boolean) => void;
}

export const ScheduleSidebar: React.FC<ScheduleSidebarProps> = ({
  sessionSchedule,
  scheduleHeroDate,
  scheduleHeroCountryCode,
  nextSessionDate,
  countdown,
  is24Hour,
  setIs24Hour,
  trackInteraction,
  now,
  availableSessions,
  setSelectedSession,
  setShowAnalysis,
}) => {
  if (!sessionSchedule) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
      </div>
    );
  }

  const formatTimeStr = (timeStr: string | null) => {
    if (!timeStr) return '-';
    if (is24Hour) return timeStr;
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const toDate = (dateStr: string) => new Date(dateStr);

  const formatShortDate = (dateStr: string) =>
    toDate(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase();

  const formatWeekday = (dateStr: string) =>
    toDate(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour,
      });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-10">
      <EventHeroCard
        eyebrow="Upcoming Session"
        title={sessionSchedule.eventName}
        displayDate={scheduleHeroDate}
        location={sessionSchedule.location}
        countryCode={scheduleHeroCountryCode}
        countryAlt={sessionSchedule.country || sessionSchedule.location}
        isSprint={sessionSchedule.eventFormat?.toLowerCase().includes('sprint')}
        nextSession={nextSessionDate}
        countdownFallbackLabel={countdown ? undefined : 'Session in Progress'}
      />

      <div>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
            Weekend Schedule
          </h3>
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            <button
              onClick={() => {
                setIs24Hour(true);
                trackInteraction('time_format_changed', { format: '24h' });
              }}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors',
                is24Hour
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              24H
            </button>
            <button
              onClick={() => {
                setIs24Hour(false);
                trackInteraction('time_format_changed', { format: '12h' });
              }}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors',
                !is24Hour
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              12H
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
          <div className="divide-y divide-white/[0.06]">
            {sessionSchedule.sessions.map((session) => {
              const sessionType = session.name === 'Race' ? 'R' : session.name;
              const isNext = nextSessionDate?.name === session.name;
              const isAvailable = availableSessions.some((s) => {
                if (sessionType === 'Q' || sessionType === 'Qualifying')
                  return s.type === 'Q' || s.type === 'Q1' || s.type === 'Q2' || s.type === 'Q3';
                if (sessionType === 'Sprint Shootout' || sessionType === 'SQ')
                  return (
                    s.type === 'SQ' || s.type === 'SQ1' || s.type === 'SQ2' || s.type === 'SQ3'
                  );
                return s.type === sessionType;
              });

              return (
                <div
                  key={`${session.name}-${session.date}`}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 transition-colors',
                    isNext ? 'bg-red-500/[0.04]' : 'hover:bg-white/[0.02]'
                  )}
                >
                  <div className="w-16 shrink-0 text-center">
                    <div
                      className={cn(
                        'text-[15px] font-bold tabular-nums',
                        isNext ? 'text-white' : 'text-white/60'
                      )}
                    >
                      {formatShortDate(session.date)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/25">
                      {formatWeekday(session.date)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'h-8 w-0.5 rounded-full',
                      isNext ? 'bg-red-400' : 'bg-white/[0.06]'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'text-[14px] font-semibold',
                        isNext ? 'text-red-400' : 'text-white'
                      )}
                    >
                      {session.name}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right md:block">
                    {!isAvailable && (
                      <>
                        <div
                          className={cn(
                            'text-[14px] tabular-nums',
                            isNext ? 'text-white' : 'text-white/50'
                          )}
                        >
                          {formatTimeStr(session.localTime)}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-white/25">
                          Local
                        </div>
                      </>
                    )}
                  </div>
                  <div className="hidden shrink-0 md:block">
                    {(() => {
                      const sessionDate = toDate(session.date);
                      const diffMins = (now.getTime() - sessionDate.getTime()) / (1000 * 60);
                      let duration = 60;
                      if (sessionType === 'R') duration = 180;
                      else if (sessionType === 'Sprint') duration = 60;
                      const isLive = diffMins >= 0 && diffMins < duration;

                      if (isLive) {
                        return (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="relative flex size-1.5">
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[11px] font-semibold uppercase">Live</span>
                          </div>
                        );
                      }
                      if (isAvailable) {
                        return (
                          <button
                            onClick={() => {
                              let targetSession = sessionType;
                              if (sessionType === 'Q' || sessionType === 'Qualifying') {
                                if (availableSessions.some((s) => s.type === 'Q'))
                                  targetSession = 'Q';
                                else if (availableSessions.some((s) => s.type === 'Q3'))
                                  targetSession = 'Q3';
                                else if (availableSessions.some((s) => s.type === 'Q2'))
                                  targetSession = 'Q2';
                                else if (availableSessions.some((s) => s.type === 'Q1'))
                                  targetSession = 'Q1';
                              }
                              if (sessionType === 'Sprint Shootout' || sessionType === 'SQ') {
                                if (availableSessions.some((s) => s.type === 'SQ'))
                                  targetSession = 'SQ';
                                else if (availableSessions.some((s) => s.type === 'SQ3'))
                                  targetSession = 'SQ3';
                                else if (availableSessions.some((s) => s.type === 'SQ2'))
                                  targetSession = 'SQ2';
                                else if (availableSessions.some((s) => s.type === 'SQ1'))
                                  targetSession = 'SQ1';
                              }
                              setSelectedSession(targetSession);
                              setShowAnalysis(true);
                              trackInteraction('results_button_clicked', {
                                sessionKey: targetSession,
                              });
                            }}
                            className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase text-red-400 transition-colors hover:bg-red-500/[0.12]"
                          >
                            Results
                          </button>
                        );
                      }
                      return (
                        <div className="text-right">
                          <div
                            className={cn(
                              'text-[14px] tabular-nums',
                              isNext ? 'text-white' : 'text-white/50'
                            )}
                          >
                            {formatDate(session.date)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-white/25">
                            Your Time
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

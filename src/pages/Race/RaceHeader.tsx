import React from 'react';
import { m } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AvailableSession } from '@/lib/api';

interface RaceHeaderProps {
  year: number | null;
  eventName: string;
  selectedSession: string;
  availableSessions: AvailableSession[];
  isTestingEvent: boolean;
  shouldShowSchedule: boolean;
  setSelectedSession: (session: string) => void;
}

export const RaceHeader: React.FC<RaceHeaderProps> = ({
  year,
  eventName,
  selectedSession,
  availableSessions,
  isTestingEvent,
  shouldShowSchedule,
  setSelectedSession,
}) => {
  return (
    <div className="mb-10">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
                </span>
                Season {year}
              </span>
            </div>
            <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              {eventName}
            </h1>
            {selectedSession && availableSessions.find((s) => s.type === selectedSession) && (
              <p className="mt-1 text-[15px] text-white/50">
                {availableSessions.find((s) => s.type === selectedSession)?.name}
              </p>
            )}
          </div>

          {!shouldShowSchedule &&
            availableSessions.length > 0 &&
            (isTestingEvent ? (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-auto min-w-[240px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-white/[0.1] hover:text-white">
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                  <SelectItem
                    value="Summary"
                    className="text-[13px] font-semibold text-red-400 focus:bg-white/[0.06] focus:text-red-300"
                  >
                    3-Day Testing Summary
                  </SelectItem>
                  {availableSessions.flatMap((s) =>
                    s.type !== 'Q' && s.type !== 'Summary'
                      ? [
                          <SelectItem
                            key={s.type}
                            value={s.type}
                            className="text-[13px] font-medium text-white/70 focus:bg-white/[0.06] focus:text-white"
                          >
                            {s.name}
                          </SelectItem>,
                        ]
                      : []
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-auto min-w-[180px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-white/[0.1] hover:text-white">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                  {availableSessions.flatMap((s) =>
                    s.type !== 'Q'
                      ? [
                          <SelectItem
                            key={s.type}
                            value={s.type}
                            className="text-[13px] font-medium text-white/70 focus:bg-white/[0.06] focus:text-white"
                          >
                            {s.name}
                          </SelectItem>,
                        ]
                      : []
                  )}
                </SelectContent>
              </Select>
            ))}
        </div>
      </m.div>
      <div className="mt-8 h-px w-full bg-white/[0.05]" />
    </div>
  );
};

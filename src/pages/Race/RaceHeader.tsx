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
  const sessionName = availableSessions.find((s) => s.type === selectedSession)?.name;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-white">{eventName}</h1>
          <p className="mt-0.5 text-[12px] text-white/80">
            {year} Season{sessionName ? ` · ${sessionName}` : ''}
          </p>
        </div>

        {!shouldShowSchedule && availableSessions.length > 0 && (
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-auto min-w-[160px] rounded-lg border border-white/[0.04] bg-transparent px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:border-white/[0.08] hover:text-white focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-white/[0.06] bg-[#111113]">
              {isTestingEvent && (
                <SelectItem
                  value="Summary"
                  className="text-[13px] font-medium text-white/80 focus:bg-white/[0.04] focus:text-white"
                >
                  Testing Summary
                </SelectItem>
              )}
              {availableSessions
                .filter((s) => s.type !== 'Q' && s.type !== 'Summary')
                .map((s) => (
                  <SelectItem
                    key={s.type}
                    value={s.type}
                    className="text-[13px] font-medium text-white/80 focus:bg-white/[0.04] focus:text-white"
                  >
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </m.div>
  );
};

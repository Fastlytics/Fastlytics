import { m } from 'motion/react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamPaceSummary } from '@/lib/api';

import { AVAILABLE_YEARS, slugifyEventName } from './utils';

interface TeamPaceHeaderProps {
  selectedYear: number;
  selectedEventSlug: string | null;
  summaryList: TeamPaceSummary[];
  onYearChange: (year: number) => void;
  onEventChange: (eventSlug: string) => void;
}

export const TeamPaceHeader = ({
  selectedYear,
  selectedEventSlug,
  summaryList,
  onYearChange,
  onEventChange,
}: TeamPaceHeaderProps) => {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-white">
          Team Pace Analysis
        </h1>
        <p className="mt-0.5 text-[12px] text-white/80">
          Weekend performance evolution & race pace
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Select value={String(selectedYear)} onValueChange={(value) => onYearChange(Number(value))}>
          <SelectTrigger className="h-8 w-[90px] border-white/[0.08] bg-transparent text-[13px] font-medium text-white">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#141414] text-white">
            <SelectGroup>
              <SelectLabel className="px-2 py-1.5 text-[11px] text-white/50">Season</SelectLabel>
              {AVAILABLE_YEARS.map((year) => (
                <SelectItem
                  key={year}
                  value={String(year)}
                  className="cursor-pointer text-[13px] focus:bg-white/[0.04] focus:text-white"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={selectedEventSlug || ''}
          onValueChange={onEventChange}
          disabled={summaryList.length === 0}
        >
          <SelectTrigger className="h-8 w-[200px] border-white/[0.08] bg-transparent text-[13px] font-medium text-white">
            <SelectValue placeholder={summaryList.length === 0 ? 'No Events' : 'Select Event'} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] border-white/[0.08] bg-[#141414] text-white">
            <SelectGroup>
              <SelectLabel className="px-2 py-1.5 text-[11px] text-white/50">
                Race Weekend
              </SelectLabel>
              {summaryList.map((event) => (
                <SelectItem
                  key={event.round}
                  value={slugifyEventName(event.eventName)}
                  className="cursor-pointer text-[13px] focus:bg-white/[0.04] focus:text-white"
                >
                  R{event.round} · {event.eventName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </m.div>
  );
};

import { Activity01Icon, ArrowLeft01Icon } from 'hugeicons-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
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
  const navigate = useNavigate();

  return (
    <div className="mb-8 flex flex-col justify-between gap-6 border-b-2 border-zinc-800 pb-8 md:flex-row md:items-center">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-500 hover:bg-zinc-800 hover:text-white"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft01Icon className="size-6" />
          </Button>
          <h1 className="flex items-center gap-3 text-3xl font-semibold uppercase italic tracking-tighter md:text-5xl">
            Team Pace <span className="text-red-600">Analysis</span>
            <Activity01Icon className="size-8 text-zinc-600 md:h-10 md:w-10" />
          </h1>
        </div>
        <p className="ml-14 font-mono text-sm uppercase tracking-widest text-zinc-500">
          Weekend Performance Evolution & Race Pace
        </p>
      </div>

      <div className="ml-14 flex flex-wrap items-center gap-4 md:ml-0">
        <Select value={String(selectedYear)} onValueChange={(value) => onYearChange(Number(value))}>
          <SelectTrigger className="w-[120px] rounded-none border-2 border-zinc-800 bg-zinc-950 font-bold uppercase tracking-widest text-white hover:border-red-600">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-zinc-800 bg-zinc-950 text-white">
            <SelectGroup>
              <SelectLabel className="p-2 text-xs uppercase text-zinc-500">Season</SelectLabel>
              {AVAILABLE_YEARS.map((year) => (
                <SelectItem
                  key={year}
                  value={String(year)}
                  className="cursor-pointer font-bold focus:bg-red-600 focus:text-white"
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
          <SelectTrigger className="w-[240px] rounded-none border-2 border-zinc-800 bg-zinc-950 font-bold uppercase tracking-widest text-white hover:border-red-600">
            <SelectValue placeholder={summaryList.length === 0 ? 'No Events' : 'Select Event'} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] rounded-none border-2 border-zinc-800 bg-zinc-950 text-white">
            <SelectGroup>
              <SelectLabel className="p-2 text-xs uppercase text-zinc-500">
                Race Weekend
              </SelectLabel>
              {summaryList.map((event) => (
                <SelectItem
                  key={event.round}
                  value={slugifyEventName(event.eventName)}
                  className="cursor-pointer font-bold focus:bg-red-600 focus:text-white"
                >
                  R{event.round} - {event.eventName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

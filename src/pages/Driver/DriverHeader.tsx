import React from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { DriverCareer } from '@/lib/api';

interface DriverHeaderProps {
  career: DriverCareer;
  teamColor: string;
  countryCode: string;
  currentImageUrl: string | undefined;
  availableImages: { year: number; url: string }[];
  selectedImageYear: number | null;
  setSelectedImageYear: (year: number | null) => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  career,
  teamColor,
  countryCode,
  currentImageUrl,
  availableImages,
  selectedImageYear,
  setSelectedImageYear,
}) => {
  const isChampion = career.seasons[0]?.position === 1;
  const currentTeam = career.seasons[0]?.team;

  return (
    <div className="mb-10">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Driver Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  'absolute -inset-1 rounded-2xl opacity-20 blur-sm',
                  `bg-f1-${teamColor}`
                )}
              />
              <Avatar className="relative size-20 rounded-xl border border-white/[0.08] sm:size-24">
                <AvatarImage src={currentImageUrl} className="object-cover object-top" />
                <AvatarFallback className="bg-[#1a1a1e] text-2xl font-black italic text-white/20">
                  {career.code}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Driver Info */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
                  </span>
                  Driver Profile
                </span>
                {isChampion && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    World Champion
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
                {career.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {countryCode !== 'xx' && (
                  <img
                    src={`https://flagcdn.com/${countryCode}.svg`}
                    alt={career.nationality}
                    className="h-4 w-auto rounded-sm opacity-80"
                  />
                )}
                <span className="text-[15px] text-white/50">{career.nationality}</span>
                {currentTeam && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-[15px] text-white/50">{currentTeam}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Image Year Selector */}
          {availableImages.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
              {availableImages.map((img) => (
                <button
                  key={img.year}
                  onClick={() =>
                    setSelectedImageYear(selectedImageYear === img.year ? null : img.year)
                  }
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-bold tabular-nums uppercase tracking-wider transition-all',
                    selectedImageYear === img.year ||
                      (selectedImageYear === null && img.year === availableImages[0].year)
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/35 hover:text-white/60'
                  )}
                >
                  {img.year}
                </button>
              ))}
            </div>
          )}
        </div>
      </m.div>
      <div className="mt-8 h-px w-full bg-white/[0.05]" />
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getTeamLogo } from '@/lib/teamUtils';
import type { DriverCareer, DriverBio } from '@/lib/api';

interface DriverHeroProps {
  career: DriverCareer;
  bio: DriverBio | undefined;
  isBioLoading: boolean;
  currentImageUrl: string | undefined;
  fallbackImageUrl?: string;
  availableImages: { year: number; url: string }[];
  selectedImageYear: number | null;
  setSelectedImageYear: (year: number | null) => void;
  isCurrentSeasonChampion?: boolean;
}

export function DriverHero({
  career,
  bio,
  isBioLoading,
  currentImageUrl,
  fallbackImageUrl,
  availableImages,
  selectedImageYear,
  setSelectedImageYear,
  isCurrentSeasonChampion = false,
}: DriverHeroProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [failedFallback, setFailedFallback] = useState(false);
  const uploadedRef = useRef(false);

  // For retired drivers, show the team they were most successful with (most wins, then points).
  // For active drivers, show their current team.
  const currentYear = new Date().getFullYear();
  const isActive = career.seasons[0]?.season >= currentYear - 1;

  const displayTeam = useMemo(() => {
    if (!career.seasons.length) return undefined;
    if (isActive) return career.seasons[0]?.team;

    // Retired driver — aggregate championships, wins, and points per team
    const teamStats = new Map<string, { championships: number; wins: number; points: number }>();
    for (const s of career.seasons) {
      if (!s.team) continue;
      const existing = teamStats.get(s.team) || { championships: 0, wins: 0, points: 0 };
      if (s.position === 1 && (s.season < currentYear || isCurrentSeasonChampion))
        existing.championships += 1;
      existing.wins += s.wins;
      existing.points += s.points;
      teamStats.set(s.team, existing);
    }

    let bestTeam = career.seasons[0]?.team;
    let bestChamps = -1;
    let bestWins = -1;
    let bestPoints = -1;
    for (const [team, stats] of teamStats) {
      if (
        stats.championships > bestChamps ||
        (stats.championships === bestChamps && stats.wins > bestWins) ||
        (stats.championships === bestChamps && stats.wins === bestWins && stats.points > bestPoints)
      ) {
        bestTeam = team;
        bestChamps = stats.championships;
        bestWins = stats.wins;
        bestPoints = stats.points;
      }
    }
    return bestTeam;
  }, [career.seasons, isActive, currentYear, isCurrentSeasonChampion]);

  const teamColor = displayTeam ? getTeamColorClass(displayTeam) : 'gray';
  const countryCode = getNationalityCountryCode(career.nationality);
  // Past seasons: position === 1 means confirmed champion
  // Current season: only if mathematically clinched (passed via prop)
  const isChampion = career.seasons.some(
    (s) => s.position === 1 && (s.season < currentYear || isCurrentSeasonChampion)
  );
  const currentTeam = displayTeam;
  const championships = career.seasons.filter(
    (s) => s.position === 1 && (s.season < currentYear || isCurrentSeasonChampion)
  ).length;
  const currentNumber = career.seasons[0]?.position;

  // The direct Wikimedia URL from the bio response
  const wikimediaUrl = bio?.imageUrl;

  // Determine which image src to show:
  // 1. currentImageUrl (local static) unless it failed
  // 2. fallbackImageUrl (/api/driver/:slug/image from R2) unless it failed
  // 3. wikimediaUrl (direct from Wikimedia) as last resort
  const imageSrc = useMemo(() => {
    if (failedUrl !== currentImageUrl && currentImageUrl) return currentImageUrl;
    if (!failedFallback && fallbackImageUrl) return fallbackImageUrl;
    if (wikimediaUrl) return wikimediaUrl;
    return undefined;
  }, [currentImageUrl, failedUrl, fallbackImageUrl, failedFallback, wikimediaUrl]);

  // When the Wikimedia image loads successfully in the browser, upload it to R2
  useEffect(() => {
    uploadedRef.current = false;
  }, [career.driverId]);

  const handleImageLoad = (src: string) => {
    // Only upload if we're showing the direct Wikimedia URL (meaning R2 didn't have it)
    if (src !== wikimediaUrl || !wikimediaUrl || uploadedRef.current) return;
    if (!fallbackImageUrl) return;
    uploadedRef.current = true;

    // Fetch the image as a blob and PUT it to the worker's R2 cache endpoint
    fetch(wikimediaUrl)
      .then((resp) => {
        if (!resp.ok) return;
        return resp.blob();
      })
      .then((blob) => {
        if (!blob) return;
        fetch(fallbackImageUrl, {
          method: 'PUT',
          headers: { 'Content-Type': blob.type },
          body: blob,
        }).catch((err) => {
          console.warn('Fallback image upload failed:', err);
        });
      })
      .catch((err) => {
        console.warn('Image fetch for upload failed:', err);
      });
  };

  const age = useMemo(() => {
    if (!career.dateOfBirth) return null;
    const dob = new Date(career.dateOfBirth);
    const endDate = bio?.dateOfDeath ? new Date(bio.dateOfDeath) : new Date();
    let a = endDate.getFullYear() - dob.getFullYear();
    const m = endDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < dob.getDate())) a--;
    return a;
  }, [career.dateOfBirth, bio]);

  const summary = career.careerSummary;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Main hero card */}
      <div className={cn(CARD_CONTAINER, 'relative overflow-hidden')}>
        {/* Team color bleed — atmospheric gradient */}
        <div
          className={cn(
            'pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full opacity-[0.04] blur-[100px]',
            `bg-f1-${teamColor}`
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute -left-20 bottom-0 h-[200px] w-[300px] rounded-full opacity-[0.03] blur-[80px]',
            `bg-f1-${teamColor}`
          )}
        />

        <div className="relative flex flex-col gap-0 lg:flex-row">
          {/* Left: Driver image — cropped to chest/torso */}
          <div className="relative shrink-0 overflow-hidden lg:w-[280px] xl:w-[320px]">
            {/* Gradient fade at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-background to-transparent" />

            {(() => {
              if (imageSrc) {
                return (
                  <div className="relative h-[300px] w-full sm:h-[340px] lg:h-full lg:max-h-[420px]">
                    <img
                      src={imageSrc}
                      alt={career.name}
                      className="size-full object-cover object-top"
                      onLoad={() => handleImageLoad(imageSrc)}
                      onError={() => {
                        if (imageSrc === currentImageUrl && (fallbackImageUrl || wikimediaUrl)) {
                          setFailedUrl(currentImageUrl);
                        } else if (imageSrc === fallbackImageUrl && wikimediaUrl) {
                          setFailedFallback(true);
                        }
                      }}
                    />
                  </div>
                );
              }
              return (
                <div className="flex h-[300px] w-full items-center justify-center bg-white/[0.01] sm:h-[340px]">
                  <span className="text-6xl font-black text-white/[0.04]">{career.code}</span>
                </div>
              );
            })()}

            {/* Image year pills — floating over image */}
            {availableImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-full border border-white/[0.08] bg-black/70 p-0.5 backdrop-blur-md scrollbar-hide">
                {availableImages.map((img) => (
                  <button
                    key={img.year}
                    onClick={() =>
                      setSelectedImageYear(selectedImageYear === img.year ? null : img.year)
                    }
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium tabular-nums transition-all',
                      selectedImageYear === img.year ||
                        (selectedImageYear === null && img.year === availableImages[0].year)
                        ? 'bg-white/[0.12] text-white'
                        : 'text-white/40 hover:text-white/70'
                    )}
                  >
                    {img.year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6 lg:p-8">
            {/* Top section */}
            <div>
              {/* Pill badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {isChampion ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-[11px] font-medium text-amber-400">
                    {championships}× World Champion
                  </span>
                ) : summary.wins > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60">
                    {summary.wins}× Grand Prix Winner
                  </span>
                ) : summary.podiums > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60">
                    {summary.podiums}× Podiums
                  </span>
                ) : null}
                {currentTeam && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-white/60">
                    {getTeamLogo(currentTeam) ? (
                      <img
                        src={getTeamLogo(currentTeam)!}
                        alt={currentTeam}
                        className="h-3.5 w-auto object-contain"
                      />
                    ) : (
                      <span
                        className={cn('inline-block size-2 rounded-full', `bg-f1-${teamColor}`)}
                      />
                    )}
                    {currentTeam}
                  </span>
                )}
                {career.code && (
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/50">
                    #{career.code}
                  </span>
                )}
              </div>

              {/* Driver name — large, clean */}
              <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-white sm:text-[34px] lg:text-[40px]">
                {career.name}
              </h1>

              {/* Meta line */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px] text-white/50">
                {countryCode !== 'xx' && (
                  <img
                    src={`https://flagcdn.com/${countryCode}.svg`}
                    alt={career.nationality}
                    className="h-3.5 w-auto rounded-[2px] opacity-80"
                  />
                )}
                <span>{career.nationality}</span>
                {age !== null && (
                  <>
                    <span className="text-white/20">·</span>
                    <span>{bio?.dateOfDeath ? `Died aged ${age}` : `${age} yrs`}</span>
                  </>
                )}
                {career.dateOfBirth && (
                  <>
                    <span className="text-white/20">·</span>
                    <span>
                      {new Date(career.dateOfBirth).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {bio?.dateOfDeath && (
                        <>
                          {' – '}
                          {new Date(bio.dateOfDeath).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </span>
                  </>
                )}
                <span className="text-white/20">·</span>
                <span>{summary.seasons} seasons</span>
              </div>

              {/* Bio */}
              {isBioLoading ? (
                <div className="mt-5 space-y-2">
                  <div className="h-3.5 w-full animate-pulse rounded bg-white/[0.03]" />
                  <div className="h-3.5 w-5/6 animate-pulse rounded bg-white/[0.03]" />
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/[0.03]" />
                </div>
              ) : bio?.extract ? (
                <p className="mt-5 text-[13px] leading-[1.7] text-white/40">
                  {bio.extract}
                  {bio.extract !== bio.fullExtract && bio.wikipediaUrl && (
                    <>
                      {'… '}
                      <a
                        href={bio.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                      >
                        Read more
                      </a>
                    </>
                  )}
                </p>
              ) : null}
            </div>

            {/* Bottom: Career stats strip */}
            <div className="mt-6 border-t border-white/[0.04] pt-5">
              <div className="grid grid-cols-4 gap-x-4 gap-y-4 sm:grid-cols-8">
                <StatCell label="Races" value={summary.races} />
                <StatCell label="Wins" value={summary.wins} accent={summary.wins > 0} />
                <StatCell label="Podiums" value={summary.podiums} />
                <StatCell label="Poles" value={summary.poles} />
                <StatCell label="Fastest Laps" value={summary.fastestLaps} />
                <StatCell label="Points" value={summary.points} />
                <StatCell label="DNFs" value={summary.dnfs} />
                <StatCell
                  label="Total Championships"
                  value={
                    career.seasons.filter(
                      (s) => s.position === 1 && (s.season < currentYear || isCurrentSeasonChampion)
                    ).length || '—'
                  }
                  accent={career.seasons.some(
                    (s) => s.position === 1 && (s.season < currentYear || isCurrentSeasonChampion)
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

function StatCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          'text-[18px] font-semibold tabular-nums tracking-tight',
          accent ? 'text-white' : 'text-white/90'
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </div>
    </div>
  );
}

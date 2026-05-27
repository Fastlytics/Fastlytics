import { useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getTeamLogo } from '@/lib/teamUtils';
import type { TeamCareer, DriverBio } from '@/lib/api';

interface TeamHeroProps {
  career: TeamCareer;
  bio: DriverBio | undefined;
  isBioLoading: boolean;
  fallbackImageUrl?: string;
}

export function TeamHero({ career, bio, isBioLoading, fallbackImageUrl }: TeamHeroProps) {
  const [failedFallback, setFailedFallback] = useState(false);
  const uploadedRef = useRef(false);

  const teamColor = career.name ? getTeamColorClass(career.name) : 'gray';
  const countryCode = getNationalityCountryCode(career.nationality);
  const summary = career.careerSummary;
  const lastSeason = career.seasons[0]?.season;
  const isActive = lastSeason && lastSeason >= new Date().getFullYear() - 1;
  const championships = career.seasons.filter((s) => s.position === 1).length;

  const logoUrl = useMemo(() => getTeamLogo(career.name), [career.name]);

  const wikimediaUrl = bio?.imageUrl;

  const imageSrc = useMemo(() => {
    if (!failedFallback && fallbackImageUrl) return fallbackImageUrl;
    if (wikimediaUrl) return wikimediaUrl;
    return undefined;
  }, [failedFallback, fallbackImageUrl, wikimediaUrl]);

  useEffect(() => {
    uploadedRef.current = false;
  }, [career.constructorId]);

  const handleImageLoad = (src: string) => {
    if (src !== wikimediaUrl || !wikimediaUrl || uploadedRef.current) return;
    if (!fallbackImageUrl) return;
    uploadedRef.current = true;

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

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className={cn(CARD_CONTAINER, 'relative overflow-hidden')}>
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
          {/* Left: Team logo (primary) or Wikipedia image (fallback) */}
          <div className="relative shrink-0 overflow-hidden lg:w-[280px] xl:w-[320px]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-background to-transparent" />

            {(() => {
              if (logoUrl) {
                return (
                  <div className="relative flex h-[300px] w-full items-center justify-center p-8 sm:h-[340px] lg:h-full lg:max-h-[420px]">
                    <img
                      src={logoUrl}
                      alt={`${career.name} logo`}
                      className="max-h-full max-w-full object-contain drop-shadow-2xl"
                    />
                  </div>
                );
              }
              if (imageSrc) {
                return (
                  <div className="relative flex h-[300px] w-full items-center justify-center sm:h-[340px] lg:h-full lg:max-h-[420px]">
                    <img
                      src={imageSrc}
                      alt={career.name}
                      className="size-full object-contain object-center p-4 drop-shadow-2xl"
                      onLoad={() => handleImageLoad(imageSrc)}
                      onError={() => setFailedFallback(true)}
                    />
                  </div>
                );
              }
              return (
                <div className="flex h-[300px] w-full items-center justify-center bg-white/[0.01] sm:h-[340px]">
                  <span className="text-6xl font-black text-white/[0.04]">{career.name[0]}</span>
                </div>
              );
            })()}
          </div>

          {/* Right: Info panel */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6 lg:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {championships > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-[11px] font-medium text-amber-400">
                    {championships}× Constructors' Champion
                  </span>
                ) : summary.wins > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60">
                    {summary.wins}× Grand Prix Winner
                  </span>
                ) : null}
                {isActive &&
                  career.seasons[0]?.drivers.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/60"
                    >
                      #{code}
                    </span>
                  ))}
              </div>

              <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-white sm:text-[34px] lg:text-[40px]">
                {career.name}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px] text-white/50">
                {countryCode !== 'xx' && (
                  <img
                    src={`https://flagcdn.com/${countryCode}.svg`}
                    alt={career.nationality}
                    className="h-3.5 w-auto rounded-[2px] opacity-80"
                  />
                )}
                <span>{career.nationality}</span>
                <span className="text-white/20">·</span>
                <span>{summary.seasons} seasons</span>
                {isActive && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-emerald-400/80">Active</span>
                  </>
                )}
              </div>

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

            <div className="mt-6 border-t border-white/[0.04] pt-5">
              <div className="grid grid-cols-4 gap-x-4 gap-y-4 sm:grid-cols-7">
                <StatCell label="Seasons" value={summary.seasons} />
                <StatCell label="Races" value={summary.races} />
                <StatCell label="Wins" value={summary.wins} accent={summary.wins > 0} />
                <StatCell label="Podiums" value={summary.podiums} />
                <StatCell label="Poles" value={summary.poles} />
                <StatCell label="Points" value={summary.points} />
                <StatCell
                  label="WCC Titles"
                  value={championships || '—'}
                  accent={championships > 0}
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

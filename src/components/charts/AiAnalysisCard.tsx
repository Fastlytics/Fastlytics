import type { ReactNode } from 'react';
import { Cancel01Icon } from 'hugeicons-react';
import type { TelemetrySummaryResponse } from '@/hooks/useAiTelemetrySummary';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';

interface AiAnalysisCardProps {
  data: TelemetrySummaryResponse;
  onClose: () => void;
  isLoading?: boolean;
  driverCode?: string;
  driverName?: string;
  team?: string;
  year?: number;
  lapNumber?: string;
  lapTime?: string;
  compound?: string;
  headerActions?: ReactNode;
  compareDriverCode?: string;
  compareDriverName?: string;
  compareTeam?: string;
  compareLapTime?: string;
  compareCompound?: string;
}

export function AiAnalysisCard({
  data,
  onClose,
  isLoading,
  driverCode,
  driverName,
  team,
  year,
  lapNumber,
  lapTime,
  compound,
  headerActions,
  compareDriverCode,
  compareDriverName,
  compareTeam,
  compareLapTime,
  compareCompound,
}: AiAnalysisCardProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-white/[0.08] border-t-white/60" />
          <p className="text-[14px] font-medium text-white">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const headshot = driverCode && year ? getDriverImage(driverCode, year) : undefined;
  const compareHeadshot =
    compareDriverCode && year ? getDriverImage(compareDriverCode, year) : undefined;
  const compoundLabel = compound?.toUpperCase();
  const compareCompoundLabel = compareCompound?.toUpperCase();
  const primaryColor = driverCode && year ? driverColor(driverCode, year) : '#ffffff';
  const secondaryColor =
    compareDriverCode && year ? driverColor(compareDriverCode, year) : '#ffffff';
  const isComparison = !!compareDriverCode;
  const headerTitle = isComparison
    ? `${driverName || driverCode || 'Driver 1'} vs ${compareDriverName || compareDriverCode || 'Driver 2'}`
    : driverName || 'Telemetry Analysis';

  const renderDriverMetaPill = (label: string | undefined, color: string, key: string) => {
    if (!label) return null;
    return (
      <span
        key={key}
        className="inline-flex items-center rounded-full border border-white/[0.08] px-3 py-1 text-[12px] font-semibold tabular-nums"
        style={{ color }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
        <div className="min-w-0 space-y-2 text-white">
          {isComparison && (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {headshot ? (
                  <div
                    className="size-12 overflow-hidden rounded-full border-2 bg-black"
                    style={{ borderColor: primaryColor }}
                  >
                    <img
                      src={headshot}
                      alt={driverCode}
                      className="size-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div
                    className="flex size-12 items-center justify-center rounded-full border-2 bg-black text-[14px] font-bold text-white"
                    style={{ borderColor: primaryColor }}
                  >
                    {driverCode || '?'}
                  </div>
                )}
                {compareHeadshot ? (
                  <div
                    className="size-12 overflow-hidden rounded-full border-2 bg-black"
                    style={{ borderColor: secondaryColor }}
                  >
                    <img
                      src={compareHeadshot}
                      alt={compareDriverCode}
                      className="size-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div
                    className="flex size-12 items-center justify-center rounded-full border-2 bg-black text-[14px] font-bold text-white"
                    style={{ borderColor: secondaryColor }}
                  >
                    {compareDriverCode || '?'}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <h3 className="truncate text-[24px] font-semibold leading-none text-white">
              {headerTitle}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 text-white">
            {isComparison ? (
              <>
                {renderDriverMetaPill(lapTime, primaryColor, 'primary-time')}
                {renderDriverMetaPill(compoundLabel, primaryColor, 'primary-compound')}
                {renderDriverMetaPill(compareLapTime, secondaryColor, 'compare-time')}
                {renderDriverMetaPill(compareCompoundLabel, secondaryColor, 'compare-compound')}
              </>
            ) : (
              <>
                {renderDriverMetaPill(lapTime, '#ffffff', 'time')}
                {renderDriverMetaPill(compoundLabel, '#ffffff', 'compound')}
                {team && renderDriverMetaPill(team, '#ffffff', 'team')}
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-3">
          {headerActions}
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-white transition-colors hover:bg-white/[0.04]"
          >
            <Cancel01Icon className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div
          className={
            isComparison
              ? 'grid gap-3'
              : 'grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start'
          }
        >
          {!isComparison && (
            <div className="text-white">
              <div className="flex items-start gap-4">
                {headshot ? (
                  <div className="-translate-y-2 h-34 w-48 shrink-0 overflow-hidden rounded-2xl">
                    <img
                      src={headshot}
                      alt={driverCode}
                      className="size-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="flex h-34 w-48 shrink-0 items-center justify-center rounded-2xl text-[28px] font-bold text-white">
                    {driverCode || '?'}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-1 text-white">
            <div className="space-y-3">
              <h4 className="text-[18px] font-semibold text-white">Lap Summary</h4>
              <p className="text-[15px] leading-7 font-normal text-white">{data.summary}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          {data.key_insights && data.key_insights.length > 0 && (
            <section className="p-1 text-white">
              <h4 className="mb-4 text-[18px] font-semibold text-white">Key Insights</h4>
              <div className="space-y-3">
                {data.key_insights.map((insight, i) => (
                  <div key={i} className="px-1 py-1">
                    <div className="flex items-start gap-3">
                      <span className="pt-0.5 text-[14px] font-bold text-white">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-[14px] leading-7 font-normal text-white">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.corner_analysis && data.corner_analysis.length > 0 && (
            <section className="p-1 text-white">
              <h4 className="mb-4 text-[18px] font-semibold text-white">Corner Details</h4>
              <div className="space-y-3">
                {data.corner_analysis.map((corner, i) => (
                  <div key={i} className="px-1 py-1.5">
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-white">
                      <span className="text-[14px] font-bold text-white">
                        Turn {corner.number ?? '?'}
                      </span>
                      {corner.name &&
                        corner.name.trim().toLowerCase() !==
                          `turn ${corner.number ?? '?'}`.toLowerCase() && (
                          <span className="text-[13px] font-semibold text-white">
                            {corner.name}
                          </span>
                        )}
                    </div>
                    <p className="text-[14px] leading-7 font-normal text-white">
                      {corner.analysis}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

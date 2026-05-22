import { m } from 'motion/react';
import { Cancel01Icon, AiBrain01Icon } from 'hugeicons-react';
import type { TelemetrySummaryResponse } from '@/hooks/useAiTelemetrySummary';

interface AiAnalysisCardProps {
  data: TelemetrySummaryResponse;
  onClose: () => void;
  isLoading?: boolean;
}

const shimmer = `absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.04)_50%,transparent_100%)] animate-shimmer`;

export function AiAnalysisCard({ data, onClose, isLoading }: AiAnalysisCardProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-3">
          <div className="relative size-12 rounded-full bg-black/[0.04] overflow-hidden">
            <div className={shimmer} />
            <div className="absolute inset-0 flex items-center justify-center">
              <AiBrain01Icon className="size-5 text-black/30" />
            </div>
          </div>
          <p className="text-[14px] font-medium text-black/50">Generating analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-black/[0.04]">
            <AiBrain01Icon className="size-3.5 text-black/60" />
          </div>
          <h3 className="text-[15px] font-semibold text-black">Advanced Analysis</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-black/40 transition-colors hover:bg-black/[0.04] hover:text-black/60"
        >
          <Cancel01Icon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        <p className="text-[14px] leading-relaxed text-black/75">{data.summary}</p>

        {data.key_insights && data.key_insights.length > 0 && (
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-black/35 mb-3">
              Key Insights
            </h4>
            <ul className="space-y-2">
              {data.key_insights.map((insight, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-black/70">
                  <span className="mt-[5px] size-1.5 shrink-0 rounded-full bg-black/25" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.corner_analysis && data.corner_analysis.length > 0 && (
          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-black/35 mb-3">
              Corner Details
            </h4>
            <div className="space-y-2.5">
              {data.corner_analysis.map((corner, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-black/[0.04] bg-black/[0.01] px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-black/40">
                      Turn {corner.number ?? '?'}
                    </span>
                    {corner.name && (
                      <span className="text-[11px] font-medium text-black/30">{corner.name}</span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-black/65">{corner.analysis}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

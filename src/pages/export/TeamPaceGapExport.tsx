import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import FastlyticsLogo from '@/components/brand/FastlyticsLogo';
import {
  DEFAULT_PNG_EXPORT_PRESET,
  PNG_EXPORT_PRESETS,
  type TeamPaceGapExportPayload,
} from '@/lib/premium-export';

function decodePayload(rawPayload: string | null): TeamPaceGapExportPayload | null {
  if (!rawPayload) return null;

  try {
    const normalized = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded) as TeamPaceGapExportPayload;
  } catch {
    return null;
  }
}

const TeamPaceGapExport = () => {
  const [searchParams] = useSearchParams();
  const payload = useMemo(() => decodePayload(searchParams.get('payload')), [searchParams]);

  const preset = payload?.preset || DEFAULT_PNG_EXPORT_PRESET;
  const presetSpec = PNG_EXPORT_PRESETS[preset];
  const rows = payload?.rows || [];
  const leader = rows[0];
  const maxGap = Math.max(...rows.map((row) => row.gapToLeader), 0.001);
  const gapSpread = Math.max(...rows.map((row) => row.gapToLeader), 0);
  const averageMedian =
    rows.length > 0 ? rows.reduce((sum, row) => sum + row.medianTime, 0) / rows.length : 0;
  const isStory = preset === 'instagram-story';
  const isPortrait = preset === 'instagram-portrait' || isStory;
  const framePadding = isStory ? 52 : isPortrait ? 44 : 40;

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-8 py-6 text-center">
          <div className="text-[20px] font-semibold">Export payload unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div
        id="export-root"
        data-ready="true"
        className="relative overflow-hidden bg-[#09090b] text-white"
        style={{
          width: presetSpec.width,
          height: presetSpec.height,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(255,42,26,0.18), transparent 36%), radial-gradient(circle at 82% 12%, rgba(255,42,26,0.12), transparent 28%), linear-gradient(180deg, #09090b 0%, #060608 100%)',
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.08]" />

        <div className="relative flex h-full flex-col" style={{ padding: `${framePadding}px` }}>
          <header className={isStory ? 'space-y-5' : 'space-y-4'}>
            <div className="flex flex-wrap items-center gap-2">
              {[
                payload.meta.year.toString(),
                payload.meta.event,
                payload.meta.session,
                'FASTLYTICS',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/[0.12] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              <h1
                className="max-w-[86%] text-white"
                style={{
                  fontSize: isStory ? 76 : isPortrait ? 64 : 56,
                  lineHeight: 0.96,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                }}
              >
                {payload.meta.title}
              </h1>
              <p
                className="max-w-[78%] text-white"
                style={{
                  fontSize: isStory ? 24 : 18,
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                {payload.meta.subtitle}
              </p>
            </div>
          </header>

          <section
            className={isStory ? 'mt-8 grid grid-cols-1 gap-3' : 'mt-6 grid grid-cols-3 gap-3'}
          >
            {[
              { label: 'Leader', value: leader?.teamName || 'N/A' },
              { label: 'Gap Spread', value: `+${gapSpread.toFixed(3)}s` },
              { label: 'Median Pace', value: `${averageMedian.toFixed(3)}s` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                  {stat.label}
                </div>
                <div className="mt-3 text-[26px] font-semibold leading-none text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </section>

          <section
            className="mt-6 flex-1 rounded-[28px] border border-white/[0.08] bg-[#0c0c0e]"
            style={{ padding: isStory ? '28px' : '26px' }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.24em] text-white">
                  Session Breakdown
                </div>
                <div className="mt-2 text-[22px] font-semibold text-white">Gap to leader</div>
              </div>
              <div className="rounded-full border border-[#ff2a1a]/50 bg-[#ff2a1a]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {rows.length} teams
              </div>
            </div>

            <div className="mt-6 flex h-[calc(100%-72px)] flex-col justify-between gap-3">
              {rows.map((row, index) => {
                const barWidth = row.gapToLeader <= 0 ? 12 : 12 + (row.gapToLeader / maxGap) * 88;
                const isLeader = index === 0;

                return (
                  <div
                    key={`${row.teamName}-${row.rank ?? index}`}
                    className="rounded-2xl border border-white/[0.06] bg-[#060608] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: row.teamColor }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[18px] font-semibold text-white">
                            {row.teamName}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                            {isLeader ? 'Session leader' : `P${row.rank ?? index + 1}`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[18px] font-semibold text-white">
                          {row.medianTime.toFixed(3)}s
                        </div>
                        <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                          {isLeader ? '0.000s' : `+${row.gapToLeader.toFixed(3)}s`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, backgroundColor: row.teamColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-5">
            <FastlyticsLogo size={34} disableAnimation={true} forceFinalState={true} />

            <div className="text-right text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                More race intelligence
              </div>
              <div className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">
                fastlytics.app
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TeamPaceGapExport;

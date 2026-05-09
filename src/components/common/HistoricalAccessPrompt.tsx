import { Link } from 'react-router-dom';
import { ArrowUpRight, Lock } from 'lucide-react';

interface HistoricalAccessPromptProps {
  year?: number | null;
  eventName?: string;
  compact?: boolean;
}

const inter = { fontFamily: "'Inter', sans-serif" } as const;

export const HistoricalAccessPrompt = ({
  year,
  eventName,
  compact = false,
}: HistoricalAccessPromptProps) => {
  const archiveLabel = [year, eventName].filter(Boolean).join(' ');

  return (
    <section
      style={inter}
      className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,#101117_0%,#09090b_100%)] px-6 py-10 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-10 sm:py-14"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      <div className="pointer-events-none absolute -right-12 top-8 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-red-500/12 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
            <Lock className="h-3.5 w-3.5" />
            Pro Archive
          </div>

          <div className="space-y-3">
            <h2 className="max-w-xl text-3xl font-semibold uppercase tracking-[-0.04em] text-white sm:text-4xl">
              Historical seasons are unlocked on Pro.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
              {archiveLabel
                ? `${archiveLabel} sits inside the Fastlytics archive.`
                : 'This page sits inside the Fastlytics archive.'}{' '}
              Upgrade to Pro to open past race weekends, standings, telemetry layers, and replay
              data outside the live season.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-300 px-5 text-sm font-semibold uppercase tracking-[0.08em] text-slate-950 transition-colors hover:bg-sky-200"
            >
              Upgrade To Pro
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="text-xs uppercase tracking-[0.16em] text-white/38">
              Historical archive, unlimited replay, deeper analysis
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="absolute left-8 top-7 h-48 w-48 rounded-full bg-sky-400/12 blur-3xl" />
          <div className="absolute right-2 top-20 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative h-[260px] sm:h-[300px]">
            <div className="absolute left-0 top-16 w-[72%] rotate-[-8deg] rounded-[26px] border border-white/[0.08] bg-[#12131a] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Current Season
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Open
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <div className="text-4xl font-semibold tracking-[-0.05em] text-white">
                    {year && year > 2000
                      ? Math.max(year, new Date().getFullYear())
                      : new Date().getFullYear()}
                  </div>
                  <div className="mt-2 text-sm text-white/45">
                    Live weekend data and current standings
                  </div>
                </div>
                <div className="grid gap-2">
                  <span className="h-2.5 w-16 rounded-full bg-white/12" />
                  <span className="h-2.5 w-10 rounded-full bg-red-400/45" />
                  <span className="h-2.5 w-14 rounded-full bg-sky-300/35" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-[78%] rotate-[8deg] rounded-[26px] border border-sky-300/18 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(9,9,11,0.96))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.48)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/55">
                  Archive Access
                </span>
                <span className="rounded-full border border-sky-300/24 bg-sky-300/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                  Pro
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-semibold tracking-[-0.05em] text-white/92">
                    {year && year > 2000 ? year : new Date().getFullYear() - 1}
                  </div>
                  <div className="mt-2 text-sm text-sky-100/55">
                    Race archives, telemetry overlays, and replay history
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/20 bg-[#0d1119] text-sky-200 shadow-[0_16px_40px_rgba(56,189,248,0.16)]">
                  <Lock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {compact && (
        <div className="relative mt-6 text-center text-[11px] uppercase tracking-[0.16em] text-white/34">
          Upgrade once, unlock every past season from the same race desk.
        </div>
      )}
    </section>
  );
};

export default HistoricalAccessPrompt;

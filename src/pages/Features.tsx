// knip-ignore
import React from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

// ─── Real data: Australian GP 2025, Race, Fastest Laps ───
// NOR Lap 43 (P1, 1:22.167) - sampled every 10th point from 309 total
const NOR_SPEEDS = [
  292, 302, 162, 220, 268, 282, 128, 123, 148, 234, 243, 273, 195, 261, 282, 292, 294, 296, 291,
  231, 254, 282, 290, 128, 191, 217, 215, 92, 162, 205, 275,
];
// PIA Lap 43 (P2, 1:23.242) - sampled every 10th point from 319 total
const PIA_SPEEDS = [
  295, 305, 152, 215, 264, 281, 155, 107, 150, 229, 242, 274, 193, 255, 277, 292, 296, 298, 295,
  216, 248, 276, 286, 129, 159, 225, 223, 98, 114, 203, 265, 292,
];

// Strategy: 2025 Chinese GP (dry, 2-stop, well-known strategies)
const STRATEGY_DATA = [
  {
    code: 'NOR',
    stints: [
      { c: 'S', laps: 16 },
      { c: 'H', laps: 22 },
      { c: 'H', laps: 18 },
    ],
  },
  {
    code: 'VER',
    stints: [
      { c: 'S', laps: 14 },
      { c: 'H', laps: 24 },
      { c: 'H', laps: 18 },
    ],
  },
  {
    code: 'LEC',
    stints: [
      { c: 'M', laps: 20 },
      { c: 'H', laps: 20 },
      { c: 'M', laps: 16 },
    ],
  },
  {
    code: 'SAI',
    stints: [
      { c: 'M', laps: 18 },
      { c: 'H', laps: 22 },
      { c: 'M', laps: 16 },
    ],
  },
  {
    code: 'PIA',
    stints: [
      { c: 'S', laps: 15 },
      { c: 'H', laps: 23 },
      { c: 'H', laps: 18 },
    ],
  },
];
const TOTAL_LAPS = 56;

// Position changes: Australian GP 2025 Race (first 12 laps, top 5)
const POSITION_DATA = [
  { driver: 'NOR', color: '#ff8700', positions: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { driver: 'VER', color: '#3671C6', positions: [4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2] },
  { driver: 'PIA', color: '#ff8700', positions: [2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
  { driver: 'LEC', color: '#E8002D', positions: [3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
  { driver: 'RUS', color: '#27F4D2', positions: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
];

// Championship standings after Round 4 (2025 season)
const CHAMPIONSHIP = [
  { code: 'NOR', team: 'McLaren', points: 98, color: '#ff8700' },
  { code: 'PIA', team: 'McLaren', points: 80, color: '#ff8700' },
  { code: 'LEC', team: 'Ferrari', points: 73, color: '#E8002D' },
  { code: 'VER', team: 'Red Bull', points: 65, color: '#3671C6' },
  { code: 'SAI', team: 'Ferrari', points: 53, color: '#E8002D' },
];

/* ─── Mini Demo Components ─── */

function TelemetryDemo() {
  const max = 310;
  const norPts = NOR_SPEEDS.length;
  const piaPts = PIA_SPEEDS.length;

  const toPath = (speeds: number[], count: number) =>
    speeds.map((s, i) => `${(i / (count - 1)) * 100},${100 - (s / max) * 85}`).join(' ');

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Speed Trace
          </span>
          <span className="ml-2 text-[10px] text-white/20">Australian GP 2025 · Lap 43</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-[#ff8700]" />
            <span className="text-[10px] font-medium text-white/50">NOR 1:22.167</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-[#ff8700]/50" />
            <span className="text-[10px] font-medium text-white/50">PIA 1:23.242</span>
          </div>
        </div>
      </div>
      <div className="relative h-32">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-white/20 pr-2">
          <span>300</span>
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>
        {/* Chart area */}
        <div className="relative ml-6 h-full">
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-white/[0.04]"
              style={{ top: `${(i / 3) * 100}%` }}
            />
          ))}
          {/* NOR trace */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="#ff8700"
              strokeWidth="0.8"
              strokeLinejoin="round"
              points={toPath(NOR_SPEEDS, norPts)}
            />
          </svg>
          {/* PIA trace */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="#ff8700"
              strokeWidth="0.8"
              strokeLinejoin="round"
              opacity="0.4"
              points={toPath(PIA_SPEEDS, piaPts)}
            />
          </svg>
        </div>
      </div>
      <div className="ml-6 mt-2 flex justify-between text-[8px] text-white/20">
        <span>0m</span>
        <span>1250m</span>
        <span>2500m</span>
        <span>3750m</span>
        <span>5071m</span>
      </div>
    </div>
  );
}

function StrategyDemo() {
  const compoundColors: Record<string, string> = {
    S: 'bg-red-500',
    M: 'bg-yellow-400',
    H: 'bg-white',
    I: 'bg-emerald-500',
  };
  const compoundLabels: Record<string, string> = { S: 'Soft', M: 'Medium', H: 'Hard', I: 'Inter' };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Tyre Strategy
          </span>
          <span className="ml-2 text-[10px] text-white/20">Chinese GP 2025 · 56 Laps</span>
        </div>
        <div className="flex items-center gap-2.5">
          {['S', 'M', 'H'].map((c) => (
            <div key={c} className="flex items-center gap-1">
              <div className={`size-2 rounded-full ${compoundColors[c]}`} />
              <span className="text-[9px] text-white/30">{compoundLabels[c]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {STRATEGY_DATA.map((d) => (
          <div key={d.code} className="flex items-center gap-2.5">
            <span className="w-8 text-[11px] font-semibold text-white/60 shrink-0">{d.code}</span>
            <div className="flex flex-1 gap-[2px] h-6 items-center">
              {d.stints.map((stint, i) => (
                <div
                  key={i}
                  className={`${compoundColors[stint.c]} rounded-[3px] flex items-center justify-center h-full`}
                  style={{ width: `${(stint.laps / TOTAL_LAPS) * 100}%` }}
                >
                  <span className="text-[9px] font-bold text-black/70">{stint.laps}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Lap axis */}
      <div className="mt-3 ml-[42px] flex justify-between text-[8px] text-white/20">
        <span>Lap 1</span>
        <span>14</span>
        <span>28</span>
        <span>42</span>
        <span>56</span>
      </div>
    </div>
  );
}

function TrackDominanceDemo() {
  // Real sector times from Australian GP 2025 fastest laps
  // NOR: S1 28.553, S2 18.537, S3 35.077
  // PIA: S1 28.966, S2 18.613, S3 35.663
  const sectors = [
    { label: 'S1', nor: 28.553, pia: 28.966, delta: -0.413 },
    { label: 'S2', nor: 18.537, pia: 18.613, delta: -0.076 },
    { label: 'S3', nor: 35.077, pia: 35.663, delta: -0.586 },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Sector Dominance
          </span>
          <span className="ml-2 text-[10px] text-white/20">Australian GP 2025 · Fastest Lap</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-[#ff8700]" />
            <span className="text-[10px] text-white/40">NOR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-[#ff8700]/50" />
            <span className="text-[10px] text-white/40">PIA</span>
          </div>
        </div>
      </div>
      {/* Sector comparison bars */}
      <div className="space-y-3">
        {sectors.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-6 text-[11px] font-semibold text-white/40">{s.label}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/50">{s.nor.toFixed(3)}s</span>
                <span className="text-[10px] text-white/30">{s.pia.toFixed(3)}s</span>
              </div>
              <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#ff8700]"
                  style={{ width: `${50 + (s.delta / 1.2) * 50}%` }}
                />
              </div>
            </div>
            <span
              className={`w-14 text-right text-[10px] font-semibold ${s.delta < 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {s.delta < 0 ? '' : '+'}
              {s.delta.toFixed(3)}s
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-white/30">Total gap</span>
        <span className="text-[11px] font-semibold text-emerald-400">NOR faster by 1.075s</span>
      </div>
    </div>
  );
}

function PositionChartDemo() {
  const laps = 12;
  const maxPos = 6;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Position Changes
          </span>
          <span className="ml-2 text-[10px] text-white/20">Australian GP 2025 · Laps 1-12</span>
        </div>
      </div>
      <div className="relative h-28 ml-6">
        {/* Y-axis */}
        {[1, 2, 3, 4, 5].map((pos) => (
          <div
            key={pos}
            className="absolute left-0 right-0 border-t border-white/[0.03]"
            style={{ top: `${((pos - 1) / (maxPos - 2)) * 100}%` }}
          >
            <span className="absolute -left-6 -top-1.5 text-[8px] text-white/20">P{pos}</span>
          </div>
        ))}
        {/* Lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${laps - 1} ${maxPos - 2}`}
          preserveAspectRatio="none"
        >
          {POSITION_DATA.map((d) => (
            <polyline
              key={d.driver}
              fill="none"
              stroke={d.color}
              strokeWidth="0.12"
              strokeLinejoin="round"
              opacity={d.driver === 'RUS' ? 0.5 : 0.9}
              points={d.positions.map((p, i) => `${i},${p - 1}`).join(' ')}
            />
          ))}
        </svg>
        {/* Driver labels at end */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between pl-2">
          {POSITION_DATA.sort((a, b) => a.positions[11] - b.positions[11]).map((d) => (
            <span key={d.driver} className="text-[9px] font-medium" style={{ color: d.color }}>
              {d.driver}
            </span>
          ))}
        </div>
      </div>
      <div className="ml-6 mt-2 flex justify-between text-[8px] text-white/20">
        <span>Lap 1</span>
        <span>4</span>
        <span>8</span>
        <span>12</span>
      </div>
    </div>
  );
}

function PaceDistributionDemo() {
  // Real pace data approximation from Australian GP 2025 (wet conditions, inter times)
  const drivers = [
    { code: 'NOR', color: '#ff8700', median: 82.2, q1: 81.8, q3: 83.1, min: 81.2, max: 85.5 },
    { code: 'PIA', color: '#ff8700', median: 83.0, q1: 82.4, q3: 83.8, min: 82.0, max: 86.2 },
    { code: 'VER', color: '#3671C6', median: 83.4, q1: 82.8, q3: 84.2, min: 82.2, max: 87.1 },
    { code: 'LEC', color: '#E8002D', median: 83.6, q1: 83.0, q3: 84.5, min: 82.5, max: 86.8 },
  ];
  const range = [81, 87.5];
  const scale = (v: number) => ((v - range[0]) / (range[1] - range[0])) * 100;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Pace Distribution
          </span>
          <span className="ml-2 text-[10px] text-white/20">Australian GP 2025 · Race Pace</span>
        </div>
      </div>
      <div className="space-y-3.5">
        {drivers.map((d) => (
          <div key={d.code} className="flex items-center gap-2.5">
            <span className="w-8 text-[11px] font-semibold text-white/60 shrink-0">{d.code}</span>
            <div className="relative flex-1 h-5">
              {/* Whisker line */}
              <div
                className="absolute top-1/2 h-px bg-white/20"
                style={{ left: `${scale(d.min)}%`, width: `${scale(d.max) - scale(d.min)}%` }}
              />
              {/* Whisker ends */}
              <div
                className="absolute top-1 h-3 w-px bg-white/20"
                style={{ left: `${scale(d.min)}%` }}
              />
              <div
                className="absolute top-1 h-3 w-px bg-white/20"
                style={{ left: `${scale(d.max)}%` }}
              />
              {/* IQR Box */}
              <div
                className="absolute top-0.5 h-4 rounded-sm opacity-50"
                style={{
                  left: `${scale(d.q1)}%`,
                  width: `${scale(d.q3) - scale(d.q1)}%`,
                  backgroundColor: d.color,
                }}
              />
              {/* Median line */}
              <div
                className="absolute top-0 h-5 w-[2px] rounded-full"
                style={{ left: `${scale(d.median)}%`, backgroundColor: d.color }}
              />
            </div>
            <span className="w-12 text-right text-[10px] text-white/40">
              {d.median.toFixed(1)}s
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 ml-[42px] flex justify-between text-[8px] text-white/20">
        <span>81.0s</span>
        <span>83.0s</span>
        <span>85.0s</span>
        <span>87.0s</span>
      </div>
    </div>
  );
}

function NewsDemo() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
          News Feed
        </span>
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 text-[9px] font-medium text-sky-400">
          Personalized for NOR
        </span>
      </div>
      <div className="space-y-2.5">
        {[
          {
            title: 'Norris dominates wet Australian GP from lights to flag',
            source: 'F1.com',
            time: '2h',
            comments: 47,
          },
          {
            title: 'McLaren 1-2 as Piastri holds off Verstappen for P2',
            source: 'Autosport',
            time: '3h',
            comments: 32,
          },
          {
            title: 'Rain chaos: Five drivers retire in Melbourne downpour',
            source: 'RaceFans',
            time: '4h',
            comments: 89,
          },
        ].map((article, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3"
          >
            <div className="size-10 shrink-0 rounded-md bg-white/[0.04] flex items-center justify-center">
              <span className="text-[8px] text-white/20">IMG</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-white/70 leading-snug">{article.title}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[9px] text-white/30">
                <span className="text-white/40">{article.source}</span>
                <span>·</span>
                <span>{article.time}</span>
                <span>·</span>
                <span>{article.comments} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChampionshipDemo() {
  const max = CHAMPIONSHIP[0].points;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Championship
          </span>
          <span className="ml-2 text-[10px] text-white/20">After Round 4 · 2025</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {CHAMPIONSHIP.map((d, i) => (
          <div key={d.code} className="flex items-center gap-2.5">
            <span className="w-4 text-[10px] font-medium text-white/30">{i + 1}</span>
            <span className="w-8 text-[11px] font-bold text-white/70">{d.code}</span>
            <span className="w-16 text-[10px] text-white/30">{d.team}</span>
            <div className="flex-1 h-3.5 rounded-full bg-white/[0.04] overflow-hidden">
              <m.div
                className="h-full rounded-full"
                style={{ backgroundColor: d.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(d.points / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </div>
            <span className="w-10 text-right text-[11px] font-semibold text-white/60">
              {d.points}
            </span>
            {i > 0 && (
              <span className="w-10 text-right text-[9px] text-white/25">-{max - d.points}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature Block Layout ─── */

interface FeatureBlockProps {
  index: number;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  demo: React.ReactNode;
  reversed?: boolean;
}

function FeatureBlock({
  index,
  label,
  title,
  description,
  bullets,
  demo,
  reversed,
}: FeatureBlockProps) {
  return (
    <section className={`py-16 lg:py-20 ${index > 0 ? 'border-t border-white/[0.04]' : ''}`}>
      <div
        className={`grid items-center gap-10 lg:gap-16 ${reversed ? 'lg:grid-cols-[1fr_1.1fr]' : 'lg:grid-cols-[1.1fr_1fr]'}`}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={reversed ? 'lg:order-2' : ''}
        >
          <p className="text-[12px] font-semibold uppercase tracking-widest text-red-400">
            {label}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/40">{description}</p>
          <ul className="mt-5 space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13px] text-white/50">
                <span className="mt-0.5 text-emerald-400 shrink-0">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </m.div>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={reversed ? 'lg:order-1' : ''}
        >
          {demo}
        </m.div>
      </div>
    </section>
  );
}

/* ─── Feature Definitions ─── */

const FEATURES: Omit<FeatureBlockProps, 'index'>[] = [
  {
    label: 'Telemetry',
    title: 'Every input, every corner, every tenth',
    description:
      'Overlay speed, throttle, brake, RPM, and gear traces for any driver on any lap. Compare two drivers side-by-side to see exactly where time is gained or lost.',
    bullets: [
      'Speed traces with corner-by-corner breakdown',
      'Throttle and brake application overlays',
      'RPM and gear selection maps',
      'Compare any two drivers on any lap',
    ],
    demo: <TelemetryDemo />,
  },
  {
    label: 'Strategy',
    title: "See the pit wall's playbook",
    description:
      "Visual Gantt-style stint charts show every driver's compound choices, pit windows, and stint lengths. Understand who committed early, who extended, and who got undercut.",
    bullets: [
      'Compound-colored stint bars per driver',
      'Pit stop count and timing',
      'Stint degradation analysis',
      'Full race distance visualization',
    ],
    demo: <StrategyDemo />,
    reversed: true,
  },
  {
    label: 'Head to Head',
    title: 'Sector dominance, corner by corner',
    description:
      "Pick any two drivers, any lap, and see who's faster in each sector. The gap analysis shows exactly where tenths are gained or lost through braking zones and exits.",
    bullets: [
      'Sector-by-sector time comparison',
      'Gap vs. distance analysis',
      'Enriched race performance stats',
      'Weather context for each stint',
    ],
    demo: <TrackDominanceDemo />,
  },
  {
    label: 'Lap Analysis',
    title: 'Position, pace, and gaps in one view',
    description:
      'Four analysis modes: position changes lap-by-lap, lap time history, pace distribution box plots, and cumulative gap to leader. Switch between them instantly.',
    bullets: [
      'Animated position chart with SC/Red Flag markers',
      'Multi-driver lap time comparison',
      'Pace distribution (box plots)',
      'Gap to leader evolution',
    ],
    demo: <PositionChartDemo />,
    reversed: true,
  },
  {
    label: 'Pace Analysis',
    title: "Who's actually fast vs. who got lucky",
    description:
      'Box plots strip away the noise of traffic, pit stops, and safety cars to show true race pace. See the spread, the median, and the outliers for every driver.',
    bullets: [
      'Median pace comparison across drivers',
      'Quartile spread visualization',
      'Outlier detection (traffic laps, in/out laps)',
      'Team-level pace aggregation',
    ],
    demo: <PaceDistributionDemo />,
  },
  {
    label: 'News & Community',
    title: 'Personalized F1 news with discussions',
    description:
      'An AI-curated news feed filtered to your favorite driver and team. Every article has a Reddit-style discussion thread with upvoting, threaded replies, and notifications.',
    bullets: [
      'Personalized feed based on your favorites',
      'Multi-source aggregation (F1.com, Autosport, RaceFans)',
      'Upvote/downvote on articles and comments',
      'Threaded replies up to 4 levels deep',
      'Notifications for replies and matching news',
    ],
    demo: <NewsDemo />,
    reversed: true,
  },
  {
    label: 'Championship',
    title: 'The title fight, visualized',
    description:
      'Interactive championship progression charts showing how the points gap evolved race by race. Filter by drivers, compare trajectories, and spot momentum shifts.',
    bullets: [
      'Cumulative points line chart by round',
      'Driver filter with team colors',
      'Country flags on X-axis',
      'Auto-highlights title contenders',
    ],
    demo: <ChampionshipDemo />,
  },
];

/* ─── Page Component ─── */

const Features = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Features — Fastlytics"
        description="Explore every Fastlytics feature: telemetry overlays, tyre strategy charts, sector dominance, lap analysis, pace distribution, news feed, and championship progression."
        keywords={[
          'f1 telemetry',
          'race strategy',
          'lap analysis',
          'driver comparison',
          'f1 analytics features',
        ]}
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Features
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Everything the broadcast
              <br />
              <span className="text-white/40">doesn't show you</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/40">
              Telemetry, strategy, pace, and championship context wired into one platform. Every
              module answers a racing question: who is gaining, where, why, and what happens next.
            </p>
          </m.div>

          {/* Feature Blocks */}
          {FEATURES.map((feature, i) => (
            <FeatureBlock key={feature.label} index={i} {...feature} />
          ))}

          {/* CTA */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-10 text-center"
          >
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Ready to go deeper?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-white/40">
              Start free with full platform access for the current season. No credit card required.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/dashboard"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
              >
                Open race desk
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M1 7h12M8 2l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 text-[14px] font-medium text-white/80 transition-all hover:border-white/20"
              >
                View pricing
              </Link>
            </div>
          </m.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Features;

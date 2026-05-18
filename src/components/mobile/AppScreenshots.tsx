import React from 'react';
import miamiData from './miami-2026-data.json';

/**
 * App Store-style screenshot slides with REAL Miami 2026 GP data.
 * Pitch black backgrounds, no borders, clean mobile UI.
 */

const TOTAL_LAPS = miamiData.total_laps;
const RESULTS = miamiData.results;
const STINTS = miamiData.driver_stints as Record<
  string,
  { compound: string; start_lap: number; end_lap: number; laps: number }[]
>;
const CIRCUIT_PATH = miamiData.circuit_svg_path;

// Real speed trace data (ANT fastest lap + NOR fastest lap, normalized to 200x60 viewbox, 66 points each)
const ANT_SPEED_PATH =
  'M -0.4,16.5 L 3.5,15.4 L 8.5,14.6 L 12.7,36.9 L 14.1,43.8 L 15.5,44.4 L 17.4,38.6 L 19.1,35.6 L 21.3,29.5 L 24.0,25.6 L 27.9,20.9 L 31.8,18.4 L 35.9,17.9 L 40.3,17.9 L 43.4,20.9 L 46.6,24.0 L 50.3,26.1 L 53.6,26.2 L 56.6,28.9 L 58.8,36.1 L 60.9,40.5 L 62.5,40.0 L 64.4,34.4 L 67.7,24.6 L 71.5,18.4 L 75.9,13.5 L 80.7,10.7 L 84.3,9.7 L 88.7,8.9 L 94.7,8.8 L 99.0,9.7 L 103.4,10.3 L 108.5,10.8 L 112.4,13.2 L 115.4,35.0 L 117.3,44.9 L 118.9,44.0 L 120.7,42.1 L 122.4,45.2 L 123.7,41.6 L 126.2,35.8 L 128.0,41.1 L 129.3,46.2 L 130.8,45.5 L 132.0,43.0 L 133.3,48.2 L 134.2,46.0 L 136.3,35.8 L 139.6,25.0 L 142.7,19.0 L 147.4,13.5 L 151.8,10.8 L 156.9,9.9 L 160.8,10.3 L 164.8,10.5 L 168.2,10.7 L 172.5,10.8 L 176.5,11.0 L 181.4,37.4 L 183.2,48.8 L 184.3,47.9 L 185.8,40.0 L 189.1,27.6 L 192.7,21.0 L 196.6,18.0 L 200.0,17.1';
const NOR_SPEED_PATH =
  'M -0.1,15.1 L 4.5,14.1 L 8.4,13.2 L 11.8,29.4 L 13.8,42.4 L 15.0,45.7 L 16.1,42.6 L 17.5,37.4 L 20.8,30.6 L 24.0,26.1 L 26.5,22.8 L 29.7,19.9 L 33.4,18.8 L 36.2,18.5 L 39.9,17.9 L 42.6,20.7 L 46.6,24.6 L 48.9,27.2 L 51.7,25.7 L 54.4,26.4 L 56.6,31.2 L 58.8,36.9 L 60.5,41.0 L 62.2,40.5 L 64.1,33.0 L 67.5,23.7 L 70.2,19.0 L 74.2,14.1 L 77.8,11.3 L 82.7,9.4 L 89.5,8.9 L 96.0,10.0 L 100.2,10.7 L 104.5,10.7 L 107.5,11.0 L 111.7,19.1 L 114.7,41.6 L 116.3,46.2 L 117.8,41.0 L 119.0,42.7 L 120.3,45.5 L 122.2,40.7 L 124.2,37.4 L 125.9,40.2 L 127.1,45.2 L 128.3,45.5 L 129.9,43.5 L 130.9,46.8 L 131.9,47.9 L 132.9,42.7 L 136.6,27.3 L 140.1,19.9 L 143.4,15.2 L 147.4,11.6 L 153.0,9.2 L 157.9,8.1 L 163.5,8.5 L 169.3,8.9 L 174.0,9.4 L 177.4,24.6 L 179.4,41.1 L 180.5,48.7 L 181.4,49.0 L 182.6,43.0 L 184.0,36.1 L 187.6,25.4 L 190.8,19.9 L 195.3,16.3 L 200.0,14.4';

const COMPOUND_COLORS: Record<string, string> = {
  MEDIUM: '#fbbf24',
  HARD: '#e5e7eb',
  SOFT: '#ef4444',
  INTERMEDIATE: '#22c55e',
  WET: '#3b82f6',
};

const TEAM_COLORS: Record<string, string> = {
  mercedes: '#27f4d2',
  ferrari: '#e80020',
  mclaren: '#ff8000',
  redbull: '#0600ef',
  astonmartin: '#229971',
  alpine: '#ff87bc',
  williams: '#00a0dd',
  haas: '#b6babd',
  alphatauri: '#fcd700',
  gray: '#909090',
};

const STANDINGS = [
  {
    rank: 1,
    code: 'ANT',
    name: 'Kimi Antonelli',
    team: 'Mercedes',
    points: 100,
    teamColor: 'mercedes',
  },
  {
    rank: 2,
    code: 'RUS',
    name: 'George Russell',
    team: 'Mercedes',
    points: 80,
    teamColor: 'mercedes',
  },
  {
    rank: 3,
    code: 'LEC',
    name: 'Charles Leclerc',
    team: 'Ferrari',
    points: 59,
    teamColor: 'ferrari',
  },
  {
    rank: 4,
    code: 'HAM',
    name: 'Lewis Hamilton',
    team: 'Ferrari',
    points: 51,
    teamColor: 'ferrari',
  },
  { rank: 5, code: 'NOR', name: 'Lando Norris', team: 'McLaren', points: 51, teamColor: 'mclaren' },
  {
    rank: 6,
    code: 'PIA',
    name: 'Oscar Piastri',
    team: 'McLaren',
    points: 43,
    teamColor: 'mclaren',
  },
  {
    rank: 7,
    code: 'VER',
    name: 'Max Verstappen',
    team: 'Red Bull Racing',
    points: 26,
    teamColor: 'redbull',
  },
];

// Driver images path pattern
const getDriverImg = (code: string) =>
  `/drivers/2026/2026${getTeamSlug(code)}${getDriverSlug(code)}01right.avif`;
const getTeamSlug = (code: string) => {
  const team = RESULTS.find((r) => r.code === code)?.team || '';
  const map: Record<string, string> = {
    Mercedes: 'mercedes',
    McLaren: 'mclaren',
    Ferrari: 'ferrari',
    'Red Bull Racing': 'redbullracing',
    'Aston Martin': 'astonmartin',
    Alpine: 'alpine',
    Williams: 'williams',
    'Haas F1 Team': 'haasf1team',
    'Racing Bulls': 'racingbulls',
    Audi: 'audi',
    Cadillac: 'cadillac',
  };
  return map[team] || team.toLowerCase().replace(/\s/g, '');
};
const getDriverSlug = (code: string) => {
  const map: Record<string, string> = {
    ANT: 'andant',
    NOR: 'lannor',
    PIA: 'oscpia',
    RUS: 'georus',
    VER: 'maxver',
    HAM: 'lewham',
    COL: 'fracol',
    LEC: 'chalec',
    SAI: 'carsai',
    ALB: 'alealb',
  };
  return map[code] || code.toLowerCase();
};

// ─── Screen: Dashboard ───────────────────────────────────────────────────────

function ScreenDashboard() {
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[6px] text-white/40 font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm border border-white/30 relative">
            <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-3 pt-2 pb-3">
        <div className="text-[7px] text-white/30">Good afternoon</div>
        <div className="text-[11px] font-bold text-white tracking-tight">Subhash</div>
      </div>

      {/* Next Race Card */}
      <div className="mx-3 rounded-xl bg-white/[0.03] p-3 mb-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[6px] uppercase tracking-widest text-white/25 font-semibold">
            Next Race • R05
          </span>
          <span className="text-[6px] text-white/25">May 24</span>
        </div>
        <div className="text-[10px] font-bold text-white">Canadian Grand Prix</div>
        <div className="text-[7px] text-white/35 mt-0.5">Montreal, Canada</div>
        <div className="flex gap-4 mt-2.5">
          {[
            { v: '05', l: 'DAYS' },
            { v: '11', l: 'HRS' },
            { v: '42', l: 'MIN' },
          ].map((u) => (
            <div key={u.l} className="text-center">
              <div className="text-[11px] font-bold text-white tabular-nums">{u.v}</div>
              <div className="text-[5px] text-white/20 tracking-wider">{u.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Standings */}
      <div className="mx-3 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[6px] uppercase tracking-widest text-white/25 font-semibold">
            Driver Standings
          </span>
          <span className="text-[6px] text-white/15">2026</span>
        </div>
        <div className="space-y-[3px]">
          {STANDINGS.slice(0, 7).map((d) => (
            <div key={d.code} className="flex items-center gap-1.5 py-[2px]">
              <span className="text-[7px] text-white/25 w-2.5 tabular-nums font-medium">
                {d.rank}
              </span>
              <div className="w-[13px] h-[13px] rounded-full overflow-hidden bg-white/[0.03] shrink-0">
                <img
                  src={getDriverImg(d.code)}
                  alt=""
                  className="w-full h-full object-cover object-top scale-125"
                />
              </div>
              <div
                className="w-[2.5px] h-[9px] rounded-full shrink-0"
                style={{ backgroundColor: TEAM_COLORS[d.teamColor] || '#666' }}
              />
              <span className="text-[7px] font-semibold text-white/90 flex-1 truncate">
                {d.name.split(' ').pop()}
              </span>
              <span className="text-[7px] text-white/35 tabular-nums">{d.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around px-3 py-2.5 border-t border-white/[0.03]">
        {['Home', 'Race', 'Replay', 'More'].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-[3px]">
            <div
              className={`w-[4px] h-[4px] rounded-full ${i === 0 ? 'bg-[#ff2a1a]' : 'bg-transparent'}`}
            />
            <span
              className={`text-[5px] font-medium ${i === 0 ? 'text-white/90' : 'text-white/25'}`}
            >
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Telemetry ───────────────────────────────────────────────────────

function ScreenTelemetry() {
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[6px] text-white/40 font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm border border-white/30 relative">
            <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pt-1.5 pb-2">
        <div className="text-[6px] text-white/20 uppercase tracking-widest">Miami GP • Race</div>
        <div className="text-[10px] font-bold text-white tracking-tight">Speed Trace</div>
      </div>

      {/* Driver pills */}
      <div className="flex gap-1.5 px-3 mb-2.5">
        <div
          className="flex items-center gap-1 px-2 py-[3px] rounded-full"
          style={{ backgroundColor: '#27f4d2' + '18' }}
        >
          <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: '#27f4d2' }} />
          <span className="text-[6px] font-bold" style={{ color: '#27f4d2' }}>
            ANT
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-[3px] rounded-full bg-white/[0.03]">
          <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: '#ff8000' }} />
          <span className="text-[6px] font-medium text-white/40">NOR</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mx-3 flex-1 flex flex-col min-h-0">
        {/* Y axis + chart area */}
        <div className="flex-1 relative">
          {/* Y labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pr-1">
            <span className="text-[5px] text-white/15">350</span>
            <span className="text-[5px] text-white/15">250</span>
            <span className="text-[5px] text-white/15">150</span>
            <span className="text-[5px] text-white/15">50</span>
          </div>
          {/* Chart */}
          <div className="absolute left-3 right-0 top-0 bottom-0">
            <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
              {/* Grid */}
              {[15, 30, 45].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="200"
                  y2={y}
                  stroke="white"
                  strokeOpacity="0.03"
                  strokeWidth="0.3"
                />
              ))}
              {/* Traces */}
              <path
                d={ANT_SPEED_PATH}
                fill="none"
                stroke="#27f4d2"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={NOR_SPEED_PATH}
                fill="none"
                stroke="#ff8000"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>
        {/* X labels */}
        <div className="flex justify-between pl-3 mt-1">
          {['0', '1km', '2km', '3km', '4km', '5km'].map((l) => (
            <span key={l} className="text-[4px] text-white/15">
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Live readouts */}
      <div className="grid grid-cols-4 gap-[3px] px-3 py-2.5">
        {[
          { label: 'Speed', value: '334' },
          { label: 'Throttle', value: '100%' },
          { label: 'Brake', value: '0%' },
          { label: 'Gear', value: '8' },
        ].map((t) => (
          <div key={t.label} className="bg-white/[0.02] rounded-lg p-1.5 text-center">
            <div className="text-[4.5px] text-white/20 mb-[2px]">{t.label}</div>
            <div className="text-[8px] font-bold tabular-nums text-white">{t.value}</div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around px-3 py-2.5 border-t border-white/[0.03]">
        {['Home', 'Race', 'Replay', 'More'].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-[3px]">
            <div
              className={`w-[4px] h-[4px] rounded-full ${i === 1 ? 'bg-[#ff2a1a]' : 'bg-transparent'}`}
            />
            <span
              className={`text-[5px] font-medium ${i === 1 ? 'text-white/90' : 'text-white/25'}`}
            >
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Session Replay ──────────────────────────────────────────────────

function ScreenReplay() {
  // Position dots along the circuit for top 7 drivers
  const driverPositions = [
    { code: 'ANT', x: 580, y: 178, pos: 1 },
    { code: 'NOR', x: 616, y: 250, pos: 2 },
    { code: 'PIA', x: 615, y: 236, pos: 3 },
    { code: 'RUS', x: 608, y: 228, pos: 4 },
    { code: 'VER', x: 598, y: 220, pos: 5 },
    { code: 'HAM', x: 586, y: 205, pos: 6 },
    { code: 'COL', x: 572, y: 143, pos: 7 },
  ];

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[6px] text-white/40 font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm border border-white/30 relative">
            <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pt-1 pb-1.5 flex items-center justify-between">
        <div>
          <div className="text-[6px] text-white/20 uppercase tracking-widest">Session Replay</div>
          <div className="text-[9px] font-bold text-white tracking-tight">Miami GP • Race</div>
        </div>
        <div className="text-[6px] text-white/25 tabular-nums">Lap 42 / {TOTAL_LAPS}</div>
      </div>

      {/* Track */}
      <div className="mx-2 relative" style={{ height: '72px' }}>
        <svg viewBox="0 0 1000 430" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <path
            d={CIRCUIT_PATH}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={CIRCUIT_PATH}
            fill="none"
            stroke="#222"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 4"
            opacity="0.4"
          />
          {driverPositions.map((d) => {
            const r = RESULTS.find((res) => res.code === d.code);
            return (
              <g key={d.code}>
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={d.pos === 1 ? 12 : 8}
                  fill={r?.color || '#fff'}
                  stroke="#000"
                  strokeWidth="2"
                />
                {d.pos <= 3 && (
                  <text
                    x={d.x}
                    y={d.y - 16}
                    textAnchor="middle"
                    fill={r?.color || '#fff'}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {d.code}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Playback bar */}
      <div className="mx-3 flex items-center gap-2 my-1.5">
        <div className="w-4 h-4 rounded-full bg-white/[0.04] flex items-center justify-center">
          <div className="w-0 h-0 border-l-[4px] border-l-white/80 border-t-[2.5px] border-t-transparent border-b-[2.5px] border-b-transparent ml-[1px]" />
        </div>
        <div className="flex-1 h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full w-[74%] rounded-full bg-[#ff2a1a]" />
        </div>
        <span className="text-[5px] text-white/20 tabular-nums">1:31.99</span>
      </div>

      {/* Leaderboard */}
      <div className="mx-3 flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[6px] text-white/20 uppercase tracking-widest font-semibold">
            Leaderboard
          </span>
          <span className="text-[5px] text-white/15 font-bold">INT</span>
        </div>
        <div className="space-y-0">
          {RESULTS.slice(0, 7).map((d, i) => (
            <div key={d.code} className="flex items-center gap-1.5 py-[3px]">
              <span className="text-[6px] text-white/20 w-2 tabular-nums text-center font-medium">
                {d.pos}
              </span>
              <div className="w-[11px] h-[11px] rounded-full overflow-hidden bg-white/[0.03] shrink-0">
                <img
                  src={getDriverImg(d.code)}
                  alt=""
                  className="w-full h-full object-cover object-top scale-125"
                />
              </div>
              <div
                className="w-[2px] h-[8px] rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[6.5px] font-semibold text-white/80 flex-1">{d.code}</span>
              {/* Tyre */}
              <div
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ backgroundColor: i < 3 ? COMPOUND_COLORS.HARD : COMPOUND_COLORS.HARD }}
              />
              {/* Gap */}
              <span className="text-[5.5px] text-white/30 tabular-nums w-7 text-right font-medium">
                {i === 0 ? (
                  <span className="text-white/50 text-[5px]">LDR</span>
                ) : (
                  d.gap.replace('+', '').replace('s', '')
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around px-3 py-2.5 border-t border-white/[0.03]">
        {['Home', 'Race', 'Replay', 'More'].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-[3px]">
            <div
              className={`w-[4px] h-[4px] rounded-full ${i === 2 ? 'bg-[#ff2a1a]' : 'bg-transparent'}`}
            />
            <span
              className={`text-[5px] font-medium ${i === 2 ? 'text-white/90' : 'text-white/25'}`}
            >
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Strategy ────────────────────────────────────────────────────────

function ScreenStrategy() {
  const topDrivers = RESULTS.slice(0, 14);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[6px] text-white/40 font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm border border-white/30 relative">
            <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pt-1.5 pb-2">
        <div className="text-[6px] text-white/20 uppercase tracking-widest">Miami GP • Race</div>
        <div className="text-[10px] font-bold text-white tracking-tight">Tyre Strategy</div>
      </div>

      {/* Compound legend */}
      <div className="flex gap-3 px-3 mb-2">
        {[
          { c: '#ef4444', l: 'Soft' },
          { c: '#fbbf24', l: 'Medium' },
          { c: '#e5e7eb', l: 'Hard' },
        ].map((t) => (
          <div key={t.l} className="flex items-center gap-[3px]">
            <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: t.c }} />
            <span className="text-[5px] text-white/30">{t.l}</span>
          </div>
        ))}
      </div>

      {/* Lap axis */}
      <div className="flex justify-between px-3 mb-1">
        {['1', '14', '28', '42', '57'].map((l) => (
          <span key={l} className="text-[4px] text-white/12">
            L{l}
          </span>
        ))}
      </div>

      {/* Strategy rows */}
      <div className="px-3 flex-1 min-h-0 space-y-[3px]">
        {topDrivers.map((d) => {
          const driverStints = STINTS[d.code] || [];
          return (
            <div key={d.code} className="flex items-center gap-1.5 py-[1px]">
              <span className="text-[5px] text-white/15 w-2.5 tabular-nums">P{d.pos}</span>
              <div
                className="w-[2px] h-[12px] rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[6px] font-semibold text-white/70 w-5 shrink-0">{d.code}</span>
              {/* Stint bars */}
              <div className="flex flex-1 h-[9px] gap-[1px]">
                {driverStints.map((stint, i) => {
                  const width = (stint.laps / TOTAL_LAPS) * 100;
                  const color = COMPOUND_COLORS[stint.compound] || '#666';
                  return (
                    <div
                      key={i}
                      className="h-full rounded-[2px] flex items-center justify-center"
                      style={{ width: `${width}%`, backgroundColor: color, opacity: 0.85 }}
                    >
                      {width > 18 && (
                        <span className="text-[4px] font-bold text-black/50">{stint.laps}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around px-3 py-2.5 border-t border-white/[0.03]">
        {['Home', 'Race', 'Replay', 'More'].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-[3px]">
            <div
              className={`w-[4px] h-[4px] rounded-full ${i === 1 ? 'bg-[#ff2a1a]' : 'bg-transparent'}`}
            />
            <span
              className={`text-[5px] font-medium ${i === 1 ? 'text-white/90' : 'text-white/25'}`}
            >
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Track Dominance ─────────────────────────────────────────────────

function ScreenDominance() {
  // Sector data: ANT vs NOR fastest laps Miami 2026
  const sectors = [
    { label: 'S1', ant: 31.89, nor: 31.96, delta: -0.07 },
    { label: 'S2', ant: 33.98, nor: 34.43, delta: -0.45 },
    { label: 'S3', ant: 25.35, nor: 25.18, delta: +0.17 },
  ];

  // Split the circuit path into 3 rough segments for coloring

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-[6px] text-white/40 font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm border border-white/30 relative">
            <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pt-1.5 pb-2">
        <div className="text-[6px] text-white/20 uppercase tracking-widest">
          Miami GP • Fastest Lap
        </div>
        <div className="text-[10px] font-bold text-white tracking-tight">Track Dominance</div>
      </div>

      {/* Driver comparison header */}
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-[11px] h-[11px] rounded-full overflow-hidden bg-white/[0.03]">
            <img
              src={getDriverImg('ANT')}
              alt=""
              className="w-full h-full object-cover object-top scale-125"
            />
          </div>
          <div className="w-[4px] h-[4px] rounded-full bg-[#27f4d2]" />
          <span className="text-[7px] font-bold text-white/80">ANT</span>
        </div>
        <span className="text-[5px] text-white/15">vs</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] font-bold text-white/80">NOR</span>
          <div className="w-[4px] h-[4px] rounded-full bg-[#ff8000]" />
          <div className="w-[11px] h-[11px] rounded-full overflow-hidden bg-white/[0.03]">
            <img
              src={getDriverImg('NOR')}
              alt=""
              className="w-full h-full object-cover object-top scale-125"
            />
          </div>
        </div>
      </div>

      {/* Track with colored segments */}
      <div className="mx-2 flex-1 relative flex items-center justify-center">
        <svg viewBox="0 0 1000 430" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Base track */}
          <path
            d={CIRCUIT_PATH}
            fill="none"
            stroke="#111"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* S1 - ANT faster (teal) - first ~33% of path */}
          <path
            d={CIRCUIT_PATH}
            fill="none"
            stroke="#27f4d2"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
            pathLength="100"
            strokeDasharray="33 100"
            strokeDashoffset="0"
          />
          {/* S2 - ANT faster (teal) - middle ~35% */}
          <path
            d={CIRCUIT_PATH}
            fill="none"
            stroke="#27f4d2"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
            pathLength="100"
            strokeDasharray="35 100"
            strokeDashoffset="-33"
          />
          {/* S3 - NOR faster (orange) - last ~32% */}
          <path
            d={CIRCUIT_PATH}
            fill="none"
            stroke="#ff8000"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
            pathLength="100"
            strokeDasharray="32 100"
            strokeDashoffset="-68"
          />
          {/* Sector labels */}
          <text x="350" y="150" fill="#27f4d2" fontSize="14" opacity="0.4" fontWeight="bold">
            S1
          </text>
          <text x="800" y="200" fill="#27f4d2" fontSize="14" opacity="0.4" fontWeight="bold">
            S2
          </text>
          <text x="200" y="400" fill="#ff8000" fontSize="14" opacity="0.4" fontWeight="bold">
            S3
          </text>
        </svg>
      </div>

      {/* Sector delta bars */}
      <div className="px-3 pb-2 space-y-[5px]">
        {sectors.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[6px] font-bold text-white/25 w-3">{s.label}</span>
            <div className="flex-1 h-[5px] rounded-full bg-white/[0.03] overflow-hidden relative">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[0.5px] bg-white/10" />
              {/* Delta bar */}
              <div
                className="absolute top-0 bottom-0 rounded-full"
                style={{
                  backgroundColor: s.delta < 0 ? '#27f4d2' : '#ff8000',
                  left: s.delta < 0 ? `${50 + (s.delta / 1) * 50}%` : '50%',
                  width: `${Math.abs(s.delta / 1) * 50}%`,
                }}
              />
            </div>
            <span
              className={`text-[5px] font-bold tabular-nums w-6 text-right ${s.delta < 0 ? 'text-[#27f4d2]' : 'text-[#ff8000]'}`}
            >
              {s.delta < 0 ? '' : '+'}
              {s.delta.toFixed(2)}s
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[5px] text-white/15">Total</span>
          <span className="text-[6px] font-bold text-[#27f4d2]">ANT faster by 0.35s</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around px-3 py-2.5 border-t border-white/[0.03]">
        {['Home', 'Race', 'Replay', 'More'].map((tab, i) => (
          <div key={tab} className="flex flex-col items-center gap-[3px]">
            <div
              className={`w-[4px] h-[4px] rounded-full ${i === 1 ? 'bg-[#ff2a1a]' : 'bg-transparent'}`}
            />
            <span
              className={`text-[5px] font-medium ${i === 1 ? 'text-white/90' : 'text-white/25'}`}
            >
              {tab}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide Exports ───────────────────────────────────────────────────────────

export interface ScreenshotSlide {
  id: string;
  caption: string;
  subcaption: string;
  screen: React.FC;
  gradient: string;
}

export const screenshots: ScreenshotSlide[] = [
  {
    id: 'dashboard',
    caption: 'Your race\ncommand center.',
    subcaption: 'Standings, countdowns, and results — all in one glance.',
    screen: ScreenDashboard,
    gradient: 'linear-gradient(145deg, #1a0000 0%, #4a0e0e 50%, #000000 100%)',
  },
  {
    id: 'dominance',
    caption: 'Own the\ntrack map.',
    subcaption: 'See who dominates each sector, corner by corner.',
    screen: ScreenDominance,
    gradient: 'linear-gradient(145deg, #0a0014 0%, #3b0764 50%, #000000 100%)',
  },
  {
    id: 'telemetry',
    caption: 'See what the\npitwall sees.',
    subcaption: 'Real speed traces, throttle, brake, and sector splits.',
    screen: ScreenTelemetry,
    gradient: 'linear-gradient(145deg, #000a1f 0%, #0c2461 50%, #000000 100%)',
  },
  {
    id: 'replay',
    caption: 'Relive every\novertake.',
    subcaption: 'Animated replay with live positions and gap timing.',
    screen: ScreenReplay,
    gradient: 'linear-gradient(145deg, #001a0e 0%, #064e3b 50%, #000000 100%)',
  },
  {
    id: 'strategy',
    caption: 'Decode the\nstrategy game.',
    subcaption: 'Full tyre stints, pit windows, and undercut timing.',
    screen: ScreenStrategy,
    gradient: 'linear-gradient(145deg, #1a1000 0%, #78350f 50%, #000000 100%)',
  },
];

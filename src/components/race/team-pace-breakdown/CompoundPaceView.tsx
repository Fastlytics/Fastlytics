import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/recharts-lazy';
import { Cell } from '@/lib/recharts-cell';

import { COMPOUND_COLORS, formatLapTime, getTeamColor } from './utils';

import type { CompoundPace } from '@/lib/api';

interface CompoundPaceViewProps {
  compounds: string[];
  activeCompound: string;
  compoundBars: CompoundPace[];
  onCompoundChange: (compound: string) => void;
}

export const CompoundPaceView = ({
  compounds,
  activeCompound,
  compoundBars,
  onCompoundChange,
}: CompoundPaceViewProps) => {
  const referencePace = compoundBars.length > 0 ? compoundBars[0].medianTime : 0;

  return (
    <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
      <div className="flex border-b border-white/[0.04]">
        {compounds.map((compound) => (
          <button
            key={compound}
            onClick={() => onCompoundChange(compound)}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-all ${
              activeCompound === compound
                ? 'border-b-2 text-white'
                : 'text-white hover:text-white/60'
            }`}
            style={
              activeCompound === compound
                ? { borderBottomColor: COMPOUND_COLORS[compound] || '#FFF' }
                : undefined
            }
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: COMPOUND_COLORS[compound] || '#666' }}
            />
            {compound}
          </button>
        ))}
      </div>

      {compoundBars.length > 0 ? (
        <div className="px-4 py-3">
          <ResponsiveContainer width="100%" height={Math.max(200, compoundBars.length * 48)}>
            <BarChart
              data={compoundBars.map((entry) => ({
                ...entry,
                gap: entry.medianTime - referencePace,
                displayTime: formatLapTime(entry.medianTime),
                team: entry.teamName,
                color: getTeamColor(entry.teamName),
              }))}
              layout="vertical"
              margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
              barGap={3}
            >
              <XAxis
                type="number"
                dataKey="gap"
                domain={[0, 'dataMax + 0.1']}
                tick={{
                  fill: '#FFF',
                  fontSize: 12,
                  fontWeight: 'bold',
                  fontFamily: "'Inter', sans-serif",
                }}
                stroke="#444"
                tickFormatter={(value: number) => (value === 0 ? '0' : `+${value.toFixed(3)}`)}
              />
              <YAxis
                type="category"
                dataKey="team"
                tick={{
                  fill: '#FFF',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}
                width={110}
                stroke="transparent"
              />
              <Tooltip
                cursor={{ fill: '#ffffff10' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const tooltipData = payload[0].payload as CompoundPace & {
                    gap: number;
                    team: string;
                    color: string;
                  };

                  return (
                    <div className="min-w-[200px] rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-3 shadow-xl">
                      <div
                        className="mb-1.5 text-[13px] font-semibold"
                        style={{ color: tooltipData.color, fontFamily: "'Inter', sans-serif" }}
                      >
                        {tooltipData.team}
                      </div>
                      <div
                        className="text-[13px] font-semibold text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Median: {formatLapTime(tooltipData.medianTime)}
                      </div>
                      <div
                        className="text-[13px] text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Gap: {tooltipData.gap === 0 ? 'LEADER' : `+${tooltipData.gap.toFixed(3)}s`}
                      </div>
                      <div
                        className="mt-1 text-[11px] text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {tooltipData.lapCount} laps on {tooltipData.compound}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="gap"
                barSize={20}
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'right',
                  fill: '#FFF',
                  fontSize: 12,
                  fontWeight: 'bold',
                  fontFamily: "'Inter', sans-serif",
                  formatter: (_: number, __: unknown, index: number) => {
                    const item = compoundBars[index];
                    return item ? `${formatLapTime(item.medianTime)}  (${item.lapCount} laps)` : '';
                  },
                }}
              >
                {compoundBars.map((entry) => (
                  <Cell
                    key={entry.teamName}
                    fill={getTeamColor(entry.teamName)}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-[13px] text-white">
          No data for {activeCompound}
        </div>
      )}
    </div>
  );
};

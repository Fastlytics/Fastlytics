import type { CustomLegendProps } from '@/types';
import { getDriverImage } from '@/utils/imageMapping';

interface ChampionshipLegendProps extends CustomLegendProps {
  selectedYear: number;
}

const ChampionshipLegend = ({ payload, selectedYear }: ChampionshipLegendProps) => {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-6 pt-4">
      {payload.map((entry, index: number) => {
        const driverId = entry.dataKey || entry.value; // Prefer dataKey (code)
        const headshot = getDriverImage(driverId, selectedYear);

        return (
          <div
            key={`legend-${driverId}`}
            className="flex items-center gap-2 bg-zinc-900/50 pr-3 pl-1 py-1 rounded-full border border-zinc-800 backdrop-blur-sm"
          >
            <div className="relative size-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
              {headshot ? (
                <img
                  src={headshot}
                  alt={entry.value}
                  className="size-full object-cover object-top"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-xs font-bold text-zinc-500">
                  {entry.value[0]}
                </div>
              )}
            </div>
            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-bold text-zinc-200">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChampionshipLegend;

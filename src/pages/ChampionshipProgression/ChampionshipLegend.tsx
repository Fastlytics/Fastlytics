import type { CustomLegendProps } from '@/types';
import { getDriverImage } from '@/utils/imageMapping';

interface ChampionshipLegendProps extends CustomLegendProps {
  selectedYear: number;
}

const ChampionshipLegend = ({ payload, selectedYear }: ChampionshipLegendProps) => {
  if (!payload) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-2">
      {payload.map((entry) => {
        const driverId = entry.dataKey || entry.value;
        const headshot = getDriverImage(driverId, selectedYear);

        return (
          <div key={`legend-${driverId}`} className="flex items-center gap-1.5">
            <div className="relative size-5 shrink-0 overflow-hidden rounded-full border border-white/[0.08]">
              {headshot ? (
                <img
                  src={headshot}
                  alt={entry.value}
                  className="size-full object-cover object-top"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-white/[0.04] text-[7px] font-medium text-white/50">
                  {entry.value[0]}
                </div>
              )}
            </div>
            <span
              className="h-[10px] w-[10px] rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] font-medium text-white/50">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChampionshipLegend;

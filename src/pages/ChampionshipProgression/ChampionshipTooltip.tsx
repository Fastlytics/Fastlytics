import type { CustomTooltipProps } from '@/types';
import { getCountryCode } from '@/utils/countryUtils';
import { getDriverImage } from '@/utils/imageMapping';

interface ChampionshipTooltipProps extends CustomTooltipProps<number> {
  selectedYear: number;
}

const ChampionshipTooltip = ({
  active,
  payload,
  label,
  selectedYear,
}: ChampionshipTooltipProps) => {
  if (active && payload && payload.length) {
    // Sort payload by value (points) descending
    const sortedPayload = payload.toSorted((a, b) => (b.value || 0) - (a.value || 0));

    // Access direct data point from payload
    const dataPoint = payload[0]?.payload;
    const country = dataPoint?.country || label;
    const eventName = dataPoint?.name || label;

    return (
      <div className="bg-black/95 border border-zinc-800 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[280px]">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800">
          <img
            src={`https://flagcdn.com/h24/${getCountryCode(country)}.png`}
            alt="Country Flag"
            className="h-4 rounded-[2px]"
          />
          <p className="font-black text-white uppercase italic tracking-wider text-sm">
            {eventName}
          </p>
        </div>
        <div className="space-y-3">
          {sortedPayload.map((entry, index: number) => {
            // Use dataKey (driver code) for image lookup if available, otherwise name
            const driverId = entry.dataKey || entry.name;
            const headshot = getDriverImage(driverId, selectedYear);

            return (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono text-xs w-4">#{index + 1}</span>
                  <div className="relative">
                    <div className="size-8 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
                      {headshot ? (
                        <img
                          src={headshot}
                          alt={entry.name}
                          className="size-full object-cover object-top"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-zinc-800 text-xs font-bold text-zinc-500">
                          {entry.name[0]}
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-black"
                      style={{ backgroundColor: entry.color }}
                    />
                  </div>
                  <span className="font-bold text-sm text-zinc-200">{entry.name}</span>
                </div>
                <span className="font-black font-mono text-white text-sm tabular-nums">
                  {entry.value}{' '}
                  <span className="text-[10px] text-zinc-500 font-normal ml-0.5">PTS</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default ChampionshipTooltip;

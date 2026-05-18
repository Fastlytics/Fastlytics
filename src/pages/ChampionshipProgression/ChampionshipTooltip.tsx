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
    const sortedPayload = payload.toSorted((a, b) => (b.value || 0) - (a.value || 0));

    const dataPoint = payload[0]?.payload;
    const country = dataPoint?.country || label;
    const eventName = dataPoint?.name || label;

    return (
      <div className="min-w-[240px] rounded-lg border border-white/[0.08] bg-[#0a0a0a]/95 p-3 shadow-xl backdrop-blur-md">
        <div className="mb-2.5 flex items-center gap-2 border-b border-white/[0.06] pb-2">
          <img
            src={`https://flagcdn.com/${getCountryCode(country)}.svg`}
            alt="Country Flag"
            className="h-3.5 rounded-[2px]"
          />
          <p className="text-[12px] font-medium text-white">{eventName}</p>
        </div>
        <div className="space-y-2">
          {sortedPayload.map((entry, index: number) => {
            const driverId = entry.dataKey || entry.name;
            const headshot = getDriverImage(driverId, selectedYear);

            return (
              <div key={entry.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 font text-[10px] tabular-nums text-white/40">
                    {index + 1}
                  </span>
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-white/[0.08]">
                    {headshot ? (
                      <img
                        src={headshot}
                        alt={entry.name}
                        className="size-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-white/[0.04] text-[8px] font-medium text-white/50">
                        {entry.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-white/80">{entry.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font text-[12px] tabular-nums text-white">{entry.value}</span>
                  <span className="text-[9px] text-white/40">pts</span>
                </div>
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

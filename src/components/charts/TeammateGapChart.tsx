import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from '@/lib/recharts-lazy';
import { fetchTeammateBattle } from '@/lib/api';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { useAuth } from '@/contexts/AuthContext';
import { LockKeyIcon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeammateGapChartProps {
  driverName: string;
  slug: string;
}

type MetricKey = 'raceH2h' | 'qualiH2h' | 'points';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'raceH2h', label: 'Race H2H' },
  { key: 'qualiH2h', label: 'Quali H2H' },
  { key: 'points', label: 'Points Diff' },
];

export function TeammateGapChart({ driverName, slug }: TeammateGapChartProps) {
  const { user, isSubscribed } = useAuth();
  const isPro = user && isSubscribed('pro');
  const [metric, setMetric] = useState<MetricKey>('raceH2h');

  const { data, isLoading } = useQuery({
    queryKey: ['teammateGapChart', slug],
    queryFn: () => fetchTeammateBattle(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 15,
  });

  const chartData = useMemo(() => {
    if (!data?.battles?.length) return [];

    const rows: Array<{
      label: string;
      value: number;
      teammate: string;
      team: string;
      teamColor: string;
      year: number;
    }> = [];

    for (const battle of data.battles) {
      for (const season of battle.perSeason) {
        let value: number;
        if (metric === 'points') {
          value = season.points.driver - season.points.teammate;
        } else if (metric === 'qualiH2h') {
          value = season.qualiH2h.driver - season.qualiH2h.teammate;
        } else {
          value = season.raceH2h.driver - season.raceH2h.teammate;
        }

        rows.push({
          label: `${season.year}`,
          value,
          teammate: battle.teammate.name.split(' ').pop() || battle.teammate.code,
          team: season.team,
          teamColor: season.teamColor || '#666666',
          year: season.year,
        });
      }
    }

    return rows.sort((a, b) => a.year - b.year);
  }, [data, metric]);

  const driverLastName = driverName.split(' ').pop() || '';

  if (!isPro) {
    return (
      <div className={`${CARD_CONTAINER} flex flex-col items-center justify-center py-12`}>
        <LockKeyIcon className="mb-3 size-6 text-white/30" />
        <p className="text-[14px] font-medium text-white/60">Teammate Gap Chart is a Pro feature</p>
        <p className="mt-1 max-w-xs text-center text-[12px] text-white/40">
          See how the battle against teammates evolved season by season
        </p>
        <Link
          to="/pricing"
          className="mt-4 inline-flex h-8 items-center rounded-lg bg-white/[0.08] px-4 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.14]"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${CARD_CONTAINER} flex h-[250px] items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
          <span className="text-[13px] text-white/50">Loading teammate data...</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  const maxAbs = Math.max(...chartData.map((d) => Math.abs(d.value)), 1);
  const yDomain: [number, number] = [-maxAbs * 1.2, maxAbs * 1.2];

  return (
    <div className={CARD_CONTAINER}>
      <div className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className={CARD_LABEL}>Teammate Gap</h3>
          <p className="mt-0.5 text-[12px] text-white/40">
            {driverLastName} vs teammates across seasons
          </p>
        </div>
        <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <SelectTrigger className="h-8 w-[130px] rounded-md border border-white/[0.06] bg-transparent text-[12px] font-medium text-white focus:ring-0 focus:border-white/[0.12]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl">
            <SelectGroup>
              {METRICS.map((m) => (
                <SelectItem
                  key={m.key}
                  value={m.key}
                  className="text-[12px] font-medium focus:bg-white/[0.04] focus:text-white"
                >
                  {m.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-white/[0.04] px-5 pb-5 pt-3">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 10, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="none" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.06)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.06)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              width={48}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as typeof chartData[number];
                const val = Math.abs(row.value);
                const ahead = row.value > 0 ? driverLastName : row.teammate;
                return (
                  <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-2.5 shadow-2xl">
                    <p className="mb-1 text-[11px] font-medium text-white/60">
                      {row.label} — {row.team}
                    </p>
                    <p className="text-[12px] font-semibold text-white">
                      {ahead} ahead: {metric === 'points' ? `${val} pts` : `+${val}`}
                    </p>
                  </div>
                );
              }}
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? entry.teamColor : '#3a3a3e'}
                  fillOpacity={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-center">
          <span className="text-[10px] text-white/50">
            Bar color = team. Positive = {driverLastName} ahead. Negative = teammate ahead.
          </span>
        </div>
      </div>
    </div>
  );
}

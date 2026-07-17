import { cn } from '@/lib/utils';

interface MetricDefinitionsProps {
  session: string;
}

export const MetricDefinitions = ({ session }: MetricDefinitionsProps) => {
  const isRaceSession = session === 'R' || session === 'Sprint';

  return (
    <div className="border-t border-white/[0.04] py-4">
      <h4 className="mb-2 text-[11px] font-medium text-white/80">Metric definitions</h4>
      <ul className="space-y-1.5 text-[11px] text-white/70">
        <li className={cn('flex items-start gap-2', !isRaceSession && 'opacity-50')}>
          <span className="shrink-0 text-white/90">Consistency (σ)</span>
          <span>— Standard deviation of lap times. Lower is better.</span>
        </li>
        <li className={cn('flex items-start gap-2', !isRaceSession && 'opacity-50')}>
          <span className="shrink-0 text-white/90">Degradation (Δ/lap)</span>
          <span>— Lap time change per lap. Positive = slower over time.</span>
        </li>
      </ul>
    </div>
  );
};

import { cn } from '@/lib/utils';

interface MetricDefinitionsProps {
  session: string;
}

export const MetricDefinitions = ({ session }: MetricDefinitionsProps) => {
  const isRaceSession = session === 'R' || session === 'Sprint';

  return (
    <div className="border-t border-white/[0.04] px-4 py-3">
      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white">
        Metric Definitions:
      </h4>
      <ul className="space-y-1 text-[11px] text-white">
        <li className={cn(!isRaceSession && 'opacity-50')}>
          <span className="text-white">CONSISTENCY (σ):</span> Standard deviation of lap times.
          Lower is better.
        </li>
        <li className={cn(!isRaceSession && 'opacity-50')}>
          <span className="text-white">DEGRADATION (Δ/lap):</span> Lap time loss per lap. Positive =
          Slower over time.
        </li>
      </ul>
    </div>
  );
};

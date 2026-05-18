import { useState } from 'react';
import { Bookmark02Icon } from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';
import { SaveChartDialog } from './SaveChartDialog';

interface SaveChartButtonProps {
  chartType: string;
  title: string;
  raceName?: string;
  chartConfig?: Record<string, unknown>;
  className?: string;
}

/**
 * Compact save button to embed in chart headers.
 * Opens the SaveChartDialog on click.
 *
 * Usage:
 * ```tsx
 * <SaveChartButton
 *   chartType="h2h"
 *   title="VER vs NOR — Bahrain 2025"
 *   raceName="2025 Bahrain Grand Prix"
 *   chartConfig={{ drivers: ['VER', 'NOR'], year: 2025 }}
 * />
 * ```
 */
export function SaveChartButton({
  chartType,
  title,
  raceName,
  chartConfig,
  className,
}: SaveChartButtonProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={`flex items-center gap-1 rounded-md border border-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/70 transition-colors hover:border-white/[0.12] hover:text-white ${className || ''}`}
        title="Save chart"
      >
        <Bookmark02Icon className="size-3" />
        <span>Save</span>
      </button>

      <SaveChartDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        chartType={chartType}
        defaultTitle={title}
        raceName={raceName}
        chartConfig={chartConfig}
      />
    </>
  );
}

export default SaveChartButton;

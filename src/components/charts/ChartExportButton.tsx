import React from 'react';
import { cn } from '@/lib/utils';
import type { ChartExportMeta } from '@/hooks/useChartExport';

interface ChartExportButtonProps {
  onClick: (meta: ChartExportMeta) => void;
  meta: ChartExportMeta;
  isExporting: boolean;
  className?: string;
  variant?: 'icon' | 'compact';
}

/**
 * A download button for chart exports.
 *
 * - `icon` variant: small icon-only button (default)
 * - `compact` variant: icon + "Download" text
 */
const ChartExportButton: React.FC<ChartExportButtonProps> = ({
  onClick,
  meta,
  isExporting,
  className,
  variant = 'icon',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExporting) {
      onClick(meta);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={isExporting}
        title="Download chart as PNG"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider',
          'bg-transparent border border-gray-700 text-gray-400',
          'hover:border-red-600 hover:text-white hover:bg-red-600/10',
          'transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
      >
        {isExporting ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        <span>{isExporting ? 'Exporting...' : 'Download'}</span>
      </button>
    );
  }

  // Icon-only variant (default)
  return (
    <button
      onClick={handleClick}
      disabled={isExporting}
      title="Download chart as PNG"
      className={cn(
        'p-1.5 text-gray-500',
        'hover:text-white hover:bg-gray-800',
        'transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
    >
      {isExporting ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
    </button>
  );
};

export { ChartExportButton };
export default ChartExportButton;

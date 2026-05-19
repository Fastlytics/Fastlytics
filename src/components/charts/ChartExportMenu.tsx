// knip-ignore
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ExportFormat } from '@/hooks/useChartExport';

interface ChartExportMenuProps {
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  hasData?: boolean;
  className?: string;
}

const FORMAT_OPTIONS: {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresData?: boolean;
}[] = [
  {
    format: 'svg',
    label: 'SVG',
    description: 'Vector — scalable, editable',
    icon: (
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 12l3-3 2 2 3-3 2 2" />
      </svg>
    ),
  },
  {
    format: 'png',
    label: 'PNG',
    description: 'High-res raster (4x)',
    icon: (
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    format: 'csv',
    label: 'CSV',
    description: 'Spreadsheet data',
    icon: (
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
    requiresData: true,
  },
  {
    format: 'json',
    label: 'JSON',
    description: 'Structured data + metadata',
    icon: (
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3H7a2 2 0 00-2 2v5a2 2 0 01-2 2 2 2 0 012 2v5a2 2 0 002 2h1" />
        <path d="M16 3h1a2 2 0 012 2v5a2 2 0 002 2 2 2 0 00-2 2v5a2 2 0 01-2 2h-1" />
      </svg>
    ),
    requiresData: true,
  },
  {
    format: 'clipboard',
    label: 'Copy SVG',
    description: 'Clipboard — paste into Figma etc.',
    icon: (
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    ),
  },
];

const ChartExportMenu: React.FC<ChartExportMenuProps> = ({
  onExport,
  isExporting,
  hasData = false,
  className,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative', className)} data-export-menu>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isExporting}
        title="Export chart"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider',
          'border border-white/[0.08] bg-white/[0.03] text-white/60',
          'hover:border-white/[0.12] hover:text-white hover:bg-white/[0.06]',
          'transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        {isExporting ? (
          <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
            className="size-3.5"
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
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        {!isExporting && (
          <svg
            className="size-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={-1}
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] rounded-xl border border-white/[0.08] bg-[#0c0c0e] backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="p-1.5">
              {FORMAT_OPTIONS.map((opt) => {
                const disabled = opt.requiresData && !hasData;
                return (
                  <button
                    key={opt.format}
                    disabled={disabled}
                    onClick={() => {
                      setOpen(false);
                      onExport(opt.format);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                      disabled
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-white/[0.06] cursor-pointer'
                    )}
                  >
                    <span className="text-white/60">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-white tracking-wider">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-white/50 leading-tight">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { ChartExportMenu };
export default ChartExportMenu;

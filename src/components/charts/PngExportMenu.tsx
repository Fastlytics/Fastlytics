import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import {
  PNG_EXPORT_PRESET_ORDER,
  PNG_EXPORT_PRESETS,
  type PngExportPreset,
} from '@/lib/premium-export';

interface PngExportMenuProps {
  onExport: (preset: PngExportPreset) => void;
  isExporting: boolean;
  hasData?: boolean;
  className?: string;
}

const PngExportMenu: React.FC<PngExportMenuProps> = ({
  onExport,
  isExporting,
  hasData = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const isDisabled = isExporting || !hasData;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((current) => !current)}
        disabled={isDisabled}
        title="Export PNG"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider',
          'border border-white/[0.08] bg-white/[0.03] text-white',
          'transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40',
          'hover:border-white/[0.14] hover:bg-white/[0.06]'
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 15h10" />
            <path d="M7 11h10" />
            <path d="M7 7h6" />
          </svg>
        )}
        <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
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

      {open && !isDisabled && (
        <>
          <div
            role="button"
            tabIndex={-1}
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
            }}
          />

          <div className="absolute right-0 top-full z-50 mt-2 min-w-[260px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl backdrop-blur-md">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                Premium PNG Export
              </div>
            </div>

            <div className="p-1.5">
              {PNG_EXPORT_PRESET_ORDER.map((preset) => {
                const presetSpec = PNG_EXPORT_PRESETS[preset];

                return (
                  <button
                    key={preset}
                    onClick={() => {
                      setOpen(false);
                      onExport(preset);
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-left transition-all hover:bg-white/[0.06]"
                  >
                    <div>
                      <div className="text-[12px] font-semibold tracking-wide text-white">
                        {presetSpec.label}
                      </div>
                      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                        {presetSpec.description}
                      </div>
                    </div>

                    <div className="rounded-md border border-white/[0.08] bg-[#060608] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      PNG
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

export default PngExportMenu;

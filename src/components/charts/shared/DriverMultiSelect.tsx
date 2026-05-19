import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpDownIcon } from 'hugeicons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';
import { driverColor } from '@/lib/driverColor';
import { cn } from '@/lib/utils';

export interface DriverMultiSelectProps {
  availableDrivers: string[];
  selectedDrivers: string[];
  driverNameMap: Map<string, string>;
  year: number;
  favoriteDriver?: string | null;
  focusedDriver?: string | null;
  disabled?: boolean;
  minDrivers?: number;
  triggerLabel?: React.ReactNode;

  onDriverToggle: (driverCode: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDriverFocus?: (driverCode: string | null) => void;

  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  selectAllLabel?: string;
  selectNoneLabel?: string;

  // Custom text or defaults
  allSelectedText?: string;
  noneSelectedText?: string;
}

const inter = { fontFamily: "'Inter', sans-serif" } as const;

export const DriverMultiSelect: React.FC<DriverMultiSelectProps> = ({
  availableDrivers,
  selectedDrivers,
  driverNameMap,
  year,
  favoriteDriver,
  focusedDriver,
  disabled = false,
  minDrivers = 0,
  triggerLabel,

  onDriverToggle,
  onSelectAll,
  onSelectNone,
  onDriverFocus,

  isOpen,
  onOpenChange,

  selectAllLabel = 'All',
  selectNoneLabel = 'None',

  allSelectedText = 'All Drivers',
  noneSelectedText = 'Select Drivers...',
}) => {
  const contentId = React.useId();
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {triggerLabel ? (
          triggerLabel
        ) : (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={contentId}
            className="w-auto min-w-[180px] justify-between text-[11px] font-semibold h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white uppercase tracking-wider"
            disabled={disabled || availableDrivers.length === 0}
          >
            {selectedDrivers.length === availableDrivers.length
              ? allSelectedText
              : selectedDrivers.length === 0
                ? noneSelectedText
                : `${selectedDrivers.length} Selected`}
            <ArrowUpDownIcon className="ml-2 size-3.5 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        id={contentId}
        className="w-[280px] p-1.5 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
        style={inter}
        align="end"
      >
        <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-white/[0.06] pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
            {selectedDrivers.length} / {availableDrivers.length} visible
          </span>
          <div className="flex gap-1">
            <button
              onClick={onSelectAll}
              className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
            >
              {selectAllLabel}
            </button>
            <button
              onClick={onSelectNone}
              className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
            >
              {selectNoneLabel}
            </button>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="grid gap-0.5">
            {availableDrivers.map((driverCode) => {
              const headshot = getDriverImage(driverCode, year);
              const fullName = driverNameMap.get(driverCode) || driverCode;
              const isSelected = selectedDrivers.includes(driverCode);
              const isFavorite = favoriteDriver && driverCode === favoriteDriver;
              const dColor = driverColor(driverCode, year);

              return (
                <button
                  key={driverCode}
                  onClick={() => onDriverToggle(driverCode)}
                  className={cn(
                    'flex items-center gap-3 w-full px-2.5 py-2 rounded-lg transition-all text-left',
                    isSelected ? 'bg-white/[0.04]' : 'opacity-50 hover:opacity-70',
                    isFavorite && isSelected && 'bg-red-500/[0.06]',
                    focusedDriver && focusedDriver !== driverCode && '!opacity-20'
                  )}
                  onMouseEnter={() => onDriverFocus?.(driverCode)}
                  onMouseLeave={() => onDriverFocus?.(null)}
                >
                  {/* Check indicator */}
                  <div
                    className={cn(
                      'size-4 rounded shrink-0 flex items-center justify-center border transition-all',
                      isSelected
                        ? 'bg-red-500 border-red-500'
                        : 'border-white/[0.15] bg-transparent'
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="size-2.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Team color bar */}
                  <div
                    className={cn(
                      'h-8 w-0.5 rounded-full shrink-0 transition-opacity',
                      isSelected ? 'opacity-100' : 'opacity-30'
                    )}
                    style={{ backgroundColor: dColor }}
                  />

                  {/* Headshot */}
                  <Avatar className="size-8 shrink-0 border border-white/[0.08]">
                    <AvatarImage src={headshot} className="object-cover object-top" />
                    <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                      {driverCode[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={cn(
                        'text-[12px] font-semibold truncate transition-colors',
                        isFavorite ? 'text-red-400' : isSelected ? 'text-white' : 'text-white'
                      )}
                    >
                      {fullName}
                    </span>
                    <span className="text-[10px] font-medium text-white/80">{driverCode}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

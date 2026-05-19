import { m } from 'motion/react';

interface BillingToggleProps {
  interval: 'monthly' | 'yearly';
  onChange: (interval: 'monthly' | 'yearly') => void;
}

export function BillingToggle({ interval, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange('monthly')}
        className={`text-[13px] font-medium transition-colors ${
          interval === 'monthly' ? 'text-white' : 'text-white/35 hover:text-white/60'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange(interval === 'monthly' ? 'yearly' : 'monthly')}
        className="relative inline-flex h-7 w-12 items-center rounded-full border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-white/[0.12]"
      >
        <m.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block size-5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.15)]"
          style={{ marginLeft: interval === 'yearly' ? 22 : 2 }}
        />
      </button>
      <button
        onClick={() => onChange('yearly')}
        className={`text-[13px] font-medium transition-colors ${
          interval === 'yearly' ? 'text-white' : 'text-white/35 hover:text-white/60'
        }`}
      >
        Annually
        <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
          Save 30%
        </span>
      </button>
    </div>
  );
}

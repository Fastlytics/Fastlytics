import React from 'react';
import { m } from 'motion/react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  selectedYear: number;
  badge?: { label: string; tone: 'live' | 'info' } | null;
  titleClassName?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, titleClassName }) => {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <h1
          className={`text-[20px] font-semibold tracking-[-0.01em] text-white ${titleClassName ?? ''}`}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[12px] text-white/80">{subtitle}</p>}
      </div>

      {badge && (
        <div
          className={[
            'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase',
            badge.tone === 'live'
              ? 'border-red-400/20 text-red-400'
              : 'border-amber-400/20 text-amber-400',
          ].join(' ')}
        >
          {badge.tone === 'live' && (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
            </span>
          )}
          <span>{badge.label}</span>
        </div>
      )}
    </m.div>
  );
};

export default PageHeader;

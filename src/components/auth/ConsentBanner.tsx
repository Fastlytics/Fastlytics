import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  setConsentPreferences,
  acceptAllConsent,
  rejectAllConsent,
  hasConsentChoice,
  type ConsentPreferences,
} from '@/lib/consent';

/* ─── Inline icons — no backgrounds, no boxes ─── */
const FingerprintIcon = ({ className }: { className?: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/* ─── Minimal toggle ─── */
const Toggle = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={cn(
      'relative inline-flex h-[18px] w-8 items-center rounded-full transition-colors duration-200',
      checked ? 'bg-white' : 'bg-white/10',
      disabled && 'cursor-not-allowed opacity-40'
    )}
  >
    <span
      className={cn(
        'inline-block size-[14px] rounded-full transition-transform duration-200',
        checked ? 'translate-x-[15px] bg-zinc-950' : 'translate-x-[3px] bg-white/70'
      )}
    />
  </button>
);

/* ─── Category row — clean, no icon boxes ─── */
const CategoryRow = ({
  icon,
  label,
  detail,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-3.5 py-3 border-b border-white/[0.04] last:border-b-0">
    <div className={cn('shrink-0 text-white/25', checked && !disabled && 'text-white/50')}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-white">{label}</span>
        <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      </div>
      <p className="mt-0.5 text-[12px] leading-relaxed text-white/30">{detail}</p>
    </div>
  </div>
);

/* ─── Main Banner ─── */
const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
  });

  useEffect(() => {
    if (!hasConsentChoice()) {
      const t = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const updatePref = (key: keyof ConsentPreferences, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const handleAcceptAll = () => {
    acceptAllConsent();
    setVisible(false);
  };

  const handleRejectAll = () => {
    rejectAllConsent();
    setVisible(false);
  };

  const handleSave = () => {
    setConsentPreferences(prefs);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[60] sm:bottom-5 sm:left-5 sm:right-auto sm:w-[400px]"
        >
          <div className="relative overflow-hidden border border-white/[0.06] bg-[#0c0c0e]/95 backdrop-blur-xl sm:rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            {/* Subtle top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            <div className="p-5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-white">
                    Cookie Preferences
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/35">
                    We use cookies to keep you signed in and understand how you use the site.{' '}
                    <a
                      href="/privacy-policy"
                      className="text-white/50 underline underline-offset-2 hover:text-white/70 transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
                <button
                  onClick={handleRejectAll}
                  className="shrink-0 mt-0.5 p-1 text-white/20 hover:text-white/50 transition-colors"
                  aria-label="Close"
                >
                  <XIcon />
                </button>
              </div>

              {/* Expandable categories */}
              <AnimatePresence>
                {expanded && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4">
                      <CategoryRow
                        icon={<FingerprintIcon />}
                        label="Necessary"
                        detail="Keeps you signed in and the site secure. Always on."
                        checked
                        disabled
                      />
                      <CategoryRow
                        icon={<ActivityIcon />}
                        label="Analytics"
                        detail="Helps us understand how the site is used."
                        checked={prefs.analytics}
                        onChange={(v) => updatePref('analytics', v)}
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-5 flex items-center gap-2.5">
                <button
                  onClick={expanded ? handleSave : handleAcceptAll}
                  className="flex h-9 items-center justify-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  {expanded ? 'Save preferences' : 'Accept all'}
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex h-9 items-center justify-center rounded-lg px-3 text-[13px] font-medium text-white/40 transition-colors hover:text-white/70"
                >
                  Reject all
                </button>
                <button
                  onClick={() => setExpanded((s) => !s)}
                  className="ml-auto flex items-center gap-1 text-[12px] font-medium text-white/25 hover:text-white/55 transition-colors"
                >
                  {expanded ? 'Less' : 'Manage'}
                  <ChevronIcon
                    className={cn('transition-transform duration-200', expanded && 'rotate-180')}
                  />
                </button>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export { ConsentBanner };
export default ConsentBanner;

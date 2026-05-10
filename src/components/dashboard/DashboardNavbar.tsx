import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { m, AnimatePresence } from 'motion/react';
import { useSeason } from '@/contexts/SeasonContext';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

import UpgradeModal from '@/components/payments/UpgradeModal';

const inter = { fontFamily: "'Inter', sans-serif" } as const;
const CHECKOUT_CONFIRMATION_ATTEMPTS = 6;
const CHECKOUT_CONFIRMATION_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const hasPaidPlan = (
  subscription: {
    plan: 'free' | 'pro' | 'ultra';
    status: 'active' | 'cancelled' | 'expired' | 'on_hold';
  } | null
) => {
  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  return subscription.plan === 'pro' || subscription.plan === 'ultra';
};

const navLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Drivers', path: '/standings/drivers' },
  { name: 'Teams', path: '/standings/teams' },
];

const SeasonDropdown: React.FC<{
  selectedYear: number;
  availableYears: number[];
  onSelect: (year: number) => void;
  isYearLocked?: (year: number) => boolean;
  onLockedSelect?: () => void;
}> = ({ selectedYear, availableYears, onSelect, isYearLocked, onLockedSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const years = availableYears.length > 0 ? availableYears : [2026, 2025, 2024, 2023, 2022];
  const hasLockedYears = years.some((year) => isYearLocked?.(year));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold uppercase tracking-wider transition-all ${
          open
            ? 'border-white/[0.12] bg-white/[0.06] text-white'
            : 'border-white/[0.06] bg-white/[0.03] text-white/70 hover:border-white/[0.1] hover:text-white'
        }`}
      >
        <span>{selectedYear} Season</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
          >
            <div className="px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Select Season
              </p>
            </div>
            <div className="border-t border-white/[0.04] px-1.5 pb-1.5">
              {years.map((year) => {
                const isLocked = isYearLocked?.(year) ?? false;

                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        setOpen(false);
                        onLockedSelect?.();
                        return;
                      }

                      onSelect(year);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      isLocked
                        ? 'cursor-not-allowed text-white/28 hover:bg-white/[0.02]'
                        : year === selectedYear
                          ? 'bg-red-500/[0.08] text-red-400'
                          : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span className="tracking-wide">{year} Season</span>
                    <span className="flex items-center gap-2">
                      {isLocked && (
                        <span className="rounded-full border border-sky-300/18 bg-sky-300/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/75">
                          Pro
                        </span>
                      )}
                      {!isLocked && year === selectedYear && (
                        <span className="size-1.5 rounded-full bg-red-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {hasLockedYears && (
              <div className="border-t border-white/[0.04] px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/28">
                Historical seasons require Pro.
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isSubscribed, refreshSubscription } = useAuth();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const checkoutState = searchParams.get('checkout');
    if (!checkoutState) return;

    let cancelled = false;

    const clearCheckoutParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      navigate(
        {
          pathname: location.pathname,
          search: next.toString() ? `?${next.toString()}` : '',
        },
        { replace: true }
      );
    };

    const handleCheckoutState = async () => {
      if (checkoutState === 'success') {
        const toastId = toast.loading('Confirming your subscription...');

        try {
          let latestSubscription = null;

          for (
            let attempt = 0;
            attempt < CHECKOUT_CONFIRMATION_ATTEMPTS && !cancelled;
            attempt += 1
          ) {
            latestSubscription = await refreshSubscription();
            if (hasPaidPlan(latestSubscription)) {
              break;
            }

            if (attempt < CHECKOUT_CONFIRMATION_ATTEMPTS - 1) {
              await sleep(CHECKOUT_CONFIRMATION_DELAY_MS);
            }
          }

          if (cancelled) {
            return;
          }

          if (hasPaidPlan(latestSubscription)) {
            toast.success('Upgrade successful. Your paid plan is now active.', { id: toastId });
          } else {
            toast(
              'Payment received. Your plan is still being confirmed and should update shortly.',
              {
                id: toastId,
              }
            );
          }
        } catch {
          if (cancelled) {
            return;
          }

          toast('Payment received. Your plan is still being confirmed and should update shortly.', {
            id: toastId,
          });
        }
      } else if (checkoutState === 'cancelled') {
        toast('Payment was cancelled. No charge was made.');
      } else if (checkoutState === 'failed') {
        toast.error('Payment failed. Please try again.');
      }

      if (!cancelled) {
        clearCheckoutParam();
      }
    };

    void handleCheckoutState();

    return () => {
      cancelled = true;
    };
  }, [location, navigate, refreshSubscription, searchParams]);

  const isActive = (path: string) => location.pathname === path;
  const cancelSearch = new URLSearchParams(location.search);
  cancelSearch.delete('checkout');
  const cancelPath = `${location.pathname}${cancelSearch.toString() ? `?${cancelSearch.toString()}` : ''}`;
  const currentSeasonYear = getCurrentSeasonYear();
  const isFreeTierUser = !!user && !isSubscribed('pro');
  const isYearLocked = (year: number) => isFreeTierUser && year < currentSeasonYear;

  return (
    <>
      <nav
        style={inter}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/[0.06] bg-[#09090b]/85 shadow-[0_1px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center">
            <FastlyticsLogo size={17} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative rounded-lg px-4 py-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  isActive(link.path) ? 'text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <m.div
                    layoutId="dash-nav-indicator"
                    className="absolute inset-x-3 -bottom-px h-px bg-red-500"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            <SeasonDropdown
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelect={setSelectedYear}
              isYearLocked={isYearLocked}
              onLockedSelect={() => setUpgradeOpen(true)}
            />

            {user && !isSubscribed('pro') && (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/12 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-sky-200 transition-all hover:border-sky-300/35 hover:bg-sky-400/18 hover:text-sky-100"
              >
                <ArrowUpRight className="size-4" />
                Upgrade
              </button>
            )}

            {user ? (
              <Link to="/account">
                <Avatar className="size-9 border border-white/[0.1] transition-colors hover:border-white/30">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#1a1a1e] text-[13px] font-semibold text-white">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="rounded-lg px-4 py-2.5 text-[15px] font-medium text-white/60 transition-colors hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  className="rounded-lg bg-white px-5 py-2.5 text-[15px] font-semibold text-black transition-all hover:bg-white/90"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {mobileOpen ? (
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-2xl md:hidden"
            >
              <div className="px-5 pb-5 pt-3">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`rounded-lg px-4 py-3 text-[15px] font-medium uppercase tracking-[0.06em] transition-colors ${
                        isActive(link.path) ? 'text-white' : 'text-white/70'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/auth"
                    className="flex-1 rounded-lg border border-white/10 py-3 text-center text-[15px] font-medium text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex-1 rounded-lg bg-white py-3 text-center text-[15px] font-semibold text-black"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </nav>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        cancelPath={cancelPath}
      />
    </>
  );
};

export default DashboardNavbar;

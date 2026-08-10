import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { Link, useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { BreadcrumbBar } from '@/components/layout/BreadcrumbBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { resolveBreadcrumbs } from '@/lib/breadcrumbs';
import { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';

const CHECKOUT_CONFIRMATION_ATTEMPTS = 6;
const CHECKOUT_CONFIRMATION_DELAY_MS = 2000;
const COLLAPSE_KEY = 'fastlytics-sidebar-collapsed';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const hasPaidPlan = (
  subscription: {
    plan: 'free' | 'pro' | 'ultra';
    status: 'active' | 'cancelled' | 'expired' | 'on_hold';
  } | null
) => {
  if (!subscription || subscription.status !== 'active') return false;
  return subscription.plan === 'pro' || subscription.plan === 'ultra';
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout — Vercel/Linear-style layout shell.
 *
 * Structure:
 * - Thin sidebar (200px, collapsible to 48px)
 * - Top header bar with breadcrumbs + season picker + avatar
 * - Content area with generous whitespace
 * - Mobile: vaul drawer for sidebar
 *
 * Preserves:
 * - Checkout polling logic
 * - Command palette (Cmd+K)
 * - Search index from TanStack Query cache
 * - Breadcrumb resolution
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useAuth();
  const { selectedYear } = useSeason();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // localStorage may not be available
      }
      return next;
    });
  }, []);

  // --- Checkout polling logic ---
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
          const pollUntilConfirmed = async (attempt: number) => {
            if (attempt >= CHECKOUT_CONFIRMATION_ATTEMPTS || cancelled) return null;
            const sub = await refreshSubscription();
            if (hasPaidPlan(sub)) return sub;
            if (attempt < CHECKOUT_CONFIRMATION_ATTEMPTS - 1) {
              await sleep(CHECKOUT_CONFIRMATION_DELAY_MS);
            }
            return pollUntilConfirmed(attempt + 1);
          };

          const latestSubscription = await pollUntilConfirmed(0);

          if (cancelled) return;

          if (latestSubscription && hasPaidPlan(latestSubscription)) {
            toast.success('Upgrade successful. Your paid plan is now active.', { id: toastId });
          } else {
            toast(
              'Payment received. Your plan is still being confirmed and should update shortly.',
              { id: toastId }
            );
          }
        } catch {
          if (cancelled) return;
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

  // --- Command palette keyboard shortcut (Cmd+K / Ctrl+K) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Breadcrumb resolution ---
  const breadcrumbs = useMemo(
    () => resolveBreadcrumbs(location.pathname, params as Record<string, string>),
    [location.pathname, params]
  );

  // --- Handlers ---
  const handleSearchClick = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleClosePalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    startTransition(() => {
      setMobileDrawerOpen(false);
    });
  }, [location.pathname]);

  const contentMargin = sidebarCollapsed ? 'lg:ml-[48px]' : 'lg:ml-[200px]';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Desktop Sidebar — hidden on mobile */}
      {!isMobile && (
        <Sidebar
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      {/* Mobile Nav — drawer for tablet breakpoints only */}
      {isMobile && <MobileNav open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />}

      {/* Mobile header with hamburger + breadcrumbs */}
      {isMobile && (
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:text-white/70"
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4h12M2 8h12M2 12h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <nav aria-label="Breadcrumb" className="flex-1 min-w-0">
            <ol className="flex items-center gap-1">
              {breadcrumbs.map((segment, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li
                    key={segment.label + (segment.path ?? '')}
                    className="flex items-center gap-1 min-w-0"
                  >
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-[10px] text-white/40 select-none"
                      >
                        /
                      </span>
                    )}
                    {isLast || !segment.path ? (
                      <span
                        aria-current="page"
                        className="truncate text-[12px] font-medium text-white/60"
                      >
                        {segment.label}
                      </span>
                    ) : (
                      <Link
                        to={segment.path}
                        className="truncate text-[12px] font-medium text-white/50 transition-colors hover:text-white/70"
                      >
                        {segment.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:text-white/70"
            aria-label="Search"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      )}

      {/* Main content area */}
      <div
        className={`flex flex-col transition-[margin] duration-200 ease-in-out ${isMobile ? '' : contentMargin}`}
      >
        {/* Desktop top header bar with breadcrumbs + actions */}
        {!isMobile && <BreadcrumbBar segments={breadcrumbs} onSearchClick={handleSearchClick} />}

        {/* Page content — bottom padding on mobile for bottom nav */}
        <main className={`flex-1 px-5 py-6 lg:px-8 ${isMobile ? 'pb-20' : ''}`}>{children}</main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <MobileBottomNav />}

      {/* Command Palette — remount on open to reset internal state */}
      <CommandPalette
        key={String(commandPaletteOpen)}
        open={commandPaletteOpen}
        onClose={handleClosePalette}
      />
    </div>
  );
}

export default DashboardLayout;

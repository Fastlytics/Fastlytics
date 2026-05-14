import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import { BreadcrumbBar } from '@/components/layout/BreadcrumbBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { resolveBreadcrumbs } from '@/lib/breadcrumbs';
import { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';
import { Drawer } from 'vaul';

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
      {/* Desktop Sidebar */}
      <Sidebar
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onSearchClick={handleSearchClick}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Mobile Drawer */}
      <Drawer.Root open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} direction="left">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/70 lg:hidden" />
          <Drawer.Content className="fixed inset-y-0 left-0 z-50 w-[200px] bg-[#000] lg:hidden">
            <Sidebar
              isOpen={mobileDrawerOpen}
              onClose={() => setMobileDrawerOpen(false)}
              onSearchClick={handleSearchClick}
            />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex size-8 items-center justify-center rounded-md text-white/50 transition-colors hover:text-white/70"
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
        <nav aria-label="Breadcrumb" className="flex-1">
          <span className="text-[12px] font-medium text-white/60">
            {breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Dashboard'}
          </span>
        </nav>
      </div>

      {/* Main content area */}
      <div
        className={`flex flex-col transition-[margin] duration-200 ease-in-out ${contentMargin}`}
      >
        {/* Top header bar with breadcrumbs + actions */}
        <div className="hidden lg:block">
          <BreadcrumbBar segments={breadcrumbs} />
        </div>

        {/* Page content */}
        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>

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

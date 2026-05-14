import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { SIDEBAR_NAV_SECTIONS } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { useNewsNotifications, useDiscussionNotifications } from '@/hooks/useNews';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchClick: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const COLLAPSE_KEY = 'fastlytics-sidebar-collapsed';

/**
 * Determines if a nav item is active based on the current pathname.
 */
export function isNavItemActive(
  pathname: string,
  itemPath: string,
  matchPaths?: string[]
): boolean {
  if (pathname === itemPath) return true;
  if (pathname.startsWith(itemPath + '/')) return true;
  if (matchPaths) {
    return matchPaths.some((mp) => pathname === mp || pathname.startsWith(mp + '/'));
  }
  return false;
}

/**
 * Sidebar — Vercel/Linear-style thin navigation panel with Cloudflare-style
 * hover-to-expand behavior.
 *
 * When collapsed:
 * - Hovering over the sidebar temporarily expands it (overlay, no layout shift)
 * - The logo becomes the expand button — on hover it morphs into a sidebar icon
 * - Icons are larger (18px) for better visibility
 *
 * Structure (top → bottom):
 * - Logo (doubles as expand toggle when collapsed)
 * - Search trigger (Cmd+K)
 * - Sectioned nav (Main / Discover / You)
 * - Spacer
 * - Bottom row: account
 * - Collapse toggle (expanded only)
 */
const Sidebar = ({
  onSearchClick,
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: SidebarProps) => {
  const location = useLocation();
  const { user, isSubscribed, profile } = useAuth();
  const { data: unreadNews } = useNewsNotifications();
  const { data: unreadDiscussion } = useDiscussionNotifications();
  const unreadNotificationCount = (unreadNews?.length ?? 0) + (unreadDiscussion?.length ?? 0);

  // Collapse state — localStorage persisted
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const collapsed = controlledCollapsed ?? internalCollapsed;

  // Hover-to-expand state (temporary expand without persisting)
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Whether the sidebar is visually expanded (either truly expanded or hover-expanded)
  const visuallyExpanded = !collapsed || hoverExpanded;

  // Logo hover state — when collapsed, logo morphs into expand icon on hover
  const [logoHovered, setLogoHovered] = useState(false);

  const toggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(COLLAPSE_KEY, String(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });
    }
    // Clear hover expand when toggling
    setHoverExpanded(false);
  }, [onToggleCollapse]);

  // Handle hover-to-expand
  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverExpanded(true);
    }, 200); // Small delay to avoid accidental triggers
  }, [collapsed]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverExpanded(false);
    setLogoHovered(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcut: [ to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return;
        toggleCollapse();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleCollapse]);

  // The actual rendered width depends on hover state
  const sidebarWidth = collapsed ? (hoverExpanded ? 'w-[200px]' : 'w-[48px]') : 'w-[200px]';

  // Popover open state + trigger refs
  const [accountOpen, setAccountOpen] = useState(false);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  // Ensure only one popover is open at a time
  const openAccount = () => {
    setAccountOpen((v) => !v);
  };

  const tier = isSubscribed('ultra') ? 'ultra' : isSubscribed('pro') ? 'pro' : 'free';
  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Account';
  const avatarInitial =
    profile?.full_name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  // Whether to render content in expanded mode (true expanded OR hover expanded)
  const showExpanded = visuallyExpanded;
  // Whether we're in the "collapsed but hovering" overlay state
  const isOverlay = collapsed && hoverExpanded;

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.04] bg-[#000] transition-[width] duration-200 ease-in-out lg:flex ${sidebarWidth} ${
        isOverlay ? 'shadow-2xl shadow-black/50' : ''
      }`}
    >
      {/* Logo + Collapse toggle */}
      <div className={`flex h-12 items-center ${!showExpanded ? 'justify-center px-0' : 'px-4'}`}>
        {/* When collapsed (not hover-expanded): logo area becomes expand button */}
        {collapsed && !hoverExpanded ? (
          <button
            type="button"
            onClick={toggleCollapse}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            className="flex items-center justify-center rounded-md p-1.5 transition-all duration-150"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <span
              className={`transition-opacity duration-150 ${logoHovered ? 'opacity-0 absolute' : 'opacity-100'}`}
            >
              <FastlyticsLogo size={16} showText={false} />
            </span>
            <span
              className={`transition-opacity duration-150 text-white/60 hover:text-white ${logoHovered ? 'opacity-100' : 'opacity-0 absolute'}`}
            ></span>
          </button>
        ) : (
          <>
            <Link to="/dashboard" className="flex items-center">
              <FastlyticsLogo size={16} showText={true} />
            </Link>
            {!isOverlay && (
              <button
                type="button"
                onClick={toggleCollapse}
                className="ml-auto rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              ></button>
            )}
            {isOverlay && (
              <button
                type="button"
                onClick={toggleCollapse}
                className="ml-auto rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
                title="Pin sidebar open"
                aria-label="Pin sidebar open"
              ></button>
            )}
          </>
        )}
      </div>

      {/* Search trigger */}
      {showExpanded ? (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onSearchClick}
            className="flex w-full items-center gap-2 rounded-md border border-white/[0.04] px-2.5 py-1.5 text-[12px] text-white/80 transition-colors hover:border-white/[0.08] hover:text-white"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[10px] font-medium text-white/80">⌘K</kbd>
          </button>
        </div>
      ) : (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={onSearchClick}
            className="flex size-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
            aria-label="Search"
          >
            <svg
              width="16"
              height="16"
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

      {/* Sectioned navigation */}
      <nav
        className={`flex-1 overflow-y-auto ${!showExpanded ? 'px-1.5' : 'px-3'} pt-1`}
        aria-label="Primary"
      >
        {SIDEBAR_NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={section.label}>
            {sectionIdx > 0 && <div className="my-2 h-px bg-white/[0.04]" aria-hidden="true" />}

            <ul className="flex flex-col gap-0.8">
              {section.items.map((item) => {
                const active = isNavItemActive(location.pathname, item.path, item.matchPaths);
                const Icon = item.icon;
                const isNotifications = item.path === '/notifications';
                const badge =
                  isNotifications && unreadNotificationCount > 0 ? unreadNotificationCount : null;

                if (!showExpanded) {
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`relative flex size-9 items-center justify-center rounded-md transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-white/80 hover:bg-white/[0.04] hover:text-white'
                        }`}
                        title={item.label}
                      >
                        <Icon size={18} className="shrink-0" />
                        {active && (
                          <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-white" />
                        )}
                        {badge && (
                          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[15px] font-medium transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-white" />
                      )}
                      <Icon size={18} className="shrink-0" />
                      <span>{item.label}</span>
                      {badge && (
                        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section: account + collapse */}
      <div
        className={`flex flex-col gap-1 border-t border-white/[0.04] py-2 ${
          !showExpanded ? 'px-1.5' : 'px-3'
        }`}
      >
        {/* Free tier upgrade CTA (expanded only) */}
        {showExpanded && user && tier === 'free' && (
          <Link
            to="/account"
            className="mb-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/[0.03] hover:text-white"
          >
            <span className="rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-amber-300">
              FREE
            </span>
            <span>Upgrade</span>
          </Link>
        )}

        {/* Account row */}
        {!showExpanded ? (
          <div className="flex flex-col items-center gap-1">
            {/* Account (collapsed) */}
            <div className="relative">
              <button
                ref={accountTriggerRef}
                type="button"
                onClick={openAccount}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                className={`flex size-9 items-center justify-center rounded-md transition-colors ${
                  accountOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <Avatar className="size-7 border border-white/[0.06]">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-white/[0.04] text-[10px] font-medium text-white/80">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
              </button>
              <AccountMenu
                open={accountOpen}
                onClose={() => setAccountOpen(false)}
                triggerRef={accountTriggerRef}
                collapsed
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {/* Account trigger (expanded) */}
            <div className="relative flex-1">
              <button
                ref={accountTriggerRef}
                type="button"
                onClick={openAccount}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-[12px] text-white transition-colors ${
                  accountOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <Avatar className="size-7 shrink-0 border border-white/[0.06]">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-white/[0.04] text-[10px] font-medium text-white/80">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-left text-[12px] text-white">
                  {displayName}
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`shrink-0 text-white/80 transition-transform ${
                    accountOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  <path
                    d="M2 6l3-3 3 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <AccountMenu
                open={accountOpen}
                onClose={() => setAccountOpen(false)}
                triggerRef={accountTriggerRef}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

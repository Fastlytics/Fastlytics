import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  UserIcon,
  Settings02Icon,
  Moon02Icon,
  HelpCircleIcon,
  CommandIcon,
  Logout01Icon,
} from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface AccountMenuProps {
  open: boolean;
  onClose: () => void;
  /**
   * Ref to the trigger element (avatar button). Used so that clicks on the
   * trigger itself are not treated as "outside clicks" (which would otherwise
   * cause an immediate close/reopen race).
   */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Whether the sidebar is collapsed — adjusts positioning */
  collapsed?: boolean;
}

/**
 * AccountMenu — popover triggered by clicking the sidebar avatar.
 *
 * Linear/Vercel-style user menu:
 * - Positioned above the trigger (`bottom-full mb-2`)
 * - ~240px wide
 * - Profile header (avatar + name/email + tier badge)
 * - Menu items: Profile, Settings, Theme (disabled), Help, Shortcuts
 * - Sign out (red)
 */
export function AccountMenu({ open, onClose, triggerRef, collapsed = false }: AccountMenuProps) {
  const navigate = useNavigate();
  const { user, profile, isSubscribed, signOut } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      onClose();
    };
    // Defer so the click that opened the menu doesn't immediately close it.
    const timeoutId = window.setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, onClose, triggerRef]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    onClose();
    try {
      await signOut();
      navigate('/');
    } catch {
      toast.error('Could not sign you out. Please try again.');
    }
  };

  const handleShortcuts = () => {
    onClose();
    toast.info('Keyboard shortcuts coming soon');
  };

  const tier: 'FREE' | 'PRO' | 'ULTRA' = isSubscribed('ultra')
    ? 'ULTRA'
    : isSubscribed('pro')
      ? 'PRO'
      : 'FREE';

  const tierClass =
    tier === 'FREE'
      ? 'bg-white/[0.04] border border-white/[0.08] text-white/80'
      : 'bg-sky-400/10 border border-sky-400/20 text-sky-300';

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Account';
  const displayEmail = user?.email ?? '';

  const initial =
    profile?.full_name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  // Positioning: always above the trigger. When collapsed, shift the menu to
  // the right of the avatar so it doesn't get clipped by the narrow sidebar.
  const positionClass = collapsed
    ? 'absolute bottom-full left-full ml-2 mb-0'
    : 'absolute bottom-full left-0 mb-2';

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={containerRef}
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          role="menu"
          aria-label="Account menu"
          className={`${positionClass} z-50 w-[240px] rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}
        >
          {/* Profile header */}
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Avatar className="size-9 border border-white/[0.06]">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-white/[0.04] text-[12px] font-medium text-white/80">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-white">{displayName}</div>
              {displayEmail && (
                <div className="truncate text-[11px] text-white/80">{displayEmail}</div>
              )}
            </div>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider ${tierClass}`}
            >
              {tier}
            </span>
          </div>

          <div className="my-1 h-px bg-white/[0.06]" />

          {/* Main menu items */}
          <MenuItem icon={UserIcon} label="Profile" onClick={() => handleNavigate('/account')} />
          <MenuItem
            icon={Settings02Icon}
            label="Settings"
            onClick={() => handleNavigate('/account?section=security')}
          />
          <MenuItem
            icon={Moon02Icon}
            label="Theme"
            trailing={<span className="ml-auto text-[11px] text-white/50">Dark</span>}
            disabled
          />
          <MenuItem
            icon={HelpCircleIcon}
            label="Help & Support"
            onClick={() => handleNavigate('/faq')}
          />
          <MenuItem icon={CommandIcon} label="Keyboard shortcuts" onClick={handleShortcuts} />

          <div className="my-1 h-px bg-white/[0.06]" />

          {/* Sign out */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <Logout01Icon size={14} className="shrink-0" />
            <span className="flex-1 text-left">Sign out</span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, trailing, disabled }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
        disabled
          ? 'cursor-default text-white/80'
          : 'text-white/80 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      <Icon size={14} className="shrink-0 text-white/80" />
      <span className="flex-1 text-left">{label}</span>
      {trailing}
    </button>
  );
}

export default AccountMenu;

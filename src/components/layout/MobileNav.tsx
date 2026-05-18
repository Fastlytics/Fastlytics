import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { SIDEBAR_NAV_SECTIONS } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const location = useLocation();
  const { user, profile } = useAuth();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-[#000] transition-all duration-300 ease-out ${
          open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        {/* Header with logo */}
        <div className="flex h-12 items-center gap-3 border-b border-white/[0.04] px-4">
          <Link to="/dashboard" className="flex items-center" onClick={onClose}>
            <FastlyticsLogo size={16} showText />
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Mobile navigation">
          {SIDEBAR_NAV_SECTIONS.map((section, sectionIdx) => (
            <div key={section.label}>
              {sectionIdx > 0 && <div className="my-3 h-px bg-white/[0.04]" aria-hidden="true" />}
              <ul className="flex flex-col gap-0.5">
                {section.items
                  .filter((item) => {
                    if (!user && (item.path === '/notifications' || item.path === '/saved'))
                      return false;
                    return true;
                  })
                  .map((item) => {
                    const active =
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/') ||
                      item.matchPaths?.some(
                        (mp) => location.pathname === mp || location.pathname.startsWith(mp + '/')
                      );

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={onClose}
                          className={`relative flex items-center gap-2.5 rounded-md px-3 py-[9px] text-[14px] font-medium transition-colors ${
                            active
                              ? 'bg-white/[0.04] text-white'
                              : 'text-white/70 hover:bg-white/[0.03] hover:text-white'
                          }`}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-white" />
                          )}
                          <item.icon size={17} className="shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        {user && (
          <div className="border-t border-white/[0.04] px-3 py-3">
            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
            >
              <Avatar className="size-7 shrink-0 border border-white/[0.06]">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/[0.04] text-[10px] font-medium text-white/80">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ??
                    profile?.first_name?.charAt(0)?.toUpperCase() ??
                    user?.email?.charAt(0)?.toUpperCase() ??
                    'U'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-[12px] font-medium text-white/80">
                {profile?.first_name?.trim() ||
                  profile?.full_name?.trim()?.split(' ')[0] ||
                  user?.email?.split('@')[0] ||
                  'Account'}
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

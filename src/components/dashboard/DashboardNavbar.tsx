import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSeason } from '@/contexts/SeasonContext';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

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
}> = ({ selectedYear, availableYears, onSelect }) => {
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
          <motion.div
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
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    onSelect(year);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    year === selectedYear
                      ? 'bg-red-500/[0.08] text-red-400'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="tracking-wide">{year} Season</span>
                  {year === selectedYear && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const isMobile = useIsMobile();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isMobile) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
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
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <FastlyticsLogo size={32} />
          <span className="text-[17px] font-bold uppercase italic tracking-[-0.02em] text-white">
            Fastlytics
          </span>
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
                <motion.div
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
          />

          {user ? (
            <Link to="/account">
              <Avatar className="h-9 w-9 border border-white/[0.1] transition-colors hover:border-white/30">
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
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
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export { DashboardNavbar };
export default DashboardNavbar;

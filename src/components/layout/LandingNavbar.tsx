import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return location.pathname === '/';
    return location.pathname === href;
  };

  return (
    <nav
      style={{ fontFamily: "'Inter', sans-serif" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#09090b]/70 backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <FastlyticsLogo size={15} />
        </Link>

        {/* Desktop nav — centered pill */}
        <div className="hidden md:flex absolute inset-x-0 justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-1">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              const isAnchor = item.href.startsWith('/#');

              if (isAnchor) {
                return (
                  <a
                    key={item.label}
                    href={location.pathname === '/' ? item.href.replace('/', '') : item.href}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="relative z-10 hidden items-center gap-2.5 md:flex">
          {!user && (
            <Link
              to="/login"
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white"
            >
              Log in
            </Link>
          )}
          <Link
            to="/dashboard"
            className="group relative inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {user ? 'Dashboard' : 'Get started'}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M2.5 6h7M6.5 3l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="relative z-10 flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen(!mobileOpen)}
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
                d="M2 4.5h12M2 8h12M2 11.5h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-white/[0.04] bg-[#09090b]/95 px-5 pb-5 pt-4 backdrop-blur-2xl">
          <div className="flex flex-col gap-0.5">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              const isAnchor = item.href.startsWith('/#');

              if (isAnchor) {
                return (
                  <a
                    key={item.label}
                    href={location.pathname === '/' ? item.href.replace('/', '') : item.href}
                    className={`rounded-lg px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                      active ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:text-white'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`rounded-lg px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                    active ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:text-white'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2.5">
            {!user && (
              <Link
                to="/login"
                className="flex-1 rounded-full border border-white/[0.08] bg-white/[0.03] py-2.5 text-center text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06]"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            )}
            <Link
              to="/dashboard"
              className="flex-1 rounded-full bg-white py-2.5 text-center text-[13px] font-semibold text-black"
              onClick={() => setMobileOpen(false)}
            >
              {user ? 'Dashboard' : 'Get started'}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;

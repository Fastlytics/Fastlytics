import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '/pricing' },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{ fontFamily: "'Inter', sans-serif" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.06] bg-[#09090b]/80 shadow-[0_1px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <FastlyticsLogo size={15} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {!user && (
            <Link
              to="/auth"
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/dashboard"
            className="relative overflow-hidden rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
          >
            {user ? 'Dashboard' : 'Get started'}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
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
              <>
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#09090b]/95 px-5 pb-5 pt-3 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/70"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              to="/auth"
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-center text-[13px] font-medium text-white"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 rounded-lg bg-white py-2.5 text-center text-[13px] font-semibold text-black"
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export { LandingNavbar };
export default LandingNavbar;

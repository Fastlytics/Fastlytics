import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Drivers', path: '/standings/drivers' },
    { name: 'Teams', path: '/standings/teams' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Hide navbar on mobile - we use bottom navigation instead
  if (isMobile) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-2 ${
        scrolled
          ? 'bg-black/95 backdrop-blur-md border-red-600 py-3'
          : 'bg-black/50 border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <Gauge className="h-8 w-8 text-red-600 relative z-10 transform group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic text-white">
              Fast<span className="text-red-600">lytics</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold uppercase tracking-widest transition-colors relative group ${
                  isActive(link.path) ? 'text-red-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600"
                  />
                )}
              </Link>
            ))}

            {user ? (
              <Link to="/account">
                <Avatar className="h-9 w-9 border-2 border-transparent hover:border-red-600 transition-all cursor-pointer">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-zinc-800 text-white text-xs font-bold">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to="/auth">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest border-2 border-red-600 hover:border-red-500 rounded-none skew-x-[-10deg] hover:skew-x-0 transition-all duration-300">
                  <span className="skew-x-[10deg] group-hover:skew-x-0">Sign In</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            {user ? (
              <Link to="/account">
                <Avatar className="h-8 w-8 border border-zinc-700">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-zinc-800 text-white text-xs">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to="/auth">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest border-2 border-red-600 hover:border-red-500 rounded-none skew-x-[-10deg] hover:skew-x-0 transition-all duration-300 text-xs px-4">
                  <span className="skew-x-[10deg] group-hover:skew-x-0">Sign In</span>
                </Button>
              </Link>
            )}
            <button
              className="flex flex-col gap-1.5 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span
                className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
              />
              <span
                className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b-2 border-red-600 overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-lg font-bold uppercase tracking-widest ${
                    isActive(link.path) ? 'text-red-500' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export { DashboardNavbar };
export default DashboardNavbar;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-2 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-red-600 py-4'
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <Gauge className="h-10 w-10 text-red-600 relative z-10 transform group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Fast<span className="text-red-600">lytics</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#features"
              className="text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Features
            </a>
            <Link
              to="/about"
              className="text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              About
            </Link>
            <Link to="/auth">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest border-2 border-red-600 hover:border-red-500 rounded-none skew-x-[-10deg] hover:skew-x-0 transition-all duration-300">
                <span className="skew-x-[10deg] group-hover:skew-x-0">
                  {user ? 'Dashboard' : 'Sign Up'}
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span
              className={`block w-8 h-0.5 bg-white transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
            />
            <span
              className={`block w-8 h-0.5 bg-white transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block w-8 h-0.5 bg-white transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
            />
          </button>
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
            <div className="px-4 py-8 flex flex-col gap-6">
              <a
                href="/#features"
                className="text-xl font-bold uppercase tracking-widest hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <Link
                to="/about"
                className="text-xl font-bold uppercase tracking-widest hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest border-2 border-red-600 rounded-none py-6">
                  {user ? 'Dashboard' : 'Sign Up'}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export { LandingNavbar };
export default LandingNavbar;

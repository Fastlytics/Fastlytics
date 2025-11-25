import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Gauge, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingNavbarProps {
  transparent?: boolean;
}

const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ transparent = false }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Showcase', href: '#showcase' },
    { name: 'Community', href: '#community' }
  ];

  // Track scroll position for background opacity changes
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Offset for navbar height
        behavior: 'smooth'
      });
      setMobileMenuOpen(false);
    }
  };

  // Calculate background opacity based on scroll position
  const backgroundOpacity = transparent 
    ? Math.min(scrollPosition / 300, 0.95) // Gradually increase opacity as user scrolls
    : 0.95; // Default opacity

  // Calculate blur based on scroll position
  const blurAmount = transparent
    ? Math.min(scrollPosition / 100, 10) // Gradually increase blur as user scrolls
    : 10; // Default blur

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 w-full"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div 
        className="w-full h-16 md:h-20"
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity})`,
          backdropFilter: `blur(${blurAmount}px)`,
          borderBottom: scrollPosition > 50 ? '1px solid rgba(75, 75, 75, 0.2)' : 'none',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Gauge className="h-7 w-7 text-red-500" />
            </motion.div>
            <motion.span 
              className="font-bold text-lg md:text-xl text-white"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Fast<span className="text-red-500">lytics</span>
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <ul className="flex space-x-1">
              {navItems.map((item) => (
                <motion.li key={item.name} whileHover={{ scale: 1.05 }}>
                  <a
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors relative group"
                  >
                    {item.name}
                    <motion.span 
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full" 
                      transition={{ duration: 0.3 }}
                    />
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/dashboard">
                <Button variant="default" size="sm" className="ml-4 bg-red-600 hover:bg-red-700 text-white">
                  Explore Dashboard
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-gray-900/95 backdrop-blur-md border-l-gray-800 text-white p-0">
                <div className="p-6 space-y-6">
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-6 w-6 text-red-500" />
                    <span className="font-bold text-lg">Fast<span className="text-red-500">lytics</span></span>
                  </div>
                  
                  <div className="space-y-1 mt-6">
                    {navItems.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => handleScroll(e, item.href)}
                        className="flex items-center space-x-2 w-full px-4 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-colors"
                      >
                        <span>{item.name}</span>
                      </a>
                    ))}
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-gray-800">
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        Explore Dashboard
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default FloatingNavbar; 
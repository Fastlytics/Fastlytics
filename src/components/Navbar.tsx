import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Menu,
  X,
  Gauge, 
  Flag,
  Users,
  UsersRound,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuth } from '@/contexts/AuthContext'; // Keep import for now

const Navbar = () => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useAuth(); // Keep for compatibility
  const [scrollPosition, setScrollPosition] = useState(0);

  // Track scroll position for background opacity changes
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate background opacity and blur based on scroll position
  const backgroundOpacity = Math.min(0.8 + (scrollPosition / 1000), 0.95);
  const blurAmount = Math.min(8 + (scrollPosition / 100), 12);

  // Expanded Nav Items
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Races', href: '/races', icon: <Flag size={18} /> },
    { name: 'Drivers', href: '/standings/drivers', icon: <Users size={18} /> },
    { name: 'Teams', href: '/standings/teams', icon: <UsersRound size={18} /> },
  ];

  // Loading state while checking auth
  if (loading) {
    return (
      <motion.nav 
        className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md h-16 md:h-20 flex items-center justify-center"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="text-gray-500 text-sm">Loading...</span>
      </motion.nav>
    );
  }

  return (
    <motion.nav 
      className="sticky top-0 z-50 w-full"
      initial={{ y: 0, opacity: 0.8 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div 
        className="w-full h-16 md:h-20"
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity})`,
          backdropFilter: `blur(${blurAmount}px)`,
          borderBottom: scrollPosition > 50 ? '1px solid rgba(75, 75, 75, 0.2)' : '1px solid rgba(31, 41, 55, 0.2)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <div className="w-full mx-auto h-full px-4 sm:px-8 lg:px-12 flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
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
          <div className="hidden md:flex items-center space-x-2">
            <ul className="flex space-x-3">
              {navItems.map((item) => (
                <motion.li key={item.name} whileHover={{ scale: 1.05 }}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-md text-base font-medium transition-colors relative group",
                        isActive 
                          ? "text-white" 
                          : "text-gray-300 hover:text-white"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="mr-1.5">{item.icon}</span>
                        <span>{item.name}</span>
                        {isActive && (
                          <motion.span 
                            className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "100%" }}
                            transition={{ 
                              type: 'tween', 
                              ease: "easeInOut", 
                              duration: 0.3 
                            }}
                          />
                        )}
                        {!isActive && (
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300" />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-300 hover:text-white bg-transparent border-none p-2 rounded-md"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </motion.button>
              </DrawerTrigger>
              <DrawerContent className="h-[90vh] w-full max-w-[350px] bg-gray-900/95 backdrop-blur-md border-l-gray-800 text-white p-0">
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center space-x-3" onClick={() => setDrawerOpen(false)}>
                      <Gauge className="h-6 w-6 text-red-500" />
                      <span className="font-bold text-lg">Fast<span className="text-red-500">lytics</span></span>
                    </Link>
                    <DrawerClose asChild>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="text-gray-300 hover:text-white bg-transparent border-none p-2 rounded-md"
                      >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close menu</span>
                      </motion.button>
                    </DrawerClose>
                  </div>

                  {/* Mobile Nav Links */}
                  <div className="space-y-1 mt-6">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.href === '/dashboard'}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center space-x-3 w-full px-5 py-4 rounded-md text-base font-medium transition-colors relative",
                            isActive 
                              ? "bg-gray-800/60 text-white" 
                              : "text-gray-300 hover:bg-gray-800/40 hover:text-white"
                          )
                        }
                        onClick={() => setDrawerOpen(false)}
                      >
                        {({ isActive }) => (
                          <>
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                            {isActive && (
                              <motion.span 
                                className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r" 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "100%" }}
                                transition={{ 
                                  type: 'tween', 
                                  ease: "easeInOut", 
                                  duration: 0.3 
                                }}
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

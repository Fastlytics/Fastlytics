import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  UserCircleIcon,
  Login01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const baseNavItems: NavItem[] = [
    {
      name: 'Home',
      path: '/dashboard',
      icon: <DashboardSquare01Icon size={20} />,
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: <Calendar03Icon size={20} />,
    },
    {
      name: 'Drivers',
      path: '/standings/drivers',
      icon: <UserGroupIcon size={20} />,
    },
    {
      name: 'Teams',
      path: '/standings/teams',
      icon: <UserMultiple02Icon size={20} />,
    },
  ];

  const navItems: NavItem[] = user
    ? [...baseNavItems, { name: 'Account', path: '/account', icon: <UserCircleIcon size={20} /> }]
    : [...baseNavItems, { name: 'Sign In', path: '/auth', icon: <Login01Icon size={20} /> }];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Main navigation bar */}
      <div className="bg-black border-t-2 border-white/10 safe-area-bottom">
        <div className="flex items-center justify-between h-16 px-0">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative group',
                  'transition-all duration-200 tap-highlight-transparent',
                  'border-r border-white/5 last:border-r-0',
                  active ? 'bg-black' : 'bg-black hover:bg-zinc-900'
                )}
              >
                {/* Active indicator - Top Line */}
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-red-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon with animation */}
                <motion.div
                  initial={false}
                  animate={{
                    y: active ? -1 : 0,
                  }}
                  className={cn(
                    'mb-1',
                    active ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-300'
                  )}
                >
                  {item.icon}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest',
                    active ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-300'
                  )}
                >
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export { MobileBottomNav };
export default MobileBottomNav;

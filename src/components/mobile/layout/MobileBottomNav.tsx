import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home04Icon,
  Calendar01Icon,
  RankingIcon,
  NewsIcon,
  User03Icon,
  Login01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  name: string;
  path: string;
  matchPaths?: string[];
  icon: React.ReactNode;
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const baseNavItems: NavItem[] = [
    {
      name: 'Home',
      path: '/dashboard',
      icon: <Home04Icon size={20} />,
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: <Calendar01Icon size={20} />,
    },
    {
      name: 'Standings',
      path: '/standings/drivers',
      matchPaths: ['/standings', '/compare'],
      icon: <RankingIcon size={20} />,
    },
    {
      name: 'News',
      path: '/news',
      icon: <NewsIcon size={20} />,
    },
  ];

  const navItems: NavItem[] = user
    ? [
        ...baseNavItems,
        {
          name: 'Profile',
          path: `/profile/${user.user_metadata?.username || ''}`,
          icon: <User03Icon size={20} />,
        },
      ]
    : [...baseNavItems, { name: 'Sign In', path: '/login', icon: <Login01Icon size={20} /> }];

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p));
    }
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="border-t border-white/[0.04] bg-[#0a0a0a]/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-between h-14 px-0">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative group',
                  'transition-colors duration-200',
                  active ? 'text-white' : 'text-white/40'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-[#ff0000]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    'mb-0.5',
                    active ? 'text-[#ff0000]' : 'text-white/40 group-hover:text-white/60'
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    'text-[9px] font-medium tracking-wide uppercase',
                    active ? 'text-white' : 'text-white/40 group-hover:text-white/60'
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

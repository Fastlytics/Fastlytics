import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    DashboardSquare01Icon, 
    Calendar03Icon, 
    UserGroupIcon, 
    UserMultiple02Icon,
    UserCircleIcon,
    Home01Icon,
    Home02Icon
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const MobileBottomNav: React.FC = () => {
    const location = useLocation();

    const navItems: NavItem[] = [
        { 
            name: 'Home', 
            path: '/dashboard', 
            icon: <DashboardSquare01Icon size={24} />
        },
        { 
            name: 'Calendar', 
            path: '/calendar', 
            icon: <Calendar03Icon size={24} />
        },
        { 
            name: 'Drivers', 
            path: '/standings/drivers', 
            icon: <UserGroupIcon size={24} />
        },
        { 
            name: 'Teams', 
            path: '/standings/teams', 
            icon: <UserMultiple02Icon size={24} />
        },
        { 
            name: 'Account', 
            path: '/account', 
            icon: <UserCircleIcon size={24} />
        },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Main navigation bar */}
            <div className="bg-black border-t border-gray-800 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full relative",
                                    "transition-all duration-200 tap-highlight-transparent",
                                    active ? "text-red-500" : "text-gray-500 active:text-gray-400"
                                )}
                            >
                                {/* Active indicator */}
                                {active && (
                                    <motion.div
                                        layoutId="mobile-nav-indicator"
                                        className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-red-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                
                                {/* Icon with animation */}
                                <motion.div
                                    initial={false}
                                    animate={{ 
                                        scale: active ? 1.1 : 1,
                                        y: active ? -2 : 0
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    className="mb-1"
                                >
                                    {item.icon}
                                </motion.div>
                                
                                {/* Label */}
                                <span className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wider",
                                    active ? "text-red-500" : "text-gray-500"
                                )}>
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

export default MobileBottomNav;

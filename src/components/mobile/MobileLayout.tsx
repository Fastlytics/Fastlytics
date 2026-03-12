import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

interface MobileLayoutProps {
    children: React.ReactNode;
    showBottomNav?: boolean;
}

/**
 * MobileLayout wraps content and provides:
 * - Bottom navigation on mobile devices
 * - Proper padding to avoid content being hidden behind bottom nav
 * - Safe area handling for notched devices
 */
const MobileLayout: React.FC<MobileLayoutProps> = ({ children, showBottomNav = true }) => {
    const isMobile = useIsMobile();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Main content area with bottom padding on mobile for nav */}
            <div className={isMobile && showBottomNav ? 'pb-20' : ''}>
                {children}
            </div>
            
            {/* Bottom navigation - only on mobile */}
            {isMobile && showBottomNav && <MobileBottomNav />}
        </div>
    );
};

export { MobileLayout };
export default MobileLayout;

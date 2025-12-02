import React from 'react';
import { Gauge } from 'lucide-react';

/**
 * Consistent header for mobile pages with centered logo (same as dashboard)
 * Uses pt-4 + py-1 to match dashboard: main has pt-4, header has py-1
 */
const MobilePageHeader: React.FC = () => {
    return (
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md pt-4 px-4 pb-3">
            {/* Centered Logo - Same exact spacing as dashboard header */}
            <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2.5">
                    <Gauge className="h-8 w-8 text-red-600" />
                    <span className="text-2xl font-black tracking-tighter uppercase italic text-white">
                        Fast<span className="text-red-600">lytics</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MobilePageHeader;

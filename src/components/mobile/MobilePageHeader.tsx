import React from 'react';
import { Gauge } from 'lucide-react';
import { ArrowLeft01Icon } from 'hugeicons-react';
import { useNavigate } from 'react-router-dom';

interface MobilePageHeaderProps {
    title?: string;
    showBack?: boolean;
}

/**
 * Consistent header for mobile pages with centered logo (same as dashboard)
 * Uses pt-4 + py-1 to match dashboard: main has pt-4, header has py-1
 */
const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({ title, showBack }) => {
    const navigate = useNavigate();

    return (
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md pt-4 px-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between py-1 relative min-h-[40px]">
                {/* Back Button */}
                {showBack && (
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-0 p-2 -ml-2 text-white hover:text-red-600 transition-colors"
                    >
                        <ArrowLeft01Icon className="w-6 h-6" />
                    </button>
                )}

                {/* Center Content - Always Logo */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <Gauge className="h-6 w-6 text-red-600" />
                        <span className="text-xl font-black tracking-tighter uppercase italic text-white">
                            Fast<span className="text-red-600">lytics</span>
                        </span>
                    </div>
                </div>


            </div>
        </div>
    );
};

export { MobilePageHeader };
export default MobilePageHeader;

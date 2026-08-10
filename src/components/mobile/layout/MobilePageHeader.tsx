import React from 'react';
import { ArrowLeft01Icon } from 'hugeicons-react';
import { useNavigate } from 'react-router-dom';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

interface MobilePageHeaderProps {
  title?: string;
  showBack?: boolean;
}

const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({ showBack }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
      <div className="flex items-center justify-between relative min-h-[36px]">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 p-1.5 -ml-1.5 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft01Icon className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 flex items-center justify-center">
          <FastlyticsLogo />
        </div>
      </div>
    </div>
  );
};

export { MobilePageHeader };
export default MobilePageHeader;

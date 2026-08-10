import React from 'react';
import { Link } from 'react-router-dom';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const MobileFooter: React.FC = () => {
  return (
    <footer className="relative z-10 px-4 py-10 bg-[#0a0a0a] border-t border-white/[0.04]">
      <div className="flex items-center justify-center mb-6">
        <FastlyticsLogo size={22} />
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6">
        {[
          { label: 'About', path: '/about' },
          { label: 'Privacy', path: '/privacy-policy' },
          { label: 'Terms', path: '/terms-of-service' },
          { label: 'Refunds', path: '/refund-policy' },
          { label: 'Contact', path: '/contact' },
        ].map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="text-[10px] text-white/40 hover:text-white/70 uppercase font-medium tracking-widest transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="text-center border-t border-white/[0.04] pt-6">
        <p className="text-[10px] text-white/25 font-mono uppercase mb-1">
          © {new Date().getFullYear()} Fastlytics. All rights reserved.
        </p>
        <p className="text-[9px] text-white/15">
          Not affiliated with Formula One World Championship Limited.
        </p>
      </div>
    </footer>
  );
};

export { MobileFooter };
export default MobileFooter;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge } from 'lucide-react';

const MobileFooter: React.FC = () => {
  const location = useLocation();
  return (
    <footer className="relative z-10 px-4 py-12 bg-black border-t-2 border-white/10">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Gauge className="h-6 w-6 text-red-600" />
        <span className="text-lg font-black tracking-tighter uppercase italic">
          Fast<span className="text-red-600">lytics</span>
        </span>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8">
        <Link
          to="/about"
          className="text-[10px] text-gray-500 hover:text-red-600 uppercase font-black tracking-widest transition-colors"
        >
          About
        </Link>
        <Link
          to="/privacy-policy"
          className="text-[10px] text-gray-500 hover:text-red-600 uppercase font-black tracking-widest transition-colors"
        >
          Privacy
        </Link>
        <Link
          to="/terms-of-service"
          className="text-[10px] text-gray-500 hover:text-red-600 uppercase font-black tracking-widest transition-colors"
        >
          Terms
        </Link>
        <Link
          to="/refund-policy"
          className="text-[10px] text-gray-500 hover:text-red-600 uppercase font-black tracking-widest transition-colors"
        >
          Refunds
        </Link>
        <Link
          to="/contact"
          className="text-[10px] text-gray-500 hover:text-red-600 uppercase font-black tracking-widest transition-colors"
        >
          Contact
        </Link>
      </div>

      <div className="text-center border-t border-white/10 pt-8">
        <p className="text-[10px] text-gray-600 font-mono uppercase mb-2">
          © {new Date().getFullYear()} Fastlytics. All rights reserved.
        </p>
        <p className="text-[9px] text-gray-700">
          Not affiliated with Formula One World Championship Limited.
        </p>
      </div>
    </footer>
  );
};

export { MobileFooter };
export default MobileFooter;

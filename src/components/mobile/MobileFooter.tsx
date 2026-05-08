import React from 'react';
import { Link } from 'react-router-dom';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Press Kit', href: '/press-kit' },
];

const legalLinks = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms-of-service' },
  { label: 'Refunds', href: '/refund-policy' },
];

const MobileFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.04] bg-[#09090b] px-5 py-10">
      <div className="flex items-center gap-2.5 mb-6">
        <FastlyticsLogo size={20} />
        <span className="text-[14px] font-bold italic tracking-[-0.02em] text-white">
          FASTLYTICS
        </span>
      </div>

      <div className="space-y-5 mb-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-3">
            Company
          </h4>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[13px] text-white/40 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-3">
            Legal
          </h4>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[13px] text-white/40 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.04] pt-5">
        <p className="text-[11px] text-white/20">
          &copy; {new Date().getFullYear()} Fastlytics. All rights reserved.
        </p>
        <p className="mt-1 text-[10px] text-white/15">
          Not affiliated with Formula One World Championship Limited.
        </p>
      </div>
    </footer>
  );
};

export { MobileFooter };
export default MobileFooter;

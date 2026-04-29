import React from 'react';
import { Link } from 'react-router-dom';

const platformLinks = [
  { label: 'Race desk', href: '/dashboard' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Driver standings', href: '/standings/drivers' },
  { label: 'Team standings', href: '/standings/teams' },
];

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms-of-service' },
  { label: 'Refunds', href: '/refund-policy' },
];

const LandingFooter = () => {
  return (
    <footer className="border-t border-white/10 bg-[#050608] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="group flex items-center gap-3" aria-label="Fastlytics">
              <span className="relative flex h-8 w-11 items-center">
                <span className="absolute left-0 top-1 h-3 w-9 skew-x-[-24deg] bg-[#ff2a1a] transition-transform group-hover:translate-x-1" />
                <span className="absolute bottom-1 right-0 h-3 w-8 skew-x-[-24deg] bg-white transition-transform group-hover:-translate-x-1" />
              </span>
              <span className="race-display text-3xl leading-none">
                Fast<span className="text-[#ff2a1a]">lytics</span>
              </span>
            </Link>
            <p className="mt-5 max-w-md text-base leading-7 text-white/60">
              Formula 1 analytics for live telemetry, race strategy, session replay and championship
              context.
            </p>
            <p className="race-micro mt-6 text-xs text-white/35">
              Not affiliated with Formula One World Championship Limited.
            </p>
          </div>

          <FooterColumn title="Platform" links={platformLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
          <p className="race-micro">
            © {new Date().getFullYear()} Fastlytics. All rights reserved.
          </p>
          <p className="race-micro">Built for race weekends.</p>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <h3 className="race-micro text-sm font-black text-[#ff4b35]">{title}</h3>
    <ul className="mt-5 space-y-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link className="text-sm text-white/60 transition-colors hover:text-white" to={link.href}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export { LandingFooter };
export default LandingFooter;

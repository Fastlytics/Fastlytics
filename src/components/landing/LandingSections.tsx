import { Link } from 'react-router-dom';
import { motion, stagger } from 'motion/react';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const FEATURES = [
  {
    title: 'Track Dominance',
    description:
      'See which driver owns which sector. Sector-by-sector color overlays reveal where speed is gained and lost.',
    accent: 'text-red-400',
    accentBg: 'bg-red-500',
  },
  {
    title: 'Telemetry Overlay',
    description:
      'Speed, brake, throttle and gear traces for any driver and lap. Overlay up to four drivers at once.',
    accent: 'text-orange-400',
    accentBg: 'bg-orange-500',
  },
  {
    title: 'Tyre Strategy',
    description:
      'Stint timelines, degradation curves, compound life and pit window predictions as the race unfolds.',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500',
  },
  {
    title: 'Session Replay',
    description:
      'Scrub through any session with positions, race control events and commentary synced to the timeline.',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
  },
  {
    title: 'Driver Comparison',
    description:
      'Head-to-head lap deltas, sector splits and pace trends. Find the corner-by-corner advantage.',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500',
  },
  {
    title: 'Championship Context',
    description:
      'Standings progression, points scenarios and championship momentum across the full season arc.',
    accent: 'text-violet-400',
    accentBg: 'bg-violet-500',
  },
];

const PRODUCT_BULLETS = [
  {
    label: 'Synced context',
    desc: 'Every view shares the same lap, session and driver state',
  },
  {
    label: 'Delta precision',
    desc: '0.001s timing from sector splits to gap evolution',
  },
  {
    label: 'Pit window alerts',
    desc: 'Undercut and overcut probability as the race develops',
  },
  { label: 'Free to start', desc: 'Core race desk features available to every fan' },
];

const SIGNAL_ROWS = [
  {
    label: 'Lap delta',
    value: '-0.358s',
    note: 'Gaining through S1 braking',
    color: 'text-emerald-400',
  },
  {
    label: 'Tyre drop',
    value: '+0.086s/lap',
    note: 'Medium crossing target cliff',
    color: 'text-amber-400',
  },
  {
    label: 'Pit window',
    value: 'Lap 23-25',
    note: 'Undercut probability rising',
    color: 'text-red-400',
  },
  {
    label: 'Track bias',
    value: 'S1/S3',
    note: 'Strong under braking and exit',
    color: 'text-blue-400',
  },
];

const STATS = [
  { number: '57', label: 'Laps mapped in real-time', suffix: '' },
  { number: '3', label: 'Sector-level precision', suffix: 'sectors' },
  { number: '4', label: 'Tyre compounds tracked', suffix: 'compounds' },
];

const FOOTER_GROUPS = [
  {
    title: 'Platform',
    links: [
      { label: 'Race Desk', href: '/dashboard' },
      { label: 'Calendar', href: '/calendar' },
      { label: 'Driver Standings', href: '/standings/drivers' },
      { label: 'Team Standings', href: '/standings/teams' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press Kit', href: '/press-kit' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy-policy' },
      { label: 'Terms', href: '/terms-of-service' },
      { label: 'Refunds', href: '/refund-policy' },
    ],
  },
];

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: stagger(0.12),
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

export function LogoBar() {
  return (
    <section className="border-y border-white/[0.04] bg-[#09090b] py-8">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: '320+', label: 'KM/H telemetry traces' },
            { value: '0.001s', label: 'Delta precision' },
            { value: '20', label: 'Drivers tracked live' },
            { value: '24', label: 'Races per season' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-bold tracking-[-0.02em] text-white">{item.value}</div>
              <div className="mt-1 text-[12px] text-white/30">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400"
            >
              Features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
            >
              Everything the broadcast doesn't show you
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[16px] leading-relaxed text-white/40 lg:text-right"
          >
            Every module answers a racing question: who is gaining, where, why, and what happens
            next.
          </motion.p>
        </div>
        <div className="mt-12 h-px w-full bg-white/[0.06]" />
        <motion.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={ITEM_VARIANTS}
              className="group grid items-center gap-4 border-b border-white/[0.04] py-6 sm:grid-cols-[auto_1fr_1.2fr] sm:gap-8 lg:py-8"
            >
              <div className="flex items-center gap-4">
                <span className="text-[13px] tabular-nums text-white/15">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className={`hidden h-px w-8 sm:block ${feature.accentBg} opacity-40`} />
              </div>
              <h3
                className={`text-[18px] font-semibold tracking-[-0.01em] text-white transition-colors group-hover:${feature.accent} sm:text-[20px]`}
              >
                {feature.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-white/35 transition-colors group-hover:text-white/50">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function ProductSection() {
  return (
    <section id="product" className="relative border-y border-white/[0.04] py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400"
            >
              Race Desk
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
            >
              Built like a pit wall, not a startup dashboard
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-[16px] leading-relaxed text-white/40"
            >
              Timing, telemetry, tyre life and race context connected into one operational surface.
              Switch modules without losing the lap, driver or session you're analyzing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 space-y-4"
            >
              {PRODUCT_BULLETS.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-white">{item.label}</div>
                    <div className="text-[13px] text-white/35">{item.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-white transition-colors hover:text-red-400"
              >
                Try it now
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 7h12M8 2l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
              <div className="border-b border-white/[0.06] px-4 py-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/25">
                  Signal Board
                </span>
              </div>
              <div className="divide-y divide-white/[0.04] p-4">
                {SIGNAL_ROWS.map((row, index) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="w-20 shrink-0 text-[12px] text-white/30">{row.label}</span>
                    <span
                      className={`w-24 shrink-0 text-[16px] font-bold tabular-nums ${row.color}`}
                    >
                      {row.value}
                    </span>
                    <span className="text-[12px] text-white/25">{row.note}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
          >
            The broadcast shows the result.{' '}
            <span className="text-white/40">We show the cause.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-[16px] leading-relaxed text-white/40"
          >
            Follow the chain from raw timing to race decisions - pace drift, sector splits,
            degradation curves and pit-loss context in one interface.
          </motion.p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 text-center"
            >
              <div className="text-4xl font-bold tracking-[-0.02em] text-white">
                {stat.number}
                {stat.suffix && (
                  <span className="ml-1 text-lg font-normal text-white/30">{stat.suffix}</span>
                )}
              </div>
              <div className="mt-2 text-[13px] text-white/35">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-white/[0.04] py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.06] blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 text-center lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
        >
          Open the race desk before the next session
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/40"
        >
          Start free. The core race dashboard - timing, telemetry, strategy - is available to every
          fan. Sign in for saved favorites, advanced views and deeper analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            to="/dashboard"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
          >
            Get started - it's free
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M1 7h12M8 2l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            to="/auth"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 text-[14px] font-medium text-white/80 transition-all hover:border-white/20"
          >
            Sign in
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#09090b] py-12">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <FastlyticsLogo size={28} />
              <span className="text-[15px] font-bold italic tracking-[-0.02em] text-white">
                FASTLYTICS
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/35">
              Formula 1 analytics - telemetry, race strategy, session replay and championship
              context.
            </p>
            <p className="mt-4 text-[11px] text-white/20">
              Not affiliated with Formula One World Championship Limited.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/30">
                {group.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-white/40 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-6 sm:flex-row">
          <p className="text-[12px] text-white/20">
            &copy; {new Date().getFullYear()} Fastlytics. All rights reserved.
          </p>
          <p className="text-[12px] text-white/20">Built for race weekends.</p>
        </div>
      </div>
    </footer>
  );
}

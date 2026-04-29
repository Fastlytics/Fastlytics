import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, stagger, useMotionValue, useTransform, animate } from 'motion/react';
import { SEO } from '@/components/layout/SEO';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { useAuth } from '@/contexts/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Complete redesign
   Font: Inter (variable, optical sizing)
   Style: Clean, dark, premium — inspired by Linear/Vercel/Raycast
   ═══════════════════════════════════════════════════════════════ */

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div
      style={inter}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Fastlytics — Formula 1 Race Intelligence"
        description="Telemetry, tyre strategy, pace analysis, track dominance and session replay in one race desk. The analytics platform F1 fans deserve."
        keywords={[
          'formula 1 analytics',
          'f1 telemetry',
          'f1 race strategy',
          'f1 timing',
          'motorsport analytics',
        ]}
      />
      <LandingNavbar />

      <main>
        <HeroSection />
        <LogoBar />
        <FeaturesSection />
        <ProductSection />
        <StatsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

/* ─── Animated counter hook ─── */
function useAnimatedCounter(target: number, duration = 2) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, target, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [target, duration, count]);

  return rounded;
}

/* ─── Hero ─── */
const HeroSection = () => (
  <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-40">
    {/* Gradient orbs */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.07] blur-[120px]" />
      <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-orange-500/[0.05] blur-[100px]" />
    </div>

    {/* Grid bg */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
      }}
    />

    <div className="relative z-10 mx-auto max-w-6xl px-5 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[13px] font-medium text-white/60">2025 Season — Live now</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Race intelligence <span className="text-red-500">for every</span> Formula 1 session
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50"
        >
          Telemetry, strategy, pace and championship context wired into one live race desk. See what
          the pit wall sees.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            to="/dashboard"
            className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            Open race desk
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
          <a
            href="#features"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
          >
            See features
          </a>
        </motion.div>
      </div>

      {/* ─── Animated Dashboard Illustration ─── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="relative mx-auto mt-16 max-w-5xl lg:mt-20"
      >
        {/* Glow behind */}
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-red-500/10 via-transparent to-transparent blur-2xl" />

        {/* Dashboard frame */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
              </div>
              <div className="h-5 w-px bg-white/[0.06]" />
              <span className="text-[11px] font-medium text-white/30">
                Race Desk — Australian Grand Prix
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
          </div>

          {/* Dashboard grid */}
          <div className="grid gap-px bg-white/[0.04] p-px md:grid-cols-[1.1fr_0.9fr]">
            {/* Left — Timing tower + chart */}
            <div className="space-y-px">
              {/* Timing tower */}
              <div className="bg-[#0c0c0e] p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                  Race Positions
                </div>
                <div className="space-y-0">
                  {[
                    {
                      pos: 1,
                      driver: 'NOR',
                      team: 'McLaren',
                      gap: 'Leader',
                      color: '#ff8700',
                      highlight: true,
                    },
                    {
                      pos: 2,
                      driver: 'LEC',
                      team: 'Ferrari',
                      gap: '+0.732',
                      color: '#ff2800',
                      highlight: false,
                    },
                    {
                      pos: 3,
                      driver: 'PIA',
                      team: 'McLaren',
                      gap: '+1.247',
                      color: '#ff8700',
                      highlight: false,
                    },
                    {
                      pos: 4,
                      driver: 'RUS',
                      team: 'Mercedes',
                      gap: '+1.892',
                      color: '#6c779f',
                      highlight: false,
                    },
                    {
                      pos: 5,
                      driver: 'HAM',
                      team: 'Mercedes',
                      gap: '+2.104',
                      color: '#6c779f',
                      highlight: false,
                    },
                  ].map((row, i) => (
                    <motion.div
                      key={row.driver}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                      className={`flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-b-0 ${row.highlight ? '' : ''}`}
                    >
                      <span className="w-5 text-[11px] tabular-nums text-white/25">{row.pos}</span>
                      <span
                        className="h-4 w-[3px] rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="flex-1 text-[13px] font-semibold text-white">
                        {row.driver}
                      </span>
                      <span
                        className={`text-[12px] tabular-nums ${row.highlight ? 'font-medium text-emerald-400' : 'text-white/40'}`}
                      >
                        {row.gap}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Lap chart */}
              <div className="bg-[#0c0c0e] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/25">
                    Gap Evolution
                  </span>
                  <span className="text-[11px] tabular-nums text-white/20">Lap 57/57</span>
                </div>
                <div className="relative h-[120px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b]">
                  <svg
                    viewBox="0 0 600 120"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                  >
                    {/* Grid lines */}
                    {[30, 60, 90].map((y) => (
                      <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" />
                    ))}
                    {/* NOR line */}
                    <motion.path
                      d="M0 80 C50 78 100 72 150 68 C200 62 250 55 300 48 C350 40 400 35 450 30 C500 25 550 22 600 18"
                      fill="none"
                      stroke="#ff8700"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.8, ease: 'easeOut' }}
                    />
                    {/* LEC line */}
                    <motion.path
                      d="M0 82 C50 80 100 78 150 76 C200 72 250 70 300 65 C350 60 400 58 450 55 C500 52 550 50 600 48"
                      fill="none"
                      stroke="#ff2800"
                      strokeWidth="2"
                      opacity="0.7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.9, ease: 'easeOut' }}
                    />
                    {/* PIA line */}
                    <motion.path
                      d="M0 84 C50 85 100 86 150 88 C200 85 250 82 300 78 C350 75 400 72 450 70 C500 68 550 66 600 65"
                      fill="none"
                      stroke="#ff8700"
                      strokeWidth="1.5"
                      opacity="0.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right — Track map + telemetry + strategy */}
            <div className="space-y-px">
              {/* Track map */}
              <div className="bg-[#0c0c0e] p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                  Track Map
                </div>
                <div className="relative h-[160px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b]">
                  <svg viewBox="0 0 400 160" className="absolute inset-0 h-full w-full">
                    {/* Track outline */}
                    <path
                      d="M70 110 C40 80 60 40 110 45 L170 48 C210 50 225 35 210 20 C190 2 220 -5 260 8 C310 24 340 55 330 80 C322 98 290 96 288 112 C286 130 340 126 355 108 C372 88 365 112 350 120 C330 130 260 135 220 118 C190 105 170 115 140 112 C100 108 85 125 70 110Z"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="18"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Sector colors */}
                    <motion.path
                      d="M70 110 C40 80 60 40 110 45 L170 48"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                    />
                    <motion.path
                      d="M170 48 C210 50 225 35 210 20 C190 2 220 -5 260 8 C310 24 340 55 330 80"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.2 }}
                    />
                    <motion.path
                      d="M330 80 C322 98 290 96 288 112 C286 130 340 126 355 108 C372 88 365 112 350 120 C330 130 260 135 220 118 C190 105 170 115 140 112 C100 108 85 125 70 110"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.6 }}
                    />
                    {/* Moving car dot */}
                    <motion.circle
                      r="5"
                      fill="white"
                      filter="drop-shadow(0 0 8px rgba(255,255,255,0.6))"
                    >
                      <animateMotion
                        dur="8s"
                        repeatCount="indefinite"
                        path="M70 110 C40 80 60 40 110 45 L170 48 C210 50 225 35 210 20 C190 2 220 -5 260 8 C310 24 340 55 330 80 C322 98 290 96 288 112 C286 130 340 126 355 108 C372 88 365 112 350 120 C330 130 260 135 220 118 C190 105 170 115 140 112 C100 108 85 125 70 110"
                      />
                    </motion.circle>
                  </svg>

                  {/* Sector badges */}
                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    {[
                      { label: 'S1', color: 'bg-red-500/20 text-red-400' },
                      { label: 'S2', color: 'bg-amber-500/20 text-amber-400' },
                      { label: 'S3', color: 'bg-emerald-500/20 text-emerald-400' },
                    ].map((s) => (
                      <span
                        key={s.label}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${s.color}`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Telemetry bars */}
              <div className="bg-[#0c0c0e] p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                  Telemetry
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Throttle', value: 100, color: 'bg-emerald-500' },
                    { label: 'Brake', value: 0, color: 'bg-red-500' },
                    { label: 'Speed', value: 82, color: 'bg-blue-500', suffix: '298 km/h' },
                    { label: 'DRS', value: 100, color: 'bg-emerald-500', suffix: 'Open' },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="w-14 text-[11px] text-white/30">{item.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          className={`h-full rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 1.2 + i * 0.1, ease: 'easeOut' }}
                        />
                      </div>
                      {item.suffix && (
                        <span className="w-16 text-right text-[11px] tabular-nums text-white/40">
                          {item.suffix}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tyre strategy */}
              <div className="bg-[#0c0c0e] p-4">
                <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                  Tyre Strategy
                </div>
                <div className="flex gap-1.5">
                  {[
                    { compound: 'S', laps: 18, color: 'bg-red-500', w: '31%' },
                    { compound: 'M', laps: 23, color: 'bg-amber-400', w: '40%' },
                    { compound: 'H', laps: 16, color: 'bg-white', w: '28%' },
                  ].map((stint) => (
                    <motion.div
                      key={stint.compound}
                      className="group relative overflow-hidden rounded-md"
                      style={{ width: stint.w }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 1.8 }}
                    >
                      <div
                        className={`${stint.color} ${stint.compound === 'H' ? 'text-black' : 'text-white'} px-2 py-2 text-center text-[11px] font-bold`}
                      >
                        {stint.compound}
                        <span className="ml-1 font-normal opacity-70">{stint.laps}L</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reflection/glow */}
        <div className="absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-t from-red-500/5 to-transparent blur-3xl" />
      </motion.div>
    </div>
  </section>
);

/* ─── Logo / Social Proof Bar ─── */
const LogoBar = () => (
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

/* ─── Features ─── */
const features = [
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: stagger(0.12),
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

const FeaturesSection = () => (
  <section id="features" className="relative py-24 lg:py-32">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      {/* Header */}
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
          Every module answers a racing question: who is gaining, where, why, and what happens next.
        </motion.p>
      </div>

      {/* Divider */}
      <div className="mt-12 h-px w-full bg-white/[0.06]" />

      {/* Feature rows — staggered reveal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            variants={itemVariants}
            className="group grid items-center gap-4 border-b border-white/[0.04] py-6 sm:grid-cols-[auto_1fr_1.2fr] sm:gap-8 lg:py-8"
          >
            {/* Number + accent bar */}
            <div className="flex items-center gap-4">
              <span className="text-[13px] tabular-nums text-white/15">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={`hidden h-px w-8 sm:block ${feat.accentBg} opacity-40`} />
            </div>

            {/* Title */}
            <h3
              className={`text-[18px] font-semibold tracking-[-0.01em] text-white transition-colors group-hover:${feat.accent} sm:text-[20px]`}
            >
              {feat.title}
            </h3>

            {/* Description — slides in */}
            <p className="text-[14px] leading-relaxed text-white/35 transition-colors group-hover:text-white/50">
              {feat.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Product Showcase ─── */
const ProductSection = () => (
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
            {[
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
            ].map((item) => (
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

        {/* Decision table illustration */}
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
              {[
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
              ].map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="w-20 shrink-0 text-[12px] text-white/30">{row.label}</span>
                  <span className={`w-24 shrink-0 text-[16px] font-bold tabular-nums ${row.color}`}>
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

/* ─── Stats ─── */
const StatsSection = () => (
  <section className="py-24 lg:py-32">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
        >
          The broadcast shows the result. <span className="text-white/40">We show the cause.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-[16px] leading-relaxed text-white/40"
        >
          Follow the chain from raw timing to race decisions — pace drift, sector splits,
          degradation curves and pit-loss context in one interface.
        </motion.p>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { number: '57', label: 'Laps mapped in real-time', suffix: '' },
          { number: '3', label: 'Sector-level precision', suffix: 'sectors' },
          { number: '4', label: 'Tyre compounds tracked', suffix: 'compounds' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
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

/* ─── CTA ─── */
const CTASection = () => (
  <section
    id="pricing"
    className="relative overflow-hidden border-t border-white/[0.04] py-24 lg:py-32"
  >
    {/* Gradient bg */}
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
        Start free. The core race dashboard — timing, telemetry, strategy — is available to every
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
          Get started — it's free
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

/* ─── Footer ─── */
const footerGroups = [
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
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
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

const Footer = () => (
  <footer className="border-t border-white/[0.04] bg-[#09090b] py-12">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <FastlyticsLogo size={28} />
            <span className="text-[15px] font-bold italic tracking-[-0.02em] text-white">
              FASTLYTICS
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/35">
            Formula 1 analytics — telemetry, race strategy, session replay and championship context.
          </p>
          <p className="mt-4 text-[11px] text-white/20">
            Not affiliated with Formula One World Championship Limited.
          </p>
        </div>

        {/* Link columns */}
        {footerGroups.map((group) => (
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

export { Landing };
export default Landing;

// knip-ignore
import React from 'react';
import { m } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const TESTIMONIALS = [
  {
    quote:
      'This is awesome. I\u2019m really enjoying looking through all the data and seeing how they compare.',
    source: 'r/F1Technical',
  },
  {
    quote: 'Oh good lord this is beautiful! Well done, amazing work.',
    source: 'r/F1Technical',
  },
  {
    quote: 'This is amazing, I can\u2019t wait to dive deeper into it later!',
    source: 'r/F1Technical',
  },
  {
    quote: 'Off topic but this is awesome job. I\u2019m an F1 fan and you did great job.',
    source: 'r/opensource',
  },
  {
    quote: 'The site is really clean! And awesome. This is really well thought out.',
    source: 'r/F1Technical',
  },
  {
    quote: 'It\u2019s some amazing work you\u2019ve put in.',
    source: 'r/F1Technical',
  },
];

const TIMELINE = [
  {
    date: 'March 2025',
    title: 'First commit',
    description:
      'Built during a 10-day break after mid-semester exams. The idea had been simmering for years.',
  },
  {
    date: 'April 2025',
    title: 'Went viral on Reddit',
    description:
      'One post on r/F1Technical hit 1,000+ upvotes. No paid promotion, no growth hacking. Just a tool people wanted.',
  },
  {
    date: 'May 2026',
    title: '4,000+ users',
    description:
      'Organic growth from Reddit, Twitter, and word of mouth. Added session replay, community features, and Pro subscriptions.',
  },
  {
    date: 'Ongoing',
    title: 'Open source, always',
    description:
      'AGPL-3.0 licensed. The codebase is public and contributions are welcome. Subscriptions keep the servers running.',
  },
];

const AboutUs = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="About Fastlytics"
        description="Fastlytics exists because no one else built it. An open-source F1 telemetry and race intelligence platform, grown organically to 4,000+ users."
        keywords={['motorsport analytics', 'f1 data', 'telemetry analysis', 'race intelligence']}
      />
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="pt-28 pb-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                About
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
                No one built it.
                <br />
                <span className="text-white/40">So we did.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/40">
                Formula 1 opened up its data years ago. The community built Python scripts to access
                it. But there was never a proper web platform where fans could just go and explore
                telemetry, strategy, and race data without setting up a development environment.
                Fastlytics is that platform.
              </p>
            </m.div>
          </div>
        </section>

        {/* Why */}
        <section className="py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                  The problem
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                  The data existed. The tools didn't.
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/40">
                  <p>
                    When Liberty Media acquired Formula 1, they made timing and telemetry data
                    publicly accessible. A Python library called FastF1 emerged to tap into it. But
                    using it meant writing scripts, managing environments, and interpreting raw
                    arrays.
                  </p>
                  <p>
                    For years, the only options were: run Python scripts yourself, or wait for
                    someone on Reddit to post a screenshot of a speed trace. There was no
                    persistent, visual, browsable tool for fans who wanted to go deeper than the
                    broadcast without becoming a data engineer.
                  </p>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                  The solution
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                  One URL. Every session. Every metric.
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/40">
                  <p>
                    Fastlytics processes raw F1 timing data into interactive charts, session
                    replays, driver comparisons, strategy breakdowns, and championship context — all
                    in the browser, no setup required.
                  </p>
                  <p>
                    It's the tool the community kept asking for. Telemetry overlays, tyre strategy
                    Gantt charts, sector dominance maps, gap-to-rival analysis, and full session
                    replay with synced data. Built for race weekends, used between them.
                  </p>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="border-y border-white/[0.04] py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                Timeline
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                From first commit to 4,000 users in two months
              </h2>
            </m.div>

            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06] sm:left-[11px]" />
              <div className="space-y-8">
                {TIMELINE.map((item, index) => (
                  <m.div
                    key={item.date}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-8 sm:pl-10"
                  >
                    <div className="absolute left-0 top-1.5 size-3.5 rounded-full border-2 border-red-400/60 bg-[#09090b] sm:size-[18px] sm:top-1" />
                    <div className="text-[12px] font-semibold uppercase tracking-wider text-white/25">
                      {item.date}
                    </div>
                    <h3 className="mt-1 text-[16px] font-semibold text-white">{item.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-white/40">
                      {item.description}
                    </p>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                  Open Source
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                  Free and open. Subscriptions keep the lights on.
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/40">
                  <p>
                    Fastlytics is AGPL-3.0 licensed and always will be. The entire codebase —
                    frontend, backend, data pipeline — is on GitHub. Anyone can read it, fork it,
                    contribute to it, or self-host it.
                  </p>
                  <p>
                    Pro subscriptions exist because servers, CDNs, and databases aren't free. The
                    free tier gives you full platform access for the current season. Pro unlocks
                    historical archives and unlimited session replay. That's it — no artificial
                    paywalls on core functionality.
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <a
                    href="https://github.com/Fastlytics/Fastlytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-[13px] font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    View on GitHub
                  </a>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-emerald-400" />
                    <span className="text-[13px] text-white/50">What's open</span>
                  </div>
                  <ul className="space-y-2.5 text-[13px] text-white/40">
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      Full React frontend source code
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      Python/FastAPI backend and data pipeline
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      Database schema and migrations
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      Cloudflare Worker proxy configuration
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-emerald-400">✓</span>
                      Self-hostable with your own Supabase instance
                    </li>
                  </ul>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Community Quotes */}
        <section className="border-y border-white/[0.04] py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                Community
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                What people said when they found it
              </h2>
            </m.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((item, index) => (
                <m.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5"
                >
                  <p className="text-[14px] leading-relaxed text-white/60">"{item.quote}"</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[12px] text-white/25">{item.source}</span>
                  </div>
                </m.div>
              ))}
            </div>

            <m.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center text-[12px] text-white/20"
            >
              From Reddit posts across r/F1Technical, r/opensource, and r/Btechtards
            </m.p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                See what the broadcast doesn't show
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
                Telemetry, strategy, pace, and championship context — one platform, free to start.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/dashboard"
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
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
                  href="https://github.com/Fastlytics/Fastlytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 text-[14px] font-medium text-white/80 transition-all hover:border-white/20"
                >
                  View source
                </a>
              </div>
            </m.div>

            {/* Builder credit */}
            <m.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-16 flex items-center justify-center gap-2.5"
            >
              <FastlyticsLogo size={16} />
              <span className="text-[12px] text-white/20">
                Built by{' '}
                <a
                  href="https://github.com/subhashhhhhh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/50 transition-colors"
                >
                  Subhash
                </a>
              </span>
            </m.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default AboutUs;

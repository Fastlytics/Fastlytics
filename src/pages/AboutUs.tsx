import React from 'react';
import { motion } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { Link } from 'react-router-dom';
import { Database01Icon, DashboardSpeed01Icon, Analytics01Icon } from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const features = [
  {
    icon: Database01Icon,
    title: 'Deep Data',
    description: 'Processing gigabytes of telemetry data to extract meaningful insights.',
  },
  {
    icon: DashboardSpeed01Icon,
    title: 'Real-time Speed',
    description: 'Instant access to lap times, sector performance, and race pace analysis.',
  },
  {
    icon: Analytics01Icon,
    title: 'Strategic Insights',
    description: 'Uncovering the strategy calls that win or lose races.',
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
        description="Learn how Fastlytics turns telemetry, strategy, and race data into a fast, intuitive analysis platform for fans and analysts."
        keywords={['motorsport analytics', 'f1 data', 'telemetry analysis', 'race intelligence']}
      />
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="pt-28 pb-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                About
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
                Democratizing F1 data analysis
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
                Built to bridge the gap between complex telemetry data and the passionate F1 fan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="border-y border-white/[0.04] py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                  Mission
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
                  Every fan deserves race strategist insights
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/40">
                  Most data tools are either too basic or require an engineering degree to
                  understand. We believe that every fan deserves access to the same insights as the
                  race strategists, presented in a beautiful, intuitive interface.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                  Vision
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
                  Community-driven open analytics
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/40">
                  Fastlytics is more than a tool — it's a community-driven project aiming to be the
                  ultimate open-source F1 analytics platform. We are constantly evolving, adding new
                  features, and refining our data models to provide the most accurate insights.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-white/40">
                  Join us in building the future of fan-powered analysis. Whether you're a
                  developer, a strategist, or just a passionate fan, there's a place for you here.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                Capabilities
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
                Core features
              </h2>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-3">
              {features.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 transition-colors hover:border-white/[0.1]"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <item.icon className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/40">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="border-y border-white/[0.04] py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-start gap-12 lg:grid-cols-[1fr_0.7fr] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                  Origin
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
                  The story behind Fastlytics
                </h2>
                <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/40">
                  <p>
                    I've been an F1 fan since I was 9 years old, way back in 2013. As a kid, I was
                    mesmerized by the speed, the technology, and the strategy behind each race.
                    Little did I know that this passion would eventually lead me to build
                    Fastlytics.
                  </p>
                  <p>
                    The idea for Fastlytics wasn't born overnight. Back in high school, I started
                    experimenting with F1 data using clunky Python scripts. I always wondered: "What
                    if I could build a website where anyone could easily access this data?"
                  </p>
                  <p>
                    The project really took off after my mid-semester exams. I stumbled upon a video
                    about the FastF1 API — that was the catalyst. I immediately started working on
                    Fastlytics, transforming my years-old idea into reality.
                  </p>
                  <p>
                    My goal is simple: create a platform where F1 fans can access detailed race
                    data, driver comparisons, and strategic insights without needing an engineering
                    degree.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="relative"
              >
                <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                  <img
                    src="/subhash.jpg"
                    alt="Subhash"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div>
                    <p className="text-[12px] font-medium text-white/30">Creator</p>
                    <p className="text-[15px] font-semibold text-white">Subhash</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl">
                Ready to dive deep?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
                Start exploring race data, telemetry, and strategic insights right now.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/dashboard"
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
                >
                  Launch dashboard
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
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export { AboutUs };
export default AboutUs;

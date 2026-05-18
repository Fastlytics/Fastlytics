import React from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { Mail01Icon, Location01Icon } from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const Contact = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Contact"
        description="Contact Fastlytics for product questions, support, bug reports, or partnership conversations."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Contact
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Get in touch
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
              Questions, feedback, bug reports, or just want to say hi? We typically respond within
              24 hours.
            </p>
          </m.div>

          {/* Contact Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
            <m.a
              href="mailto:contact@fastlytics.app"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="group rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 transition-colors hover:border-white/[0.1]"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-colors">
                <Mail01Icon className="size-5 text-red-400" />
              </div>
              <h2 className="text-[16px] font-semibold text-white">Email</h2>
              <p className="mt-2 text-[14px] text-white/40 group-hover:text-white/60 transition-colors">
                contact@fastlytics.app
              </p>
              <p className="mt-3 text-[12px] text-white/25">
                General questions, support, partnerships
              </p>
            </m.a>

            <m.a
              href="https://github.com/Fastlytics/Fastlytics/issues"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="group rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 transition-colors hover:border-white/[0.1]"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="text-red-400"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </div>
              <h2 className="text-[16px] font-semibold text-white">GitHub</h2>
              <p className="mt-2 text-[14px] text-white/40 group-hover:text-white/60 transition-colors">
                Fastlytics/Fastlytics
              </p>
              <p className="mt-3 text-[12px] text-white/25">
                Bug reports, feature requests, contributions
              </p>
            </m.a>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 transition-colors hover:border-white/[0.1]"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Location01Icon className="size-5 text-red-400" />
              </div>
              <h2 className="text-[16px] font-semibold text-white">Office</h2>
              <p className="mt-2 text-[14px] text-white/40">
                Venture Labs,
                <br />
                Thapar Institute, Punjab, India
              </p>
            </m.div>
          </div>

          {/* Response expectations */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-12 max-w-4xl"
          >
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">What to expect</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-[13px] font-medium text-white/60">Response time</div>
                  <div className="mt-1 text-[13px] text-white/35">
                    Within 24 hours. Faster on race weekends.
                  </div>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white/60">Bug reports</div>
                  <div className="mt-1 text-[13px] text-white/35">
                    Include the page URL, browser, and steps to reproduce.
                  </div>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white/60">Feature requests</div>
                  <div className="mt-1 text-[13px] text-white/35">
                    GitHub issues are best. Upvote existing ones to signal priority.
                  </div>
                </div>
              </div>
            </div>
          </m.div>

          {/* Quick links */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 max-w-4xl"
          >
            <p className="text-[13px] text-white/25">
              Looking for something else?{' '}
              <Link
                to="/faq"
                className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
              >
                Check the FAQ
              </Link>
              {' · '}
              <Link
                to="/pricing"
                className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
              >
                View pricing
              </Link>
              {' · '}
              <Link
                to="/refund-policy"
                className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
              >
                Refund policy
              </Link>
            </p>
          </m.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Contact;

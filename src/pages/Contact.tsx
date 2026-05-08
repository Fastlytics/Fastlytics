import React from 'react';
import { motion } from 'motion/react';
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
        description="Contact Fastlytics for product questions, support, or partnership conversations."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Contact
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Get in touch
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
              Questions about plans, features, or anything else? We're here to help.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 max-w-3xl">
            <motion.a
              href="mailto:contact@fastlytics.app"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="group rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 transition-colors hover:border-white/[0.1]"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-colors">
                <Mail01Icon className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-[16px] font-semibold text-white">Email us</h2>
              <p className="mt-2 text-[14px] text-white/40 group-hover:text-white/60 transition-colors">
                contact@fastlytics.app
              </p>
              <p className="mt-3 text-[12px] text-white/25">
                We respond within 24 hours on race weekends.
              </p>
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 transition-colors hover:border-white/[0.1]"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Location01Icon className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-[16px] font-semibold text-white">Office</h2>
              <p className="mt-2 text-[14px] text-white/40">
                Venture Labs,
                <br />
                Thapar Institute, Punjab, India
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export { Contact };
export default Contact;

import React from 'react';
import { motion } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

export function CheckoutSuccess() {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30 flex flex-col"
    >
      <SEO
        title="Payment Successful"
        description="Your Fastlytics subscription is active. Welcome to the grid."
      />
      <LandingNavbar />

      <main className="flex-grow flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M6 14l5.5 5.5L22 9"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.02em] text-white">Payment successful</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/40">
            Your subscription is active. You now have full access to all features on your plan.
            Welcome to the grid.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/account"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-6 text-[13px] font-medium text-white/70 transition-all hover:border-white/[0.15] hover:text-white"
            >
              Manage Subscription
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-white/[0.04] bg-[#09090b] py-6">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link to="/" className="flex items-center gap-2.5">
              <FastlyticsLogo size={24} />
              <span className="text-[14px] font-bold italic tracking-[-0.02em] text-white">
                FASTLYTICS
              </span>
            </Link>
            <p className="text-[12px] text-white/20">
              &copy; {new Date().getFullYear()} Fastlytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function CheckoutCancel() {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30 flex flex-col"
    >
      <SEO
        title="Payment Cancelled"
        description="Your payment was cancelled. No charges were made."
      />
      <LandingNavbar />

      <main className="flex-grow flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M8 8l12 12M20 8l-12 12"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.02em] text-white">Payment cancelled</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/40">
            No charges were made. You can try again whenever you're ready.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
            >
              Back to Pricing
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-6 text-[13px] font-medium text-white/70 transition-all hover:border-white/[0.15] hover:text-white"
            >
              Go Home
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-white/[0.04] bg-[#09090b] py-6">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link to="/" className="flex items-center gap-2.5">
              <FastlyticsLogo size={24} />
              <span className="text-[14px] font-bold italic tracking-[-0.02em] text-white">
                FASTLYTICS
              </span>
            </Link>
            <p className="text-[12px] text-white/20">
              &copy; {new Date().getFullYear()} Fastlytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

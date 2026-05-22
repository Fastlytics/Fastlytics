// knip-ignore
import React, { useState } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

interface FAQCategory {
  id: string;
  label: string;
  questions: { question: string; answer: string }[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'general',
    label: 'General',
    questions: [
      {
        question: 'What is Fastlytics?',
        answer:
          'Fastlytics is a web-based Formula 1 analytics platform that turns raw telemetry and timing data into interactive visualizations. You can explore speed traces, tyre strategies, driver comparisons, session replays, and championship context \u2014 all in the browser, no setup required.',
      },
      {
        question: 'Is Fastlytics affiliated with Formula 1?',
        answer:
          'No. Fastlytics is an independent, community-built project. It is not affiliated with, endorsed by, or associated with Formula One group companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.',
      },
      {
        question: 'Is Fastlytics open source?',
        answer:
          'Yes. The entire codebase \u2014 frontend, backend, and data pipeline \u2014 is publicly available on GitHub under the AGPL-3.0 license. You can read it, fork it, contribute to it, or self-host it.',
      },
      {
        question: 'Do I need an account to use Fastlytics?',
        answer:
          'You can browse most of the platform without an account. An account is required for community features (comments, saved charts, notifications) and for accessing gated features like session replay and driver/team profiles.',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data & Accuracy',
    questions: [
      {
        question: 'Where does the data come from?',
        answer:
          'Fastlytics uses the FastF1 Python library, which accesses publicly available Formula 1 timing data, telemetry, and session information. This is the same data source used by most community F1 analysis tools.',
      },
      {
        question: 'How often is the data updated?',
        answer:
          'Data for each session is processed and cached after the session completes. For race weekends, you can typically expect data to be available within a few hours of a session ending. Historical data for past seasons is pre-processed and always available.',
      },
      {
        question: 'Why is some data missing or unavailable?',
        answer:
          'Data availability depends on the upstream sources accessed by the FastF1 library. Occasionally, specific telemetry channels or data points may not be available for certain sessions, laps, or older seasons. If data is missing for a recent session, it usually appears within 24 hours.',
      },
      {
        question: 'Is the data real-time during live sessions?',
        answer:
          'Currently, Fastlytics processes data after sessions complete. Real-time live data during races is on the roadmap but would require integration with F1 TV Pro, which has licensing constraints.',
      },
      {
        question: 'How accurate is the telemetry data?',
        answer:
          "The data comes directly from F1's official timing system via FastF1. It's the same data used by broadcast graphics. However, telemetry is sampled at specific intervals, so there may be minor interpolation differences compared to the raw onboard data teams see.",
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    questions: [
      {
        question: 'What can I do on the Free tier?',
        answer:
          'The Free tier gives you full platform access for the current season: telemetry overlays, driver/team standings, race calendar, tyre strategy charts, pace distribution, lap analysis, head-to-head comparisons, and 5 minutes of session replay. No credit card required.',
      },
      {
        question: 'What does Pro unlock?',
        answer:
          "Pro unlocks all historical season archives (every season with available data) and unlimited session replay. That's it — no artificial paywalls on core analytics functionality.",
      },
      {
        question: 'What is session replay?',
        answer:
          'Session replay lets you watch any F1 session unfold with driver positions on the track map, synced telemetry data (speed, RPM, gear), and race control events. You can scrub through the timeline, follow specific drivers, and see the race develop lap by lap.',
      },
      {
        question: 'What are the community features?',
        answer:
          'Fastlytics includes a news feed with F1 articles, discussion threads with upvoting and comments, public user profiles, saved charts organized into folders, and notifications when news matches your favorite driver/team or someone replies to your comments.',
      },
      {
        question: 'Can I save and share charts?',
        answer:
          'Yes. You can save any chart to your personal collection, organize them into folders, and choose whether each chart or folder is public or private. Public charts appear on your profile and can be shared via URL.',
      },
      {
        question: 'What seasons of data are available?',
        answer:
          'The Free tier covers the current season. Pro subscribers get access to all historical seasons for which FastF1 has data available \u2014 generally from 2018 onwards, with varying levels of telemetry detail for older seasons.',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Account',
    questions: [
      {
        question: 'How much does Pro cost?',
        answer:
          'Pro is $5.99/month or $54.99/year (save ~23% annually). Prices are in USD. You can view current pricing and a full feature comparison at fastlytics.app/pricing.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit and debit cards, Apple Pay, and Google Pay via Dodo Payments. We do not store your full card details.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          'Yes. You can cancel your subscription at any time from your account settings. Your Pro access continues until the end of your current billing period. After that, your account reverts to the Free tier \u2014 your profile, comments, and saved charts are preserved.',
      },
      {
        question: 'Do you offer refunds?',
        answer:
          'Yes. Full refund within 7 days of purchase or renewal, no questions asked. We also offer prorated refunds for extended service outages (48+ hours). See our full refund policy at fastlytics.app/refund-policy.',
      },
      {
        question: 'Can I switch between monthly and yearly?',
        answer:
          'Yes. You can switch plans anytime from your account settings. If you switch from monthly to yearly, the change takes effect at the start of your next billing cycle.',
      },
      {
        question: 'Is there a free trial?',
        answer:
          'The Free tier itself is the trial \u2014 you get full platform access for the current season with no time limit and no credit card required. Upgrade to Pro only if you want historical data or unlimited replay.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'Technical',
    questions: [
      {
        question: 'What browsers are supported?',
        answer:
          'Fastlytics works on all modern browsers: Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience. The platform is fully responsive and works on mobile devices.',
      },
      {
        question: 'Is there a mobile app?',
        answer:
          "There's an iOS app wrapper available. The web app is also fully responsive and works well on mobile browsers — you can add it to your home screen for an app-like experience.",
      },
      {
        question: 'Can I self-host Fastlytics?',
        answer:
          "Yes. The codebase is AGPL-3.0 licensed and available on GitHub. You'll need to set up your own Supabase instance, run the Python backend for data processing, and configure the frontend. Check the repo README for setup instructions.",
      },
      {
        question: 'How can I report a bug or suggest a feature?',
        answer:
          'You can open an issue on our GitHub repository, or reach out via email at contact@fastlytics.app. We actively monitor both channels.',
      },
      {
        question: 'Is my data private and secure?',
        answer:
          "Yes. We use Supabase for authentication with encrypted credentials. Our analytics (Umami and PostHog) are self-hosted and don't share data with third-party ad networks. See our privacy policy for full details.",
      },
    ],
  },
];

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const currentCategory = FAQ_CATEGORIES.find((c) => c.id === activeCategory) || FAQ_CATEGORIES[0];

  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="FAQ"
        description="Answers to common Fastlytics questions about telemetry data, pricing, features, account management, and technical details."
        keywords={['faq', 'f1 telemetry', 'race data', 'fastlytics help', 'f1 analytics']}
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Support
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
              Everything you need to know about Fastlytics. Can't find what you're looking for?{' '}
              <Link to="/contact" className="text-red-400 hover:text-red-300 transition-colors">
                Get in touch
              </Link>
              .
            </p>
          </m.div>

          {/* Category Tabs + Content */}
          <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
            {/* Category Nav */}
            <m.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-left text-[13px] font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white/40 hover:bg-white/[0.03] hover:text-white/60'
                  }`}
                >
                  {cat.label}
                  <span className="ml-2 text-[11px] text-white/20">{cat.questions.length}</span>
                </button>
              ))}
            </m.nav>

            {/* Questions */}
            <m.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Accordion type="single" collapsible className="w-full space-y-3">
                {currentCategory.questions.map((faq, index) => (
                  <AccordionItem
                    key={`${activeCategory}-${index}`}
                    value={`item-${index}`}
                    className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] px-5 transition-colors hover:border-white/[0.1]"
                  >
                    <AccordionTrigger className="text-left text-[15px] font-medium hover:no-underline text-white/80 py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[14px] leading-relaxed text-white/40 pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </m.div>
          </div>

          {/* CTA */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center"
          >
            <h3 className="text-lg font-semibold tracking-[-0.01em] text-white">
              Still have questions?
            </h3>
            <p className="mt-2 text-[14px] text-white/40">
              We're happy to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/contact"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
              >
                Contact us
              </Link>
              <a
                href="https://github.com/Fastlytics/Fastlytics/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 text-[13px] font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                Open a GitHub issue
              </a>
            </div>
          </m.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default FAQ;

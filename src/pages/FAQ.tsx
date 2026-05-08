import React from 'react';
import { motion } from 'motion/react';
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

const faqs = [
  {
    question: 'What data sources does Fastlytics use?',
    answer:
      'Fastlytics primarily uses the FastF1 Python library, which accesses publicly available Formula 1 timing data, weather data, and session information. Data accuracy is dependent on these upstream sources.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'Historical data (results, standings, charts) is pre-processed and cached by the backend script. The backend script needs to be run periodically to update historical data for completed events.',
  },
  {
    question: 'Is Fastlytics affiliated with Formula 1?',
    answer:
      'No, Fastlytics is an independent project and is not affiliated with, endorsed by, or associated with Formula One group companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.',
  },
  {
    question: 'Why is some data missing or unavailable?',
    answer:
      'Data availability depends on the upstream sources accessed by the FastF1 library. Sometimes, specific telemetry channels or historical data points might not be available for certain sessions or years. Additionally, the backend processor script must be run successfully to generate cached data.',
  },
  {
    question: 'How can I report a bug or suggest a feature?',
    answer: "Please use the project's GitHub repository issue tracker.",
  },
  {
    question: 'How is my account data secured?',
    answer:
      'We use Supabase for authentication and database management. Passwords are hashed, and we implement security measures to protect your data. Please refer to our Privacy Policy for more details.',
  },
];

const FAQ = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="FAQ"
        description="Answers to common Fastlytics questions about telemetry data, updates, account security, accuracy, and project independence."
        keywords={['faq', 'f1 telemetry', 'race data', 'fastlytics help']}
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Support
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
              Everything you need to know about Fastlytics, our data, and how the platform works.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
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
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export { FAQ };
export default FAQ;

import React from 'react';
import { m } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;
const LAST_UPDATED = 'May 15, 2025';

const TOC_ITEMS = [
  { id: 'agreement', label: 'Agreement to Terms' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'subscriptions', label: 'Subscriptions & Payments' },
  { id: 'free-tier', label: 'Free Tier' },
  { id: 'community', label: 'Community Features' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'termination', label: 'Termination' },
  { id: 'f1-disclaimer', label: 'F1 Trademark Disclaimer' },
  { id: 'changes', label: 'Changes to Terms' },
];

const TermsOfService = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Terms of Service"
        description="Read the terms governing access to Fastlytics, paid subscriptions, community features, acceptable use, and service limitations."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/40">
              The rules governing your use of Fastlytics.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
              <div className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-[12px] text-white/40">Last updated {LAST_UPDATED}</span>
            </div>
          </m.div>

          {/* Layout: TOC + Content */}
          <div className="mt-12 grid gap-12 lg:grid-cols-[220px_1fr]">
            {/* Sticky TOC */}
            <m.aside
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="hidden lg:block"
            >
              <nav className="sticky top-24 space-y-1">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/25">
                  On this page
                </p>
                {TOC_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-md px-2.5 py-1.5 text-[13px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </m.aside>

            {/* Content */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="max-w-3xl space-y-10"
            >
              <section id="agreement">
                <h2 className="text-[18px] font-semibold text-white mb-4">1. Agreement to Terms</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    By accessing Fastlytics ("the Service"), you agree to be bound by these Terms of
                    Service. If you do not agree, you may not use the Service. These terms apply to
                    all users, including those on the Free and Pro plans.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="accounts">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  2. Account Registration
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    You must provide accurate and complete information when creating an account. You
                    are responsible for maintaining the security of your account credentials and for
                    all activities that occur under your account.
                  </p>
                  <p>
                    Your username and public profile information (avatar, bio, favorite driver/team)
                    are visible to other users. You may update or remove this information at any
                    time from your account settings.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="subscriptions">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  3. Subscriptions & Payments
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    Fastlytics offers tiered subscription plans (Free and Pro). Paid subscriptions
                    are billed in advance on a monthly or annual basis. You authorize us to charge
                    your payment method on each billing date.
                  </p>
                  <p>
                    Prices are subject to change with 30 days notice. Price changes do not affect
                    your current billing cycle. You can view current pricing at{' '}
                    <a
                      href="/pricing"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      fastlytics.app/pricing
                    </a>
                    .
                  </p>
                  <p>
                    All payments are processed by Dodo Payments. By subscribing, you agree to Dodo
                    Payments' terms and privacy policy. We do not store your full payment card
                    details.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="free-tier">
                <h2 className="text-[18px] font-semibold text-white mb-4">4. Free Tier Usage</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    The Free tier provides full platform access limited to the current Formula 1
                    season, including telemetry, standings, calendars, tyre strategy, pace
                    distribution, and race progression. Session replay is capped at 5 minutes. We
                    reserve the right to modify Free tier features at any time.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="community">
                <h2 className="text-[18px] font-semibold text-white mb-4">5. Community Features</h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    Fastlytics provides community features including news discussions, comments,
                    voting, public profiles, saved charts, and notifications. By using these
                    features, you agree to the following:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      <strong className="text-white/70">Content ownership:</strong> You retain
                      ownership of content you post (comments, profile information). By posting, you
                      grant Fastlytics a non-exclusive, worldwide license to display that content
                      within the Service.
                    </li>
                    <li>
                      <strong className="text-white/70">Public visibility:</strong> Comments, votes,
                      and charts marked as public are visible to all users and associated with your
                      username.
                    </li>
                    <li>
                      <strong className="text-white/70">Moderation:</strong> We reserve the right to
                      remove content that violates these terms or community guidelines without prior
                      notice.
                    </li>
                    <li>
                      <strong className="text-white/70">Deletion:</strong> You can delete your own
                      comments at any time. Deleted content is removed from public view immediately.
                    </li>
                  </ul>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="acceptable-use">
                <h2 className="text-[18px] font-semibold text-white mb-4">6. Acceptable Use</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p className="mb-3">You agree not to:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      Use the Service for any unlawful purpose or in violation of any regulations
                    </li>
                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>
                      Scrape, data-mine, or systematically extract data from the Service without
                      permission
                    </li>
                    <li>Resell or redistribute access to the Service</li>
                    <li>Share your account credentials with others</li>
                    <li>Post spam, harassment, hate speech, or illegal content in discussions</li>
                    <li>Impersonate other users, drivers, teams, or official F1 entities</li>
                    <li>
                      Use automated tools to vote, comment, or interact with community features
                    </li>
                  </ul>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="intellectual-property">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  7. Intellectual Property
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    The Fastlytics platform, including its code, design, branding, and user
                    interface, is owned by Fastlytics. You may not copy, modify, distribute, or
                    create derivative works without permission.
                  </p>
                  <p>
                    Race data accessed through the Service is sourced from publicly available timing
                    data via the FastF1 library. Fastlytics does not claim ownership of underlying
                    race data or telemetry. News content displayed in the news feed is aggregated
                    from external sources with attribution.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="disclaimer">
                <h2 className="text-[18px] font-semibold text-white mb-4">8. Disclaimer</h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    The Service is provided "as is" without warranties of any kind. While we strive
                    for accuracy, we do not guarantee the completeness, timeliness, or accuracy of
                    race data, telemetry, or any analysis presented.
                  </p>
                  <p>
                    Data accuracy depends on upstream sources accessed through the FastF1 library.
                    Data availability may vary by session, season, or region.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="liability">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  9. Limitation of Liability
                </h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    In no event shall Fastlytics be liable for any indirect, incidental, or
                    consequential damages arising from your use of the Service, including but not
                    limited to data loss, profit loss, or business interruption.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="termination">
                <h2 className="text-[18px] font-semibold text-white mb-4">10. Termination</h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    We reserve the right to suspend or terminate accounts that violate these terms,
                    including abuse of community features. You may cancel your subscription at any
                    time from your account settings.
                  </p>
                  <p>
                    Upon termination of a paid subscription, your access reverts to the Free tier at
                    the end of your billing period. Upon account deletion, your profile, comments,
                    saved charts, and associated data will be permanently removed.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="f1-disclaimer">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  11. F1 Trademark Disclaimer
                </h2>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-[13px] leading-relaxed text-white/25">
                  <p>
                    This website is unofficial and is not associated in any way with the Formula 1
                    companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND
                    PRIX and related marks are trade marks of Formula One Licensing B.V.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="changes">
                <h2 className="text-[18px] font-semibold text-white mb-4">12. Changes to Terms</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    We may update these terms from time to time. Material changes will be
                    communicated via email or in-app notification. Continued use after changes
                    constitutes acceptance. The "Last updated" date at the top of this page
                    indicates when these terms were last revised.
                  </p>
                </div>
              </section>
            </m.div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default TermsOfService;

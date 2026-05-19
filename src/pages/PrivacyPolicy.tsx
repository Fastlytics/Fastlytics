import React from 'react';
import { m } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;
const LAST_UPDATED = 'May 15, 2025';

const TOC_ITEMS = [
  { id: 'scope', label: 'Scope' },
  { id: 'information-collected', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Data' },
  { id: 'community-features', label: 'Community & Social Features' },
  { id: 'data-storage', label: 'Storage & Security' },
  { id: 'third-parties', label: 'Third-Party Services' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'international', label: 'International Transfers' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact' },
];

const PrivacyPolicy = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Privacy Policy"
        description="Read how Fastlytics collects, uses, stores, and protects personal data across the platform."
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/40">
              How we collect, use, and protect your personal information.
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
              <section id="scope">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  1. Introduction and Scope
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    This Privacy Policy ("Policy") governs the collection, processing, storage, and
                    disclosure of personal information by Fastlytics ("we," "us," or "our") in
                    connection with your use of our web application, community features, and
                    associated services (collectively, the "Services").
                  </p>
                  <p>
                    By accessing or using the Services — including browsing race data, participating
                    in discussions, saving charts, or creating a profile — you acknowledge that you
                    have read, understood, and agree to be bound by this Policy.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="information-collected">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  2. Information We Collect
                </h2>

                <h3 className="text-[15px] font-semibold text-white/70 mt-6 mb-3">
                  2.1 Account Information
                </h3>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>When you create an account, we collect:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Email address and authentication credentials</li>
                    <li>Username and display name</li>
                    <li>Profile information (bio, website, avatar)</li>
                    <li>Preferences (favorite driver, favorite team)</li>
                  </ul>
                </div>

                <h3 className="text-[15px] font-semibold text-white/70 mt-6 mb-3">
                  2.2 Community & User-Generated Content
                </h3>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>When you participate in community features, we collect and store:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Comments and replies posted in news discussions</li>
                    <li>Votes (upvotes/downvotes) on articles and comments</li>
                    <li>
                      Saved charts and folder organization (including public/private settings)
                    </li>
                    <li>Notification preferences and read states</li>
                  </ul>
                </div>

                <h3 className="text-[15px] font-semibold text-white/70 mt-6 mb-3">
                  2.3 Technical & Device Information
                </h3>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>We automatically collect:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Browser type, version, and configuration</li>
                    <li>Operating system and device information</li>
                    <li>IP address and approximate geographic location</li>
                    <li>Language and locale settings</li>
                  </ul>
                </div>

                <h3 className="text-[15px] font-semibold text-white/70 mt-6 mb-3">
                  2.4 Usage & Behavioral Data
                </h3>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>We collect information about how you interact with the platform:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Pages visited, features accessed, and session duration</li>
                    <li>Race data viewed, drivers compared, and charts generated</li>
                    <li>Navigation patterns and engagement metrics</li>
                    <li>Referring URLs and exit points</li>
                  </ul>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="how-we-use">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  3. How We Use Your Data
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>We process your information for the following purposes:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      <strong className="text-white/70">Service delivery:</strong> Providing race
                      analytics, telemetry data, session replay, and personalized dashboards.
                    </li>
                    <li>
                      <strong className="text-white/70">Personalization:</strong> Tailoring your
                      news feed based on your favorite driver and team preferences, and delivering
                      relevant notifications.
                    </li>
                    <li>
                      <strong className="text-white/70">Community features:</strong> Enabling
                      discussions, comments, voting, public profiles, and saved chart sharing.
                    </li>
                    <li>
                      <strong className="text-white/70">Account management:</strong> Authentication,
                      subscription billing, and account settings.
                    </li>
                    <li>
                      <strong className="text-white/70">Platform improvement:</strong> Analytics to
                      understand usage patterns and improve features.
                    </li>
                    <li>
                      <strong className="text-white/70">Security:</strong> Fraud prevention, abuse
                      detection, and protecting the integrity of community features.
                    </li>
                  </ul>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="community-features">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  4. Community & Social Features
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    Fastlytics includes community features that involve sharing information with
                    other users. Please be aware of the following:
                  </p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-[13px] font-semibold text-white/80 mb-2">
                      Public Profiles
                    </h4>
                    <p className="text-[13px] leading-relaxed text-white/35">
                      Your username, avatar, bio, favorite driver/team, and join date are visible to
                      other users. Comments you post and charts you mark as public appear on your
                      profile.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-[13px] font-semibold text-white/80 mb-2">
                      Discussions & Comments
                    </h4>
                    <p className="text-[13px] leading-relaxed text-white/35">
                      Comments posted in news discussions are public and associated with your
                      username. You can delete your own comments at any time.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-[13px] font-semibold text-white/80 mb-2">
                      Saved Charts & Folders
                    </h4>
                    <p className="text-[13px] leading-relaxed text-white/35">
                      Charts and folders you save can be set to public or private. Public charts are
                      visible on your profile. Private charts are only visible to you.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <h4 className="text-[13px] font-semibold text-white/80 mb-2">Notifications</h4>
                    <p className="text-[13px] leading-relaxed text-white/35">
                      We send notifications when news matches your favorites or when someone replies
                      to your comments. You can manage notification preferences in settings.
                    </p>
                  </div>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="data-storage">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  5. Data Storage & Security
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    Your data is stored on infrastructure operated by Supabase, Inc. All data is
                    encrypted at rest and in transit using industry-standard cryptographic
                    protocols.
                  </p>
                  <p>
                    We implement appropriate technical and organizational measures to safeguard your
                    information against unauthorized access, alteration, disclosure, or destruction.
                    However, no method of electronic transmission or storage is entirely secure.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="third-parties">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  6. Third-Party Services
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>We use the following third-party services:</p>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.06]">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-3 text-left font-semibold text-white/60">Service</th>
                        <th className="px-4 py-3 text-left font-semibold text-white/60">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/40">
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-2.5 text-white/60">Supabase</td>
                        <td className="px-4 py-2.5">Authentication, database, storage</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-2.5 text-white/60">Dodo Payments</td>
                        <td className="px-4 py-2.5">Payment processing</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-2.5 text-white/60">Sentry</td>
                        <td className="px-4 py-2.5">Error tracking and performance monitoring</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-2.5 text-white/60">Umami (self-hosted)</td>
                        <td className="px-4 py-2.5">Privacy-focused analytics</td>
                      </tr>
                      <tr className="border-b border-white/[0.04]">
                        <td className="px-4 py-2.5 text-white/60">PostHog (self-hosted)</td>
                        <td className="px-4 py-2.5">Product analytics and feature flags</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-white/60">Cloudflare</td>
                        <td className="px-4 py-2.5">CDN, DDoS protection, API proxy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-[14px] leading-relaxed text-white/40">
                  <p>
                    Our analytics services (Umami and PostHog) are self-hosted and do not transmit
                    data to third-party advertising networks or external data brokers.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="retention">
                <h2 className="text-[18px] font-semibold text-white mb-4">7. Data Retention</h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    We retain personal information only for as long as necessary to fulfill the
                    purposes for which it was collected:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      <strong className="text-white/70">Account data:</strong> Retained while your
                      account is active. Deleted upon account deletion request.
                    </li>
                    <li>
                      <strong className="text-white/70">Community content:</strong> Comments and
                      votes are retained while your account is active. Deleted comments are removed
                      immediately.
                    </li>
                    <li>
                      <strong className="text-white/70">Usage analytics:</strong> Aggregated and
                      anonymized after 90 days.
                    </li>
                    <li>
                      <strong className="text-white/70">Payment records:</strong> Retained as
                      required by applicable tax and accounting laws.
                    </li>
                  </ul>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="your-rights">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  8. Your Rights & Choices
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>Subject to applicable data protection laws, you have the following rights:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Access personal information we hold about you</li>
                    <li>Request correction of inaccurate personal data</li>
                    <li>Request deletion of your account and associated data</li>
                    <li>Object to processing based on legitimate interests</li>
                    <li>Export your data (data portability)</li>
                    <li>Withdraw consent where processing is consent-based</li>
                  </ul>
                  <p>
                    You can exercise most of these rights directly from your account settings. For
                    deletion requests or data exports, contact us at{' '}
                    <a
                      href="mailto:contact@fastlytics.app"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      contact@fastlytics.app
                    </a>
                    .
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="international">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  9. International Data Transfers
                </h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    Your personal information may be transferred to and processed in countries other
                    than your country of residence. These countries may have different data
                    protection laws. By using our Services, you consent to such transfers.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="changes">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  10. Changes to This Policy
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>
                    We may update this Policy to reflect changes in our practices or legal
                    requirements. Material changes will be communicated via email or in-app
                    notification. The "Last updated" date at the top of this page indicates when the
                    Policy was last revised.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="contact">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  11. Contact Information
                </h2>
                <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                  <p>For questions or requests regarding this Policy or your personal data:</p>
                  <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <p className="text-white/60">
                      <strong className="text-white/70">Email:</strong>{' '}
                      <a
                        href="mailto:contact@fastlytics.app"
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        contact@fastlytics.app
                      </a>
                    </p>
                  </div>
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

export default PrivacyPolicy;

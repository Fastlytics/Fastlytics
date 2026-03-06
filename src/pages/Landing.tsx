import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import LandingNavbar from '@/components/layout/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import TrackDominance from '@/components/landing/TrackDominance';
import StrategySection from '@/components/landing/StrategySection';
import TelemetrySection from '@/components/landing/TelemetrySection';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLanding } from '@/components/mobile';
import { useAuth } from '@/contexts/AuthContext';

const Landing: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show minimal loading screen while checking auth to prevent flash of landing page
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mobile Landing
  if (isMobile) {
    return (
      <>
        <SEO
          title="Fastlytics - F1 Telemetry & Data Analysis"
          description="The ultimate F1 data analysis platform. Visualize track dominance, compare telemetry, analyze race strategies, and more with Fastlytics."
          keywords={[
            'f1 analytics',
            'f1 telemetry',
            'track dominance',
            'race strategy',
            'f1 data',
            'motorsport data analysis',
          ]}
        />
        <MobileLanding />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      <SEO
        title="Fastlytics - F1 Telemetry & Data Analysis"
        description="The ultimate F1 data analysis platform. Visualize track dominance, compare telemetry, analyze race strategies, and more with Fastlytics."
        keywords={[
          'f1 analytics',
          'f1 telemetry',
          'track dominance',
          'race strategy',
          'f1 data',
          'motorsport data analysis',
        ]}
      />
      <LandingNavbar />

      <main>
        <HeroSection />

        {/* Feature Sections */}
        <div className="relative z-10 space-y-32 pb-32">
          {/* Track Dominance Feature - The "Hero" Feature */}
          <section id="features" className="relative pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-16 text-center">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
                  Track <span className="text-red-600">Dominance</span>
                </h2>
                <p className="text-xl text-gray-400 font-mono max-w-2xl mx-auto">
                  Visualize where drivers gain time. Per-lap, per-driver dominance mapping.
                </p>
              </div>
              <TrackDominance />
            </div>
          </section>

          <StrategySection />
          <TelemetrySection />
        </div>

        {/* CTA Section */}
        <section className="py-32 bg-red-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-8">
              Explore <span className="text-black">F1 Analytics</span>
            </h2>
            <p className="text-2xl text-white/90 font-mono mb-12 max-w-2xl mx-auto">
              Free access to standings, calendar, and race results. Advanced features require sign
              in.
            </p>
            <a
              href="/features"
              className="inline-block bg-black text-white text-xl font-bold uppercase tracking-widest py-6 px-12 border-4 border-white hover:bg-white hover:text-black transition-all duration-300 transform hover:-translate-y-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
            >
              Explore Features
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export { Landing };
export default Landing;

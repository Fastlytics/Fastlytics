import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/landing/HeroSection';
import {
  CTASection,
  FeaturesSection,
  LandingFooter,
  LogoBar,
  ProductSection,
  StatsSection,
} from '@/components/landing/LandingSections';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Fastlytics - Formula 1 Race Intelligence"
        description="Telemetry, tyre strategy, pace analysis, track dominance and session replay in one race desk. The analytics platform F1 fans deserve."
        keywords={[
          'formula 1 analytics',
          'f1 telemetry',
          'f1 race strategy',
          'f1 timing',
          'motorsport analytics',
        ]}
      />
      <LandingNavbar />

      <main>
        <HeroSection />
        <LogoBar />
        <FeaturesSection />
        <ProductSection />
        <StatsSection />
        <CTASection />
      </main>

      <LandingFooter />
    </div>
  );
};

export { Landing };
export default Landing;

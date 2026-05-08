import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/landing/HeroSection';
import {
  FeaturesSection,
  LandingFooter,
  LogoBar,
  ProductSection,
  StatsSection,
} from '@/components/landing/LandingSections';
import { PricingSection } from '@/components/landing/PricingSection';

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
        title="Fastlytics: advanced race intelligence"
        description="Fastlytics brings telemetry analysis, lap data, pace comparison, strategy breakdowns, and session replay into one clean race intelligence platform."
        keywords={[
          'f1 data',
          'formula 1 telemetry data',
          'f1 telemetry',
          'race telemetry',
          'lap time analysis',
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
        <PricingSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export { Landing };
export default Landing;

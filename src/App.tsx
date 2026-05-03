import * as Sentry from '@sentry/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing'; // Updated import
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Account from './pages/Account';
import AboutUs from './pages/AboutUs';
import Race from './pages/Race';
import TeamStandings from './pages/TeamStandings';
import DriverStandings from './pages/DriverStandings';
import Calendar from './pages/Calendar';
import ChampionshipProgression from './pages/ChampionshipProgression';
import TeamPaceAnalysis from './pages/TeamPaceAnalysis';
import DriverProfile from './pages/DriverProfile';
import TeamProfile from './pages/TeamProfile';

import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SessionReplayPage from './pages/SessionReplayPage';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import LandingFooter from './components/layout/LandingFooter';
import { SeasonProvider } from './contexts/SeasonContext';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from '@/components/layout/ScrollToTop';
import RouteTracker from '@/components/layout/RouteTracker';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { GatedRoute } from '@/components/common/GatedRoute';
import { useIsMobile } from '@/hooks/use-mobile';
import ConsentBanner from '@/components/auth/ConsentBanner';

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

const queryClient = new QueryClient();

// Layout component to add footer to pages
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen flex flex-col">
      {children}
      {!isMobile && <LandingFooter />}
    </div>
  );
};

// Landing layout — the new Landing page includes its own footer.
const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-h-screen flex flex-col">{children}</div>;
};

// Dashboard layout without footer
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">{children}</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <ConsentBanner />
      <SeasonProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <RouteTracker />
            <RouteTracker />
            <SentryRoutes>
              {/* Landing Page Route (with LandingFooter) */}
              <Route
                path="/"
                element={
                  <LandingLayout>
                    <Landing />
                  </LandingLayout>
                }
              />
              <Route
                path="/about"
                element={
                  <MainLayout>
                    <AboutUs />
                  </MainLayout>
                }
              />

              {/* Public Info Pages */}
              <Route
                path="/privacy-policy"
                element={
                  <MainLayout>
                    <PrivacyPolicy />
                  </MainLayout>
                }
              />
              <Route
                path="/terms-of-service"
                element={
                  <MainLayout>
                    <TermsOfService />
                  </MainLayout>
                }
              />
              <Route
                path="/faq"
                element={
                  <MainLayout>
                    <FAQ />
                  </MainLayout>
                }
              />
              <Route
                path="/refund-policy"
                element={
                  <MainLayout>
                    <RefundPolicy />
                  </MainLayout>
                }
              />
              <Route
                path="/contact"
                element={
                  <MainLayout>
                    <Contact />
                  </MainLayout>
                }
              />

              {/* Auth route - public */}
              <Route path="/auth" element={<Auth />} />

              {/* Partially Public Routes - accessible to all, gated features show login prompt */}
              <Route
                path="/dashboard"
                element={
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                }
              />
              <Route
                path="/race/:raceId"
                element={
                  <DashboardLayout>
                    <Race />
                  </DashboardLayout>
                }
              />
              <Route
                path="/calendar"
                element={
                  <DashboardLayout>
                    <Calendar />
                  </DashboardLayout>
                }
              />
              <Route
                path="/standings/teams"
                element={
                  <DashboardLayout>
                    <TeamStandings />
                  </DashboardLayout>
                }
              />
              <Route
                path="/standings/drivers"
                element={
                  <DashboardLayout>
                    <DriverStandings />
                  </DashboardLayout>
                }
              />
              <Route
                path="/standings/progression"
                element={
                  <DashboardLayout>
                    <GatedRoute
                      featureName="Championship Progression"
                      description="Track how driver standings evolved throughout the season with interactive charts and race-by-race point progression."
                    >
                      <ChampionshipProgression />
                    </GatedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/team-pace"
                element={
                  <DashboardLayout>
                    <GatedRoute
                      featureName="Team Pace Analysis"
                      description="Analyze team performance across race weekends with detailed pace comparisons, gap analysis, and consistency metrics."
                    >
                      <TeamPaceAnalysis />
                    </GatedRoute>
                  </DashboardLayout>
                }
              />

              {/* Fully Protected Routes - require login */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route
                  path="/account"
                  element={
                    <DashboardLayout>
                      <Account />
                    </DashboardLayout>
                  }
                />
              </Route>

              {/* Fully Gated Routes - show login page for unauthenticated users */}
              <Route
                path="/replay/:year/:event/:session"
                element={
                  <DashboardLayout>
                    <SessionReplayPage />
                  </DashboardLayout>
                }
              />

              {/* Bio Pages */}
              <Route
                path="/drivers/:slug"
                element={
                  <DashboardLayout>
                    <DriverProfile />
                  </DashboardLayout>
                }
              />
              <Route
                path="/teams/:slug"
                element={
                  <DashboardLayout>
                    <TeamProfile />
                  </DashboardLayout>
                }
              />

              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </SentryRoutes>
          </BrowserRouter>
        </AuthProvider>
      </SeasonProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

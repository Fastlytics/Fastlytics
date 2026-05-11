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
import CompareDrivers from './pages/CompareDrivers';
import CompareTeams from './pages/CompareTeams';

import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SessionReplayPage from './pages/SessionReplayPage';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import PressKit from './pages/PressKit';
import Pricing from './pages/Pricing';
import IsolatedLogo from './pages/IsolatedLogo';
import { SeasonProvider } from './contexts/SeasonContext';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from '@/components/layout/ScrollToTop';
import RouteTracker from '@/components/layout/RouteTracker';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { GatedRoute } from '@/components/common/GatedRoute';
import ConsentBanner from '@/components/auth/ConsentBanner';

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

const queryClient = new QueryClient();

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
                  <LandingLayout>
                    <AboutUs />
                  </LandingLayout>
                }
              />

              {/* Pricing Page */}
              <Route
                path="/pricing"
                element={
                  <LandingLayout>
                    <Pricing />
                  </LandingLayout>
                }
              />

              {/* Public Info Pages */}
              <Route
                path="/privacy-policy"
                element={
                  <LandingLayout>
                    <PrivacyPolicy />
                  </LandingLayout>
                }
              />
              <Route
                path="/terms-of-service"
                element={
                  <LandingLayout>
                    <TermsOfService />
                  </LandingLayout>
                }
              />
              <Route
                path="/faq"
                element={
                  <LandingLayout>
                    <FAQ />
                  </LandingLayout>
                }
              />
              <Route
                path="/refund-policy"
                element={
                  <LandingLayout>
                    <RefundPolicy />
                  </LandingLayout>
                }
              />
              <Route
                path="/contact"
                element={
                  <LandingLayout>
                    <Contact />
                  </LandingLayout>
                }
              />
              <Route
                path="/press-kit"
                element={
                  <LandingLayout>
                    <PressKit />
                  </LandingLayout>
                }
              />

              {/* Isolated Logo Route purely for screenshot automation via Playwright */}
              <Route path="/logo-isolated" element={<IsolatedLogo />} />

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

              {/* Comparison Pages - public */}
              <Route
                path="/compare/drivers"
                element={
                  <DashboardLayout>
                    <CompareDrivers />
                  </DashboardLayout>
                }
              />
              <Route
                path="/compare/teams"
                element={
                  <DashboardLayout>
                    <CompareTeams />
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
                    <GatedRoute
                      featureName="Session Replay"
                      description="Relive every lap with full driver positions, telemetry sync, and race control events."
                    >
                      <SessionReplayPage />
                    </GatedRoute>
                  </DashboardLayout>
                }
              />

              {/* Bio Pages */}
              <Route
                path="/drivers/:slug"
                element={
                  <DashboardLayout>
                    <GatedRoute
                      featureName="Driver Profile"
                      description="Explore career stats, season history, and detailed performance data for every driver."
                    >
                      <DriverProfile />
                    </GatedRoute>
                  </DashboardLayout>
                }
              />
              <Route
                path="/teams/:slug"
                element={
                  <DashboardLayout>
                    <GatedRoute
                      featureName="Team Profile"
                      description="Dive into team history, constructor stats, and season-by-season performance."
                    >
                      <TeamProfile />
                    </GatedRoute>
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

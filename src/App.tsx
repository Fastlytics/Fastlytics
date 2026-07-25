import { lazy, Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from '@/components/layout/PageLoader';
import { SeasonProvider } from './contexts/SeasonContext';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from '@/components/layout/ScrollToTop';
import RouteTracker from '@/components/layout/RouteTracker';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { GatedRoute } from '@/components/common/GatedRoute';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import ConsentBanner from '@/components/auth/ConsentBanner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MobileGate } from '@/components/mobile/MobileGate';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Landing = lazy(() => import('./pages/Landing'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Race = lazy(() => import('./pages/Race'));
const RaceIndex = lazy(() => import('./pages/Race/RaceIndex'));
const OverviewSection = lazy(() => import('./pages/Race/sections/OverviewSection'));
const ReplaySection = lazy(() => import('./pages/Race/sections/ReplaySection'));
const StrategySection = lazy(() => import('./pages/Race/sections/StrategySection'));
const LapAnalysisSection = lazy(() => import('./pages/Race/sections/LapAnalysisSection'));
const HeadToHeadSection = lazy(() => import('./pages/Race/sections/HeadToHeadSection'));
const TelemetrySection = lazy(() => import('./pages/Race/sections/TelemetrySection'));
const TeamPaceRedirect = lazy(() => import('./pages/Race/sections/TeamPaceRedirect'));
const RaceSectionFallback = lazy(() => import('./pages/Race/RaceSectionFallback'));
const TeamStandings = lazy(() => import('./pages/TeamStandings'));
const DriverStandings = lazy(() => import('./pages/DriverStandings'));
const Calendar = lazy(() => import('./pages/Calendar'));
const ChampionshipProgression = lazy(() => import('./pages/ChampionshipProgression'));
const TeamPaceAnalysis = lazy(() => import('./pages/TeamPaceAnalysis'));
const DriverProfile = lazy(() => import('./pages/DriverProfile'));
const TeamProfile = lazy(() => import('./pages/TeamProfile'));
const CompareDrivers = lazy(() => import('./pages/CompareDrivers'));
const CompareTeams = lazy(() => import('./pages/CompareTeams'));
const Drivers = lazy(() => import('./pages/Drivers'));
const DriverLeaderboard = lazy(() => import('./pages/DriverLeaderboard'));
const Teams = lazy(() => import('./pages/Teams'));
const TeamLeaderboard = lazy(() => import('./pages/TeamLeaderboard'));
const PitstopLeaderboard = lazy(() => import('./pages/PitstopLeaderboard'));
const Saved = lazy(() => import('./pages/Saved'));
const News = lazy(() => import('./pages/News'));
const NewsDiscussion = lazy(() => import('./pages/NewsDiscussion'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const SessionReplayPage = lazy(() => import('./pages/SessionReplayPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const FAQ = lazy(() => import('./pages/FAQ'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const Contact = lazy(() => import('./pages/Contact'));
const PressKit = lazy(() => import('./pages/PressKit'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Features = lazy(() => import('./pages/Features'));
const MCPServer = lazy(() => import('./pages/MCPServer'));
const IsolatedLogo = lazy(() => import('./pages/IsolatedLogo'));
const TeamPaceGapExport = lazy(() => import('./pages/export/TeamPaceGapExport'));

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
});

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-h-screen flex flex-col">{children}</div>;
};

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const App = () => (
  <AppErrorBoundary>
    <MobileGate>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ConsentBanner />
          <SeasonProvider>
            <AuthProvider>
              <BrowserRouter>
                <ScrollToTop />
                <RouteTracker />
                <SentryRoutes>
                  <Route
                    path="/"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <Landing />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <AboutUs />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/pricing"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <Pricing />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/features"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <Features />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/mcp"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <MCPServer />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/privacy-policy"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <PrivacyPolicy />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/terms-of-service"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <TermsOfService />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/faq"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <FAQ />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/refund-policy"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <RefundPolicy />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <Contact />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/press-kit"
                    element={
                      <LandingLayout>
                        <Lazy>
                          <PressKit />
                        </Lazy>
                      </LandingLayout>
                    }
                  />
                  <Route
                    path="/logo-isolated"
                    element={
                      <Lazy>
                        <IsolatedLogo />
                      </Lazy>
                    }
                  />
                  <Route
                    path="/export/team-pace-gap"
                    element={
                      <Lazy>
                        <TeamPaceGapExport />
                      </Lazy>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <Lazy>
                        <SignUp />
                      </Lazy>
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <Lazy>
                        <Login />
                      </Lazy>
                    }
                  />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Dashboard />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/race/:raceId"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Race />
                        </Lazy>
                      </DashboardLayout>
                    }
                  >
                    <Route
                      index
                      element={
                        <Lazy>
                          <RaceIndex />
                        </Lazy>
                      }
                    />
                    <Route
                      path="overview"
                      element={
                        <Lazy>
                          <OverviewSection />
                        </Lazy>
                      }
                    />
                    <Route
                      path="replay"
                      element={
                        <Lazy>
                          <ReplaySection />
                        </Lazy>
                      }
                    />
                    <Route
                      path="strategy"
                      element={
                        <Lazy>
                          <StrategySection />
                        </Lazy>
                      }
                    />
                    <Route
                      path="lap-analysis"
                      element={
                        <Lazy>
                          <LapAnalysisSection />
                        </Lazy>
                      }
                    />
                    <Route
                      path="head-to-head"
                      element={
                        <Lazy>
                          <HeadToHeadSection />
                        </Lazy>
                      }
                    />
                    <Route
                      path="telemetry"
                      element={
                        <Lazy>
                          <TelemetrySection />
                        </Lazy>
                      }
                    />
                    <Route
                      path="team-pace"
                      element={
                        <Lazy>
                          <TeamPaceRedirect />
                        </Lazy>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <Lazy>
                          <RaceSectionFallback />
                        </Lazy>
                      }
                    />
                  </Route>
                  <Route
                    path="/calendar"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Calendar />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/standings/teams"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <TeamStandings />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/standings/drivers"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <DriverStandings />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/standings/progression"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <ChampionshipProgression />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/team-pace"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <TeamPaceAnalysis />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/compare/drivers"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <CompareDrivers />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/compare/teams"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <CompareTeams />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/onboarding"
                      element={
                        <Lazy>
                          <Onboarding />
                        </Lazy>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <DashboardLayout>
                          <Lazy>
                            <Settings />
                          </Lazy>
                        </DashboardLayout>
                      }
                    />
                  </Route>
                  <Route
                    path="/replay/:year/:event/:session"
                    element={
                      <DashboardLayout>
                        <GatedRoute
                          featureName="Session Replay"
                          description="Relive every lap with full driver positions, telemetry sync, and race control events."
                        >
                          <Lazy>
                            <SessionReplayPage />
                          </Lazy>
                        </GatedRoute>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/drivers"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Drivers />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/drivers/leaderboard/:stat"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <DriverLeaderboard />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/teams"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Teams />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/teams/leaderboard/:stat"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <TeamLeaderboard />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/leaderboard/pitstops"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <PitstopLeaderboard />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/saved"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Saved />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/profile/:username"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Profile />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/news"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <News />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/news/:articleId"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <NewsDiscussion />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <DashboardLayout>
                        <Lazy>
                          <Notifications />
                        </Lazy>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/drivers/:slug"
                    element={
                      <DashboardLayout>
                        <GatedRoute
                          featureName="Driver Profile"
                          description="Explore career stats, season history, and detailed performance data for every driver."
                        >
                          <Lazy>
                            <DriverProfile />
                          </Lazy>
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
                          <Lazy>
                            <TeamProfile />
                          </Lazy>
                        </GatedRoute>
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <Lazy>
                        <NotFound />
                      </Lazy>
                    }
                  />
                </SentryRoutes>
              </BrowserRouter>
            </AuthProvider>
          </SeasonProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </MobileGate>
  </AppErrorBoundary>
);

export default App;

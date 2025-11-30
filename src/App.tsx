import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing"; // Updated import
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import AboutUs from "./pages/AboutUs";
import Race from "./pages/Race";
import TeamStandings from "./pages/TeamStandings";
import DriverStandings from "./pages/DriverStandings";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import FAQ from "./pages/FAQ";
import LandingFooter from "./components/LandingFooter";
import { SeasonProvider } from "./contexts/SeasonContext";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

// Layout component to add footer to pages
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    {children}
    <LandingFooter />
  </div>
);

// Landing layout with custom footer
const LandingLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    {children}
    <LandingFooter />
  </div>
);

// Dashboard layout without footer
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SeasonProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Landing Page Route (with LandingFooter) */}
              <Route path="/" element={<LandingLayout><Landing /></LandingLayout>} />
              <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />

              {/* Public Info Pages */}
              <Route path="/privacy-policy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
              <Route path="/terms-of-service" element={<MainLayout><TermsOfService /></MainLayout>} />
              <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />

              {/* All routes are now public */}
              <Route path="/auth" element={<Auth />} />
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
                <Route path="/account" element={<DashboardLayout><Account /></DashboardLayout>} />
              </Route>
              <Route path="/race/:raceId" element={<DashboardLayout><Race /></DashboardLayout>} />
              <Route path="/calendar" element={<DashboardLayout><Calendar /></DashboardLayout>} />
              <Route path="/standings/teams" element={<DashboardLayout><TeamStandings /></DashboardLayout>} />
              <Route path="/standings/drivers" element={<DashboardLayout><DriverStandings /></DashboardLayout>} />

              {/* 404 page */}
              <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SeasonProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

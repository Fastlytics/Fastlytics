import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing"; // Updated import
import Race from "./pages/Race";
import TeamStandings from "./pages/TeamStandings";
import DriverStandings from "./pages/DriverStandings";
import Races from "./pages/Races";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import FAQ from "./pages/FAQ";
import Footer from "./components/Footer";
import LandingFooter from "./components/LandingFooter";
import { SeasonProvider } from "./contexts/SeasonContext";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

// Layout component to add footer to pages
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    {children}
    <Footer />
  </div>
);

// Landing layout with custom footer
const LandingLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    {children}
    <LandingFooter />
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

              {/* Public Info Pages */}
              <Route path="/privacy-policy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
              <Route path="/terms-of-service" element={<MainLayout><TermsOfService /></MainLayout>} />
              <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />

              {/* All routes are now public */}
              <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
              <Route path="/race/:raceId" element={<MainLayout><Race /></MainLayout>} />
              <Route path="/races" element={<MainLayout><Races /></MainLayout>} />
              <Route path="/standings/teams" element={<MainLayout><TeamStandings /></MainLayout>} />
              <Route path="/standings/drivers" element={<MainLayout><DriverStandings /></MainLayout>} />

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

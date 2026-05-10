// knip-ignore
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api';
import { CheckmarkCircle01Icon, ArrowRight01Icon, ArrowLeft01Icon } from 'hugeicons-react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { SEO } from '@/components/layout/SEO';

import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { trackEvent, trackSelection } = useAnalytics();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);

  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Fetch data on mount — resolve season year based on data availability
  useEffect(() => {
    const loadData = async () => {
      try {
        const year = await resolveSeasonYear(fetchDriverStandings);
        const [driversData, teamsData] = await Promise.all([
          fetchDriverStandings(year),
          fetchTeamStandings(year),
        ]);
        setDrivers(driversData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading onboarding data:', error);
        toast.error('Failed to load F1 data. Please try again.');
      }
    };
    loadData();
  }, []);

  const getDriverImageForYear = (driverCode: string) =>
    getDriverImage(driverCode, getCurrentSeasonYear());

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          favorite_driver: selectedDriver,
          favorite_team: selectedTeam,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      trackEvent('onboarding_completed', {
        favorite_driver: selectedDriver,
        favorite_team: selectedTeam,
      });

      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      toast.error((error as Error).message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <SEO
        title="Welcome"
        description="Set up your Fastlytics profile with favorite drivers and teams for a personalized race desk."
        noIndex
      />
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] size-[50%] bg-red-600/20 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] size-[40%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl z-10">
        {/* Progress Bar */}
        <div className="mb-12 max-w-md mx-auto">
          <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <span className={step >= 1 ? 'text-white' : ''}>Welcome</span>
            <span className={step >= 2 ? 'text-white' : ''}>Driver</span>
            <span className={step >= 3 ? 'text-white' : ''}>Team</span>
            <span className={step >= 4 ? 'text-white' : ''}>Socials</span>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <m.div
              className="h-full bg-red-600"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <m.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-semibold uppercase italic tracking-tighter">
                  Welcome to <span className="text-red-600">Fastlytics</span>
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                  Let's personalize your experience. Tell us who you support, and we'll tailor your
                  dashboard to follow them closely.
                </p>
              </div>
              <Button
                onClick={handleNext}
                className="h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider rounded-none"
              >
                Get Started <ArrowRight01Icon className="ml-2 size-5" />
              </Button>
            </m.div>
          )}

          {step === 2 && (
            <m.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
                  Select Favorite Driver
                </h2>
                <p className="text-zinc-400">Who are you rooting for this season?</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {drivers.map((driver) => (
                  <button
                    key={driver.code}
                    onClick={() => {
                      setSelectedDriver(driver.code);
                      trackSelection('onboarding_driver', driver.code);
                    }}
                    className={`
                                            relative p-4 border-2 transition-all duration-200 text-left group flex flex-col items-center text-center
                                            ${
                                              selectedDriver === driver.code
                                                ? 'border-red-600 bg-red-600/10'
                                                : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900'
                                            }
                                        `}
                  >
                    <Avatar className="size-24 mb-4 border-2 border-zinc-800">
                      <AvatarImage
                        src={getDriverImageForYear(driver.code)}
                        className="object-cover object-top bg-zinc-800"
                      />
                      <AvatarFallback>{driver.name}</AvatarFallback>
                    </Avatar>

                    <div className="text-xs font-mono text-zinc-500 mb-1 uppercase text-center">
                      {driver.team}
                    </div>
                    <div className="text-sm font-black uppercase italic leading-none mb-1 truncate w-full text-center">
                      {driver.name}
                    </div>

                    {selectedDriver === driver.code && (
                      <div className="absolute top-2 right-2 text-red-600">
                        <CheckmarkCircle01Icon className="size-5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 max-w-4xl mx-auto w-full">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white"
                >
                  <ArrowLeft01Icon className="mr-2 size-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedDriver}
                  className="bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider rounded-none disabled:opacity-50"
                >
                  Next Step <ArrowRight01Icon className="ml-2 size-4" />
                </Button>
              </div>
            </m.div>
          )}

          {step === 3 && (
            <m.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
                  Select Favorite Team
                </h2>
                <p className="text-zinc-400">Which constructor has your allegiance?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {teams.map((team) => (
                  <button
                    key={team.team}
                    onClick={() => {
                      setSelectedTeam(team.team);
                      trackSelection('onboarding_team', team.team);
                    }}
                    className={`
                                            relative p-6 border-2 transition-all duration-200 text-left group flex items-center gap-6
                                            ${
                                              selectedTeam === team.team
                                                ? 'border-red-600 bg-red-600/10'
                                                : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900'
                                            }
                                        `}
                  >
                    <div className="size-16 flex-shrink-0 bg-white/5 rounded-lg p-2 flex items-center justify-center">
                      <img
                        src={getTeamLogo(team.team) || ''}
                        alt={team.team}
                        className="size-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xl font-black uppercase italic leading-none mb-2">
                        {team.team}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
                        <span>{team.points} PTS</span>
                        <span>•</span>
                        <span>{team.wins} WINS</span>
                      </div>
                    </div>

                    {selectedTeam === team.team && (
                      <div className="absolute top-4 right-4 text-red-600">
                        <CheckmarkCircle01Icon className="size-6" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 max-w-4xl mx-auto w-full">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white"
                >
                  <ArrowLeft01Icon className="mr-2 size-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedTeam}
                  className="bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider rounded-none disabled:opacity-50"
                >
                  Next Step <ArrowRight01Icon className="ml-2 size-4" />
                </Button>
              </div>
            </m.div>
          )}

          {step === 4 && (
            <m.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
                  Stay Updated
                </h2>
                <p className="text-zinc-400">Follow us on social media for the latest updates.</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-6 py-12">
                <a
                  href="https://twitter.com/fastlytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-6 border-2 border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-white transition-all w-full max-w-md group"
                >
                  <div className="size-12 bg-zinc-950 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                    <FontAwesomeIcon icon={faXTwitter} className="size-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-black uppercase italic">X (Twitter)</div>
                    <div className="text-zinc-500 text-sm">@fastlytics</div>
                  </div>
                  <ArrowRight01Icon className="size-6 text-zinc-500 group-hover:text-white" />
                </a>

                <a
                  href="https://instagram.com/fastlytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-6 border-2 border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-white transition-all w-full max-w-md group"
                >
                  <div className="size-12 bg-zinc-950 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                    <FontAwesomeIcon icon={faInstagram} className="size-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-black uppercase italic">Instagram</div>
                    <div className="text-zinc-500 text-sm">@fastlytics</div>
                  </div>
                  <ArrowRight01Icon className="size-6 text-zinc-500 group-hover:text-white" />
                </a>
              </div>

              <div className="flex justify-between pt-4 max-w-4xl mx-auto w-full">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white"
                >
                  <ArrowLeft01Icon className="mr-2 size-4" /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-wider rounded-none disabled:opacity-50 min-w-[140px]"
                >
                  {isLoading ? 'Saving...' : 'Finish Setup'}
                </Button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;

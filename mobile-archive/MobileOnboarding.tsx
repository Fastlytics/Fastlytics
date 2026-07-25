import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api';
import {
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Tick02Icon,
  StarIcon,
} from 'hugeicons-react';
import { Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';

const MobileOnboarding: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

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
        toast.error('Failed to load F1 data');
      }
    };
    loadData();
  }, []);

  const getDriverImg = (driverCode: string) => getDriverImage(driverCode, getCurrentSeasonYear());

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

      toast.success('Welcome to Fastlytics!');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      toast.error((error as Error).message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 4; // Reduced from 5

  return (
    <div className="h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
      {/* Background Gradient - REMOVED for Cyber Brutalist */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[50%] bg-red-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] -right-[20%] w-[60%] h-[40%] bg-red-600/10 blur-[100px] rounded-full" />
            </div> */}

      {/* Progress Bars */}
      <div className="relative z-10 pt-12 pb-6 px-4">
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1 transition-all duration-300',
                step === i ? 'w-12 bg-red-600' : 'w-4 bg-zinc-800'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center px-6 text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 flex flex-col items-center"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Gauge className="h-10 w-10 text-red-600" />
                  <span className="text-4xl font-black tracking-tighter uppercase italic text-white">
                    Fast<span className="text-red-600">lytics</span>
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 mb-12"
              >
                <h2 className="text-2xl font-black uppercase tracking-tight">Welcome aboard!</h2>
                <p className="text-gray-400 text-sm font-mono uppercase max-w-xs">
                  Let's personalize your F1 experience. Pick your favorites to get started.
                </p>
              </motion.div>

              {/* Features Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 w-full max-w-xs mb-8"
              >
                {['Telemetry & timing', 'Driver & team standings', 'Race calendar & results'].map(
                  (feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-left bg-black border-2 border-white/10 p-3"
                    >
                      <div className="w-8 h-8 bg-red-600/20 flex items-center justify-center border border-red-600/30">
                        <StarIcon className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-sm text-gray-300 font-bold uppercase">{feature}</span>
                    </div>
                  )
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Select Driver */}
          {step === 1 && (
            <motion.div
              key="driver"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full flex flex-col px-4"
            >
              <div className="text-center py-4">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                  Pick Your Driver
                </h2>
                <p className="text-sm text-gray-500">Who do you cheer for?</p>
              </div>

              {/* Drivers Grid */}
              <div className="flex-1 overflow-y-auto pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {drivers.map((driver) => {
                    const isSelected = selectedDriver === driver.code;
                    const driverImg = getDriverImg(driver.code);

                    return (
                      <motion.button
                        key={driver.code}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDriver(driver.code)}
                        className={cn(
                          'relative overflow-hidden border-2 transition-all',
                          isSelected
                            ? 'border-red-600 bg-red-600/10'
                            : 'border-white/10 bg-black hover:border-white/30'
                        )}
                      >
                        {/* Driver Image */}
                        <div className="aspect-[4/3] relative overflow-hidden bg-zinc-900">
                          {driverImg ? (
                            <img
                              src={driverImg}
                              alt={driver.name}
                              className={cn('w-full h-full', 'object-cover object-top')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl font-black text-gray-600">
                                {driver.code}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          {/* Selection Check */}
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-6 h-6 bg-red-600 flex items-center justify-center">
                              <Tick02Icon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Driver Info */}
                        <div className="p-3 text-left">
                          <div className="font-black text-sm uppercase truncate">{driver.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono uppercase truncate">
                            {driver.team}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Team */}
          {step === 2 && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full flex flex-col px-4"
            >
              <div className="text-center py-4">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                  Pick Your Team
                </h2>
                <p className="text-sm text-gray-500">Which constructor?</p>
              </div>

              {/* Teams List */}
              <div className="flex-1 overflow-y-auto pb-4 space-y-3">
                {teams.map((team) => {
                  const isSelected = selectedTeam === team.team;
                  const logo = getTeamLogo(team.team);

                  return (
                    <motion.button
                      key={team.team}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTeam(team.team)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 border-2 transition-all',
                        isSelected
                          ? 'border-red-600 bg-red-600/10'
                          : 'border-white/10 bg-black hover:border-white/30'
                      )}
                    >
                      {/* Team Logo */}
                      <div className="w-14 h-14 bg-white/10 p-2 flex items-center justify-center flex-shrink-0">
                        {logo ? (
                          <img
                            src={logo}
                            alt={team.team}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-lg font-black text-gray-500">
                            {team.team.substring(0, 2)}
                          </div>
                        )}
                      </div>

                      {/* Team Info */}
                      <div className="flex-1 text-left">
                        <div className="font-black text-base uppercase">{team.team}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {team.points} PTS • {team.wins} WINS
                        </div>
                      </div>

                      {/* Selection Check */}
                      {isSelected && (
                        <div className="w-6 h-6 bg-red-600 flex items-center justify-center flex-shrink-0">
                          <Tick02Icon className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Social Media (Was Step 4) */}
          {step === 3 && (
            <motion.div
              key="socials"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full flex flex-col px-4"
            >
              <div className="text-center py-4">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                  Stay Updated
                </h2>
                <p className="text-sm text-gray-500">Follow us on social media</p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-12">
                <a
                  href="https://twitter.com/fastlytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-4 p-4 border-2 border-white/10 bg-black hover:bg-white/5 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faXTwitter} className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-lg uppercase italic">X (Twitter)</div>
                    <div className="text-xs text-gray-500 font-mono">@fastlytics</div>
                  </div>
                  <ArrowRight01Icon className="w-5 h-5 text-gray-500" />
                </a>

                <a
                  href="https://instagram.com/fastlytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-4 p-4 border-2 border-white/10 bg-black hover:bg-white/5 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faInstagram} className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-lg uppercase italic">Instagram</div>
                    <div className="text-xs text-gray-500 font-mono">@fastlytics</div>
                  </div>
                  <ArrowRight01Icon className="w-5 h-5 text-gray-500" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-10 p-4 pb-8 space-y-3 bg-black border-t-2 border-white/10">
        {/* Primary Action */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (step === 3) {
              handleComplete();
            } else {
              setStep(step + 1);
            }
          }}
          disabled={(step === 1 && !selectedDriver) || (step === 2 && !selectedTeam) || isLoading}
          className={cn(
            'w-full py-4 font-black uppercase tracking-wider text-center transition-all border-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            step === 3
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-white text-black border-white hover:bg-gray-200'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {step === 0 && (
              <>
                <span>Get Started</span>
                <ArrowRight01Icon className="w-5 h-5" />
              </>
            )}
            {(step === 1 || step === 2) && (
              <>
                <span>Continue</span>
                <ArrowRight01Icon className="w-5 h-5" />
              </>
            )}
            {step === 3 && <span>{isLoading ? 'Setting up...' : 'Finish Setup'}</span>}
          </div>
        </motion.button>

        {/* Back Button */}
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-3 text-gray-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:text-white transition-colors"
          >
            <ArrowLeft01Icon className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        {/* Skip on Welcome */}
        {step === 0 && (
          <button
            onClick={() => {
              // Skip directly to dashboard without setting favorites
              navigate('/dashboard');
            }}
            className="w-full py-3 text-gray-600 text-xs font-mono uppercase tracking-widest hover:text-white transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export { MobileOnboarding };
export default MobileOnboarding;

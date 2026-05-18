import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchDriverStandings, fetchTeamStandings } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SEO } from '@/components/layout/SEO';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { OnboardingProgress, OnboardingStepContent } from './Onboarding/OnboardingSteps';
import { OnboardingIllustration } from './Onboarding/OnboardingIllustrations';
import { Confetti } from './Onboarding/Confetti';
import { initialOnboardingState, onboardingReducer } from './Onboarding/onboardingState';

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { trackEvent, trackSelection } = useAnalytics();
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  const [showConfetti, setShowConfetti] = useState(false);

  // Redirect to dashboard if onboarding is already done
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const year = await resolveSeasonYear(fetchDriverStandings);
        const [drivers, teams] = await Promise.all([
          fetchDriverStandings(year),
          fetchTeamStandings(year),
        ]);

        dispatch({ type: 'setF1Data', drivers, teams });
      } catch (error) {
        console.error('Error loading onboarding data:', error);
        toast.error('Failed to load F1 data. Please try again.');
      }
    };

    loadData();
  }, []);

  if (state.step === 7 && !showConfetti) {
    setShowConfetti(true);
  }

  const getDriverImageForYear = (driverCode: string) =>
    getDriverImage(driverCode, getCurrentSeasonYear());

  const handleComplete = async () => {
    if (!user) return;

    dispatch({ type: 'setIsLoading', value: true });
    try {
      const fullName = [state.firstName, state.lastName].filter(Boolean).join(' ');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || undefined,
          first_name: state.firstName || undefined,
          last_name: state.lastName || undefined,
          username: state.username || undefined,
          favorite_driver: state.selectedDriver,
          favorite_team: state.selectedTeam,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      if (fullName) {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      }

      await refreshProfile();
      trackEvent('onboarding_completed', {
        intent: state.selectedIntent,
        favorite_driver: state.selectedDriver,
        favorite_team: state.selectedTeam,
        notify_race_start: state.notifyRaceStart,
        notify_qualifying: state.notifyQualifying,
        notify_results: state.notifyResults,
      });

      toast.success('Welcome to Fastlytics!');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      toast.error((error as Error).message || 'Failed to save profile');
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#09090b] text-white">
      <SEO
        title="Welcome to Fastlytics"
        description="Set up your Fastlytics profile with favorite drivers and teams for a personalized race desk."
        noIndex
      />

      <Confetti active={showConfetti} />

      {/* ─── Left Column: Illustrations ─── */}
      <div className="relative hidden w-[45%] lg:flex lg:flex-col lg:items-center lg:justify-center">
        {/* Clean dark background with subtle grid */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#0c0c0e]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Logo top-left */}
        <div className="absolute left-8 top-8 z-10">
          <FastlyticsLogo size={16} />
        </div>

        {/* Illustration */}
        <div className="relative z-10 flex w-full max-w-md items-center justify-center px-12">
          <OnboardingIllustration step={state.step} />
        </div>

        {/* Step label bottom */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/20">
            {
              [
                'Your Profile',
                'Your Intent',
                'Your Driver',
                'Your Team',
                'Notifications',
                'Profile Photo',
                'All Set',
              ][state.step - 1]
            }
          </p>
        </div>

        {/* Border separator */}
        <div className="absolute inset-y-0 right-0 w-px bg-white/[0.06]" />
      </div>

      {/* ─── Right Column: Steps ─── */}
      <div className="relative z-10 flex w-full flex-col lg:w-[55%]">
        {/* Mobile-only logo */}
        <div className="shrink-0 px-8 pt-8 lg:hidden">
          <FastlyticsLogo size={14} />
        </div>

        {/* Everything centered as one block */}
        <div className="flex flex-1 overflow-y-auto px-8 py-8 lg:px-12">
          <div className="m-auto w-full max-w-xl">
            <OnboardingProgress step={state.step} />
            <OnboardingStepContent
              step={state.step}
              isLoading={state.isLoading}
              drivers={state.drivers}
              teams={state.teams}
              firstName={state.firstName}
              lastName={state.lastName}
              username={state.username}
              selectedIntent={state.selectedIntent}
              selectedDriver={state.selectedDriver}
              selectedTeam={state.selectedTeam}
              notifyRaceStart={state.notifyRaceStart}
              notifyQualifying={state.notifyQualifying}
              notifyResults={state.notifyResults}
              getDriverImageForYear={getDriverImageForYear}
              onNext={() => dispatch({ type: 'nextStep' })}
              onBack={() => dispatch({ type: 'previousStep' })}
              onSetFirstName={(value) => dispatch({ type: 'setFirstName', value })}
              onSetLastName={(value) => dispatch({ type: 'setLastName', value })}
              onSetUsername={(value) => dispatch({ type: 'setUsername', value })}
              onSelectIntent={(value) => dispatch({ type: 'setIntent', value })}
              onSelectDriver={(value) => dispatch({ type: 'setDriverSelection', value })}
              onSelectTeam={(value) => dispatch({ type: 'setTeamSelection', value })}
              onToggleNotifyRaceStart={() => dispatch({ type: 'toggleNotifyRaceStart' })}
              onToggleNotifyQualifying={() => dispatch({ type: 'toggleNotifyQualifying' })}
              onToggleNotifyResults={() => dispatch({ type: 'toggleNotifyResults' })}
              onComplete={handleComplete}
              trackDriverSelection={(value) => trackSelection('onboarding_driver', value)}
              trackTeamSelection={(value) => trackSelection('onboarding_team', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

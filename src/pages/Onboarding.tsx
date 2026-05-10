// knip-ignore
import { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchDriverStandings, fetchTeamStandings } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SEO } from '@/components/layout/SEO';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { OnboardingProgress, OnboardingStepContent } from './Onboarding/OnboardingSteps';
import { initialOnboardingState, onboardingReducer } from './Onboarding/onboardingState';

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { trackEvent, trackSelection } = useAnalytics();
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);

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

  const getDriverImageForYear = (driverCode: string) =>
    getDriverImage(driverCode, getCurrentSeasonYear());

  const handleComplete = async () => {
    if (!user) return;

    dispatch({ type: 'setIsLoading', value: true });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          favorite_driver: state.selectedDriver,
          favorite_team: state.selectedTeam,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      trackEvent('onboarding_completed', {
        favorite_driver: state.selectedDriver,
        favorite_team: state.selectedTeam,
      });

      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      toast.error((error as Error).message || 'Failed to save profile');
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 p-4 text-white">
      <SEO
        title="Welcome"
        description="Set up your Fastlytics profile with favorite drivers and teams for a personalized race desk."
        noIndex
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] size-[50%] rounded-full bg-red-600/20 blur-[150px]" />
        <div className="absolute -right-[10%] top-[40%] size-[40%] rounded-full bg-blue-600/10 blur-[150px]" />
      </div>

      <div className="z-10 w-full max-w-6xl">
        <OnboardingProgress step={state.step} />
        <OnboardingStepContent
          step={state.step}
          isLoading={state.isLoading}
          drivers={state.drivers}
          teams={state.teams}
          selectedDriver={state.selectedDriver}
          selectedTeam={state.selectedTeam}
          getDriverImageForYear={getDriverImageForYear}
          onNext={() => dispatch({ type: 'nextStep' })}
          onBack={() => dispatch({ type: 'previousStep' })}
          onSelectDriver={(value) => dispatch({ type: 'setDriverSelection', value })}
          onSelectTeam={(value) => dispatch({ type: 'setTeamSelection', value })}
          onComplete={handleComplete}
          trackDriverSelection={(value) => trackSelection('onboarding_driver', value)}
          trackTeamSelection={(value) => trackSelection('onboarding_team', value)}
        />
      </div>
    </div>
  );
};

export default Onboarding;

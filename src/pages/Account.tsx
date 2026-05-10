// knip-ignore
import { useEffect, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fetchDriverStandings, fetchTeamStandings } from '@/lib/api';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { SEO } from '@/components/layout/SEO';
import { request } from '@/lib/api-client';
import UpgradeModal from '@/components/payments/UpgradeModal';
import type { ActivityItemProps } from '@/components/activity/ActivityItem';
import {
  AccountHeader,
  AccountSidebar,
  FavoritesSection,
  HistorySection,
  ProfileSection,
  SecuritySection,
  SubscriptionSection,
} from './Account/AccountSections';
import { accountReducer, getInitialAccountState } from './Account/accountState';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const Account = () => {
  const { user, profile, refreshProfile, signOut, subscription, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useAnalytics();
  const [state, dispatch] = useReducer(
    accountReducer,
    searchParams.get('section'),
    getInitialAccountState
  );

  useEffect(() => {
    dispatch({
      type: 'hydrateProfile',
      payload: {
        fullName: user?.user_metadata?.full_name || '',
        username: profile?.username || '',
        email: user?.email || '',
        favoriteDriver: profile?.favorite_driver || null,
        favoriteTeam: profile?.favorite_team || null,
      },
    });
  }, [profile, user]);

  useEffect(() => {
    const loadF1Data = async () => {
      try {
        const year = await resolveSeasonYear(fetchDriverStandings);
        const [drivers, teams] = await Promise.all([
          fetchDriverStandings(year),
          fetchTeamStandings(year),
        ]);

        dispatch({ type: 'setF1Data', drivers, teams });
      } catch (error) {
        console.error('Error loading F1 data:', error);
      }
    };

    loadF1Data();
  }, []);

  const { data: userActivity = [], isLoading: isLoadingActivity } = useQuery<
    ActivityItemProps['activity'][]
  >({
    queryKey: ['userActivity', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && state.activeSection === 'history',
  });

  const getDriverImageForYear = (driverCode: string) =>
    getDriverImage(driverCode, getCurrentSeasonYear());

  const handleUpdateFavorites = async () => {
    if (!user) return;

    dispatch({ type: 'setIsLoading', value: true });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          favorite_driver: state.favorites.favoriteDriver,
          favorite_team: state.favorites.favoriteTeam,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success('Favorites updated successfully');
      trackEvent('favorites_updated', {
        favorite_driver: state.favorites.favoriteDriver,
        favorite_team: state.favorites.favoriteTeam,
      });
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to update favorites');
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  const handleOpenCustomerPortal = async () => {
    dispatch({ type: 'setIsOpeningPortal', value: true });
    try {
      const data = await request<{ link: string }>('/api/payments/customer-portal', {
        method: 'POST',
      });
      window.location.assign(data.link);
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to open subscription portal');
    } finally {
      dispatch({ type: 'setIsOpeningPortal', value: false });
    }
  };

  const handleSaveField = async (field: 'fullName' | 'username' | 'email') => {
    if (!user) return;

    dispatch({ type: 'setIsLoading', value: true });
    try {
      let error;
      if (field === 'fullName') {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: state.profileForm.fullName },
        });
        error = updateError;
        if (!error) {
          await supabase
            .from('profiles')
            .update({ full_name: state.profileForm.fullName })
            .eq('id', user.id);
        }
      } else if (field === 'username') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: state.profileForm.username })
          .eq('id', user.id);
        error = updateError;
      } else if (field === 'email') {
        if (state.profileForm.email !== user.email) {
          const { error: updateError } = await supabase.auth.updateUser({
            email: state.profileForm.email,
          });
          error = updateError;
          if (!error) toast.info('Please check your new email for a confirmation link.');
        } else {
          dispatch({ type: 'setEditingField', field: null });
          dispatch({ type: 'setIsLoading', value: false });
          return;
        }
      }

      if (error) throw error;

      toast.success(
        `${field === 'fullName' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`
      );
      trackEvent('profile_updated', { field });
      await refreshProfile();
      dispatch({ type: 'setEditingField', field: null });
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  const cancelEdit = () => {
    dispatch({ type: 'setEditingField', field: null });
    dispatch({
      type: 'resetProfileForm',
      payload: {
        fullName: user?.user_metadata?.full_name || '',
        username: profile?.username || '',
        email: user?.email || '',
      },
    });
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (state.passwordForm.password !== state.passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (!state.passwordForm.oldPassword) {
      toast.error('Please enter your old password');
      return;
    }

    dispatch({ type: 'setIsLoading', value: true });
    try {
      const { error } = await supabase.auth.updateUser({
        password: state.passwordForm.password,
      });
      if (error) throw error;

      toast.success('Password updated successfully');
      dispatch({ type: 'resetPasswordForm' });
    } catch (error: unknown) {
      toast.error('Error updating password', { description: (error as Error).message });
    } finally {
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  const handleConnectSocial = async (provider: 'google' | 'github' | 'discord') => {
    dispatch({ type: 'setIsLoading', value: true });
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.assign(data.url);
    } catch (error: unknown) {
      const requestError = error as Error;
      if (requestError.message?.includes('manual linking is disabled')) {
        toast.error(
          'Manual linking is disabled. Please enable "Allow manual linking" in your Supabase dashboard under Authentication > Advanced > Security.'
        );
      } else {
        toast.error(requestError.message);
      }
      dispatch({ type: 'setIsLoading', value: false });
    }
  };

  const isProviderConnected = (provider: string) =>
    user?.identities?.some((identity) => identity.provider === provider);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      toast.error('Error signing out');
    }
  };

  if (!user) return null;

  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title="Account"
        description="Manage your Fastlytics account, profile, favorites, and preferences."
        noIndex
      />
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        <AccountHeader onSignOut={handleSignOut} />

        <div className="flex flex-col gap-8 lg:flex-row">
          <AccountSidebar
            activeSection={state.activeSection}
            onSelectSection={(section) => dispatch({ type: 'setActiveSection', section })}
          />

          <div className="min-h-[500px] flex-1">
            {state.activeSection === 'profile' && (
              <ProfileSection
                user={user}
                profileForm={state.profileForm}
                editingField={state.editingField}
                isLoading={state.isLoading}
                onStartEdit={(field) => dispatch({ type: 'setEditingField', field })}
                onCancelEdit={cancelEdit}
                onChangeField={(field, value) =>
                  dispatch({ type: 'setProfileField', field, value })
                }
                onSaveField={handleSaveField}
              />
            )}

            {state.activeSection === 'favorites' && (
              <FavoritesSection
                drivers={state.f1Data.drivers}
                teams={state.f1Data.teams}
                favoriteDriver={state.favorites.favoriteDriver}
                favoriteTeam={state.favorites.favoriteTeam}
                isLoading={state.isLoading}
                getDriverImageForYear={getDriverImageForYear}
                onSelectDriver={(value) => dispatch({ type: 'setFavoriteDriver', value })}
                onSelectTeam={(value) => dispatch({ type: 'setFavoriteTeam', value })}
                onSave={handleUpdateFavorites}
              />
            )}

            {state.activeSection === 'security' && (
              <SecuritySection
                passwordForm={state.passwordForm}
                isLoading={state.isLoading}
                isProviderConnected={isProviderConnected}
                onPasswordChange={(field, value) =>
                  dispatch({ type: 'setPasswordField', field, value })
                }
                onSubmitPassword={handleUpdatePassword}
                onConnectSocial={handleConnectSocial}
              />
            )}

            {state.activeSection === 'history' && (
              <HistorySection isLoadingActivity={isLoadingActivity} userActivity={userActivity} />
            )}

            {state.activeSection === 'subscription' && (
              <SubscriptionSection
                subscription={subscription}
                hasProSubscription={isSubscribed('pro')}
                isOpeningPortal={state.isOpeningPortal}
                onOpenPortal={handleOpenCustomerPortal}
                onUpgrade={() => dispatch({ type: 'setUpgradeOpen', value: true })}
              />
            )}
          </div>
        </div>
      </main>

      <UpgradeModal
        open={state.upgradeOpen}
        onClose={() => dispatch({ type: 'setUpgradeOpen', value: false })}
        cancelPath="/account?section=subscription"
      />
    </div>
  );
};

export default Account;

import React, { useState, useEffect } from 'react';
import { m } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import {
  UserIcon,
  SecurityCheckIcon,
  Logout01Icon,
  CheckmarkCircle01Icon,
  PencilEdit02Icon,
  Tick02Icon,
  Cancel01Icon,
  LinkSquare01Icon,
  Analytics01Icon,
} from 'hugeicons-react';
import ActivityItem, { ActivityItemProps } from '@/components/activity/ActivityItem';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { StarIcon } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { SEO } from '@/components/layout/SEO';
import { request } from '@/lib/api-client';
import UpgradeModal from '@/components/payments/UpgradeModal';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const NavItem = ({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold uppercase tracking-wider transition-all text-left',
      active
        ? 'bg-white/[0.06] text-white border border-white/[0.08]'
        : 'text-white/45 hover:text-white hover:bg-white/[0.03] border border-transparent'
    )}
  >
    <Icon className={cn('size-4', active ? 'text-red-400' : 'text-white/30')} />
    {label}
  </button>
);

const Account = () => {
  const { user, profile, refreshProfile, signOut, subscription, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useAnalytics();
  const initialSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(
    initialSection === 'subscription' ? 'subscription' : 'profile'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [favoriteDriver, setFavoriteDriver] = useState<string | null>(null);
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);

  const [userActivity, setUserActivity] = useState<ActivityItemProps['activity'][]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || ''); // eslint-disable-line react-hooks/set-state-in-effect
      setEmail(user.email || '');
    }
    if (profile) {
      setUsername(profile.username || '');
      setFavoriteDriver(profile.favorite_driver);
      setFavoriteTeam(profile.favorite_team);
    }
  }, [user, profile]);

  useEffect(() => {
    const loadF1Data = async () => {
      try {
        const year = await resolveSeasonYear(fetchDriverStandings);
        const [driversData, teamsData] = await Promise.all([
          fetchDriverStandings(year),
          fetchTeamStandings(year),
        ]);
        setDrivers(driversData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading F1 data:', error);
      }
    };
    loadF1Data();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return;
      setIsLoadingActivity(true);
      try {
        const { data, error } = await supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setUserActivity(data || []);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setIsLoadingActivity(false);
      }
    };
    if (activeSection === 'history') fetchActivity();
  }, [user, activeSection]);

  const getDriverImageForYear = (driverCode: string) =>
    getDriverImage(driverCode, getCurrentSeasonYear());

  const handleUpdateFavorites = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          favorite_driver: favoriteDriver,
          favorite_team: favoriteTeam,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Favorites updated successfully');
      trackEvent('favorites_updated', {
        favorite_driver: favoriteDriver,
        favorite_team: favoriteTeam,
      });
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const data = await request<{ link: string }>('/api/payments/customer-portal', {
        method: 'POST',
      });
      window.location.assign(data.link);
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to open subscription portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSaveField = async (field: string) => {
    setIsLoading(true);
    try {
      let error;
      if (field === 'fullName') {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
        error = updateError;
        if (!error)
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      } else if (field === 'username') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', user.id);
        error = updateError;
      } else if (field === 'email') {
        if (email !== user?.email) {
          const { error: updateError } = await supabase.auth.updateUser({ email });
          error = updateError;
          if (!error) toast.info('Please check your new email for a confirmation link.');
        } else {
          setEditingField(null);
          setIsLoading(false);
          return;
        }
      }
      if (error) throw error;
      toast.success(
        `${field === 'fullName' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`
      );
      trackEvent('profile_updated', { field });
      await refreshProfile();
      setEditingField(null);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
    if (profile) setUsername(profile.username || '');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!oldPassword) {
      toast.error('Please enter your old password');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully');
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      toast.error('Error updating password', { description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectSocial = async (provider: 'google' | 'github' | 'discord') => {
    setIsLoading(true);
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
      const e = error as Error;
      if (e.message?.includes('manual linking is disabled')) {
        toast.error(
          'Manual linking is disabled. Please enable "Allow manual linking" in your Supabase dashboard under Authentication > Advanced > Security.'
        );
      } else {
        toast.error(e.message);
      }
      setIsLoading(false);
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
        {/* Header */}
        <div className="mb-10">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
                  My Account
                </h1>
                <p className="mt-1 text-[15px] text-white/50">
                  Manage your profile and preferences
                </p>
              </div>
              <Button
                onClick={handleSignOut}
                className="h-10 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-5 text-[13px] font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.12] hover:text-red-300"
              >
                <Logout01Icon className="mr-2 size-4" /> Sign Out
              </Button>
            </div>
          </m.div>
          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-56">
            <div className="sticky top-24 space-y-1.5">
              <NavItem
                label="Profile"
                icon={UserIcon}
                active={activeSection === 'profile'}
                onClick={() => setActiveSection('profile')}
              />
              <NavItem
                label="Favorites"
                icon={StarIcon}
                active={activeSection === 'favorites'}
                onClick={() => setActiveSection('favorites')}
              />
              <NavItem
                label="Security"
                icon={SecurityCheckIcon}
                active={activeSection === 'security'}
                onClick={() => setActiveSection('security')}
              />
              <NavItem
                label="History"
                icon={Analytics01Icon}
                active={activeSection === 'history'}
                onClick={() => setActiveSection('history')}
              />
              <NavItem
                label="Subscription"
                icon={LinkSquare01Icon}
                active={activeSection === 'subscription'}
                onClick={() => setActiveSection('subscription')}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-h-[500px] flex-1">
            {/* Profile */}
            {activeSection === 'profile' && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
                    Profile Settings
                  </h2>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
                  <div className="mb-8 flex items-center gap-5">
                    <Avatar className="size-20 border border-white/[0.08]">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-[#1a1a1e] text-[18px] font-bold text-white/70">
                        {user.email?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-[18px] font-semibold text-white">
                        {user.user_metadata?.full_name || 'User'}
                      </h3>
                      <p className="text-[14px] text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <div className="max-w-lg space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Full Name
                      </Label>
                      <div className="flex items-center gap-3">
                        {editingField === 'fullName' ? (
                          <>
                            <Input
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40 focus:ring-red-500/20"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveField('fullName')}
                              disabled={isLoading}
                              className="size-10 shrink-0 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            >
                              <Tick02Icon className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEdit}
                              disabled={isLoading}
                              className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                            >
                              <Cancel01Icon className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-[15px] text-white">
                              {fullName}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingField('fullName')}
                              className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                            >
                              <PencilEdit02Icon className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Username
                      </Label>
                      <div className="flex items-center gap-3">
                        {editingField === 'username' ? (
                          <>
                            <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40 focus:ring-red-500/20"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveField('username')}
                              disabled={isLoading}
                              className="size-10 shrink-0 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            >
                              <Tick02Icon className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEdit}
                              disabled={isLoading}
                              className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                            >
                              <Cancel01Icon className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-[15px] text-white">
                              {username || 'Not set'}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingField('username')}
                              className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                            >
                              <PencilEdit02Icon className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Email Address
                      </Label>
                      <div className="flex items-center gap-3">
                        {editingField === 'email' ? (
                          <>
                            <Input
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40 focus:ring-red-500/20"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveField('email')}
                              disabled={isLoading}
                              className="size-10 shrink-0 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            >
                              <Tick02Icon className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEdit}
                              disabled={isLoading}
                              className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                            >
                              <Cancel01Icon className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-[15px] text-white">
                              {email}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingField('email')}
                              className="size-10 shrink-0 rounded-xl text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                            >
                              <PencilEdit02Icon className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {/* Favorites */}
            {activeSection === 'favorites' && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
                    My Favorites
                  </h2>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
                  <p className="mb-6 text-[14px] text-white/40">
                    Update your favorite driver and team to personalize your dashboard.
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Favorite Driver */}
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Favorite Driver
                      </Label>
                      <div className="custom-scrollbar max-h-[340px] space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                        {drivers.map((driver) => (
                          <button
                            key={driver.code}
                            onClick={() => setFavoriteDriver(driver.code)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              favoriteDriver === driver.code
                                ? 'bg-red-500/[0.1] text-white'
                                : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                            )}
                          >
                            <Avatar className="size-9 shrink-0 border border-white/[0.08]">
                              <AvatarImage
                                src={getDriverImageForYear(driver.code)}
                                className="object-cover object-top"
                              />
                              <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold">
                                {driver.code}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[14px] font-semibold">
                                {driver.name.split(' ').pop()}
                              </div>
                              <div
                                className={cn(
                                  'text-[11px]',
                                  favoriteDriver === driver.code
                                    ? 'text-red-400/60'
                                    : 'text-white/30'
                                )}
                              >
                                {driver.team}
                              </div>
                            </div>
                            {favoriteDriver === driver.code && (
                              <CheckmarkCircle01Icon className="size-4 shrink-0 text-red-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Favorite Team */}
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Favorite Team
                      </Label>
                      <div className="custom-scrollbar max-h-[340px] space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                        {teams.map((team) => (
                          <button
                            key={team.team}
                            onClick={() => setFavoriteTeam(team.team)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              favoriteTeam === team.team
                                ? 'bg-red-500/[0.1] text-white'
                                : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                            )}
                          >
                            <div className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] p-1.5">
                              <img
                                src={getTeamLogo(team.team) || ''}
                                alt={team.team}
                                className="size-full object-contain"
                              />
                            </div>
                            <span className="flex-1 truncate text-[14px] font-semibold">
                              {team.team}
                            </span>
                            {favoriteTeam === team.team && (
                              <CheckmarkCircle01Icon className="size-4 shrink-0 text-red-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={handleUpdateFavorites}
                      disabled={isLoading}
                      className="h-11 rounded-xl bg-white px-6 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
                    >
                      {isLoading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              </m.div>
            )}

            {activeSection === 'subscription' && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
                    Subscription
                  </h2>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
                  {isSubscribed('pro') && subscription ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                            Plan
                          </p>
                          <p className="mt-2 text-[18px] font-bold text-white capitalize">
                            {subscription.plan}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                            Billing
                          </p>
                          <p className="mt-2 text-[18px] font-bold text-white capitalize">
                            {subscription.billing_interval || 'Monthly'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                            Renews / Expires
                          </p>
                          <p
                            suppressHydrationWarning
                            className="mt-2 text-[18px] font-bold text-white"
                          >
                            {subscription.current_period_end
                              ? new Date(subscription.current_period_end).toLocaleDateString()
                              : 'Active'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
                        <h3 className="text-[16px] font-semibold text-white">
                          Manage your subscription
                        </h3>
                        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/45">
                          Open the Dodo Payments customer portal to update billing details or cancel
                          your subscription.
                        </p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <Button
                            onClick={handleOpenCustomerPortal}
                            disabled={isOpeningPortal}
                            className="h-11 rounded-xl bg-white px-5 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
                          >
                            {isOpeningPortal ? 'Opening...' : 'Manage Subscription'}
                          </Button>
                          <Button
                            onClick={handleOpenCustomerPortal}
                            disabled={isOpeningPortal}
                            className="h-11 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-5 text-[13px] font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.12] hover:text-red-300"
                          >
                            {isOpeningPortal ? 'Opening...' : 'Cancel Subscription'}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
                      <h3 className="text-[16px] font-semibold text-white">Free plan</h3>
                      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/45">
                        You are currently on the free plan. Upgrade to Pro to unlock historical
                        seasons and unlimited session replay.
                      </p>
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => setUpgradeOpen(true)}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/12 px-5 text-[13px] font-semibold text-sky-200 transition-all hover:border-sky-300/35 hover:bg-sky-400/18 hover:text-sky-100"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </m.div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
                    Security
                  </h2>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
                  <h3 className="mb-6 text-[18px] font-semibold text-white">Change Password</h3>
                  <form onSubmit={handleUpdatePassword} className="max-w-lg space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="oldPassword"
                        className="text-[11px] font-medium uppercase tracking-wider text-white/35"
                      >
                        Current Password
                      </Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-[11px] font-medium uppercase tracking-wider text-white/35"
                      >
                        New Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-[11px] font-medium uppercase tracking-wider text-white/35"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/20 focus:border-red-500/40"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || !password || !oldPassword}
                      className="h-11 rounded-xl bg-white px-6 text-[13px] font-semibold text-black transition-all hover:bg-white/90"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>

                  <div className="mt-10 border-t border-white/[0.04] pt-8">
                    <h3 className="mb-5 text-[18px] font-semibold text-white">
                      Connected Accounts
                    </h3>
                    <div className="max-w-lg space-y-3">
                      {[
                        { provider: 'google', icon: faGoogle, label: 'Google' },
                        { provider: 'github', icon: faGithub, label: 'GitHub' },
                        { provider: 'discord', icon: faDiscord, label: 'Discord' },
                      ].map((social) => {
                        const isConnected = isProviderConnected(social.provider);
                        return (
                          <div
                            key={social.provider}
                            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
                                <FontAwesomeIcon
                                  icon={social.icon}
                                  className="text-[16px] text-white/50"
                                />
                              </div>
                              <div>
                                <div className="text-[14px] font-semibold text-white">
                                  {social.label}
                                </div>
                                <div className="text-[12px] text-white/35">
                                  {isConnected ? 'Connected' : 'Not connected'}
                                </div>
                              </div>
                            </div>
                            {isConnected ? (
                              <div className="flex items-center text-[12px] font-semibold text-emerald-400">
                                <Tick02Icon className="mr-1.5 size-4" /> Connected
                              </div>
                            ) : (
                              <Button
                                onClick={() =>
                                  handleConnectSocial(
                                    social.provider as 'google' | 'github' | 'discord'
                                  )
                                }
                                variant="outline"
                                className="h-9 rounded-xl border-white/[0.08] bg-white/[0.03] px-4 text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
                                disabled={isLoading}
                              >
                                <LinkSquare01Icon className="mr-1.5 size-3.5" /> Connect
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {/* History */}
            {activeSection === 'history' && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
                    Activity History
                  </h2>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 lg:p-8">
                  <p className="mb-6 text-[14px] text-white/40">
                    Your recent interactions on Fastlytics.
                  </p>
                  {isLoadingActivity ? (
                    <div className="space-y-3">
                      {[
                        'activity-skeleton-1',
                        'activity-skeleton-2',
                        'activity-skeleton-3',
                        'activity-skeleton-4',
                        'activity-skeleton-5',
                      ].map((skeletonKey) => (
                        <div
                          key={skeletonKey}
                          className="h-16 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]"
                        />
                      ))}
                    </div>
                  ) : userActivity.length > 0 ? (
                    <div className="space-y-2">
                      {userActivity.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} drivers={[]} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Analytics01Icon className="mx-auto mb-3 size-10 text-white/15" />
                      <p className="text-[14px] text-white/35">No recent activity found.</p>
                    </div>
                  )}
                </div>
              </m.div>
            )}
          </div>
        </div>
      </main>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        cancelPath="/account?section=subscription"
      />
    </div>
  );
};

export default Account;

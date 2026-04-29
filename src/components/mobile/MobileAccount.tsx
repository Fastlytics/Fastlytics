import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UserIcon,
  SecurityCheckIcon,
  Logout01Icon,
  PencilEdit02Icon,
  Cancel01Icon,
  Analytics01Icon,
} from 'hugeicons-react';
import {
  Star,
  ChevronRight,
  Shield,
  User,
  LogOut,
  Check,
  X,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import ActivityItem, { ActivityItemProps } from '@/components/activity/ActivityItem';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';
import { getCurrentSeasonYear, resolveSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage } from '@/utils/imageMapping';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const BottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col rounded-t-2xl border-t border-white/[0.06] bg-[#0c0c0e]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-white/15" />
          </div>
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 pb-4">
            <h3 className="text-[16px] font-bold uppercase italic tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Cancel01Icon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-24">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
  showChevron?: boolean;
}> = ({ icon: Icon, label, value, onClick, danger, showChevron = true }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-4 p-4 transition-colors',
      danger ? 'text-red-400 hover:bg-red-500/[0.06]' : 'text-white hover:bg-white/[0.03]'
    )}
  >
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
        danger ? 'border-red-500/20 bg-red-500/[0.07]' : 'border-white/[0.06] bg-white/[0.03]'
      )}
    >
      <Icon className={cn('h-4 w-4', danger ? 'text-red-400' : 'text-white/50')} />
    </div>
    <div className="min-w-0 flex-1 text-left">
      <div className="text-[14px] font-semibold">{label}</div>
      {value && <div className="mt-0.5 truncate text-[11px] text-white/35">{value}</div>}
    </div>
    {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />}
  </button>
);

const MobileAccount: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);

  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showFavoritesSheet, setShowFavoritesSheet] = useState(false);
  const [showSecuritySheet, setShowSecuritySheet] = useState(false);
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [username, setUsername] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [favoriteDriver, setFavoriteDriver] = useState<string | null>(null);
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);

  const [userActivity, setUserActivity] = useState<ActivityItemProps['activity'][]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (user) setFullName(user.user_metadata?.full_name || ''); // eslint-disable-line react-hooks/set-state-in-effect
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
    if (showHistorySheet) fetchActivity();
  }, [user, showHistorySheet]);

  const getDriverImg = (driverCode: string) => getDriverImage(driverCode, getCurrentSeasonYear());

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
      toast.success('Favorites updated');
      setShowFavoritesSheet(false);
      trackEvent('favorites_updated', {
        favorite_driver: favoriteDriver,
        favorite_team: favoriteTeam,
      });
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to update');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveField = async (field: string) => {
    if (!user) return;
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
      }
      if (error) throw error;
      toast.success('Updated successfully');
      await refreshProfile();
      setEditingField(null);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!oldPassword) {
      toast.error('Enter your old password');
      return;
    }
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });
      if (signInError) throw new Error('Incorrect old password');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated');
      setPassword('');
      setConfirmPassword('');
      setOldPassword('');
      setShowSecuritySheet(false);
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch {
      toast.error('Error signing out');
    }
  };

  const getFavoriteDriverName = () =>
    drivers.find((d) => d.code === favoriteDriver)?.name || 'Not set';

  if (!user) return null;

  return (
    <MobileLayout>
      <div style={inter} className="min-h-screen bg-[#09090b] text-white">
        <MobilePageHeader />

        {/* Profile Card */}
        <div className="px-4 py-6">
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
            <div className="absolute right-0 top-0 h-4 w-4 border-r border-t border-red-500/30" />
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shrink-0 rounded-xl border border-white/[0.08]">
                <AvatarImage
                  src={user.user_metadata?.avatar_url}
                  className="object-cover object-top"
                />
                <AvatarFallback className="bg-[#1a1a1e] text-[16px] font-bold text-white/60">
                  {user.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[18px] font-bold uppercase italic">
                  {user.user_metadata?.full_name || 'User'}
                </h2>
                <p className="truncate text-[12px] text-white/40">{user.email}</p>
                {profile?.username && (
                  <div className="mt-1 inline-block rounded-full bg-red-500/[0.1] px-2 py-0.5 text-[10px] font-bold text-red-400">
                    @{profile.username}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-5 px-4">
          <div>
            <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Account
            </h3>
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] divide-y divide-white/[0.04]">
              <MenuItem
                icon={User}
                label="Profile"
                value="Name, username"
                onClick={() => setShowProfileSheet(true)}
              />
              <MenuItem
                icon={Star}
                label="My Favorites"
                value={getFavoriteDriverName()}
                onClick={() => setShowFavoritesSheet(true)}
              />
              <MenuItem
                icon={Activity}
                label="History"
                value="Recent activity"
                onClick={() => setShowHistorySheet(true)}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Security
            </h3>
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <MenuItem
                icon={Shield}
                label="Password & Security"
                value="Change password"
                onClick={() => setShowSecuritySheet(true)}
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="overflow-hidden rounded-xl border border-red-500/15 bg-[#0c0c0e]">
              <MenuItem
                icon={LogOut}
                label="Sign Out"
                onClick={handleSignOut}
                danger
                showChevron={false}
              />
            </div>
          </div>
        </div>

        {/* Profile Sheet */}
        <BottomSheet
          isOpen={showProfileSheet}
          onClose={() => {
            setShowProfileSheet(false);
            setEditingField(null);
          }}
          title="Profile"
        >
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Full Name
              </label>
              {editingField === 'fullName' ? (
                <div className="flex items-center gap-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[14px] text-white focus:border-red-500/40 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveField('fullName')}
                    disabled={isLoading}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingField('fullName')}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 text-[14px] text-white transition-colors hover:border-white/[0.1]"
                >
                  <span>{fullName || 'Not set'}</span>
                  <PencilEdit02Icon className="h-4 w-4 text-white/25" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Username
              </label>
              {editingField === 'username' ? (
                <div className="flex items-center gap-2">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[14px] text-white focus:border-red-500/40 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveField('username')}
                    disabled={isLoading}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingField('username')}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 text-[14px] text-white transition-colors hover:border-white/[0.1]"
                >
                  <span>{username || 'Not set'}</span>
                  <PencilEdit02Icon className="h-4 w-4 text-white/25" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Email
              </label>
              <div className="flex h-11 items-center rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 text-[13px] text-white/35">
                {user.email}
              </div>
            </div>
          </div>
        </BottomSheet>

        {/* Favorites Sheet */}
        <BottomSheet
          isOpen={showFavoritesSheet}
          onClose={() => setShowFavoritesSheet(false)}
          title="My Favorites"
        >
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Favorite Driver
              </label>
              <button
                onClick={() => setShowDriverPicker(true)}
                className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 transition-colors hover:border-white/[0.1]"
              >
                {favoriteDriver ? (
                  <>
                    <Avatar className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.08]">
                      <AvatarImage
                        src={getDriverImg(favoriteDriver)}
                        className="object-cover object-top"
                      />
                      <AvatarFallback className="rounded-lg text-[10px]">
                        {favoriteDriver}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left text-[14px] font-semibold">
                      {getFavoriteDriverName()}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-[13px] text-white/30">
                    Select a driver
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Favorite Team
              </label>
              <button
                onClick={() => setShowTeamPicker(true)}
                className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 transition-colors hover:border-white/[0.1]"
              >
                {favoriteTeam ? (
                  <>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
                      <img
                        src={getTeamLogo(favoriteTeam) || ''}
                        alt={favoriteTeam}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="flex-1 text-left text-[14px] font-semibold">
                      {favoriteTeam}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-[13px] text-white/30">Select a team</span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
              </button>
            </div>
            <button
              onClick={handleUpdateFavorites}
              disabled={isLoading}
              className="mt-4 h-12 w-full rounded-xl bg-red-500/[0.12] text-[13px] font-bold text-red-400 transition-colors hover:bg-red-500/[0.18] disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Favorites'}
            </button>
          </div>

          {/* Driver Picker Sub-sheet */}
          <AnimatePresence>
            {showDriverPicker && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-0 bg-[#0c0c0e]"
              >
                <div className="flex items-center justify-between border-b border-white/[0.04] p-4">
                  <button
                    onClick={() => setShowDriverPicker(false)}
                    className="text-[13px] font-semibold text-red-400"
                  >
                    Back
                  </button>
                  <h3 className="text-[14px] font-bold uppercase">Select Driver</h3>
                  <div className="w-10" />
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {drivers.map((driver) => (
                    <button
                      key={driver.code}
                      onClick={() => {
                        setFavoriteDriver(driver.code);
                        setShowDriverPicker(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-white/[0.04] p-3 transition-colors last:border-b-0',
                        favoriteDriver === driver.code
                          ? 'bg-red-500/[0.1] text-white'
                          : 'text-white/60 hover:bg-white/[0.03]'
                      )}
                    >
                      <Avatar className="h-11 w-11 shrink-0 rounded-lg border border-white/[0.08]">
                        <AvatarImage
                          src={getDriverImg(driver.code)}
                          className="object-cover object-top"
                        />
                        <AvatarFallback className="rounded-lg text-[10px]">
                          {driver.code}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-[14px] font-semibold">{driver.name}</div>
                        <div
                          className={cn(
                            'text-[11px]',
                            favoriteDriver === driver.code ? 'text-red-400/60' : 'text-white/30'
                          )}
                        >
                          {driver.team}
                        </div>
                      </div>
                      {favoriteDriver === driver.code && (
                        <Check className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Team Picker Sub-sheet */}
          <AnimatePresence>
            {showTeamPicker && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-0 bg-[#0c0c0e]"
              >
                <div className="flex items-center justify-between border-b border-white/[0.04] p-4">
                  <button
                    onClick={() => setShowTeamPicker(false)}
                    className="text-[13px] font-semibold text-red-400"
                  >
                    Back
                  </button>
                  <h3 className="text-[14px] font-bold uppercase">Select Team</h3>
                  <div className="w-10" />
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {teams.map((team) => (
                    <button
                      key={team.team}
                      onClick={() => {
                        setFavoriteTeam(team.team);
                        setShowTeamPicker(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-white/[0.04] p-3 transition-colors last:border-b-0',
                        favoriteTeam === team.team
                          ? 'bg-red-500/[0.1] text-white'
                          : 'text-white/60 hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] p-1.5">
                        <img
                          src={getTeamLogo(team.team) || ''}
                          alt={team.team}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 text-left text-[14px] font-semibold">{team.team}</div>
                      {favoriteTeam === team.team && (
                        <Check className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </BottomSheet>

        {/* Security Sheet */}
        <BottomSheet
          isOpen={showSecuritySheet}
          onClose={() => setShowSecuritySheet(false)}
          title="Security"
        >
          <div className="space-y-5 p-5">
            <p className="text-[12px] text-white/35">Change your account password.</p>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Current password"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 pr-11 text-[14px] text-white placeholder:text-white/20 focus:border-red-500/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 pr-11 text-[14px] text-white placeholder:text-white/20 focus:border-red-500/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[14px] text-white placeholder:text-white/20 focus:border-red-500/40 focus:outline-none"
              />
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={isLoading || !password || !oldPassword || !confirmPassword}
              className="mt-2 h-12 w-full rounded-xl bg-red-500/[0.12] text-[13px] font-bold text-red-400 transition-colors hover:bg-red-500/[0.18] disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </BottomSheet>

        {/* History Sheet */}
        <BottomSheet
          isOpen={showHistorySheet}
          onClose={() => setShowHistorySheet(false)}
          title="Activity History"
        >
          <div className="p-5">
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
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
                <Activity className="mx-auto mb-3 h-10 w-10 text-white/15" />
                <p className="text-[13px] text-white/35">No recent activity found.</p>
              </div>
            )}
          </div>
        </BottomSheet>
      </div>
    </MobileLayout>
  );
};

export { MobileAccount };
export default MobileAccount;

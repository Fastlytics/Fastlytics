import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UserIcon,
  SecurityCheckIcon,
  CreditCardIcon,
  Logout01Icon,
  CheckmarkCircle01Icon,
  PencilEdit02Icon,
  Tick02Icon,
  Cancel01Icon,
  Rocket01Icon,
} from 'hugeicons-react';
import {
  Star,
  ChevronRight,
  Shield,
  User,
  CreditCard,
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

// Bottom Sheet Component
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
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
          className="absolute bottom-0 left-0 right-0 bg-black border-t-2 border-white/20 max-h-[90vh] flex flex-col rounded-t-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b-2 border-white/10">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:text-black transition-colors border border-transparent hover:border-white"
            >
              <Cancel01Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Content - with bottom padding for safe area */}
          <div className="flex-1 overflow-y-auto pb-24">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Menu Item Component
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  value,
  onClick,
  danger,
  showChevron = true,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-4 p-4 active:bg-white active:text-black transition-colors border-b border-white/10 last:border-b-0',
      danger ? 'text-red-500 hover:bg-red-600 hover:text-white' : 'text-white hover:bg-zinc-900'
    )}
  >
    <div
      className={cn(
        'w-10 h-10 flex items-center justify-center border border-white/10',
        danger ? 'bg-red-600/10' : 'bg-black'
      )}
    >
      <Icon className={cn('w-5 h-5', danger ? 'text-red-500' : 'text-white')} />
    </div>
    <div className="flex-1 text-left">
      <div className="font-black uppercase tracking-wider text-sm">{label}</div>
      {value && <div className="text-xs font-mono text-gray-500 mt-0.5">{value}</div>}
    </div>
    {showChevron && <ChevronRight className="w-5 h-5 text-gray-600" />}
  </button>
);

// Driver Image Map for 2025
// Removed hardcoded map
const MobileAccount: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackEvent } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);

  // Sheet States
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showFavoritesSheet, setShowFavoritesSheet] = useState(false);
  const [showSecuritySheet, setShowSecuritySheet] = useState(false);
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);

  // Form States
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [username, setUsername] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Favorites State
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [favoriteDriver, setFavoriteDriver] = useState<string | null>(null);
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);

  // Activity History State
  const [userActivity, setUserActivity] = useState<ActivityItemProps['activity'][]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
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

    if (showHistorySheet) {
      fetchActivity();
    }
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
        if (!error) {
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
        }
      } else if (field === 'username') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: username })
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

      const { error } = await supabase.auth.updateUser({ password: password });
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
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const getFavoriteDriverName = () => {
    const driver = drivers.find((d) => d.code === favoriteDriver);
    return driver?.name || 'Not set';
  };

  const getFavoriteTeamName = () => {
    return favoriteTeam || 'Not set';
  };

  if (!user) return null;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-black text-white">
        <MobilePageHeader />

        {/* Profile Card */}
        <div className="px-4 py-6">
          <div className="bg-black border-2 border-white/10 p-5 relative overflow-hidden rounded-xl">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600" />

            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20 rounded-md">
                <AvatarImage
                  src={user.user_metadata?.avatar_url}
                  className="object-cover object-top"
                />
                <AvatarFallback className="bg-zinc-900 text-xl font-black rounded-md">
                  {user.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black uppercase italic tracking-tighter truncate">
                  {user.user_metadata?.full_name || 'User'}
                </h2>
                <p className="text-xs font-mono text-gray-500 truncate">{user.email}</p>
                {profile?.username && (
                  <div className="inline-block mt-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    @{profile.username}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="px-4 space-y-6">
          {/* Account Section */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1 mb-2">
              Account
            </h3>
            <div className="bg-black border-2 border-white/10 rounded-xl overflow-hidden">
              <MenuItem
                icon={User}
                label="Profile"
                value="Name, username"
                onClick={() => setShowProfileSheet(true)}
              />
              <MenuItem
                icon={Star}
                label="My Favorites"
                value={`${getFavoriteDriverName()}`}
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

          {/* Security Section */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1 mb-2">
              Security
            </h3>
            <div className="bg-black border-2 border-white/10 rounded-xl overflow-hidden">
              <MenuItem
                icon={Shield}
                label="Password & Security"
                value="Change password"
                onClick={() => setShowSecuritySheet(true)}
              />
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4">
            <div className="bg-black border-2 border-red-900/50 rounded-xl overflow-hidden">
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
          <div className="p-4 space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Full Name
              </label>
              {editingField === 'fullName' ? (
                <div className="flex items-center gap-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-black border-2 border-white/20 px-4 py-3 text-white focus:border-red-600 focus:outline-none font-bold uppercase rounded-lg"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveField('fullName')}
                    disabled={isLoading}
                    className="p-3 bg-green-600 hover:bg-green-500 border-2 border-transparent hover:border-white transition-colors rounded-lg"
                  >
                    <Check className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 border-2 border-transparent hover:border-white transition-colors rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingField('fullName')}
                  className="w-full flex items-center justify-between bg-zinc-900/50 border-2 border-white/10 px-4 py-3 hover:border-white/30 transition-colors rounded-lg"
                >
                  <span className="font-bold uppercase">{fullName || 'Not set'}</span>
                  <PencilEdit02Icon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Username
              </label>
              {editingField === 'username' ? (
                <div className="flex items-center gap-2">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-black border-2 border-white/20 px-4 py-3 text-white focus:border-red-600 focus:outline-none font-bold uppercase rounded-lg"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveField('username')}
                    disabled={isLoading}
                    className="p-3 bg-green-600 hover:bg-green-500 border-2 border-transparent hover:border-white transition-colors rounded-lg"
                  >
                    <Check className="w-5 h-5 text-black" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 border-2 border-transparent hover:border-white transition-colors rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingField('username')}
                  className="w-full flex items-center justify-between bg-zinc-900/50 border-2 border-white/10 px-4 py-3 hover:border-white/30 transition-colors rounded-lg"
                >
                  <span className="font-bold uppercase">{username || 'Not set'}</span>
                  <PencilEdit02Icon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Email (read-only on mobile) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Email
              </label>
              <div className="bg-zinc-900/30 border-2 border-white/5 px-4 py-3 text-gray-500 font-mono text-sm rounded-lg">
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
          <div className="p-4 space-y-6">
            {/* Favorite Driver */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Favorite Driver
              </label>
              <button
                onClick={() => setShowDriverPicker(true)}
                className="w-full flex items-center gap-3 bg-black border-2 border-white/10 p-3 hover:border-white/30 transition-colors rounded-xl"
              >
                {favoriteDriver ? (
                  <>
                    <Avatar className="h-10 w-10 border border-white/20 rounded-md">
                      <AvatarImage
                        src={getDriverImg(favoriteDriver)}
                        className="object-cover object-top"
                      />
                      <AvatarFallback className="rounded-md">{favoriteDriver}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left font-black uppercase">
                      {getFavoriteDriverName()}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-gray-500 font-mono uppercase text-xs">
                    Select a driver
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Favorite Team */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Favorite Team
              </label>
              <button
                onClick={() => setShowTeamPicker(true)}
                className="w-full flex items-center gap-3 bg-black border-2 border-white/10 p-3 hover:border-white/30 transition-colors rounded-xl"
              >
                {favoriteTeam ? (
                  <>
                    <div className="w-10 h-10 bg-white/10 p-1 flex items-center justify-center rounded-md">
                      <img
                        src={getTeamLogo(favoriteTeam) || ''}
                        alt={favoriteTeam}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="flex-1 text-left font-black uppercase">{favoriteTeam}</span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-gray-500 font-mono uppercase text-xs">
                    Select a team
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleUpdateFavorites}
              disabled={isLoading}
              className="w-full bg-red-600 text-white font-black uppercase tracking-wider py-4 mt-6 active:bg-red-700 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-white rounded-xl"
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
                className="absolute inset-0 bg-gray-900"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <button
                    onClick={() => setShowDriverPicker(false)}
                    className="text-red-500 font-bold"
                  >
                    Back
                  </button>
                  <h3 className="font-bold">Select Driver</h3>
                  <div className="w-10" />
                </div>
                <div className="p-2 overflow-y-auto max-h-[70vh]">
                  {drivers.map((driver) => (
                    <button
                      key={driver.code}
                      onClick={() => {
                        setFavoriteDriver(driver.code);
                        setShowDriverPicker(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 transition-colors border-b border-white/10 last:border-b-0',
                        favoriteDriver === driver.code
                          ? 'bg-red-600 text-white'
                          : 'hover:bg-zinc-900 text-gray-300'
                      )}
                    >
                      <Avatar className="h-12 w-12 border border-white/20 rounded-md">
                        <AvatarImage
                          src={getDriverImg(driver.code)}
                          className="object-cover object-top"
                        />
                        <AvatarFallback className="rounded-md">{driver.code}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-black uppercase">{driver.name}</div>
                        <div
                          className={cn(
                            'text-xs font-mono',
                            favoriteDriver === driver.code ? 'text-white/80' : 'text-gray-500'
                          )}
                        >
                          {driver.team}
                        </div>
                      </div>
                      {favoriteDriver === driver.code && <Check className="w-5 h-5" />}
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
                className="absolute inset-0 bg-gray-900"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <button
                    onClick={() => setShowTeamPicker(false)}
                    className="text-red-500 font-bold"
                  >
                    Back
                  </button>
                  <h3 className="font-bold">Select Team</h3>
                  <div className="w-10" />
                </div>
                <div className="p-2 overflow-y-auto max-h-[70vh]">
                  {teams.map((team) => (
                    <button
                      key={team.team}
                      onClick={() => {
                        setFavoriteTeam(team.team);
                        setShowTeamPicker(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 transition-colors border-b border-white/10 last:border-b-0',
                        favoriteTeam === team.team
                          ? 'bg-red-600 text-white'
                          : 'hover:bg-zinc-900 text-gray-300'
                      )}
                    >
                      <div className="w-12 h-12 bg-white/10 p-1 flex items-center justify-center rounded-md">
                        <img
                          src={getTeamLogo(team.team) || ''}
                          alt={team.team}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 text-left font-black uppercase">{team.team}</div>
                      {favoriteTeam === team.team && <Check className="w-5 h-5" />}
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
          <div className="p-4 space-y-6">
            <p className="text-xs font-mono text-gray-400 uppercase">
              Change your account password
            </p>

            {/* Old Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="ENTER CURRENT PASSWORD"
                  className="w-full bg-black border-2 border-white/20 px-4 py-3 pr-12 text-white focus:border-red-600 focus:outline-none font-bold uppercase rounded-lg placeholder:text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER NEW PASSWORD"
                  className="w-full bg-black border-2 border-white/20 px-4 py-3 pr-12 text-white focus:border-red-600 focus:outline-none font-bold uppercase rounded-lg placeholder:text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="CONFIRM NEW PASSWORD"
                className="w-full bg-black border-2 border-white/20 px-4 py-3 text-white focus:border-red-600 focus:outline-none font-bold uppercase rounded-lg placeholder:text-gray-700"
              />
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdatePassword}
              disabled={isLoading || !password || !oldPassword || !confirmPassword}
              className="w-full bg-red-600 text-white font-black uppercase tracking-wider py-4 mt-4 active:bg-red-700 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-white rounded-xl"
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
          <div className="p-4">
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-zinc-900/50 animate-pulse border-2 border-white/5 rounded-xl"
                  />
                ))}
              </div>
            ) : userActivity.length > 0 ? (
              <div className="space-y-3">
                {userActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} drivers={[]} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity found.</p>
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

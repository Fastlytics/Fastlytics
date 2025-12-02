import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    UserIcon, SecurityCheckIcon, CreditCardIcon, Logout01Icon, 
    CheckmarkCircle01Icon, PencilEdit02Icon, Tick02Icon, Cancel01Icon
} from 'hugeicons-react';
import { Star, ChevronRight, Shield, User, CreditCard, LogOut, Check, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import posthog from 'posthog-js';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';

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
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl border-t border-gray-700 max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle Bar */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-gray-700 rounded-full" />
                    </div>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-800">
                        <h3 className="text-lg font-bold uppercase tracking-tight">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                            <Cancel01Icon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Content - with bottom padding for safe area */}
                    <div className="flex-1 overflow-y-auto pb-24">
                        {children}
                    </div>
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

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, value, onClick, danger, showChevron = true }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-4 p-4 active:bg-gray-800/50 transition-colors",
            danger ? "text-red-500" : "text-white"
        )}
    >
        <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            danger ? "bg-red-500/10" : "bg-gray-800"
        )}>
            <Icon className={cn("w-5 h-5", danger ? "text-red-500" : "text-gray-400")} />
        </div>
        <div className="flex-1 text-left">
            <div className="font-medium">{label}</div>
            {value && <div className="text-sm text-gray-500">{value}</div>}
        </div>
        {showChevron && <ChevronRight className="w-5 h-5 text-gray-600" />}
    </button>
);

// Driver Image Map for 2025
const driverImageMap: Record<string, string> = {
    "ALB": "/drivers/2025williamsalealb01right.avif",
    "ALO": "/drivers/2025astonmartinferalo01right.avif",
    "BEA": "/drivers/2025haasf1teamolibea01right.avif",
    "BOR": "/drivers/2025kicksaubergabbor01right.avif",
    "COL": "/drivers/2025alpinefracol01right.avif",
    "GAS": "/drivers/2025alpinepiegas01right.avif",
    "HAD": "/drivers/2025racingbullsisahad01right.avif",
    "HAM": "/drivers/2025ferrarilewham01right.avif",
    "HUL": "/drivers/2025kicksaubernichul01right.avif",
    "LAW": "/drivers/2025racingbullslialaw01right.avif",
    "LEC": "/drivers/2025ferrarichalec01right.avif",
    "NOR": "/drivers/2025mclarenlannor01right.avif",
    "OCO": "/drivers/2025haasf1teamestoco01right.avif",
    "PIA": "/drivers/2025mclarenoscpia01right.avif",
    "RUS": "/drivers/2025mercedesgeorus01right.avif",
    "SAI": "/drivers/2025williamscarsai01right.avif",
    "STR": "/drivers/2025astonmartinlanstr01right.avif",
    "TSU": "/drivers/2025redbullracingyuktsu01right.avif",
    "VER": "/drivers/2025redbullracingmaxver01right.avif",
    "ANT": "/drivers/2025mercedesandant01right.avif",
};

const MobileAccount: React.FC = () => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Sheet States
    const [showProfileSheet, setShowProfileSheet] = useState(false);
    const [showFavoritesSheet, setShowFavoritesSheet] = useState(false);
    const [showSecuritySheet, setShowSecuritySheet] = useState(false);
    const [showSubscriptionSheet, setShowSubscriptionSheet] = useState(false);
    const [showDriverPicker, setShowDriverPicker] = useState(false);
    const [showTeamPicker, setShowTeamPicker] = useState(false);

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
    const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);
    const [favoriteDriver, setFavoriteDriver] = useState<string | null>(null);
    const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);

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
            const currentYear = new Date().getFullYear();
            try {
                const [driversData, teamsData, openF1Data] = await Promise.all([
                    fetchDriverStandings(currentYear),
                    fetchTeamStandings(currentYear),
                    fetchAllOpenF1Drivers()
                ]);
                setDrivers(driversData);
                setTeams(teamsData);
                setOpenF1Drivers(openF1Data);
            } catch (error) {
                console.error('Error loading F1 data:', error);
            }
        };
        loadF1Data();
    }, []);

    const getDriverImage = (driverCode: string, driverName: string) => {
        if (driverImageMap[driverCode]) {
            return driverImageMap[driverCode];
        }
        const driver = openF1Drivers.find(d => 
            d.name_acronym === driverCode || 
            d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || '')
        );
        return driver?.headshot_url;
    };

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
            posthog.capture('favorites_updated', { favorite_driver: favoriteDriver, favorite_team: favoriteTeam });
        } catch (error: any) {
            toast.error(error.message || 'Failed to update');
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
                    data: { full_name: fullName }
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
        } catch (error: any) {
            toast.error(error.message);
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
            toast.error("Enter your old password");
            return;
        }

        setIsLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: oldPassword
            });
            if (signInError) throw new Error("Incorrect old password");

            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            toast.success('Password updated');
            setPassword('');
            setConfirmPassword('');
            setOldPassword('');
            setShowSecuritySheet(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out');
            navigate('/');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    const getFavoriteDriverName = () => {
        const driver = drivers.find(d => d.code === favoriteDriver);
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
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-gray-700">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-gray-800 text-xl font-bold">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold truncate">
                                    {user.user_metadata?.full_name || 'User'}
                                </h2>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                {profile?.username && (
                                    <p className="text-xs text-gray-600 font-mono">@{profile.username}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Sections */}
                <div className="px-4 space-y-6">
                    {/* Account Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-4 mb-2">
                            Account
                        </h3>
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800 divide-y divide-gray-800">
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
                        </div>
                    </div>

                    {/* Security Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-4 mb-2">
                            Security
                        </h3>
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800 divide-y divide-gray-800">
                            <MenuItem
                                icon={Shield}
                                label="Password & Security"
                                value="Change password"
                                onClick={() => setShowSecuritySheet(true)}
                            />
                        </div>
                    </div>

                    {/* Subscription Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-4 mb-2">
                            Subscription
                        </h3>
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800 divide-y divide-gray-800">
                            <MenuItem
                                icon={CreditCard}
                                label="Plan"
                                value="Free Tier"
                                onClick={() => setShowSubscriptionSheet(true)}
                            />
                        </div>
                    </div>

                    {/* Sign Out */}
                    <div className="pt-4">
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800">
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
                    onClose={() => { setShowProfileSheet(false); setEditingField(null); }}
                    title="Profile"
                >
                    <div className="p-4 space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Full Name
                            </label>
                            {editingField === 'fullName' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => handleSaveField('fullName')}
                                        disabled={isLoading}
                                        className="p-3 bg-green-600 rounded-lg"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setEditingField(null)}
                                        className="p-3 bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditingField('fullName')}
                                    className="w-full flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3"
                                >
                                    <span>{fullName || 'Not set'}</span>
                                    <PencilEdit02Icon className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Username
                            </label>
                            {editingField === 'username' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => handleSaveField('username')}
                                        disabled={isLoading}
                                        className="p-3 bg-green-600 rounded-lg"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setEditingField(null)}
                                        className="p-3 bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditingField('username')}
                                    className="w-full flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3"
                                >
                                    <span>{username || 'Not set'}</span>
                                    <PencilEdit02Icon className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {/* Email (read-only on mobile) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Email
                            </label>
                            <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-gray-400">
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
                    <div className="p-4 space-y-4">
                        {/* Favorite Driver */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Favorite Driver
                            </label>
                            <button
                                onClick={() => setShowDriverPicker(true)}
                                className="w-full flex items-center gap-3 bg-gray-800/50 rounded-lg p-3"
                            >
                                {favoriteDriver ? (
                                    <>
                                        <Avatar className="h-10 w-10 border border-gray-700">
                                            <AvatarImage 
                                                src={getDriverImage(favoriteDriver, getFavoriteDriverName())} 
                                                className="object-cover object-top"
                                            />
                                            <AvatarFallback>{favoriteDriver}</AvatarFallback>
                                        </Avatar>
                                        <span className="flex-1 text-left font-medium">{getFavoriteDriverName()}</span>
                                    </>
                                ) : (
                                    <span className="flex-1 text-left text-gray-500">Select a driver</span>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Favorite Team */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Favorite Team
                            </label>
                            <button
                                onClick={() => setShowTeamPicker(true)}
                                className="w-full flex items-center gap-3 bg-gray-800/50 rounded-lg p-3"
                            >
                                {favoriteTeam ? (
                                    <>
                                        <div className="w-10 h-10 bg-white/10 rounded-lg p-1 flex items-center justify-center">
                                            <img 
                                                src={getTeamLogo(favoriteTeam) || ''} 
                                                alt={favoriteTeam} 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="flex-1 text-left font-medium">{favoriteTeam}</span>
                                    </>
                                ) : (
                                    <span className="flex-1 text-left text-gray-500">Select a team</span>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleUpdateFavorites}
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white font-bold uppercase tracking-wider py-4 rounded-xl mt-6 active:scale-95 transition-transform disabled:opacity-50"
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
                                    <button onClick={() => setShowDriverPicker(false)} className="text-red-500 font-bold">
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
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                                                favoriteDriver === driver.code
                                                    ? "bg-red-600"
                                                    : "active:bg-gray-800"
                                            )}
                                        >
                                            <Avatar className="h-12 w-12 border border-gray-700">
                                                <AvatarImage 
                                                    src={getDriverImage(driver.code, driver.name)} 
                                                    className="object-cover object-top"
                                                />
                                                <AvatarFallback>{driver.code}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold">{driver.name}</div>
                                                <div className={cn(
                                                    "text-xs",
                                                    favoriteDriver === driver.code ? "text-red-200" : "text-gray-500"
                                                )}>{driver.team}</div>
                                            </div>
                                            {favoriteDriver === driver.code && (
                                                <Check className="w-5 h-5" />
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
                                className="absolute inset-0 bg-gray-900"
                            >
                                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                                    <button onClick={() => setShowTeamPicker(false)} className="text-red-500 font-bold">
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
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                                                favoriteTeam === team.team
                                                    ? "bg-red-600"
                                                    : "active:bg-gray-800"
                                            )}
                                        >
                                            <div className="w-12 h-12 bg-white/10 rounded-lg p-1 flex items-center justify-center">
                                                <img 
                                                    src={getTeamLogo(team.team) || ''} 
                                                    alt={team.team} 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 text-left font-bold">{team.team}</div>
                                            {favoriteTeam === team.team && (
                                                <Check className="w-5 h-5" />
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
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-400">Change your account password</p>

                        {/* Old Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white focus:border-red-600 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white focus:border-red-600 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                            />
                        </div>

                        {/* Update Button */}
                        <button
                            onClick={handleUpdatePassword}
                            disabled={isLoading || !password || !oldPassword || !confirmPassword}
                            className="w-full bg-red-600 text-white font-bold uppercase tracking-wider py-4 rounded-xl mt-4 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </BottomSheet>

                {/* Subscription Sheet */}
                <BottomSheet
                    isOpen={showSubscriptionSheet}
                    onClose={() => setShowSubscriptionSheet(false)}
                    title="Subscription"
                >
                    <div className="p-4 space-y-4">
                        {/* Current Plan */}
                        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Plan</span>
                                <span className="text-xs font-bold uppercase bg-green-600/20 text-green-500 px-2 py-1 rounded">Active</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase italic mb-1">Free Tier</h3>
                            <p className="text-3xl font-bold">$0<span className="text-sm text-gray-500 font-normal">/month</span></p>
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Included Features</h4>
                            {[
                                'Basic Telemetry Access',
                                'Live Timing',
                                'Race Results Archive',
                                'Driver Standings'
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3 text-gray-300">
                                    <CheckmarkCircle01Icon className="w-5 h-5 text-green-500" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Pro Coming Soon */}
                        <div className="bg-gray-800/30 rounded-2xl p-5 border border-gray-800 opacity-60 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Coming Soon</span>
                            </div>
                            <h3 className="text-xl font-black uppercase italic text-gray-500 mb-1">Pro Tier</h3>
                            <p className="text-2xl font-bold text-gray-600">$4.99<span className="text-sm text-gray-700 font-normal">/month</span></p>
                            <p className="text-xs text-gray-600 mt-2">Advanced analytics, unlimited history, and more.</p>
                        </div>
                    </div>
                </BottomSheet>
            </div>
        </MobileLayout>
    );
};

export default MobileAccount;

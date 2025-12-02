import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { UserIcon, SecurityCheckIcon, CreditCardIcon, Logout01Icon, CheckmarkCircle01Icon, PencilEdit02Icon, Tick02Icon, Cancel01Icon, LinkSquare01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import posthog from 'posthog-js';
import { fetchDriverStandings, fetchTeamStandings, DriverStanding, TeamStanding } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { getTeamLogo } from '@/lib/teamUtils';
import { StarIcon } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faSpotify, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAccount } from '@/components/mobile';

// ... existing imports

// --- Components ---

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
        {Icon && <Icon className="w-6 h-6 text-red-600" />}
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            {title}
        </h2>
    </div>
);

const NavItem = ({ id, label, icon: Icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-l-2 text-left",
            active
                ? "border-red-600 bg-red-600/10 text-white"
                : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900"
        )}
    >
        <Icon className={cn("w-4 h-4", active ? "text-red-500" : "text-zinc-600")} />
        {label}
    </button>
);

const Account = () => {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [activeSection, setActiveSection] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');

    // UI States
    const [editingField, setEditingField] = useState<string | null>(null);

    // Favorites State
    const [drivers, setDrivers] = useState<DriverStanding[]>([]);
    const [teams, setTeams] = useState<TeamStanding[]>([]);
    const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);
    const [favoriteDriver, setFavoriteDriver] = useState<string | null>(null);
    const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
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
        const driver = openF1Drivers.find(d => d.name_acronym === driverCode || d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || ''));
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
            toast.success('Favorites updated successfully');
            posthog.capture('favorites_updated', {
                favorite_driver: favoriteDriver,
                favorite_team: favoriteTeam
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to update favorites');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveField = async (field: string) => {
        setIsLoading(true);
        try {
            let error;

            if (field === 'fullName') {
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { full_name: fullName }
                });
                error = updateError;
                if (!error) {
                    // Also update profile table for consistency if needed, but auth metadata is primary for name here
                    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
                }
            } else if (field === 'username') {
                // Check uniqueness first if needed, but RLS/Constraint handles it usually. 
                // Better to catch error.
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ username: username })
                    .eq('id', user.id);
                error = updateError;
            } else if (field === 'email') {
                if (email !== user?.email) {
                    const { error: updateError } = await supabase.auth.updateUser({ email: email });
                    error = updateError;
                    if (!error) {
                        toast.info('Please check your new email for a confirmation link.');
                    }
                } else {
                    setEditingField(null);
                    setIsLoading(false);
                    return;
                }
            }

            if (error) throw error;

            toast.success(`${field === 'fullName' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
            posthog.capture('profile_updated', { field });
            await refreshProfile();
            setEditingField(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelEdit = () => {
        setEditingField(null);
        // Reset values to current
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setEmail(user.email || '');
        }
        if (profile) {
            setUsername(profile.username || '');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (!oldPassword) {
            toast.error("Please enter your old password");
            return;
        }

        setIsLoading(true);
        try {
            // Verify old password first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: oldPassword
            });

            if (signInError) {
                throw new Error("Incorrect old password");
            }

            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            toast.success('Password updated successfully');
            posthog.capture('password_updated');
            setPassword('');
            setConfirmPassword('');
            setOldPassword('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectSocial = async (provider: 'google' | 'spotify' | 'discord') => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                    scopes: provider === 'spotify' ? 'user-read-email user-read-private' : undefined
                }
            });
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            if (error.message?.includes('manual linking is disabled')) {
                toast.error('Manual linking is disabled. Please enable "Allow manual linking" in your Supabase dashboard under Authentication > Advanced > Security.');
            } else {
                toast.error(error.message);
            }
            setIsLoading(false);
        }
    };

    const isProviderConnected = (provider: string) => {
        return user?.identities?.some(identity => identity.provider === provider);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out successfully');
            navigate('/');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    if (!user) return null;

    // Mobile version
    if (isMobile) {
        return <MobileAccount />;
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
            <DashboardNavbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-6 border-b border-zinc-800 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
                            My Account
                        </h1>
                        <p className="text-zinc-400 font-mono text-sm">
                            Manage your profile, security, and subscription settings.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleSignOut}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider"
                    >
                        <Logout01Icon className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </header>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <div className="sticky top-32 space-y-1">
                            <NavItem id="profile" label="Profile" icon={UserIcon} active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} />
                            <NavItem id="favorites" label="My Favorites" icon={StarIcon} active={activeSection === 'favorites'} onClick={() => setActiveSection('favorites')} />
                            <NavItem id="security" label="Security" icon={SecurityCheckIcon} active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
                            <NavItem id="subscription" label="Subscription" icon={CreditCardIcon} active={activeSection === 'subscription'} onClick={() => setActiveSection('subscription')} />
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 min-h-[500px]">

                        {/* 1. Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <SectionHeader title="Profile Settings" icon={UserIcon} />
                                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-lg">
                                    <div className="flex items-center gap-6 mb-8">
                                        <Avatar className="h-24 w-24 border-4 border-zinc-800">
                                            <AvatarImage src={user.user_metadata?.avatar_url} />
                                            <AvatarFallback className="bg-zinc-800 text-2xl font-bold">
                                                {user.email?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{user.user_metadata?.full_name || 'User'}</h3>
                                            <p className="text-zinc-500">{user.email}</p>
                                            <p className="text-xs text-zinc-600 font-mono mt-1">ID: {user.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 max-w-xl">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Full Name</Label>
                                            <div className="flex items-center gap-3">
                                                {editingField === 'fullName' ? (
                                                    <>
                                                        <Input
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            className="bg-black border-zinc-800 focus:border-red-600 h-10"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" onClick={() => handleSaveField('fullName')} disabled={isLoading} className="h-10 w-10 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                                                            <Tick02Icon className="w-5 h-5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={cancelEdit} disabled={isLoading} className="h-10 w-10 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800">
                                                            <Cancel01Icon className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 p-2 text-white font-medium">{fullName}</div>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingField('fullName')} className="h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-800">
                                                            <PencilEdit02Icon className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Username */}
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Username</Label>
                                            <div className="flex items-center gap-3">
                                                {editingField === 'username' ? (
                                                    <>
                                                        <Input
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            className="bg-black border-zinc-800 focus:border-red-600 h-10"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" onClick={() => handleSaveField('username')} disabled={isLoading} className="h-10 w-10 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                                                            <Tick02Icon className="w-5 h-5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={cancelEdit} disabled={isLoading} className="h-10 w-10 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800">
                                                            <Cancel01Icon className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 p-2 text-white font-medium">{username || <span className="text-zinc-600 italic">Not set</span>}</div>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingField('username')} className="h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-800">
                                                            <PencilEdit02Icon className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Email Address</Label>
                                            <div className="flex items-center gap-3">
                                                {editingField === 'email' ? (
                                                    <>
                                                        <Input
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="bg-black border-zinc-800 focus:border-red-600 h-10"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" onClick={() => handleSaveField('email')} disabled={isLoading} className="h-10 w-10 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                                                            <Tick02Icon className="w-5 h-5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={cancelEdit} disabled={isLoading} className="h-10 w-10 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800">
                                                            <Cancel01Icon className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 p-2 text-white font-medium">{email}</div>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingField('email')} className="h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-800">
                                                            <PencilEdit02Icon className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. My Favorites Section */}
                        {activeSection === 'favorites' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <SectionHeader title="My Favorites" icon={StarIcon} />
                                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-lg">
                                    <p className="text-zinc-400 mb-8">Update your favorite driver and team to personalize your dashboard.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Favorite Driver */}
                                        <div className="space-y-4">
                                            <Label className="text-zinc-400">Favorite Driver</Label>
                                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 border border-zinc-800 rounded-md p-2 bg-black/50">
                                                {drivers.map((driver) => (
                                                    <button
                                                        key={driver.code}
                                                        onClick={() => setFavoriteDriver(driver.code)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-md transition-colors text-left",
                                                            favoriteDriver === driver.code
                                                                ? "bg-red-600 text-white"
                                                                : "hover:bg-zinc-800 text-zinc-300"
                                                        )}
                                                    >
                                                        <Avatar className="h-10 w-10 border border-zinc-700">
                                                            <AvatarImage src={getDriverImage(driver.code, driver.name)} className="object-cover object-top" />
                                                            <AvatarFallback className="text-black">{driver.code}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-sm">{driver.name}</div>
                                                            <div className={cn("text-xs", favoriteDriver === driver.code ? "text-red-200" : "text-zinc-500")}>{driver.team}</div>
                                                        </div>
                                                        {favoriteDriver === driver.code && <CheckmarkCircle01Icon className="ml-auto w-5 h-5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Favorite Team */}
                                        <div className="space-y-4">
                                            <Label className="text-zinc-400">Favorite Team</Label>
                                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 border border-zinc-800 rounded-md p-2 bg-black/50">
                                                {teams.map((team) => (
                                                    <button
                                                        key={team.team}
                                                        onClick={() => setFavoriteTeam(team.team)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-md transition-colors text-left",
                                                            favoriteTeam === team.team
                                                                ? "bg-red-600 text-white"
                                                                : "hover:bg-zinc-800 text-zinc-300"
                                                        )}
                                                    >
                                                        <div className="w-10 h-10 bg-white/10 rounded p-1 flex items-center justify-center">
                                                            <img src={getTeamLogo(team.team) || ''} alt={team.team} className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="font-bold text-sm">{team.team}</div>
                                                        {favoriteTeam === team.team && <CheckmarkCircle01Icon className="ml-auto w-5 h-5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <Button
                                            onClick={handleUpdateFavorites}
                                            disabled={isLoading}
                                            className="bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider"
                                        >
                                            {isLoading ? 'Saving...' : 'Save Preferences'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Security Section */}
                        {activeSection === 'security' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <SectionHeader title="Security" icon={SecurityCheckIcon} />
                                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-lg">
                                    <h3 className="text-lg font-bold text-white mb-6">Change Password</h3>
                                    <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
                                        <div className="space-y-2">
                                            <Label htmlFor="oldPassword" className="text-zinc-400">Old Password</Label>
                                            <Input
                                                id="oldPassword"
                                                type="password"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                className="bg-black border-zinc-800 focus:border-red-600 h-12"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-zinc-400">New Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-black border-zinc-800 focus:border-red-600 h-12"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-zinc-400">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="bg-black border-zinc-800 focus:border-red-600 h-12"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !password || !oldPassword}
                                            className="bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider"
                                        >
                                            {isLoading ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </form>

                                    <div className="mt-12 pt-8 border-t border-zinc-800">
                                        <h3 className="text-lg font-bold text-white mb-6">Connected Accounts</h3>
                                        <div className="space-y-4 max-w-xl">
                                            {[
                                                { provider: 'google', icon: faGoogle, label: 'Google' },
                                                { provider: 'spotify', icon: faSpotify, label: 'Spotify' },
                                                { provider: 'discord', icon: faDiscord, label: 'Discord' }
                                            ].map((social) => {
                                                const isConnected = isProviderConnected(social.provider);
                                                return (
                                                    <div key={social.provider} className="flex items-center justify-between p-4 bg-black/50 border border-zinc-800 rounded-lg">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
                                                                <FontAwesomeIcon icon={social.icon} className="text-zinc-400 text-lg" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">{social.label}</div>
                                                                <div className="text-xs text-zinc-500">
                                                                    {isConnected ? 'Connected' : 'Not connected'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isConnected ? (
                                                            <div className="flex items-center text-green-500 text-sm font-bold uppercase tracking-wider">
                                                                <Tick02Icon className="w-5 h-5 mr-2" /> Connected
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                onClick={() => handleConnectSocial(social.provider as any)}
                                                                variant="outline"
                                                                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                                                disabled={isLoading}
                                                            >
                                                                <LinkSquare01Icon className="w-4 h-4 mr-2" /> Connect
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Subscription Section */}
                        {activeSection === 'subscription' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <SectionHeader title="Subscription" icon={CreditCardIcon} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Free Tier */}
                                    <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-zinc-800 text-xs font-bold px-3 py-1 uppercase tracking-wider">Current Plan</div>
                                        <h3 className="text-2xl font-black uppercase italic text-white mb-2">Free Tier</h3>
                                        <div className="text-3xl font-bold text-white mb-6">$0<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
                                        <ul className="space-y-3 mb-8">
                                            <li className="flex items-center text-zinc-400"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-500 mr-3" /> Basic Telemetry Access</li>
                                            <li className="flex items-center text-zinc-400"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-500 mr-3" /> Live Timing</li>
                                            <li className="flex items-center text-zinc-400"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-500 mr-3" /> Race Results Archive</li>
                                        </ul>
                                        <Button disabled className="w-full bg-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">Active</Button>
                                    </div>

                                    {/* Pro Tier */}
                                    <div className="bg-zinc-900/10 border border-zinc-800 p-8 rounded-lg relative overflow-hidden opacity-60 cursor-not-allowed">
                                        <div className="absolute top-0 right-0 bg-zinc-800 text-xs font-bold px-3 py-1 uppercase tracking-wider text-zinc-400">Coming Soon</div>
                                        <h3 className="text-2xl font-black uppercase italic text-zinc-400 mb-2">Pro Tier</h3>
                                        <div className="text-3xl font-bold text-zinc-500 mb-6">$4.99<span className="text-lg text-zinc-600 font-normal">/mo</span></div>
                                        <ul className="space-y-3 mb-8">
                                            <li className="flex items-center text-zinc-500"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-600 mr-3" /> Advanced Telemetry Analysis</li>
                                            <li className="flex items-center text-zinc-500"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-600 mr-3" /> Driver Comparison Tools</li>
                                            <li className="flex items-center text-zinc-500"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-600 mr-3" /> Unlimited Historical Data</li>
                                            <li className="flex items-center text-zinc-500"><CheckmarkCircle01Icon className="w-5 h-5 text-zinc-600 mr-3" /> Priority Support</li>
                                        </ul>
                                        <Button disabled className="w-full bg-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">Coming Soon</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;

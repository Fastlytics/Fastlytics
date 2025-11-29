import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { UserIcon, Settings01Icon, CreditCardIcon, Logout01Icon } from 'hugeicons-react';

const Account = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
            <DashboardNavbar />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
                        My <span className="text-red-600">Account</span>
                    </h1>
                    <p className="text-gray-400 font-mono">Manage your profile, settings, and subscription.</p>
                </div>

                <Tabs defaultValue="profile" className="space-y-8">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-red-600 data-[state=active]:text-white uppercase font-bold tracking-wider text-xs sm:text-sm">
                            <UserIcon className="w-4 h-4 mr-2" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-red-600 data-[state=active]:text-white uppercase font-bold tracking-wider text-xs sm:text-sm">
                            <Settings01Icon className="w-4 h-4 mr-2" /> Settings
                        </TabsTrigger>
                        <TabsTrigger value="subscription" className="data-[state=active]:bg-red-600 data-[state=active]:text-white uppercase font-bold tracking-wider text-xs sm:text-sm">
                            <CreditCardIcon className="w-4 h-4 mr-2" /> Subscription
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <Card className="bg-zinc-900/50 border-zinc-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold uppercase italic">Personal Information</CardTitle>
                                <CardDescription className="text-zinc-400">Your basic profile details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <Avatar className="h-24 w-24 border-4 border-zinc-800">
                                        <AvatarImage src={user.user_metadata?.avatar_url} />
                                        <AvatarFallback className="bg-zinc-800 text-2xl font-bold text-white">
                                            {user.email?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center sm:text-left space-y-1">
                                        <h3 className="text-2xl font-bold">{user.user_metadata?.full_name || 'Fastlytics User'}</h3>
                                        <p className="text-zinc-400 font-mono">{user.email}</p>
                                        <div className="pt-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-500 border border-red-900/50">
                                                Free Tier
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">User ID</Label>
                                        <div className="p-3 bg-black rounded border border-zinc-800 font-mono text-sm text-zinc-300 truncate">
                                            {user.id}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Last Sign In</Label>
                                        <div className="p-3 bg-black rounded border border-zinc-800 font-mono text-sm text-zinc-300">
                                            {new Date(user.last_sign_in_at || '').toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-zinc-800 flex justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={handleSignOut}
                                        className="font-bold uppercase tracking-widest"
                                    >
                                        <Logout01Icon className="w-4 h-4 mr-2" /> Sign Out
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card className="bg-zinc-900/50 border-zinc-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold uppercase italic">Preferences</CardTitle>
                                <CardDescription className="text-zinc-400">Manage your app settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-zinc-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Email Notifications</Label>
                                        <p className="text-sm text-zinc-400">Receive updates about race results and news.</p>
                                    </div>
                                    <Switch checked={true} onCheckedChange={() => { }} className="data-[state=checked]:bg-red-600" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-zinc-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Marketing Emails</Label>
                                        <p className="text-sm text-zinc-400">Receive offers and promotions.</p>
                                    </div>
                                    <Switch checked={false} onCheckedChange={() => { }} className="data-[state=checked]:bg-red-600" />
                                </div>

                                <div className="pt-6 border-t border-zinc-800 opacity-50 pointer-events-none">
                                    <h4 className="text-sm font-bold uppercase text-zinc-500 mb-4">Change Password</h4>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label>Current Password</Label>
                                            <Input type="password" placeholder="••••••••" className="bg-black border-zinc-800" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>New Password</Label>
                                            <Input type="password" placeholder="••••••••" className="bg-black border-zinc-800" />
                                        </div>
                                        <Button className="w-fit bg-zinc-800 text-zinc-400">Update Password (Disabled for Social Auth)</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Subscription Tab */}
                    <TabsContent value="subscription" className="space-y-6">
                        <Card className="bg-zinc-900/50 border-zinc-800 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-red-600/10 blur-3xl rounded-full pointer-events-none"></div>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold uppercase italic">Current Plan</CardTitle>
                                <CardDescription className="text-zinc-400">You are currently on the Free Tier.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 relative z-10">
                                <div className="p-6 bg-black/50 border border-zinc-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-black uppercase italic text-white">Free Tier</h3>
                                            <p className="text-zinc-400 mt-1">Basic access to race results and standings.</p>
                                        </div>
                                        <span className="text-2xl font-bold text-white">$0<span className="text-sm text-zinc-500 font-normal">/mo</span></span>
                                    </div>
                                    <div className="mt-6 space-y-2">
                                        <div className="flex items-center text-sm text-zinc-300">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Live Telemetry (Limited)
                                        </div>
                                        <div className="flex items-center text-sm text-zinc-300">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Race Results
                                        </div>
                                        <div className="flex items-center text-sm text-zinc-300">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Driver Standings
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-red-900/20 to-black border border-red-900/50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-black uppercase italic text-red-500">Pro Tier</h3>
                                            <p className="text-zinc-400 mt-1">Unlock advanced telemetry and historical data.</p>
                                        </div>
                                        <span className="text-2xl font-bold text-white">$9<span className="text-sm text-zinc-500 font-normal">/mo</span></span>
                                    </div>
                                    <div className="mt-6">
                                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest">
                                            Upgrade to Pro
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Account;

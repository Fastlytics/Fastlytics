import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge } from 'lucide-react'; // Only allowed lucide icon
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import posthog from 'posthog-js';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAuth } from '@/components/mobile';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('signup');
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { user, loading } = useAuth();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleSocialLogin = async (provider: 'google' | 'github' | 'discord') => {
        setIsLoading(true);
        posthog.capture('login_started', { method: 'social', provider });
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        posthog.capture('login_started', { method: 'email' });

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    // Mobile Auth
    if (isMobile) {
        return <MobileAuth />;
    }

    return (
        <div className="min-h-screen w-full flex bg-black text-white overflow-hidden">
            {/* Left Side - Animated Illustrations */}
            <div className="hidden lg:flex w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden">
                {/* Abstract Background Animation */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 -left-1/4 w-full h-full bg-gradient-to-br from-red-600/30 to-transparent rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-red-900/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                {/* Central Animated Graphic */}
                <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full transform scale-150 opacity-20" />

                        {/* Floating Chart Card */}
                        <div className="relative w-[500px] h-[350px] bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500 group cursor-default">
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Incoming Telemetry</span>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="h-[240px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        { time: 0, speed: 120 }, { time: 1, speed: 180 }, { time: 2, speed: 240 },
                                        { time: 3, speed: 290 }, { time: 4, speed: 310 }, { time: 5, speed: 280 },
                                        { time: 6, speed: 150 }, { time: 7, speed: 110 }, { time: 8, speed: 160 },
                                        { time: 9, speed: 220 }, { time: 10, speed: 280 }, { time: 11, speed: 305 },
                                        { time: 12, speed: 315 }, { time: 13, speed: 320 }, { time: 14, speed: 290 },
                                        { time: 15, speed: 200 }, { time: 16, speed: 140 }, { time: 17, speed: 180 },
                                        { time: 18, speed: 240 }, { time: 19, speed: 280 }, { time: 20, speed: 300 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide domain={[0, 350]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            cursor={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="speed"
                                            stroke="#dc2626"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#speedGradient)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>

                                {/* Overlay Grid Lines */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="w-full h-full border-t border-zinc-800/50 mt-[25%]" />
                                    <div className="w-full h-full border-t border-zinc-800/50 mt-[25%]" />
                                    <div className="w-full h-full border-t border-zinc-800/50 mt-[25%]" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-12 text-center"
                    >
                        <h2 className="text-3xl font-bold mb-2">Unlock Pro Analytics</h2>
                        <p className="text-zinc-400 max-w-md">
                            Join thousands of racing fans improving their knowledge of the sport with advanced telemetry analysis.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
                {/* Mobile Background */}
                <div className="absolute inset-0 lg:hidden bg-zinc-900/20 z-0" />

                <div className="w-full max-w-xl z-10">
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-6"
                        >
                            <Gauge className="w-8 h-8 text-red-500" />
                        </motion.div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-3">Welcome to <span className="text-red-600">Fastlytics</span></h1>
                        <p className="text-zinc-400 text-lg">
                            {activeTab === 'signup' ? 'Sign up to create your account' : 'Sign in to access your dashboard'}
                        </p>
                    </div>

                    <Tabs defaultValue="signup" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-10 bg-zinc-900/50 p-1 h-14 rounded-lg">
                            <TabsTrigger value="signup" className="h-12 text-lg font-bold uppercase tracking-wider data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md transition-all">Sign Up</TabsTrigger>
                            <TabsTrigger value="signin" className="h-12 text-lg font-bold uppercase tracking-wider data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md transition-all">Sign In</TabsTrigger>
                        </TabsList>

                        <div className="mt-10">
                            <AnimatePresence mode="wait">
                                {activeTab === 'signup' ? (
                                    <TabsContent value="signup" className="space-y-6 focus-visible:outline-none mt-0" key="signup">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="space-y-4">
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-14 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                                    onClick={() => handleSocialLogin('google')}
                                                    disabled={isLoading}
                                                >
                                                    <FontAwesomeIcon icon={faGoogle} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                                    Sign up with Google
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-14 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                                    onClick={() => handleSocialLogin('github')}
                                                    disabled={isLoading}
                                                >
                                                    <FontAwesomeIcon icon={faGithub} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                                    Sign up with GitHub
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-14 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                                    onClick={() => handleSocialLogin('discord')}
                                                    disabled={isLoading}
                                                >
                                                    <FontAwesomeIcon icon={faDiscord} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                                    Sign up with Discord
                                                </Button>
                                            </div>

                                            <p className="text-center text-sm text-zinc-500 mt-8">
                                                By clicking continue, you agree to our <span className="underline cursor-pointer hover:text-zinc-300">Terms of Service</span> and <span className="underline cursor-pointer hover:text-zinc-300">Privacy Policy</span>.
                                            </p>
                                        </motion.div>
                                    </TabsContent>
                                ) : (
                                    <TabsContent value="signin" className="space-y-4 focus-visible:outline-none mt-0" key="signin">
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="space-y-3">
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-12 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                                    onClick={() => handleSocialLogin('google')}
                                                    disabled={isLoading}
                                                >
                                                    <FontAwesomeIcon icon={faGoogle} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                                    Sign in with Google
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-12 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                                    onClick={() => handleSocialLogin('github')}
                                                    disabled={isLoading}
                                                >
                                                    <FontAwesomeIcon icon={faGithub} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                                    Sign in with GitHub
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-12 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                                    onClick={() => handleSocialLogin('discord')}
                                                    disabled={isLoading}
                                                >
                                                    <FontAwesomeIcon icon={faDiscord} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                                    Sign in with Discord
                                                </Button>
                                            </div>

                                            <div className="relative my-6">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-zinc-800" />
                                                </div>
                                                <div className="relative flex justify-center text-sm uppercase tracking-wider">
                                                    <span className="bg-black px-4 text-zinc-500 font-bold">Or continue with</span>
                                                </div>
                                            </div>

                                            <form onSubmit={handleEmailSignIn} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-base font-medium text-zinc-300">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        placeholder="name@example.com"
                                                        className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="password" className="text-base font-medium text-zinc-300">Password</Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest h-12 text-lg mt-2"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                                </Button>
                                            </form>
                                        </motion.div>
                                    </TabsContent>
                                )}
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Auth;

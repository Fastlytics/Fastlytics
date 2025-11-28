import React, { useState } from 'react';
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

const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSocialLogin = async (provider: 'google' | 'github' | 'discord') => {
        setIsLoading(true);
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
                        {/* Rotating Rings */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="w-96 h-96 border border-zinc-700/50 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="w-72 h-72 border border-red-900/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-dashed"
                        />

                        {/* Floating Cards Animation */}
                        <div className="relative w-80 h-60 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 w-3/4 bg-zinc-700 rounded animate-pulse" />
                                <div className="h-2 w-1/2 bg-zinc-700 rounded animate-pulse delay-75" />
                                <div className="h-24 w-full bg-zinc-800/50 rounded mt-4 border border-zinc-700/50 relative overflow-hidden">
                                    <motion.div
                                        className="absolute bottom-0 left-0 w-full bg-red-500/20"
                                        initial={{ height: "0%" }}
                                        animate={{ height: ["20%", "50%", "30%", "70%"] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                    />
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
                            Join thousands of sim racers improving their lap times with advanced telemetry analysis.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
                {/* Mobile Background */}
                <div className="absolute inset-0 lg:hidden bg-zinc-900/20 z-0" />

                <div className="w-full max-w-md z-10">
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 mb-4"
                        >
                            <Gauge className="w-6 h-6 text-red-500" />
                        </motion.div>
                        <h1 className="text-2xl font-bold tracking-tight">Welcome to Fastlytics</h1>
                        <p className="text-zinc-400 mt-2">Sign in to access your dashboard</p>
                    </div>

                    <Tabs defaultValue="signup" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900/50 p-1">
                            <TabsTrigger value="signup" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
                            <TabsTrigger value="signin" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Sign In</TabsTrigger>
                        </TabsList>

                        <AnimatePresence mode="wait">
                            <TabsContent value="signup" className="space-y-4 focus-visible:outline-none">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                            onClick={() => handleSocialLogin('google')}
                                            disabled={isLoading}
                                        >
                                            <FontAwesomeIcon icon={faGoogle} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                            Sign up with Google
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                            onClick={() => handleSocialLogin('github')}
                                            disabled={isLoading}
                                        >
                                            <FontAwesomeIcon icon={faGithub} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                            Sign up with GitHub
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                            onClick={() => handleSocialLogin('discord')}
                                            disabled={isLoading}
                                        >
                                            <FontAwesomeIcon icon={faDiscord} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                            Sign up with Discord
                                        </Button>
                                    </div>

                                    <p className="text-center text-xs text-zinc-500 mt-6">
                                        By clicking continue, you agree to our <span className="underline cursor-pointer hover:text-zinc-300">Terms of Service</span> and <span className="underline cursor-pointer hover:text-zinc-300">Privacy Policy</span>.
                                    </p>
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="signin" className="space-y-4 focus-visible:outline-none">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                            onClick={() => handleSocialLogin('google')}
                                            disabled={isLoading}
                                        >
                                            <FontAwesomeIcon icon={faGoogle} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                            Sign in with Google
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                                            onClick={() => handleSocialLogin('github')}
                                            disabled={isLoading}
                                        >
                                            <FontAwesomeIcon icon={faGithub} className="mr-3 text-zinc-400 group-hover:text-white transition-colors" />
                                            Sign in with GitHub
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
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
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-black px-2 text-zinc-500">Or continue with</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Signing in...' : 'Sign In'}
                                        </Button>
                                    </form>
                                </motion.div>
                            </TabsContent>
                        </AnimatePresence>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Auth;

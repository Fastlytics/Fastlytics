import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import {
  faEnvelope,
  faLock,
  faArrowRight,
  faArrowLeft,
  faCheck,
  faKey,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge } from 'lucide-react'; // Only allowed lucide icon
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAuth } from '@/components/mobile';
import { useAuth } from '@/contexts/AuthContext';
import { oauthFlags } from '@/config/featureFlags';
import { getErrorMessage } from '@/types';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user, profile, loading } = useAuth();
  const { trackEvent } = useAnalytics();

  // Redirect logged-in users: onboarding if incomplete, otherwise returnTo or dashboard
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    if (!loading && user) {
      if (profile && !profile.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(returnTo || '/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, navigate, returnTo]);

  // Check for password reset query parameter
  useEffect(() => {
    const isResetMode = searchParams.get('reset') === 'true';
    setIsResetPasswordMode(isResetMode);
    if (isResetMode) {
      setActiveTab('signin');
      setShowForgotPassword(true);
    }
  }, [searchParams]);

  const handleSocialLogin = async (provider: 'google' | 'github' | 'discord') => {
    setIsLoading(true);
    trackEvent('login_started', { method: 'social', provider });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}${returnTo || '/dashboard'}`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    trackEvent('login_started', { method: 'email' });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!');
      navigate(returnTo || '/dashboard');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    trackEvent('signup_started', { method: 'email' });

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setIsSignUpSuccess(true);
      setIsLoading(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsSendingReset(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  // Check for password reset token in URL hash on mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      // Set the session from the access token
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })
        .then(() => {
          setIsResetPasswordMode(true);
          setShowForgotPassword(true);
          // Clear the hash
          window.history.replaceState(null, '', '/auth?reset=true');
        });
    }
  }, []);

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
          <div
            className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-red-900/30 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>

        {/* Central Animated Graphic */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
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
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Incoming Telemetry
                  </span>
                </div>
              </div>

              {/* Chart Area */}
              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { time: 0, speed: 120 },
                      { time: 1, speed: 180 },
                      { time: 2, speed: 240 },
                      { time: 3, speed: 290 },
                      { time: 4, speed: 310 },
                      { time: 5, speed: 280 },
                      { time: 6, speed: 150 },
                      { time: 7, speed: 110 },
                      { time: 8, speed: 160 },
                      { time: 9, speed: 220 },
                      { time: 10, speed: 280 },
                      { time: 11, speed: 305 },
                      { time: 12, speed: 315 },
                      { time: 13, speed: 320 },
                      { time: 14, speed: 290 },
                      { time: 15, speed: 200 },
                      { time: 16, speed: 140 },
                      { time: 17, speed: 180 },
                      { time: 18, speed: 240 },
                      { time: 19, speed: 280 },
                      { time: 20, speed: 300 },
                    ]}
                  >
                    <defs>
                      <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 350]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        color: '#fff',
                      }}
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
              Join thousands of racing fans improving their knowledge of the sport with advanced
              telemetry analysis.
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
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-3">
              Welcome to <span className="text-red-600">Fastlytics</span>
            </h1>
            <p className="text-zinc-400 text-lg">
              {activeTab === 'signup'
                ? 'Sign up to create your account'
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          <Tabs defaultValue="signup" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-10 bg-zinc-900/50 p-1 h-14 rounded-lg">
              <TabsTrigger
                value="signup"
                className="h-12 text-lg font-bold uppercase tracking-wider data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger
                value="signin"
                className="h-12 text-lg font-bold uppercase tracking-wider data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md transition-all"
              >
                Sign In
              </TabsTrigger>
            </TabsList>

            <div className="mt-10">
              <AnimatePresence mode="wait">
                {activeTab === 'signup' ? (
                  <TabsContent
                    value="signup"
                    className="space-y-6 focus-visible:outline-none mt-0"
                    key="signup"
                  >
                    {!isSignUpSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="space-y-4">
                          {oauthFlags.enableGoogle && (
                            <Button
                              variant="outline"
                              className="w-full h-14 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                              onClick={() => handleSocialLogin('google')}
                              disabled={isLoading}
                            >
                              <FontAwesomeIcon
                                icon={faGoogle}
                                className="mr-3 text-zinc-400 group-hover:text-white transition-colors"
                              />
                              Sign up with Google
                            </Button>
                          )}
                          {oauthFlags.enableGithub && (
                            <Button
                              variant="outline"
                              className="w-full h-14 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                              onClick={() => handleSocialLogin('github')}
                              disabled={isLoading}
                            >
                              <FontAwesomeIcon
                                icon={faGithub}
                                className="mr-3 text-zinc-400 group-hover:text-white transition-colors"
                              />
                              Sign up with GitHub
                            </Button>
                          )}
                          {oauthFlags.enableDiscord && (
                            <Button
                              variant="outline"
                              className="w-full h-14 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                              onClick={() => handleSocialLogin('discord')}
                              disabled={isLoading}
                            >
                              <FontAwesomeIcon
                                icon={faDiscord}
                                className="mr-3 text-zinc-400 group-hover:text-white transition-colors"
                              />
                              Sign up with Discord
                            </Button>
                          )}
                        </div>

                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                          </div>
                          <div className="relative flex justify-center text-sm uppercase tracking-wider">
                            <span className="bg-black px-4 text-zinc-500 font-bold">
                              Or continue with
                            </span>
                          </div>
                        </div>

                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="signup-email"
                              className="text-base font-medium text-zinc-300"
                            >
                              Email
                            </Label>
                            <div className="relative">
                              <FontAwesomeIcon
                                icon={faEnvelope}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                              />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="name@example.com"
                                className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="signup-password"
                              className="text-base font-medium text-zinc-300"
                            >
                              Password
                            </Label>
                            <div className="relative">
                              <FontAwesomeIcon
                                icon={faLock}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                              />
                              <Input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a password"
                                className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12 pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                              >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="confirm-password"
                              className="text-base font-medium text-zinc-300"
                            >
                              Confirm Password
                            </Label>
                            <div className="relative">
                              <FontAwesomeIcon
                                icon={faLock}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                              />
                              <Input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest h-12 text-lg mt-2"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                          </Button>
                        </form>

                        <p className="text-center text-sm text-zinc-500 mt-8">
                          By clicking continue, you agree to our{' '}
                          <span className="underline cursor-pointer hover:text-zinc-300">
                            Terms of Service
                          </span>{' '}
                          and{' '}
                          <span className="underline cursor-pointer hover:text-zinc-300">
                            Privacy Policy
                          </span>
                          .
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-6 my-8"
                      >
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                          <FontAwesomeIcon icon={faEnvelope} className="text-4xl text-red-500" />
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                            Check your inbox
                          </h3>
                          <p className="text-zinc-400 text-lg">
                            We've sent a verification link to
                            <br />
                            <span className="text-white font-bold">{email}</span>
                          </p>
                        </div>
                        <div className="w-full h-px bg-zinc-800 my-4" />
                        <p className="text-sm text-zinc-500 text-center">
                          Please click the link in the email to verify your account and sign in.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full mt-2 h-12 text-lg bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all"
                          onClick={() => {
                            setIsSignUpSuccess(false);
                            setEmail('');
                            setPassword('');
                            setConfirmPassword('');
                          }}
                        >
                          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                          Back to Sign Up
                        </Button>
                      </motion.div>
                    )}
                  </TabsContent>
                ) : (
                  <TabsContent
                    value="signin"
                    className="space-y-4 focus-visible:outline-none mt-0"
                    key="signin"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-3">
                        {oauthFlags.enableGoogle && (
                          <Button
                            variant="outline"
                            className="w-full h-12 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                            onClick={() => handleSocialLogin('google')}
                            disabled={isLoading}
                          >
                            <FontAwesomeIcon
                              icon={faGoogle}
                              className="mr-3 text-zinc-400 group-hover:text-white transition-colors"
                            />
                            Sign in with Google
                          </Button>
                        )}
                        {oauthFlags.enableGithub && (
                          <Button
                            variant="outline"
                            className="w-full h-12 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                            onClick={() => handleSocialLogin('github')}
                            disabled={isLoading}
                          >
                            <FontAwesomeIcon
                              icon={faGithub}
                              className="mr-3 text-zinc-400 group-hover:text-white transition-colors"
                            />
                            Sign in with GitHub
                          </Button>
                        )}
                        {oauthFlags.enableDiscord && (
                          <Button
                            variant="outline"
                            className="w-full h-12 text-lg font-medium bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 group"
                            onClick={() => handleSocialLogin('discord')}
                            disabled={isLoading}
                          >
                            <FontAwesomeIcon
                              icon={faDiscord}
                              className="mr-3 text-zinc-400 group-hover:text-white transition-colors"
                            />
                            Sign in with Discord
                          </Button>
                        )}
                      </div>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-sm uppercase tracking-wider">
                          <span className="bg-black px-4 text-zinc-500 font-bold">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-base font-medium text-zinc-300">
                            Email
                          </Label>
                          <div className="relative">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                            />
                            <Input
                              id="email"
                              type="email"
                              placeholder="name@example.com"
                              className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-base font-medium text-zinc-300">
                            Password
                          </Label>
                          <div className="relative">
                            <FontAwesomeIcon
                              icon={faLock}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                            />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12 pr-12"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setForgotPasswordEmail(email);
                            }}
                            className="text-sm text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            Forgot password?
                          </button>
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

          {/* Forgot Password Modal */}
          <AnimatePresence>
            {showForgotPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 mx-4"
                >
                  {!resetEmailSent ? (
                    <>
                      {isResetPasswordMode ? (
                        // Password reset form (when user comes back from email)
                        <>
                          <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
                          <p className="text-zinc-400 mb-6">Enter your new password below.</p>
                          <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="new-password"
                                className="text-base font-medium text-zinc-300"
                              >
                                New Password
                              </Label>
                              <div className="relative">
                                <FontAwesomeIcon
                                  icon={faLock}
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                                />
                                <Input
                                  id="new-password"
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Enter new password"
                                  className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12 pr-12"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="confirm-new-password"
                                className="text-base font-medium text-zinc-300"
                              >
                                Confirm New Password
                              </Label>
                              <div className="relative">
                                <FontAwesomeIcon
                                  icon={faLock}
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                                />
                                <Input
                                  id="confirm-new-password"
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Confirm new password"
                                  className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 mt-2"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Updating password...' : 'Update Password'}
                            </Button>
                          </form>
                        </>
                      ) : (
                        // Email input form (initial forgot password request)
                        <>
                          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                          <p className="text-zinc-400 mb-6">
                            Enter your email address and we'll send you a link to reset your
                            password.
                          </p>
                          <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="forgot-email"
                                className="text-base font-medium text-zinc-300"
                              >
                                Email
                              </Label>
                              <div className="relative">
                                <FontAwesomeIcon
                                  icon={faEnvelope}
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500"
                                />
                                <Input
                                  id="forgot-email"
                                  type="email"
                                  placeholder="name@example.com"
                                  className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20 text-lg pl-12"
                                  value={forgotPasswordEmail}
                                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                  required
                                  disabled={isSendingReset}
                                />
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowForgotPassword(false);
                                  setResetEmailSent(false);
                                }}
                                className="flex-1 h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                disabled={isSendingReset}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12"
                                disabled={isSendingReset}
                              >
                                {isSendingReset ? 'Sending...' : 'Send Reset Link'}
                              </Button>
                            </div>
                          </form>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FontAwesomeIcon icon={faEnvelope} className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                        <p className="text-zinc-400 mb-6">
                          We've sent a password reset link to{' '}
                          <span className="text-white">{forgotPasswordEmail}</span>
                        </p>
                        <Button
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmailSent(false);
                          }}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-12"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export { Auth };
export default Auth;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import {
  ArrowLeft01Icon,
  Mail01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffIcon,
  Rocket01Icon,
} from 'hugeicons-react';
import { Gauge } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { oauthFlags } from '@/config/featureFlags';
import { getErrorMessage } from '@/types';

const MobileAuth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { trackEvent } = useAnalytics();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSocialLogin = async (provider: 'google' | 'github' | 'discord') => {
    setIsLoading(true);
    trackEvent('login_started', { method: 'social', provider });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
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
      navigate('/dashboard');
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

  const socialProviders = [
    ...(oauthFlags.enableGoogle
      ? [{ id: 'google' as const, icon: faGoogle, label: 'Google', bgColor: 'bg-gray-900' }]
      : []),
    ...(oauthFlags.enableGithub
      ? [{ id: 'github' as const, icon: faGithub, label: 'GitHub', bgColor: 'bg-gray-900' }]
      : []),
    ...(oauthFlags.enableDiscord
      ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord', bgColor: 'bg-gray-900' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background Gradients - REMOVED for Cyber Brutalist */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[40%] -left-[30%] w-[90%] h-[60%] bg-red-600/15 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] -right-[30%] w-[70%] h-[50%] bg-red-600/10 blur-[100px] rounded-full" />
            </div> */}

      {/* Header */}
      <header className="relative z-20 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft01Icon className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 py-6 flex flex-col">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gauge className="h-8 w-8 text-red-600" />
            <span className="text-3xl font-black tracking-tighter uppercase italic text-white">
              Fast<span className="text-red-600">lytics</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 font-mono uppercase">
            {activeTab === 'signup' ? 'Create your account' : 'Sign in to continue'}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex bg-black border-2 border-white/10 p-1 mb-6">
          {(['signup', 'signin'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all',
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              )}
            >
              {tab === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          ))}
        </div>

        {/* Auth Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'signup' ? (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col"
            >
              {!isSignUpSuccess ? (
                <>
                  {/* Social Login Buttons */}
                  <div className="space-y-3 mb-6">
                    {socialProviders.map((provider) => (
                      <motion.button
                        key={provider.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSocialLogin(provider.id)}
                        disabled={isLoading}
                        className={cn(
                          'w-full flex items-center justify-center gap-3 py-4',
                          'bg-black border-2 border-white/10 hover:border-white/30 active:bg-white active:text-black',
                          'transition-all disabled:opacity-50'
                        )}
                      >
                        <FontAwesomeIcon
                          icon={provider.icon}
                          className="w-5 h-5 text-gray-400 group-active:text-black"
                        />
                        <span className="font-bold uppercase tracking-wider">
                          Continue with {provider.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-xs font-bold uppercase text-gray-600">
                      Or sign up with email
                    </span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>

                  {/* Email Sign Up Form */}
                  <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Email
                      </label>
                      <div className="relative">
                        <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          placeholder="NAME@EXAMPLE.COM"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className={cn(
                            'w-full bg-black border-2 border-white/20',
                            'pl-12 pr-4 py-4 text-white placeholder:text-gray-700 font-bold uppercase',
                            'focus:outline-none focus:border-red-600',
                            'transition-all disabled:opacity-50'
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Password
                      </label>
                      <div className="relative">
                        <LockPasswordIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className={cn(
                            'w-full bg-black border-2 border-white/20',
                            'pl-12 pr-12 py-4 text-white placeholder:text-gray-700 font-bold uppercase',
                            'focus:outline-none focus:border-red-600',
                            'transition-all disabled:opacity-50'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <ViewOffIcon className="w-5 h-5" />
                          ) : (
                            <ViewIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <LockPasswordIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className={cn(
                            'w-full bg-black border-2 border-white/20',
                            'pl-12 pr-12 py-4 text-white placeholder:text-gray-700 font-bold uppercase',
                            'focus:outline-none focus:border-red-600',
                            'transition-all disabled:opacity-50'
                          )}
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                      className={cn(
                        'w-full bg-red-600 text-white font-black uppercase tracking-wider',
                        'py-4 mt-2 border-2 border-transparent hover:border-white',
                        'active:bg-red-700 transition-all disabled:opacity-50'
                      )}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </motion.button>
                  </form>

                  {/* Terms */}
                  <p className="text-center text-[10px] text-gray-600 mt-auto">
                    By continuing, you agree to our{' '}
                    <Link to="/terms-of-service" className="text-gray-400 underline">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-gray-400 underline">
                      Privacy Policy
                    </Link>
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-6 bg-black border-2 border-white/10 space-y-6 my-8"
                >
                  <div className="w-20 h-20 bg-red-600/10 flex items-center justify-center mb-2">
                    <Mail01Icon className="w-10 h-10 text-red-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                      Check your inbox
                    </h3>
                    <p className="text-gray-400 text-sm">
                      We've sent a verification link to
                      <br />
                      <span className="text-white font-bold">{email}</span>
                    </p>
                  </div>
                  <div className="w-full h-px bg-gray-800 my-4" />
                  <p className="text-xs text-gray-500 text-center font-mono uppercase">
                    Please click the link in the email to verify your account and sign in.
                  </p>
                  <button
                    className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-black border-2 border-white/20 hover:border-white/50 transition-all font-bold uppercase tracking-wider text-sm"
                    onClick={() => {
                      setIsSignUpSuccess(false);
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <ArrowLeft01Icon className="w-4 h-4" />
                    Back to Sign Up
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Social Login - Compact for Sign In */}
              <div className="flex gap-3 mb-6">
                {socialProviders.map((provider) => (
                  <motion.button
                    key={provider.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSocialLogin(provider.id)}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 flex items-center justify-center py-4',
                      'bg-black border-2 border-white/10 hover:border-white/30 active:bg-white active:text-black',
                      'transition-all disabled:opacity-50'
                    )}
                  >
                    <FontAwesomeIcon
                      icon={provider.icon}
                      className="w-5 h-5 text-gray-400 group-active:text-black"
                    />
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs font-bold uppercase text-gray-600">
                  Or continue with email
                </span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Email
                  </label>
                  <div className="relative">
                    <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      placeholder="NAME@EXAMPLE.COM"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className={cn(
                        'w-full bg-black border-2 border-white/20',
                        'pl-12 pr-4 py-4 text-white placeholder:text-gray-700 font-bold uppercase',
                        'focus:outline-none focus:border-red-600',
                        'transition-all disabled:opacity-50'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Password
                  </label>
                  <div className="relative">
                    <LockPasswordIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className={cn(
                        'w-full bg-black border-2 border-white/20',
                        'pl-12 pr-12 py-4 text-white placeholder:text-gray-700 font-bold uppercase',
                        'focus:outline-none focus:border-red-600',
                        'transition-all disabled:opacity-50'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <ViewOffIcon className="w-5 h-5" />
                      ) : (
                        <ViewIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className={cn(
                    'w-full bg-red-600 text-white font-black uppercase tracking-wider',
                    'py-4 mt-2 border-2 border-transparent hover:border-white',
                    'active:bg-red-700 transition-all disabled:opacity-50'
                  )}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </motion.button>
              </form>

              {/* Forgot Password */}
              <button className="text-center text-sm text-gray-500 mt-4 active:text-gray-300">
                Forgot your password?
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Safe Area */}
      <div className="h-6" />
    </div>
  );
};

export { MobileAuth };
export default MobileAuth;

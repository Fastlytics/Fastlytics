import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  PasswordRequirements,
  getPasswordValidationMessage,
  isPasswordValid,
} from '@/components/auth/PasswordRequirements';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { oauthFlags } from '@/config/featureFlags';
import { getErrorMessage } from '@/types';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════
   MOBILE AUTH — Redesigned to match Landing design language
   ═══════════════════════════════════════════════════════════════ */

/* ─── Icons ─── */
const MailIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.78 0 1.53-.09 2.24-.26" />
    <path d="M2 2l20 20" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const MobileAuth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
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
        provider,
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    if (!isPasswordValid(password)) {
      toast.error(getPasswordValidationMessage());
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

  const socialProviders = [
    ...(oauthFlags.enableGoogle
      ? [{ id: 'google' as const, icon: faGoogle, label: 'Google' }]
      : []),
    ...(oauthFlags.enableGithub
      ? [{ id: 'github' as const, icon: faGithub, label: 'GitHub' }]
      : []),
    ...(oauthFlags.enableDiscord
      ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord' }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-white antialiased">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[30%] left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-red-500/[0.04] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center px-5 pt-5 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-white/40 transition-colors hover:text-white/80"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-[13px] font-medium">Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col px-5 py-6">
        {/* Logo & Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
            {showForgotPassword
              ? resetEmailSent
                ? 'Check your email'
                : 'Reset password'
              : activeTab === 'signup'
                ? 'Create your account'
                : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-[14px] text-white/40">
            {showForgotPassword
              ? resetEmailSent
                ? `We sent a link to ${forgotPasswordEmail}`
                : 'Enter your email to receive a reset link'
              : activeTab === 'signup'
                ? 'Start analyzing races with advanced telemetry'
                : 'Sign in to access your race desk'}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        {!showForgotPassword && !isSignUpSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative flex border-b border-white/[0.06]">
              {(['signup', 'signin'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative flex-1 pb-3 text-[14px] font-medium transition-colors',
                    activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  {tab === 'signup' ? 'Sign Up' : 'Sign In'}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="mobile-auth-tab"
                      className="absolute bottom-0 left-0 right-0 h-px bg-white"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Auth Content */}
        <AnimatePresence mode="wait">
          {showForgotPassword ? (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {resetEmailSent ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <MailIcon className="text-emerald-400" />
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                      setForgotPasswordEmail('');
                    }}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-white/60">Email</label>
                    <div className="relative">
                      <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                        disabled={isSendingReset}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                  >
                    {isSendingReset ? 'Sending...' : 'Send reset link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to sign in
                  </button>
                </form>
              )}
            </motion.div>
          ) : activeTab === 'signup' ? (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {!isSignUpSuccess ? (
                <>
                  {/* Social Login */}
                  <div className="space-y-3 mb-6">
                    {socialProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleSocialLogin(provider.id)}
                        disabled={isLoading}
                        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={provider.icon} className="text-white/60" />
                        Continue with {provider.label}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[12px] font-medium text-white/25">or</span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  {/* Email Sign Up Form */}
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-white/60">Email</label>
                      <div className="relative">
                        <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-white/60">Password</label>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      <PasswordRequirements password={password} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-white/60">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>

                  <p className="mt-auto pt-6 text-center text-[11px] leading-relaxed text-white/25">
                    By continuing, you agree to our{' '}
                    <Link
                      to="/terms-of-service"
                      className="text-white/40 hover:text-white/60 transition-colors"
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/privacy-policy"
                      className="text-white/40 hover:text-white/60 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </>
              ) : (
                /* Sign Up Success */
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-1 flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <MailIcon className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Check your inbox</h3>
                  <p className="mt-1 text-[14px] text-white/40">
                    We sent a verification link to <span className="text-white/60">{email}</span>
                  </p>
                  <button
                    onClick={() => {
                      setIsSignUpSuccess(false);
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to sign up
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* Social Login - Compact */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {socialProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSocialLogin(provider.id)}
                    disabled={isLoading}
                    className="flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={provider.icon} className="text-white/60" />
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[12px] font-medium text-white/25">or</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Email Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-white/60">Email</label>
                  <div className="relative">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-white/60">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotPasswordEmail(email);
                      }}
                      className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  {!isLoading && <ArrowRightIcon />}
                </button>
              </form>
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

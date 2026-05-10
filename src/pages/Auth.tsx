import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  PasswordRequirements,
  getPasswordValidationMessage,
  isPasswordValid,
} from '@/components/auth/PasswordRequirements';
import { useAuth } from '@/contexts/AuthContext';
import { oauthFlags } from '@/config/featureFlags';
import { getErrorMessage } from '@/types';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/layout/SEO';
import { request } from '@/lib/api-client';

/* ═══════════════════════════════════════════════════════════════
   AUTH PAGE — Redesigned to match Landing design language
   Clean, premium, dark — inspired by Linear/Vercel/Raycast
   ═══════════════════════════════════════════════════════════════ */

/* ─── Left Panel: Race Desk Preview ─── */
const RaceDeskPreview = () => {
  const drivers = [
    { pos: 1, code: 'NOR', team: 'McLaren', gap: 'Leader', color: '#ff8700' },
    { pos: 2, code: 'LEC', team: 'Ferrari', gap: '+0.732', color: '#ff2800' },
    { pos: 3, code: 'PIA', team: 'McLaren', gap: '+1.247', color: '#ff8700' },
    { pos: 4, code: 'RUS', team: 'Mercedes', gap: '+1.892', color: '#6c779f' },
  ];

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-[300px] rounded-full bg-orange-500/[0.03] blur-[100px]" />

      {/* Floating Race Desk Card */}
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-[480px]"
      >
        {/* Glow behind card */}
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-2xl" />

        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-white/10" />
                <div className="size-2.5 rounded-full bg-white/10" />
                <div className="size-2.5 rounded-full bg-white/10" />
              </div>
              <div className="h-4 w-px bg-white/[0.06]" />
              <span className="text-[11px] font-medium text-white/30">Race Desk</span>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>

          <div className="p-4">
            {/* Timing tower */}
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
              Race Positions
            </div>
            <div className="space-y-0">
              {drivers.map((row, i) => (
                <m.div
                  key={row.code}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-b-0"
                >
                  <span className="w-5 text-[11px] tabular-nums text-white/25">{row.pos}</span>
                  <span
                    className="h-4 w-[3px] rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="flex-1 text-[13px] font-semibold text-white">{row.code}</span>
                  <span className="text-[11px] tabular-nums text-white/40">{row.gap}</span>
                </m.div>
              ))}
            </div>

            {/* Mini telemetry bars */}
            <div className="mt-4 border-t border-white/[0.04] pt-4">
              <div className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-white/25">
                Telemetry
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Throttle', value: 100, color: 'bg-emerald-500' },
                  { label: 'Brake', value: 0, color: 'bg-red-500' },
                  { label: 'Speed', value: 82, color: 'bg-blue-500' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-12 text-[10px] text-white/30">{item.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <m.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.8 + i * 0.15, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tagline below card */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-10 text-center"
        >
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            Race intelligence, <span className="text-white/40">simplified</span>
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-white/40">
            Telemetry, strategy, pace and championship context wired into one live race desk.
          </p>
        </m.div>
      </m.div>
    </div>
  );
};

/* ─── Icon Components ─── */
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

const CheckIcon = ({ className }: { className?: string }) => (
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
    <path d="M20 6 9 17l-5-5" />
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

/* ─── Main Auth Component ─── */
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
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(isResetMode);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>(
    isResetMode ? 'signin' : 'signup'
  );
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { trackEvent } = useAnalytics();
  const checkoutRedirectStarted = useRef(false);

  const returnTo = searchParams.get('returnTo');
  const checkoutTier = searchParams.get('checkoutTier');
  const checkoutInterval = searchParams.get('checkoutInterval') || 'monthly';
  const authTitle =
    isResetPasswordMode && showForgotPassword
      ? 'Reset Password'
      : activeTab === 'signup'
        ? 'Create Account'
        : 'Sign In';
  const authDescription =
    isResetPasswordMode && showForgotPassword
      ? 'Reset your Fastlytics password and get back to your race desk.'
      : activeTab === 'signup'
        ? 'Create a Fastlytics account to save favorites and unlock a personalized race desk.'
        : 'Sign in to Fastlytics to access your race desk, saved teams, and account settings.';

  // Redirect logged-in users
  useEffect(() => {
    if (!loading && user) {
      if (checkoutTier && !checkoutRedirectStarted.current) {
        checkoutRedirectStarted.current = true;
        setIsLoading(true);

        const productMap: Record<string, Record<string, string>> = {
          pro: {
            monthly: 'pdt_0NePm9aNHnQh5KxB7bsJM',
            yearly: 'pdt_0NePm9bSX5fcBlgltYiIe',
          },
          ultra: {
            monthly: 'pdt_0NePm9cHvDbArb2hZoCjl',
            yearly: 'pdt_0NePm9emnFj4lzDXEbwhH',
          },
        };

        const productId = productMap[checkoutTier]?.[checkoutInterval];

        if (!productId || checkoutTier === 'ultra') {
          navigate('/pricing', { replace: true });
          return;
        }

        request<{ checkout_url: string }>('/api/payments/checkout', {
          method: 'POST',
          body: JSON.stringify({
            product_id: productId,
            customer_email: user.email || '',
            customer_name: profile?.full_name || user.email?.split('@')[0] || 'User',
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard?checkout=success`,
            cancel_url: `${window.location.origin}/pricing?checkout=cancelled`,
          }),
        })
          .then((res) => {
            window.location.assign(res.checkout_url);
          })
          .catch((error: unknown) => {
            toast.error(getErrorMessage(error));
            navigate('/pricing?checkout=failed', { replace: true });
          });

        return;
      }

      if (profile && !profile.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(returnTo || '/dashboard', { replace: true });
      }
    }
  }, [checkoutInterval, checkoutTier, loading, navigate, profile, returnTo, user]);

  // Check for password reset token in URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })
        .then(() => {
          setIsResetPasswordMode(true);
          setShowForgotPassword(true);
          window.history.replaceState(null, '', '/auth?reset=true');
        });
    }
  }, []);

  const handleSocialLogin = async (provider: 'google' | 'github' | 'discord') => {
    setIsLoading(true);
    trackEvent('login_started', { method: 'social', provider });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth${window.location.search}`,
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
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
    <div className="flex min-h-screen w-full bg-[#09090b] text-white antialiased">
      <SEO title={authTitle} description={authDescription} noIndex />
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2">
        <RaceDeskPreview />
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
              {isResetPasswordMode && showForgotPassword
                ? 'Set new password'
                : activeTab === 'signup'
                  ? 'Create your account'
                  : 'Welcome back'}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-white/40">
              {isResetPasswordMode && showForgotPassword
                ? 'Enter your new password below'
                : activeTab === 'signup'
                  ? 'Start analyzing races with advanced telemetry'
                  : 'Sign in to access your race desk'}
            </p>
          </m.div>

          {/* Tab Switcher */}
          {!showForgotPassword && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <div className="relative flex border-b border-white/[0.06]">
                {(['signup', 'signin'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsSignUpSuccess(false);
                    }}
                    className={cn(
                      'relative flex-1 pb-3 text-[14px] font-medium transition-colors',
                      activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'
                    )}
                  >
                    {tab === 'signup' ? 'Sign Up' : 'Sign In'}
                    {activeTab === tab && (
                      <m.div
                        layoutId="auth-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-px bg-white"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </m.div>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {showForgotPassword ? (
              <m.div
                key="forgot-password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {isResetPasswordMode ? (
                  /* Reset Password Form */
                  <form onSubmit={handleUpdatePassword} className="space-y-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="field-new-password-5"
                        className="text-[13px] font-medium text-white/60"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          id="field-new-password-5"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
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
                      <label
                        htmlFor="reset-confirm-password"
                        className="text-[13px] font-medium text-white/60"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          id="reset-confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
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
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                ) : resetEmailSent ? (
                  /* Reset Email Sent State */
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <MailIcon className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Check your email</h3>
                    <p className="mt-1 text-[14px] text-white/40">
                      We sent a reset link to{' '}
                      <span className="text-white/60">{forgotPasswordEmail}</span>
                    </p>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setForgotPasswordEmail('');
                      }}
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Back to sign in
                    </button>
                  </div>
                ) : (
                  /* Forgot Password Form */
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="field-email-6"
                        className="text-[13px] font-medium text-white/60"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          id="field-email-6"
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
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                        }}
                        className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingReset}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                      >
                        {isSendingReset ? 'Sending...' : 'Send link'}
                      </button>
                    </div>
                  </form>
                )}
              </m.div>
            ) : activeTab === 'signup' ? (
              <m.div
                key="signup"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                {!isSignUpSuccess ? (
                  <div className="space-y-6">
                    {/* Social Login */}
                    <div className="space-y-3">
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
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <span className="text-[12px] font-medium text-white/25">or</span>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>

                    {/* Email Sign Up Form */}
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="field-email-7"
                          className="text-[13px] font-medium text-white/60"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                          <input
                            id="field-email-7"
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
                        <label
                          htmlFor="field-password-8"
                          className="text-[13px] font-medium text-white/60"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                          <input
                            id="field-password-8"
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
                        <label
                          htmlFor="signup-confirm-password"
                          className="text-[13px] font-medium text-white/60"
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                          <input
                            id="signup-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
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

                    <p className="text-center text-[12px] leading-relaxed text-white/25">
                      By continuing, you agree to our{' '}
                      <a
                        href="/terms-of-service"
                        className="text-white/40 hover:text-white/60 transition-colors"
                      >
                        Terms
                      </a>{' '}
                      and{' '}
                      <a
                        href="/privacy-policy"
                        className="text-white/40 hover:text-white/60 transition-colors"
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                ) : (
                  /* Sign Up Success */
                  <m.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center"
                  >
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
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
                      <ArrowLeftIcon className="size-4" />
                      Back to sign up
                    </button>
                  </m.div>
                )}
              </m.div>
            ) : (
              <m.div
                key="signin"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  {/* Social Login */}
                  <div className="space-y-3">
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
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[12px] font-medium text-white/25">or</span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  {/* Email Sign In Form */}
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="field-email-9"
                        className="text-[13px] font-medium text-white/60"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          id="field-email-9"
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
                        <label
                          htmlFor="signin-password"
                          className="text-[13px] font-medium text-white/60"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setForgotPasswordEmail(email);
                          }}
                          className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                        <input
                          id="signin-password"
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
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;

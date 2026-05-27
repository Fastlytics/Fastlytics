import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { m } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/types';
import { SEO } from '@/components/layout/SEO';
import {
  PasswordRequirements,
  isPasswordValid,
  getPasswordValidationMessage,
} from '@/components/auth/PasswordRequirements';
import { oauthFlags } from '@/config/featureFlags';
import { request } from '@/lib/api-client';
import { AuthIllustration } from './auth/AuthIllustration';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from './auth/icons';
import { InputField } from './auth/fields';

const socialProviders = [
  ...(oauthFlags.enableGoogle ? [{ id: 'google' as const, icon: faGoogle, label: 'Google' }] : []),
  ...(oauthFlags.enableDiscord
    ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord' }]
    : []),
];

type ViewState = 'login' | 'forgot' | 'forgot-sent' | 'reset-password';

const Login = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<ViewState>(isResetMode ? 'reset-password' : 'login');

  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { trackEvent } = useAnalytics();
  const checkoutRedirectStarted = useRef(false);

  const returnTo = searchParams.get('returnTo');
  const checkoutTier = searchParams.get('checkoutTier');
  const checkoutInterval = searchParams.get('checkoutInterval') || 'monthly';

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
          .then((response) => {
            window.location.assign(response.checkout_url);
          })
          .catch((error: unknown) => {
            toast.error(getErrorMessage(error));
            navigate('/pricing?checkout=failed', { replace: true });
          })
          .finally(() => {
            setIsLoading(false);
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

  // Handle password recovery token from URL hash
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
          setView('reset-password');
          window.history.replaceState(null, '', '/login?reset=true');
        })
        .catch(() => {
          toast.error('Invalid or expired reset link. Please request a new one.');
        });
    }
  }, []);

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    setIsLoading(true);
    trackEvent('login_started', { method: 'social', provider });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/login${window.location.search}`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });
      if (error) throw error;
      setView('forgot-sent');
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const getTitle = () => {
    switch (view) {
      case 'forgot':
      case 'forgot-sent':
        return 'Reset password';
      case 'reset-password':
        return 'Set new password';
      default:
        return 'Welcome back';
    }
  };

  const getDescription = () => {
    switch (view) {
      case 'forgot':
        return "Enter your email and we'll send you a reset link.";
      case 'forgot-sent':
        return 'Check your inbox for the reset link.';
      case 'reset-password':
        return 'Enter your new password below.';
      default:
        return 'Sign in to access your race desk.';
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#09090b] text-white antialiased">
      <SEO
        title={getTitle()}
        description="Sign in to Fastlytics to access your race desk, saved teams, and account settings."
        noIndex
      />

      {/* Left panel — illustration */}
      <div className="hidden lg:flex lg:w-1/2">
        <AuthIllustration variant="login" />
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <span className="text-[13px] font-medium">Back to home</span>
            </Link>
            <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.03em] text-white">
              {getTitle()}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/40">{getDescription()}</p>
          </m.div>

          <m.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {view === 'login' && (
              <div className="space-y-6">
                {/* Social providers */}
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

                {/* Email form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <InputField
                    id="login-email"
                    label="Email"
                    icon={
                      <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    }
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={setEmail}
                    disabled={isLoading}
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="text-[13px] font-medium text-white/60"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setView('forgot');
                        }}
                        className="text-[12px] text-white/30 transition-colors hover:text-white/60"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        id="login-password"
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
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

                {/* Footer */}
                <p className="text-center text-[13px] text-white/40">
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-white transition-colors hover:text-white/80"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <InputField
                  id="forgot-email"
                  label="Email"
                  icon={
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                  }
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={setForgotEmail}
                  disabled={isLoading}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>
              </form>
            )}

            {view === 'forgot-sent' && (
              <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <MailIcon className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Check your email</h3>
                <p className="mt-1 text-[14px] text-white/40">
                  We sent a reset link to <span className="text-white/60">{forgotEmail}</span>
                </p>
                <button
                  onClick={() => setView('login')}
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Back to sign in
                </button>
              </div>
            )}

            {view === 'reset-password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reset-new-password"
                    className="text-[13px] font-medium text-white/60"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      id="reset-new-password"
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
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
            )}
          </m.div>
        </div>
      </div>
    </div>
  );
};

export default Login;

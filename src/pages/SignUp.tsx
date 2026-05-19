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
import { AuthIllustration } from './auth/AuthIllustration';
import { MailIcon, ArrowRightIcon } from './auth/icons';
import { InputField, PasswordField } from './auth/fields';

const socialProviders = [
  ...(oauthFlags.enableGoogle ? [{ id: 'google' as const, icon: faGoogle, label: 'Google' }] : []),
  ...(oauthFlags.enableDiscord
    ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord' }]
    : []),
];

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

type FormAction =
  | { type: 'setEmail'; value: string }
  | { type: 'setPassword'; value: string }
  | { type: 'setConfirmPassword'; value: string }
  | { type: 'reset' };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.value };
    case 'setPassword':
      return { ...state, password: action.value };
    case 'setConfirmPassword':
      return { ...state, confirmPassword: action.value };
    case 'reset':
      return { email: '', password: '', confirmPassword: '' };
    default:
      return state;
  }
};

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const [form, dispatch] = useReducer(formReducer, {
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
        // Redirect to login page which handles checkout flow
        navigate(`/login?checkoutTier=${checkoutTier}&checkoutInterval=${checkoutInterval}`, {
          replace: true,
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

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    setIsLoading(true);
    trackEvent('signup_started', { method: 'social', provider });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/signup${window.location.search}`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isPasswordValid(form.password)) {
      toast.error(getPasswordValidationMessage());
      return;
    }

    setIsLoading(true);
    trackEvent('signup_started', { method: 'email' });

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      setIsSuccess(true);
      setIsLoading(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#09090b] text-white antialiased">
      <SEO
        title="Sign Up"
        description="Create a Fastlytics account to save favorites and unlock a personalized race desk with telemetry, strategy, and championship context."
        noIndex
      />

      {/* Left panel — illustration */}
      <div className="hidden lg:flex lg:w-1/2">
        <AuthIllustration variant="signup" />
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          {/* Logo + heading */}
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
              Create your account
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/40">
              Start analyzing races with advanced telemetry and live data.
            </p>
          </m.div>

          {!isSuccess ? (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
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
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[12px] font-medium text-white/25">or</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <InputField
                  id="signup-email"
                  label="Email"
                  icon={
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                  }
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(value) => dispatch({ type: 'setEmail', value })}
                  disabled={isLoading}
                />
                <PasswordField
                  id="signup-password"
                  label="Password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(value) => dispatch({ type: 'setPassword', value })}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                />
                <PasswordRequirements password={form.password} />
                <PasswordField
                  id="signup-confirm-password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(value) => dispatch({ type: 'setConfirmPassword', value })}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                  {!isLoading && <ArrowRightIcon />}
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 space-y-3">
                <p className="text-center text-[12px] leading-relaxed text-white/25">
                  By continuing, you agree to our{' '}
                  <Link
                    to="/terms-of-service"
                    className="text-white/40 transition-colors hover:text-white/60"
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy-policy"
                    className="text-white/40 transition-colors hover:text-white/60"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
                <p className="text-center text-[13px] text-white/40">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-white transition-colors hover:text-white/80"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </m.div>
          ) : (
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
                We sent a verification link to <span className="text-white/60">{form.email}</span>
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  dispatch({ type: 'reset' });
                }}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                Back to sign up
              </button>
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;

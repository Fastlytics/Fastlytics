// knip-ignore
import React, { useEffect, useReducer, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/types';
import { SEO } from '@/components/layout/SEO';
import { request } from '@/lib/api-client';
import AuthContent, {
  RaceDeskPreview,
  getPasswordValidationMessage,
  isPasswordValid,
} from './auth/AuthContent';

type AuthFlags = {
  showPassword: boolean;
  showForgotPassword: boolean;
  resetEmailSent: boolean;
  isResetPasswordMode: boolean;
  isSignUpSuccess: boolean;
};

type AuthFlagsAction =
  | { type: 'TOGGLE_SHOW_PASSWORD' }
  | { type: 'SET_SHOW_FORGOT_PASSWORD'; value: boolean }
  | { type: 'SET_RESET_EMAIL_SENT'; value: boolean }
  | { type: 'SET_IS_RESET_PASSWORD_MODE'; value: boolean }
  | { type: 'SET_IS_SIGN_UP_SUCCESS'; value: boolean }
  | { type: 'OPEN_FORGOT_PASSWORD' }
  | { type: 'CLOSE_FORGOT_PASSWORD' }
  | { type: 'RESET_SIGN_UP' };

function authFlagsReducer(state: AuthFlags, action: AuthFlagsAction): AuthFlags {
  switch (action.type) {
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'SET_SHOW_FORGOT_PASSWORD':
      return { ...state, showForgotPassword: action.value };
    case 'SET_RESET_EMAIL_SENT':
      return { ...state, resetEmailSent: action.value };
    case 'SET_IS_RESET_PASSWORD_MODE':
      return { ...state, isResetPasswordMode: action.value };
    case 'SET_IS_SIGN_UP_SUCCESS':
      return { ...state, isSignUpSuccess: action.value };
    case 'OPEN_FORGOT_PASSWORD':
      return { ...state, showForgotPassword: true };
    case 'CLOSE_FORGOT_PASSWORD':
      return { ...state, showForgotPassword: false, resetEmailSent: false };
    case 'RESET_SIGN_UP':
      return { ...state, isSignUpSuccess: false };
    default:
      return state;
  }
}

type AuthFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  forgotPasswordEmail: string;
  activeTab: 'signup' | 'signin';
};

type AuthFormAction =
  | { type: 'setEmail'; value: string }
  | { type: 'setPassword'; value: string }
  | { type: 'setConfirmPassword'; value: string }
  | { type: 'setForgotPasswordEmail'; value: string }
  | { type: 'setActiveTab'; value: 'signup' | 'signin' }
  | { type: 'resetSignUp' };

const authFormReducer = (state: AuthFormState, action: AuthFormAction): AuthFormState => {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.value };
    case 'setPassword':
      return { ...state, password: action.value };
    case 'setConfirmPassword':
      return { ...state, confirmPassword: action.value };
    case 'setForgotPasswordEmail':
      return { ...state, forgotPasswordEmail: action.value };
    case 'setActiveTab':
      return { ...state, activeTab: action.value };
    case 'resetSignUp':
      return { ...state, email: '', password: '', confirmPassword: '' };
    default:
      return state;
  }
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';
  const [formState, dispatchForm] = useReducer(authFormReducer, {
    email: '',
    password: '',
    confirmPassword: '',
    forgotPasswordEmail: '',
    activeTab: (isResetMode ? 'signin' : 'signup') as 'signup' | 'signin',
  });
  const { email, password, confirmPassword, forgotPasswordEmail, activeTab } = formState;
  const [isLoading, setIsLoading] = useReducer((_: boolean, value: boolean) => value, false);
  const [isSendingReset, setIsSendingReset] = useReducer(
    (_: boolean, value: boolean) => value,
    false
  );
  const [flags, dispatchFlags] = useReducer(authFlagsReducer, {
    showPassword: false,
    showForgotPassword: false,
    resetEmailSent: false,
    isResetPasswordMode: isResetMode,
    isSignUpSuccess: false,
  } as AuthFlags);
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { trackEvent } = useAnalytics();
  const checkoutRedirectStarted = useRef(false);

  const returnTo = searchParams.get('returnTo');
  const checkoutTier = searchParams.get('checkoutTier');
  const checkoutInterval = searchParams.get('checkoutInterval') || 'monthly';
  const authTitle =
    flags.isResetPasswordMode && flags.showForgotPassword
      ? 'Reset Password'
      : activeTab === 'signup'
        ? 'Create Account'
        : 'Sign In';
  const authDescription =
    flags.isResetPasswordMode && flags.showForgotPassword
      ? 'Reset your Fastlytics password and get back to your race desk.'
      : activeTab === 'signup'
        ? 'Create a Fastlytics account to save favorites and unlock a personalized race desk.'
        : 'Sign in to Fastlytics to access your race desk, saved teams, and account settings.';

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
          dispatchFlags({ type: 'SET_IS_RESET_PASSWORD_MODE', value: true });
          dispatchFlags({ type: 'SET_SHOW_FORGOT_PASSWORD', value: true });
          window.history.replaceState(null, '', '/auth?reset=true');
        })
        .catch(() => {
          toast.error('Invalid or expired reset link. Please request a new one.');
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

  const handleEmailSignUp = async (event: React.FormEvent) => {
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
      dispatchFlags({ type: 'SET_IS_SIGN_UP_SUCCESS', value: true });
      setIsLoading(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
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
      dispatchFlags({ type: 'SET_RESET_EMAIL_SENT', value: true });
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setIsSendingReset(false);
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

  return (
    <div className="flex min-h-screen w-full bg-[#09090b] text-white antialiased">
      <SEO title={authTitle} description={authDescription} noIndex />
      <div className="hidden lg:flex lg:w-1/2">
        <RaceDeskPreview />
      </div>
      <AuthContent
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={flags.showPassword}
        showForgotPassword={flags.showForgotPassword}
        forgotPasswordEmail={forgotPasswordEmail}
        isLoading={isLoading}
        isSendingReset={isSendingReset}
        resetEmailSent={flags.resetEmailSent}
        isResetPasswordMode={flags.isResetPasswordMode}
        isSignUpSuccess={flags.isSignUpSuccess}
        activeTab={activeTab}
        onEmailChange={(value) => dispatchForm({ type: 'setEmail', value })}
        onPasswordChange={(value) => dispatchForm({ type: 'setPassword', value })}
        onConfirmPasswordChange={(value) => dispatchForm({ type: 'setConfirmPassword', value })}
        onShowPasswordToggle={() => dispatchFlags({ type: 'TOGGLE_SHOW_PASSWORD' })}
        onShowForgotPasswordChange={(value) =>
          dispatchFlags({ type: 'SET_SHOW_FORGOT_PASSWORD', value })
        }
        onForgotPasswordEmailChange={(value) =>
          dispatchForm({ type: 'setForgotPasswordEmail', value })
        }
        onSignUpSuccessChange={(value) => dispatchFlags({ type: 'SET_IS_SIGN_UP_SUCCESS', value })}
        onResetEmailSentChange={(value) => dispatchFlags({ type: 'SET_RESET_EMAIL_SENT', value })}
        onActiveTabChange={(value) => dispatchForm({ type: 'setActiveTab', value })}
        onResetPasswordSubmit={handleUpdatePassword}
        onForgotPasswordSubmit={handleForgotPassword}
        onEmailSignUpSubmit={handleEmailSignUp}
        onEmailSignInSubmit={handleEmailSignIn}
        onSocialLogin={handleSocialLogin}
        onResetToSignUp={() => {
          dispatchFlags({ type: 'RESET_SIGN_UP' });
          dispatchForm({ type: 'resetSignUp' });
        }}
        onBackToSignIn={() => {
          dispatchFlags({ type: 'CLOSE_FORGOT_PASSWORD' });
          dispatchForm({ type: 'setForgotPasswordEmail', value: '' });
        }}
        onPrepareForgotPassword={() => {
          dispatchFlags({ type: 'OPEN_FORGOT_PASSWORD' });
          dispatchForm({ type: 'setForgotPasswordEmail', value: email });
        }}
      />
    </div>
  );
};

export default Auth;

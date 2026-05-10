// knip-ignore
import React, { useEffect, useReducer, useRef, useState } from 'react';
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

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isLoading, setIsLoading] = useReducer((_: boolean, value: boolean) => value, false);
  const [isSendingReset, setIsSendingReset] = useReducer(
    (_: boolean, value: boolean) => value,
    false
  );
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
      setIsSignUpSuccess(true);
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
      setResetEmailSent(true);
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
        showPassword={showPassword}
        showForgotPassword={showForgotPassword}
        forgotPasswordEmail={forgotPasswordEmail}
        isLoading={isLoading}
        isSendingReset={isSendingReset}
        resetEmailSent={resetEmailSent}
        isResetPasswordMode={isResetPasswordMode}
        isSignUpSuccess={isSignUpSuccess}
        activeTab={activeTab}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onShowPasswordToggle={() => setShowPassword((value) => !value)}
        onShowForgotPasswordChange={setShowForgotPassword}
        onForgotPasswordEmailChange={setForgotPasswordEmail}
        onSignUpSuccessChange={setIsSignUpSuccess}
        onResetEmailSentChange={setResetEmailSent}
        onActiveTabChange={setActiveTab}
        onResetPasswordSubmit={handleUpdatePassword}
        onForgotPasswordSubmit={handleForgotPassword}
        onEmailSignUpSubmit={handleEmailSignUp}
        onEmailSignInSubmit={handleEmailSignIn}
        onSocialLogin={handleSocialLogin}
        onResetToSignUp={() => {
          setIsSignUpSuccess(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }}
        onBackToSignIn={() => {
          setShowForgotPassword(false);
          setResetEmailSent(false);
          setForgotPasswordEmail('');
        }}
        onPrepareForgotPassword={() => {
          setShowForgotPassword(true);
          setForgotPasswordEmail(email);
        }}
      />
    </div>
  );
};

export default Auth;

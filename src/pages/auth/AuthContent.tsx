import { AnimatePresence, m } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import {
  PasswordRequirements,
  isPasswordValid,
  getPasswordValidationMessage,
} from '@/components/auth/PasswordRequirements';
import { oauthFlags } from '@/config/featureFlags';
import { cn } from '@/lib/utils';

export { isPasswordValid, getPasswordValidationMessage };

export type AuthTab = 'signup' | 'signin';
export type SocialProvider = 'google' | 'github' | 'discord';

interface AuthContentProps {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showForgotPassword: boolean;
  forgotPasswordEmail: string;
  isLoading: boolean;
  isSendingReset: boolean;
  resetEmailSent: boolean;
  isResetPasswordMode: boolean;
  isSignUpSuccess: boolean;
  activeTab: AuthTab;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onShowForgotPasswordChange: (value: boolean) => void;
  onForgotPasswordEmailChange: (value: string) => void;
  onSignUpSuccessChange: (value: boolean) => void;
  onResetEmailSentChange: (value: boolean) => void;
  onActiveTabChange: (value: AuthTab) => void;
  onResetPasswordSubmit: (event: React.FormEvent) => void;
  onForgotPasswordSubmit: (event: React.FormEvent) => void;
  onEmailSignUpSubmit: (event: React.FormEvent) => void;
  onEmailSignInSubmit: (event: React.FormEvent) => void;
  onSocialLogin: (provider: SocialProvider) => void;
  onResetToSignUp: () => void;
  onBackToSignIn: () => void;
  onPrepareForgotPassword: () => void;
}

const socialProviders = [
  ...(oauthFlags.enableGoogle ? [{ id: 'google' as const, icon: faGoogle, label: 'Google' }] : []),
  ...(oauthFlags.enableGithub ? [{ id: 'github' as const, icon: faGithub, label: 'GitHub' }] : []),
  ...(oauthFlags.enableDiscord
    ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord' }]
    : []),
];

export function RaceDeskPreview() {
  const drivers = [
    { pos: 1, code: 'NOR', team: 'McLaren', gap: 'Leader', color: '#ff8700' },
    { pos: 2, code: 'LEC', team: 'Ferrari', gap: '+0.732', color: '#ff2800' },
    { pos: 3, code: 'PIA', team: 'McLaren', gap: '+1.247', color: '#ff8700' },
    { pos: 4, code: 'RUS', team: 'Mercedes', gap: '+1.892', color: '#6c779f' },
  ];

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-[300px] rounded-full bg-orange-500/[0.03] blur-[100px]" />

      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-[480px]"
      >
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-2xl" />

        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
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
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
              Race Positions
            </div>
            <div className="space-y-0">
              {drivers.map((row, index) => (
                <m.div
                  key={row.code}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.08, duration: 0.4 }}
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

            <div className="mt-4 border-t border-white/[0.04] pt-4">
              <div className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-white/25">
                Telemetry
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Throttle', value: 100, color: 'bg-emerald-500' },
                  { label: 'Brake', value: 0, color: 'bg-red-500' },
                  { label: 'Speed', value: 82, color: 'bg-blue-500' },
                ].map((item, index) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-12 text-[10px] text-white/30">{item.label}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <m.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.8 + index * 0.15, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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
}

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

export default function AuthContent(props: AuthContentProps) {
  const heading =
    props.isResetPasswordMode && props.showForgotPassword
      ? 'Set new password'
      : props.activeTab === 'signup'
        ? 'Create your account'
        : 'Welcome back';
  const subheading =
    props.isResetPasswordMode && props.showForgotPassword
      ? 'Enter your new password below'
      : props.activeTab === 'signup'
        ? 'Start analyzing races with advanced telemetry'
        : 'Sign in to access your race desk';

  return (
    <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
      <div className="w-full max-w-md">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">{heading}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/40">{subheading}</p>
        </m.div>

        {!props.showForgotPassword && (
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
                    props.onActiveTabChange(tab);
                    props.onSignUpSuccessChange(false);
                  }}
                  className={cn(
                    'relative flex-1 pb-3 text-[14px] font-medium transition-colors',
                    props.activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  {tab === 'signup' ? 'Sign Up' : 'Sign In'}
                  {props.activeTab === tab && (
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

        <AnimatePresence mode="wait">
          {props.showForgotPassword ? (
            <m.div
              key="forgot-password"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {props.isResetPasswordMode ? (
                <form onSubmit={props.onResetPasswordSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="field-new-password"
                      className="text-[13px] font-medium text-white/60"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        id="field-new-password"
                        type={props.showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={props.password}
                        onChange={(event) => props.onPasswordChange(event.target.value)}
                        required
                        disabled={props.isLoading}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={props.onShowPasswordToggle}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
                      >
                        {props.showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <PasswordRequirements password={props.password} />
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
                        type={props.showPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={props.confirmPassword}
                        onChange={(event) => props.onConfirmPasswordChange(event.target.value)}
                        required
                        disabled={props.isLoading}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={props.isLoading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                  >
                    {props.isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              ) : props.resetEmailSent ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <MailIcon className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Check your email</h3>
                  <p className="mt-1 text-[14px] text-white/40">
                    We sent a reset link to{' '}
                    <span className="text-white/60">{props.forgotPasswordEmail}</span>
                  </p>
                  <button
                    onClick={props.onBackToSignIn}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={props.onForgotPasswordSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="field-email-reset"
                      className="text-[13px] font-medium text-white/60"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        id="field-email-reset"
                        type="email"
                        placeholder="name@example.com"
                        value={props.forgotPasswordEmail}
                        onChange={(event) => props.onForgotPasswordEmailChange(event.target.value)}
                        required
                        disabled={props.isSendingReset}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        props.onShowForgotPasswordChange(false);
                        props.onResetEmailSentChange(false);
                      }}
                      className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={props.isSendingReset}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    >
                      {props.isSendingReset ? 'Sending...' : 'Send link'}
                    </button>
                  </div>
                </form>
              )}
            </m.div>
          ) : props.activeTab === 'signup' ? (
            <m.div
              key="signup"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              {!props.isSignUpSuccess ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {socialProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => props.onSocialLogin(provider.id)}
                        disabled={props.isLoading}
                        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={provider.icon} className="text-white/60" />
                        Continue with {provider.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[12px] font-medium text-white/25">or</span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  <form onSubmit={props.onEmailSignUpSubmit} className="space-y-4">
                    <InputField
                      id="signup-email"
                      label="Email"
                      icon={
                        <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      }
                      type="email"
                      placeholder="name@example.com"
                      value={props.email}
                      onChange={props.onEmailChange}
                      disabled={props.isLoading}
                    />
                    <PasswordField
                      id="signup-password"
                      label="Password"
                      placeholder="Create a password"
                      value={props.password}
                      onChange={props.onPasswordChange}
                      showPassword={props.showPassword}
                      onTogglePassword={props.onShowPasswordToggle}
                      disabled={props.isLoading}
                    />
                    <PasswordRequirements password={props.password} />
                    <PasswordField
                      id="signup-confirm-password"
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      value={props.confirmPassword}
                      onChange={props.onConfirmPasswordChange}
                      showPassword={props.showPassword}
                      onTogglePassword={props.onShowPasswordToggle}
                      disabled={props.isLoading}
                    />
                    <button
                      type="submit"
                      disabled={props.isLoading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    >
                      {props.isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>

                  <p className="text-center text-[12px] leading-relaxed text-white/25">
                    By continuing, you agree to our{' '}
                    <a
                      href="/terms-of-service"
                      className="text-white/40 transition-colors hover:text-white/60"
                    >
                      Terms
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy-policy"
                      className="text-white/40 transition-colors hover:text-white/60"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
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
                    We sent a verification link to{' '}
                    <span className="text-white/60">{props.email}</span>
                  </p>
                  <button
                    onClick={props.onResetToSignUp}
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
                <div className="space-y-3">
                  {socialProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => props.onSocialLogin(provider.id)}
                      disabled={props.isLoading}
                      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={provider.icon} className="text-white/60" />
                      Continue with {provider.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[12px] font-medium text-white/25">or</span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <form onSubmit={props.onEmailSignInSubmit} className="space-y-4">
                  <InputField
                    id="signin-email"
                    label="Email"
                    icon={
                      <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    }
                    type="email"
                    placeholder="name@example.com"
                    value={props.email}
                    onChange={props.onEmailChange}
                    disabled={props.isLoading}
                  />
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
                        onClick={props.onPrepareForgotPassword}
                        className="text-[12px] text-white/30 transition-colors hover:text-white/60"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        id="signin-password"
                        type={props.showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={props.password}
                        onChange={(event) => props.onPasswordChange(event.target.value)}
                        required
                        disabled={props.isLoading}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={props.onShowPasswordToggle}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
                      >
                        {props.showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={props.isLoading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                  >
                    {props.isLoading ? 'Signing in...' : 'Sign In'}
                    {!props.isLoading && <ArrowRightIcon />}
                  </button>
                </form>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-white/60">
        {label}
      </label>
      <div className="relative">
        {icon}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          disabled={disabled}
          className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  showPassword,
  onTogglePassword,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-white/60">
        {label}
      </label>
      <div className="relative">
        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          disabled={disabled}
          className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-10 text-[14px] text-white placeholder:text-white/20 outline-none transition-colors focus:border-red-500/50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

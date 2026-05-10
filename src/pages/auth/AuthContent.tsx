import { AnimatePresence, m } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  isPasswordValid,
  getPasswordValidationMessage,
} from '@/components/auth/PasswordRequirements';
import ForgotPasswordFlow from './ForgotPasswordFlow';
import SignUpForm from './SignUpForm';
import SignInForm from './SignInForm';

export { isPasswordValid, getPasswordValidationMessage };
export { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';

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
            <ForgotPasswordFlow
              password={props.password}
              confirmPassword={props.confirmPassword}
              forgotPasswordEmail={props.forgotPasswordEmail}
              isResetPasswordMode={props.isResetPasswordMode}
              resetEmailSent={props.resetEmailSent}
              showPassword={props.showPassword}
              isLoading={props.isLoading}
              isSendingReset={props.isSendingReset}
              onPasswordChange={props.onPasswordChange}
              onConfirmPasswordChange={props.onConfirmPasswordChange}
              onForgotPasswordEmailChange={props.onForgotPasswordEmailChange}
              onShowPasswordToggle={props.onShowPasswordToggle}
              onResetPasswordSubmit={props.onResetPasswordSubmit}
              onForgotPasswordSubmit={props.onForgotPasswordSubmit}
              onBackToSignIn={props.onBackToSignIn}
              onCancel={() => {
                props.onShowForgotPasswordChange(false);
                props.onResetEmailSentChange(false);
              }}
            />
          ) : props.activeTab === 'signup' ? (
            <SignUpForm
              email={props.email}
              password={props.password}
              confirmPassword={props.confirmPassword}
              showPassword={props.showPassword}
              isLoading={props.isLoading}
              isSignUpSuccess={props.isSignUpSuccess}
              onEmailChange={props.onEmailChange}
              onPasswordChange={props.onPasswordChange}
              onConfirmPasswordChange={props.onConfirmPasswordChange}
              onShowPasswordToggle={props.onShowPasswordToggle}
              onEmailSignUpSubmit={props.onEmailSignUpSubmit}
              onSocialLogin={props.onSocialLogin}
              onResetToSignUp={props.onResetToSignUp}
            />
          ) : (
            <SignInForm
              email={props.email}
              password={props.password}
              showPassword={props.showPassword}
              isLoading={props.isLoading}
              onEmailChange={props.onEmailChange}
              onPasswordChange={props.onPasswordChange}
              onShowPasswordToggle={props.onShowPasswordToggle}
              onEmailSignInSubmit={props.onEmailSignInSubmit}
              onSocialLogin={props.onSocialLogin}
              onPrepareForgotPassword={props.onPrepareForgotPassword}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

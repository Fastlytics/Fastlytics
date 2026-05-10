import { m } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { oauthFlags } from '@/config/featureFlags';
import { ArrowLeftIcon, MailIcon } from './icons';
import { InputField, PasswordField } from './fields';
import type { SocialProvider } from './AuthContent';

const socialProviders = [
  ...(oauthFlags.enableGoogle ? [{ id: 'google' as const, icon: faGoogle, label: 'Google' }] : []),
  ...(oauthFlags.enableGithub ? [{ id: 'github' as const, icon: faGithub, label: 'GitHub' }] : []),
  ...(oauthFlags.enableDiscord
    ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord' }]
    : []),
];

interface SignUpFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  isLoading: boolean;
  isSignUpSuccess: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onEmailSignUpSubmit: (event: React.FormEvent) => void;
  onSocialLogin: (provider: SocialProvider) => void;
  onResetToSignUp: () => void;
}

export default function SignUpForm(props: SignUpFormProps) {
  return (
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
            We sent a verification link to <span className="text-white/60">{props.email}</span>
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
  );
}

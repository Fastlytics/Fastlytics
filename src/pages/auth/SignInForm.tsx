import { m } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { oauthFlags } from '@/config/featureFlags';
import { LockIcon, EyeIcon, EyeOffIcon, MailIcon, ArrowRightIcon } from './icons';
import { InputField } from './fields';
import type { SocialProvider } from './AuthContent';

const socialProviders = [
  ...(oauthFlags.enableGoogle ? [{ id: 'google' as const, icon: faGoogle, label: 'Google' }] : []),
  ...(oauthFlags.enableGithub ? [{ id: 'github' as const, icon: faGithub, label: 'GitHub' }] : []),
  ...(oauthFlags.enableDiscord
    ? [{ id: 'discord' as const, icon: faDiscord, label: 'Discord' }]
    : []),
];

interface SignInFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onEmailSignInSubmit: (event: React.FormEvent) => void;
  onSocialLogin: (provider: SocialProvider) => void;
  onPrepareForgotPassword: () => void;
}

export default function SignInForm(props: SignInFormProps) {
  return (
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
            icon={<MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />}
            type="email"
            placeholder="name@example.com"
            value={props.email}
            onChange={props.onEmailChange}
            disabled={props.isLoading}
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="signin-password" className="text-[13px] font-medium text-white/60">
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
  );
}

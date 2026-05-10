import { m } from 'motion/react';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { LockIcon, EyeIcon, EyeOffIcon, MailIcon } from './icons';

interface ForgotPasswordFlowProps {
  password: string;
  confirmPassword: string;
  forgotPasswordEmail: string;
  isResetPasswordMode: boolean;
  resetEmailSent: boolean;
  showPassword: boolean;
  isLoading: boolean;
  isSendingReset: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onForgotPasswordEmailChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onResetPasswordSubmit: (event: React.FormEvent) => void;
  onForgotPasswordSubmit: (event: React.FormEvent) => void;
  onBackToSignIn: () => void;
  onCancel: () => void;
}

export default function ForgotPasswordFlow(props: ForgotPasswordFlowProps) {
  return (
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
            <label htmlFor="field-new-password" className="text-[13px] font-medium text-white/60">
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
            <label htmlFor="field-email-reset" className="text-[13px] font-medium text-white/60">
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
              onClick={props.onCancel}
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
  );
}

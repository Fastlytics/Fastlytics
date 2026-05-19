import { LockIcon, EyeIcon, EyeOffIcon } from './icons';

export function InputField({
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

export function PasswordField({
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

// knip-ignore
import { cn } from '@/lib/utils';

type PasswordRequirement = {
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol';
  label: string;
  test: (password: string) => boolean;
};

const PASSWORD_SYMBOL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/;

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 6 characters',
    test: (password) => password.length >= 6,
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'symbol',
    label: 'One symbol',
    test: (password) => PASSWORD_SYMBOL_REGEX.test(password),
  },
];

export function getPasswordRequirementStates(password: string) {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    passed: requirement.test(password),
  }));
}

export function isPasswordValid(password: string) {
  return getPasswordRequirementStates(password).every((requirement) => requirement.passed);
}

export function getPasswordValidationMessage() {
  return 'Use at least 6 characters, with uppercase, lowercase, number, and symbol.';
}

const RequirementIcon = ({ passed }: { passed: boolean }) => (
  <span
    className={cn(
      'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
      passed
        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
        : 'border-white/10 bg-white/[0.03] text-white/30'
    )}
  >
    {passed ? (
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ) : (
      <span className="size-1.5 rounded-full bg-current" />
    )}
  </span>
);

type PasswordRequirementsProps = {
  password: string;
  className?: string;
};

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  if (!password) return null;

  const requirements = getPasswordRequirementStates(password);

  return (
    <div className={cn('rounded-xl border border-white/[0.08] bg-white/[0.02] p-3', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
        Password requirements
      </p>
      <div className="mt-2 space-y-2">
        {requirements.map((requirement) => (
          <div
            key={requirement.id}
            className={cn(
              'flex items-center gap-2 text-[12px] transition-colors',
              requirement.passed ? 'text-emerald-300' : 'text-white/45'
            )}
          >
            <RequirementIcon passed={requirement.passed} />
            <span>{requirement.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

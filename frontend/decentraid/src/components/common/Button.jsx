import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';

const VARIANTS = {
  primary: 'bg-seal-600 text-white hover:bg-seal-700 border-transparent',
  secondary: 'bg-white text-ink hover:bg-canvas border-line',
  danger: 'bg-bad-500 text-white hover:bg-bad-700 border-transparent',
  ghost: 'bg-transparent text-ink-muted hover:bg-canvas hover:text-ink border-transparent',
  link: 'bg-transparent text-seal-600 hover:text-seal-700 border-transparent underline underline-offset-4 px-0',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md border font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <LoadingSpinner size={16} tone={variant === 'secondary' || variant === 'ghost' ? 'ink' : 'light'} /> : icon}
      {children}
    </button>
  );
}

import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-0.5 text-xs': size === 'md',
          'bg-slate-700 text-slate-300': variant === 'default',
          'bg-profit/20 text-profit': variant === 'success',
          'bg-loss/20 text-loss': variant === 'danger',
          'bg-warning/20 text-warning': variant === 'warning',
          'bg-accent/20 text-accent': variant === 'info',
          'bg-slate-700/50 text-slate-400': variant === 'neutral',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-300 border border-success-200 dark:border-success-800/40',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-300 border border-warning-200 dark:border-warning-800/40',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-950 dark:text-danger-300 border border-danger-200 dark:border-danger-800/40',
    info: 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800/40',
    accent: 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-300 border border-accent-200 dark:border-accent-800/40',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold tracking-wide',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 font-medium transition-colors', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};

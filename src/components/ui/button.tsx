import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary:
    'bg-blue-500 text-white hover:bg-blue-400 focus-visible:outline-blue-400',
  secondary:
    'border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500 hover:bg-slate-800'
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

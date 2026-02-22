import React from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
            {props.required && <span className="text-loss ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'bg-bg-elevated border rounded-lg px-3 py-2 text-sm text-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            'transition-colors appearance-none',
            error ? 'border-loss' : 'border-slate-600',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

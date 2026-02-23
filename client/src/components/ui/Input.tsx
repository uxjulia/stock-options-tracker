import React from "react";
import { cn } from "../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
            {props.required && <span className="text-loss ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "bg-bg-elevated border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
            "transition-colors",
            error ? "border-loss" : "border-slate-600",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

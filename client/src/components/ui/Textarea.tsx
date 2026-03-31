import React from "react";
import { cn } from "../../utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-slate-300">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "bg-bg-elevated border rounded-sm px-3 py-2 text-sm text-slate-100 placeholder-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
            "resize-none transition-colors",
            error ? "border-loss" : "border-slate-600",
            className
          )}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

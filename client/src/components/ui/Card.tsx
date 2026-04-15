import React from "react";
import { cn } from "../../utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, className, onClick }: CardProps) => {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-slate-700/50 rounded-md p-4 sm:p-6",
        onClick && "cursor-pointer hover:border-slate-600 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const StatCard = ({
  label,
  value,
  subvalue,
  valueClass,
}: {
  label: string;
  value: string | number;
  subvalue?: string;
  valueClass?: string;
}) => {
  return (
    <Card>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn("text-2xl font-bold", valueClass ?? "text-slate-100")}>
        {value}
      </p>
      {subvalue && <p className="text-xs text-slate-500 mt-1">{subvalue}</p>}
    </Card>
  );
};

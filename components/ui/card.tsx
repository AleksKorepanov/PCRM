import React, { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

type CardSectionProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSectionProps) {
  return <div className={cn("mt-4 space-y-3", className)} {...props} />;
}

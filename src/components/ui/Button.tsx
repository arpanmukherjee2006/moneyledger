"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium select-none whitespace-nowrap " +
  "transition-[background-color,color,box-shadow,transform] duration-150 ease-out " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover shadow-card",
  secondary: "bg-surface text-fg border border-border-strong hover:bg-surface-2",
  ghost: "bg-transparent text-fg-2 hover:bg-surface-2 hover:text-fg",
  destructive: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, fullWidth, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "ghost" | "secondary";
  size?: "sm" | "md";
}

/** Square icon button with an accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", size = "md", className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-sm transition-colors duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-9 w-9" : "h-11 w-11",
        variant === "ghost"
          ? "text-fg-2 hover:bg-surface-2 hover:text-fg"
          : "bg-surface text-fg border border-border-strong hover:bg-surface-2",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

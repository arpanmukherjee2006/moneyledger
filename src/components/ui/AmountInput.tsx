"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  size?: "md" | "lg";
}

/** Rupee amount input: numeric keyboard on phones, tabular digits, ₹ prefix. */
export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  { className, size = "lg", ...rest },
  ref,
) {
  const large = size === "lg";
  return (
    <div className="relative">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-medium text-fg-3",
          large ? "text-xl" : "text-base",
        )}
      >
        ₹
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder="0.00"
        className={cn(
          "w-full rounded-sm border border-border-strong bg-surface text-fg placeholder:text-fg-3 num",
          "transition-[border-color] duration-150 ease-out focus-visible:border-accent aria-[invalid=true]:border-danger",
          large ? "h-14 pl-9 pr-3 text-2xl font-semibold" : "h-11 pl-8 pr-3 text-base",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

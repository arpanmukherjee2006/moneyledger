"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired with ids for assistive tech. */
export function Field({ label, hint, error, children, className }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg-2">
        {label}
      </label>
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-fg-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-sm border border-border-strong bg-surface px-3 text-base text-fg placeholder:text-fg-3 " +
  "transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-accent " +
  "disabled:opacity-50 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(inputClass, "h-auto min-h-[88px] resize-y py-2.5 leading-6", className)}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        inputClass,
        "appearance-none bg-no-repeat pr-9",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[position:right_10px_center]",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

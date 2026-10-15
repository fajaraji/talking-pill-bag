import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "attention";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-line bg-white text-ink hover:bg-page",
  success:
    "border border-success-border bg-success-bg text-success-text hover:brightness-95",
  danger:
    "border border-danger-border bg-danger-bg text-danger-text hover:brightness-95",
  attention:
    "border border-attention-border bg-attention-bg text-attention-text hover:brightness-95",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

// Shared button: minimum 56px height, 18px text, visible focus ring.
export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

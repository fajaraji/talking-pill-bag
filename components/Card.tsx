import type { ReactNode } from "react";

// Shared card: rounded corners, 1px line border, subtle shadow, 20px padding.
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

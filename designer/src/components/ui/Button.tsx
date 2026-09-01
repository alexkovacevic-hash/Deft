import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-ink-800 text-white hover:bg-ink-900 focus:ring-ink-400",
  secondary: "bg-clay-200 text-ink-800 hover:bg-clay-300 focus:ring-clay-400",
  outline: "border border-ink-200 bg-white text-ink-700 hover:bg-clay-50 focus:ring-clay-300",
  ghost: "text-ink-600 hover:bg-clay-100 focus:ring-clay-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

import type { ComponentProps, ReactNode } from "react";

// Small set of floor-friendly primitives: large touch targets, high contrast,
// work one-handed on a phone.

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground",
  secondary: "bg-surface text-foreground border border-border",
  danger: "bg-surface text-danger border border-danger/40",
  ghost: "text-foreground",
};

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold",
        "active:scale-[0.98] disabled:opacity-50 transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputBase = "min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-accent";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(inputBase, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(inputBase, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-border bg-surface p-4", className)} {...props} />;
}

type Tone = "neutral" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-border/60 text-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function Notice({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <p role="status" className={cx("rounded-xl px-3 py-2 text-sm", tones[tone])}>{children}</p>;
}

import type { ReactNode } from "react";

// A dark, branded page header band — the same quiet-luxury contrast as the
// Constitution cover — used across the app so section pages feel cohesive and
// professional. Actions render on the right; pass light/secondary buttons so
// they read against the dark background.
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 px-5 py-6 text-primary-foreground shadow-sm sm:px-7 print:hidden ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
          )}
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1.5 max-w-xl text-sm text-primary-foreground/65">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

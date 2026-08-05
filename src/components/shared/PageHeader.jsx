import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page header used by every workspace.
 * Provides consistent title, subtitle, optional icon, and action slot.
 */
export default function PageHeader({ icon: Icon, title, subtitle, actions, className }) {
  return (
    <header className={cn("flex items-center justify-between px-6 py-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:px-12", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />}
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
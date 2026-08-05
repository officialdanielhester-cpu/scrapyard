import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard empty state with icon, title, description, and optional action slot.
 * Used by every workspace when there's no data to display.
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center", className)}>
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />}
      {title && <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</p>}
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground/70">{description}</p>}
      {action}
    </div>
  );
}
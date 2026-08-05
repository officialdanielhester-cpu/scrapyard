import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard section/category label — mono uppercase tracking.
 * Used for grouping content within workspaces.
 */
export default function SectionLabel({ children, className }) {
  return (
    <h3 className={cn("font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", className)}>
      {children}
    </h3>
  );
}
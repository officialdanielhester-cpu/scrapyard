import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard glass panel — translucent backdrop-blur surface.
 * Used for floating toolbars, sidebars, and canvas overlays.
 */
export default function GlassPanel({ children, className }) {
  return (
    <div className={cn("app-glass rounded-xl", className)}>
      {children}
    </div>
  );
}
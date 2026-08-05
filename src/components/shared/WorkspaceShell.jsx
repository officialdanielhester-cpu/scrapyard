import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard full-height wrapper for every workspace.
 * Provides consistent layout structure with optional header and footer slots.
 */
export default function WorkspaceShell({ children, className, header, footer }) {
  return (
    <div className={cn("flex h-screen flex-col overflow-hidden", className)}>
      {header}
      <div className="min-h-0 flex-1">{children}</div>
      {footer}
    </div>
  );
}
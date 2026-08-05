import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard icon-only button used across all workspaces.
 * Consistent sizing, active state, and hover behavior.
 */
export default function IconButton({ children, onClick, disabled, active, title, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30",
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}
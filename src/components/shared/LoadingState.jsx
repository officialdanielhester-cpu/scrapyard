import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standard loading spinner with optional label.
 * Used by every workspace during data fetches.
 */
export default function LoadingState({ label = "Loading", className }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      {label && <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>}
    </div>
  );
}
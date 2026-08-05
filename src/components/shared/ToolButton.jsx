import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard tool selector button for workspace toolbars.
 * Shows icon + label, with active/inactive states.
 */
export default function ToolButton({ active, onClick, icon: Icon, label, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition-colors",
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={1.5} />}
      {label}
    </button>
  );
}
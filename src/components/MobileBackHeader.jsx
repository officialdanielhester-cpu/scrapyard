import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Mobile-only header with a back button for sub-sections (Gallery editors, etc.).
// Hidden on desktop where the sidebar provides navigation.
export default function MobileBackHeader({ title, subtitle }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden">
      <button
        onClick={() => navigate(-1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 transition-colors hover:border-primary hover:text-primary"
        aria-label="Go back"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <div className="min-w-0">
        <h1 className="font-heading text-lg font-extrabold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
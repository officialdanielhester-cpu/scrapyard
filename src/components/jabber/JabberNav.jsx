import React from "react";
import { Sparkles, Boxes, SlidersHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { id: "jabber", label: "Jabber", icon: Sparkles },
  { id: "grid", label: "The Grid", icon: Boxes },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];

export default function JabberNav({ active, onSelect }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col justify-between border-r border-border/60 bg-background/70 backdrop-blur-xl px-8 py-10 z-40">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-heading text-xl font-extrabold tracking-tight">Jabber</span>
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Ambient Intelligence
          </p>

          <nav className="mt-16 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`group flex items-center gap-3 rounded-md px-4 py-3 text-left transition-all duration-300 ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="font-body text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/70">
          <p>v0.1.0 — prototype</p>
          <p>Built on Base44</p>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-around px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1 py-2 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-mono text-[9px] uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
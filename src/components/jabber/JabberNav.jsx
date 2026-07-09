import React, { useState, useEffect } from "react";
import { Sparkles, Boxes, Box, SlidersHorizontal, Sun, Moon, FlaskConical, Hammer, LineChart, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const TOP_ITEMS = [
  { id: "jabber", label: "Jabber", icon: Sparkles },
  { id: "grid", label: "The Grid", icon: Boxes },
  { id: "studio", label: "Studio", icon: Box },
];
const ENV_CHILDREN = [
  { id: "env", label: "Playground", icon: FlaskConical },
  { id: "workshop", label: "Workshop", icon: Hammer },
  { id: "dashboard", label: "Dashboard", icon: LineChart },
];
const ENV_IDS = ENV_CHILDREN.map((c) => c.id);
const BOTTOM_ITEMS = [{ id: "settings", label: "Settings", icon: SlidersHorizontal }];

export default function JabberNav({ active, onSelect }) {
  const { theme, toggle } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const [open, setOpen] = useState(ENV_IDS.includes(active));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ENV_IDS.includes(active)) setOpen(true);
  }, [active]);

  const groupActive = ENV_IDS.includes(active);
  const selectMobile = (id) => {
    onSelect(id);
    setMobileOpen(false);
  };

  const renderTop = (item) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={`group flex items-center gap-3 rounded-md px-4 py-3 text-left transition-all duration-300 ${
          isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-body text-sm">{item.label}</span>
      </button>
    );
  };

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
            {TOP_ITEMS.map(renderTop)}

            {/* Environment dropdown group */}
            <div>
              <button
                onClick={() => setOpen((o) => !o)}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition-all duration-300 ${
                  groupActive ? "text-primary" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <FlaskConical className="h-4 w-4" strokeWidth={1.5} />
                <span className="font-body text-sm">Environment</span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              {open && (
                <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-border/40 pl-3">
                  {ENV_CHILDREN.map((child) => {
                    const Icon = child.icon;
                    const isActive = active === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onSelect(child.id)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span className="font-body text-sm">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {BOTTOM_ITEMS.map(renderTop)}
          </nav>
        </div>

        <div>
          <button
            onClick={toggle}
            className="mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ThemeIcon className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-body">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/70">
            <p>v0.1.0 — prototype</p>
            <p>Built on Base44</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-around px-4 py-2">
          {TOP_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectMobile(item.id)}
                className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1 py-2 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-mono text-[9px] uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}

          {/* Environment dropdown on mobile */}
          <div className="relative flex-1">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className={`flex min-h-[44px] w-full flex-col items-center gap-1 py-2 ${
                groupActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <FlaskConical className="h-5 w-5" strokeWidth={1.5} />
              <span className="font-mono text-[9px] uppercase tracking-wider">Environment</span>
            </button>
            {mobileOpen && (
              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl border border-border/60 bg-background/95 p-1 shadow-lg backdrop-blur-xl">
                {ENV_CHILDREN.map((child) => {
                  const Icon = child.icon;
                  const isActive = active === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => selectMobile(child.id)}
                      className={`flex w-40 items-center gap-2 rounded-lg px-3 py-2.5 text-left ${
                        isActive ? "bg-primary/10 text-primary" : "text-foreground/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      <span className="font-body text-sm">{child.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectMobile(item.id)}
                className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center gap-1 py-2 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-mono text-[9px] uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={toggle}
            className="flex min-h-[44px] flex-1 flex-col items-center gap-1 py-2 text-muted-foreground"
          >
            <ThemeIcon className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-mono text-[9px] uppercase tracking-wider">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
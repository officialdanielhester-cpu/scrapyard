import React from "react";
import { Sun, Gauge, Shield, Bell, Languages, RotateCcw } from "lucide-react";
import MobileSelectDrawer from "@/components/MobileSelectDrawer";
import { useJabberSettings, DEFAULT_JABBER_SETTINGS } from "@/hooks/use-jabber-settings";
import { useTheme } from "@/hooks/use-theme";

const GROUPS = {
  appearance: {
    title: "Appearance",
    blurb: "How Scrapyard looks on your screen.",
    items: [
      { id: "lightMode", label: "Light Mode", desc: "Switch between light and dark themes", icon: Sun, type: "toggle", default: false },
    ],
  },
  behavior: {
    title: "Assistant",
    blurb: "Tune Jabber's tempo, privacy, and language.",
    items: [
      { id: "speed", label: "Response Tempo", desc: "Balanced by default", icon: Gauge, type: "select", options: ["Patient", "Balanced", "Rapid"], default: "Balanced" },
      { id: "private", label: "Private Mode", desc: "Never persist conversations", icon: Shield, type: "toggle", default: false },
      { id: "notify", label: "Ambient Notifications", desc: "Quiet, non-intrusive pings", icon: Bell, type: "toggle", default: true },
      { id: "lang", label: "Language", desc: "Detection is automatic", icon: Languages, type: "select", options: ["Auto", "English", "Spanish", "French"], default: "Auto" },
    ],
  },
};

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
        on ? "bg-primary" : "bg-foreground/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-300 ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function PreferencesTab({ group }) {
  const { settings, update } = useJabberSettings();
  const { theme, toggle: toggleTheme } = useTheme();
  const g = GROUPS[group];

  const toggle = (id) => {
    if (id === "lightMode") { toggleTheme(); return; }
    update({ [id]: !settings[id] });
  };
  const select = (id, val) => update({ [id]: val });

  const reset = () =>
    update({
      speed: DEFAULT_JABBER_SETTINGS.speed,
      private: DEFAULT_JABBER_SETTINGS.private,
      notify: DEFAULT_JABBER_SETTINGS.notify,
      lang: DEFAULT_JABBER_SETTINGS.lang,
    });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">{g.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
      </div>

      <div className="divide-y divide-border/40 rounded-2xl border border-border/50">
        {g.items.map((item) => {
          const Icon = item.icon;
          const on = item.id === "lightMode" ? theme === "light" : !!settings[item.id];
          return (
            <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-sm font-medium">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              {item.type === "toggle" ? (
                <Toggle on={on} onClick={() => toggle(item.id)} />
              ) : (
                <MobileSelectDrawer
                  value={settings[item.id] ?? item.default}
                  onValueChange={(v) => select(item.id, v)}
                  options={item.options}
                  title={item.label}
                  triggerClassName="w-[140px] rounded-md border border-border/60 bg-background px-3 py-1.5 font-mono text-xs focus:border-primary"
                />
              )}
            </div>
          );
        })}
      </div>

      {group === "behavior" && (
        <div className="rounded-2xl border border-border/50 p-5">
          <p className="font-body text-sm text-foreground/80">
            Reset Jabber's assistant settings to their original state.
          </p>
          <button
            onClick={reset}
            className="mt-3 flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/5"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset to Defaults
          </button>
        </div>
      )}

      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        Synced with Recall · stored locally until connected
      </p>
    </div>
  );
}
import React, { useState } from "react";
import { Moon, Gauge, Shield, Bell, Languages } from "lucide-react";
import ConnectionTab from "@/components/settings/ConnectionTab";
import VoiceTab from "@/components/settings/VoiceTab";
import { useJabberSettings, DEFAULT_JABBER_SETTINGS } from "@/hooks/use-jabber-settings";

const TABS = [
  { id: "ambience", label: "Ambience" },
  { id: "voice", label: "Voice" },
  { id: "trust", label: "Trust" },
  { id: "connection", label: "Connection" },
];

const SETTING_GROUPS = [
  {
    title: "Ambience",
    items: [
      { id: "theme", label: "Calm Mode", desc: "Soften motion and color", icon: Moon, type: "toggle", default: false },
      { id: "speed", label: "Response Tempo", desc: "Balanced by default", icon: Gauge, type: "select", options: ["Patient", "Balanced", "Rapid"], default: "Balanced" },
    ],
  },
  {
    title: "Trust",
    items: [
      { id: "private", label: "Private Mode", desc: "Never persist conversations", icon: Shield, type: "toggle", default: false },
      { id: "notify", label: "Ambient Notifications", desc: "Quiet, non-intrusive pings", icon: Bell, type: "toggle", default: true },
      { id: "lang", label: "Language", desc: "Detection is automatic", icon: Languages, type: "select", options: ["Auto", "English", "Spanish", "French"], default: "Auto" },
    ],
  },
];

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

export default function SettingsSection() {
  const [tab, setTab] = useState("ambience");
  const { settings, update } = useJabberSettings();

  const toggle = (id) => update({ [id]: !settings[id] });
  const select = (id, val) => update({ [id]: val });

  const activeGroup = SETTING_GROUPS.find((g) => g.title.toLowerCase() === tab);

  return (
    <div className="h-full overflow-y-auto">
      <header className="px-6 py-5 md:px-12">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Tune The Ambient Layer
        </p>
      </header>

      <div className="px-6 md:px-12">
        <div className="mx-auto max-w-2xl pb-16">
          <div className="mb-8 flex w-fit gap-1 rounded-full border border-border/50 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "connection" ? (
            <ConnectionTab />
          ) : tab === "voice" ? (
            <VoiceTab />
          ) : (
            <div className="space-y-12">
              <section>
                <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {activeGroup.title}
                </h2>
                <div className="divide-y divide-border/40 rounded-2xl border border-border/50">
                  {activeGroup.items.map((item) => {
                    const Icon = item.icon;
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
                          <Toggle on={!!settings[item.id]} onClick={() => toggle(item.id)} />
                        ) : (
                          <select
                            value={settings[item.id] ?? item.default}
                            onChange={(e) => select(item.id, e.target.value)}
                            className="rounded-md border border-border/60 bg-background px-3 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
                          >
                            {item.options.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {tab === "trust" && (
                <div className="rounded-2xl border border-border/50 p-5">
                  <p className="font-body text-sm text-foreground/80">
                    Reset Jabber to its original state.
                  </p>
                  <button
                    onClick={() =>
                      update({
                        theme: DEFAULT_JABBER_SETTINGS.theme,
                        speed: DEFAULT_JABBER_SETTINGS.speed,
                        private: DEFAULT_JABBER_SETTINGS.private,
                        notify: DEFAULT_JABBER_SETTINGS.notify,
                        lang: DEFAULT_JABBER_SETTINGS.lang,
                      })
                    }
                    className="mt-3 rounded-md border border-destructive/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/5"
                  >
                    Reset to Defaults
                  </button>
                </div>
              )}

              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Synced with website B · stored locally until connected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
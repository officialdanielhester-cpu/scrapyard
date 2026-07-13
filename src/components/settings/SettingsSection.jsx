import React, { useState } from "react";
import { Sun, Sparkles, Volume2, Link2, User } from "lucide-react";
import ConnectionTab from "@/components/settings/ConnectionTab";
import VoiceTab from "@/components/settings/VoiceTab";
import AccountTab from "@/components/settings/AccountTab";
import PreferencesTab from "@/components/settings/PreferencesTab";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "behavior", label: "Assistant", icon: Sparkles },
  { id: "voice", label: "Voice", icon: Volume2 },
  { id: "connection", label: "Connection", icon: Link2 },
  { id: "account", label: "Account", icon: User },
];

export default function SettingsSection() {
  const [section, setSection] = useState("appearance");

  return (
    <div className="h-full overflow-y-auto">
      <header className="px-6 py-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:px-12">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Tune The Ambient Layer
        </p>
      </header>

      <div className="px-6 md:px-12">
        <div className="mx-auto max-w-3xl pb-20 md:flex md:gap-10">
          {/* Desktop rail */}
          <nav className="hidden w-52 shrink-0 md:block">
            <div className="sticky top-4 space-y-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const on = section === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      on
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobile horizontal chip nav */}
          <div className="mb-6 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const on = section === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {section === "appearance" && <PreferencesTab group="appearance" />}
            {section === "behavior" && <PreferencesTab group="behavior" />}
            {section === "voice" && <VoiceTab />}
            {section === "connection" && <ConnectionTab />}
            {section === "account" && <AccountTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
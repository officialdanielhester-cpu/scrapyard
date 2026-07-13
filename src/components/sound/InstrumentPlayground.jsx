import React, { useState } from "react";
import { Piano, LayoutGrid, Music, Move, Volume2, Circle } from "lucide-react";
import { INSTRUMENTS } from "@/components/sound/SoundEngine";
import InstrumentKeyboard from "@/components/sound/InstrumentKeyboard";
import DrumPads from "@/components/sound/DrumPads";
import DrumSet from "@/components/sound/DrumSet";
import Fretboard from "@/components/sound/Fretboard";
import XYPad from "@/components/sound/XYPad";

const MELODIC = INSTRUMENTS.filter((i) => i.melodic && i.id !== "sample");

const TABS = [
  { id: "keyboard", label: "Keys", icon: Piano },
  { id: "drums", label: "Drum Pads", icon: LayoutGrid },
  { id: "kit", label: "Drum Set", icon: Circle },
  { id: "fretboard", label: "Guitar", icon: Music },
  { id: "xy", label: "XY Pad", icon: Move },
];

export default function InstrumentPlayground() {
  const [tab, setTab] = useState("keyboard");
  const [instrument, setInstrument] = useState("piano");
  const [vol, setVol] = useState(0.7);

  return (
    <div className="space-y-4">
      {/* Instrument switcher + shared controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  on ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-foreground/70 hover:border-primary hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab !== "drums" && tab !== "kit" && (
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm"
          >
            {MELODIC.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="range" min="0" max="1" step="0.01" value={vol}
            onChange={(e) => setVol(parseFloat(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>
      </div>

      {tab === "keyboard" && (
        <InstrumentKeyboard instrument={instrument} setInstrument={setInstrument} vol={vol} />
      )}
      {tab === "drums" && <DrumPads vol={vol} />}
      {tab === "kit" && <DrumSet vol={vol} />}
      {tab === "fretboard" && <Fretboard instrument={instrument} vol={vol} />}
      {tab === "xy" && <XYPad instrument={instrument} vol={vol} />}
    </div>
  );
}
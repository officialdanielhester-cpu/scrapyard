import React, { useState } from "react";
import { Volume2, Play, Square } from "lucide-react";
import { useVoice, VOICES } from "@/hooks/use-voice";

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

export default function VoiceTab() {
  const { voice, setVoice, speakEnabled, setSpeakEnabled, speak, stop, speaking } = useVoice();
  const [previewing, setPreviewing] = useState(false);
  const sample =
    "I'm Jabber, your ambient intelligence layer. I can speak aloud in whatever voice you choose.";

  const preview = async () => {
    if (speaking || previewing) {
      stop();
      setPreviewing(false);
      return;
    }
    setPreviewing(true);
    await speak(sample);
    setPreviewing(false);
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Voice
        </h2>
        <div className="divide-y divide-border/40 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-start gap-3">
              <Volume2 className="mt-0.5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="font-body text-sm font-medium">Speak responses</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Jabber reads its replies aloud using the voice below
                </p>
              </div>
            </div>
            <Toggle on={speakEnabled} onClick={() => setSpeakEnabled(!speakEnabled)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Choose a voice
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {VOICES.map((v) => {
            const on = voice === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                  on ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
                }`}
              >
                <div>
                  <p className="font-body text-sm font-medium">{v.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{v.desc}</p>
                </div>
                <span className={`h-3 w-3 rounded-full ${on ? "bg-primary" : "bg-foreground/20"}`} />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <button
          onClick={preview}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        >
          {previewing || speaking ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {previewing || speaking ? "Stop preview" : "Preview voice"}
        </button>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Previews play in your currently selected voice
        </p>
      </section>
    </div>
  );
}
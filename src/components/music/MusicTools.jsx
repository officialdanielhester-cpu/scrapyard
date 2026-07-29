import React, { useState } from "react";
import PianoKeyboard from "@/components/music/PianoKeyboard";
import DrumPadGrid from "@/components/music/DrumPadGrid";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function MusicTools({ open, onOpenChange, onNote, onPad }) {
  const [tab, setTab] = useState("piano");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle className="font-mono text-xs uppercase tracking-wider">Music Tools</SheetTitle></SheetHeader>
        <div className="flex gap-2 px-2 pt-1">
          <button onClick={() => setTab("piano")} className={`rounded-md px-3 py-1.5 text-xs ${tab === "piano" ? "bg-primary text-primary-foreground" : "border border-border/60"}`}>Piano</button>
          <button onClick={() => setTab("pads")} className={`rounded-md px-3 py-1.5 text-xs ${tab === "pads" ? "bg-primary text-primary-foreground" : "border border-border/60"}`}>Drum Pads</button>
        </div>
        <div className="p-2">
          {tab === "piano" ? <PianoKeyboard onNote={onNote} /> : <DrumPadGrid onPad={onPad} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
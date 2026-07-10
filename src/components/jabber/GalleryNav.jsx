import React, { useState } from "react";
import { Images, ChevronDown, Film, Image as ImageIcon } from "lucide-react";

// Gallery sidebar section. Both entries navigate to real editors:
// Video Editor (CapCut-style) and Photo Editor (Lightroom-style).
const ITEMS = [
  { id: "video-editor", label: "Video Editor", Icon: Film },
  { id: "photo-editor", label: "Photo Editor", Icon: ImageIcon },
];

export default function GalleryNav({ variant = "desktop", active, onSelect }) {
  const [open, setOpen] = useState(false);
  const go = (id) => { onSelect?.(id); setOpen(false); };
  const activeId = (id) => active === id;

  if (variant === "mobile") {
    return (
      <div className="relative flex-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex min-h-[44px] w-full flex-col items-center gap-1 py-2 ${open ? "text-primary" : "text-muted-foreground"}`}
        >
          <Images className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-mono text-[9px] uppercase tracking-wider">Gallery</span>
        </button>
        {open && (
          <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-xl border border-border/60 bg-background/95 p-1 shadow-lg backdrop-blur-xl">
            {ITEMS.map((it) => (
              <button
                key={it.id}
                onClick={() => go(it.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${activeId(it.id) ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-foreground/5"}`}
              >
                <it.Icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="flex-1 text-sm">{it.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition-all duration-300 ${
          open ? "text-primary" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        <Images className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-body text-sm">Gallery</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>
      {open && (
        <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-border/40 pl-3">
          {ITEMS.map((it) => (
            <button
              key={it.id}
              onClick={() => go(it.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-all duration-300 ${
                activeId(it.id) ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <it.Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="font-body">{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
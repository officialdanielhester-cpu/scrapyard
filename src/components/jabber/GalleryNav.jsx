import React, { useState } from "react";
import { Images, Folder, ChevronDown, Film } from "lucide-react";

// Gallery sidebar section. "Video Editor" navigates to the CapCut-style editor;
// "Collection Two" remains a placeholder dropdown.
const PLACEHOLDER_GROUPS = [
  { id: "col-b", label: "Collection Two", items: ["Item 1", "Item 2", "Item 3"] },
];

export default function GalleryNav({ variant = "desktop", active, onSelect }) {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(null);
  const isVE = active === "video-editor";

  const goVideoEditor = () => {
    onSelect?.("video-editor");
    setOpen(false);
  };

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
            <button
              onClick={goVideoEditor}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${isVE ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-foreground/5"}`}
            >
              <Film className="h-4 w-4" strokeWidth={1.5} />
              <span className="flex-1 text-sm">Video Editor</span>
            </button>
            {PLACEHOLDER_GROUPS.map((g) => (
              <div key={g.id} className="px-1 py-0.5">
                <button
                  onClick={() => setSubOpen((cur) => (cur === g.id ? null : g.id))}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-foreground/80 hover:bg-foreground/5"
                >
                  <Folder className="h-4 w-4" strokeWidth={1.5} />
                  <span className="flex-1 text-sm">{g.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${subOpen === g.id ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </button>
                {subOpen === g.id && (
                  <ul className="my-1 ml-3 flex flex-col gap-0.5 border-l border-border/30 pl-2">
                    {g.items.map((label, i) => (
                      <li key={i} className="rounded-md px-2 py-1 text-xs text-muted-foreground">{label}</li>
                    ))}
                  </ul>
                )}
              </div>
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
          <button
            onClick={goVideoEditor}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-all duration-300 ${
              isVE ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            <Film className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="font-body">Video Editor</span>
          </button>
          {PLACEHOLDER_GROUPS.map((g) => (
            <div key={g.id}>
              <button
                onClick={() => setSubOpen((cur) => (cur === g.id ? null : g.id))}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <Folder className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="flex-1 text-left">{g.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${subOpen === g.id ? "rotate-180" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              {subOpen === g.id && (
                <ul className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-border/30 pl-3">
                  {g.items.map((label, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" /> {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { Folder, ChevronDown, Plus, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCurrentProjectId, setCurrentProjectId } from "./use-current-project";

export default function ProjectPicker() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(getCurrentProjectId());
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  const loadProjects = async () => {
    try { const list = await base44.entities.Project.list("-created_date", 50); setProjects(list); } catch { /* ignore */ }
  };

  useEffect(() => { if (open) loadProjects(); }, [open]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = projects.find((p) => p.id === currentId);

  const selectProject = (id) => { setCurrentProjectId(id); setCurrentId(id); setOpen(false); };

  const clearProject = (e) => { e.stopPropagation(); setCurrentProjectId(null); setCurrentId(null); setOpen(false); };

  const createProject = async () => {
    if (!newName.trim()) return;
    try {
      const created = await base44.entities.Project.create({ name: newName.trim(), description: "", color: "#3b82f6", icon: "📁" });
      setProjects((prev) => [created, ...prev]);
      selectProject(created.id);
      setNewName(""); setCreating(false);
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Folder className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="flex-1 truncate text-left">{current ? current.name : "No active project"}</span>
        {currentId && (
          <span onClick={clearProject} className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground">
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border/60 bg-popover p-1.5 shadow-xl">
          {projects.length === 0 && !creating && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No projects yet — create one below.</p>
          )}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                p.id === currentId ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/5"
              }`}
            >
              <span className="text-sm">{p.icon || "📁"}</span>
              <span className="flex-1 truncate">{p.name}</span>
              {p.id === currentId && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
            </button>
          ))}
          {creating ? (
            <div className="flex items-center gap-1.5 px-1.5 py-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createProject(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Project name…"
                className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <button onClick={createProject} className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-border/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> New Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
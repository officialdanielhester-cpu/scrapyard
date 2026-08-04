import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, Trash2, Folder, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TYPE_META, relativeDate } from "./workspace-data";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#06b6d4", "#eab308", "#ef4444"];
const ICONS = ["📁", "🎨", "🎵", "🚀", "📝", "👕", "🧠", "📦"];

export default function ProjectsSection({ onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newIcon, setNewIcon] = useState(ICONS[0]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try { const list = await base44.entities.Project.list("-created_date", 100); setProjects(list); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (!selectedId) { setItems([]); return; }
    setItemsLoading(true);
    (async () => {
      try { const list = await base44.entities.ProjectItem.filter({ project_id: selectedId }, "-created_date", 200); setItems(list); } catch { /* ignore */ }
      finally { setItemsLoading(false); }
    })();
  }, [selectedId]);

  const createProject = async () => {
    if (!newName.trim()) return;
    try {
      const created = await base44.entities.Project.create({ name: newName.trim(), description: "", color: newColor, icon: newIcon });
      setProjects((prev) => [created, ...prev]);
      setNewName(""); setCreating(false);
      setSelectedId(created.id);
    } catch { /* ignore */ }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project and all its links?")) return;
    try {
      await base44.entities.ProjectItem.deleteMany({ project_id: id });
      await base44.entities.Project.delete(id);
      if (selectedId === id) setSelectedId(null);
      loadProjects();
    } catch { /* ignore */ }
  };

  const selected = projects.find((p) => p.id === selectedId);
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.content_type]) acc[item.content_type] = [];
    acc[item.content_type].push(item);
    return acc;
  }, {});

  // Detail view
  if (selectedId && selected) {
    return (
      <div className="min-h-screen px-6 py-6 md:px-12">
        <button onClick={() => setSelectedId(null)} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Back to Projects
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: (selected.color || "#3b82f6") + "22" }}>
            {selected.icon || "📁"}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">{selected.name}</h1>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""} · created {relativeDate(selected.created_date)}
            </p>
          </div>
          <button onClick={() => deleteProject(selected.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {itemsLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <Folder className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />
            <p className="mt-3 text-sm text-muted-foreground">This project is empty.</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
              Select this project from the sidebar, then save content in any workspace — it'll appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([type, typeItems]) => {
              const meta = TYPE_META[type] || { label: type, Icon: Folder, ws: null };
              return (
                <div key={type}>
                  <div className="mb-3 flex items-center gap-2">
                    <meta.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{meta.label}</h2>
                    <span className="font-mono text-[10px] text-muted-foreground/50">{typeItems.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {typeItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => meta.ws && onNavigate(meta.ws)}
                        className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 text-left transition-all hover:border-primary/40 hover:shadow-md"
                      >
                        {item.content_thumbnail ? (
                          <div className="aspect-square w-full bg-muted/30">
                            <img src={item.content_thumbnail} alt={item.content_name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center bg-muted/20">
                            <meta.Icon className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />
                          </div>
                        )}
                        <div className="p-2.5">
                          <p className="truncate text-xs font-medium text-foreground">{item.content_name || "Untitled"}</p>
                          <p className="text-[10px] text-muted-foreground">{relativeDate(item.created_date)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen px-6 py-6 md:px-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Projects</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Folders for everything you create</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> New Project
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4"
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createProject(); if (e.key === "Escape") setCreating(false); }}
              placeholder="Project name…"
              className="mb-3 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => setNewIcon(ic)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${newIcon === ic ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-foreground/5"}`}>{ic}</button>
              ))}
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)} className={`h-7 w-7 rounded-full transition-transform ${newColor === c ? "scale-110 ring-2 ring-offset-2 ring-offset-background" : ""}`} style={{ background: c, boxShadow: newColor === c ? `0 0 0 2px ${c}` : undefined }} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createProject} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">Create</button>
              <button onClick={() => setCreating(false)} className="rounded-lg border border-border/60 px-4 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
          <Folder className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
          <p className="mt-3 text-sm text-muted-foreground">No projects yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Create a project to start organizing your work across all workspaces.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="group flex flex-col rounded-2xl border border-border/50 bg-card/50 p-4 text-left transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: (p.color || "#3b82f6") + "22" }}>
                {p.icon || "📁"}
              </div>
              <h3 className="truncate font-heading text-sm font-bold">{p.name}</h3>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {relativeDate(p.created_date)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
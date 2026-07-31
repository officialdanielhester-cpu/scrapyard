import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Menu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MindSidebar from "@/components/mind/MindSidebar";
import MindDashboard from "@/components/mind/MindDashboard";
import MindEditor from "@/components/mind/MindEditor";
import MindGraph from "@/components/mind/MindGraph";
import { todayKey } from "@/components/mind/markdown-utils";

export default function MindSection() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState("Personal");
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState({ mode: "all", tag: null, folder: null, search: "" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingRef = useRef({});
  const saveTimer = useRef(null);
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const list = await base44.entities.Note.list("-updated_date", 300); setNotes(list || []); } catch { setNotes([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const workspaces = useMemo(() => {
    const set = new Set(notes.map((n) => n.workspace || "Personal"));
    set.add(workspace);
    return [...set];
  }, [notes, workspace]);

  const wsNotes = useMemo(() => notes.filter((n) => (n.workspace || "Personal") === workspace), [notes, workspace]);

  // Flush accumulated patches to the backend (debounced autosave).
  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    pendingRef.current = {};
    await Promise.all(Object.entries(pending).map(([id, patch]) =>
      base44.entities.Note.update(id, patch).catch(() => {})
    ));
  }, []);

  const patchNote = useCallback((id, patch) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updated_date: new Date().toISOString() } : n)));
    pendingRef.current = { ...pendingRef.current, [id]: { ...(pendingRef.current[id] || {}), ...patch } };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 900);
  }, [flush]);

  const createNote = useCallback(async (patch = {}) => {
    const n = { title: "Untitled", content: "", tags: [], folder: "Inbox", workspace, pinned: false, favorite: false, aliases: [], icon: "📝", is_template: false, daily: false, ...patch };
    try {
      const created = await base44.entities.Note.create(n);
      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setView("editor");
      return created;
    } catch (e) { console.error(e); }
  }, [workspace]);

  const deleteNote = useCallback(async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) { setSelectedId(null); setView("dashboard"); }
    try { await base44.entities.Note.delete(id); } catch {}
  }, [selectedId]);

  const openNote = useCallback((id) => { setSelectedId(id); setView("editor"); setSidebarOpen(false); }, []);

  const openByTitle = useCallback((title) => {
    const t = (title || "").toLowerCase();
    const found = wsNotes.find((n) => n.title.toLowerCase() === t || (n.aliases || []).some((a) => a.toLowerCase() === t));
    if (found) openNote(found.id);
  }, [wsNotes, openNote]);

  const handleDaily = useCallback(() => {
    const key = todayKey();
    const existing = notes.find((n) => n.daily && n.title === key);
    if (existing) { openNote(existing.id); return; }
    createNote({ title: key, daily: true, folder: "Daily", icon: "☀️", content: `# ${key}\n\n` });
  }, [notes, createNote, openNote]);

  const hasDailyToday = useMemo(() => notes.some((n) => n.daily && n.title === todayKey()), [notes]);

  const addWorkspace = useCallback(() => {
    const name = window.prompt("Workspace name", "New Workspace");
    if (name && name.trim()) setWorkspace(name.trim());
  }, []);

  // Filtered notes for dashboard/list views.
  const filtered = useMemo(() => {
    let list = wsNotes;
    const { mode, tag, folder, search } = filter;
    if (mode === "favorites") list = list.filter((n) => n.favorite);
    else if (mode === "pinned") list = list.filter((n) => n.pinned);
    else if (mode === "templates") list = list.filter((n) => n.is_template);
    else if (mode === "folder" && folder) list = list.filter((n) => (n.folder || "Inbox") === folder || (n.folder || "Inbox").startsWith(folder + "/"));
    else if (mode === "tag" && tag) list = list.filter((n) => (n.tags || []).includes(tag));
    if (search && search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((n) => (n.title || "").toLowerCase().includes(s) || (n.content || "").toLowerCase().includes(s) || (n.tags || []).some((t) => t.toLowerCase().includes(s)));
    }
    return list;
  }, [wsNotes, filter]);

  const selected = useMemo(() => wsNotes.find((n) => n.id === selectedId) || notes.find((n) => n.id === selectedId) || null, [wsNotes, notes, selectedId]);

  const sidebar = (
    <MindSidebar
      notes={wsNotes} workspace={workspace} workspaces={workspaces}
      onWorkspace={setWorkspace} onAddWorkspace={addWorkspace}
      onNewNote={() => createNote()} onDaily={handleDaily}
      view={view} onView={(v) => { setView(v); setSelectedId(null); }}
      filter={filter} onFilter={setFilter}
      onClose={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/40 md:block">{sidebar}</aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border/40 bg-background shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><Menu className="h-4 w-4" /></button>
          <span className="font-heading font-bold">Mind</span>
        </div>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : view === "editor" && selected ? (
            <MindEditor
              note={selected}
              notes={wsNotes}
              onChange={(patch) => patchNote(selected.id, patch)}
              onBack={() => { setView("dashboard"); setSelectedId(null); }}
              onDelete={() => deleteNote(selected.id)}
              onOpenById={openNote}
              onOpenByTitle={openByTitle}
            />
          ) : view === "graph" ? (
            <MindGraph notes={wsNotes} onOpen={openNote} />
          ) : filter.mode !== "all" || filter.tag || filter.folder || filter.search ? (
            <div className="mx-auto max-w-6xl px-6 py-10 md:px-12">
              <h1 className="mb-6 font-heading text-2xl font-extrabold">
                {filter.mode === "favorites" ? "Favorites" : filter.mode === "pinned" ? "Pinned" : filter.mode === "templates" ? "Templates" : filter.tag ? `#${filter.tag}` : filter.folder ? filter.folder : "Search"}
              </h1>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((n) => (
                  <button key={n.id} onClick={() => openNote(n.id)} className="flex flex-col rounded-2xl border border-border/50 bg-card/60 p-4 text-left hover:border-primary/60">
                    <div className="flex items-center gap-2"><span className="text-lg">{n.icon || "📝"}</span><span className="flex-1 truncate text-sm font-semibold">{n.title}</span></div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{(n.content || "").replace(/[#*`\[\]]/g, "").slice(0, 120)}</p>
                  </button>
                ))}
                {!filtered.length && <p className="text-sm text-muted-foreground">No notes match this filter.</p>}
              </div>
            </div>
          ) : (
            <MindDashboard
              notes={wsNotes}
              onOpen={openNote}
              onNew={() => createNote()}
              onDaily={handleDaily}
              hasDailyToday={hasDailyToday}
            />
          )}
        </div>
      </div>
    </div>
  );
}
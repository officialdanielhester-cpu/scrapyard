import React, { useMemo, useState } from "react";
import { Plus, Sun, LayoutDashboard, Network, Star, Pin, FileText, Search, Hash, Folder, ChevronRight, ChevronDown } from "lucide-react";

function buildFolderTree(notes) {
  const root = {};
  notes.forEach((n) => {
    const parts = (n.folder || "Inbox").split("/").filter(Boolean);
    let node = root;
    parts.forEach((p) => {
      if (!node[p]) node[p] = { __count: 0, __children: {} };
      node[p].__count += 1;
      node = node[p].__children;
    });
  });
  return root;
}

function FolderTree({ tree, path, activeFolder, onPick, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const entries = Object.entries(tree).sort();
  return (
    <div>
      {entries.map(([name, val]) => {
        const full = path ? `${path}/${name}` : name;
        const childEntries = Object.entries(val.__children || {});
        return (
          <div key={full}>
            <button
              onClick={() => { setOpen((v) => !v); onPick(full); }}
              className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left ${activeFolder === full ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
              style={{ paddingLeft: depth * 12 + 8 }}
            >
              {childEntries.length ? (
                open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
              ) : <Folder className="h-3 w-3 shrink-0" />}
              <span className="truncate text-xs">{name}</span>
              <span className="ml-auto font-mono text-[9px] text-muted-foreground/50">{val.__count}</span>
            </button>
            {open && childEntries.length > 0 && (
              <FolderTree tree={val.__children} path={full} activeFolder={activeFolder} onPick={onPick} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MindSidebar({
  notes, workspace, workspaces, onWorkspace, onAddWorkspace,
  onNewNote, onDaily, view, onView, filter, onFilter, onClose,
}) {
  const [q, setQ] = useState("");
  const folderTree = useMemo(() => buildFolderTree(notes), [notes]);
  const tags = useMemo(() => {
    const m = new Map();
    notes.forEach((n) => (n.tags || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const navItem = (id, Icon, label, count) => (
    <button
      onClick={() => onFilter({ mode: id, tag: null, folder: null })}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${filter.mode === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span className="text-sm">{label}</span>
      {count != null && <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">{count}</span>}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 pb-3 pt-5">
        <span className="font-heading text-lg font-extrabold tracking-tight">Mind</span>
        {onClose && <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground md:hidden">✕</button>}
      </div>

      <div className="px-3">
        <select
          value={workspace}
          onChange={(e) => (e.target.value === "__new" ? onAddWorkspace() : onWorkspace(e.target.value))}
          className="w-full rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {workspaces.map((w) => <option key={w} value={w}>{w}</option>)}
          <option value="__new">+ New workspace…</option>
        </select>
      </div>

      <div className="flex gap-2 px-3 pt-3">
        <button onClick={onNewNote} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Note
        </button>
        <button onClick={onDaily} className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs hover:border-primary hover:text-primary">
          <Sun className="h-4 w-4" /> Daily
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/40 px-2.5 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); onFilter({ ...filter, search: e.target.value }); }}
            placeholder="Search notes…" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/50" />
        </div>
      </div>

      <div className="mt-3 flex gap-1 px-3">
        <button onClick={() => onView("dashboard")} className={`flex-1 rounded-lg px-2 py-1.5 text-xs ${view === "dashboard" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          <LayoutDashboard className="mx-auto h-4 w-4" strokeWidth={1.5} />
        </button>
        <button onClick={() => onView("graph")} className={`flex-1 rounded-lg px-2 py-1.5 text-xs ${view === "graph" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          <Network className="mx-auto h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {navItem("all", FileText, "All notes", notes.length)}
        {navItem("favorites", Star, "Favorites", notes.filter((n) => n.favorite).length)}
        {navItem("pinned", Pin, "Pinned", notes.filter((n) => n.pinned).length)}
        {navItem("templates", FileText, "Templates", notes.filter((n) => n.is_template).length)}

        <div className="px-1 pt-4 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Folders</div>
        <FolderTree tree={folderTree} path="" activeFolder={filter.folder} onPick={(f) => onFilter({ mode: "folder", folder: f, tag: null })} />

        {tags.length > 0 && (
          <>
            <div className="px-1 pt-4 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Tags</div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map(([t, c]) => (
                <button key={t} onClick={() => onFilter({ mode: "tag", tag: t, folder: null })}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${filter.tag === t ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-muted-foreground hover:text-foreground"}`}>
                  <Hash className="h-3 w-3" />{t}<span className="font-mono text-[9px] opacity-60">{c}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
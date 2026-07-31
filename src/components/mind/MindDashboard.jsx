import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, Pin, FileText, Sparkles, Sun } from "lucide-react";

const EMOJIS = ["📝", "✨", "🧠", "💡", "📚", "🎯", "🔬", "🚀", "🎨", "🟣", "🗂️", "🧩"];

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NoteCard({ note, onOpen }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={() => onOpen(note.id)}
      className="group flex flex-col rounded-2xl border border-border/50 bg-card/60 p-4 text-left transition-all hover:border-primary/60 hover:bg-card"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{note.icon || "📝"}</span>
        <span className="flex-1 truncate font-heading text-sm font-semibold text-foreground">{note.title || "Untitled"}</span>
        {note.pinned && <Pin className="h-3.5 w-3.5 text-primary" fill="currentColor" />}
        {note.favorite && <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />}
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {(note.content || "").replace(/[#*`\[\]]/g, "").slice(0, 140) || "No content"}
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        {note.is_template && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase text-primary">Template</span>}
        {(note.tags || []).slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">#{t}</span>
        ))}
        <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">{timeAgo(note.updated_date)}</span>
      </div>
    </motion.button>
  );
}

function Section({ title, icon: Icon, notes, onOpen, onMore }) {
  if (!notes.length) return null;
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
        <span className="font-mono text-[10px] text-muted-foreground/50">{notes.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {notes.slice(0, 8).map((n) => <NoteCard key={n.id} note={n} onOpen={onOpen} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MindDashboard({ notes, onOpen, onNew, onDaily, hasDailyToday, onNewFromTemplate, templates }) {
  const sorted = [...notes].sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
  const favorites = sorted.filter((n) => n.favorite);
  const pinned = sorted.filter((n) => n.pinned);
  const templatesList = sorted.filter((n) => n.is_template);
  void templates; void onNewFromTemplate;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{notes.length} notes in this workspace</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onDaily} className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2.5 text-xs font-medium hover:border-primary hover:text-primary">
            <Sun className="h-4 w-4" strokeWidth={1.5} /> {hasDailyToday ? "Open daily" : "Daily note"}
          </button>
          <button onClick={onNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> New note
          </button>
        </div>
      </div>

      <Section title="Pinned" icon={Pin} notes={pinned} onOpen={onOpen} />
      <Section title="Favorites" icon={Star} notes={favorites} onOpen={onOpen} />
      <Section title="Templates" icon={FileText} notes={templatesList} onOpen={onOpen} />
      <Section title="Recently edited" icon={Sparkles} notes={sorted} onOpen={onOpen} />
    </div>
  );
}
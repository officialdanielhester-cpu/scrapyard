import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Star, Pin, Download, Trash2, Sparkles, Tag, Loader2, Link2, FileText, PanelRightClose, PanelLeftClose, Eye, PenLine, Columns2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { preprocessMarkdown, backlinks, todayKey } from "@/components/mind/markdown-utils";

const EMOJIS = ["📝", "✨", "🧠", "💡", "📚", "🎯", "🔬", "🚀", "🎨", "🟣", "🗂️", "🧩", "⭐", "🔥", "🪐"];

export default function MindEditor({ note, notes, onChange, onBack, onDelete, onOpenById, onOpenByTitle }) {
  const [busy, setBusy] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [pane, setPane] = useState("split"); // split | edit | preview
  const [showBacklinks, setShowBacklinks] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);

  if (!note) return null;
  const links = backlinks(notes, note);

  const exportMd = () => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(note.title || "note").replace(/[^a-z0-9-_ ]/gi, "")}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const summarize = async () => {
    setBusy("summarize");
    try {
      const r = await base44.integrations.Core.InvokeLLM({ prompt: `Summarize the following note as 3-5 concise markdown bullet points.\n\nTitle: ${note.title}\n\n${note.content}` });
      const s = typeof r === "string" ? r : r?.reply || "";
      onChange({ content: `## Summary\n${s}\n\n---\n\n${note.content}` });
    } catch {} finally { setBusy(null); }
  };

  const suggestTags = async () => {
    setBusy("tags");
    try {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest 3-6 short tags for this note. Output only the tags, comma-separated, no #.\n\nTitle: ${note.title}\n\n${note.content}`,
        response_json_schema: { type: "object", properties: { tags: { type: "array", items: { type: "string" } } }, required: ["tags"] }
      });
      const ts = (r?.tags || []).map((t) => t.toLowerCase().replace(/^#/, "").trim()).filter(Boolean);
      onChange({ tags: Array.from(new Set([...(note.tags || []), ...ts])) });
    } catch {} finally { setBusy(null); }
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    setBusy("ai");
    try {
      const r = await base44.integrations.Core.InvokeLLM({ prompt: `You are an AI writing assistant inside a notes app called Mind. The user's current note "${note.title}" contains:\n${note.content}\n\nUser request: ${aiPrompt}\n\nRespond with markdown content to help. Output only the content.` });
      const out = (typeof r === "string" ? r : r?.reply || "").trim();
      const sep = note.content && !note.content.endsWith("\n") ? "\n\n" : "";
      onChange({ content: note.content + sep + out });
      setAiPrompt("");
    } catch {} finally { setBusy(null); }
  };

  const paneBtn = (id, Icon, label) => (
    <button onClick={() => setPane(id)} title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${pane === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-4 py-2.5 md:px-6">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></button>
        <div className="relative">
          <button onClick={() => setEmojiOpen((v) => !v)} className="text-xl">{note.icon || "📝"}</button>
          {emojiOpen && (
            <div className="absolute z-30 mt-1 grid w-44 grid-cols-6 gap-1 rounded-xl border border-border/60 bg-popover p-2 shadow-lg">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => { onChange({ icon: e }); setEmojiOpen(false); }} className="rounded-md p-1 text-lg hover:bg-foreground/10">{e}</button>
              ))}
            </div>
          )}
        </div>
        <input value={note.title} onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Untitled"
          className="min-w-0 flex-1 bg-transparent font-heading text-lg font-bold outline-none" />
        <button onClick={() => onChange({ favorite: !note.favorite })} title="Favorite"
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${note.favorite ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}>
          <Star className="h-4 w-4" fill={note.favorite ? "currentColor" : "none"} />
        </button>
        <button onClick={() => onChange({ pinned: !note.pinned })} title="Pin"
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${note.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          <Pin className="h-4 w-4" fill={note.pinned ? "currentColor" : "none"} />
        </button>
        <div className="hidden items-center gap-1 rounded-lg border border-border/40 p-0.5 sm:flex">
          {paneBtn("split", Columns2, "Split")}
          {paneBtn("edit", PenLine, "Edit only")}
          {paneBtn("preview", Eye, "Preview only")}
        </div>
        <button onClick={exportMd} title="Export Markdown" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><Download className="h-4 w-4" /></button>
        <button onClick={onDelete} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-4 py-2 md:px-6">
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-muted-foreground"><Link2 className="h-3 w-3" /> {note.folder || "Inbox"}</span>
        <input value={(note.tags || []).join(", ")} onChange={(e) => onChange({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
          placeholder="tags, comma separated"
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/50" />
        <input value={(note.aliases || []).join(", ")} onChange={(e) => onChange({ aliases: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
          placeholder="aliases"
          className="hidden min-w-0 flex-1 bg-transparent font-mono text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/40 sm:block" />
      </div>

      {/* AI bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-4 py-2 md:px-6">
        <button onClick={summarize} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary disabled:opacity-50">
          {busy === "summarize" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Summarize
        </button>
        <button onClick={suggestTags} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary disabled:opacity-50">
          {busy === "tags" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />} Suggest tags
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAI()}
            placeholder="Ask AI to write / expand / research…"
            className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-xs outline-none focus:border-primary" />
          <button onClick={askAI} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
            {busy === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Insert
          </button>
        </div>
      </div>

      {/* Editor + preview */}
      <div className="flex min-h-0 flex-1">
        <div className={`flex min-h-0 flex-1 flex-col ${pane === "preview" ? "hidden" : "flex"} ${pane === "split" ? "sm:border-r sm:border-border/40" : ""}`}>
          {pane !== "split" && pane !== "edit" ? null : (
            <textarea
              value={note.content}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder="Write in markdown… use [[Note Title]] to link notes. # heading, - list, ```code, > quote, ![alt](url) image, - [ ] todo"
              spellCheck
              className="min-h-0 w-full flex-1 resize-none bg-transparent px-6 py-5 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          )}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${pane === "edit" ? "hidden" : "block"}`}>
          <div className="prose-note max-w-none">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  if (href && href.startsWith("#note:")) {
                    const t = decodeURIComponent(href.slice(6));
                    return <a href="#" onClick={(e) => { e.preventDefault(); onOpenByTitle(t); }} className="text-primary underline decoration-primary/40 underline-offset-2">{children}</a>;
                  }
                  return <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">{children}</a>;
                },
              }}
            >
              {preprocessMarkdown(note.content) || "*Nothing to preview yet — start writing on the left.*"}
            </ReactMarkdown>
          </div>
        </div>

        {/* Backlinks */}
        {showBacklinks && links.length > 0 && (
          <div className="hidden w-64 shrink-0 overflow-y-auto border-l border-border/40 p-4 lg:block">
            <button onClick={() => setShowBacklinks(false)} className="mb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
              <PanelRightClose className="h-3 w-3" /> Backlinks
            </button>
            <div className="space-y-2">
              {links.map((l) => (
                <button key={l.id} onClick={() => onOpenById(l.id)} className="block w-full rounded-lg border border-border/40 p-2 text-left hover:border-primary/50">
                  <span className="mr-1 text-sm">{l.icon || "📝"}</span>
                  <span className="text-sm font-medium">{l.title}</span>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{(l.content || "").replace(/[#*`\[\]]/g, "").slice(0, 80)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="border-t border-border/40 px-6 py-1.5 font-mono text-[10px] text-muted-foreground/60">Autosaved · {todayKey()}</p>
    </div>
  );
}
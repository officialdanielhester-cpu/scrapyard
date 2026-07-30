import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Users } from "lucide-react";

export default function CollabPanel({ open, onOpenChange, roomId, userName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = async () => {
    if (!roomId) return;
    try {
      const list = await base44.entities.CollabMessage.filter({ project_id: roomId }, "created_date", 100);
      setMessages(list);
    } catch {}
  };
  useEffect(() => { if (open && roomId) load(); }, [open, roomId]);

  useEffect(() => {
    if (!open || !roomId) return;
    const unsub = base44.entities.CollabMessage.subscribe((event) => {
      if (event.type === "create" && event.data?.project_id === roomId) {
        setMessages((m) => [...m, event.data]);
      }
    });
    return unsub;
  }, [open, roomId]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !roomId) return;
    setSending(true); setText("");
    try { await base44.entities.CollabMessage.create({ project_id: roomId, author: userName || "You", text: t }); }
    catch {} finally { setSending(false); }
  };

  const authors = new Set(messages.map((m) => m.author));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Collaboration</SheetTitle>
          <p className="font-mono text-[10px] text-muted-foreground">{authors.size} participant{authors.size === 1 ? "" : "s"} · realtime</p>
        </SheetHeader>
        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-2">
          {!roomId && <p className="text-xs text-muted-foreground">Save the project to open a shared chat room — anyone with the project can join.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.author === (userName || "You") ? "ml-6 bg-primary/10" : "mr-6 border border-border/40"}`}>
              <p className="font-mono text-[10px] text-muted-foreground">{m.author}</p>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border/40 p-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm" />
          <button type="submit" disabled={sending || !text.trim() || !roomId} className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4" /></button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Sparkles, Volume2, VolumeX, Loader2, Sigma, FileCode2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import { useVoice } from "@/hooks/use-voice";
import { useJabberSettings } from "@/hooks/use-jabber-settings";
import { callWebsiteB, formatAdminResult, adminErrorMessage } from "@/lib/websiteB";
import { fetchRecentMemories, saveMemory, lookupAetheris } from "@/lib/jabber-memory";
import FormulaLibrary from "@/components/jabber/FormulaLibrary";
import CodeLibrary from "@/components/jabber/CodeLibrary";
import AttachmentBar from "@/components/jabber/AttachmentBar";

const SEED_MESSAGES = [
{
  role: "assistant",
  content:
  "I'm Jabber — your ambient intelligence layer. I remember our past chats, can look up what you've saved in Aetheris, and manage your list on Recall."
}];


const SUGGESTIONS = [
"What do you remember about our chats?",
"Write a function to reverse a string",
"What's on my Recall list?"];


const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    intent: { type: "string", enum: ["recall", "lookup", "admin", "code", "chat"] },
    recall_query: { type: "string", default: "" },
    lookup_kind: { type: "string", enum: ["models", "experiments", "builds", "tasks"], default: "tasks" },
    gateway: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list_tasks", "create_task", "update_task", "delete_task"] },
        params: { type: "object" }
      }
    },
    code: {
      type: "object",
      properties: {
        name: { type: "string" },
        language: { type: "string" },
        description: { type: "string" },
        content: { type: "string" }
      }
    },
    reply: { type: "string" }
  },
  required: ["intent", "reply"]
};

export default function JabberSection() {
  const { speakEnabled, setSpeakEnabled, speak, speaking } = useVoice();
  const { settings } = useJabberSettings();
  const connected = !!settings.connected;
  const tasksAllowed = !!(settings.permissions && settings.permissions.tasks);
  const persist = !settings.private;
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [working, setWorking] = useState(false);
  const [workLabel, setWorkLabel] = useState("");
  const [error, setError] = useState(null);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const scrollRef = useRef(null);

  // Recall past conversations into the chat view on mount.
  useEffect(() => {
    (async () => {
      const mems = await fetchRecentMemories(15);
      if (mems.length) setMessages(mems.map((m) => ({ role: m.role, content: m.content })));
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking, working, speaking]);

  const refresh = async () => {
    const mems = await fetchRecentMemories(15);
    if (mems.length) setMessages(mems.map((m) => ({ role: m.role, content: m.content })));
  };

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content || thinking || working) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    const activeAttachments = attachments;
    setAttachments([]);
    setThinking(true);
    try {
      const recent = await fetchRecentMemories(12);
      const memoryContext = recent.length ?
      recent.map((m) => `${m.role === "user" ? "User" : "Jabber"}: ${m.content}`).join("\n") :
      "(no past conversations stored yet)";
      await saveMemory("user", content + (activeAttachments.length ? ` ${activeAttachments.map((a) => a.text).join(" ")}` : ""), persist);

      if (activeAttachments.length) {
        const ctxText = activeAttachments.map((a) => a.text).join("\n");
        const fileUrls = activeAttachments.flatMap((a) => a.fileUrls || []);
        const hasLink = activeAttachments.some((a) => a.kind === "link");
        const decipherPrompt = `You are Jabber, an ambient intelligence layer in an app called Aetheris. The user said: "${content}". They also shared these attachments:\n${ctxText}\n\nHelp them understand and decipher the attachments — identify what each is, summarize the content, extract key information, and answer anything implied. For links, use web context. Be clear and concise (2-5 sentences).`;
        const dres = await base44.integrations.Core.InvokeLLM({
          prompt: decipherPrompt,
          file_urls: fileUrls.length ? fileUrls : undefined,
          add_context_from_internet: hasLink,
          model: hasLink ? "gemini_3_flash" : undefined,
          response_json_schema: { type: "object", properties: { reply: { type: "string" } }, required: ["reply"] }
        });
        let reply = (dres?.reply || "I couldn't make sense of that — try again.").trim();
        setThinking(false);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        await saveMemory("assistant", reply, persist);
        if (speakEnabled) speak(reply);
        return;
      }

      const classifyPrompt = `You are Jabber, an ambient intelligence layer in an app called Aetheris. You have a memory — past conversations are stored and shown below. You can also read saved files in Aetheris (models, experiments, builds, tasks) and manage a task list on a linked app called "Recall".
Current link status — connected to Recall: ${connected}; tasks permission granted: ${tasksAllowed}.

Decide the user's intent:
- "recall": they ask what you remember, about past conversations, "do you remember", "what did we talk about", "last time", or reference something said before. Answer from the memory provided.
- "lookup": they ask what they've saved/created/built in Aetheris — models, experiments, builds, or local tasks ("what models do I have?", "my experiments", "saved builds"). Set lookup_kind accordingly.
- "admin": they want to manage tasks on Recall (create, list, mark done/complete, update, delete) or reference the other/second app. Set gateway.action + gateway.params. Examples: list_tasks → {"action":"list_tasks","params":{}}; update_task → {"action":"update_task","params":{"title":"review notes","status":"done"}} (status: todo/in_progress/done); delete_task → {"action":"delete_task","params":{"title":"old draft"}}. For create_task → ALWAYS create a quick task immediately, no questions: {"action":"create_task","params":{"title":"<short label>"}}. Derive the title from the user's own words (2-6 words, e.g. "buy milk", "call mom tuesday"). If they only give a topic or say "add a task"/"remind me to X", use that topic as the title. Never ask for a title, never refuse, never leave params.title empty — just add it.
- "code": they ask you to write, create, generate, or make code — a script, function, snippet, program, or file ("write a function that…", "make a python script to…", "generate code for…"). Set the code object: name (snake_case filename, no extension), language (e.g. javascript, python, typescript), description (one short line), and content (the full, complete, runnable code).
- "chat": anything else — answer naturally.

Return JSON:
- intent
- recall_query: if recall, short keywords (else "")
- lookup_kind: if lookup, one of models/experiments/builds/tasks (else "tasks")
- gateway: if admin, {action, params}; else null
- code: if code, {name, language, description, content}; else null
- reply: a calm, concise 1-3 sentence reply. For recall, answer from memory (say you don't recall it if it's not there). For lookup/admin/code, a one-line ack (the data/code is handled separately). For chat, answer naturally.

Recent memory (oldest first):
${memoryContext}

User: ${content}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: classifyPrompt,
        response_json_schema: CLASSIFY_SCHEMA
      });
      const intent = res?.intent || "chat";
      setThinking(false);

      let reply = (res?.reply || "I'm here.").trim();

      if (intent === "admin") {
        const gw = res.gateway || {};
        if (!connected || !tasksAllowed) {
          reply = "I'm not connected to Recall yet. Turn it on in Settings → Connection.";
        } else if (!gw.action) {
          reply = 'I wasn\'t sure what to do on Recall — try "add X to my list", "what\'s on my list?", or "mark X as done".';
        } else {
          setWorkLabel("Administering Recall…");
          setWorking(true);
          try {
            const data = await callWebsiteB(gw.action, gw.params || {});
            reply = formatAdminResult(gw.action, gw.params || {}, data);
          } catch (e) {
            reply = adminErrorMessage(e);
          } finally {
            setWorking(false);
          }
        }
      } else if (intent === "lookup") {
        setWorkLabel("Reading your saved files…");
        setWorking(true);
        try {
          reply = await lookupAetheris(res.lookup_kind || "tasks");
        } finally {
          setWorking(false);
        }
      } else if (intent === "code") {
        const code = res.code || {};
        if (!code.content) {
          reply = reply || "Tell me what the code should do and which language — I'll write and save it.";
        } else {
          setWorkLabel("Writing code…");
          setWorking(true);
          try {
            const created = await base44.entities.CodeFile.create({
              name: code.name || "snippet",
              language: code.language || "javascript",
              description: code.description || "",
              content: String(code.content)
            });
            reply = `Saved "${created.name}" (${created.language}) to your Code Library — open it via the Code button to view or copy.${code.description ? ` ${code.description}` : ""}`;
          } catch (e) {
            reply = `I wrote it but couldn't save the file — ${e.message || "try again."}`;
          } finally {
            setWorking(false);
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      await saveMemory("assistant", reply, persist);
      if (speakEnabled) speak(reply);
    } catch (e) {
      setError(e.message || "Jabber stumbled — try again.");
    } finally {
      setThinking(false);
      setWorking(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-5 md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Jabber</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            The Conversation Layer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFormulaOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-xs font-medium text-foreground/80 transition-all hover:border-primary hover:text-primary">
            
            <Sigma className="h-4 w-4" strokeWidth={1.5} />
            Formulas
          </button>
          <button
            onClick={() => setCodeOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-xs font-medium text-foreground/80 transition-all hover:border-primary hover:text-primary">
            
            <FileCode2 className="h-4 w-4" strokeWidth={1.5} />
            Code
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 hidden">
            <span className={`h-1.5 w-1.5 rounded-full ${speaking ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hidden">
              {speaking ? "Speaking" : "Listening"}
            </span>
          </div>
        </div>
      </header>

      <PullToRefresh ref={scrollRef} onRefresh={refresh} className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, idx) =>
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            
              {msg.role === "assistant" &&
            <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
            }
              <div
              className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed transition-all ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "border border-border/50 bg-background"}`
              }>
              
                {msg.content}
              </div>
            </motion.div>
          )}

          {(thinking || working) &&
          <div className="flex justify-start">
              <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/50 px-5 py-4">
                {working ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : null}
                {[0, 1, 2].map((i) =>
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/70"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />

              )}
                <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {working ? workLabel : "Thinking"}
                </span>
              </div>
            </div>
          }

          {messages.length === 1 && !thinking && !working &&
          <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) =>
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="rounded-full border border-border/60 px-4 py-2 text-sm text-foreground/80 transition-all hover:border-primary hover:text-primary">
              
                  {s}
                </button>
            )}
            </div>
          }
        </div>
      </PullToRefresh>

      <div className="border-t border-border/40 px-6 py-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <AttachmentBar attachments={attachments} setAttachments={setAttachments} />
          <form
            onSubmit={(e) => {e.preventDefault();handleSend();}}
            className="group relative">
            
            <div className="flex items-end gap-3 border-b border-border pb-3 transition-colors focus-within:border-primary">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything, recall a past chat, or manage Recall…"
                className="flex-1 bg-transparent py-1 font-body text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none" />
              
              <button
                type="button"
                onClick={() => setSpeakEnabled(!speakEnabled)}
                title={speakEnabled ? "Voice on" : "Voice off"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                speakEnabled ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`
                }>
                
                {speakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || thinking || working}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-80 disabled:opacity-30">
                
                <ArrowUp className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </form>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {settings.private ?
            "Private mode on — conversations aren't stored" :
            `${speakEnabled ? "Voice on — " : ""}Memory on — Jabber remembers this chat`}
          </p>
        </div>
      </div>

      <FormulaLibrary
        open={formulaOpen}
        onClose={() => setFormulaOpen(false)}
        onInsert={(eq) => {setInput(eq);setFormulaOpen(false);}} />
      
      <CodeLibrary open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>);

}
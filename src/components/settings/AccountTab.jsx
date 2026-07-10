import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Link2, Unlink, LogOut, Sparkles, Boxes, FlaskConical, Hammer, ListTodo, Loader2, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useJabberSettings } from "@/hooks/use-jabber-settings";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DATA_CARDS = [
  { key: "memories", label: "Memories", icon: Sparkles, entity: "Memory", summary: (i) => `${i.role}: ${i.content}` },
  { key: "models", label: "Models", icon: Boxes, entity: "Model", summary: (i) => i.name },
  { key: "experiments", label: "Experiments", icon: FlaskConical, entity: "Experiment", summary: (i) => i.name },
  { key: "builds", label: "Builds", icon: Hammer, entity: "VehicleBuild", summary: (i) => i.name },
  { key: "tasks", label: "Tasks", icon: ListTodo, entity: "Task", summary: (i) => `${i.title}${i.status ? ` · ${i.status}` : ""}` },
];

export default function AccountTab() {
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [msg, setMsg] = useState(null);
  const [data, setData] = useState({});
  const [openKey, setOpenKey] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const { settings, update } = useJabberSettings();

  const load = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
      setLinkEmail(me?.linked_website_b?.email || "");
      const entries = await Promise.all(
        DATA_CARDS.map(async (c) => {
          try {
            const items = await base44.entities[c.entity].list("-created_date", 100);
            return [c.key, items?.length || 0];
          } catch {
            return [c.key, 0];
          }
        })
      );
      setCounts(Object.fromEntries(entries));
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Couldn't load your profile." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleCard = async (c) => {
    if (openKey === c.key) { setOpenKey(null); return; }
    setOpenKey(c.key);
    if (!data[c.key]) {
      try {
        const items = await base44.entities[c.entity].list("-created_date", 100);
        setData((d) => ({ ...d, [c.key]: items || [] }));
      } catch {
        setData((d) => ({ ...d, [c.key]: [] }));
      }
    }
  };

  const linkProfile = async () => {
    const email = linkEmail.trim();
    if (!email) { setMsg({ type: "error", text: "Enter your Recall account email." }); return; }
    setLinking(true);
    setMsg(null);
    try {
      await base44.auth.updateMe({ linked_website_b: { email } });
      update({ connected: true, permissions: { ...settings.permissions, tasks: true } });
      setUser((u) => ({ ...u, linked_website_b: { email } }));
      setMsg({ type: "ok", text: `Linked to Recall as ${email} — Jabber can now manage your tasks there.` });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Couldn't link profile." });
    } finally {
      setLinking(false);
    }
  };

  const unlinkProfile = async () => {
    setLinking(true);
    setMsg(null);
    try {
      await base44.auth.updateMe({ linked_website_b: null });
      setUser((u) => ({ ...u, linked_website_b: null }));
      setLinkEmail("");
      setMsg({ type: "ok", text: "Unlinked from Recall." });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Couldn't unlink." });
    } finally {
      setLinking(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await base44.functions.invoke("deleteAccount", {});
      if (!res?.data?.success) throw new Error(res?.data?.error || "Deletion failed.");
      await base44.auth.logout();
    } catch (e) {
      setDeleteMsg({ type: "error", text: e.message || "Couldn't delete account." });
      setDeleting(false);
    }
  };

  const linkedEmail = user?.linked_website_b?.email;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-bold truncate">{user?.full_name || "Aetheris user"}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {user?.email || "—"}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3 w-3" /> {user?.role || "user"}
          </span>
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your Data</h4>
        <div className="space-y-3">
          {DATA_CARDS.map((c) => {
            const Icon = c.icon;
            const open = openKey === c.key;
            const items = data[c.key];
            return (
              <div key={c.key} className="overflow-hidden rounded-2xl border border-border/50">
                <button
                  onClick={() => toggleCard(c)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-foreground/5"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="ml-auto font-heading text-lg font-extrabold">
                    {loading ? "—" : counts[c.key] ?? 0}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    strokeWidth={1.5}
                  />
                </button>
                {open && (
                  <div className="max-h-64 overflow-y-auto border-t border-border/40 px-4 py-3">
                    {!items ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                      </div>
                    ) : items.length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">Nothing here yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((it) => (
                          <li
                            key={it.id}
                            className="truncate rounded-md bg-foreground/5 px-2.5 py-1.5 text-xs text-foreground/80"
                          >
                            {c.summary(it)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Private to you — only your account can see these
        </p>
      </div>

      <div>
        <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Link Recall</h4>
        <div className="rounded-2xl border border-border/50 p-5">
          {linkedEmail ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Link2 className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Linked as {linkedEmail}</p>
                  <p className="text-xs text-muted-foreground">Jabber manages this profile on Recall</p>
                </div>
              </div>
              <button
                onClick={unlinkProfile}
                disabled={linking}
                className="flex shrink-0 items-center gap-2 rounded-md border border-border/60 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                Unlink
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-foreground/80">
                Link your Recall account so Jabber manages your tasks there under your identity — no separate sign-in.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="your Recall email"
                  className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={linkProfile}
                  disabled={linking}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Link Profile
                </button>
              </div>
            </div>
          )}
          {msg && (
            <p className={`mt-3 text-xs ${msg.type === "error" ? "text-destructive" : "text-emerald-500"}`}>{msg.text}</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Danger Zone</h4>
        <div className="rounded-2xl border border-destructive/40 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">Delete your account</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Permanently removes your account and all saved data — memories, models, experiments, builds, tasks, and code. This cannot be undone.</p>
              </div>
            </div>
            <button
              onClick={() => { setDeleteOpen(true); setConfirmText(""); setDeleteMsg(null); }}
              className="flex shrink-0 items-center gap-2 rounded-md border border-destructive/60 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete account
            </button>
          </div>
          {deleteMsg && deleteMsg.type === "error" && (
            <p className="mt-3 text-xs text-destructive">{deleteMsg.text}</p>
          )}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleting(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and all associated data. This action is irreversible. Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:border-destructive focus:outline-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button
        onClick={() => base44.auth.logout()}
        className="flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/5"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}
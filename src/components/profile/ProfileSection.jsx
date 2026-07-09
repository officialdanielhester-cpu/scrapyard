import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Link2, Unlink, LogOut, Sparkles, Boxes, FlaskConical, Hammer, ListTodo, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useJabberSettings } from "@/hooks/use-jabber-settings";

const DATA_CARDS = [
  { key: "memories", label: "Jabber Memories", icon: Sparkles, entity: "Memory" },
  { key: "models", label: "Models", icon: Boxes, entity: "Model" },
  { key: "experiments", label: "Experiments", icon: FlaskConical, entity: "Experiment" },
  { key: "builds", label: "Builds", icon: Hammer, entity: "VehicleBuild" },
  { key: "tasks", label: "Tasks", icon: ListTodo, entity: "Task" },
];

export default function ProfileSection() {
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [msg, setMsg] = useState(null);
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

  const linkProfile = async () => {
    const email = linkEmail.trim();
    if (!email) { setMsg({ type: "error", text: "Enter your website B account email." }); return; }
    setLinking(true);
    setMsg(null);
    try {
      await base44.auth.updateMe({ linked_website_b: { email } });
      // Auto-enable the gateway so Jabber can manage the linked profile right away.
      update({ connected: true, permissions: { ...settings.permissions, tasks: true } });
      setUser((u) => ({ ...u, linked_website_b: { email } }));
      setMsg({ type: "ok", text: `Linked to website B as ${email} — Jabber can now manage your tasks there.` });
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
      setMsg({ type: "ok", text: "Unlinked from website B." });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Couldn't unlink." });
    } finally {
      setLinking(false);
    }
  };

  const linkedEmail = user?.linked_website_b?.email;

  return (
    <div className="h-full overflow-y-auto">
      <header className="px-6 py-5 md:px-12">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Account</h1>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Your Identity & Linked Profiles
        </p>
      </header>

      <div className="px-6 md:px-12">
        <div className="mx-auto max-w-2xl pb-16 space-y-10">
          <section className="rounded-2xl border border-border/50 p-6">
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
          </section>

          <section>
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your Data</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DATA_CARDS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.key} className="rounded-2xl border border-border/50 p-4">
                    <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <p className="mt-3 font-heading text-2xl font-extrabold">
                      {loading ? "—" : counts[c.key] ?? 0}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Private to you — only your account can see these
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Link Website B</h2>
            <div className="rounded-2xl border border-border/50 p-5">
              {linkedEmail ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <Link2 className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Linked as {linkedEmail}</p>
                      <p className="text-xs text-muted-foreground">Jabber manages this profile on website B</p>
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
                    Link your website B account so Jabber manages your tasks there under your identity — no separate sign-in.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="your website B email"
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
          </section>

          <section>
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
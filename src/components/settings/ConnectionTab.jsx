import React, { useState } from "react";
import { Link2, ListChecks, MessageSquare, FolderKanban } from "lucide-react";

const OVERSIGHT = [
  { id: "tasks", label: "Tasks", desc: "Create, assign, and track tasks on your behalf", icon: ListChecks },
  { id: "messages", label: "Messages", desc: "Read and draft messages within projects", icon: MessageSquare },
  { id: "projects", label: "Projects", desc: "Oversee project progress and status", icon: FolderKanban },
];

export default function ConnectionTab() {
  const [connected, setConnected] = useState(false);
  const [permissions, setPermissions] = useState({ tasks: true, messages: false, projects: true });

  const togglePerm = (id) => setPermissions((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60">
              <Link2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold">Task Management</h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                Connect Jabber to your task management workspace. Jabber will
                oversee, create, and manage tasks, messages, and projects on
                your behalf.
              </p>
            </div>
          </div>
          <button
            onClick={() => setConnected((c) => !c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              connected
                ? "border border-border/60 text-foreground hover:bg-foreground/5"
                : "bg-primary text-primary-foreground hover:opacity-80"
            }`}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Oversight Permissions
        </h4>
        <div className="divide-y divide-border/40 rounded-2xl border border-border/50">
          {OVERSIGHT.map((item) => {
            const Icon = item.icon;
            const on = permissions[item.id];
            return (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePerm(item.id)}
                  role="switch"
                  aria-checked={on}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    on ? "bg-primary" : "bg-foreground/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform duration-300 ${
                      on ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        Placeholder · no real workspace is accessed
      </p>
    </div>
  );
}
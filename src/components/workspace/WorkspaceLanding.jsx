import React from "react";
import { Search } from "lucide-react";
import JabberSection from "@/components/jabber/JabberSection";
import ContinueWorking from "./ContinueWorking";
import RecentWorkspaces from "./RecentWorkspaces";

export default function WorkspaceLanding({ onNavigate, onOpenSearch, recentItems, recentLoading }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar: search trigger */}
      <div className="shrink-0 border-b border-border/40 bg-background/50 px-4 py-2.5 backdrop-blur md:px-8">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={onOpenSearch}
            className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary"
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">Search everything — projects, notes, designs, conversations…</span>
            <kbd className="hidden rounded-md border border-border/40 px-1.5 py-0.5 font-mono text-[10px] sm:block">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Main: chat + right panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Chat — primary focus */}
        <div className="h-full min-w-0 flex-1">
          <JabberSection />
        </div>

        {/* Right sidebar: continue working + recent workspaces */}
        <aside className="hidden h-full w-72 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border/40 p-4 lg:flex">
          <ContinueWorking items={recentItems} loading={recentLoading} onNavigate={onNavigate} />
          <div className="h-px bg-border/40" />
          <RecentWorkspaces onNavigate={onNavigate} currentWorkspace="jabber" />
        </aside>
      </div>
    </div>
  );
}
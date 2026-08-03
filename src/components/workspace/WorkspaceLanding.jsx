import React from "react";
import JabberSection from "@/components/jabber/JabberSection";
import UniversalSearch from "./UniversalSearch";
import ContinueWorking from "./ContinueWorking";
import RecentWorkspaces from "./RecentWorkspaces";
import { useRecentItems } from "./workspace-data";

export default function WorkspaceLanding({ onNavigate }) {
  const { items, loading } = useRecentItems();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar: universal search */}
      <div className="shrink-0 border-b border-border/40 bg-background/50 px-4 py-2.5 backdrop-blur md:px-8">
        <UniversalSearch items={items} loading={loading} onNavigate={onNavigate} />
      </div>

      {/* Main: chat + right panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Chat — primary focus */}
        <div className="h-full min-w-0 flex-1">
          <JabberSection />
        </div>

        {/* Right sidebar: continue working + recent workspaces */}
        <aside className="hidden h-full w-72 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border/40 p-4 lg:flex">
          <ContinueWorking items={items} loading={loading} onNavigate={onNavigate} />
          <div className="h-px bg-border/40" />
          <RecentWorkspaces onNavigate={onNavigate} currentWorkspace="jabber" />
        </aside>
      </div>
    </div>
  );
}
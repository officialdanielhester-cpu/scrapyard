import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { History, RotateCcw, Save, Loader2 } from "lucide-react";

export default function VersionHistory({ open, onOpenChange, projectId, project, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const list = await base44.entities.ProjectVersion.filter({ project_id: projectId }, "-version_number", 50);
      setVersions(list);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(); }, [open, projectId]);

  const saveVersion = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const v = await base44.entities.ProjectVersion.create({
        project_id: projectId,
        name: project.name,
        snapshot: project,
        version_number: (versions[0]?.version_number || 0) + 1,
      });
      setVersions([v, ...versions]);
    } catch {} finally { setLoading(false); }
  };
  const restore = (v) => { if (v.snapshot) { onRestore(v.snapshot); onOpenChange(false); } };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Version History</SheetTitle></SheetHeader>
        <div className="space-y-2 p-2">
          <button onClick={saveVersion} disabled={loading || !projectId} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground disabled:opacity-40">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Snapshot
          </button>
          {!projectId && <p className="text-xs text-muted-foreground">Save the project first to enable cloud version history.</p>}
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm">v{v.version_number}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{new Date(v.created_date).toLocaleString()}</p>
              </div>
              <button onClick={() => restore(v)} className="rounded-md border border-border/60 p-1.5 hover:border-primary"><RotateCcw className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
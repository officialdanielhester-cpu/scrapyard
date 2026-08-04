import { base44 } from "@/api/base44Client";
import { getCurrentProjectId, getRecentEdits } from "./use-current-project";
import { TYPE_META, getRecentWorkspaces, WORKSPACE_META } from "./workspace-data";

// Build a context block that Jabber injects into every LLM prompt so it
// understands what the user is currently working on without being told.
export async function buildJabberContext() {
  const parts = [];

  // Recently used workspaces — tells Jabber what the user has been doing.
  const recentWs = getRecentWorkspaces();
  if (recentWs.length > 0) {
    const labels = recentWs.slice(0, 4)
      .map((w) => WORKSPACE_META[w.id]?.label || w.id)
      .filter(Boolean);
    if (labels.length) parts.push(`Recently used workspaces: ${labels.join(" → ")}`);
  }

  // Current project + its contents
  const pid = getCurrentProjectId();
  if (pid) {
    try {
      const proj = await base44.entities.Project.get(pid);
      if (proj) {
        parts.push(`Currently open project: "${proj.name}"${proj.description ? ` — ${proj.description}` : ""}`);
        try {
          const items = await base44.entities.ProjectItem.filter({ project_id: pid }, "-created_date", 20);
          if (items.length) {
            const byType = {};
            items.forEach((it) => {
              const label = TYPE_META[it.content_type]?.label || it.content_type;
              if (!byType[label]) byType[label] = [];
              byType[label].push(it.content_name || "Untitled");
            });
            const summary = Object.entries(byType)
              .map(([label, names]) => `${label}: ${names.slice(0, 4).join(", ")}`)
              .join("; ");
            parts.push(`Project contents: ${summary}`);
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  } else {
    parts.push("No project is currently open.");
  }

  // Recent edits across all workspaces (tracked via linkToCurrentProject)
  const edits = getRecentEdits();
  if (edits.length) {
    const editStr = edits.slice(0, 6)
      .filter((e) => e.name)
      .map((e) => `${TYPE_META[e.type]?.label || e.type}: "${e.name}"`)
      .join(", ");
    if (editStr) parts.push(`Recently created/edited: ${editStr}`);
  }

  if (parts.length === 0) return "";
  return `\n--- CURRENT CONTEXT (use this to understand what the user is working on without asking) ---\n${parts.join("\n")}\n--- END CONTEXT ---\n`;
}
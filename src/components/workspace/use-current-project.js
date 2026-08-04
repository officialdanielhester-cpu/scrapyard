import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export const CURRENT_PROJECT_KEY = "scrapyard_current_project";

export function getCurrentProjectId() {
  try { return localStorage.getItem(CURRENT_PROJECT_KEY) || null; } catch { return null; }
}

export function setCurrentProjectId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_PROJECT_KEY, id);
    else localStorage.removeItem(CURRENT_PROJECT_KEY);
  } catch { /* ignore */ }
}

// Standalone function — any module imports and calls this after saving content.
// If no project is active, it silently does nothing.
export async function linkToCurrentProject(contentType, contentId, contentName = "", contentThumbnail = "") {
  if (!contentId) return;
  try {
    const pid = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!pid) return;
    const existing = await base44.entities.ProjectItem.filter({ project_id: pid, content_id: contentId });
    if (existing && existing.length > 0) {
      if (contentName && existing[0].content_name !== contentName) {
        await base44.entities.ProjectItem.update(existing[0].id, { content_name: contentName, content_thumbnail: contentThumbnail });
      }
      return;
    }
    await base44.entities.ProjectItem.create({
      project_id: pid,
      content_type: contentType,
      content_id: contentId,
      content_name: contentName,
      content_thumbnail: contentThumbnail,
    });
  } catch { /* ignore */ }
}

// Hook for components that need to read/change the active project.
export function useCurrentProject() {
  const [currentProjectId, setCurrentId] = useState(getCurrentProjectId);
  const select = useCallback((id) => { setCurrentProjectId(id); setCurrentId(id); }, []);
  return { currentProjectId, select };
}
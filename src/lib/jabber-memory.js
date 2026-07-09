import { base44 } from "@/api/base44Client";

// Jabber's memory + file-access layer.
// - Memories: every turn is persisted (unless Private Mode is on) so Jabber can recall past chats.
// - Lookup: reads saved records (models, experiments, builds, tasks) from Aetheris.
// Website B's saved tasks are read through the admin/list_tasks gateway path.

const LOOKUP_MAP = {
  models: () => base44.entities.Model.list("-updated_date", 20),
  experiments: () => base44.entities.Experiment.list("-updated_date", 20),
  builds: () => base44.entities.VehicleBuild.list("-updated_date", 20),
  tasks: () => base44.entities.Task.list("-updated_date", 20),
};

const LOOKUP_LABELS = {
  models: "models",
  experiments: "experiments",
  builds: "builds",
  tasks: "tasks",
};

export async function fetchRecentMemories(limit = 12) {
  try {
    const mems = await base44.entities.Memory.list("-created_date", limit);
    return (mems || []).slice().reverse(); // chronological: oldest first
  } catch {
    return [];
  }
}

export async function saveMemory(role, content, persist = true) {
  if (!persist) return; // Private Mode — never store conversations
  try {
    await base44.entities.Memory.create({ role, content: String(content).slice(0, 2000) });
  } catch {
    /* memory is best-effort */
  }
}

export async function lookupAetheris(kind) {
  const fn = LOOKUP_MAP[kind] || LOOKUP_MAP.tasks;
  const label = LOOKUP_LABELS[kind] || "items";
  try {
    const items = await fn();
    if (!items || !items.length) return `You don't have any saved ${label} in Aetheris yet.`;
    const names = items.slice(0, 8).map((i) => i.name || i.title).filter(Boolean).join(", ");
    const more = items.length > 8 ? `, and ${items.length - 8} more` : "";
    return `You have ${items.length} saved ${label} in Aetheris${names ? `: ${names}` : ""}${more}.`;
  } catch (e) {
    return `I couldn't read your saved ${label} just now — ${e.message || "try again."}`;
  }
}
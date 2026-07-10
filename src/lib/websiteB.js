import { base44 } from "@/api/base44Client";

// Recall's aiGateway expects the action plus flat top-level fields (NOT
// nested in a `params` object). All calls go through Aetheris's callAiGateway
// proxy, which forwards the payload and the shared secret.
async function gateway(action, fields = {}) {
  try {
    const res = await base44.functions.invoke("callAiGateway", { payload: { action, ...fields } });
    return res?.data;
  } catch (e) {
    return { ok: false, error: e?.response?.data?.error || e?.message || "Recall wasn't reachable." };
  }
}

async function findTaskIdByTitle(title) {
  const data = await gateway("list_tasks");
  const tasks = data?.result?.tasks || data?.tasks || [];
  const needle = String(title || "").toLowerCase().trim();
  const match = tasks.find((t) => String(t.title || "").toLowerCase().trim() === needle);
  return match ? match.id : null;
}

// Jabber speaks task titles; B's update/delete are id-based. Resolve first.
export async function callWebsiteB(action, params = {}) {
  switch (action) {
    case "list_tasks":
      return gateway("list_tasks");
    case "create_task":
      return gateway("create_task", { title: params.title || "Quick task" });
    case "update_task": {
      if (params.id) return gateway("update_task", { id: params.id, status: params.status });
      if (!params.title) return { ok: false, error: "I need a task title to update." };
      const id = await findTaskIdByTitle(params.title);
      if (!id) return { ok: false, error: `I couldn't find "${params.title}" on Recall.` };
      return gateway("update_task", { id, status: params.status });
    }
    case "delete_task": {
      if (params.id) return gateway("delete_task", { id: params.id });
      if (!params.title) return { ok: false, error: "I need a task title to delete." };
      const id = await findTaskIdByTitle(params.title);
      if (!id) return { ok: false, error: `I couldn't find "${params.title}" on Recall.` };
      return gateway("delete_task", { id });
    }
    default:
      return gateway(action, params);
  }
}

export function formatAdminResult(action, params = {}, data) {
  if (!data || data.error || data.ok === false) {
    return `I couldn't do that on Recall — ${data?.error || "it wasn't reachable."}`;
  }
  const result = data.result || data;
  switch (action) {
    case "list_tasks": {
      const tasks = result.tasks || [];
      if (!tasks.length) return "Nothing on your Recall list right now.";
      const titles = tasks.slice(0, 6).map((t) => t.title).filter(Boolean).join(", ");
      const more = tasks.length > 6 ? `, and ${tasks.length - 6} more` : "";
      return `You've got ${tasks.length} item${tasks.length === 1 ? "" : "s"} on Recall${titles ? `: ${titles}` : ""}${more}.`;
    }
    case "create_task":
      return params.title ? `Done — "${params.title}" is on Recall.` : `Done — quick task added to Recall.`;
    case "update_task": {
      const status = params.status ? ` — now ${String(params.status).replace("_", " ")}` : "";
      return `Updated "${params.title || "it"}" on Recall${status}.`;
    }
    case "delete_task":
      return `Removed "${params.title || "it"}" from Recall.`;
    default:
      return "Done on Recall.";
  }
}

export function adminErrorMessage(error) {
  const m = error?.message || "";
  if (/401|Authentication required/i.test(m)) {
    return "Recall rejected me — its gateway still needs the service-role fix.";
  }
  if (/aborted|timeout/i.test(m)) {
    return "Recall took too long to answer — try again in a moment.";
  }
  return `I couldn't reach Recall for that — ${m || "please try again."}`;
}
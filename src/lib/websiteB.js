import { base44 } from "@/api/base44Client";

// Website B's aiGateway expects the action plus flat top-level fields (NOT
// nested in a `params` object). All calls go through Aetheris's callAiGateway
// proxy, which forwards the payload and the shared secret.
async function gateway(action, fields = {}) {
  try {
    const res = await base44.functions.invoke("callAiGateway", { payload: { action, ...fields } });
    return res?.data;
  } catch (e) {
    return { ok: false, error: e?.response?.data?.error || e?.message || "website B wasn't reachable." };
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
      return gateway("create_task", { title: params.title });
    case "update_task": {
      if (params.id) return gateway("update_task", { id: params.id, status: params.status });
      if (!params.title) return { ok: false, error: "I need a task title to update." };
      const id = await findTaskIdByTitle(params.title);
      if (!id) return { ok: false, error: `I couldn't find "${params.title}" on website B.` };
      return gateway("update_task", { id, status: params.status });
    }
    case "delete_task": {
      if (params.id) return gateway("delete_task", { id: params.id });
      if (!params.title) return { ok: false, error: "I need a task title to delete." };
      const id = await findTaskIdByTitle(params.title);
      if (!id) return { ok: false, error: `I couldn't find "${params.title}" on website B.` };
      return gateway("delete_task", { id });
    }
    default:
      return gateway(action, params);
  }
}

export function formatAdminResult(action, params = {}, data) {
  if (!data || data.error || data.ok === false) {
    return `I couldn't do that on website B — ${data?.error || "it wasn't reachable."}`;
  }
  const result = data.result || data;
  switch (action) {
    case "list_tasks": {
      const tasks = result.tasks || [];
      if (!tasks.length) return "Nothing on your website B list right now.";
      const titles = tasks.slice(0, 6).map((t) => t.title).filter(Boolean).join(", ");
      const more = tasks.length > 6 ? `, and ${tasks.length - 6} more` : "";
      return `You've got ${tasks.length} item${tasks.length === 1 ? "" : "s"} on website B${titles ? `: ${titles}` : ""}${more}.`;
    }
    case "create_task":
      return `Done — "${params.title || "it"}" is on website B.`;
    case "update_task": {
      const status = params.status ? ` — now ${String(params.status).replace("_", " ")}` : "";
      return `Updated "${params.title || "it"}" on website B${status}.`;
    }
    case "delete_task":
      return `Removed "${params.title || "it"}" from website B.`;
    default:
      return "Done on website B.";
  }
}

export function adminErrorMessage(error) {
  const m = error?.message || "";
  if (/401|Authentication required/i.test(m)) {
    return "Website B rejected me — its gateway still needs the service-role fix.";
  }
  if (/aborted|timeout/i.test(m)) {
    return "Website B took too long to answer — try again in a moment.";
  }
  return `I couldn't reach website B for that — ${m || "please try again."}`;
}
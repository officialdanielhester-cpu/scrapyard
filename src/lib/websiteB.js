import { base44 } from "@/api/base44Client";

// Calls website B's aiGateway through Aetheris's callAiGateway proxy.
// action is one of: list_tasks, create_task, update_task, delete_task.
export async function callWebsiteB(action, params = {}) {
  const res = await base44.functions.invoke("callAiGateway", { payload: { action, params } });
  return res?.data;
}

export function formatAdminResult(action, params = {}, data) {
  if (!data || data.error) {
    return `I couldn't do that on website B — ${data?.error || "it wasn't reachable."}`;
  }
  switch (action) {
    case "list_tasks": {
      const tasks = data.tasks || [];
      if (!tasks.length) return "Nothing on your website B list right now.";
      const titles = tasks.slice(0, 6).map((t) => t.title || t.name).filter(Boolean).join(", ");
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
    return "Website B rejected me — its gateway still needs the service-role fix. Finish that on B, then I can administer it.";
  }
  if (/aborted|timeout/i.test(m)) {
    return "Website B took too long to answer — try again in a moment.";
  }
  return `I couldn't reach website B for that — ${m || "please try again."}`;
}
// Link + relationship helpers for Mind notes.

// Extract [[link target]] references from markdown content.
export function extractLinks(content) {
  const re = /\[\[([^\]]+)\]\]/g;
  const out = [];
  let m;
  while ((m = re.exec(content || ""))) out.push(m[1].trim());
  return out;
}

// Convert [[X]] into markdown links the preview renderer can intercept.
export function preprocessMarkdown(content) {
  return (content || "").replace(/\[\[([^\]]+)\]\]/g, (_, t) => `[${t}](#note:${encodeURIComponent(t)})`);
}

// Find notes a given note links to (resolved by title / alias / id).
export function outgoingLinks(notes, note) {
  const targets = extractLinks(note.content);
  const lower = new Set(targets.map((t) => t.toLowerCase()));
  return notes.filter(
    (n) => n.id !== note.id && (lower.has(n.title.toLowerCase()) || (n.aliases || []).some((a) => lower.has(a.toLowerCase())))
  );
}

// Find notes that link to the given note (backlinks).
export function backlinks(notes, note) {
  const titles = new Set([note.title.toLowerCase(), note.id.toLowerCase(), ...(note.aliases || []).map((a) => a.toLowerCase())]);
  return notes.filter((n) => n.id !== note.id && extractLinks(n.content).some((l) => titles.has(l.toLowerCase())));
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
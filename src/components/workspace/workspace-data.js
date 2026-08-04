import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Music, Boxes, Box, Shirt, NotebookPen, FlaskConical,
  Hammer, LineChart, Sun, Video, Mic, FileText, Network, Images,
  Braces, MessageCircle, Folder,
} from "lucide-react";

export const TYPE_META = {
  note: { label: "Notes", ws: "mind-mapper", Icon: NotebookPen },
  gallery: { label: "Gallery", ws: "jabber", Icon: Images },
  music: { label: "Music", ws: "sound", Icon: Music },
  sound: { label: "Sound", ws: "sound", Icon: Music },
  design: { label: "Designs", ws: "fit-maker", Icon: Shirt },
  model: { label: "Models", ws: "grid", Icon: Box },
  experiment: { label: "Experiments", ws: "env", Icon: FlaskConical },
  build: { label: "Builds", ws: "workshop", Icon: Hammer },
  mindmap: { label: "Mind Maps", ws: "mind-mapper", Icon: Network },
  code: { label: "Code", ws: "jabber", Icon: Braces },
  memory: { label: "Conversations", ws: "jabber", Icon: MessageCircle },
  project: { label: "Projects", ws: "projects", Icon: Folder },
};

export const WORKSPACE_META = {
  jabber: { label: "Jabber", Icon: Sparkles },
  sound: { label: "Studio", Icon: Music },
  grid: { label: "The Grid", Icon: Boxes },
  studio: { label: "3D Studio", Icon: Box },
  "fit-maker": { label: "Fit Maker", Icon: Shirt },
  "mind-mapper": { label: "Mind", Icon: NotebookPen },
  env: { label: "Playground", Icon: FlaskConical },
  workshop: { label: "Workshop", Icon: Hammer },
  dashboard: { label: "Dashboard", Icon: LineChart },
  settings: { label: "Settings", Icon: Sun },
  "video-editor": { label: "Video", Icon: Video },
  "photo-editor": { label: "Photo", Icon: Images },
  projects: { label: "Projects", Icon: Folder },
};

export function relativeDate(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ENTITY_QUERIES = [
  { entity: "GalleryItem", ws: "jabber", typeLabel: "Gallery", category: "Gallery", getLabel: (i) => i.title, getIcon: (i) => i.kind === "video" ? Video : i.kind === "essay" ? FileText : i.kind === "audio" ? Mic : Images },
  { entity: "Note", ws: "mind-mapper", typeLabel: "Note", category: "Notes", getLabel: (i) => i.title, getIcon: () => NotebookPen },
  { entity: "GarmentDesign", ws: "fit-maker", typeLabel: "Design", category: "Designs", getLabel: (i) => i.name, getIcon: () => Shirt },
  { entity: "Model", ws: "grid", typeLabel: "Model", category: "Models", getIcon: () => Box },
  { entity: "Experiment", ws: "env", typeLabel: "Experiment", category: "Experiments", getLabel: (i) => i.name, getIcon: () => FlaskConical },
  { entity: "VehicleBuild", ws: "workshop", typeLabel: "Build", category: "Vehicles", getLabel: (i) => i.name, getIcon: () => Hammer },
  { entity: "MusicProject", ws: "sound", typeLabel: "Music", category: "Music", getLabel: (i) => i.name, getIcon: () => Music },
  { entity: "SoundProject", ws: "sound", typeLabel: "Sound", category: "Music", getLabel: (i) => i.name, getIcon: () => Music },
  { entity: "MindMap", ws: "mind-mapper", typeLabel: "Mind Map", category: "Mind Maps", getLabel: (i) => i.name, getIcon: () => Network },
  { entity: "CodeFile", ws: "jabber", typeLabel: "Code", category: "Code", getLabel: (i) => i.name, getIcon: () => Braces },
  { entity: "Memory", ws: "jabber", typeLabel: "Conversation", category: "Conversations", getLabel: (i) => (i.content || "").slice(0, 80), getIcon: () => MessageCircle },
  { entity: "Project", ws: "projects", typeLabel: "Project", category: "Projects", getLabel: (i) => i.name, getIcon: () => Folder },
];

export function useRecentItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        ENTITY_QUERIES.map(async (q) => {
          const records = await base44.entities[q.entity].list("-created_date", 50);
          return records.map((r) => ({
            id: r.id,
            label: q.getLabel ? q.getLabel(r) : (r.name || r.title || "Untitled"),
            workspace: q.ws,
            typeLabel: q.typeLabel,
            category: q.category,
            Icon: q.getIcon(r),
            created_date: r.created_date,
          }));
        })
      );
      if (cancelled) return;
      const all = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setItems(all);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}

export const RECENT_WS_KEY = "scrapyard_recent_workspaces";

export function trackWorkspace(id) {
  try {
    const raw = localStorage.getItem(RECENT_WS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((w) => w.id !== id);
    filtered.unshift({ id, ts: Date.now() });
    localStorage.setItem(RECENT_WS_KEY, JSON.stringify(filtered.slice(0, 10)));
  } catch { /* ignore */ }
}

export function getRecentWorkspaces() {
  try {
    const raw = localStorage.getItem(RECENT_WS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
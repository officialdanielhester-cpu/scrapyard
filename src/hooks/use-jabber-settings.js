import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Shared Jabber settings store. Canonical source for behavioral settings is
// website B's aiGateway (get_settings / set_settings); localStorage holds the
// local-only fields (speak, connected, permissions) and is the instant fallback.
const LS_KEY = "aetheris-jabber-settings";

export const DEFAULT_JABBER_SETTINGS = {
  theme: false,        // Calm Mode           ↔ B calm_mode
  speed: "Balanced",   // Response Tempo      ↔ B response_tempo
  private: false,      // Private Mode        ↔ B private_mode
  notify: true,        // Ambient Notifications ↔ B notifications
  lang: "Auto",        // Language            ↔ B language
  voice: "river",      //                      ↔ B voice
  speak: false,        // local-only
  connected: false,    // local-only
  permissions: { tasks: true, messages: false, projects: true }, // local-only
};

// B uses its own field names + lowercase enums; map at the boundary so the
// Aetheris UI keeps its existing keys.
const TEMPO_TO_B = { Patient: "patient", Balanced: "balanced", Rapid: "rapid" };
const TEMPO_FROM_B = { patient: "Patient", balanced: "Balanced", rapid: "Rapid" };
const LANG_TO_B = { Auto: "auto", English: "en", Spanish: "es", French: "fr" };
const LANG_FROM_B = { auto: "Auto", en: "English", es: "Spanish", fr: "French" };

function fromB(b = {}) {
  const o = {};
  if (b.calm_mode !== undefined) o.theme = !!b.calm_mode;
  if (b.response_tempo !== undefined) o.speed = TEMPO_FROM_B[b.response_tempo] ?? "Balanced";
  if (b.private_mode !== undefined) o.private = !!b.private_mode;
  if (b.notifications !== undefined) o.notify = !!b.notifications;
  if (b.language !== undefined) o.lang = LANG_FROM_B[b.language] ?? "Auto";
  if (b.voice !== undefined) o.voice = b.voice;
  return o;
}

function toB(a = {}) {
  const o = {};
  if (a.theme !== undefined) o.calm_mode = !!a.theme;
  if (a.speed !== undefined) o.response_tempo = TEMPO_TO_B[a.speed] ?? "balanced";
  if (a.private !== undefined) o.private_mode = !!a.private;
  if (a.notify !== undefined) o.notifications = !!a.notify;
  if (a.lang !== undefined) o.language = LANG_TO_B[a.lang] ?? "auto";
  if (a.voice !== undefined) o.voice = a.voice;
  return o;
}

let cache = null;
let listeners = new Set();
let loaded = false;

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
function writeLS(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function emit() { listeners.forEach((l) => l(cache)); }

export async function pingGateway() {
  try {
    const res = await base44.functions.invoke("callAiGateway", { payload: { action: "get_settings" } });
    const data = res?.data;
    return !!data && !data.error && data.ok !== false;
  } catch { return false; }
}

export async function refreshSettings() {
  try {
    const res = await base44.functions.invoke("callAiGateway", { payload: { action: "get_settings" } });
    const data = res?.data;
    const bSettings = data?.result?.settings || data?.settings;
    if (bSettings && typeof bSettings === "object" && !bSettings.error) {
      cache = { ...DEFAULT_JABBER_SETTINGS, ...cache, ...fromB(bSettings) };
      writeLS(cache);
      emit();
    }
  } catch { /* gateway not ready — keep local cache */ }
  return cache;
}

export async function persistSettings(next) {
  cache = next;
  writeLS(cache);
  emit();
  try {
    await base44.functions.invoke("callAiGateway", { payload: { action: "set_settings", settings: toB(next) } });
  } catch { /* gateway not ready — already saved locally */ }
}

export function useJabberSettings() {
  const [settings, setSettings] = useState(() => {
    if (!cache) cache = { ...DEFAULT_JABBER_SETTINGS, ...readLS() };
    return cache;
  });
  useEffect(() => {
    listeners.add(setSettings);
    if (!loaded) { loaded = true; refreshSettings(); }
    return () => listeners.delete(setSettings);
  }, []);
  const update = useCallback((partial) => {
    persistSettings({ ...cache, ...partial });
  }, []);
  return { settings, update, refresh: refreshSettings };
}
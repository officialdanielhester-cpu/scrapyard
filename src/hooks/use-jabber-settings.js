import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Shared Jabber settings store. Canonical source is website B's aiGateway
// (action: get_settings / set_settings); localStorage is the instant fallback
// so the app keeps working before B's gateway is ready.
const LS_KEY = "aetheris-jabber-settings";

export const DEFAULT_JABBER_SETTINGS = {
  theme: false,        // Calm Mode
  speed: "Balanced",   // Response Tempo
  private: false,      // Private Mode
  notify: true,        // Ambient Notifications
  lang: "Auto",        // Language
  voice: "river",
  speak: false,
  connected: false,
  permissions: { tasks: true, messages: false, projects: true },
};

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
    return !!data && !data.error;
  } catch { return false; }
}

export async function refreshSettings() {
  try {
    const res = await base44.functions.invoke("callAiGateway", { payload: { action: "get_settings" } });
    const data = res?.data;
    const incoming = data && !data.error ? (data.settings || data) : null;
    if (incoming && typeof incoming === "object") {
      cache = { ...DEFAULT_JABBER_SETTINGS, ...cache, ...incoming };
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
    await base44.functions.invoke("callAiGateway", { payload: { action: "set_settings", params: { settings: next } } });
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
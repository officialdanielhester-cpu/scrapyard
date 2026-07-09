import { useState, useCallback, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useJabberSettings } from "@/hooks/use-jabber-settings";

export const VOICES = [
  { id: "river", label: "River", desc: "Calm, neutral" },
  { id: "honey", label: "Honey", desc: "Warm, soft" },
  { id: "sunny", label: "Sunny", desc: "Bright, upbeat" },
  { id: "storm", label: "Storm", desc: "Formal, authoritative" },
  { id: "spark", label: "Spark", desc: "Energetic, quick" },
];

// Voice + speak-enabled now live in the shared Jabber settings store
// (synced with website B). TTS playback stays local to this hook.
export function useVoice() {
  const { settings, update } = useJabberSettings();
  const voice = settings.voice;
  const speakEnabled = settings.speak;
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const setVoice = useCallback((v) => { update({ voice: v }); }, [update]);
  const setSpeakEnabled = useCallback((on) => { update({ speak: on }); }, [update]);

  useEffect(() => {
    if (!speakEnabled && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
    }
  }, [speakEnabled]);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!text) return;
      try {
        setSpeaking(true);
        const res = await base44.integrations.Core.GenerateSpeech({
          text: String(text).slice(0, 5000),
          voice,
          language_code: "en",
        });
        const url = res?.url || res;
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      } catch {
        setSpeaking(false);
      }
    },
    [voice]
  );

  return { voice, setVoice, speakEnabled, setSpeakEnabled, speak, stop, speaking };
}
import { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

export const VOICES = [
  { id: "river", label: "River", desc: "Calm, neutral" },
  { id: "honey", label: "Honey", desc: "Warm, soft" },
  { id: "sunny", label: "Sunny", desc: "Bright, upbeat" },
  { id: "storm", label: "Storm", desc: "Formal, authoritative" },
  { id: "spark", label: "Spark", desc: "Energetic, quick" },
];

const KEY_VOICE = "aetheris-voice";
const KEY_SPEAK = "aetheris-speak";

export function useVoice() {
  const [voice, setVoiceState] = useState(() => {
    try {
      return localStorage.getItem(KEY_VOICE) || "river";
    } catch {
      return "river";
    }
  });
  const [speakEnabled, setSpeakState] = useState(() => {
    try {
      return localStorage.getItem(KEY_SPEAK) === "true";
    } catch {
      return false;
    }
  });
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const setVoice = useCallback((v) => {
    setVoiceState(v);
    try {
      localStorage.setItem(KEY_VOICE, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setSpeakEnabled = useCallback((on) => {
    setSpeakState(on);
    try {
      localStorage.setItem(KEY_SPEAK, on ? "true" : "false");
    } catch {
      /* ignore */
    }
    if (!on && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
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
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageSquare, Music, Palette, FlaskConical } from "lucide-react";

const STORAGE_KEY = "scrapyard_onboarded_v1";

const TIPS = [
  { icon: MessageSquare, title: "Jabber", text: "Your AI assistant — chat, write long essays, and generate images, video & audio." },
  { icon: Music, title: "Studio", text: "A full music production suite with tracks, effects, and AI beats." },
  { icon: Palette, title: "Canvas", text: "The Grid for digital painting and 3D Studio for sculpting & modeling." },
  { icon: FlaskConical, title: "Environment", text: "Aerospace playground, vehicle workshop, and flight dashboard." },
];

export default function OnboardingTutorial() {
  const [seen, setSeen] = useState(() => {
    try { return typeof window !== "undefined" && !!window.localStorage.getItem(STORAGE_KEY); } catch { return true; }
  });

  const dismiss = () => {
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setSeen(true);
  };

  return (
    <AnimatePresence>
      {!seen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-md rounded-2xl border border-border/60 bg-background p-7 shadow-2xl">
            <button onClick={dismiss} className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <h2 className="font-heading text-xl font-extrabold tracking-tight">Welcome to Jabber</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">A quick tour of your workspace — pick a section from the sidebar to get started.</p>
            <div className="mt-5 space-y-3">
              {TIPS.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.title} className="flex items-start gap-3 rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="font-body text-sm font-semibold">{t.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{t.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={dismiss}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} /> Let's go
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
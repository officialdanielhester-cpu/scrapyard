import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Lightweight "coming soon" page for not-yet-built sections.
export default function PlaceholderSection({ title, subtitle, description }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>}
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description || "This space is coming soon. Your other tools are ready in the sidebar."}
        </p>
        <span className="mt-6 inline-block rounded-full border border-border/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          In progress
        </span>
      </motion.div>
    </div>
  );
}
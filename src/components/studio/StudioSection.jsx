import React from "react";
import BlenderStudio from "@/components/studio/BlenderStudio";

export default function StudioSection() {
  return (
    <div className="min-h-screen pb-10">
      <header className="px-6 py-5 md:px-12">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Studio</h1>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          3D Modeling Workspace
        </p>
      </header>
      <div className="px-6 md:px-12">
        <BlenderStudio />
      </div>
    </div>
  );
}
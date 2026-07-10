import React, { useState } from "react";
import { Boxes, Square, Box as BoxIcon, Rocket } from "lucide-react";
import { VEHICLES } from "@/components/environment/presets";
import FreeAssemblyCanvas from "@/components/workshop/FreeAssemblyCanvas";
import AssemblyCanvas3D from "@/components/workshop/AssemblyCanvas3D";

// Assembly bay wrapper: free-form 2D editor (drag/select/move/scale/recolor)
// or a 3D preview of the placed parts.
export default function AssemblyCanvas({ instances, setInstances, vehicleType, onRemoveInstance, onAddInstance, onImport }) {
  const [mode, setMode] = useState("2d");
  const hasContent = instances.length > 0;

  const Toggle = (
    <div className="flex rounded-full border border-border/60 p-0.5">
      <button
        onClick={() => setMode("2d")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
          mode === "2d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Square className="h-3 w-3" strokeWidth={2} /> 2D
      </button>
      <button
        onClick={() => setMode("3d")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
          mode === "3d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BoxIcon className="h-3 w-3" strokeWidth={2} /> 3D
      </button>
    </div>
  );

  const ImportBtn = onImport && (
    <button
      onClick={onImport}
      className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Rocket className="h-3 w-3" strokeWidth={2} /> Import to Playground
    </button>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/30">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Assembly Bay</h3>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 sm:inline">
            {mode === "2d" ? "drag · select · move · scale · recolor" : "drag to orbit · shift-drag to pan · click to select"}
          </span>
          {ImportBtn}
          {Toggle}
        </div>
      </div>

      {mode === "3d" ? (
        <div className="h-[480px]">
          {hasContent ? (
            <AssemblyCanvas3D instances={instances} onRemoveInstance={onRemoveInstance} onAddInstance={onAddInstance} setInstances={setInstances} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Empty assembly bay</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Switch to 2D and drag parts in</p>
            </div>
          )}
        </div>
      ) : (
        <FreeAssemblyCanvas instances={instances} setInstances={setInstances} />
      )}
    </div>
  );
}
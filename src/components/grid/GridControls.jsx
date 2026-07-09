import React from "react";
import { Palette, Box, RotateCw, RefreshCw } from "lucide-react";

export default function GridControls({
  view,
  bgColor,
  setBgColor,
  modelColor,
  setModelColor,
  scale,
  setScale,
  rotation,
  setRotation,
  onReset,
}) {
  const setRot = (axis, val) => setRotation({ ...rotation, [axis]: val });

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Canvas Controls
          </h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-foreground/80">Background</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
            aria-label="Background color"
          />
        </label>

        {view === "3d" && (
          <>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground/80">Model Color</span>
              <input
                type="color"
                value={modelColor}
                onChange={(e) => setModelColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
                aria-label="Model color"
              />
            </label>

            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-foreground/80">
                  <Box className="h-3.5 w-3.5" /> Size
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{scale.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.2"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center gap-1.5">
                <RotateCw className="h-3.5 w-3.5 text-foreground/80" />
                <span className="text-sm text-foreground/80">Orientation</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["x", "y", "z"].map((axis) => (
                  <div key={axis}>
                    <div className="mb-1 flex justify-between">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">{axis}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {Math.round((rotation[axis] * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.PI}
                      max={Math.PI}
                      step="0.05"
                      value={rotation[axis]}
                      onChange={(e) => setRot(axis, parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { X, Save, Trash2, Loader2, Box, RotateCw, PenTool, Sun, Thermometer, Focus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ModelPreview3D from "@/components/grid/ModelPreview3D";
import ModelPreview2D from "@/components/grid/ModelPreview2D";
import MarkupToolbar from "@/components/grid/MarkupToolbar";
import { GEOMETRY_TYPES, GEOMETRY_LABELS } from "@/components/grid/three-helpers";

const deg = (rad) => Math.round(((rad || 0) * 180) / Math.PI);

function Range({ label, value, min, max, step, onChange, suffix, icon: Icon }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-foreground/80">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {suffix === "deg" ? `${deg(value)}°` : `${Number(value).toFixed(2)}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/50 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export default function ModelEditor({ model, onClose, onSaved, onDeleted }) {
  const [draft, setDraft] = useState({
    ...model,
    markup: model.markup || [],
    brightness: model.brightness ?? 1,
    coolness: model.coolness ?? 0.5,
    sharpness: model.sharpness ?? 0.5,
    bgColor: model.bgColor || "#080B14",
  });
  const [paintMode, setPaintMode] = useState(true);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#3B82F6");
  const [size, setSize] = useState(4);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));
  const is2D = draft.mode === "2d";
  const adjust = { brightness: draft.brightness, coolness: draft.coolness, sharpness: draft.sharpness };

  const handleMarkupChange = (strokes) => set("markup", strokes);
  const handleClearMarkup = () => set("markup", []);
  const handleOrient = ({ rotX, rotY }) => setDraft((d) => ({ ...d, rotX, rotY }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await base44.entities.Model.update(draft.id, {
        name: draft.name,
        mode: draft.mode,
        geometry: draft.geometry,
        color: draft.color,
        bgColor: draft.bgColor,
        brightness: draft.brightness,
        coolness: draft.coolness,
        sharpness: draft.sharpness,
        scale: draft.scale,
        rotX: draft.rotX,
        rotY: draft.rotY,
        rotZ: draft.rotZ,
        metalness: draft.metalness,
        roughness: draft.roughness,
        markup: draft.markup,
      });
      onSaved && onSaved();
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await base44.entities.Model.delete(draft.id);
      onDeleted && onDeleted();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const previewCommon = { tool, color, size, onMarkupChange: handleMarkupChange, adjust, bgColor: draft.bgColor };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-heading text-lg font-extrabold tracking-tight">Model Editor</h2>
            <span className="ml-2 rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {is2D ? "2D" : "3D"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-foreground/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-6 overflow-y-auto p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div
            className="relative sticky top-0 self-start overflow-hidden rounded-xl border border-border/50"
            style={{ height: "56vh", backgroundColor: draft.bgColor }}
          >
            {is2D ? (
              <ModelPreview2D model={draft} paintingActive {...previewCommon} />
            ) : (
              <ModelPreview3D model={draft} paintMode={paintMode} onOrient={handleOrient} {...previewCommon} />
            )}
            {!is2D && (
              <div className="absolute right-2 top-2 flex gap-1 rounded-full border border-border/60 bg-background/80 p-1 backdrop-blur">
                <button
                  onClick={() => setPaintMode(false)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                    !paintMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <RotateCw className="h-3 w-3" /> Move
                </button>
                <button
                  onClick={() => setPaintMode(true)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                    paintMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PenTool className="h-3 w-3" /> Paint
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Section title="Properties">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Name
                </label>
                <input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              {!is2D ? (
                <>
                  <div>
                    <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Geometry
                    </label>
                    <select
                      value={draft.geometry}
                      onChange={(e) => set("geometry", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      {GEOMETRY_TYPES.map((g) => (
                        <option key={g} value={g}>
                          {GEOMETRY_LABELS[g]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground/80">Color</span>
                    <input
                      type="color"
                      value={draft.color}
                      onChange={(e) => set("color", e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
                    />
                  </label>
                  <Range label="Size" value={draft.scale} min={0.4} max={2.2} step={0.05} onChange={(v) => set("scale", v)} />
                  <div>
                    <p className="mb-2 text-sm text-foreground/80">Orientation</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Range label="X" value={draft.rotX} min={-Math.PI} max={Math.PI} step={0.05} onChange={(v) => set("rotX", v)} suffix="deg" />
                      <Range label="Y" value={draft.rotY} min={-Math.PI} max={Math.PI} step={0.05} onChange={(v) => set("rotY", v)} suffix="deg" />
                      <Range label="Z" value={draft.rotZ} min={-Math.PI} max={Math.PI} step={0.05} onChange={(v) => set("rotZ", v)} suffix="deg" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Range label="Metalness" value={draft.metalness} min={0} max={1} step={0.05} onChange={(v) => set("metalness", v)} />
                    <Range label="Roughness" value={draft.roughness} min={0} max={1} step={0.05} onChange={(v) => set("roughness", v)} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">2D image model — use the brushes below to annotate, or adjust the image tone.</p>
              )}
            </Section>

            <Section title="Image Tone">
              <Range label="Brightness" value={draft.brightness} min={0.4} max={1.6} step={0.05} onChange={(v) => set("brightness", v)} icon={Sun} />
              <Range label="Coolness" value={draft.coolness} min={0} max={1} step={0.05} onChange={(v) => set("coolness", v)} icon={Thermometer} />
              <Range label="Sharpness" value={draft.sharpness} min={0} max={1} step={0.05} onChange={(v) => set("sharpness", v)} icon={Focus} />
            </Section>

            <Section title="Background">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground/80">Canvas color</span>
                <input
                  type="color"
                  value={draft.bgColor}
                  onChange={(e) => set("bgColor", e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
                />
              </label>
            </Section>

            <Section title="Markup">
              <MarkupToolbar
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
                size={size}
                setSize={setSize}
                onClear={handleClearMarkup}
              />
              <p className="text-xs text-muted-foreground">
                {is2D
                  ? "Draw on the image — strokes save with the model."
                  : "Move mode: drag to rotate. Paint mode: drag on the surface to mark it up."}
              </p>
            </Section>
          </div>
        </div>

        {error && <p className="px-6 text-xs text-destructive">{error}</p>}

        <footer className="flex items-center justify-between gap-3 border-t border-border/50 px-6 py-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Model
          </button>
        </footer>
      </div>
    </div>
  );
}
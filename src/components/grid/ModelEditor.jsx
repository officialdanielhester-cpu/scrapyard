import React, { useState } from "react";
import { X, Save, Trash2, Loader2, Box } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ModelPreview3D from "@/components/grid/ModelPreview3D";
import { GEOMETRY_TYPES, GEOMETRY_LABELS } from "@/components/grid/three-helpers";

const deg = (rad) => Math.round(((rad || 0) * 180) / Math.PI);

function Range({ label, value, min, max, step, onChange, suffix }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-foreground/80">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {suffix === "deg" ? `${deg(value)}°` : `${Number(value).toFixed(2)}${suffix || ""}`}
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

export default function ModelEditor({ model, onClose, onSaved, onDeleted }) {
  const [draft, setDraft] = useState(model);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));
  const isImage = draft.geometry === "plane";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await base44.entities.Model.update(draft.id, {
        name: draft.name,
        geometry: draft.geometry,
        color: draft.color,
        scale: draft.scale,
        rotX: draft.rotX,
        rotY: draft.rotY,
        rotZ: draft.rotZ,
        metalness: draft.metalness,
        roughness: draft.roughness,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-heading text-lg font-extrabold tracking-tight">Model Editor</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-foreground/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-6 overflow-y-auto p-6 md:grid-cols-2">
          <div className="h-56 rounded-xl border border-border/50 overflow-hidden md:h-80">
            <ModelPreview3D model={draft} bgColor="#080B14" />
          </div>

          <div className="space-y-4">
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

            {!isImage && (
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground/80">Color</span>
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded-md border border-border/60 bg-transparent"
                />
              </label>
            )}

            <Range label="Size" value={draft.scale} min={0.4} max={2.2} step={0.05} onChange={(v) => set("scale", v)} />

            <div>
              <p className="mb-2 text-sm text-foreground/80">Orientation</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Range label="X" value={draft.rotX} min={-Math.PI} max={Math.PI} step={0.05} onChange={(v) => set("rotX", v)} suffix="deg" />
                <Range label="Y" value={draft.rotY} min={-Math.PI} max={Math.PI} step={0.05} onChange={(v) => set("rotY", v)} suffix="deg" />
                <Range label="Z" value={draft.rotZ} min={-Math.PI} max={Math.PI} step={0.05} onChange={(v) => set("rotZ", v)} suffix="deg" />
              </div>
            </div>

            {!isImage && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Range label="Metalness" value={draft.metalness} min={0} max={1} step={0.05} onChange={(v) => set("metalness", v)} />
                <Range label="Roughness" value={draft.roughness} min={0} max={1} step={0.05} onChange={(v) => set("roughness", v)} />
              </div>
            )}

            {isImage && (
              <p className="rounded-lg border border-border/50 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                Image model — color and material props don&apos;t apply.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="px-6 text-xs text-destructive">{error}</p>
        )}

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
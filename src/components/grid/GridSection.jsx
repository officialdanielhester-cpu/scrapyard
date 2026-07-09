import React, { useState, useEffect, useCallback, useRef } from "react";
import { Square, Box as BoxIcon, Palette, Upload, Loader2, Boxes } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Grid2D from "@/components/grid/Grid2D";
import Grid3D from "@/components/grid/Grid3D";
import GridPrompt from "@/components/grid/GridPrompt";
import ModelEditor from "@/components/grid/ModelEditor";

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

export default function GridSection() {
  const [view, setView] = useState("2d");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bgColor, setBgColor] = useState("#080B14");
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Model.list("-created_date", 50);
      setModels(list);
    } catch (e) {
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const models2D = models.filter((m) => m.mode === "2d");
  const models3D = models.filter((m) => m.mode !== "2d");
  const viewModels = view === "2d" ? models2D : models3D;

  const handleOpenById = (id) => {
    const m = models.find((x) => x.id === id);
    if (m) setEditing(m);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!IMAGE_EXTS.includes(ext)) {
      setImportError(`"${ext}" isn't supported — import a png, jpg, webp, or svg image`);
      e.target.value = "";
      return;
    }
    setImportError(null);
    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Model.create({
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 32) || "Imported Image",
        prompt: "",
        mode: "2d",
        geometry: "plane",
        color: "#ffffff",
        scale: 1,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        metalness: 0,
        roughness: 1,
        image_url: file_url,
        markup: [],
      });
      setView("2d");
      load();
    } catch (err) {
      setImportError(err.message || "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen">
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">The Grid</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Create · Open · Modify · Save
          </p>
        </div>
        <div className="flex rounded-full border border-border/60 p-0.5">
          <button
            onClick={() => setView("2d")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "2d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Square className="h-3.5 w-3.5" strokeWidth={2} /> 2D
          </button>
          <button
            onClick={() => setView("3d")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "3d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BoxIcon className="h-3.5 w-3.5" strokeWidth={2} /> 3D
          </button>
        </div>
      </header>

      <div className="px-6 md:px-12">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={1.5} />}
            Import Image
          </button>
          <label className="flex min-h-[44px] items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <span className="text-muted-foreground">Background</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-5 w-6 cursor-pointer rounded bg-transparent"
              aria-label="Background color"
            />
          </label>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {viewModels.length} {view} object{viewModels.length !== 1 ? "s" : ""}
          </span>
        </div>

        {importError && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
            {importError}
          </p>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : viewModels.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
              <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                No {view} models yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">Tell Jabber what to make below</p>
            </div>
          ) : view === "2d" ? (
            <div className="rounded-2xl border border-border/50 p-4" style={{ backgroundColor: bgColor }}>
              <Grid2D models={viewModels} onOpen={setEditing} />
            </div>
          ) : (
            <div
              className="h-[70vh] overflow-hidden rounded-2xl border border-border/50"
              style={{ backgroundColor: bgColor }}
            >
              <Grid3D models={viewModels} bgColor={bgColor} onSelectModel={handleOpenById} />
            </div>
          )}
        </div>

        <div className="mt-6 pb-16">
          <GridPrompt
            onCreated={(createdMode) => {
              load();
              setView(createdMode === "3d" ? "3d" : "2d");
            }}
          />
        </div>
      </div>

      {editing && (
        <ModelEditor
          model={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
          onDeleted={load}
        />
      )}
    </div>
  );
}
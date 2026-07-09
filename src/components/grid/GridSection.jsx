import React, { useState, useEffect, useCallback, useRef } from "react";
import { Square, Box as BoxIcon, Upload, Loader2, Boxes, LayoutGrid, List } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Grid2D from "@/components/grid/Grid2D";
import Model3DCard from "@/components/grid/Model3DCard";
import ModelList from "@/components/grid/ModelList";
import GridPrompt from "@/components/grid/GridPrompt";
import ModelEditor from "@/components/grid/ModelEditor";

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const LIVE_CAP = 8;

export default function GridSection() {
  const [view, setView] = useState("2d");
  const [layout, setLayout] = useState("grid");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
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
        brightness: 1,
        coolness: 0.5,
        sharpness: 0.5,
        bgColor: "#080B14",
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
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex rounded-full border border-border/60 p-0.5">
            <button
              onClick={() => setLayout("grid")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                layout === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} /> Grid
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                layout === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" strokeWidth={2} /> List
            </button>
          </div>
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
              <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">No {view} models yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Tell Jabber what to make below</p>
            </div>
          ) : layout === "list" ? (
            <ModelList models={viewModels} onOpen={setEditing} />
          ) : view === "2d" ? (
            <Grid2D models={viewModels} onOpen={setEditing} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {viewModels.slice(0, LIVE_CAP).map((m) => (
                <Model3DCard key={m.id} model={m} onOpen={() => setEditing(m)} />
              ))}
              {viewModels.slice(LIVE_CAP).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditing(m)}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50 text-left transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: m.bgColor || "#080B14" }}
                >
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BoxIcon className="h-8 w-8 text-primary/60" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                    <p className="truncate text-xs font-medium text-white">{m.name}</p>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">{m.geometry}</span>
                  </div>
                </button>
              ))}
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
        <ModelEditor model={editing} onClose={() => setEditing(null)} onSaved={load} onDeleted={load} />
      )}
    </div>
  );
}
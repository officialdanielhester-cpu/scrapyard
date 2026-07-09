import React, { useState, useRef } from "react";
import { Upload, Sparkles, Square, Box as BoxIcon } from "lucide-react";
import Grid2D from "@/components/grid/Grid2D";
import Grid3D from "@/components/grid/Grid3D";
import CreateModelDialog from "@/components/grid/CreateModelDialog";

const SEED_ITEMS = [
  { id: "s1", name: "Mercury Core", type: "ai", image: "https://media.base44.com/images/public/6a4f2ae454b06209b2aa57f8/55a11839f_generated_e40f713d.png" },
  { id: "s2", name: "Caustic Shard", type: "ai", image: "https://media.base44.com/images/public/6a4f2ae454b06209b2aa57f8/94cfec6ca_generated_800ed2c8.png" },
  { id: "s3", name: "Dark Orbit", type: "ai", image: "https://media.base44.com/images/public/6a4f2ae454b06209b2aa57f8/318c04855_generated_0786f03a.png" },
];

const COMPATIBLE = [".glb", ".gltf", ".obj", ".fbx", ".stl", ".ply", ".png", ".jpg", ".jpeg", ".webp", ".svg"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

export default function GridSection() {
  const [view, setView] = useState("2d");
  const [items, setItems] = useState(SEED_ITEMS);
  const [createOpen, setCreateOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!COMPATIBLE.includes(ext)) {
      setImportError(`"${ext}" isn't a compatible format — try glb, gltf, obj, fbx, stl, ply, png, jpg, webp, or svg`);
      e.target.value = "";
      return;
    }
    setImportError(null);
    const isImage = IMAGE_EXTS.includes(ext);
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: file.name,
        type: "imported",
        image: isImage ? URL.createObjectURL(file) : null,
        isModel: !isImage,
      },
    ]);
    e.target.value = "";
  };

  const handleCreate = (item) => {
    setItems((prev) => [...prev, item]);
    setCreateOpen(false);
  };

  return (
    <div className="min-h-screen">
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">The Grid</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Import · Generate · Architect
          </p>
        </div>

        {/* 2D / 3D toggle */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-border/60 p-0.5">
            <button
              onClick={() => setView("2d")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "2d" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Square className="h-3.5 w-3.5" strokeWidth={2} /> 2D
            </button>
            <button
              onClick={() => setView("3d")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "3d" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BoxIcon className="h-3.5 w-3.5" strokeWidth={2} /> 3D
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-12">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.obj,.fbx,.stl,.ply,.png,.jpg,.jpeg,.webp,.svg"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} /> Import Model
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.5} /> Create with AI
          </button>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {items.length} object{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {importError && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
            {importError}
          </p>
        )}

        {/* View */}
        <div className="mt-6 pb-16">
          {view === "2d" ? (
            <Grid2D items={items} />
          ) : (
            <div className="h-[70vh] overflow-hidden rounded-2xl border border-border/50 bg-[#0A0C10]">
              <Grid3D items={items} />
            </div>
          )}
        </div>
      </div>

      <CreateModelDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
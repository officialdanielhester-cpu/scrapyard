import React, { useState, useEffect, useCallback, useRef } from "react";
import * as THREE from "three";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StudioViewport from "@/components/studio/StudioViewport";
import StudioSidebar from "@/components/studio/StudioSidebar";
import ImportModelsPanel from "@/components/studio/ImportModelsPanel";
import JabberModelGen from "@/components/studio/JabberModelGen";
import ModelPresetsPanel from "@/components/studio/ModelPresetsPanel";
import { createPrimitive, extrudeFaces, subdivide, mergeVertices, mirrorGeometry, deleteFaces } from "@/components/studio/mesh-utils";

const LIGHT_GREY = "#d4d4d8";
const newId = () => `o-${Math.random().toString(36).slice(2, 9)}`;
const GEO = {
  box: () => new THREE.BoxGeometry(1.4, 1.4, 1.4), sphere: () => new THREE.SphereGeometry(0.9, 32, 24),
  cylinder: () => new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32), cone: () => new THREE.ConeGeometry(0.8, 1.6, 32),
  torus: () => new THREE.TorusGeometry(0.7, 0.28, 16, 48), plane: () => new THREE.PlaneGeometry(2, 2),
  octahedron: () => new THREE.OctahedronGeometry(0.9), icosahedron: () => new THREE.IcosahedronGeometry(0.9),
  tetrahedron: () => new THREE.TetrahedronGeometry(1.0), dodecahedron: () => new THREE.DodecahedronGeometry(0.9),
};

function objectFromSpec(spec) {
  if (spec.kind === "image" || spec.imageUrl) {
    return { id: newId(), name: spec.name || "Model", kind: "image", imageUrl: spec.imageUrl, pos: [0, 1, 0], scale: spec.scale || 1, rot: [0, 0, 0], metal: 0.3, rough: 0.7 };
  }
  let parts;
  if (Array.isArray(spec.parts) && spec.parts.length) {
    parts = spec.parts.map((p) => ({ type: GEO[p.type] ? p.type : "box", ox: p.ox||0, oy: p.oy||0, oz: p.oz||0, sx: p.sx??1, sy: p.sy??1, sz: p.sz??1, rx: p.rx||0, ry: p.ry||0, rz: p.rz||0, color: p.color || LIGHT_GREY }));
  } else {
    const type = GEO[spec.geometry] ? spec.geometry : "box";
    parts = [{ type, ox:0, oy:0, oz:0, sx:1, sy:1, sz:1, rx:0, ry:0, rz:0, color: LIGHT_GREY }];
  }
  return { id: newId(), name: spec.name || "Model", kind: "composite", pos: [0, 0.8, 0], scale: spec.scale||1, rot: [spec.rotX||0, spec.rotY||0, spec.rotZ||0], metal: 0.3, rough: 0.55, parts };
}

export default function BlenderStudio() {
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("object");
  const [brush, setBrush] = useState("draw");
  const [brushSize, setBrushSize] = useState(0.8);
  const [brushStrength, setBrushStrength] = useState(0.5);
  const [paintColor, setPaintColor] = useState("#3b82f6");
  const [theme, setTheme] = useState("dark");
  const [snap, setSnap] = useState(false);
  const [cameraLock, setCameraLock] = useState(false);
  const [selectedFaces, setSelectedFaces] = useState(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [jabberOpen, setJabberOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const objectsRef = useRef([]); objectsRef.current = objects;

  const snapshot = useCallback((objs) => objs.map((o) => {
    if (o.kind === "mesh") return { ...o, geo: o.geo.clone() };
    if (o.kind === "image") return { ...o };
    return { ...o, parts: o.parts.map((p) => ({ ...p })) };
  }), []);
  const pushUndo = useCallback(() => {
    setUndoStack((s) => [...s.slice(-29), snapshot(objectsRef.current)]);
    setRedoStack([]);
  }, [snapshot]);

  const undo = useCallback(() => {
    setUndoStack((s) => { if (!s.length) return s; const prev = s[s.length - 1]; setRedoStack((r) => [...r, snapshot(objectsRef.current)]); setObjects(prev); setSelectedId(null); setSelectedFaces(new Set()); return s.slice(0, -1); });
  }, [snapshot]);
  const redo = useCallback(() => {
    setRedoStack((r) => { if (!r.length) return r; const next = r[r.length - 1]; setUndoStack((s) => [...s, snapshot(objectsRef.current)]); setObjects(next); setSelectedId(null); setSelectedFaces(new Set()); return r.slice(0, -1); });
  }, [snapshot]);

  const addMesh = (type) => {
    pushUndo();
    const o = { id: newId(), name: type.charAt(0).toUpperCase() + type.slice(1), kind: "mesh", meshType: type, geo: createPrimitive(type), pos: [0, 0.8, 0], rot: [0, 0, 0], scale: 1, metal: 0.3, rough: 0.55 };
    setObjects((p) => [...p, o]); setSelectedId(o.id); setSelectedFaces(new Set());
  };
  const addSpec = (spec) => { const o = objectFromSpec(spec); setObjects((p) => [...p, o]); setSelectedId(o.id); };
  const addPreset = (preset) => { const o = { id: newId(), name: preset.name, kind: "composite", pos: [0, 0.8, 0], scale: 1, rot: [0, 0, 0], metal: 0.3, rough: 0.55, parts: preset.parts.map((p) => ({ ...p, color: LIGHT_GREY })) }; setObjects((p) => [...p, o]); setSelectedId(o.id); };

  const updateObject = (id, patch) => setObjects((p) => p.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const updateGeometry = (id, newGeo) => {
    const old = objectsRef.current.find((o) => o.id === id); if (old?.geo) old.geo.dispose();
    setObjects((p) => p.map((o) => (o.id === id ? { ...o, geo: newGeo } : o)));
  };
  const handleDuplicate = () => { if (!selectedId) return; const sel = objects.find((o) => o.id === selectedId); if (!sel) return; pushUndo(); const d = { ...sel, id: newId(), name: `${sel.name} copy`, pos: [sel.pos[0] + 1.5, sel.pos[1], sel.pos[2]], geo: sel.kind === "mesh" ? sel.geo.clone() : undefined, parts: sel.parts?.map((p) => ({ ...p })) }; setObjects((p) => [...p, d]); setSelectedId(d.id); };
  const handleDelete = () => { if (!selectedId) return; pushUndo(); const sel = objects.find((o) => o.id === selectedId); if (sel?.geo) sel.geo.dispose(); setObjects((p) => p.filter((o) => o.id !== selectedId)); setSelectedId(null); setSelectedFaces(new Set()); };

  const handleExtrude = () => { const sel = objects.find((o) => o.id === selectedId); if (!sel || sel.kind !== "mesh" || !selectedFaces.size) return; pushUndo(); updateGeometry(sel.id, extrudeFaces(sel.geo, selectedFaces, 0.3)); setSelectedFaces(new Set()); };
  const handleSubdivide = () => { const sel = objects.find((o) => o.id === selectedId); if (!sel || sel.kind !== "mesh") return; pushUndo(); updateGeometry(sel.id, subdivide(sel.geo)); };
  const handleMerge = () => { const sel = objects.find((o) => o.id === selectedId); if (!sel || sel.kind !== "mesh") return; pushUndo(); updateGeometry(sel.id, mergeVertices(sel.geo, 0.001)); };
  const handleMirror = () => { const sel = objects.find((o) => o.id === selectedId); if (!sel || sel.kind !== "mesh") return; pushUndo(); updateGeometry(sel.id, mirrorGeometry(sel.geo, "x")); };
  const handleDeleteFaces = () => { const sel = objects.find((o) => o.id === selectedId); if (!sel || sel.kind !== "mesh" || !selectedFaces.size) return; pushUndo(); updateGeometry(sel.id, deleteFaces(sel.geo, selectedFaces)); setSelectedFaces(new Set()); };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (e.key === "1") setMode("object");
      if (e.key === "2") setMode("edit");
      if (e.key === "3") setMode("sculpt");
      if (e.key === "4") setMode("paint");
      if (e.key === "e" && mode === "edit") handleExtrude();
      if ((e.key === "Delete" || e.key === "Backspace") && mode === "object") handleDelete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, selectedId, selectedFaces, undo, redo]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1">
        <div className="relative">
          <StudioViewport
            objects={objects}
            selectedId={selectedId}
            mode={mode}
            brush={brush}
            brushSize={brushSize}
            brushStrength={brushStrength}
            paintColor={paintColor}
            theme={theme}
            snap={snap}
            cameraLock={cameraLock}
            selectedFaces={selectedFaces}
            overlays={{ grid: true }}
            geoFactory={(type) => GEO[type]()}
            onSelectObject={setSelectedId}
            onSelectFaces={setSelectedFaces}
            onUpdateGeometry={updateGeometry}
            onUpdateObject={updateObject}
            onSculptStart={pushUndo}
          />
        </div>
        <p className="mt-2 hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 md:block">
          1-4 modes · E extrude · Ctrl+Z undo · drag empty to orbit · drag object to move · scroll to zoom
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 md:hidden">
          touch drag empty to orbit · touch drag object to move · pinch to zoom · two-finger pan
        </p>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <StudioSidebar
          objects={objects}
          selectedId={selectedId}
          mode={mode}
          brush={brush}
          brushSize={brushSize}
          brushStrength={brushStrength}
          paintColor={paintColor}
          theme={theme}
          snap={snap}
          cameraLock={cameraLock}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onModeChange={setMode}
          onBrushChange={setBrush}
          onBrushSize={setBrushSize}
          onBrushStrength={setBrushStrength}
          onPaintColor={setPaintColor}
          onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
          onToggleSnap={() => setSnap(s => !s)}
          onToggleCameraLock={() => setCameraLock(v => !v)}
          onUndo={undo}
          onRedo={redo}
          onSelectObject={setSelectedId}
          onUpdateObject={updateObject}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onAddMesh={addMesh}
          onExtrude={handleExtrude}
          onSubdivide={handleSubdivide}
          onMerge={handleMerge}
          onMirror={handleMirror}
          onDeleteFaces={handleDeleteFaces}
          onImport={() => setImportOpen(true)}
          onGenerate={() => setJabberOpen(true)}
          onPresets={() => setPresetOpen(true)}
        />
      </div>

      {/* Mobile floating button + drawer for the sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden">
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 overflow-y-auto p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle className="font-mono text-xs uppercase tracking-wider">Studio Panel</SheetTitle>
          </SheetHeader>
          <div className="p-2">
            <StudioSidebar
              objects={objects}
              selectedId={selectedId}
              mode={mode}
              brush={brush}
              brushSize={brushSize}
              brushStrength={brushStrength}
              paintColor={paintColor}
              theme={theme}
              snap={snap}
              cameraLock={cameraLock}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onModeChange={setMode}
              onBrushChange={setBrush}
              onBrushSize={setBrushSize}
              onBrushStrength={setBrushStrength}
              onPaintColor={setPaintColor}
              onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
              onToggleSnap={() => setSnap(s => !s)}
              onToggleCameraLock={() => setCameraLock(v => !v)}
              onUndo={undo}
              onRedo={redo}
              onSelectObject={setSelectedId}
              onUpdateObject={updateObject}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onAddMesh={addMesh}
              onExtrude={handleExtrude}
              onSubdivide={handleSubdivide}
              onMerge={handleMerge}
              onMirror={handleMirror}
              onDeleteFaces={handleDeleteFaces}
              onImport={() => setImportOpen(true)}
              onGenerate={() => setJabberOpen(true)}
              onPresets={() => setPresetOpen(true)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ImportModelsPanel open={importOpen} onClose={() => setImportOpen(false)} onImport={addSpec} />
      <JabberModelGen open={jabberOpen} onClose={() => setJabberOpen(false)} onAdd={addSpec} />
      <ModelPresetsPanel open={presetOpen} onClose={() => setPresetOpen(false)} onAdd={addPreset} />
    </div>
  );
}
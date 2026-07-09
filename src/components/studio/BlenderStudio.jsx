import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Box, Circle, Hexagon, Triangle, Octagon, Square, Trash2, Plus, Download, Sparkles } from "lucide-react";
import ImportModelsPanel from "@/components/studio/ImportModelsPanel";
import JabberModelGen from "@/components/studio/JabberModelGen";

// Blender-inspired 3D modeling workspace.
// Objects are multi-part groups so duplicate / merge / slice / cut stay meaningful.
const GEO = {
  box: () => new THREE.BoxGeometry(1.4, 1.4, 1.4),
  sphere: () => new THREE.SphereGeometry(0.9, 32, 24),
  cylinder: () => new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32),
  cone: () => new THREE.ConeGeometry(0.8, 1.6, 32),
  torus: () => new THREE.TorusGeometry(0.7, 0.28, 16, 48),
  plane: () => new THREE.PlaneGeometry(2, 2),
  octahedron: () => new THREE.OctahedronGeometry(0.9),
  icosahedron: () => new THREE.IcosahedronGeometry(0.9),
  tetrahedron: () => new THREE.TetrahedronGeometry(1.0),
  dodecahedron: () => new THREE.DodecahedronGeometry(0.9),
};

// Per-type local height (from bounding box), used to split parts evenly.
const TYPE_HEIGHT = {};
Object.keys(GEO).forEach((t) => {
  const g = GEO[t]();
  g.computeBoundingBox();
  TYPE_HEIGHT[t] = g.boundingBox.max.y - g.boundingBox.min.y;
  g.dispose();
});

const PRIMITIVES = [
  { type: "box", label: "Cube", icon: Box },
  { type: "sphere", label: "Sphere", icon: Circle },
  { type: "cylinder", label: "Cylinder", icon: Hexagon },
  { type: "cone", label: "Cone", icon: Triangle },
  { type: "torus", label: "Torus", icon: Octagon },
  { type: "plane", label: "Plane", icon: Square },
];
const PALETTE = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#a855f7", "#ec4899", "#14b8a6", "#e5e7eb"];
const TYPES = Object.keys(GEO);

const newId = () => `o-${Math.random().toString(36).slice(2, 9)}`;

// Build a single-part object from a model-like spec (used by palette, import, Jabber).
function objectFromSpec(spec) {
  const type = GEO[spec.geometry] ? spec.geometry : "box";
  return {
    id: newId(),
    name: spec.name || type.charAt(0).toUpperCase() + type.slice(1),
    pos: [0, 0.8, 0],
    scale: spec.scale || 1,
    rot: [spec.rotX || 0, spec.rotY || 0, spec.rotZ || 0],
    parts: [{ type, ox: 0, oy: 0, oz: 0, sx: 1, sy: 1, sz: 1, rx: 0, ry: 0, rz: 0, color: spec.color || "#3b82f6" }],
  };
}

// Decompose every part into world space (folds object transform into each part).
function worldParts(obj) {
  const mObj = new THREE.Matrix4().compose(
    new THREE.Vector3(obj.pos[0], obj.pos[1], obj.pos[2]),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(obj.rot[0], obj.rot[1], obj.rot[2])),
    new THREE.Vector3(obj.scale, obj.scale, obj.scale)
  );
  return obj.parts.map((p) => {
    const mPart = new THREE.Matrix4().compose(
      new THREE.Vector3(p.ox, p.oy, p.oz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rx, p.ry, p.rz)),
      new THREE.Vector3(p.sx, p.sy, p.sz)
    );
    const mWorld = mObj.clone().multiply(mPart);
    const wp = new THREE.Vector3(), wq = new THREE.Quaternion(), ws = new THREE.Vector3();
    mWorld.decompose(wp, wq, ws);
    const e = new THREE.Euler().setFromQuaternion(wq);
    return { type: p.type, wx: wp.x, wy: wp.y, wz: wp.z, sx: ws.x, sy: ws.y, sz: ws.z, rx: e.x, ry: e.y, rz: e.z, color: p.color };
  });
}

export default function BlenderStudio() {
  const mountRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [jabberOpen, setJabberOpen] = useState(false);
  const objectsRef = useRef([]);
  const selectedRef = useRef(null);
  const meshGroupRef = useRef(null);
  const pickablesRef = useRef([]);

  const rebuild = () => {
    const group = meshGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      c.traverse((n) => { n.geometry?.dispose?.(); n.material?.dispose?.(); });
    }
    pickablesRef.current.length = 0;
    objectsRef.current.forEach((o) => {
      const og = new THREE.Group();
      og.position.set(o.pos[0], o.pos[1], o.pos[2]);
      og.scale.setScalar(o.scale);
      og.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
      const isSel = o.id === selectedRef.current;
      o.parts.forEach((p) => {
        const mat = new THREE.MeshStandardMaterial({
          color: p.color,
          metalness: 0.3,
          roughness: 0.5,
          side: p.type === "plane" ? THREE.DoubleSide : THREE.FrontSide,
        });
        if (isSel) mat.emissive = new THREE.Color(p.color).multiplyScalar(0.35);
        const mesh = new THREE.Mesh(GEO[p.type](), mat);
        mesh.position.set(p.ox, p.oy, p.oz);
        mesh.scale.set(p.sx, p.sy, p.sz);
        mesh.rotation.set(p.rx, p.ry, p.rz);
        mesh.userData.id = o.id;
        og.add(mesh);
        pickablesRef.current.push(mesh);
      });
      group.add(og);
    });
  };

  useEffect(() => { objectsRef.current = objects; rebuild(); }, [objects]);
  useEffect(() => { selectedRef.current = selectedId; rebuild(); }, [selectedId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1020");
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(8, 12, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x3b82f6, 0.6, 60);
    rim.position.set(-8, 6, -6);
    scene.add(rim);

    scene.add(new THREE.GridHelper(20, 20, 0x2a3550, 0x1a2238));
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0e1426, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    const group = new THREE.Group();
    meshGroupRef.current = group;
    pickablesRef.current = [];
    scene.add(group);
    rebuild();

    let radius = 12, theta = 0.8, phi = 1.1;
    const target = new THREE.Vector3(0, 1, 0);
    const updateCam = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    };
    updateCam();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false, lastX = 0, lastY = 0, dragDist = 0;
    const onDown = (e) => {
      dragging = true; dragDist = 0; lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      theta -= dx * 0.006;
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi - dy * 0.006));
      updateCam();
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {}
      renderer.domElement.style.cursor = "grab";
      if (dragDist < 6) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(pickablesRef.current, false)[0];
        setSelectedId(hit?.object?.userData?.id || null);
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.max(4, Math.min(40, radius * (e.deltaY > 0 ? 1.1 : 0.9)));
      updateCam();
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    let raf;
    const tick = () => { raf = requestAnimationFrame(tick); renderer.render(scene, camera); };
    tick();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  const addObject = (type) => {
    const color = PALETTE[objects.length % PALETTE.length];
    const o = objectFromSpec({ geometry: type, color, scale: 1, name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}` });
    setObjects((p) => [...p, o]);
    setSelectedId(o.id);
  };
  const addSpec = (spec) => {
    const o = objectFromSpec(spec);
    setObjects((p) => [...p, o]);
    setSelectedId(o.id);
  };

  const sel = objects.find((o) => o.id === selectedId);
  const updateSel = (patch) =>
    setObjects((p) => p.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)));
  const setColor = (color) =>
    setObjects((p) => p.map((o) => (o.id === selectedId ? { ...o, parts: o.parts.map((pt) => ({ ...pt, color })) } : o)));
  const delSel = () => { setObjects((p) => p.filter((o) => o.id !== selectedId)); setSelectedId(null); };

  const handleDuplicate = () => {
    if (!sel) return;
    const d = { ...sel, id: newId(), name: `${sel.name} copy`, pos: [sel.pos[0] + 1.5, sel.pos[1], sel.pos[2]], parts: sel.parts.map((p) => ({ ...p })) };
    setObjects((p) => [...p, d]);
    setSelectedId(d.id);
  };
  const handleMerge = () => {
    if (!sel || objects.length < 2) return;
    const other = objects.find((o) => o.id !== sel.id);
    if (!other) return;
    const origin = sel.pos;
    const parts = [...worldParts(sel), ...worldParts(other)].map((w) => ({
      type: w.type, ox: w.wx - origin[0], oy: w.wy - origin[1], oz: w.wz - origin[2],
      sx: w.sx, sy: w.sy, sz: w.sz, rx: w.rx, ry: w.ry, rz: w.rz, color: w.color,
    }));
    const merged = { id: newId(), name: `${sel.name}+`, pos: [...origin], scale: 1, rot: [0, 0, 0], parts };
    setObjects((p) => p.filter((o) => o.id !== sel.id && o.id !== other.id).concat(merged));
    setSelectedId(merged.id);
  };
  const handleSlice = () => {
    if (!sel) return;
    const topParts = [], botParts = [];
    sel.parts.forEach((p) => {
      const half = ((TYPE_HEIGHT[p.type] || 1) * p.sy) / 2;
      topParts.push({ ...p, sy: p.sy * 0.5, oy: p.oy + half / 2 });
      botParts.push({ ...p, sy: p.sy * 0.5, oy: p.oy - half / 2 });
    });
    const top = { ...sel, id: newId(), name: `${sel.name} top`, parts: topParts };
    const bot = { ...sel, id: newId(), name: `${sel.name} bot`, parts: botParts };
    setObjects((p) => p.filter((o) => o.id !== sel.id).concat(top, bot));
    setSelectedId(top.id);
  };
  const handleCut = () => {
    if (!sel) return;
    const parts = sel.parts.map((p) => {
      const half = ((TYPE_HEIGHT[p.type] || 1) * p.sy) / 2;
      return { ...p, sy: p.sy * 0.5, oy: p.oy - half / 2 };
    });
    const cut = { ...sel, id: newId(), name: `${sel.name} cut`, parts };
    setObjects((p) => p.filter((o) => o.id !== sel.id).concat(cut));
    setSelectedId(cut.id);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Add:</span>
          {PRIMITIVES.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.type}
                onClick={() => addObject(p.type)}
                className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-3 w-3" strokeWidth={2} />
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {p.label}
              </button>
            );
          })}
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Import
          </button>
          <button
            onClick={() => setJabberOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} /> Jabber
          </button>
        </div>
        <div ref={mountRef} className="h-[420px] w-full overflow-hidden rounded-2xl border border-border/50 md:h-[560px]" />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Drag to orbit · scroll to zoom · click an object to select
        </p>
      </div>

      <div className="w-full space-y-4 lg:w-72">
        <div className="rounded-2xl border border-border/50 p-4">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Outliner</h3>
          {objects.length === 0 ? (
            <p className="text-xs text-muted-foreground">Empty scene — add or import an object.</p>
          ) : (
            <ul className="space-y-1">
              {objects.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelectedId(o.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      selectedId === o.id ? "bg-primary/15 text-primary" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: o.parts[0]?.color }} />
                    <span className="flex-1 truncate">{o.name}</span>
                    {o.parts.length > 1 && <span className="font-mono text-[9px] text-muted-foreground">{o.parts.length}p</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sel && (
          <div className="space-y-3 rounded-2xl border border-border/50 p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Properties</h3>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Color</label>
              <input
                type="color"
                value={sel.parts[0]?.color || "#3b82f6"}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-full cursor-pointer rounded border border-border/60 bg-transparent"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["x", "y", "z"].map((ax, i) => (
                <label key={ax} className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Pos {ax}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sel.pos[i].toFixed(2)}
                    onChange={(e) => { const p = [...sel.pos]; p[i] = Number(e.target.value) || 0; updateSel({ pos: p }); }}
                    className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  />
                </label>
              ))}
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Scale {sel.scale.toFixed(2)}×</label>
              <input
                type="range"
                min="0.2"
                max="4"
                step="0.1"
                value={sel.scale}
                onChange={(e) => updateSel({ scale: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["x", "y", "z"].map((ax, i) => (
                <label key={ax} className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Rot {ax}°</span>
                  <input
                    type="number"
                    step="5"
                    value={Math.round((sel.rot[i] * 180) / Math.PI)}
                    onChange={(e) => { const r = [...sel.rot]; r[i] = ((Number(e.target.value) || 0) * Math.PI) / 180; updateSel({ rot: r }); }}
                    className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  />
                </label>
              ))}
            </div>

            <div className="border-t border-border/40 pt-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleDuplicate} className="rounded-md border border-border/60 px-2 py-2 text-xs transition-colors hover:border-primary hover:text-primary">Duplicate</button>
                <button
                  onClick={handleMerge}
                  disabled={objects.length < 2}
                  className="rounded-md border border-border/60 px-2 py-2 text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                  title={objects.length < 2 ? "Need another object to merge" : `Merge with ${objects.find((o) => o.id !== sel.id)?.name}`}
                >Merge</button>
                <button onClick={handleSlice} className="rounded-md border border-border/60 px-2 py-2 text-xs transition-colors hover:border-primary hover:text-primary">Slice</button>
                <button onClick={handleCut} className="rounded-md border border-border/60 px-2 py-2 text-xs transition-colors hover:border-primary hover:text-primary">Cut</button>
              </div>
            </div>

            <button
              onClick={delSel}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Object
            </button>
          </div>
        )}
      </div>

      <ImportModelsPanel open={importOpen} onClose={() => setImportOpen(false)} onImport={addSpec} />
      <JabberModelGen open={jabberOpen} onClose={() => setJabberOpen(false)} onAdd={addSpec} />
    </div>
  );
}
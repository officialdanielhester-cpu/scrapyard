import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Box, Circle, Hexagon, Triangle, Octagon, Square, Trash2, Plus } from "lucide-react";

// Blender-inspired 3D modeling workspace: add primitives, orbit the camera,
// select objects, and edit position / scale / rotation / color.
const PRIMITIVES = [
  { type: "box", label: "Cube", icon: Box, geo: () => new THREE.BoxGeometry(1.4, 1.4, 1.4) },
  { type: "sphere", label: "Sphere", icon: Circle, geo: () => new THREE.SphereGeometry(0.9, 32, 24) },
  { type: "cylinder", label: "Cylinder", icon: Hexagon, geo: () => new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32) },
  { type: "cone", label: "Cone", icon: Triangle, geo: () => new THREE.ConeGeometry(0.8, 1.6, 32) },
  { type: "torus", label: "Torus", icon: Octagon, geo: () => new THREE.TorusGeometry(0.7, 0.28, 16, 48) },
  { type: "plane", label: "Plane", icon: Square, geo: () => new THREE.PlaneGeometry(2, 2) },
];
const GEO_BY_TYPE = Object.fromEntries(PRIMITIVES.map((p) => [p.type, p.geo]));
const PALETTE = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#a855f7", "#ec4899", "#14b8a6", "#e5e7eb"];

export default function BlenderStudio() {
  const mountRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const objectsRef = useRef([]);
  const selectedRef = useRef(null);
  const meshGroupRef = useRef(null);
  const pickablesRef = useRef([]);

  useEffect(() => { objectsRef.current = objects; rebuild(); }, [objects]);
  useEffect(() => { selectedRef.current = selectedId; rebuild(); }, [selectedId]);

  const rebuild = () => {
    const group = meshGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      c.geometry?.dispose?.();
      c.material?.dispose?.();
    }
    pickablesRef.current.length = 0;
    objectsRef.current.forEach((o) => {
      const mat = new THREE.MeshStandardMaterial({
        color: o.color,
        metalness: 0.3,
        roughness: 0.5,
        side: o.type === "plane" ? THREE.DoubleSide : THREE.FrontSide,
      });
      if (o.id === selectedRef.current) mat.emissive = new THREE.Color(o.color).multiplyScalar(0.35);
      const mesh = new THREE.Mesh(GEO_BY_TYPE[o.type](), mat);
      mesh.position.set(o.pos[0], o.pos[1], o.pos[2]);
      mesh.scale.setScalar(o.scale);
      mesh.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
      mesh.userData.id = o.id;
      group.add(mesh);
      pickablesRef.current.push(mesh);
    });
  };

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

    const grid = new THREE.GridHelper(20, 20, 0x2a3550, 0x1a2238);
    scene.add(grid);
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
      dragging = true;
      dragDist = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
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
    const tick = () => {
      raf = requestAnimationFrame(tick);
      renderer.render(scene, camera);
    };
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
    const id = `o-${Math.random().toString(36).slice(2, 9)}`;
    const color = PALETTE[objects.length % PALETTE.length];
    setObjects((p) => [...p, { id, type, pos: [0, 0.8, 0], scale: 1, rot: [0, 0, 0], color }]);
    setSelectedId(id);
  };
  const sel = objects.find((o) => o.id === selectedId);
  const updateSel = (patch) =>
    setObjects((p) => p.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)));
  const delSel = () => {
    setObjects((p) => p.filter((o) => o.id !== selectedId));
    setSelectedId(null);
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
            <p className="text-xs text-muted-foreground">Empty scene — add an object.</p>
          ) : (
            <ul className="space-y-1">
              {objects.map((o, i) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelectedId(o.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      selectedId === o.id ? "bg-primary/15 text-primary" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: o.color }} />
                    <span className="flex-1 truncate">{o.type} {i + 1}</span>
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
                value={sel.color}
                onChange={(e) => updateSel({ color: e.target.value })}
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
                    onChange={(e) => {
                      const p = [...sel.pos];
                      p[i] = Number(e.target.value) || 0;
                      updateSel({ pos: p });
                    }}
                    className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  />
                </label>
              ))}
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">
                Scale {sel.scale.toFixed(2)}×
              </label>
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
                    onChange={(e) => {
                      const r = [...sel.rot];
                      r[i] = ((Number(e.target.value) || 0) * Math.PI) / 180;
                      updateSel({ rot: r });
                    }}
                    className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
                  />
                </label>
              ))}
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
    </div>
  );
}
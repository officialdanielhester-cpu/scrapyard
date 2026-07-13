import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Copy, Palette, Plus, Minus, Trash2, RotateCw, RotateCcw } from "lucide-react";
import { buildFreeInstances3D, MAP } from "@/components/workshop/part-3d";

const newIid = () => `i-${Math.random().toString(36).slice(2, 9)}`;

// 3D assembly bay that mirrors the EXACT 2D placements (x,y → 3D X,Y on z=0),
// with per-instance selection, drag-to-reposition, orientation, scale, color,
// duplicate and delete — all synced back to the shared instances state.
export default function AssemblyCanvas3D({ instances, setInstances }) {
  const mountRef = useRef(null);
  const instancesRef = useRef(instances);
  const setInstancesRef = useRef(setInstances);
  const rebuildRef = useRef(null);
  const toolbarRef = useRef(null);
  const [selectedIid, setSelectedIid] = useState(null);
  const selectedRef = useRef(null);

  useEffect(() => { selectedRef.current = selectedIid; }, [selectedIid]);
  useEffect(() => { instancesRef.current = instances; }, [instances]);
  useEffect(() => { setInstancesRef.current = setInstances; }, [setInstances]);
  useEffect(() => {
    if (selectedIid && !instances.some((i) => i.iid === selectedIid)) setSelectedIid(null);
  }, [instances, selectedIid]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(6, 10, 6); scene.add(key);
    const rim = new THREE.PointLight(0x3b82f6, 0.8, 30); rim.position.set(-5, 4, -4); scene.add(rim);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.1, 40),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.6, roughness: 0.4 })
    );
    scene.add(platform);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.35, 48),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2; scene.add(ring);

    let assembly = buildFreeInstances3D(instancesRef.current);
    scene.add(assembly.group);

    const target = new THREE.Vector3(0, 0, 0);
    let radius = 8, theta = 0.7, phi = 1.15;
    const camRight = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    const updateCamera = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    };

    const rebuild = () => {
      scene.remove(assembly.group);
      assembly.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      assembly = buildFreeInstances3D(instancesRef.current);
      scene.add(assembly.group);
      const b = assembly.bbox;
      if (b) {
        const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
        const spanX = b.maxX - b.minX, spanY = b.maxY - b.minY;
        target.set(cx, cy, 0);
        radius = Math.max(5, Math.min(16, Math.max(spanX, spanY) * 1.5 + 2.5));
        const pr = Math.max(2.0, spanX / 2 + 0.6);
        platform.geometry.dispose(); platform.geometry = new THREE.CylinderGeometry(pr, pr + 0.2, 0.1, 40);
        ring.geometry.dispose(); ring.geometry = new THREE.RingGeometry(pr, pr + 0.15, 48);
        platform.position.set(cx, b.minY - 0.4, 0);
        ring.position.set(cx, b.minY - 0.34, 0);
      } else {
        target.set(0, 0, 0); radius = 8;
        platform.position.set(0, -2.2, 0); ring.position.set(0, -2.14, 0);
      }
      updateCamera();
    };
    rebuild();
    rebuildRef.current = rebuild;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const intersectParts = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(assembly.pickables, false);
    };

    const movePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeHit = new THREE.Vector3();

    const pointers = new Map();
    let panMode = false, moveActive = false, moveIid = null;
    let lastOrbit = { x: 0, y: 0 }, lastPan = { x: 0, y: 0 };
    let pinchDist = 0, dragDist = 0;

    const panBy = (dx, dy) => {
      camera.updateMatrixWorld();
      camRight.setFromMatrixColumn(camera.matrixWorld, 0);
      camUp.setFromMatrixColumn(camera.matrixWorld, 1);
      const k = radius * 0.0018;
      target.addScaledVector(camRight, -dx * k);
      target.addScaledVector(camUp, dy * k);
    };

    const onDown = (e) => {
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragDist = 0;
      renderer.domElement.style.cursor = "grabbing";
      if (pointers.size === 2) {
        moveActive = false; moveIid = null;
        const pts = [...pointers.values()];
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        lastPan = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      } else if (pointers.size === 1) {
        const hit = intersectParts(e.clientX, e.clientY)[0];
        if (hit?.object?.userData?.iid) {
          setSelectedIid(hit.object.userData.iid);
          moveActive = true; moveIid = hit.object.userData.iid;
          lastOrbit = { x: e.clientX, y: e.clientY };
        } else {
          panMode = e.shiftKey || e.button === 2;
          moveActive = false;
          lastOrbit = { x: e.clientX, y: e.clientY };
          lastPan = { x: e.clientX, y: e.clientY };
        }
      }
    };

    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDist) radius = Math.max(3, Math.min(22, radius * (pinchDist / d)));
        pinchDist = d;
        const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
        panBy(mx - lastPan.x, my - lastPan.y);
        lastPan = { x: mx, y: my };
        updateCamera();
      } else if (pointers.size === 1) {
        if (moveActive && moveIid) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          if (raycaster.ray.intersectPlane(movePlane, planeHit)) {
            const nx = Math.round(MAP.CX + planeHit.x / MAP.K);
            const ny = Math.round(MAP.CY - planeHit.y / MAP.K);
            const cx = Math.max(20, Math.min(580, nx));
            const cy = Math.max(20, Math.min(460, ny));
            setInstancesRef.current?.((prev) => prev.map((p) => (p.iid === moveIid ? { ...p, x: cx, y: cy } : p)));
          }
        } else {
          const dx = e.clientX - lastOrbit.x, dy = e.clientY - lastOrbit.y;
          lastOrbit = { x: e.clientX, y: e.clientY };
          dragDist += Math.abs(dx) + Math.abs(dy);
          if (panMode) { panBy(dx, dy); updateCamera(); }
          else { theta -= dx * 0.006; phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi - dy * 0.006)); updateCamera(); }
        }
      }
    };

    const onUp = (e) => {
      const wasMove = moveActive;
      const wasPan = panMode || pointers.size > 1;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 1) {
        const p = [...pointers.values()][0];
        lastOrbit = { x: p.x, y: p.y };
        panMode = false;
      }
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {}
      if (wasMove) { moveActive = false; moveIid = null; }
      else if (!wasPan && dragDist < 6 && pointers.size === 0) {
        setSelectedIid(null);
      }
      renderer.domElement.style.cursor = "grab";
    };
    const onContext = (e) => e.preventDefault();
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.max(3, Math.min(22, radius * (e.deltaY > 0 ? 1.1 : 0.9)));
      updateCamera();
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("contextmenu", onContext);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const selCenter = new THREE.Vector3();
    const tmpV = new THREE.Vector3();
    let raf;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      assembly.rotorMeshes.forEach((r) => { r.rotation.y += dt * 12; });

      const sel = selectedRef.current;
      let count = 0;
      selCenter.set(0, 0, 0);
      assembly.pickables.forEach((m) => {
        const isSel = m.userData.iid === sel;
        if (m.material && m.material.emissive) m.material.emissive.setHex(isSel ? 0x1d4ed8 : 0x000000);
        if (isSel) { m.getWorldPosition(tmpV); selCenter.add(tmpV); count++; }
      });

      const tb = toolbarRef.current;
      if (tb) {
        if (sel && count > 0) {
          selCenter.divideScalar(count);
          selCenter.project(camera);
          const w = renderer.domElement.clientWidth;
          const h = renderer.domElement.clientHeight;
          tb.style.opacity = "1";
          tb.style.pointerEvents = "auto";
          tb.style.left = `${(selCenter.x * 0.5 + 0.5) * w}px`;
          tb.style.top = `${(-selCenter.y * 0.5 + 0.5) * h}px`;
          tb.style.transform = "translate(-50%, -130%)";
        } else {
          tb.style.opacity = "0";
          tb.style.pointerEvents = "none";
        }
      }

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
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("contextmenu", onContext);
      renderer.domElement.removeEventListener("wheel", onWheel);
      scene.remove(assembly.group);
      assembly.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      platform.geometry.dispose(); platform.material.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => { rebuildRef.current?.(); }, [instances]);

  const selInst = instances.find((i) => i.iid === selectedIid);
  const tbBtn = "flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-primary hover:text-primary-foreground";
  const patchSel = (patch) => setInstances((prev) => prev.map((p) => (p.iid === selectedIid ? { ...p, ...patch } : p)));
  const duplicateSel = () => {
    if (!selInst) return;
    const ni = { ...selInst, iid: newIid(), x: Math.min(560, selInst.x + 30), y: Math.min(440, selInst.y + 30) };
    setInstances((prev) => [...prev, ni]);
    setSelectedIid(ni.iid);
  };
  const deleteSel = () => {
    setInstances((prev) => prev.filter((p) => p.iid !== selectedIid));
    setSelectedIid(null);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {selectedIid && selInst && (
        <div
          ref={toolbarRef}
          className="absolute left-0 top-0 z-20 flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-1.5 py-1 opacity-0 shadow-lg backdrop-blur pointer-events-none"
        >
          <button onClick={duplicateSel} title="Duplicate" className={tbBtn}>
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-primary hover:text-primary-foreground" title="Color">
            <Palette className="h-3.5 w-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="color"
              value={selInst.color || "#3b82f6"}
              onChange={(e) => patchSel({ color: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <button onClick={() => patchSel({ scale: Math.min(5, (selInst.scale || 1) * 1.15) })} title="Scale up" className={tbBtn}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button onClick={() => patchSel({ scale: Math.max(0.2, (selInst.scale || 1) / 1.15) })} title="Scale down" className={tbBtn}>
            <Minus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button onClick={() => patchSel({ rot: ((selInst.rot || 0) + 15) % 360 })} title="Rotate +15°" className={tbBtn}>
            <RotateCw className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button onClick={() => patchSel({ rot: (((selInst.rot || 0) - 15) % 360 + 360) % 360 })} title="Rotate −15°" className={tbBtn}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={deleteSel}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
      <span className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
        drag a part to reposition · drag empty space to orbit · pinch to zoom
      </span>
    </div>
  );
}
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Copy, Palette, Plus, Minus, Trash2 } from "lucide-react";
import { layoutAssembly, BODY_W } from "@/components/workshop/part-visuals";
import { partGroup, sideGroup, PALETTE, mat, S, countByType } from "@/components/workshop/part-3d";

// 3D assembly bay: free orbit/pan/zoom navigation, click-to-select a part type,
// and a camera-projected floating action toolbar (duplicate / color / scale / delete)
// matching the Studio workspace pattern.

function buildAssembly3D(applied) {
  const layout = layoutAssembly(applied);
  const group = new THREE.Group();
  const rotorMeshes = [];
  const pickables = [];
  if (!layout.hasContent) return { group, rotorMeshes, pickables, totalH: 0 };

  const totalH = layout.totalH;
  const w3D = BODY_W * S;
  const r = w3D / 2;
  const center3D = (svgY, h) => (totalH / 2 - (svgY + h / 2)) * S;

  const tagPick = (mesh, id) => {
    mesh.userData.partId = id;
    pickables.push(mesh);
  };

  layout.placed.forEach((p) => {
    const h3D = p.h * S;
    const sub = partGroup(p.id, r, h3D);
    sub.position.y = center3D(p.y, p.h);
    sub.traverse((o) => {
      if (o.isMesh) {
        tagPick(o, p.id);
        if (p.id === "rotor_blade" && o.geometry.type === "BoxGeometry") rotorMeshes.push(o);
      }
    });
    group.add(sub);
  });

  layout.side.forEach((s) => {
    const sub = sideGroup(s.id, r);
    sub.position.y = center3D(s.y, 24);
    sub.traverse((o) => {
      if (o.isMesh) tagPick(o, s.id);
    });
    group.add(sub);
  });

  if (layout.boosters.length) {
    const top3D = center3D(layout.bodyTop, 0);
    const bottom3D = center3D(layout.bodyBottom, 0);
    const bh = Math.max(0.6, top3D - bottom3D);
    const by = (top3D + bottom3D) / 2;
    const off = r + 0.25;
    [off, -off].forEach((x) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, bh, 16), mat(PALETTE.engine, 0.5, 0.4));
      b.position.set(x, by, 0);
      const noz = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 16), mat(PALETTE.engine, 0.5, 0.4));
      noz.position.set(x, by - bh / 2 - 0.15, 0);
      noz.rotation.x = Math.PI;
      tagPick(b, "solid_booster");
      tagPick(noz, "solid_booster");
      group.add(b, noz);
    });
  }

  return { group, rotorMeshes, pickables, totalH };
}

export default function AssemblyCanvas3D({ instances, onRemoveInstance, onAddInstance, setInstances }) {
  const mountRef = useRef(null);
  const appliedRef = useRef(countByType(instances));
  const onRemoveRef = useRef(onRemoveInstance);
  const onAddRef = useRef(onAddInstance);
  const setInstancesRef = useRef(setInstances);
  const rebuildRef = useRef(null);
  const toolbarRef = useRef(null);
  const [selectedType, setSelectedType] = useState(null);
  const selectedRef = useRef(null);
  useEffect(() => { selectedRef.current = selectedType; }, [selectedType]);

  useEffect(() => { appliedRef.current = countByType(instances); }, [instances]);
  useEffect(() => { onRemoveRef.current = onRemoveInstance; }, [onRemoveInstance]);
  useEffect(() => { onAddRef.current = onAddInstance; }, [onAddInstance]);
  useEffect(() => { setInstancesRef.current = setInstances; }, [setInstances]);

  useEffect(() => {
    if (selectedType && !instances.some((i) => i.type === selectedType)) setSelectedType(null);
  }, [instances, selectedType]);

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
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(6, 10, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x3b82f6, 0.8, 30);
    rim.position.set(-5, 4, -4);
    scene.add(rim);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.1, 40),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.6, roughness: 0.4 })
    );
    platform.position.y = -2.2;
    scene.add(platform);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.35, 48),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.14;
    scene.add(ring);

    let assembly = buildAssembly3D(appliedRef.current);
    scene.add(assembly.group);

    const target = new THREE.Vector3(0, 0, 0);
    let radius = 8;
    let theta = 0.7;
    let phi = 1.15;
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
      assembly.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      assembly = buildAssembly3D(appliedRef.current);
      scene.add(assembly.group);
      const height3D = assembly.totalH * S;
      const groupY = assembly.totalH > 0 ? -2.15 + height3D / 2 : 0;
      assembly.group.position.y = groupY;
      target.set(0, groupY, 0);
      radius = Math.max(6, Math.min(16, height3D * 1.4 || 8));
      updateCamera();
    };
    rebuild();
    rebuildRef.current = rebuild;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const intersect = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(assembly.pickables, false);
    };

    // navigation: single-pointer drag = orbit; shift-drag / two-finger = pan; pinch = zoom
    const pointers = new Map();
    let panMode = false;
    let lastOrbit = { x: 0, y: 0 };
    let lastPan = { x: 0, y: 0 };
    let pinchDist = 0;
    let dragDist = 0;

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
      if (pointers.size === 1) {
        panMode = e.shiftKey || e.button === 2;
        lastOrbit = { x: e.clientX, y: e.clientY };
        lastPan = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        lastPan = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
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
        const dx = e.clientX - lastOrbit.x, dy = e.clientY - lastOrbit.y;
        lastOrbit = { x: e.clientX, y: e.clientY };
        dragDist += Math.abs(dx) + Math.abs(dy);
        if (panMode) { panBy(dx, dy); updateCamera(); }
        else { theta -= dx * 0.006; phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi - dy * 0.006)); updateCamera(); }
      }
    };
    const onUp = (e) => {
      const wasPan = panMode || pointers.size > 1;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 1) {
        const p = [...pointers.values()][0];
        lastOrbit = { x: p.x, y: p.y };
        panMode = false;
      }
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {}
      renderer.domElement.style.cursor = "grab";
      // click (small drag, single pointer, not panning) = select a part type
      if (!wasPan && dragDist < 6 && pointers.size === 0) {
        const hit = intersect(e.clientX, e.clientY)[0];
        setSelectedType(hit?.object?.userData?.partId || null);
      }
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

      // selection highlight
      const sel = selectedRef.current;
      let count = 0;
      selCenter.set(0, 0, 0);
      assembly.pickables.forEach((m) => {
        const isSel = m.userData.partId === sel;
        if (m.material && m.material.emissive) m.material.emissive.setHex(isSel ? 0x1d4ed8 : 0x000000);
        if (isSel) { m.getWorldPosition(tmpV); selCenter.add(tmpV); count++; }
      });

      // floating toolbar projection
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
      assembly.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      platform.geometry.dispose(); platform.material.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => { rebuildRef.current?.(); }, [instances]);

  const tbBtn = "flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-primary hover:text-primary-foreground";

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {selectedType && (
        <div
          ref={toolbarRef}
          className="absolute left-0 top-0 z-20 flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-1.5 py-1 opacity-0 shadow-lg backdrop-blur pointer-events-none"
        >
          <button onClick={() => onAddInstance?.(selectedType)} title="Duplicate" className={tbBtn}>
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-primary hover:text-primary-foreground" title="Color">
            <Palette className="h-3.5 w-3.5 pointer-events-none" strokeWidth={1.5} />
            <input
              type="color"
              value={instances.find((i) => i.type === selectedType)?.color || "#3b82f6"}
              onChange={(e) => setInstancesRef.current?.((prev) => prev.map((p) => (p.type === selectedType ? { ...p, color: e.target.value } : p)))}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <button
            onClick={() => setInstancesRef.current?.((prev) => prev.map((p) => (p.type === selectedType ? { ...p, scale: Math.min(5, (p.scale || 1) * 1.15) } : p)))}
            title="Scale up"
            className={tbBtn}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={() => setInstancesRef.current?.((prev) => prev.map((p) => (p.type === selectedType ? { ...p, scale: Math.max(0.2, (p.scale || 1) / 1.15) } : p)))}
            title="Scale down"
            className={tbBtn}
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={() => { onRemoveInstance?.(selectedType); setSelectedType(null); }}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { applyBrush, applyGrab, applyPaint } from "@/components/studio/sculpt-brushes";
import { buildAdjacency } from "@/components/studio/mesh-utils";

// 3D viewport for the Studio. Handles all pointer interaction based on mode:
// Object: orbit / select / move / gizmo · Edit: orbit / face-select · Sculpt: brush deform · Paint: vertex color
export default function StudioViewport(props) {
  const mountRef = useRef(null);
  const p = useRef(props); p.current = props;
  const rebuildRef = useRef(() => {});

  useEffect(() => { p.current = props; });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth || 800, H = mount.clientHeight || 560;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.touchAction = "none"; renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(8, 12, 8); scene.add(key);
    const rim = new THREE.PointLight(0x3b82f6, 0.5, 60); rim.position.set(-8, 6, -6); scene.add(rim);

    const grid = new THREE.GridHelper(20, 20, 0x2a3550, 0x1a2238); scene.add(grid);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x0e1426, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; scene.add(ground);

    const group = new THREE.Group(); scene.add(group);
    const gizmoGroup = new THREE.Group(); scene.add(gizmoGroup);
    const highlightRef = { mesh: null, wire: null };

    // Gizmo arrows
    const arrowLen = 0.8, arrowR = 0.04;
    const mkArrow = (color, axis) => {
      const mat = new THREE.MeshBasicMaterial({ color });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(arrowR, arrowR, arrowLen), mat);
      const head = new THREE.Mesh(new THREE.ConeGeometry(arrowR * 3, arrowR * 8), mat);
      head.position.y = arrowLen / 2 + arrowR * 4;
      const g = new THREE.Group(); g.add(shaft); g.add(head); g.userData.axis = axis;
      if (axis === "x") g.rotation.z = -Math.PI / 2;
      if (axis === "z") g.rotation.x = Math.PI / 2;
      gizmoGroup.add(g); return g;
    };
    const arrows = { x: mkArrow(0xff4444, "x"), y: mkArrow(0x44ff44, "y"), z: mkArrow(0x4488ff, "z") };
    gizmoGroup.visible = false;

    const meshGroupRef = { current: group };
    const pickablesRef = { current: [] };

    const rebuild = () => {
      const { objects, selectedId, mode, theme } = p.current;
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.traverse((n) => { n.material?.dispose?.(); }); }
      pickablesRef.current = [];
      const bg = theme === "light" ? 0xe2e8f0 : 0x0b1020;
      scene.background = new THREE.Color(bg);
      grid.visible = p.current.overlays?.grid !== false;
      ground.material.color.set(theme === "light" ? 0xd8dee9 : 0x0e1426);

      objects.forEach((o) => {
        const isSel = o.id === selectedId;
        const isMesh = o.kind === "mesh";
        if (isMesh) {
          const mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: o.metal ?? 0.3, roughness: o.rough ?? 0.55, side: THREE.DoubleSide });
          if (isSel && mode !== "object") mat.emissive = new THREE.Color(0x1a3a6a).multiplyScalar(0.3);
          const mesh = new THREE.Mesh(o.geo, mat);
          mesh.position.set(...o.pos); mesh.rotation.set(...o.rot); mesh.scale.setScalar(o.scale);
          mesh.userData.id = o.id;
          group.add(mesh); pickablesRef.current.push(mesh);
          if (isSel && mode === "edit") {
            const wire = new THREE.LineSegments(new THREE.WireframeGeometry(o.geo), new THREE.LineBasicMaterial({ color: 0x3b82f6, opacity: 0.4, transparent: true }));
            mesh.add(wire); highlightRef.wire = wire;
          }
        } else {
          const og = new THREE.Group(); og.position.set(...o.pos); og.scale.setScalar(o.scale); og.rotation.set(...o.rot);
          o.parts.forEach((part) => {
            const mat = new THREE.MeshStandardMaterial({ color: part.color, metalness: o.metal ?? 0.3, roughness: o.rough ?? 0.55, side: part.type === "plane" ? THREE.DoubleSide : THREE.FrontSide });
            if (isSel) mat.emissive = new THREE.Color(part.color).multiplyScalar(0.3);
            const m = new THREE.Mesh(p.current.geoFactory(part.type), mat);
            m.position.set(part.ox, part.oy, part.oz); m.scale.set(part.sx, part.sy, part.sz); m.rotation.set(part.rx, part.ry, part.rz);
            m.userData.id = o.id; og.add(m); pickablesRef.current.push(m);
          });
          group.add(og);
        }
      });

      // Gizmo
      const sel = objects.find((o) => o.id === selectedId);
      if (sel && mode === "object") {
        gizmoGroup.position.set(sel.pos[0], sel.pos[1], sel.pos[2]);
        gizmoGroup.visible = true;
      } else gizmoGroup.visible = false;
    };
    rebuildRef.current = rebuild;

    let radius = 12, theta = 0.8, phi = 1.1;
    const target = new THREE.Vector3(0, 1, 0);
    const updateCam = () => { camera.position.set(target.x + radius * Math.sin(phi) * Math.sin(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.cos(theta)); camera.lookAt(target); };
    updateCam();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const movePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let dragging = false, moveId = null, moveY = 0, lastX = 0, lastY = 0, dragDist = 0;
    let gizmoAxis = null, gizmoStart = null;
    let sculpting = false, grabState = null, adjacencyCache = new WeakMap();

    const setPointer = (cx, cy) => { const r = renderer.domElement.getBoundingClientRect(); pointer.x = ((cx - r.left) / r.width) * 2 - 1; pointer.y = -((cy - r.top) / r.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); };
    const pickMesh = (cx, cy) => { setPointer(cx, cy); const hit = raycaster.intersectObjects(pickablesRef.current, false)[0]; return hit; };

    const onDown = (e) => {
      e.preventDefault();
      dragDist = 0; lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
      const { mode, selectedId, objects, brush, brushSize } = p.current;
      const sel = objects.find((o) => o.id === selectedId);

      if (mode === "object") {
        setPointer(e.clientX, e.clientY);
        const gizmoHit = raycaster.intersectObjects(Object.values(arrows), true)[0];
        if (gizmoHit) { gizmoAxis = gizmoHit.object.parent.userData.axis; gizmoStart = sel ? [...sel.pos] : [0,0,0]; renderer.domElement.style.cursor = "grabbing"; return; }
        const hit = pickMesh(e.clientX, e.clientY);
        if (hit?.object?.userData?.id) { moveId = hit.object.userData.id; moveY = sel ? sel.pos[1] : 0; movePlane.constant = -moveY; p.current.onSelectObject(moveId); }
        else dragging = true;
        renderer.domElement.style.cursor = "grabbing";
      } else if (mode === "edit") {
        if (!sel || sel.kind !== "mesh") { dragging = true; return; }
        setPointer(e.clientX, e.clientY);
        const mesh = pickablesRef.current.find((m) => m.userData.id === selectedId);
        if (mesh) { const hit = raycaster.intersectObject(mesh, false)[0]; if (hit) { p.current.onSelectFaces(new Set([Math.floor(hit.faceIndex)])); return; } }
        dragging = true;
      } else if (mode === "sculpt" || mode === "paint") {
        if (!sel || sel.kind !== "mesh") { dragging = true; return; }
        setPointer(e.clientX, e.clientY);
        const mesh = pickablesRef.current.find((m) => m.userData.id === selectedId);
        if (mesh) { const hit = raycaster.intersectObject(mesh, false)[0]; if (hit) { p.current.onSculptStart?.(); sculpting = true; if (mode === "sculpt" && brush === "grab") startGrab(sel.geo, hit, brushSize); else applyStroke(sel.geo, hit, e); renderer.domElement.style.cursor = "crosshair"; return; } }
        dragging = true;
      }
    };

    const startGrab = (geo, hit, size) => {
      const pos = geo.attributes.position; const verts = [];
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const d = v.distanceTo(hit.point); if (d < size) verts.push({ i, x: v.x, y: v.y, z: v.z, f: (1 - d / size) * (1 - d / size) }); }
      const n = camera.getWorldDirection(new THREE.Vector3()).negate();
      grabState = { verts, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(n, hit.point), start: hit.point.clone() };
    };

    const applyStroke = (geo, hit, e) => {
      const { mode, brush, brushSize, brushStrength, paintColor } = p.current;
      if (mode === "paint") { applyPaint(geo, hit.point, brushSize, brushStrength, paintColor); return; }
      if (brush === "grab") return;
      let adj = adjacencyCache.get(geo); if (!adj && brush === "smooth") { adj = buildAdjacency(geo); adjacencyCache.set(geo, adj); }
      const worldNormal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
      applyBrush(geo, hit.point, worldNormal, brush, brushSize, brushStrength, 1, adj);
    };

    const onMove = (e) => {
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; dragDist += Math.abs(dx) + Math.abs(dy);
      const { mode, selectedId, objects, brush, brushSize } = p.current;
      const sel = objects.find((o) => o.id === selectedId);

      if (gizmoAxis && sel) {
        const s = 0.01; const np = [...sel.pos];
        if (gizmoAxis === "x") np[0] += dx * s;
        if (gizmoAxis === "y") np[1] -= dy * s;
        if (gizmoAxis === "z") np[2] += dy * s;
        p.current.onUpdateObject(sel.id, { pos: np });
        return;
      }
      if (moveId && sel) {
        setPointer(e.clientX, e.clientY); const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(movePlane, hit)) { let x = hit.x, z = hit.z; if (p.current.snap) { x = Math.round(x * 4) / 4; z = Math.round(z * 4) / 4; } p.current.onUpdateObject(sel.id, { pos: [x, moveY, z] }); }
        return;
      }
      if (sculpting && sel && sel.kind === "mesh") {
        setPointer(e.clientX, e.clientY);
        const mesh = pickablesRef.current.find((m) => m.userData.id === selectedId);
        if (!mesh) return;
        if (brush === "grab" && grabState) {
          const planeHit = new THREE.Vector3(); if (!raycaster.ray.intersectPlane(grabState.plane, planeHit)) return;
          const delta = planeHit.clone().sub(grabState.start); applyGrab(sel.geo, grabState.verts, delta, brushSize);
        } else { const hit = raycaster.intersectObject(mesh, false)[0]; if (hit) applyStroke(sel.geo, hit, e); }
        return;
      }
      if (dragging) { theta -= dx * 0.006; phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi - dy * 0.006)); updateCam(); }
    };

    const onUp = (e) => {
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {}
      renderer.domElement.style.cursor = "grab";
      if (gizmoAxis) { gizmoAxis = null; gizmoStart = null; return; }
      if (moveId) { moveId = null; return; }
      if (sculpting) { sculpting = false; grabState = null; return; }
      if (!dragging) return; dragging = false; if (dragDist < 6) p.current.onSelectObject(null);
    };
    const onWheel = (e) => { e.preventDefault(); radius = Math.max(4, Math.min(40, radius * (e.deltaY > 0 ? 1.1 : 0.9))); updateCam(); };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    let raf;
    const tick = () => { raf = requestAnimationFrame(tick); renderer.render(scene, camera); };
    tick();

    const ro = new ResizeObserver(() => { const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); });
    ro.observe(mount);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("pointerup", onUp); renderer.domElement.removeEventListener("wheel", onWheel); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); };
  }, []);

  useEffect(() => { rebuildRef.current(); }, [props.objects, props.selectedId, props.selectedFaces, props.theme, props.mode, props.overlays]);

  return <div ref={mountRef} className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border/50 md:h-[600px]" />;
}
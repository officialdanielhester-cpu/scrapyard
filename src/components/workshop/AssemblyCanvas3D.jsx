import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { layoutAssembly, BODY_W } from "@/components/workshop/part-visuals";
import { partGroup, sideGroup, PALETTE, mat, S, countByType } from "@/components/workshop/part-3d";

// 3D assembly preview: stacks the placed parts into a real 3D vehicle.
// Drag to orbit any angle, scroll to zoom, click a part to remove one instance.

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

export default function AssemblyCanvas3D({ instances, onRemoveInstance }) {
  const mountRef = useRef(null);
  const appliedRef = useRef(countByType(instances));
  const onRemoveRef = useRef(onRemoveInstance);
  const rebuildRef = useRef(null);

  useEffect(() => { appliedRef.current = countByType(instances); }, [instances]);
  useEffect(() => { onRemoveRef.current = onRemoveInstance; }, [onRemoveInstance]);

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
    let hoverMesh = null;

    const target = new THREE.Vector3(0, 0, 0);
    let radius = 8;
    let theta = 0.7;
    let phi = 1.15;
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
      hoverMesh = null;
      renderer.domElement.style.cursor = "grab";
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
    const setHover = (m) => {
      if (hoverMesh === m) return;
      if (hoverMesh && hoverMesh.material.emissive) hoverMesh.material.emissive.setHex(0x000000);
      hoverMesh = m;
      if (m && m.material.emissive) m.material.emissive.setHex(0x1d4ed8);
      if (!dragging) renderer.domElement.style.cursor = m ? "pointer" : "grab";
    };

    let dragging = false;
    let lastX = 0, lastY = 0, dragDist = 0;
    const onDown = (e) => {
      dragging = true;
      dragDist = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        dragDist += Math.abs(dx) + Math.abs(dy);
        theta -= dx * 0.006;
        phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi - dy * 0.006));
        updateCamera();
      } else {
        setHover(intersect(e.clientX, e.clientY)[0]?.object || null);
      }
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch (_) {}
      if (dragDist < 6) {
        const id = intersect(e.clientX, e.clientY)[0]?.object?.userData?.partId;
        if (id) onRemoveRef.current?.(id);
      }
      renderer.domElement.style.cursor = hoverMesh ? "pointer" : "grab";
    };
    const onLeave = () => { if (!dragging) setHover(null); };
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.max(3, Math.min(20, radius * (e.deltaY > 0 ? 1.1 : 0.9)));
      updateCamera();
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    let raf;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      assembly.rotorMeshes.forEach((r) => { r.rotation.y += dt * 12; });
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
      renderer.domElement.removeEventListener("pointerleave", onLeave);
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

  return <div ref={mountRef} className="h-full w-full" />;
}
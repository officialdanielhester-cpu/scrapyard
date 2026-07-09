import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { layoutAssembly, BODY_W } from "@/components/workshop/part-visuals";

// 3D assembly bay: renders stacked parts as a real 3D vehicle.
// Drag to orbit any angle, scroll to zoom, click a part to remove it.

const S = 0.02;
const PALETTE = {
  body: 0x3b82f6,
  bodyHi: 0x93c5fd,
  struct: 0x9ca3af,
  engine: 0x6b7280,
  aero: 0xf59e0b,
  gear: 0x374151,
  accent: 0xa855f7,
};

const mat = (color, metal = 0.6, rough = 0.35) =>
  new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });

function partGroup(id, r, h3D) {
  const g = new THREE.Group();
  switch (id) {
    case "nose_cone":
      g.add(new THREE.Mesh(new THREE.ConeGeometry(r, h3D, 24), mat(PALETTE.body, 0.4, 0.3)));
      break;
    case "fuel_tank": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h3D, 28), mat(PALETTE.body, 0.7, 0.25)));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, h3D * 0.06, 28), mat(PALETTE.bodyHi, 0.6, 0.3));
      g.add(band);
      break;
    }
    case "fuel_tank_large": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, h3D, 28), mat(PALETTE.body, 0.7, 0.25)));
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.07, r * 1.07, h3D * 0.05, 28), mat(PALETTE.bodyHi, 0.6, 0.3));
      b1.position.y = h3D * 0.3; g.add(b1);
      const b2 = b1.clone(); b2.position.y = -h3D * 0.3; g.add(b2);
      break;
    }
    case "payload":
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, h3D, 20), mat(PALETTE.accent, 0.3, 0.5)));
      break;
    case "payload_capsule": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, h3D * 0.7, 20), mat(PALETTE.accent, 0.3, 0.5)));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 0.78, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(PALETTE.body, 0.4, 0.4));
      dome.position.y = h3D * 0.35; g.add(dome);
      break;
    }
    case "payload_cargo":
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.5, h3D, r * 1.5), mat(PALETTE.accent, 0.3, 0.5)));
      break;
    case "payload_sat": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, h3D, r * 1.1), mat(PALETTE.accent, 0.3, 0.5)));
      [-1, 1].forEach((s) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(r * 1.4, h3D * 0.5, 0.03), mat(0x1e3a8a, 0.2, 0.7));
        panel.position.set(s * r * 1.3, 0, 0); g.add(panel);
      });
      break;
    }
    case "battery":
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, h3D, r * 1.6), mat(PALETTE.struct, 0.4, 0.6)));
      break;
    case "heat_shield":
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 0.94, h3D, 24), mat(PALETTE.struct, 0.3, 0.7)));
      break;
    case "parachute": {
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(PALETTE.bodyHi, 0.2, 0.6));
      canopy.scale.y = 0.5; g.add(canopy);
      break;
    }
    case "liquid_engine": {
      const chamber = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, h3D * 0.4, 20), mat(PALETTE.engine, 0.8, 0.3));
      chamber.position.y = h3D * 0.3; g.add(chamber);
      const noz = new THREE.Mesh(new THREE.ConeGeometry(r * 0.5, h3D * 0.6, 20), mat(PALETTE.engine, 0.8, 0.3));
      noz.position.y = -h3D * 0.1; noz.rotation.x = Math.PI; g.add(noz);
      break;
    }
    case "ion_engine": {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h3D * 0.6, 8), mat(PALETTE.struct));
      stem.position.y = h3D * 0.1; g.add(stem);
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.2, h3D * 0.2, 20), mat(PALETTE.engine, 0.6, 0.4));
      dish.position.y = -h3D * 0.3; g.add(dish);
      break;
    }
    case "nuclear_engine": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, h3D * 0.5, 20), mat(PALETTE.engine, 0.7, 0.3)));
      [-1, 1].forEach((s) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, h3D * 0.5, r * 0.4), mat(PALETTE.engine, 0.7, 0.3));
        fin.position.set(s * r * 0.7, 0, 0); g.add(fin);
      });
      const noz = new THREE.Mesh(new THREE.ConeGeometry(r * 0.4, h3D * 0.4, 20), mat(PALETTE.engine, 0.8, 0.3));
      noz.position.y = -h3D * 0.35; noz.rotation.x = Math.PI; g.add(noz);
      break;
    }
    case "jet_engine": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, h3D, 20), mat(PALETTE.engine, 0.7, 0.3)));
      const intake = new THREE.Mesh(new THREE.TorusGeometry(r * 0.5, 0.04, 8, 20), mat(PALETTE.bodyHi, 0.6, 0.3));
      intake.rotation.x = Math.PI / 2; intake.position.y = h3D / 2; g.add(intake);
      break;
    }
    case "ramjet": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, h3D, 20), mat(PALETTE.engine, 0.7, 0.3)));
      const intake = new THREE.Mesh(new THREE.TorusGeometry(r * 0.45, 0.05, 8, 20), mat(PALETTE.bodyHi, 0.6, 0.3));
      intake.rotation.x = Math.PI / 2; intake.position.y = h3D / 2; g.add(intake);
      break;
    }
    case "turboshaft": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, h3D, 20), mat(PALETTE.engine, 0.7, 0.3)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, h3D * 0.15, 20), mat(PALETTE.struct));
      cap.position.y = h3D / 2; g.add(cap);
      break;
    }
    case "rotor_blade": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h3D, 8), mat(PALETTE.struct)));
      const blade = new THREE.Mesh(new THREE.BoxGeometry(r * 4, 0.03, 0.12), mat(PALETTE.aero, 0.5, 0.4));
      blade.position.y = h3D / 2; g.add(blade);
      break;
    }
    case "wheel": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, h3D, 0.06), mat(PALETTE.struct)));
      [-0.35, 0.35].forEach((z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.12, 16), mat(PALETTE.gear, 0.2, 0.8));
        w.rotation.x = Math.PI / 2; w.position.set(0, -h3D * 0.3, z); g.add(w);
      });
      break;
    }
    case "offroad_tire": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, h3D, 0.06), mat(PALETTE.struct)));
      [-0.4, 0.4].forEach((z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.16, 16), mat(PALETTE.gear, 0.2, 0.9));
        w.rotation.x = Math.PI / 2; w.position.set(0, -h3D * 0.25, z); g.add(w);
      });
      break;
    }
    case "treads": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.8, h3D * 0.6, r * 1.8), mat(PALETTE.gear, 0.2, 0.9)));
      [-0.3, 0.3].forEach((z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, r * 1.8, 16), mat(PALETTE.struct, 0.4, 0.6));
        w.rotation.z = Math.PI / 2; w.position.set(0, 0, z); g.add(w);
      });
      break;
    }
    case "landing_legs": {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, h3D * 0.2, 12), mat(PALETTE.struct));
      top.position.y = h3D * 0.3; g.add(top);
      [-1, 1].forEach((s) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h3D * 0.9, 8), mat(PALETTE.struct));
        leg.position.set(s * r * 0.7, -h3D * 0.1, 0); leg.rotation.z = s * 0.4; g.add(leg);
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), mat(PALETTE.gear));
        foot.position.set(s * r * 1.0, -h3D * 0.45, 0); g.add(foot);
      });
      break;
    }
    default:
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h3D, 20), mat(PALETTE.body)));
  }
  return g;
}

function sideGroup(id, r) {
  const g = new THREE.Group();
  let len, d;
  if (id === "wing") { len = r * 2.4; d = 0.5; }
  else if (id === "delta_wing") { len = r * 3.0; d = 0.6; }
  else if (id === "swept_wing") { len = r * 2.6; d = 0.4; }
  else if (id === "canard") { len = r * 1.4; d = 0.18; }
  else if (id === "spoiler") { len = r * 1.1; d = 0.1; }
  else { len = r * 1.6; d = 0.18; }
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, d), mat(PALETTE.aero, 0.4, 0.5));
    m.position.set(Math.cos(ang) * (r + len / 2 - 0.1), 0, Math.sin(ang) * (r + len / 2 - 0.1));
    m.rotation.y = ang;
    g.add(m);
  }
  return g;
}

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

export default function AssemblyCanvas3D({ applied, onRemoveInstance }) {
  const mountRef = useRef(null);
  const appliedRef = useRef(applied);
  const onRemoveRef = useRef(onRemoveInstance);
  const rebuildRef = useRef(null);

  useEffect(() => { appliedRef.current = applied; }, [applied]);
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

    // Orbit drag + click-to-remove
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

  useEffect(() => { rebuildRef.current?.(); }, [applied]);

  return <div ref={mountRef} className="h-full w-full" />;
}
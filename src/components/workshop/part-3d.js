import * as THREE from "three";
import { PART_SHAPES } from "@/components/workshop/part-visuals";

// Shared 3D part builder for the assembly bay (3D preview) and the simulation.
// Each part becomes a small 3D mesh; an optional tint recolors the body/accent.

export const S = 0.02;
export const PALETTE = {
  body: 0x3b82f6,
  bodyHi: 0x93c5fd,
  struct: 0x9ca3af,
  engine: 0x6b7280,
  aero: 0xf59e0b,
  gear: 0x374151,
  accent: 0xa855f7,
};

export const mat = (color, metal = 0.6, rough = 0.35) =>
  new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });

const tintHex = (c) => (typeof c === "string" ? parseInt(c.replace("#", ""), 16) : c);

export function partGroup(id, r, h3D, tint) {
  const pal = tint ? { ...PALETTE, body: tintHex(tint), bodyHi: tintHex(tint), accent: tintHex(tint) } : PALETTE;
  const g = new THREE.Group();
  switch (id) {
    case "nose_cone":
      g.add(new THREE.Mesh(new THREE.ConeGeometry(r, h3D, 24), mat(pal.body, 0.4, 0.3)));
      break;
    case "fuel_tank": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h3D, 28), mat(pal.body, 0.7, 0.25)));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, h3D * 0.06, 28), mat(pal.bodyHi, 0.6, 0.3));
      g.add(band);
      break;
    }
    case "fuel_tank_large": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, h3D, 28), mat(pal.body, 0.7, 0.25)));
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.07, r * 1.07, h3D * 0.05, 28), mat(pal.bodyHi, 0.6, 0.3));
      b1.position.y = h3D * 0.3; g.add(b1);
      const b2 = b1.clone(); b2.position.y = -h3D * 0.3; g.add(b2);
      break;
    }
    case "payload":
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, h3D, 20), mat(pal.accent, 0.3, 0.5)));
      break;
    case "payload_capsule": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, h3D * 0.7, 20), mat(pal.accent, 0.3, 0.5)));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 0.78, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(pal.body, 0.4, 0.4));
      dome.position.y = h3D * 0.35; g.add(dome);
      break;
    }
    case "payload_cargo":
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.5, h3D, r * 1.5), mat(pal.accent, 0.3, 0.5)));
      break;
    case "payload_sat": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, h3D, r * 1.1), mat(pal.accent, 0.3, 0.5)));
      [-1, 1].forEach((s) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(r * 1.4, h3D * 0.5, 0.03), mat(0x1e3a8a, 0.2, 0.7));
        panel.position.set(s * r * 1.3, 0, 0); g.add(panel);
      });
      break;
    }
    case "battery":
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, h3D, r * 1.6), mat(pal.struct, 0.4, 0.6)));
      break;
    case "heat_shield":
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 0.94, h3D, 24), mat(pal.struct, 0.3, 0.7)));
      break;
    case "parachute": {
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(pal.bodyHi, 0.2, 0.6));
      canopy.scale.y = 0.5; g.add(canopy);
      break;
    }
    case "liquid_engine": {
      const chamber = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, h3D * 0.4, 20), mat(pal.engine, 0.8, 0.3));
      chamber.position.y = h3D * 0.3; g.add(chamber);
      const noz = new THREE.Mesh(new THREE.ConeGeometry(r * 0.5, h3D * 0.6, 20), mat(pal.engine, 0.8, 0.3));
      noz.position.y = -h3D * 0.1; noz.rotation.x = Math.PI; g.add(noz);
      break;
    }
    case "ion_engine": {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h3D * 0.6, 8), mat(pal.struct));
      stem.position.y = h3D * 0.1; g.add(stem);
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.2, h3D * 0.2, 20), mat(pal.engine, 0.6, 0.4));
      dish.position.y = -h3D * 0.3; g.add(dish);
      break;
    }
    case "nuclear_engine": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, h3D * 0.5, 20), mat(pal.engine, 0.7, 0.3)));
      [-1, 1].forEach((s) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, h3D * 0.5, r * 0.4), mat(pal.engine, 0.7, 0.3));
        fin.position.set(s * r * 0.7, 0, 0); g.add(fin);
      });
      const noz = new THREE.Mesh(new THREE.ConeGeometry(r * 0.4, h3D * 0.4, 20), mat(pal.engine, 0.8, 0.3));
      noz.position.y = -h3D * 0.35; noz.rotation.x = Math.PI; g.add(noz);
      break;
    }
    case "jet_engine": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, h3D, 20), mat(pal.engine, 0.7, 0.3)));
      const intake = new THREE.Mesh(new THREE.TorusGeometry(r * 0.5, 0.04, 8, 20), mat(pal.bodyHi, 0.6, 0.3));
      intake.rotation.x = Math.PI / 2; intake.position.y = h3D / 2; g.add(intake);
      break;
    }
    case "ramjet": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, h3D, 20), mat(pal.engine, 0.7, 0.3)));
      const intake = new THREE.Mesh(new THREE.TorusGeometry(r * 0.45, 0.05, 8, 20), mat(pal.bodyHi, 0.6, 0.3));
      intake.rotation.x = Math.PI / 2; intake.position.y = h3D / 2; g.add(intake);
      break;
    }
    case "turboshaft": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, h3D, 20), mat(pal.engine, 0.7, 0.3)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, h3D * 0.15, 20), mat(pal.struct));
      cap.position.y = h3D / 2; g.add(cap);
      break;
    }
    case "rotor_blade": {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h3D, 8), mat(pal.struct)));
      const blade = new THREE.Mesh(new THREE.BoxGeometry(r * 4, 0.03, 0.12), mat(pal.aero, 0.5, 0.4));
      blade.position.y = h3D / 2; g.add(blade);
      break;
    }
    case "wheel": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, h3D, 0.06), mat(pal.struct)));
      [-0.35, 0.35].forEach((z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.12, 16), mat(pal.gear, 0.2, 0.8));
        w.rotation.x = Math.PI / 2; w.position.set(0, -h3D * 0.3, z); g.add(w);
      });
      break;
    }
    case "offroad_tire": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, h3D, 0.06), mat(pal.struct)));
      [-0.4, 0.4].forEach((z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.16, 16), mat(pal.gear, 0.2, 0.9));
        w.rotation.x = Math.PI / 2; w.position.set(0, -h3D * 0.25, z); g.add(w);
      });
      break;
    }
    case "treads": {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(r * 1.8, h3D * 0.6, r * 1.8), mat(pal.gear, 0.2, 0.9)));
      [-0.3, 0.3].forEach((z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, r * 1.8, 16), mat(pal.struct, 0.4, 0.6));
        w.rotation.z = Math.PI / 2; w.position.set(0, 0, z); g.add(w);
      });
      break;
    }
    case "landing_legs": {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, h3D * 0.2, 12), mat(pal.struct));
      top.position.y = h3D * 0.3; g.add(top);
      [-1, 1].forEach((s) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h3D * 0.9, 8), mat(pal.struct));
        leg.position.set(s * r * 0.7, -h3D * 0.1, 0); leg.rotation.z = s * 0.4; g.add(leg);
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), mat(pal.gear));
        foot.position.set(s * r * 1.0, -h3D * 0.45, 0); g.add(foot);
      });
      break;
    }
    default:
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h3D, 20), mat(pal.body)));
  }
  return g;
}

export function sideGroup(id, r, tint) {
  const pal = tint ? { ...PALETTE, aero: tintHex(tint) } : PALETTE;
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
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, d), mat(pal.aero, 0.4, 0.5));
    m.position.set(Math.cos(ang) * (r + len / 2 - 0.1), 0, Math.sin(ang) * (r + len / 2 - 0.1));
    m.rotation.y = ang;
    g.add(m);
  }
  return g;
}

// Build a 3D group from free-form placed instances (2D canvas coords → 3D).
// Used by the simulation so it reflects the EXACT build the user assembled.
export function buildInstances3D(instances) {
  const group = new THREE.Group();
  const rotorMeshes = [];
  const pickables = [];
  if (!instances || !instances.length) return { group, rotorMeshes, pickables, totalH: 6 };

  const K = 0.012;
  const CX2 = 300, CY2 = 240;
  let minY = Infinity;
  const subs = [];
  instances.forEach((inst) => {
    const meta = PART_SHAPES[inst.type];
    if (!meta) return;
    const scale = inst.scale || 1;
    const r = 0.3 * scale;
    const h3D = Math.max(0.2, (meta.h || 40) * 0.02 * scale);
    const isSide = meta.slot === "side";
    const sub = isSide ? sideGroup(inst.type, r, inst.color) : partGroup(inst.type, r, h3D, inst.color);
    const yy = (CY2 - inst.y) * K;
    sub.position.set((inst.x - CX2) * K, yy, 0);
    minY = Math.min(minY, yy - h3D / 2);
    subs.push(sub);
    sub.traverse((o) => {
      if (o.isMesh) {
        o.userData.iid = inst.iid;
        o.userData.partId = inst.type;
        pickables.push(o);
        if (inst.type === "rotor_blade" && o.geometry?.type === "BoxGeometry") rotorMeshes.push(o);
      }
    });
  });
  // Shift so the build's base sits on the ground (y=0) in the simulation.
  const baseShift = minY === Infinity ? 0 : -minY;
  subs.forEach((s) => { s.position.y += baseShift; group.add(s); });

  return { group, rotorMeshes, pickables, totalH: 6 };
}

// Count instances by type → [{type, qty}] for the stacked 3D preview.
export function countByType(instances) {
  const map = {};
  (instances || []).forEach((i) => { map[i.type] = (map[i.type] || 0) + 1; });
  return Object.entries(map).map(([type, qty]) => ({ type, qty }));
}
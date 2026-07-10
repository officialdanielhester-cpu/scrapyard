import * as THREE from "three";

export const BRUSHES = [
  { id: "draw", name: "Draw", desc: "Push vertices along surface normal" },
  { id: "grab", name: "Grab", desc: "Drag vertices toward cursor" },
  { id: "smooth", name: "Smooth", desc: "Average vertex positions" },
  { id: "inflate", name: "Inflate", desc: "Push vertices from center" },
  { id: "clay", name: "Clay", desc: "Build up surface with falloff" },
];

// Apply a sculpt brush to vertices within `size` of `hitPoint`.
// For grab, use applyGrab instead (needs per-drag state).
export function applyBrush(geo, hitPoint, hitNormal, brushId, size, strength, direction = 1, adjacency = null) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const center = geo.boundingSphere ? geo.boundingSphere.center.clone() : new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dist = v.distanceTo(hitPoint);
    if (dist > size) continue;
    const falloff = 1 - dist / size;
    const f = falloff * falloff * strength;

    switch (brushId) {
      case "draw":
        v.addScaledVector(hitNormal, f * direction * 0.05);
        break;
      case "inflate":
        v.addScaledVector(v.clone().sub(center).normalize(), f * direction * 0.05);
        break;
      case "smooth":
        if (adjacency && adjacency.has(i)) {
          const avg = new THREE.Vector3();
          let count = 0;
          for (const ni of adjacency.get(i)) { avg.add(new THREE.Vector3().fromBufferAttribute(pos, ni)); count++; }
          if (count) v.lerp(avg.divideScalar(count), f * 0.4);
        }
        break;
      case "clay":
        v.addScaledVector(hitNormal, f * direction * 0.03);
        break;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Grab brush: move vertices that were within brush radius at drag start.
export function applyGrab(geo, startVerts, delta, size) {
  const pos = geo.attributes.position;
  for (const sv of startVerts) {
    pos.setXYZ(sv.i, sv.x + delta.x * sv.f, sv.y + delta.y * sv.f, sv.z + delta.z * sv.f);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Paint vertex colors within brush radius, blending with existing color.
export function applyPaint(geo, hitPoint, size, strength, color) {
  const pos = geo.attributes.position;
  const colors = geo.attributes.color;
  if (!colors) return;
  const c = new THREE.Color(color);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dist = v.distanceTo(hitPoint);
    if (dist > size) continue;
    const f = (1 - dist / size) * (1 - dist / size) * strength;
    colors.setXYZ(i, colors.getX(i) * (1 - f) + c.r * f, colors.getY(i) * (1 - f) + c.g * f, colors.getZ(i) * (1 - f) + c.b * f);
  }
  colors.needsUpdate = true;
}
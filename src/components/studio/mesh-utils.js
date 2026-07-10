import * as THREE from "three";

// Create an editable primitive mesh with vertex colors initialized to light grey.
export function createPrimitive(type, detail = 1) {
  const d = Math.max(1, detail);
  let geo;
  switch (type) {
    case "box": geo = new THREE.BoxGeometry(1.4, 1.4, 1.4, 2 + d, 2 + d, 2 + d); break;
    case "sphere": geo = new THREE.SphereGeometry(0.9, 20 + d * 8, 14 + d * 6); break;
    case "cylinder": geo = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 16 + d * 6, 1 + d); break;
    case "cone": geo = new THREE.ConeGeometry(0.8, 1.6, 16 + d * 6, 1 + d); break;
    case "torus": geo = new THREE.TorusGeometry(0.7, 0.28, 10 + d * 4, 20 + d * 8); break;
    case "plane": geo = new THREE.PlaneGeometry(2, 2, 4 + d * 2, 4 + d * 2); break;
    case "icosahedron": geo = new THREE.IcosahedronGeometry(0.9, d); break;
    default: geo = new THREE.BoxGeometry(1.4, 1.4, 1.4, 2 + d, 2 + d, 2 + d);
  }
  geo.computeVertexNormals();
  const c = new THREE.Color(0xd4d4d8);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeBoundingSphere();
  return geo;
}

// Extrude selected faces outward along their normals, creating side walls.
export function extrudeFaces(geo, faceSet, distance = 0.3) {
  if (!faceSet.size || !geo.index) return geo;
  const pos = geo.attributes.position;
  const idx = geo.index;
  const oldColors = geo.attributes.color;

  const selVerts = new Set();
  for (const fi of faceSet) for (let i = 0; i < 3; i++) selVerts.add(idx.getX(fi * 3 + i));

  const vertNormals = new Map();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
  for (const fi of faceSet) {
    const i0 = idx.getX(fi * 3), i1 = idx.getX(fi * 3 + 1), i2 = idx.getX(fi * 3 + 2);
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    ab.subVectors(b, a); ac.subVectors(c, a); n.crossVectors(ab, ac).normalize();
    for (const vi of [i0, i1, i2]) { if (!vertNormals.has(vi)) vertNormals.set(vi, new THREE.Vector3()); vertNormals.get(vi).add(n); }
  }
  vertNormals.forEach((v) => v.normalize());

  const oldCount = pos.count;
  const oldToNew = new Map();
  const newPos = [];
  for (const vi of selVerts) {
    const nrm = vertNormals.get(vi);
    newPos.push(pos.getX(vi) + nrm.x * distance, pos.getY(vi) + nrm.y * distance, pos.getZ(vi) + nrm.z * distance);
    oldToNew.set(vi, oldCount + newPos.length / 3 - 1);
  }
  const newPosArr = new Float32Array(oldCount * 3 + newPos.length);
  newPosArr.set(pos.array, 0); newPosArr.set(newPos, oldCount * 3);
  const newColArr = oldColors ? new Float32Array(oldCount * 3 + newPos.length) : null;
  if (oldColors) { newColArr.set(oldColors.array, 0); for (const vi of selVerts) { const ni = oldToNew.get(vi); newColArr[ni * 3] = oldColors.getX(vi); newColArr[ni * 3 + 1] = oldColors.getY(vi); newColArr[ni * 3 + 2] = oldColors.getZ(vi); } }

  const idxArr = Array.from(idx.array);
  for (const fi of faceSet) for (let i = 0; i < 3; i++) idxArr[fi * 3 + i] = oldToNew.get(idxArr[fi * 3 + i]);

  const edgeMap = new Map();
  for (let fi = 0; fi < idxArr.length / 3; fi++) for (let i = 0; i < 3; i++) {
    const ea = idxArr[fi * 3 + i], eb = idxArr[fi * 3 + (i + 1) % 3];
    const key = ea < eb ? `${ea}_${eb}` : `${eb}_${ea}`;
    if (!edgeMap.has(key)) edgeMap.set(key, { a: Math.min(ea, eb), b: Math.max(ea, eb), faces: [] });
    edgeMap.get(key).faces.push(fi);
  }
  const sides = [];
  for (const e of edgeMap.values()) {
    const sel = e.faces.filter((fi) => faceSet.has(fi));
    if (sel.length > 0 && e.faces.length > sel.length) {
      const nA = oldToNew.get(e.a), nB = oldToNew.get(e.b);
      if (nA !== undefined && nB !== undefined) sides.push(e.a, nB, nA, e.a, e.b, nB);
    }
  }
  const newIdx = new Uint32Array(idxArr.length + sides.length);
  newIdx.set(idxArr, 0); newIdx.set(sides, idxArr.length);

  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(newPosArr, 3));
  if (newColArr) ng.setAttribute("color", new THREE.BufferAttribute(newColArr, 3));
  ng.setIndex(new THREE.BufferAttribute(newIdx, 1));
  ng.computeVertexNormals(); ng.computeBoundingSphere();
  return ng;
}

// Subdivide every triangle into 4 by inserting edge midpoints.
export function subdivide(geo) {
  if (!geo.index) return geo;
  const pos = geo.attributes.position, idx = geo.index, oldColors = geo.attributes.color;
  const np = [], nc = [];
  for (let i = 0; i < pos.count; i++) { np.push(pos.getX(i), pos.getY(i), pos.getZ(i)); if (oldColors) nc.push(oldColors.getX(i), oldColors.getY(i), oldColors.getZ(i)); }
  const ni = [], mid = new Map();
  const getMid = (a, b) => { const key = a < b ? `${a}_${b}` : `${b}_${a}`; if (mid.has(key)) return mid.get(key); np.push((pos.getX(a)+pos.getX(b))/2,(pos.getY(a)+pos.getY(b))/2,(pos.getZ(a)+pos.getZ(b))/2); if (oldColors) nc.push((oldColors.getX(a)+oldColors.getX(b))/2,(oldColors.getY(a)+oldColors.getY(b))/2,(oldColors.getZ(a)+oldColors.getZ(b))/2); const v = np.length/3-1; mid.set(key, v); return v; };
  for (let i = 0; i < idx.count; i += 3) { const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2); const ab=getMid(a,b),bc=getMid(b,c),ca=getMid(c,a); ni.push(a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca); }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(new Float32Array(np), 3));
  if (oldColors) ng.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nc), 3));
  ng.setIndex(new THREE.BufferAttribute(new Uint32Array(ni), 1));
  ng.computeVertexNormals(); ng.computeBoundingSphere();
  return ng;
}

// Merge vertices closer than threshold into single shared vertices.
export function mergeVertices(geo, threshold = 0.001) {
  if (!geo.index) return geo;
  const pos = geo.attributes.position, idx = geo.index, oldColors = geo.attributes.color;
  const merged = new Map(), unique = [], grid = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i)/threshold)}_${Math.round(pos.getY(i)/threshold)}_${Math.round(pos.getZ(i)/threshold)}`;
    if (grid.has(key)) merged.set(i, grid.get(key));
    else { grid.set(key, unique.length / 3); merged.set(i, unique.length / 3); unique.push(pos.getX(i), pos.getY(i), pos.getZ(i)); }
  }
  const ni = new Uint32Array(idx.count);
  for (let i = 0; i < idx.count; i++) ni[i] = merged.get(idx.getX(i));
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(new Float32Array(unique), 3));
  if (oldColors) { const nc = new Float32Array(unique.length); for (let i = 0; i < pos.count; i++) { const j = merged.get(i); nc[j*3]=oldColors.getX(i); nc[j*3+1]=oldColors.getY(i); nc[j*3+2]=oldColors.getZ(i); } ng.setAttribute("color", new THREE.BufferAttribute(nc, 3)); }
  ng.setIndex(new THREE.BufferAttribute(ni, 1));
  ng.computeVertexNormals(); ng.computeBoundingSphere();
  return ng;
}

// Mirror geometry along an axis, appending mirrored faces with reversed winding.
export function mirrorGeometry(geo, axis = "x") {
  const pos = geo.attributes.position, idx = geo.index, oldColors = geo.attributes.color, oldCount = pos.count;
  const np = new Float32Array(oldCount * 3 * 2); np.set(pos.array, 0);
  for (let i = 0; i < oldCount; i++) { const j = oldCount + i; np[j*3]=axis==="x"?-pos.getX(i):pos.getX(i); np[j*3+1]=axis==="y"?-pos.getY(i):pos.getY(i); np[j*3+2]=axis==="z"?-pos.getZ(i):pos.getZ(i); }
  let nc = null; if (oldColors) { nc = new Float32Array(oldCount * 3 * 2); nc.set(oldColors.array, 0); nc.set(oldColors.array, oldCount * 3); }
  const oldIdx = idx.count, ni = new Uint32Array(oldIdx * 2); ni.set(idx.array, 0);
  for (let i = 0; i < oldIdx; i += 3) { ni[oldIdx+i]=idx.getX(i)+oldCount; ni[oldIdx+i+1]=idx.getX(i+2)+oldCount; ni[oldIdx+i+2]=idx.getX(i+1)+oldCount; }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
  if (nc) ng.setAttribute("color", new THREE.BufferAttribute(nc, 3));
  ng.setIndex(new THREE.BufferAttribute(ni, 1));
  ng.computeVertexNormals(); ng.computeBoundingSphere();
  return ng;
}

// Delete selected faces and any vertices that become unused.
export function deleteFaces(geo, faceSet) {
  if (!faceSet.size || !geo.index) return geo;
  const idx = geo.index, pos = geo.attributes.position, oldColors = geo.attributes.color;
  const ni = [];
  for (let fi = 0; fi < idx.count / 3; fi++) if (!faceSet.has(fi)) ni.push(idx.getX(fi*3), idx.getX(fi*3+1), idx.getX(fi*3+2));
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos.array), 3));
  if (oldColors) ng.setAttribute("color", new THREE.BufferAttribute(new Float32Array(oldColors.array), 3));
  ng.setIndex(new THREE.BufferAttribute(new Uint32Array(ni), 1));
  ng.computeVertexNormals(); ng.computeBoundingSphere();
  return ng;
}

// Set all vertex colors to a single color.
export function applyVertexColors(geo, color) {
  const c = new THREE.Color(color), colors = geo.attributes.color;
  if (!colors) { const arr = new Float32Array(geo.attributes.position.count * 3); geo.setAttribute("color", new THREE.BufferAttribute(arr, 3)); return applyVertexColors(geo, color); }
  for (let i = 0; i < colors.count; i++) colors.setXYZ(i, c.r, c.g, c.b);
  colors.needsUpdate = true;
}

// Build vertex adjacency map (vertex index → Set of neighbor indices).
export function buildAdjacency(geo) {
  const idx = geo.index; if (!idx) return new Map();
  const adj = new Map();
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    [[a,b],[b,c],[c,a]].forEach(([x,y]) => { if(!adj.has(x)) adj.set(x,new Set()); if(!adj.has(y)) adj.set(y,new Set()); adj.get(x).add(y); adj.get(y).add(x); });
  }
  return adj;
}
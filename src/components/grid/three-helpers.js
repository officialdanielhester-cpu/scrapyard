import * as THREE from "three";

const GEOMETRY_BUILDERS = {
  box: () => new THREE.BoxGeometry(1.4, 1.4, 1.4),
  octahedron: () => new THREE.OctahedronGeometry(1),
  icosahedron: () => new THREE.IcosahedronGeometry(1),
  tetrahedron: () => new THREE.TetrahedronGeometry(1.3),
  dodecahedron: () => new THREE.DodecahedronGeometry(0.9),
  torus: () => new THREE.TorusGeometry(0.8, 0.3, 16, 40),
  sphere: () => new THREE.SphereGeometry(0.9, 24, 24),
  cone: () => new THREE.ConeGeometry(0.9, 1.6, 6),
  plane: () => new THREE.PlaneGeometry(1.7, 1.7),
};

export const GEOMETRY_TYPES = Object.keys(GEOMETRY_BUILDERS);

export const GEOMETRY_LABELS = {
  box: "Box",
  octahedron: "Octahedron",
  icosahedron: "Icosahedron",
  tetrahedron: "Tetrahedron",
  dodecahedron: "Dodecahedron",
  torus: "Torus",
  sphere: "Sphere",
  cone: "Cone",
  plane: "Image Plane",
};

export function createGeometry(type) {
  const builder = GEOMETRY_BUILDERS[type] || GEOMETRY_BUILDERS.box;
  return builder();
}

export function createMaterial(model, textureLoader) {
  if (model.geometry === "plane" && model.image_url) {
    const loader = textureLoader || new THREE.TextureLoader();
    const texture = loader.load(model.image_url);
    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0,
      roughness: 1,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(model.color || "#3B82F6"),
    metalness: typeof model.metalness === "number" ? model.metalness : 0.65,
    roughness: typeof model.roughness === "number" ? model.roughness : 0.22,
  });
}
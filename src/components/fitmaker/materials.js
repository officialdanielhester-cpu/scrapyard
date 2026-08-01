// Material presets for the Fit Maker studio. Each material drives an SVG filter
// (fabric texture via turbulence + displacement) and a highlight overlay
// (reflectivity / roughness) so the garment reacts in real time.

export const MATERIALS = [
  { id: "cotton",   name: "Cotton",   texture: 0.25, roughness: 0.85, reflectivity: 0.08, weight: 0.55, transparency: 0 },
  { id: "denim",    name: "Denim",    texture: 0.65, roughness: 0.6,  reflectivity: 0.05, weight: 0.92, transparency: 0 },
  { id: "leather",  name: "Leather",  texture: 0.12, roughness: 0.25, reflectivity: 0.55, weight: 0.9,  transparency: 0 },
  { id: "wool",     name: "Wool",     texture: 0.5,  roughness: 0.95, reflectivity: 0.04, weight: 0.8,  transparency: 0 },
  { id: "polyester",name: "Polyester",texture: 0.18, roughness: 0.45, reflectivity: 0.3,  weight: 0.5,  transparency: 0 },
  { id: "nylon",    name: "Nylon",    texture: 0.1,  roughness: 0.3,  reflectivity: 0.5,  weight: 0.45, transparency: 0 },
  { id: "satin",    name: "Satin",    texture: 0.08, roughness: 0.15, reflectivity: 0.75, weight: 0.5,  transparency: 0 },
  { id: "silk",     name: "Silk",     texture: 0.06, roughness: 0.2,  reflectivity: 0.6,  weight: 0.4,  transparency: 0.1 },
  { id: "linen",    name: "Linen",    texture: 0.4,  roughness: 0.9,  reflectivity: 0.06, weight: 0.55, transparency: 0 },
  { id: "canvas",   name: "Canvas",   texture: 0.55, roughness: 0.8,  reflectivity: 0.07, weight: 0.95, transparency: 0 },
  { id: "mesh",     name: "Mesh",     texture: 0.35, roughness: 0.7,  reflectivity: 0.12, weight: 0.3,  transparency: 0.45 },
  { id: "velvet",   name: "Velvet",   texture: 0.3,  roughness: 0.4,  reflectivity: 0.35, weight: 0.75, transparency: 0 },
  { id: "fleece",   name: "Fleece",   texture: 0.45, roughness: 0.98, reflectivity: 0.03, weight: 0.7,  transparency: 0 },
  { id: "suede",    name: "Suede",    texture: 0.5,  roughness: 0.85, reflectivity: 0.12, weight: 0.82, transparency: 0 },
  { id: "knit",     name: "Knit",     texture: 0.38, roughness: 0.88, reflectivity: 0.05, weight: 0.6,  transparency: 0 },
  { id: "rubber",   name: "Rubber",   texture: 0.05, roughness: 0.5,  reflectivity: 0.4,  weight: 1,    transparency: 0 },
];

export const MATERIAL_MAP = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

export const FINISHES = [
  { id: "matte",    name: "Matte",    sheen: 0 },
  { id: "gloss",    name: "Gloss",    sheen: 0.5 },
  { id: "metallic", name: "Metallic", sheen: 0.85 },
];
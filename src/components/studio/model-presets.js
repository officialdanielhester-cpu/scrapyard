// Composite model presets — each is a multi-part object (offsets relative to
// the object origin). Built from the Studio's primitive geometries so they
// render immediately and stay fully editable (transform, duplicate, merge, slice, cut).
const P = (type, ox, oy, oz, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = "#3b82f6") => ({
  type, ox, oy, oz, sx, sy, sz, rx, ry, rz, color,
});
const H = Math.PI / 2;
const STEEL = "#c0c8d0";
const DARK = "#1f1f24";
const WOOD = "#3b2a1a";
const BRASS = "#b08d57";

export const PRESETS = [
  { name: "Sword", category: "Weapons", parts: [
    P("box", 0, 1.2, 0, 0.12, 2.2, 0.12, 0, 0, 0, STEEL),
    P("box", 0, 0.25, 0, 0.9, 0.1, 0.18, 0, 0, 0, BRASS),
    P("cylinder", 0, -0.1, 0, 0.12, 0.5, 0.12, 0, 0, 0, WOOD),
    P("sphere", 0, -0.45, 0, 0.18, 0.18, 0.18, 0, 0, 0, BRASS),
  ]},
  { name: "Pistol", category: "Weapons", parts: [
    P("box", 0, 0.3, 0, 0.7, 0.4, 0.18, 0, 0, 0, DARK),
    P("cylinder", 0.5, 0.4, 0, 0.12, 0.4, 0.12, 0, 0, H, DARK),
    P("box", -0.05, -0.1, 0, 0.22, 0.5, 0.16, 0, 0, 0.25, WOOD),
  ]},
  { name: "Rifle", category: "Weapons", parts: [
    P("box", 0, 0.3, 0, 2.2, 0.3, 0.16, 0, 0, 0, WOOD),
    P("cylinder", 1.3, 0.35, 0, 0.08, 1.2, 0.08, 0, 0, H, DARK),
    P("box", -1.1, 0.1, 0, 0.6, 0.5, 0.16, 0, 0, 0.1, "#2a1a0a"),
    P("box", -0.1, -0.25, 0, 0.2, 0.5, 0.14, 0, 0, 0, DARK),
  ]},
  { name: "Axe", category: "Weapons", parts: [
    P("cylinder", 0, 0, 0, 0.1, 2.2, 0.1, 0, 0, 0, WOOD),
    P("box", 0.35, 0.9, 0, 0.5, 0.6, 0.1, 0, 0, 0, STEEL),
  ]},
  { name: "Spear", category: "Weapons", parts: [
    P("cylinder", 0, 0, 0, 0.08, 3, 0.08, 0, 0, 0, WOOD),
    P("cone", 0, 1.7, 0, 0.18, 0.6, 0.18, 0, 0, 0, STEEL),
  ]},

  { name: "Rocket", category: "Vehicles", parts: [
    P("cylinder", 0, 0, 0, 0.5, 1.6, 0.5, 0, 0, 0, "#e5e7eb"),
    P("cone", 0, 1.2, 0, 0.5, 0.8, 0.5, 0, 0, 0, "#ef4444"),
    P("box", 0.5, -0.6, 0, 0.1, 0.5, 0.45, 0, 0, 0, "#ef4444"),
    P("box", -0.5, -0.6, 0, 0.1, 0.5, 0.45, 0, 0, 0, "#ef4444"),
    P("box", 0, -0.6, 0.5, 0.45, 0.5, 0.1, 0, 0, 0, "#ef4444"),
    P("box", 0, -0.6, -0.5, 0.45, 0.5, 0.1, 0, 0, 0, "#ef4444"),
    P("cylinder", 0, -1.0, 0, 0.45, 0.3, 0.45, 0, 0, 0, "#6b7280"),
  ]},
  { name: "Car", category: "Vehicles", parts: [
    P("box", 0, 0.35, 0, 2.2, 0.4, 1.0, 0, 0, 0, "#3b82f6"),
    P("box", -0.1, 0.7, 0, 1.0, 0.35, 0.9, 0, 0, 0, "#1e3a8a"),
    P("cylinder", 0.7, -0.05, 0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", 0.7, -0.05, -0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", -0.7, -0.05, 0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", -0.7, -0.05, -0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
  ]},
  { name: "Plane", category: "Vehicles", parts: [
    P("cylinder", 0, 0.4, 0, 0.3, 2.4, 0.3, 0, 0, H, "#e5e7eb"),
    P("cone", 1.3, 0.4, 0, 0.3, 0.6, 0.3, 0, 0, -H, "#e5e7eb"),
    P("box", 0, 0.3, 0, 0.8, 0.08, 2.4, 0, 0, 0, "#3b82f6"),
    P("box", -1.0, 0.7, 0, 0.5, 0.5, 0.1, 0, 0, 0, "#3b82f6"),
    P("box", -1.0, 0.35, 0, 0.5, 0.08, 1.0, 0, 0, 0, "#3b82f6"),
  ]},
  { name: "Tank", category: "Vehicles", parts: [
    P("box", 0, 0.3, 0, 2.4, 0.4, 1.2, 0, 0, 0, "#4a5a3a"),
    P("box", 0.2, 0.7, 0, 0.9, 0.35, 0.9, 0, 0, 0, "#3a4a2a"),
    P("cylinder", 1.0, 0.75, 0, 0.1, 1.0, 0.1, 0, 0, H, "#2a2a20"),
    P("box", 0, -0.05, 0, 2.6, 0.25, 1.4, 0, 0, 0, "#222222"),
  ]},
  { name: "Helicopter", category: "Vehicles", parts: [
    P("sphere", 0, 0.4, 0, 0.7, 0.7, 0.7, 0, 0, 0, "#3b82f6"),
    P("cylinder", -1.0, 0.5, 0, 0.15, 1.2, 0.15, 0, 0, H, "#3b82f6"),
    P("box", -1.6, 0.6, 0, 0.1, 0.4, 0.3, 0, 0, 0, "#1e3a8a"),
    P("box", 0, 1.0, 0, 3.0, 0.05, 0.1, 0, 0, 0, "#111111"),
    P("cylinder", 0, 0.95, 0, 0.1, 0.15, 0.1, 0, 0, 0, "#111111"),
    P("box", -1.6, 0.5, 0, 0.1, 0.05, 0.8, 0, 0, 0, "#111111"),
    P("box", 0, -0.2, 0.4, 1.4, 0.1, 0.1, 0, 0, 0, "#222222"),
    P("box", 0, -0.2, -0.4, 1.4, 0.1, 0.1, 0, 0, 0, "#222222"),
  ]},
];
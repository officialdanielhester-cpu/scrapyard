// Composite model presets — each is a multi-part object (offsets relative to
// the object origin). realSize is the real-world length/height in meters and
// sets each model's scale so proportions match real life (a car dwarfs a mug).
const P = (type, ox, oy, oz, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = "#3b82f6") => ({ type, ox, oy, oz, sx, sy, sz, rx, ry, rz, color });
const H = Math.PI / 2;
const STEEL = "#c0c8d0";
const DARK = "#1f1f24";
const WOOD = "#3b2a1a";
const BRASS = "#b08d57";
const BROWN = "#6b4226";
const GREEN = "#2f7d32";
const ORANGE = "#e07b2a";
const GREY = "#9aa0a6";
const RED = "#b91c1c";
const BLUE = "#2563eb";
const WHITE = "#e8e2d4";

export const PRESETS = [
  // ---- Weapons ----
  { name: "Sword", category: "Weapons", realSize: 1.0, parts: [
    P("box", 0, 1.2, 0, 0.12, 2.2, 0.12, 0, 0, 0, STEEL),
    P("box", 0, 0.25, 0, 0.9, 0.1, 0.18, 0, 0, 0, BRASS),
    P("cylinder", 0, -0.1, 0, 0.12, 0.5, 0.12, 0, 0, 0, WOOD),
    P("sphere", 0, -0.45, 0, 0.18, 0.18, 0.18, 0, 0, 0, BRASS),
  ]},
  { name: "Dagger", category: "Weapons", realSize: 0.35, parts: [
    P("box", 0, 0.45, 0, 0.1, 0.8, 0.1, 0, 0, 0, STEEL),
    P("box", 0, 0.05, 0, 0.5, 0.08, 0.14, 0, 0, 0, BRASS),
    P("cylinder", 0, -0.2, 0, 0.1, 0.3, 0.1, 0, 0, 0, WOOD),
  ]},
  { name: "Pistol", category: "Weapons", realSize: 0.22, parts: [
    P("box", 0, 0.3, 0, 0.7, 0.4, 0.18, 0, 0, 0, DARK),
    P("cylinder", 0.5, 0.4, 0, 0.12, 0.4, 0.12, 0, 0, H, DARK),
    P("box", -0.05, -0.1, 0, 0.22, 0.5, 0.16, 0, 0, 0.25, WOOD),
  ]},
  { name: "Rifle", category: "Weapons", realSize: 1.0, parts: [
    P("box", 0, 0.3, 0, 2.2, 0.3, 0.16, 0, 0, 0, WOOD),
    P("cylinder", 1.3, 0.35, 0, 0.08, 1.2, 0.08, 0, 0, H, DARK),
    P("box", -1.1, 0.1, 0, 0.6, 0.5, 0.16, 0, 0, 0.1, "#2a1a0a"),
    P("box", -0.1, -0.25, 0, 0.2, 0.5, 0.14, 0, 0, 0, DARK),
  ]},
  { name: "Axe", category: "Weapons", realSize: 0.8, parts: [
    P("cylinder", 0, 0, 0, 0.1, 2.2, 0.1, 0, 0, 0, WOOD),
    P("box", 0.35, 0.9, 0, 0.5, 0.6, 0.1, 0, 0, 0, STEEL),
  ]},
  { name: "Spear", category: "Weapons", realSize: 2.0, parts: [
    P("cylinder", 0, 0, 0, 0.08, 3, 0.08, 0, 0, 0, WOOD),
    P("cone", 0, 1.7, 0, 0.18, 0.6, 0.18, 0, 0, 0, STEEL),
  ]},

  // ---- Vehicles ----
  { name: "Car", category: "Vehicles", realSize: 4.5, parts: [
    P("box", 0, 0.35, 0, 2.2, 0.4, 1.0, 0, 0, 0, BLUE),
    P("box", -0.1, 0.7, 0, 1.0, 0.35, 0.9, 0, 0, 0, "#1e3a8a"),
    P("cylinder", 0.7, -0.05, 0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", 0.7, -0.05, -0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", -0.7, -0.05, 0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", -0.7, -0.05, -0.55, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
  ]},
  { name: "Motorcycle", category: "Vehicles", realSize: 2.2, parts: [
    P("box", 0, 0.5, 0, 1.0, 0.3, 0.3, 0, 0, 0, RED),
    P("cylinder", -0.7, -0.1, 0, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", 0.7, -0.1, 0, 0.3, 0.15, 0.3, H, 0, 0, "#111111"),
    P("cylinder", 0, 0.7, 0, 0.08, 0.5, 0.08, 0, 0, 0, DARK),
    P("box", 0.55, 0.7, 0, 0.3, 0.08, 0.1, 0, 0, 0, DARK),
  ]},
  { name: "Rocket", category: "Vehicles", realSize: 6.0, parts: [
    P("cylinder", 0, 0, 0, 0.5, 1.6, 0.5, 0, 0, 0, "#e5e7eb"),
    P("cone", 0, 1.2, 0, 0.5, 0.8, 0.5, 0, 0, 0, "#ef4444"),
    P("box", 0.5, -0.6, 0, 0.1, 0.5, 0.45, 0, 0, 0, "#ef4444"),
    P("box", -0.5, -0.6, 0, 0.1, 0.5, 0.45, 0, 0, 0, "#ef4444"),
    P("box", 0, -0.6, 0.5, 0.45, 0.5, 0.1, 0, 0, 0, "#ef4444"),
    P("box", 0, -0.6, -0.5, 0.45, 0.5, 0.1, 0, 0, 0, "#ef4444"),
    P("cylinder", 0, -1.0, 0, 0.45, 0.3, 0.45, 0, 0, 0, "#6b7280"),
  ]},
  { name: "Plane", category: "Vehicles", realSize: 12.0, parts: [
    P("cylinder", 0, 0.4, 0, 0.3, 2.4, 0.3, 0, 0, H, "#e5e7eb"),
    P("cone", 1.3, 0.4, 0, 0.3, 0.6, 0.3, 0, 0, -H, "#e5e7eb"),
    P("box", 0, 0.3, 0, 0.8, 0.08, 2.4, 0, 0, 0, BLUE),
    P("box", -1.0, 0.7, 0, 0.5, 0.5, 0.1, 0, 0, 0, BLUE),
    P("box", -1.0, 0.35, 0, 0.5, 0.08, 1.0, 0, 0, 0, BLUE),
  ]},
  { name: "Tank", category: "Vehicles", realSize: 6.0, parts: [
    P("box", 0, 0.3, 0, 2.4, 0.4, 1.2, 0, 0, 0, "#4a5a3a"),
    P("box", 0.2, 0.7, 0, 0.9, 0.35, 0.9, 0, 0, 0, "#3a4a2a"),
    P("cylinder", 1.0, 0.75, 0, 0.1, 1.0, 0.1, 0, 0, H, "#2a2a20"),
    P("box", 0, -0.05, 0, 2.6, 0.25, 1.4, 0, 0, 0, "#222222"),
  ]},
  { name: "Helicopter", category: "Vehicles", realSize: 12.0, parts: [
    P("sphere", 0, 0.4, 0, 0.7, 0.7, 0.7, 0, 0, 0, BLUE),
    P("cylinder", -1.0, 0.5, 0, 0.15, 1.2, 0.15, 0, 0, H, BLUE),
    P("box", -1.6, 0.6, 0, 0.1, 0.4, 0.3, 0, 0, 0, "#1e3a8a"),
    P("box", 0, 1.0, 0, 3.0, 0.05, 0.1, 0, 0, 0, "#111111"),
    P("cylinder", 0, 0.95, 0, 0.1, 0.15, 0.1, 0, 0, 0, "#111111"),
    P("box", -1.6, 0.5, 0, 0.1, 0.05, 0.8, 0, 0, 0, "#111111"),
    P("box", 0, -0.2, 0.4, 1.4, 0.1, 0.1, 0, 0, 0, "#222222"),
    P("box", 0, -0.2, -0.4, 1.4, 0.1, 0.1, 0, 0, 0, "#222222"),
  ]},

  // ---- Animals ----
  { name: "Dog", category: "Animals", realSize: 0.6, parts: [
    P("box", 0, 0.45, 0, 0.9, 0.4, 0.4, 0, 0, 0, BROWN),
    P("box", 0.5, 0.6, 0, 0.36, 0.36, 0.32, 0, 0, 0, BROWN),
    P("cylinder", 0.28, 0.18, 0.14, 0.09, 0.22, 0.09, 0, 0, 0, BROWN),
    P("cylinder", -0.28, 0.18, 0.14, 0.09, 0.22, 0.09, 0, 0, 0, BROWN),
    P("cylinder", 0.28, 0.18, -0.14, 0.09, 0.22, 0.09, 0, 0, 0, BROWN),
    P("cylinder", -0.28, 0.18, -0.14, 0.09, 0.22, 0.09, 0, 0, 0, BROWN),
    P("cylinder", -0.5, 0.55, 0, 0.06, 0.28, 0.06, 0, 0, H, BROWN),
  ]},
  { name: "Cat", category: "Animals", realSize: 0.35, parts: [
    P("box", 0, 0.28, 0, 0.6, 0.26, 0.26, 0, 0, 0, ORANGE),
    P("box", 0.36, 0.38, 0, 0.24, 0.24, 0.22, 0, 0, 0, ORANGE),
    P("cylinder", 0.18, 0.12, 0.1, 0.06, 0.16, 0.06, 0, 0, 0, ORANGE),
    P("cylinder", -0.18, 0.12, 0.1, 0.06, 0.16, 0.06, 0, 0, 0, ORANGE),
    P("cylinder", 0.18, 0.12, -0.1, 0.06, 0.16, 0.06, 0, 0, 0, ORANGE),
    P("cylinder", -0.18, 0.12, -0.1, 0.06, 0.16, 0.06, 0, 0, 0, ORANGE),
    P("cone", 0.3, 0.55, 0.05, 0.07, 0.12, 0.07, 0, 0, 0, ORANGE),
    P("cone", 0.3, 0.55, -0.05, 0.07, 0.12, 0.07, 0, 0, 0, ORANGE),
  ]},
  { name: "Horse", category: "Animals", realSize: 1.8, parts: [
    P("box", 0, 0.7, 0, 1.4, 0.6, 0.5, 0, 0, 0, BROWN),
    P("box", 0.75, 1.1, 0, 0.3, 0.8, 0.32, 0.25, 0, 0, BROWN),
    P("box", 0.95, 1.5, 0, 0.4, 0.35, 0.34, 0, 0, 0, BROWN),
    P("cylinder", 0.5, 0.3, 0.2, 0.12, 0.6, 0.12, 0, 0, 0, BROWN),
    P("cylinder", -0.5, 0.3, 0.2, 0.12, 0.6, 0.12, 0, 0, 0, BROWN),
    P("cylinder", 0.5, 0.3, -0.2, 0.12, 0.6, 0.12, 0, 0, 0, BROWN),
    P("cylinder", -0.5, 0.3, -0.2, 0.12, 0.6, 0.12, 0, 0, 0, BROWN),
    P("cylinder", -0.8, 0.9, 0, 0.06, 0.6, 0.06, 0, 0, 0, "#3a2a1a"),
  ]},
  { name: "Bird", category: "Animals", realSize: 0.2, parts: [
    P("sphere", 0, 0.3, 0, 0.4, 0.35, 0.5, 0, 0, 0, BLUE),
    P("sphere", 0.2, 0.55, 0, 0.28, 0.28, 0.28, 0, 0, 0, BLUE),
    P("cone", 0.4, 0.55, 0, 0.06, 0.16, 0.06, 0, 0, -H, ORANGE),
    P("box", -0.1, 0.3, 0.28, 0.5, 0.04, 0.2, 0, 0, 0, BLUE),
    P("box", -0.1, 0.3, -0.28, 0.5, 0.04, 0.2, 0, 0, 0, BLUE),
  ]},
  { name: "Fish", category: "Animals", realSize: 0.3, parts: [
    P("sphere", 0, 0, 0, 0.6, 0.4, 0.3, 0, 0, 0, ORANGE),
    P("cone", -0.5, 0, 0, 0.3, 0.4, 0.3, 0, 0, H, ORANGE),
    P("sphere", 0.35, 0.1, 0.18, 0.06, 0.06, 0.06, 0, 0, 0, "#ffffff"),
  ]},
  { name: "Rabbit", category: "Animals", realSize: 0.3, parts: [
    P("box", 0, 0.3, 0, 0.5, 0.4, 0.35, 0, 0, 0, GREY),
    P("box", 0.3, 0.45, 0, 0.26, 0.26, 0.24, 0, 0, 0, GREY),
    P("box", 0.3, 0.75, 0.04, 0.07, 0.3, 0.05, 0, 0, 0, GREY),
    P("box", 0.3, 0.75, -0.04, 0.07, 0.3, 0.05, 0, 0, 0, GREY),
    P("cylinder", 0.15, 0.12, 0.1, 0.07, 0.18, 0.07, 0, 0, 0, GREY),
    P("cylinder", -0.15, 0.12, 0.1, 0.07, 0.18, 0.07, 0, 0, 0, GREY),
    P("cylinder", 0.15, 0.12, -0.1, 0.07, 0.18, 0.07, 0, 0, 0, GREY),
    P("cylinder", -0.15, 0.12, -0.1, 0.07, 0.18, 0.07, 0, 0, 0, GREY),
  ]},

  // ---- Objects ----
  { name: "Chair", category: "Objects", realSize: 0.9, parts: [
    P("box", 0, 0.45, 0, 0.5, 0.08, 0.5, 0, 0, 0, WOOD),
    P("box", 0, 0.75, -0.22, 0.5, 0.5, 0.08, 0, 0, 0, WOOD),
    P("box", 0.22, 0.22, 0.22, 0.08, 0.45, 0.08, 0, 0, 0, WOOD),
    P("box", -0.22, 0.22, 0.22, 0.08, 0.45, 0.08, 0, 0, 0, WOOD),
    P("box", 0.22, 0.22, -0.22, 0.08, 0.45, 0.08, 0, 0, 0, WOOD),
    P("box", -0.22, 0.22, -0.22, 0.08, 0.45, 0.08, 0, 0, 0, WOOD),
  ]},
  { name: "Table", category: "Objects", realSize: 1.0, parts: [
    P("box", 0, 0.7, 0, 1.4, 0.1, 0.9, 0, 0, 0, WOOD),
    P("box", 0.6, 0.35, 0.35, 0.1, 0.7, 0.1, 0, 0, 0, WOOD),
    P("box", -0.6, 0.35, 0.35, 0.1, 0.7, 0.1, 0, 0, 0, WOOD),
    P("box", 0.6, 0.35, -0.35, 0.1, 0.7, 0.1, 0, 0, 0, WOOD),
    P("box", -0.6, 0.35, -0.35, 0.1, 0.7, 0.1, 0, 0, 0, WOOD),
  ]},
  { name: "Mug", category: "Objects", realSize: 0.1, parts: [
    P("cylinder", 0, 0.25, 0, 0.32, 0.5, 0.32, 0, 0, 0, WHITE),
    P("torus", 0.42, 0.25, 0, 0.18, 0.18, 0.18, 0, H, 0, WHITE),
  ]},
  { name: "House", category: "Objects", realSize: 8.0, parts: [
    P("box", 0, 1.0, 0, 2.0, 2.0, 1.6, 0, 0, 0, "#d9c9a8"),
    P("cone", 0, 2.4, 0, 1.5, 1.2, 1.5, 0, 0, 0, RED),
    P("box", 0, 0.5, 0.8, 0.4, 0.9, 0.05, 0, 0, 0, WOOD),
    P("box", -0.6, 1.2, 0.8, 0.4, 0.4, 0.05, 0, 0, 0, BLUE),
    P("box", 0.6, 1.2, 0.8, 0.4, 0.4, 0.05, 0, 0, 0, BLUE),
  ]},
  { name: "Tree", category: "Objects", realSize: 6.0, parts: [
    P("cylinder", 0, 0.8, 0, 0.2, 1.6, 0.2, 0, 0, 0, "#5a3a1a"),
    P("sphere", 0, 2.0, 0, 1.2, 1.2, 1.2, 0, 0, 0, GREEN),
    P("sphere", 0.6, 1.6, 0.3, 0.8, 0.8, 0.8, 0, 0, 0, GREEN),
    P("sphere", -0.5, 1.7, -0.2, 0.8, 0.8, 0.8, 0, 0, 0, GREEN),
  ]},
];
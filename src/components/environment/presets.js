export const VEHICLES = {
  rocket: {
    label: "Rocket",
    icon: "Rocket",
    category: "launch",
    defaults: { thrust: 80, mass: 5, drag: 0.3, lift: 0, fuel: 6 },
  },
  missile: {
    label: "Missile",
    icon: "Crosshair",
    category: "launch",
    defaults: { thrust: 60, mass: 2, drag: 0.25, lift: 0.1, fuel: 4 },
  },
  jet: {
    label: "Jet",
    icon: "Plane",
    category: "winged",
    defaults: { thrust: 50, mass: 8, drag: 0.4, lift: 1.4, fuel: 10 },
  },
  plane: {
    label: "Plane",
    icon: "Plane",
    category: "winged",
    defaults: { thrust: 35, mass: 6, drag: 0.5, lift: 1.6, fuel: 12 },
  },
  helicopter: {
    label: "Helicopter",
    icon: "Wind",
    category: "rotor",
    defaults: { thrust: 65, mass: 6, drag: 0.6, lift: 0, fuel: 15 },
  },
  car: {
    label: "Car",
    icon: "Car",
    category: "ground",
    defaults: { thrust: 28, mass: 10, drag: 0.5, lift: 0, fuel: 20 },
  },
  tank: {
    label: "Tank",
    icon: "Truck",
    category: "ground",
    defaults: { thrust: 22, mass: 40, drag: 0.9, lift: 0, fuel: 30 },
  },
};

export const ENVIRONMENTS = {
  earth: { label: "Earth", gravity: 9.8, atmosphere: 1.0, temperature: 15, wind: 0, bgColor: "#0a1a3a", ground: "#1a2a1a" },
  mars: { label: "Mars", gravity: 3.7, atmosphere: 0.02, temperature: -60, wind: 0, bgColor: "#2a1208", ground: "#3a1a0a" },
  moon: { label: "Moon", gravity: 1.6, atmosphere: 0, temperature: -100, wind: 0, bgColor: "#0a0a14", ground: "#2a2a30" },
  venus: { label: "Venus", gravity: 8.9, atmosphere: 3.0, temperature: 460, wind: 0, bgColor: "#2a1a08", ground: "#3a2a1a" },
  space: { label: "Vacuum", gravity: 0, atmosphere: 0, temperature: -270, wind: 0, bgColor: "#000010", ground: "#0a0a14" },
  custom: { label: "Custom", gravity: 9.8, atmosphere: 1.0, temperature: 15, wind: 0, bgColor: "#080B14", ground: "#1a2238" },
};

export const DEFAULT_VARIABLES = (envKey) => {
  const e = ENVIRONMENTS[envKey] || ENVIRONMENTS.earth;
  return {
    gravity: e.gravity,
    atmosphere: e.atmosphere,
    temperature: e.temperature,
    wind: e.wind,
    timeScale: 1,
    bgColor: e.bgColor,
    groundColor: e.ground,
  };
};

// Ground-vehicle terrain types: visual color + height field + surface friction.
export const TERRAINS = {
  flat: { label: "Plains", color: "#1a2a1a", friction: 1.0 },
  hills: { label: "Hills", color: "#2a3a1a", friction: 1.0 },
  desert: { label: "Desert", color: "#3a2a0a", friction: 1.3 },
  ice: { label: "Ice", color: "#9ab4c4", friction: 0.4 },
  mountain: { label: "Mountain", color: "#3a3030", friction: 1.2 },
};

// Climate conditions: fog, wind, and grip (traction) for ground vehicles.
export const CLIMATES = {
  clear: { label: "Clear", fogNear: 140, fogFar: 220, fogColor: "#080B14", wind: 0, grip: 1.0 },
  rain: { label: "Rain", fogNear: 60, fogFar: 130, fogColor: "#0a1018", wind: 2, grip: 0.7 },
  snow: { label: "Snow", fogNear: 40, fogFar: 100, fogColor: "#1a2028", wind: 3, grip: 0.5 },
  storm: { label: "Storm", fogNear: 25, fogFar: 70, fogColor: "#05070d", wind: 8, grip: 0.6 },
  fog: { label: "Fog", fogNear: 15, fogFar: 50, fogColor: "#12161e", wind: 0, grip: 1.0 },
};

// Per-run goals for ground vehicles. Checkpoints are gates the driver must weave through.
export const GROUND_GOALS = {
  slalom: { label: "Slalom", checkpoints: [{ x: 30, z: 12 }, { x: 55, z: -14 }, { x: 80, z: 12 }] },
  sprint: { label: "Sprint", checkpoints: [] },
  endurance: { label: "Endurance", checkpoints: [] },
};

// Terrain height field (meters) at a world (x, z) position in meters.
export const terrainHeight = (x, z, key) => {
  switch (key) {
    case "hills": return 4 * Math.sin(x * 0.08) * Math.cos(z * 0.07) + 2 * Math.sin(x * 0.13);
    case "desert": return 5 * Math.sin(x * 0.06) + 1.5 * Math.sin(z * 0.09);
    case "mountain": return 8 * Math.abs(Math.sin(x * 0.05)) * Math.cos(z * 0.04) + 4 * Math.sin(x * 0.12);
    case "ice": return 0.5 * Math.sin(x * 0.1);
    default: return 0;
  }
};

export const DEFAULT_GROUND_CONFIG = (vehicleType) => {
  if (vehicleType === "tank") return { terrain: "mountain", climate: "clear", goal: "sprint" };
  return { terrain: "flat", climate: "clear", goal: "slalom" };
};
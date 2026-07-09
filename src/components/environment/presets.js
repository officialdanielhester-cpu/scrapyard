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
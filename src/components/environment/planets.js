// Planet data for the interplanetary mission mode.
// orbitAU: semi-major axis in astronomical units (real-world).
// gravity / atmosphere: real-world surface values (m/s^2 and relative Earth pressure).
export const PLANETS = [
  { id: "mercury", label: "Mercury", gravity: 3.7, atmosphere: 0, orbitAU: 0.39, color: "#9c8b7a", radius: 16 },
  { id: "venus", label: "Venus", gravity: 8.9, atmosphere: 3.0, orbitAU: 0.72, color: "#e0b06a", radius: 24 },
  { id: "earth", label: "Earth", gravity: 9.8, atmosphere: 1.0, orbitAU: 1.0, color: "#4f8cf9", radius: 26 },
  { id: "moon", label: "Moon", gravity: 1.6, atmosphere: 0, orbitAU: 0.00257, color: "#c9c9d0", radius: 11, parent: "earth" },
  { id: "mars", label: "Mars", gravity: 3.7, atmosphere: 0.02, orbitAU: 1.52, color: "#d14a2a", radius: 19 },
  { id: "jupiter", label: "Jupiter", gravity: 24.8, atmosphere: 1.0, orbitAU: 5.2, color: "#d8a878", radius: 42 },
];

// The Moon orbits Earth — treat its effective orbit as Earth's for interplanetary distance.
export const effOrbit = (p) => (p && p.parent === "earth" ? 1.0 : p ? p.orbitAU : 0);

export const distanceAU = (a, b) => Math.abs(effOrbit(a) - effOrbit(b));

export const AU_TO_KM = 149_600_000;

// Tuning constant: maps AU distance into the sim's abstract delta-v score space.
export const MISSION_K = 200;

export const planetById = (id) => PLANETS.find((p) => p.id === id) || PLANETS[2];
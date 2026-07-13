import { Flame, Plane, Cog, Fuel, Triangle, Fan, Shield, Disc, Package, Battery, Satellite, Atom, Wind, Layers } from "lucide-react";
import { VEHICLES } from "@/components/environment/presets";

const G = 9.81;

// Each part carries real, additive physical contributions (SI-scaled to the sim:
// mass in tonnes, thrust in kN, fuel in burn-seconds, lift/drag as coefficients).
// Negative values (e.g. nose cone drag) are intentional.
export const PARTS = [
  { id: "liquid_engine", label: "Liquid Engine", icon: Flame, category: "Propulsion", apply: ["launch", "winged", "rotor"], mass: 1.2, thrust: 220, lift: 0, drag: 0, fuel: 0, note: "Bipropellant, throttleable" },
  { id: "solid_booster", label: "Solid Booster", icon: Flame, category: "Propulsion", apply: ["launch"], mass: 2.5, thrust: 350, lift: 0, drag: 0.05, fuel: 8, note: "High thrust, finite burn" },
  { id: "jet_engine", label: "Jet Engine", icon: Plane, category: "Propulsion", apply: ["winged"], mass: 1.5, thrust: 80, lift: 0, drag: 0.05, fuel: 0, note: "Air-breathing turbofan" },
  { id: "turboshaft", label: "Turboshaft", icon: Cog, category: "Propulsion", apply: ["rotor"], mass: 1.8, thrust: 120, lift: 0, drag: 0.05, fuel: 0, note: "Drives rotor system" },
  { id: "fuel_tank", label: "Fuel Tank", icon: Fuel, category: "Fuel", apply: ["launch", "winged", "rotor", "ground"], mass: 1.0, thrust: 0, lift: 0, drag: 0.02, fuel: 10, note: "Burn endurance" },
  { id: "wing", label: "Wing", icon: Triangle, category: "Aero", apply: ["winged"], mass: 0.6, thrust: 0, lift: 0.8, drag: 0.15, fuel: 0, note: "Generates lift" },
  { id: "canard", label: "Canard", icon: Triangle, category: "Aero", apply: ["winged"], mass: 0.2, thrust: 0, lift: 0.3, drag: 0.06, fuel: 0, note: "Fore-plane lift" },
  { id: "fin", label: "Fin", icon: Triangle, category: "Aero", apply: ["launch"], mass: 0.15, thrust: 0, lift: 0.05, drag: 0.08, fuel: 0, note: "Stabilizes ascent" },
  { id: "rotor_blade", label: "Rotor Blade", icon: Fan, category: "Aero", apply: ["rotor"], mass: 0.4, thrust: 0, lift: 0.6, drag: 0.2, fuel: 0, note: "Rotating lift surface" },
  { id: "nose_cone", label: "Nose Cone", icon: Triangle, category: "Aero", apply: ["launch", "winged"], mass: 0.1, thrust: 0, lift: 0, drag: -0.12, fuel: 0, note: "Reduces drag" },
  { id: "heat_shield", label: "Heat Shield", icon: Shield, category: "Aero", apply: ["launch"], mass: 0.5, thrust: 0, lift: 0, drag: 0.3, fuel: 0, note: "Reentry protection" },
  { id: "wheel", label: "Wheel Gear", icon: Disc, category: "Ground", apply: ["ground", "winged"], mass: 0.3, thrust: 0, lift: 0, drag: 0.05, fuel: 0, note: "Landing assembly" },
  { id: "payload", label: "Payload", icon: Package, category: "Utility", apply: ["launch", "winged", "rotor", "ground"], mass: 2.0, thrust: 0, lift: 0, drag: 0.02, fuel: 0, note: "Cargo mass" },
  { id: "battery", label: "Battery Pack", icon: Battery, category: "Utility", apply: ["ground", "rotor"], mass: 0.8, thrust: 0, lift: 0, drag: 0.02, fuel: 0, note: "Electric storage" },
  // Payload variants — pick a size & shape
  { id: "payload_capsule", label: "Crew Capsule", icon: Package, category: "Utility", apply: ["launch", "winged", "rotor", "ground"], mass: 1.2, thrust: 0, lift: 0, drag: 0.05, fuel: 0, note: "Crew compartment" },
  { id: "payload_cargo", label: "Cargo Bay", icon: Package, category: "Utility", apply: ["launch", "winged", "rotor", "ground"], mass: 2.5, thrust: 0, lift: 0, drag: 0.04, fuel: 0, note: "Pressurized cargo" },
  { id: "payload_sat", label: "Satellite", icon: Satellite, category: "Utility", apply: ["launch", "winged"], mass: 1.8, thrust: 0, lift: 0, drag: 0.07, fuel: 0, note: "Orbital payload" },
  // Propulsion
  { id: "ion_engine", label: "Ion Thruster", icon: Atom, category: "Propulsion", apply: ["launch"], mass: 0.3, thrust: 6, lift: 0, drag: 0, fuel: 25, note: "High-Isp electric" },
  { id: "nuclear_engine", label: "Nuclear Engine", icon: Flame, category: "Propulsion", apply: ["launch"], mass: 2.0, thrust: 150, lift: 0, drag: 0.02, fuel: 12, note: "Thermal nuclear" },
  { id: "ramjet", label: "Ramjet", icon: Wind, category: "Propulsion", apply: ["winged"], mass: 1.2, thrust: 110, lift: 0, drag: 0.08, fuel: 6, note: "Supersonic air-breather" },
  // Aero
  { id: "delta_wing", label: "Delta Wing", icon: Triangle, category: "Aero", apply: ["winged"], mass: 0.8, thrust: 0, lift: 1.1, drag: 0.18, fuel: 0, note: "High-lift planform" },
  { id: "swept_wing", label: "Swept Wing", icon: Triangle, category: "Aero", apply: ["winged"], mass: 0.7, thrust: 0, lift: 0.9, drag: 0.12, fuel: 0, note: "Low-drag swept" },
  { id: "grid_fin", label: "Grid Fin", icon: Layers, category: "Aero", apply: ["launch"], mass: 0.3, thrust: 0, lift: 0.05, drag: 0.18, fuel: 0, note: "Grid control surface" },
  { id: "parachute", label: "Descent Chute", icon: Wind, category: "Aero", apply: ["launch"], mass: 0.2, thrust: 0, lift: 0, drag: 0.6, fuel: 0, note: "Descent drag canopy" },
  { id: "landing_legs", label: "Landing Legs", icon: Triangle, category: "Aero", apply: ["launch", "winged"], mass: 0.4, thrust: 0, lift: 0, drag: 0.05, fuel: 0, note: "Gear legs" },
  // Fuel
  { id: "fuel_tank_large", label: "Large Tank", icon: Fuel, category: "Fuel", apply: ["launch", "winged", "rotor"], mass: 2.2, thrust: 0, lift: 0, drag: 0.04, fuel: 22, note: "Extended burn" },
  // Ground
  { id: "treads", label: "Tank Treads", icon: Disc, category: "Ground", apply: ["ground"], mass: 1.5, thrust: 0, lift: 0, drag: 0.12, fuel: 0, note: "Tracked traction" },
  { id: "offroad_tire", label: "Off-road Tire", icon: Disc, category: "Ground", apply: ["ground", "winged"], mass: 0.4, thrust: 0, lift: 0, drag: 0.06, fuel: 0, note: "All-terrain grip" },
  { id: "spoiler", label: "Spoiler", icon: Triangle, category: "Aero", apply: ["ground", "winged"], mass: 0.2, thrust: 0, lift: 0, drag: 0.1, fuel: 0, note: "Downforce" },
];

export const PARTS_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p]));

export function applicableParts(vehicleType) {
  const cat = VEHICLES[vehicleType]?.category;
  return PARTS.filter((p) => p.apply.includes(cat));
}

// Accurate physics: totals are exact sums; derived metrics use real formulas.
// TWR = thrust / (mass * g). Apogee from kinematics (burn + coast) with a drag
// loss factor. Top speed from thrust=drag*v^2 equilibrium. Stall from lift=weight.
export function computeStats(vehicleType, appliedParts) {
  const v = VEHICLES[vehicleType] || VEHICLES.rocket;
  const base = v.defaults;
  let mass = base.mass;
  let thrust = base.thrust;
  let lift = base.lift;
  let drag = base.drag;
  let fuel = base.fuel;
  for (const inst of appliedParts || []) {
    const p = PARTS_BY_ID[inst.type];
    if (!p) continue;
    mass += p.mass;
    thrust += p.thrust || 0;
    lift += p.lift || 0;
    drag += p.drag || 0;
    fuel += p.fuel || 0;
  }
  mass = Math.max(0.1, mass);
  drag = Math.max(0.01, drag);
  lift = Math.max(0, lift);

  const cat = v.category;
  const twr = thrust / (mass * G);
  const burnTime = fuel;
  const a = thrust / mass - G; // net vertical acceleration (m/s^2)

  let apogee = 0;
  if (cat === "launch" && a > 0) {
    const vb = a * burnTime;
    const hBurn = 0.5 * a * burnTime * burnTime;
    const hCoast = (vb * vb) / (2 * G);
    apogee = (hBurn + hCoast) * Math.max(0.4, 1 - drag * 0.2);
  }

  let topSpeed = 0;
  if (cat === "winged" || cat === "ground") {
    topSpeed = Math.sqrt(thrust / drag);
  }

  let stallSpeed = 0;
  if (cat === "winged" && lift > 0) {
    stallSpeed = Math.sqrt((mass * G) / lift);
  }

  let verdict = "Not flight-ready";
  let ready = false;
  if (cat === "launch") {
    ready = twr > 1;
    verdict = ready ? "Liftoff capable" : "Insufficient thrust";
  } else if (cat === "winged") {
    ready = thrust > 0 && lift > 0 && stallSpeed < topSpeed;
    verdict = ready ? "Flight capable" : lift <= 0 ? "Needs lift surface" : "Lift insufficient";
  } else if (cat === "rotor") {
    ready = twr > 1;
    verdict = ready ? "Hover capable" : "Insufficient thrust";
  } else if (cat === "ground") {
    ready = thrust > 0;
    verdict = ready ? "Driveable" : "No propulsion";
  }

  return { mass, thrust, lift, drag, fuel, twr, burnTime, apogee, topSpeed, stallSpeed, verdict, ready, category: cat };
}

// Convert legacy {type, qty} parts (or raw instances) into placed instances.
export function normalizeInstances(parts) {
  if (!Array.isArray(parts)) return [];
  if (parts.length && parts[0].iid) {
    return parts.map((p) => ({
      iid: p.iid,
      type: p.type,
      x: p.x ?? 300,
      y: p.y ?? 240,
      scale: p.scale ?? 1,
      rot: p.rot ?? 0,
      color: p.color ?? "",
    }));
  }
  const out = [];
  let y = 120;
  parts.forEach((ap) => {
    const q = Math.max(1, ap.qty || 1);
    for (let i = 0; i < q; i++) {
      out.push({ iid: `i-${Math.random().toString(36).slice(2, 9)}`, type: ap.type, x: 300, y, scale: 1, rot: 0, color: "" });
      y += 44;
    }
  });
  return out;
}
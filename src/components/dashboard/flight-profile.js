import { VEHICLES } from "@/components/environment/presets";

// Mirrors SimulationCanvas physics so charted profiles match the 3D flight.
const ARENA_M = 160;
const CEILING_M = 320;
const DT = 0.05;
const SAMPLE_EVERY = 5; // ~0.25s resolution
const MAX_T = 60;

const num = (x, d) => {
  const n = x == null ? d : Number(x);
  return Number.isFinite(n) ? n : d;
};

export function computeProfile(exp) {
  const v = VEHICLES[exp.vehicle_type] || VEHICLES.rocket;
  const cat = v.category;
  const p = {
    thrust: num(exp.thrust, 0),
    mass: Math.max(0.1, num(exp.mass, 1)),
    drag: num(exp.drag, 0),
    lift: num(exp.lift, 0),
    fuel: num(exp.fuel, 0),
  };
  const g = num(exp.gravity, 9.8);
  const atm = num(exp.atmosphere, 1);
  const wind = num(exp.wind, 0);
  const timeScale = num(exp.timeScale, 1) || 1;

  let pos = { x: 0, y: 0 };
  let vel = { x: cat === "winged" ? 8 : 0, y: 0 };
  let fuel = p.fuel;
  let flightTime = 0;
  let landed = false;
  let stepsSinceLanded = 0;
  const samples = [];
  const dt = DT * timeScale;

  let step = 0;
  while (flightTime < MAX_T && stepsSinceLanded < 8) {
    if (!landed) {
      const thrustMag = fuel > 0 ? p.thrust : 0;
      const speed = Math.hypot(vel.x, vel.y);
      let ax = 0;
      let ay = 0;

      if (cat === "launch") {
        const tdir = exp.vehicle_type === "missile" ? { x: 0.12, y: 1 } : { x: 0, y: 1 };
        const tl = Math.hypot(tdir.x, tdir.y) || 1;
        ax += (tdir.x / tl) * (thrustMag / p.mass);
        ay += (tdir.y / tl) * (thrustMag / p.mass);
        ay -= g;
        ax += wind * 0.04;
        if (speed > 0) {
          const d = -(p.drag * atm * speed) / p.mass;
          ax += vel.x * d;
          ay += vel.y * d;
        }
      } else if (cat === "winged") {
        const lift = p.lift * atm * vel.x * vel.x;
        ax = thrustMag / p.mass;
        ay = lift / p.mass - g;
        ax += wind * 0.03;
        if (speed > 0) {
          const d = -(p.drag * atm * speed) / p.mass;
          ax += vel.x * d;
          ay += vel.y * d;
        }
      } else if (cat === "rotor") {
        ay = thrustMag / p.mass - g;
        ax += wind * 0.05;
        if (speed > 0) {
          const d = -(p.drag * atm * speed) / p.mass;
          ax += vel.x * d;
          ay += vel.y * d;
        }
      } else {
        ax = thrustMag / p.mass;
        ax -= 0.02 * g * Math.sign(vel.x || 1);
        ax -= (p.drag * atm * vel.x * Math.abs(vel.x)) / p.mass;
        ax += wind * 0.02;
      }

      vel.x += ax * dt;
      vel.y += ay * dt;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      if (fuel > 0) fuel = Math.max(0, fuel - dt);
      flightTime += dt;

      if (cat !== "ground" && pos.y <= 0 && vel.y < 0) {
        pos.y = 0;
        if (cat === "winged" || cat === "launch") {
          vel.x = 0;
          vel.y = 0;
          landed = true;
        } else {
          vel.y = 0;
        }
      }
      if (cat === "ground") {
        pos.y = 0;
        if (Math.abs(vel.x) < 0.2 && thrustMag === 0) landed = true;
      }
      if (pos.x > ARENA_M) { pos.x = ARENA_M; vel.x = 0; landed = true; }
      if (pos.x < -ARENA_M) { pos.x = -ARENA_M; vel.x = 0; landed = true; }
      if (pos.y > CEILING_M) { pos.y = CEILING_M; if (vel.y > 0) vel.y = 0; }
    } else {
      stepsSinceLanded++;
    }

    if (step % SAMPLE_EVERY === 0) {
      samples.push({
        t: Number(flightTime.toFixed(2)),
        altitude: Number(pos.y.toFixed(1)),
        speed: Number(Math.hypot(vel.x, vel.y).toFixed(1)),
        fuel: Number(fuel.toFixed(2)),
      });
    }
    step++;
  }

  const maxAltitude = samples.length ? Math.max(...samples.map((s) => s.altitude)) : 0;
  const maxSpeed = samples.length ? Math.max(...samples.map((s) => s.speed)) : 0;
  return { samples, category: cat, maxAltitude, maxSpeed };
}
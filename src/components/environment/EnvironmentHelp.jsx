import React from "react";
import {
  Rocket,
  Orbit,
  HelpCircle,
  Play,
  RotateCcw,
  Circle,
  Gauge,
  ZoomIn,
  Navigation,
  FlaskConical,
  Keyboard,
  Globe,
  SlidersHorizontal,
  Car,
  Target,
  Hammer,
} from "lucide-react";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-border/50 p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60">
          <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="font-heading text-base font-bold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function Bullet({ children }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
      <p>{children}</p>
    </div>
  );
}

export default function EnvironmentHelp() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">Help</h2>
        </div>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          How the Playground works
        </p>
      </div>

      <Section icon={Rocket} title="Overview">
        <p>
          The Playground is a real-time aerospace simulation bay. Pick a vehicle and a world,
          tune the physics, then launch and watch how thrust, drag, lift, gravity, and atmosphere
          interact. Record a run to log its peak results, or plot an interplanetary transfer.
        </p>
      </Section>

      <Section icon={Orbit} title="Views (top toggle)">
        <Bullet><strong>Launch Pad</strong> — the 3D flight simulator with a live viewport, metrics, and engineering controls.</Bullet>
        <Bullet><strong>Planet Transfer</strong> — evaluates and animates a trajectory between two planets based on your vehicle's capability.</Bullet>
        <Bullet><strong>Help</strong> — this screen.</Bullet>
      </Section>

      <Section icon={Play} title="Global controls (top right)">
        <Bullet><strong>Play / Pause</strong> — freeze or resume the physics loop without resetting the vehicle.</Bullet>
        <Bullet><strong>Launch</strong> — returns the vehicle to the pad and starts a fresh flight.</Bullet>
        <Bullet><strong>Reset</strong> — stops the run and places the vehicle back at its start position.</Bullet>
        <Bullet><strong>Record / Stop &amp; Save</strong> — while recording, peak metrics (apogee, max speed, distance, flight time) are captured. Press Stop &amp; Save to write the run to Test Logs.</Bullet>
      </Section>

      <Section icon={Gauge} title="The viewport (Launch Pad)">
        <Bullet><strong>Status pill (top-left)</strong> — Ready, In Flight, Paused, Landed, Goal Reached, or Recording.</Bullet>
        <Bullet><strong>Vehicle · World pill (top-right)</strong> — your current selections.</Bullet>
        <Bullet><strong>Zoom buttons (right)</strong> — zoom the camera in and out, or scroll over the viewport.</Bullet>
        <Bullet><strong>Steering (bottom-center, flyers only)</strong> — hold the buttons or the ↑ / ↓ arrow keys to pitch the thrust/lift vector and curve the trajectory.</Bullet>
        <Bullet><strong>Fuel gauge (bottom)</strong> — remaining burn time in seconds; thrust cuts off when it reaches zero.</Bullet>
      </Section>

      <Section icon={Navigation} title="Live metrics (under the viewport)">
        <p>Flyers (rocket, missile, jet, plane, helicopter) show:</p>
        <Bullet>Altitude, Velocity, Max Speed, Distance, Flight Time, and Acceleration.</Bullet>
        <p>Ground vehicles (car, tank) show:</p>
        <Bullet>Distance, Velocity, Max Speed, To Goal (meters to the finish line), Flight Time, and Acceleration.</Bullet>
      </Section>

      <Section icon={SlidersHorizontal} title="Side panel">
        <Bullet><strong>Vehicle Selector</strong> — choose Rocket, Missile, Jet, Plane, Helicopter, Car, or Tank. Each sets baseline thrust, mass, drag, lift, and fuel.</Bullet>
        <Bullet><strong>Environment Selector</strong> — Earth, Mars, Moon, Venus, Vacuum, or Custom. Each sets gravity, atmosphere, temperature, wind, and ground color.</Bullet>
        <Bullet><strong>Engineering Controls</strong> — fine-tune thrust, mass, drag, lift, fuel, and world variables (gravity, atmosphere, temperature, wind, time scale, background). Time Scale speeds up or slows the entire simulation.</Bullet>
      </Section>

      <Section icon={Target} title="Planet Transfer">
        <p>
          Evaluates whether your vehicle can reach a destination planet and animates the transfer arc.
          Feasibility is based on your vehicle's thrust, mass, fuel, lift, and drag against the distance,
          gravity, and atmosphere of the target world. Pick an origin and destination, then launch the mission.
        </p>
      </Section>

      <Section icon={FlaskConical} title="Test Logs">
        <p>
          Recorded runs appear here as cards showing the vehicle, world, key parameters, and peak results
          (apogee, max velocity, distance, duration). Delete a log with the trash icon. Logs persist across sessions.
        </p>
      </Section>

      <Section icon={Hammer} title="Importing from the Workshop">
        <p>
          In the Workshop, use <strong>Import to Playground</strong> on a saved build to send its parts and
          physics here. The build's thrust, mass, drag, lift, and fuel load onto the pad automatically, and the
          vehicle resets ready for launch.
        </p>
      </Section>

      <Section icon={Keyboard} title="Keyboard shortcuts">
        <Bullet><strong>↑ / ↓</strong> — steer (pitch up / down) during flight (flyers only).</Bullet>
        <Bullet><strong>Scroll</strong> — zoom the viewport in and out.</Bullet>
      </Section>

      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        <Car className="h-3 w-3" /> Tip: ground vehicles drive toward the finish-line gate at 120 m — watch the To Goal metric.
      </p>
    </div>
  );
}
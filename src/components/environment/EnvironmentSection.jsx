import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Rocket, RotateCcw, Circle, Square, Box as BoxIcon, Trash2, FlaskConical, Activity, Loader2, Gauge, ZoomIn, ZoomOut, Orbit, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { VEHICLES, ENVIRONMENTS, DEFAULT_VARIABLES } from "@/components/environment/presets";
import SimulationCanvas from "@/components/environment/SimulationCanvas";
import Sim2DView from "@/components/environment/Sim2DView";
import VehicleSelector from "@/components/environment/VehicleSelector";
import EnvironmentSelector from "@/components/environment/EnvironmentSelector";
import EngineeringControls from "@/components/environment/EngineeringControls";
import PlanetMission from "@/components/environment/PlanetMission";
import EnvironmentHelp from "@/components/environment/EnvironmentHelp";
import SteeringControl from "@/components/environment/SteeringControl";

export default function EnvironmentSection({ pendingBuild, onConsumed }) {
  const [vehicleType, setVehicleType] = useState("rocket");
  const [envKey, setEnvKey] = useState("earth");
  const [params, setParams] = useState(VEHICLES.rocket.defaults);
  const [variables, setVariables] = useState(DEFAULT_VARIABLES("earth"));
  const [running, setRunning] = useState(true);
  const [launched, setLaunched] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const steerRef = useRef({ steer: 0 });
  const [view, setView] = useState("pad");
  const [buildInstances, setBuildInstances] = useState(null);
  const [view3D, setView3D] = useState(true);
  const [metrics, setMetrics] = useState({ altitude: 0, velocity: 0, maxSpeed: 0, maxAltitude: 0, distance: 0, flightTime: 0, acceleration: 0, fuel: params.fuel, landed: false, pitch: 0, goalReached: false, goalX: 120 });
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const recordStartRef = useRef(0);
  const accumRef = useRef({ maxAltitude: 0, maxVelocity: 0, distance: 0, flightTime: 0 });

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Experiment.list("-created_date", 50);
      setExperiments(list);
    } catch (e) {
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!pendingBuild) return;
    setVehicleType(pendingBuild.vehicle_type);
    setParams({
      thrust: pendingBuild.thrust,
      mass: pendingBuild.mass,
      drag: pendingBuild.drag,
      lift: pendingBuild.lift,
      fuel: pendingBuild.fuel,
    });
    setBuildInstances(pendingBuild.instances || null);
    setLaunched(false);
    setResetSignal((s) => s + 1);
    onConsumed?.();
  }, [pendingBuild]);

  useEffect(() => {
    if (view !== "pad") return;
    const onDown = (e) => {
      if (e.key === "ArrowUp") { steerRef.current.steer = 1; e.preventDefault(); }
      else if (e.key === "ArrowDown") { steerRef.current.steer = -1; e.preventDefault(); }
    };
    const onUp = (e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") steerRef.current.steer = 0; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      steerRef.current.steer = 0;
    };
  }, [view]);

  const selectVehicle = (type) => {
    setVehicleType(type);
    setParams(VEHICLES[type].defaults);
    setLaunched(false);
    setResetSignal((s) => s + 1);
  };

  const selectEnv = (key) => {
    setEnvKey(key);
    setVariables(DEFAULT_VARIABLES(key));
    setLaunched(false);
    setResetSignal((s) => s + 1);
  };

  const onParam = (key, val) => setParams((prev) => ({ ...prev, [key]: val }));
  const onVariable = (key, val) => setVariables((prev) => ({ ...prev, [key]: val }));

  const handleLaunch = () => {
    setLaunched(false);
    setResetSignal((s) => s + 1);
    setTimeout(() => setLaunched(true), 30);
  };
  const handleReset = () => { setLaunched(false); setResetSignal((s) => s + 1); };

  const handleMetrics = (m) => {
    setMetrics(m);
    if (recording) {
      const a = accumRef.current;
      a.maxAltitude = Math.max(a.maxAltitude, m.maxAltitude);
      a.maxVelocity = Math.max(a.maxVelocity, m.maxSpeed);
      a.distance = Math.max(a.distance, m.distance);
      a.flightTime = Math.max(a.flightTime, m.flightTime);
    }
  };

  const startRecord = () => {
    accumRef.current = { maxAltitude: 0, maxVelocity: 0, distance: 0, flightTime: 0 };
    recordStartRef.current = Date.now();
    setRecording(true);
  };

  const stopRecord = async () => {
    const duration = (Date.now() - (recordStartRef.current || Date.now())) / 1000;
    const a = accumRef.current;
    setRecording(false);
    setSaving(true);
    try {
      await base44.entities.Experiment.create({
        name: `${VEHICLES[vehicleType].label} · ${ENVIRONMENTS[envKey].label}`,
        description: "",
        vehicle_type: vehicleType,
        environment: envKey,
        thrust: params.thrust,
        mass: params.mass,
        drag: params.drag,
        lift: params.lift,
        fuel: params.fuel,
        gravity: variables.gravity,
        atmosphere: variables.atmosphere,
        temperature: variables.temperature,
        wind: variables.wind,
        timeScale: variables.timeScale,
        bgColor: variables.bgColor,
        maxAltitude: Number((a.maxAltitude || 0).toFixed(1)),
        maxVelocity: Number((a.maxVelocity || 0).toFixed(1)),
        distance: Number((a.distance || 0).toFixed(1)),
        flightTime: Number((a.flightTime || 0).toFixed(1)),
        acceleration: Number((metrics.acceleration || 0).toFixed(1)),
        duration: Number(duration.toFixed(1)),
      });
      load();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try { await base44.entities.Experiment.delete(id); load(); } catch (e) {}
  };

  const fuelPct = Math.max(0, Math.min(100, (metrics.fuel / (params.fuel || 1)) * 100));
  const isGround = VEHICLES[vehicleType]?.category === "ground";
  const isFlyer = !isGround;
  const statusLabel = recording
    ? "Recording"
    : !launched
    ? "Ready"
    : metrics.goalReached
    ? "Goal Reached"
    : metrics.landed
    ? "Landed"
    : running
    ? "In Flight"
    : "Paused";

  const metricCards = isGround
    ? [
        { label: "Distance", value: metrics.distance.toFixed(1), unit: "m" },
        { label: "Velocity", value: metrics.velocity.toFixed(1), unit: "m/s" },
        { label: "Max Speed", value: metrics.maxSpeed.toFixed(1), unit: "m/s" },
        { label: "To Goal", value: Math.max(0, (metrics.goalX || 120) - metrics.distance).toFixed(0), unit: "m" },
        { label: "Flight Time", value: metrics.flightTime.toFixed(1), unit: "s" },
        { label: "Accel", value: metrics.acceleration.toFixed(1), unit: "m/s²" },
      ]
    : [
        { label: "Altitude", value: metrics.altitude.toFixed(1), unit: "m" },
        { label: "Velocity", value: metrics.velocity.toFixed(1), unit: "m/s" },
        { label: "Max Speed", value: metrics.maxSpeed.toFixed(1), unit: "m/s" },
        { label: "Distance", value: metrics.distance.toFixed(1), unit: "m" },
        { label: "Flight Time", value: metrics.flightTime.toFixed(1), unit: "s" },
        { label: "Accel", value: metrics.acceleration.toFixed(1), unit: "m/s²" },
      ];

  return (
    <div className="min-h-screen pb-10">
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Playground</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Design · Launch · Test
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border/60 p-0.5">
            <button
              onClick={() => setView("pad")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${view === "pad" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Rocket className="h-3 w-3" strokeWidth={1.5} /> Launch Pad
            </button>
            <button
              onClick={() => setView("mission")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${view === "mission" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Orbit className="h-3 w-3" strokeWidth={1.5} /> Planet Transfer
            </button>
            <button
              onClick={() => setView("help")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${view === "help" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <HelpCircle className="h-3 w-3" strokeWidth={1.5} /> Help
            </button>
          </div>
          <div className="flex rounded-full border border-border/60 p-0.5">
            <button
              onClick={() => setView3D(true)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${view3D ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BoxIcon className="h-3 w-3" strokeWidth={1.5} /> 3D
            </button>
            <button
              onClick={() => setView3D(false)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${!view3D ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Square className="h-3 w-3" strokeWidth={1.5} /> 2D
            </button>
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {running ? <Pause className="h-3.5 w-3.5" strokeWidth={2} /> : <Play className="h-3.5 w-3.5" strokeWidth={2} />}
            {running ? "Pause" : "Play"}
          </button>
          <button
            onClick={handleLaunch}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Rocket className="h-3.5 w-3.5" strokeWidth={2} /> Launch
          </button>
          <button
            onClick={handleReset}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset
          </button>
          {recording ? (
            <button
              onClick={stopRecord}
              disabled={saving}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" strokeWidth={2} />}
              {saving ? "Saving…" : "Stop & Save"}
            </button>
          ) : (
            <button
              onClick={startRecord}
              disabled={saving}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-primary/60 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              <Circle className="h-3 w-3 fill-current" strokeWidth={2} /> Record
            </button>
          )}
        </div>
      </header>

      <div className="px-6 md:px-12">
        {view === "pad" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-3">
            <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border/50 md:h-[540px]">
              {view3D ? (
                <SimulationCanvas
                  vehicleType={vehicleType}
                  params={params}
                  variables={variables}
                  running={running}
                  launched={launched}
                  resetSignal={resetSignal}
                  onMetrics={handleMetrics}
                  zoom={zoom}
                  onZoom={setZoom}
                  steerRef={steerRef}
                  build={buildInstances}
                />
              ) : (
                <Sim2DView build={buildInstances} metrics={metrics} vehicleType={vehicleType} />
              )}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 backdrop-blur">
                <span className={`h-1.5 w-1.5 rounded-full ${recording ? "animate-pulse bg-destructive" : metrics.landed ? "bg-amber-500" : launched ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{statusLabel}</span>
              </div>
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 backdrop-blur">
                <Gauge className="h-3 w-3 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {VEHICLES[vehicleType].label} · {ENVIRONMENTS[envKey].label}
                </span>
              </div>
              <div className="absolute right-4 top-16 flex flex-col gap-1.5">
                <button
                  onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z * 1.18))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              {isFlyer && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
                  <SteeringControl
                    pitchDeg={Math.round(((metrics.pitch || 0) * 180) / Math.PI)}
                    onSteer={(dir) => { steerRef.current.steer = dir; }}
                    onSteerEnd={() => { steerRef.current.steer = 0; }}
                  />
                </div>
              )}
              {/* fuel gauge */}
              <div className="absolute inset-x-4 bottom-4">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Fuel</span>
                  <span>{Math.max(0, metrics.fuel).toFixed(1)}s</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${fuelPct}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
              {metricCards.map((m) => (
                <div key={m.label} className="rounded-xl border border-border/50 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="mt-1 font-heading text-base font-bold text-foreground">
                    {m.value}
                    {m.unit && <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{m.unit}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <VehicleSelector value={vehicleType} onSelect={selectVehicle} />
            <EnvironmentSelector value={envKey} onSelect={selectEnv} />
            <EngineeringControls params={params} onParam={onParam} variables={variables} onVariable={onVariable} envKey={envKey} />
          </div>
        </div>
        ) : view === "mission" ? (
          <PlanetMission params={params} vehicleType={vehicleType} />
        ) : (
          <EnvironmentHelp />
        )}

        {view === "pad" && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Test Logs</h2>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-border/50">
              <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
            </div>
          ) : experiments.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
              <FlaskConical className="h-6 w-6 text-muted-foreground/50" strokeWidth={1} />
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">No test runs recorded</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Press Record, then Launch</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {experiments.map((exp) => (
                <div key={exp.id} className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{exp.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {VEHICLES[exp.vehicle_type]?.label || exp.vehicle_type} · {ENVIRONMENTS[exp.environment]?.label || exp.environment}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(exp.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">Thrust</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.thrust).toFixed(0)} kN</span>
                    <span className="text-muted-foreground">Mass</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.mass).toFixed(0)} t</span>
                    <span className="text-muted-foreground">Gravity</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.gravity).toFixed(1)} m/s²</span>
                    <span className="text-muted-foreground">Atmos</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.atmosphere).toFixed(2)}×</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-border/40 pt-3 text-[11px]">
                    <span className="text-muted-foreground">Apogee</span>
                    <span className="text-right font-mono text-primary">{Number(exp.maxAltitude).toFixed(0)} m</span>
                    <span className="text-muted-foreground">Max V</span>
                    <span className="text-right font-mono text-primary">{Number(exp.maxVelocity).toFixed(0)} m/s</span>
                    <span className="text-muted-foreground">Distance</span>
                    <span className="text-right font-mono text-primary">{Number(exp.distance).toFixed(0)} m</span>
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-right font-mono text-primary">{Number(exp.duration).toFixed(1)} s</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
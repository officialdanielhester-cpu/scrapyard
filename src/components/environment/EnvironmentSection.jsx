import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Circle, Square, RotateCcw, Trash2, FlaskConical, Activity, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SimulationCanvas from "@/components/environment/SimulationCanvas";
import EnvironmentControls from "@/components/environment/EnvironmentControls";

const DEFAULTS = {
  gravity: 9.8,
  friction: 0.3,
  timeScale: 1,
  wind: 0,
  atmosphere: 1,
  temperature: 20,
  specimens: 6,
  bgColor: "#080B14",
};

export default function EnvironmentSection() {
  const [variables, setVariables] = useState(DEFAULTS);
  const [running, setRunning] = useState(true);
  const [recording, setRecording] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [metrics, setMetrics] = useState({ avgSpeed: 0, maxHeight: 0, collisions: 0 });
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const recordStartRef = useRef(0);
  const collisionsAtStartRef = useRef(0);
  const accumRef = useRef({ avgSpeed: 0, maxHeight: 0, samples: 0 });

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

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key, val) => setVariables((prev) => ({ ...prev, [key]: val }));

  const handleMetrics = (m) => {
    setMetrics(m);
    if (recording) {
      const a = accumRef.current;
      a.avgSpeed = (a.avgSpeed * a.samples + m.avgSpeed) / (a.samples + 1);
      a.maxHeight = Math.max(a.maxHeight, m.maxHeight);
      a.samples += 1;
    }
  };

  const startRecord = () => {
    accumRef.current = { avgSpeed: 0, maxHeight: 0, samples: 0 };
    collisionsAtStartRef.current = metrics.collisions;
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
        name: `Experiment ${experiments.length + 1}`,
        description: "",
        gravity: variables.gravity,
        friction: variables.friction,
        timeScale: variables.timeScale,
        wind: variables.wind,
        atmosphere: variables.atmosphere,
        temperature: variables.temperature,
        specimens: Math.round(variables.specimens),
        bgColor: variables.bgColor,
        duration: Number(duration.toFixed(1)),
        avgSpeed: Number((a.avgSpeed || 0).toFixed(2)),
        maxHeight: Number((a.maxHeight || 0).toFixed(2)),
        collisions: Math.max(0, metrics.collisions - collisionsAtStartRef.current),
      });
      load();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Experiment.delete(id);
      load();
    } catch (e) {}
  };

  const metricCards = [
    { label: "Avg Speed", value: metrics.avgSpeed.toFixed(2), unit: "m/s" },
    { label: "Max Height", value: metrics.maxHeight.toFixed(2), unit: "m" },
    { label: "Collisions", value: metrics.collisions, unit: "" },
  ];

  return (
    <div className="min-h-screen">
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Environment</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Simulate · Control · Record
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {running ? <Pause className="h-3.5 w-3.5" strokeWidth={2} /> : <Play className="h-3.5 w-3.5" strokeWidth={2} />}
            {running ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => setResetSignal((s) => s + 1)}
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
              className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Circle className="h-3 w-3 fill-current" strokeWidth={2} /> Record
            </button>
          )}
        </div>
      </header>

      <div className="px-6 md:px-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border/50 md:h-[520px]">
              <SimulationCanvas
                variables={variables}
                running={running}
                resetSignal={resetSignal}
                onMetrics={handleMetrics}
              />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 backdrop-blur">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    recording ? "animate-pulse bg-destructive" : running ? "bg-emerald-500" : "bg-muted-foreground"
                  }`}
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {recording ? "Recording" : running ? "Running" : "Paused"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {metricCards.map((m) => (
                <div key={m.label} className="rounded-xl border border-border/50 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="mt-1 font-heading text-lg font-bold text-foreground">
                    {m.value}
                    {m.unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{m.unit}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <EnvironmentControls variables={variables} onChange={handleChange} />
        </div>

        <div className="mt-10 pb-16">
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Recorded Experiments
            </h2>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-border/50">
              <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
            </div>
          ) : experiments.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
              <FlaskConical className="h-6 w-6 text-muted-foreground/50" strokeWidth={1} />
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                No experiments recorded
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">Press Record to capture a run</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {experiments.map((exp) => (
                <div key={exp.id} className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{exp.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {Number(exp.duration).toFixed(1)}s · {exp.collisions} hits
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">Gravity</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.gravity).toFixed(1)} m/s²</span>
                    <span className="text-muted-foreground">Temp</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.temperature).toFixed(0)}°C</span>
                    <span className="text-muted-foreground">Wind</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.wind).toFixed(1)} m/s</span>
                    <span className="text-muted-foreground">Atmos</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.atmosphere).toFixed(2)}×</span>
                    <span className="text-muted-foreground">Friction</span>
                    <span className="text-right font-mono text-foreground/80">{Number(exp.friction).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-[11px]">
                    <span className="text-muted-foreground">Avg Speed · Max Height</span>
                    <span className="font-mono text-primary">
                      {Number(exp.avgSpeed).toFixed(2)} · {Number(exp.maxHeight).toFixed(2)}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
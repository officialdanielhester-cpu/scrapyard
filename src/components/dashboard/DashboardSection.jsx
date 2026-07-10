import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Mountain, Gauge, Fuel, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { VEHICLES, ENVIRONMENTS } from "@/components/environment/presets";
import { computeProfile } from "@/components/dashboard/flight-profile";
import FlightChart from "@/components/dashboard/FlightChart";
import FlightList from "@/components/dashboard/FlightList";
import PullToRefresh from "@/components/PullToRefresh";

export default function DashboardSection() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Experiment.list("-created_date", 50);
      setExperiments(list);
      setSelectedId((prev) => (prev && list.find((e) => e.id === prev) ? prev : list[0]?.id || null));
    } catch (e) {
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = experiments.find((e) => e.id === selectedId);
  const profile = useMemo(() => (selected ? computeProfile(selected) : null), [selected]);
  const samples = profile?.samples || [];

  const summary = profile
    ? [
        { label: "Apogee", value: profile.maxAltitude.toFixed(0), unit: "m", icon: Mountain },
        { label: "Max Speed", value: profile.maxSpeed.toFixed(0), unit: "m/s", icon: Gauge },
        { label: "Flight Time", value: (samples[samples.length - 1]?.t || 0).toFixed(1), unit: "s", icon: Activity },
        { label: "Fuel Used", value: (Number(selected.fuel) - (samples[samples.length - 1]?.fuel || 0)).toFixed(1), unit: "s", icon: Fuel },
      ]
    : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="px-6 py-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:px-12">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Flight Dashboard</h1>
        </div>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Speed · Fuel · Altitude
        </p>
      </header>

      <PullToRefresh onRefresh={load} className="flex-1 overflow-y-auto px-6 pb-10 md:px-12">
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50">
            <Activity className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        ) : experiments.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
            <LineChart className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">No test flights yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Record a flight in the Environment section</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Test Flights</h3>
              <FlightList experiments={experiments} loading={loading} selectedId={selectedId} onSelect={setSelectedId} />
            </div>

            <div className="space-y-4">
              {selected && (
                <>
                  <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{selected.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {VEHICLES[selected.vehicle_type]?.label || selected.vehicle_type} ·{" "}
                        {ENVIRONMENTS[selected.environment]?.label || selected.environment}
                      </p>
                    </div>
                    <div className="ml-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {summary.map((s) => {
                        const Icon = s.icon;
                        return (
                          <div key={s.label} className="rounded-xl border border-border/50 px-3 py-2 text-right">
                            <p className="flex items-center justify-end gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                              <Icon className="h-3 w-3" strokeWidth={1.5} />
                              {s.label}
                            </p>
                            <p className="font-heading text-sm font-bold text-primary">
                              {s.value}
                              <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">{s.unit}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FlightChart data={samples} dataKey="altitude" label="Altitude" unit="m" color="#3b82f6" />
                    <FlightChart data={samples} dataKey="speed" label="Speed" unit="m/s" color="#22c55e" />
                    <FlightChart data={samples} dataKey="fuel" label="Fuel Level" unit="s" color="#f59e0b" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Mountain, Gauge, Fuel, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { VEHICLES, ENVIRONMENTS } from "@/components/environment/presets";
import { computeProfile } from "@/components/dashboard/flight-profile";
import FlightChart from "@/components/dashboard/FlightChart";
import FlightList from "@/components/dashboard/FlightList";
import PullToRefresh from "@/components/PullToRefresh";
import { PageHeader, LoadingState, EmptyState, SectionLabel } from "@/components/shared";

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
      <PageHeader icon={LineChart} title="Flight Dashboard" subtitle="Speed · Fuel · Altitude" />

      <PullToRefresh onRefresh={load} className="flex-1 overflow-y-auto px-6 pb-10 md:px-12">
        {loading ? (
          <LoadingState className="h-64 rounded-2xl border border-border/50" />
        ) : experiments.length === 0 ? (
          <EmptyState icon={LineChart} title="No test flights yet" description="Record a flight in the Environment section" className="h-64" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div>
              <SectionLabel className="mb-3">Test Flights</SectionLabel>
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
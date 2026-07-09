import React from "react";
import { Gauge, Weight, Flame, Wind, Fuel, TrendingUp } from "lucide-react";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-primary">{value}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, accent }) {
  return (
    <div className="rounded-xl border border-border/50 p-3">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />}
        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-1 font-heading text-base font-bold ${accent || "text-foreground"}`}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export default function BuildStats({ stats }) {
  const verdictTone = stats.ready ? "text-emerald-500" : "text-amber-500";
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live Physics</h3>
        <span className={`font-mono text-[10px] uppercase tracking-wider ${verdictTone}`}>{stats.verdict}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Weight} label="Mass" value={stats.mass.toFixed(1)} unit="t" />
        <Stat icon={Flame} label="Thrust" value={stats.thrust.toFixed(0)} unit="kN" />
        <Stat icon={Wind} label="Lift" value={stats.lift.toFixed(2)} />
        <Stat icon={Gauge} label="Drag" value={stats.drag.toFixed(2)} />
        <Stat icon={Fuel} label="Fuel" value={stats.fuel.toFixed(0)} unit="s" />
        <Stat
          icon={TrendingUp}
          label="TWR"
          value={stats.twr.toFixed(2)}
          accent={stats.twr > 1 ? "text-emerald-500" : "text-amber-500"}
        />
      </div>
      <div className="mt-2 space-y-1.5 rounded-xl border border-border/50 p-3">
        {stats.category === "launch" && <Row label="Est. Apogee" value={`${stats.apogee.toFixed(0)} m`} />}
        {stats.category === "winged" && (
          <>
            <Row label="Top Speed" value={`${stats.topSpeed.toFixed(0)} m/s`} />
            <Row label="Stall Speed" value={`${stats.stallSpeed.toFixed(0)} m/s`} />
          </>
        )}
        {stats.category === "ground" && <Row label="Top Speed" value={`${stats.topSpeed.toFixed(0)} m/s`} />}
        <Row label="Burn Time" value={`${stats.burnTime.toFixed(0)} s`} />
      </div>
    </div>
  );
}
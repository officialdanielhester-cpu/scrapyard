import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GRID = "rgba(120,130,150,0.18)";
const TICK = "rgba(120,130,150,0.85)";

export default function FlightChart({ data, dataKey, label, unit, color }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</h3>
        <span className="font-mono text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: TICK }} stroke={GRID} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: TICK }} stroke={GRID} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              labelFormatter={(v) => `t = ${v}s`}
              formatter={(v) => [`${v} ${unit}`, label]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
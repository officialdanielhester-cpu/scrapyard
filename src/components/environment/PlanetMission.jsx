import React, { useState, useEffect, useRef, useMemo } from "react";
import { Rocket, Orbit, AlertTriangle, CheckCircle2, Gauge, Ruler, Fuel, RotateCcw } from "lucide-react";
import { PLANETS, planetById, distanceAU, AU_TO_KM, MISSION_K } from "@/components/environment/planets";
import { VEHICLES } from "@/components/environment/presets";

// Interplanetary mission: pick origin + destination planets, evaluate whether
// the current build can make the transfer, and animate the trajectory.
export default function PlanetMission({ params, vehicleType }) {
  const [originId, setOriginId] = useState("earth");
  const [destId, setDestId] = useState("mars");
  const [phase, setPhase] = useState("idle"); // idle | flying | success | failed
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const origin = planetById(originId);
  const dest = planetById(destId);

  const analysis = useMemo(() => {
    const dist = distanceAU(origin, dest);
    const distanceFactor = dist * MISSION_K;
    const gravFactor = 1 + (origin.gravity / 9.8) * 0.3 + (dest.gravity / 9.8) * 0.3;
    const atmFactor = 1 + origin.atmosphere * 0.15 + dest.atmosphere * 0.15;
    const requirement = distanceFactor * gravFactor * atmFactor;
    const capability =
      (params.thrust / Math.max(0.5, params.mass)) *
      params.fuel *
      (1 + params.lift * 0.1) *
      (1 - Math.min(0.5, params.drag * 0.1));
    const canReach = capability >= requirement && dist > 0;
    return {
      dist,
      distKm: dist * AU_TO_KM,
      requirement,
      capability,
      canReach,
      margin: (capability - requirement) / Math.max(1, requirement),
    };
  }, [origin, dest, params]);

  const target = analysis.dist > 0 ? (analysis.canReach ? 1 : Math.min(0.96, analysis.capability / Math.max(1, analysis.requirement))) : 0;

  const launch = () => {
    cancelAnimationFrame(rafRef.current);
    if (analysis.dist === 0) return;
    setPhase("flying");
    setProgress(0);
    startRef.current = performance.now();
    const duration = 4200;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(e * target);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setPhase(target >= 1 ? "success" : "failed");
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase("idle");
    setProgress(0);
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // trajectory geometry
  const W = 540, H = 250, padX = 80, padY = 70;
  const x0 = padX, x1 = W - padX;
  const yBase = H - padY;
  const ctrlY = padY * 0.35;
  const bez = (t) => ({
    x: (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1,
    y: (1 - t) * (1 - t) * yBase + 2 * (1 - t) * t * ctrlY + t * t * yBase,
  });
  const rocketPos = bez(progress);
  const ahead = bez(Math.min(1, progress + 0.02));
  const angle = (Math.atan2(ahead.y - rocketPos.y, ahead.x - rocketPos.x) * 180) / Math.PI;
  const arcPath = `M ${x0} ${yBase} Q ${(x0 + x1) / 2} ${ctrlY} ${x1} ${yBase}`;

  const vehicleLabel = VEHICLES[vehicleType]?.label || vehicleType;
  const fmtKm = (km) => (km >= 1e6 ? `${(km / 1e6).toFixed(1)}M km` : `${Math.round(km).toLocaleString()} km`);

  const PlanetPicker = ({ value, onChange, label }) => (
    <div>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => { onChange(e.target.value); reset(); }}
        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        {PLANETS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
    </div>
  );

  const Stat = ({ icon: Icon, label, value, tone }) => (
    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-1 font-mono text-lg font-semibold ${tone || "text-foreground"}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <PlanetPicker label="Origin" value={originId} onChange={setOriginId} />
        <PlanetPicker label="Destination" value={destId} onChange={setDestId} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Ruler} label="Distance" value={analysis.dist > 0 ? fmtKm(analysis.distKm) : "—"} />
        <Stat icon={Gauge} label="Δv Required" value={Math.round(analysis.requirement)} />
        <Stat icon={Fuel} label="Build Δv" value={Math.round(analysis.capability)} />
        <Stat
          icon={analysis.canReach ? CheckCircle2 : AlertTriangle}
          label="Verdict"
          tone={analysis.canReach ? "text-emerald-500" : "text-amber-500"}
          value={analysis.dist === 0 ? "SAME" : analysis.canReach ? "GO" : "NO-GO"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/30">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Transfer Trajectory</h3>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            {vehicleLabel} · {origin.label} → {dest.label}
          </span>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "radial-gradient(ellipse at 50% 120%, #0a1430 0%, #05060d 70%)" }}>
            {/* stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <circle key={i} cx={(i * 53) % W} cy={(i * 37) % (H - 40)} r={i % 5 === 0 ? 1 : 0.5} fill="#ffffff" opacity={0.5} />
            ))}
            {/* sun */}
            <circle cx={W / 2} cy={H + 10} r={26} fill="#fbbf24" opacity={0.25} />
            <circle cx={W / 2} cy={H + 10} r={14} fill="#fde68a" opacity={0.6} />

            {/* arc */}
            <path d={arcPath} fill="none" stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
            <path
              d={arcPath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray={`${progress * 600} 600`}
              opacity={0.9}
            />

            {/* origin planet */}
            <g>
              <circle cx={x0} cy={yBase} r={origin.radius / 2.2} fill={origin.color} />
              <text x={x0} y={yBase + origin.radius / 2.2 + 14} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" className="font-mono">{origin.label}</text>
            </g>
            {/* destination planet */}
            <g>
              <circle cx={x1} cy={yBase} r={dest.radius / 2.2} fill={dest.color} />
              <text x={x1} y={yBase + dest.radius / 2.2 + 14} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" className="font-mono">{dest.label}</text>
            </g>

            {/* rocket */}
            {progress > 0 && (
              <g transform={`translate(${rocketPos.x} ${rocketPos.y}) rotate(${angle})`}>
                <path d="M 0 -7 L 4 5 L 0 2 L -4 5 Z" fill="hsl(var(--primary))" />
                {phase === "flying" && <path d="M 0 5 L 1.5 9 L 0 8 L -1.5 9 Z" fill="#f97316" opacity={0.85} />}
              </g>
            )}

            {/* outcome flags */}
            {phase === "success" && (
              <g>
                <circle cx={x1} cy={yBase} r={dest.radius / 2.2 + 6} fill="none" stroke="#10b981" strokeWidth={2} />
                <text x={x1} y={yBase - dest.radius / 2.2 - 10} fill="#10b981" fontSize={10} textAnchor="middle" className="font-mono">ARRIVED</text>
              </g>
            )}
            {phase === "failed" && (
              <g>
                <text x={rocketPos.x} y={rocketPos.y - 12} fill="#f59e0b" fontSize={10} textAnchor="middle" className="font-mono">FUEL SPENT</text>
              </g>
            )}
          </svg>

          {/* progress / fuel bar */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span>Transfer progress</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${analysis.canReach ? "bg-primary" : "bg-amber-500"}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={launch}
          disabled={phase === "flying" || analysis.dist === 0}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Rocket className="h-3.5 w-3.5" strokeWidth={1.5} /> {phase === "flying" ? "Transferring…" : "Launch Transfer"}
        </button>
        {(phase === "success" || phase === "failed") && (
          <button
            onClick={reset}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset
          </button>
        )}
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/80">
          {analysis.dist === 0
            ? "Select two different planets."
            : analysis.canReach
            ? `Build has ${(analysis.margin * 100).toFixed(0)}% Δv margin for this transfer.`
            : `Build is ${Math.round((1 - analysis.capability / analysis.requirement) * 100)}% short on Δv — add fuel, thrust, or shed mass.`}
        </p>
      </div>
    </div>
  );
}
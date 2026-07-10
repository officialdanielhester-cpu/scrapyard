import React, { useState, useEffect, useMemo, useRef } from "react";
import { Rocket, RotateCcw, Ruler, Clock, Gauge, Compass } from "lucide-react";
import { PLANETS, planetById, effOrbit, distanceAU, AU_TO_KM } from "@/components/environment/planets";
import { VEHICLES } from "@/components/environment/presets";

// Interplanetary transfer rework: a real Hohmann transfer ellipse with a
// departure phase-angle launch window, transfer time, and Δv budget, animated
// along the elliptical arc. Build capability still gates the verdict.
const MU = 4 * Math.PI * Math.PI; // AU^3 / yr^2 (Sun)
const AU_PER_YR_TO_KMS = 4.74;

export default function PlanetMission({ params, vehicleType }) {
  const [originId, setOriginId] = useState("earth");
  const [destId, setDestId] = useState("mars");
  const [phaseAngle, setPhaseAngle] = useState(0);
  const [flying, setFlying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState(null); // null | success | miss | nojoy
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const origin = planetById(originId);
  const dest = planetById(destId);
  const r1 = effOrbit(origin);
  const r2 = effOrbit(dest);
  const innerR = Math.min(r1, r2);
  const outerR = Math.max(r1, r2);
  const originIsInner = r1 <= r2;

  const orbit = useMemo(() => {
    if (innerR <= 0 || outerR <= 0 || innerR === outerR) return null;
    const a = (innerR + outerR) / 2;
    const e = (outerR - innerR) / (outerR + innerR);
    const b = a * Math.sqrt(1 - e * e);
    const Ttransfer = Math.pow(a, 1.5) / 2; // years (half period)
    const Tdest = Math.pow(r2, 1.5); // years
    const destTravel = 360 * (Ttransfer / Tdest); // deg dest moves during transfer
    const arrivalAngle = originIsInner ? 180 : 0; // aphelion (outer) or perihelion (inner)
    const requiredPhase = ((arrivalAngle - destTravel) % 360 + 360) % 360;
    const vInnerCirc = Math.sqrt(MU / innerR);
    const vOuterCirc = Math.sqrt(MU / outerR);
    const vInnerEll = Math.sqrt(MU * (2 / innerR - 1 / a));
    const vOuterEll = Math.sqrt(MU * (2 / outerR - 1 / a));
    const dvKms = (Math.abs(vInnerEll - vInnerCirc) + Math.abs(vOuterCirc - vOuterEll)) * AU_PER_YR_TO_KMS;
    const distAU = distanceAU(origin, dest);
    return { a, e, b, Ttransfer, destTravel, requiredPhase, dvKms, distAU, distKm: distAU * AU_TO_KM };
  }, [innerR, outerR, originIsInner, origin, dest]);

  const capability = useMemo(() => {
    const gravFactor = 1 + (origin.gravity / 9.8) * 0.3 + (dest.gravity / 9.8) * 0.3;
    const atmFactor = 1 + origin.atmosphere * 0.15 + dest.atmosphere * 0.15;
    const requirement = (orbit ? orbit.distAU * 200 : 0) * gravFactor * atmFactor;
    const cap = (params.thrust / Math.max(0.5, params.mass)) * params.fuel * (1 + params.lift * 0.1) * (1 - Math.min(0.5, params.drag * 0.1));
    return { requirement, capability: cap, canReach: cap >= requirement && orbit != null };
  }, [origin, dest, params, orbit]);

  useEffect(() => { if (orbit) setPhaseAngle(Math.round(orbit.requiredPhase)); }, [orbit ? orbit.requiredPhase : null]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const phaseDelta = orbit ? Math.min(Math.abs(phaseAngle - orbit.requiredPhase), 360 - Math.abs(phaseAngle - orbit.requiredPhase)) : 360;
  const aligned = phaseDelta < 8;
  const willRendezvous = capability.canReach && aligned;

  const launch = () => {
    if (!orbit) return;
    cancelAnimationFrame(rafRef.current);
    setFlying(true); setProgress(0); setOutcome(null);
    startRef.current = performance.now();
    const duration = 5000;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      setProgress(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setFlying(false);
        setOutcome(willRendezvous ? "success" : capability.canReach ? "miss" : "nojoy");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  const reset = () => { cancelAnimationFrame(rafRef.current); setFlying(false); setProgress(0); setOutcome(null); };

  // diagram geometry
  const W = 560, H = 320, sunX = W / 2, sunY = H / 2 + 20;
  const maxR = Math.max(outerR, 0.4);
  const scale = (Math.min(W, H) / 2 - 50) / maxR;
  const cx = sunX - (orbit ? (orbit.a - innerR) * scale : 0);
  const rx = orbit ? orbit.a * scale : 0;
  const ry = orbit ? orbit.b * scale : 0;

  const spacecraftPos = (p) => {
    if (!orbit) return { x: sunX, y: sunY };
    if (originIsInner) return { x: cx + rx * Math.cos(Math.PI * p), y: sunY - ry * Math.sin(Math.PI * p) };
    return { x: cx - rx * Math.cos(Math.PI * p), y: sunY - ry * Math.sin(Math.PI * p) };
  };
  const destAngleDeg = orbit ? phaseAngle + orbit.destTravel * progress : phaseAngle;
  const destRad = (destAngleDeg * Math.PI) / 180;
  const destPos = { x: sunX + r2 * scale * Math.cos(destRad), y: sunY - r2 * scale * Math.sin(destRad) };
  const originPos = originIsInner ? { x: sunX + innerR * scale, y: sunY } : { x: sunX - outerR * scale, y: sunY };
  const arrivalPos = originIsInner ? { x: cx - rx, y: sunY } : { x: cx + rx, y: sunY };
  const sc = spacecraftPos(progress);

  const vehicleLabel = VEHICLES[vehicleType]?.label || vehicleType;
  const fmtKm = (km) => (km >= 1e6 ? `${(km / 1e6).toFixed(1)}M km` : `${Math.round(km).toLocaleString()} km`);
  const fmtTime = (yr) => (yr >= 1 ? `${yr.toFixed(2)} yr` : `${(yr * 365.25).toFixed(0)} d`);

  const PlanetPicker = ({ value, onChange, label }) => (
    <div>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => { onChange(e.target.value); reset(); }} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
        {PLANETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </div>
  );
  const Stat = ({ icon: Icon, label, value, tone }) => (
    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground"><Icon className="h-3.5 w-3.5" strokeWidth={1.5} /><span className="font-mono text-[9px] uppercase tracking-wider">{label}</span></div>
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
        <Stat icon={Ruler} label="Distance" value={orbit ? fmtKm(orbit.distKm) : "—"} />
        <Stat icon={Clock} label="Transfer Time" value={orbit ? fmtTime(orbit.Ttransfer) : "—"} />
        <Stat icon={Gauge} label="Δv (Hohmann)" value={orbit ? `${orbit.dvKms.toFixed(1)} km/s` : "—"} />
        <Stat icon={Compass} label="Phase Window" value={orbit ? `${Math.round(orbit.requiredPhase)}°` : "—"} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/30">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Transfer Orbit</h3>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">{vehicleLabel} · {origin.label} → {dest.label}</span>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "radial-gradient(ellipse at 50% 70%, #0a1430 0%, #05060d 70%)" }}>
            {Array.from({ length: 50 }).map((_, i) => <circle key={i} cx={(i * 53) % W} cy={(i * 37) % (H - 30)} r={i % 5 === 0 ? 1 : 0.5} fill="#fff" opacity={0.5} />)}
            <circle cx={sunX} cy={sunY} r={16} fill="#fbbf24" opacity={0.3} />
            <circle cx={sunX} cy={sunY} r={9} fill="#fde68a" opacity={0.8} />
            <circle cx={sunX} cy={sunY} r={r1 * scale} fill="none" stroke="hsl(var(--border))" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 4" />
            <circle cx={sunX} cy={sunY} r={r2 * scale} fill="none" stroke="hsl(var(--border))" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 4" />
            {orbit && (
              <path d={`M ${cx + rx} ${sunY} A ${rx} ${ry} 0 0 0 ${cx - rx} ${sunY}`} fill="none" stroke="hsl(var(--primary))" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 4" />
            )}
            {orbit && <>
              <circle cx={originPos.x} cy={originPos.y} r={4} fill="none" stroke="#f97316" strokeWidth={1.5} />
              <circle cx={arrivalPos.x} cy={arrivalPos.y} r={4} fill="none" stroke="#f97316" strokeWidth={1.5} />
            </>}
            <circle cx={originPos.x} cy={originPos.y} r={Math.max(5, origin.radius / 3)} fill={origin.color} />
            <text x={originPos.x} y={originPos.y + Math.max(5, origin.radius / 3) + 12} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" className="font-mono">{origin.label}</text>
            <circle cx={destPos.x} cy={destPos.y} r={Math.max(5, dest.radius / 3)} fill={dest.color} />
            <text x={destPos.x} y={destPos.y + Math.max(5, dest.radius / 3) + 12} fill="hsl(var(--muted-foreground))" fontSize={9} textAnchor="middle" className="font-mono">{dest.label}</text>
            {(progress > 0 || flying) && (
              <g transform={`translate(${sc.x} ${sc.y})`}>
                <path d="M 0 -6 L 4 5 L 0 2 L -4 5 Z" fill={willRendezvous ? "hsl(var(--primary))" : "#f59e0b"} />
                {flying && <path d="M 0 5 L 1.5 9 L 0 8 L -1.5 9 Z" fill="#f97316" opacity={0.85} />}
              </g>
            )}
            {outcome === "success" && <text x={destPos.x} y={destPos.y - Math.max(5, dest.radius / 3) - 10} fill="#10b981" fontSize={11} textAnchor="middle" className="font-mono">RENDEZVOUS</text>}
            {outcome === "miss" && <text x={sc.x} y={sc.y - 12} fill="#f59e0b" fontSize={11} textAnchor="middle" className="font-mono">MISSED</text>}
            {outcome === "nojoy" && <text x={sc.x} y={sc.y - 12} fill="#ef4444" fontSize={11} textAnchor="middle" className="font-mono">NO Δv</text>}
          </svg>

          <div className="space-y-3 px-4 py-3">
            <div>
              <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>Departure Phase Angle</span>
                <span className={aligned ? "text-emerald-500" : "text-amber-500"}>{phaseAngle}° {aligned ? "· ALIGNED" : "· OFF WINDOW"}</span>
              </div>
              <input type="range" min={0} max={359} value={phaseAngle} onChange={(e) => setPhaseAngle(Number(e.target.value))} className="w-full accent-primary" disabled={flying} />
            </div>
            <div>
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>Transfer progress</span><span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-[width] duration-100 ${willRendezvous ? "bg-primary" : "bg-amber-500"}`} style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={launch} disabled={flying || !orbit} className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40">
          <Rocket className="h-3.5 w-3.5" strokeWidth={1.5} /> {flying ? "Transferring…" : "Launch Transfer"}
        </button>
        {(outcome || flying) && (
          <button onClick={reset} className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary">
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset
          </button>
        )}
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/80">
          {!orbit ? "Select two different planets."
            : !capability.canReach ? `Build is ${Math.round((1 - capability.capability / Math.max(1, capability.requirement)) * 100)}% short on Δv — add fuel/thrust or shed mass.`
            : !aligned ? `Launch window off by ~${Math.round(phaseDelta)}° — align phase to ${Math.round(orbit.requiredPhase)}°.`
            : "Window aligned · build has Δv margin. Rendezvous predicted."}
        </p>
      </div>
    </div>
  );
}
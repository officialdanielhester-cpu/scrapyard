import React, { useState, useEffect, useCallback } from "react";
import { Save, Loader2, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { computeStats } from "@/components/workshop/parts-catalog";
import WorkshopVehicleSelector from "@/components/workshop/WorkshopVehicleSelector";
import PartsCatalog from "@/components/workshop/PartsCatalog";
import AppliedPartsList from "@/components/workshop/AppliedPartsList";
import BuildStats from "@/components/workshop/BuildStats";
import SavedBuilds from "@/components/workshop/SavedBuilds";
import AssemblyCanvas from "@/components/workshop/AssemblyCanvas";

export default function WorkshopSection({ onImportBuild }) {
  const [vehicleType, setVehicleType] = useState("rocket");
  const [applied, setApplied] = useState([]);
  const [buildName, setBuildName] = useState("Untitled Build");
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.VehicleBuild.list("-created_date", 50);
      setBuilds(list);
    } catch (e) {
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = computeStats(vehicleType, applied);

  const selectVehicle = (type) => {
    setVehicleType(type);
    setApplied([]);
  };

  const addPart = (id) =>
    setApplied((prev) => {
      const found = prev.find((p) => p.type === id);
      if (found) return prev.map((p) => (p.type === id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { type: id, qty: 1 }];
    });
  const incPart = (id) => setApplied((prev) => prev.map((p) => (p.type === id ? { ...p, qty: p.qty + 1 } : p)));
  const decPart = (id) =>
    setApplied((prev) =>
      prev.flatMap((p) => {
        if (p.type !== id) return [p];
        if (p.qty <= 1) return [];
        return [{ ...p, qty: p.qty - 1 }];
      })
    );
  const removePart = (id) => setApplied((prev) => prev.filter((p) => p.type !== id));

  const resetBuild = () => {
    setApplied([]);
    setBuildName("Untitled Build");
    setEditingId(null);
    setVehicleType("rocket");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: buildName || "Untitled Build",
        vehicle_type: vehicleType,
        parts: applied,
        thrust: stats.thrust,
        mass: stats.mass,
        drag: stats.drag,
        lift: stats.lift,
        fuel: stats.fuel,
      };
      if (editingId) {
        await base44.entities.VehicleBuild.update(editingId, payload);
      } else {
        const created = await base44.entities.VehicleBuild.create(payload);
        setEditingId(created.id);
      }
      load();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (b) => {
    setEditingId(b.id);
    setBuildName(b.name);
    setVehicleType(b.vehicle_type);
    setApplied(b.parts || []);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.VehicleBuild.delete(id);
      if (editingId === id) resetBuild();
      load();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen pb-10">
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Workshop</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Design · Build · Apply
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={resetBuild}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> New
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
            {editingId ? "Update" : "Save Build"}
          </button>
        </div>
      </header>

      <div className="px-6 md:px-12">
        <div className="mb-6 max-w-md">
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Build Name
          </label>
          <input
            value={buildName}
            onChange={(e) => setBuildName(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <WorkshopVehicleSelector value={vehicleType} onSelect={selectVehicle} />
            <AssemblyCanvas
              applied={applied}
              vehicleType={vehicleType}
              onRemoveInstance={decPart}
              onAdd={addPart}
              onImport={() =>
                onImportBuild?.({
                  vehicle_type: vehicleType,
                  thrust: stats.thrust,
                  mass: stats.mass,
                  drag: stats.drag,
                  lift: stats.lift,
                  fuel: stats.fuel,
                })
              }
            />
            <PartsCatalog vehicleType={vehicleType} onAdd={addPart} />
          </div>

          <div className="space-y-6">
            <BuildStats stats={stats} />
            <div>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Applied Parts
              </h3>
              <AppliedPartsList applied={applied} onInc={incPart} onDec={decPart} onRemove={removePart} />
            </div>
            <SavedBuilds builds={builds} loading={loading} onLoad={handleLoad} onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}
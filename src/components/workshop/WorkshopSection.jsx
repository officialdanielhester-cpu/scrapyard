import React, { useState, useEffect, useCallback } from "react";
import { Save, Loader2, RotateCcw, BarChart3 } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { base44 } from "@/api/base44Client";
import { computeStats, normalizeInstances } from "@/components/workshop/parts-catalog";
import { countByType } from "@/components/workshop/part-3d";
import WorkshopVehicleSelector from "@/components/workshop/WorkshopVehicleSelector";
import PartsCatalog from "@/components/workshop/PartsCatalog";
import AppliedPartsList from "@/components/workshop/AppliedPartsList";
import BuildStats from "@/components/workshop/BuildStats";
import SavedBuilds from "@/components/workshop/SavedBuilds";
import AssemblyCanvas from "@/components/workshop/AssemblyCanvas";

const newIid = () => `i-${Math.random().toString(36).slice(2, 9)}`;

export default function WorkshopSection({ onImportBuild }) {
  const [vehicleType, setVehicleType] = useState("rocket");
  const [instances, setInstances] = useState([]);
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

  useEffect(() => { load(); }, [load]);

  const stats = computeStats(vehicleType, instances);
  const appliedCounts = countByType(instances);

  const selectVehicle = (type) => {
    setVehicleType(type);
    setInstances([]);
  };

  const addPart = (id) =>
    setInstances((prev) => [
      ...prev,
      { iid: newIid(), type: id, x: 300 + Math.round((Math.random() - 0.5) * 80), y: 240 + Math.round((Math.random() - 0.5) * 80), scale: 1, rot: 0, color: "" },
    ]);

  // Remove one instance of the given type (used by 3D click-to-remove and the − button).
  const removeOne = (id) =>
    setInstances((prev) => {
      const idx = prev.map((p) => p.type).lastIndexOf(id);
      if (idx < 0) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  const removeAll = (id) => setInstances((prev) => prev.filter((p) => p.type !== id));

  const resetBuild = () => {
    setInstances([]);
    setBuildName("Untitled Build");
    setEditingId(null);
    setVehicleType("rocket");
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: buildName || "Untitled Build",
      vehicle_type: vehicleType,
      parts: instances,
      thrust: stats.thrust,
      mass: stats.mass,
      drag: stats.drag,
      lift: stats.lift,
      fuel: stats.fuel,
    };
    const wasEditing = !!editingId;
    const tempId = wasEditing ? editingId : `temp-${Date.now()}`;

    // Optimistic: update the list immediately so the UI feels instant.
    if (wasEditing) {
      setBuilds((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...payload } : b)));
    } else {
      setBuilds((prev) => [{ id: tempId, ...payload }, ...prev]);
      setEditingId(tempId);
    }

    try {
      if (wasEditing) {
        await base44.entities.VehicleBuild.update(editingId, payload);
      } else {
        const created = await base44.entities.VehicleBuild.create(payload);
        setBuilds((prev) => prev.map((b) => (b.id === tempId ? created : b)));
        setEditingId(created.id);
      }
      load();
    } catch (e) {
      // Rollback on failure
      if (wasEditing) {
        load();
      } else {
        setBuilds((prev) => prev.filter((b) => b.id !== tempId));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (b) => {
    setEditingId(b.id);
    setBuildName(b.name);
    setVehicleType(b.vehicle_type);
    setInstances(normalizeInstances(b.parts || []));
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
      <header className="flex flex-col gap-4 px-6 py-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:flex-row md:items-center md:justify-between md:px-12">
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
              instances={instances}
              setInstances={setInstances}
              vehicleType={vehicleType}
              onRemoveInstance={removeOne}
              onAddInstance={addPart}
              onImport={() =>
                onImportBuild?.({
                  vehicle_type: vehicleType,
                  thrust: stats.thrust,
                  mass: stats.mass,
                  drag: stats.drag,
                  lift: stats.lift,
                  fuel: stats.fuel,
                  instances,
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
              <AppliedPartsList applied={appliedCounts} onInc={addPart} onDec={removeOne} onRemove={removeAll} />
            </div>
            <SavedBuilds builds={builds} loading={loading} onLoad={handleLoad} onDelete={handleDelete} />
          </div>
        </div>

        {/* Mobile floating button for stats/parts/builds drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden">
              <BarChart3 className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto p-0">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="font-mono text-xs uppercase tracking-wider">Build Panel</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 p-4">
              <BuildStats stats={stats} />
              <div>
                <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Applied Parts
                </h3>
                <AppliedPartsList applied={appliedCounts} onInc={addPart} onDec={removeOne} onRemove={removeAll} />
              </div>
              <SavedBuilds builds={builds} loading={loading} onLoad={handleLoad} onDelete={handleDelete} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
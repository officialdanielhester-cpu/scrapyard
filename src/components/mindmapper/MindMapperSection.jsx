import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, Save, FilePlus2, Network, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MindNode, { NODE_W, NODE_H } from "@/components/mindmapper/MindNode";

const CANVAS_W = 2600;
const CANVAS_H = 1900;
const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function MindMapperSection() {
  const [nodes, setNodes] = useState([{ id: uid(), x: 240, y: 220, text: "Central idea", color: "#3b82f6" }]);
  const [edges, setEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [name, setName] = useState("Untitled Map");
  const [savedId, setSavedId] = useState(null);
  const [maps, setMaps] = useState([]);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const connectRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const list = await base44.entities.MindMap.list("-updated_date", 20); setMaps(list || []); } catch {}
    })();
  }, []);

  const rect = () => canvasRef.current?.getBoundingClientRect();

  // ---- Node dragging ----
  const onNodePointerDown = useCallback((e, node) => {
    e.stopPropagation();
    setSelectedId(node.id);
    const r = rect();
    dragRef.current = { id: node.id, offX: e.clientX - r.left - node.x, offY: e.clientY - r.top - node.y };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  }, []);

  const onDragMove = useCallback((e) => {
    const d = dragRef.current; if (!d) return;
    const r = rect(); if (!r) return;
    let x = e.clientX - r.left - d.offX;
    let y = e.clientY - r.top - d.offY;
    x = Math.max(0, Math.min(CANVAS_W - NODE_W, x));
    y = Math.max(0, Math.min(CANVAS_H - NODE_H, y));
    setNodes((prev) => prev.map((n) => (n.id === d.id ? { ...n, x, y } : n)));
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  }, []);

  // ---- Connecting ----
  const onConnectorDown = useCallback((e, node) => {
    e.stopPropagation();
    connectRef.current = { from: node.id };
    setTempEnd({ x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 });
    window.addEventListener("pointermove", onConnectMove);
    window.addEventListener("pointerup", onConnectEnd);
  }, []);

  const onConnectMove = useCallback((e) => {
    if (!connectRef.current) return;
    const r = rect(); if (!r) return;
    setTempEnd({ x: Math.max(0, e.clientX - r.left), y: Math.max(0, e.clientY - r.top) });
  }, []);

  const onConnectEnd = useCallback((e) => {
    const c = connectRef.current; connectRef.current = null; setTempEnd(null);
    window.removeEventListener("pointermove", onConnectMove);
    window.removeEventListener("pointerup", onConnectEnd);
    if (!c) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el?.closest("[data-node-id]");
    const toId = target?.getAttribute("data-node-id");
    if (toId && toId !== c.from) {
      setEdges((prev) => (prev.some((ed) => ed.from === c.from && ed.to === toId) ? prev : [...prev, { id: uid(), from: c.from, to: toId }]));
    }
  }, []);

  // ---- Node ops ----
  const addNodeAt = (x, y) => {
    const id = uid();
    setNodes((prev) => [...prev, { id, x: Math.max(0, x - NODE_W / 2), y: Math.max(0, y - NODE_H / 2), text: "New idea", color: COLORS[prev.length % COLORS.length] }]);
    setEditingId(id); setSelectedId(id);
  };

  const addNode = () => addNodeAt(360 + (nodes.length % 5) * 60, 260 + (nodes.length % 5) * 60);

  const onTextChange = (id, text) => setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));

  const deleteSelected = () => {
    if (!selectedId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedId));
    setEdges((prev) => prev.filter((e) => e.from !== selectedId && e.to !== selectedId));
    setSelectedId(null); setEditingId(null);
  };

  const removeEdge = (id) => setEdges((prev) => prev.filter((e) => e.id !== id));

  const onCanvasDoubleClick = (e) => {
    if (e.target !== canvasRef.current) return;
    const r = rect(); if (!r) return;
    addNodeAt(e.clientX - r.left, e.clientY - r.top);
  };

  // ---- Persistence ----
  const save = async () => {
    setSaving(true);
    try {
      const payload = { name, nodes, edges };
      if (savedId) await base44.entities.MindMap.update(savedId, payload);
      else { const c = await base44.entities.MindMap.create(payload); setSavedId(c.id); }
      const list = await base44.entities.MindMap.list("-updated_date", 20); setMaps(list || []);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const newMap = () => {
    const id = uid();
    setNodes([{ id, x: 240, y: 220, text: "Central idea", color: "#3b82f6" }]);
    setEdges([]); setSelectedId(null); setEditingId(null); setName("Untitled Map"); setSavedId(null);
  };

  const loadMap = async (m) => {
    setNodes(m.nodes?.length ? m.nodes : [{ id: uid(), x: 240, y: 220, text: "Central idea", color: "#3b82f6" }]);
    setEdges(m.edges || []); setName(m.name); setSavedId(m.id); setSelectedId(null); setEditingId(null);
  };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const center = (id) => { const n = nodeMap.get(id); return n ? { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 } : null; };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/40 px-6 py-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <Network className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent font-heading text-xl font-extrabold tracking-tight outline-none" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={addNode} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"><Plus className="h-4 w-4" /> Node</button>
          <button onClick={deleteSelected} disabled={!selectedId} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium hover:border-destructive hover:text-destructive disabled:opacity-40"><Trash2 className="h-4 w-4" /> Delete</button>
          <button onClick={newMap} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"><FilePlus2 className="h-4 w-4" /> New</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div ref={canvasRef} onDoubleClick={onCanvasDoubleClick}
          className="relative flex-1 overflow-auto"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}>
          <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
            {/* Edge layer */}
            <svg className="absolute inset-0" style={{ width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}>
              {edges.map((e) => {
                const a = center(e.from), b = center(e.to); if (!a || !b) return null;
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                return <path key={e.id} d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`} stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth={2} fill="none"
                  className="pointer-events-stroke cursor-pointer" onDoubleClick={() => removeEdge(e.id)} />;
              })}
              {tempEnd && (() => { const a = center(connectRef.current?.from); return a ? <path d={`M ${a.x} ${a.y} L ${tempEnd.x} ${tempEnd.y}`} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 4" fill="none" /> : null; })()}
            </svg>
            {/* Node layer */}
            {nodes.map((n) => (
              <MindNode key={n.id} node={n} selected={n.id === selectedId} editing={n.id === editingId}
                onSelect={setSelectedId} onPointerDown={onNodePointerDown} onConnectorDown={onConnectorDown}
                onEditStart={setEditingId} onTextChange={onTextChange} onCommitEdit={() => setEditingId(null)} />
            ))}
          </div>
        </div>

        {maps.length > 0 && (
          <div className="hidden w-60 shrink-0 overflow-y-auto border-l border-border/40 lg:block">
            <div className="p-4">
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Saved Maps</h3>
              <div className="space-y-1.5">
                {maps.map((m) => (
                  <button key={m.id} onClick={() => loadMap(m)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left ${savedId === m.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/70"}`}>
                    <span className="truncate text-sm">{m.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">{m.nodes?.length || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="border-t border-border/40 px-6 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 md:px-10">
        Double-click empty space to add a node · Drag the colored handle between nodes to connect · Double-click a node to edit · Double-click a line to remove it
      </p>
    </div>
  );
}
import React from "react";

export const NODE_W = 150;
export const NODE_H = 60;

// Presentational node card: draggable body + a connector handle for linking.
export default function MindNode({ node, selected, editing, onSelect, onPointerDown, onConnectorDown, onEditStart, onTextChange, onCommitEdit }) {
  return (
    <div
      data-node-id={node.id}
      onPointerDown={(e) => onPointerDown(e, node)}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEditStart(node.id); }}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H, borderColor: selected ? node.color : undefined }}
      className={`absolute select-none rounded-xl border-2 bg-background p-2 shadow-md transition-shadow ${selected ? "ring-2 ring-primary/40" : "border-border/60"}`}
    >
      <span
        onPointerDown={(e) => onConnectorDown(e, node)}
        title="Drag to another node to connect"
        className="absolute -right-1.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-background"
        style={{ backgroundColor: node.color }}
      />
      {editing ? (
        <input
          autoFocus
          value={node.text}
          onChange={(e) => onTextChange(node.id, e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onCommitEdit(); }}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
      ) : (
        <p className="truncate text-sm font-semibold text-foreground">{node.text || "Untitled"}</p>
      )}
    </div>
  );
}
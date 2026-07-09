import React, { useState } from "react";
import {
  Calendar,
  Mail,
  Cloud,
  MessageSquare,
  Github,
  FileText,
  Check,
} from "lucide-react";

const NODES = [
  { id: "calendar", label: "Calendar", icon: Calendar, status: "Ready to Sync" },
  { id: "mail", label: "Mail", icon: Mail, status: "Ready to Sync" },
  { id: "cloud", label: "Cloud", icon: Cloud, status: "Ready to Sync" },
  { id: "chat", label: "Chat", icon: MessageSquare, status: "Ready to Sync" },
  { id: "code", label: "Code", icon: Github, status: "Ready to Sync" },
  { id: "docs", label: "Docs", icon: FileText, status: "Ready to Sync" },
];

export default function ConnectionSection() {
  const [hovered, setHovered] = useState(null);
  const [connected, setConnected] = useState([]);

  const toggleConnect = (id) => {
    setConnected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0C10] text-white">
      <header className="px-6 py-5 md:px-12">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">
          Connection
        </h1>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          The Engine Room · Sync Your Ecosystem
        </p>
      </header>

      <div className="px-6 md:px-12">
        <p className="max-w-xl text-[15px] leading-relaxed text-white/60">
          Jabber lives in the spaces between your tools. Connect a node and it
          becomes part of the ambient layer — listened to, understood, acted
          upon.
        </p>

        {/* Node grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {NODES.map((node) => {
            const Icon = node.icon;
            const isHovered = hovered === node.id;
            const isConnected = connected.includes(node.id);
            return (
              <button
                key={node.id}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => toggleConnect(node.id)}
                className="group relative flex min-h-[180px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:bg-white/[0.04]"
                style={{
                  boxShadow: isHovered
                    ? "0 0 60px -10px rgba(42, 82, 190, 0.45)"
                    : "none",
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-500"
                  style={{
                    borderColor: isHovered || isConnected ? "#2A52BE" : "rgba(255,255,255,0.15)",
                    boxShadow:
                      isHovered || isConnected
                        ? "0 0 30px rgba(42, 82, 190, 0.5)"
                        : "none",
                  }}
                >
                  <Icon
                    className="h-6 w-6 transition-colors duration-500"
                    strokeWidth={1.5}
                    style={{
                      color: isHovered || isConnected ? "#2A52BE" : "rgba(255,255,255,0.6)",
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-body text-sm font-medium">{node.label}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
                    {isConnected ? "Connected" : isHovered ? node.status : "Idle"}
                  </p>
                </div>
                {isConnected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              Active Connections
            </span>
            <span className="font-mono text-sm text-primary">
              {connected.length} / {NODES.length}
            </span>
          </div>
        </div>

        <p className="mt-8 pb-12 font-mono text-[10px] uppercase tracking-wider text-white/30">
          Placeholder · no real data is exchanged
        </p>
      </div>
    </div>
  );
}
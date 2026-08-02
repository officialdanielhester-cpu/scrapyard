import React from "react";

// Embellishments for the Fit Maker decorate tool. Each decoration renders as
// self-contained SVG children centered at the origin within roughly a ±16 box.
export const DECORATIONS = [
  {
    id: "jewel", name: "Jewel", defaultColor: "#a855f7",
    render: (c) => (
      <>
        <polygon points="0,-11 10,-3 6,10 -6,10 -10,-3" fill={c} stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <polygon points="0,-11 10,-3 0,-2 -10,-3" fill="rgba(255,255,255,0.45)" />
      </>
    ),
  },
  {
    id: "pearl", name: "Pearl", defaultColor: "#f8fafc",
    render: (c) => (
      <>
        <circle r="7.5" fill={c} stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
        <circle cx="-2.2" cy="-2.2" r="2.6" fill="rgba(255,255,255,0.85)" />
      </>
    ),
  },
  {
    id: "button", name: "Button", defaultColor: "#1f2937",
    render: (c) => (
      <>
        <circle r="7.5" fill={c} stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
        <circle cx="-3" cy="0" r="1" fill="rgba(0,0,0,0.45)" />
        <circle cx="3" cy="0" r="1" fill="rgba(0,0,0,0.45)" />
      </>
    ),
  },
  {
    id: "stud", name: "Stud", defaultColor: "#cbd5e1",
    render: (c) => (
      <>
        <circle r="5.5" fill={c} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
        <circle cx="-1.6" cy="-1.6" r="1.7" fill="rgba(255,255,255,0.7)" />
      </>
    ),
  },
  {
    id: "sequin", name: "Sequin", defaultColor: "#f472b6",
    render: (c) => (
      <>
        <circle r="6.5" fill={c} opacity="0.9" />
        <circle r="6.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <circle cx="-2" cy="-2" r="2" fill="rgba(255,255,255,0.6)" />
      </>
    ),
  },
  {
    id: "bow", name: "Bow", defaultColor: "#ec4899",
    render: (c) => (
      <>
        <path d="M-11,-5 L-2,0 L-11,5 Z" fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
        <path d="M11,-5 L2,0 L11,5 Z" fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
        <rect x="-3" y="-4.5" width="6" height="9" rx="1.5" fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
      </>
    ),
  },
  {
    id: "frill", name: "Frill", defaultColor: "#f9a8d4",
    render: (c) => (
      <path d="M-15,0 Q-11,-7 -7,0 Q-3,7 1,0 Q5,-7 9,0 Q13,7 15,0" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
    ),
  },
  {
    id: "lace", name: "Lace", defaultColor: "#f5f5f4",
    render: (c) => (
      <path d="M-15,2 Q-11,-4 -7,2 Q-3,8 1,2 Q5,-4 9,2 Q13,8 15,2" fill="none" stroke={c} strokeWidth="1.4" />
    ),
  },
  {
    id: "zipper", name: "Zipper", defaultColor: "#94a3b8",
    render: (c) => (
      <>
        <line x1="0" y1="-13" x2="0" y2="13" stroke={c} strokeWidth="1.4" />
        {[-9, -6, -3, 0, 3, 6, 9].map((y) => <line key={y} x1="-3" y1={y} x2="3" y2={y} stroke={c} strokeWidth="1" />)}
        <rect x="-3" y="-15" width="6" height="4" rx="1" fill={c} />
      </>
    ),
  },
  {
    id: "patch", name: "Patch", defaultColor: "#f59e0b",
    render: (c) => (
      <>
        <rect x="-10" y="-8" width="20" height="16" rx="3" fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
        <rect x="-11" y="-9" width="22" height="18" rx="3" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" strokeDasharray="2 2" />
      </>
    ),
  },
  {
    id: "star", name: "Star", defaultColor: "#fbbf24",
    render: (c) => (
      <polygon points="0,-10 3,-3 10,-3 4.5,2 6.5,9 0,5 -6.5,9 -4.5,2 -10,-3 -3,-3" fill={c} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
    ),
  },
  {
    id: "chain", name: "Chain", defaultColor: "#d4af37",
    render: (c) => (
      <>
        {[[-9, 0], [-3, 0], [3, 0], [9, 0]].map(([cx], i) => (
          <ellipse key={i} cx={cx} cy="0" rx="3" ry="4" fill="none" stroke={c} strokeWidth="1.6" />
        ))}
      </>
    ),
  },
];

export const DECOR_BY_ID = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]));
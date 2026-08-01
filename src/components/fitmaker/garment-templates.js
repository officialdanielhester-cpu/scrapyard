// Parametric blank garment templates. Each template is a set of named SVG
// path groups; the canvas renders them, applies measurement transforms to
// specific groups, and overlays optional feature graphics.

const VB = "0 0 300 360";

export const TEMPLATES = [
  {
    id: "tshirt", name: "T-Shirt", category: "Tops", viewBox: VB, defaultColor: "#a855f7", defaultMaterial: "cotton",
    groups: [
      { id: "sleeveL", d: "M100,82 L62,100 L54,154 L76,164 L98,142 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,82 L238,100 L246,154 L224,164 L202,142 Z", role: "sleeve" },
      { id: "body", d: "M122,74 L100,82 L96,144 L100,300 Q100,316 116,316 L184,316 Q200,316 200,300 L204,144 L200,82 L178,74 Q150,90 122,74 Z", role: "body" },
      { id: "collar", d: "M122,74 Q150,94 178,74 L170,66 Q150,82 130,66 Z", role: "collar" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 82], default: 18, min: 8, max: 60 },
      bodyLength:   { label: "Body Length",  group: "body",   axis: "y", pivot: [150, 82], default: 240, min: 160, max: 300 },
      chestWidth:   { label: "Chest Width",  group: "body",   axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
      collarSize:   { label: "Collar Size",  group: "collar", axis: "x", pivot: [150, 74], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "pocket", label: "Chest Pocket", defaultOn: false, paths: [{ d: "M118,168 L168,168 L163,202 L123,202 Z", role: "detail" }] },
      { id: "graphic", label: "Graphic Print", defaultOn: false, paths: [{ d: "M130,150 Q150,130 170,150 Q150,180 130,150 Z", fill: "#ffffff55" }] },
    ],
  },
  {
    id: "longsleeve", name: "Long Sleeve", category: "Tops", viewBox: VB, defaultColor: "#7c3aed", defaultMaterial: "cotton",
    groups: [
      { id: "sleeveL", d: "M100,82 L60,100 L46,150 L42,250 L62,256 L78,160 L98,142 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,82 L240,100 L254,150 L258,250 L238,256 L222,160 L202,142 Z", role: "sleeve" },
      { id: "body", d: "M122,74 L100,82 L96,144 L100,300 Q100,316 116,316 L184,316 Q200,316 200,300 L204,144 L200,82 L178,74 Q150,90 122,74 Z", role: "body" },
      { id: "collar", d: "M122,74 Q150,94 178,74 L170,66 Q150,82 130,66 Z", role: "collar" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 82], default: 60, min: 30, max: 90 },
      bodyLength:   { label: "Body Length",  group: "body",   axis: "y", pivot: [150, 82], default: 240, min: 160, max: 300 },
      chestWidth:   { label: "Chest Width",  group: "body",   axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
      cuffWidth:    { label: "Cuff Width",   group: "sleeve", axis: "x", pivot: [54, 250], default: 1, min: 0.6, max: 1.3 },
    },
    features: [
      { id: "cuffs", label: "Ribbed Cuffs", defaultOn: true, paths: [{ d: "M42,246 L62,252 L62,256 L42,250 Z", role: "detail" }, { d: "M258,246 L238,252 L238,256 L258,250 Z", role: "detail" }] },
      { id: "buttons", label: "Placket Buttons", defaultOn: false, paths: [{ d: "M150,100 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,140 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,180 a3,3 0 1,0 0.1,0 Z", role: "detail" }] },
    ],
  },
  {
    id: "hoodie", name: "Hoodie", category: "Tops", viewBox: VB, defaultColor: "#6d28d9", defaultMaterial: "fleece",
    groups: [
      { id: "sleeveL", d: "M100,86 L60,104 L46,150 L42,260 L62,266 L78,160 L98,146 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,86 L240,104 L254,150 L258,260 L238,266 L222,160 L202,146 Z", role: "sleeve" },
      { id: "body", d: "M122,80 L100,86 L96,150 L100,320 Q100,336 116,336 L184,336 Q200,336 200,320 L204,150 L200,86 L178,80 Q150,96 122,80 Z", role: "body" },
      { id: "hood", d: "M118,80 Q150,26 182,80 Q188,40 150,24 Q112,40 118,80 Z", role: "detail" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 86], default: 60, min: 30, max: 90 },
      bodyLength:   { label: "Body Length",  group: "body",   axis: "y", pivot: [150, 86], default: 256, min: 180, max: 320 },
      chestWidth:   { label: "Chest Width",  group: "body",   axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
      hoodSize:     { label: "Hood Size",    group: "hood",   axis: "y", pivot: [150, 80], default: 1, min: 0.7, max: 1.3 },
    },
    features: [
      { id: "pocket", label: "Kangaroo Pocket", defaultOn: true, paths: [{ d: "M104,210 L196,210 L186,256 L114,256 Z", role: "detail" }] },
      { id: "drawstrings", label: "Drawstrings", defaultOn: true, paths: [{ d: "M140,80 L140,120", role: "detail" }, { d: "M160,80 L160,120", role: "detail" }] },
    ],
  },
  {
    id: "tanktop", name: "Tank Top", category: "Tops", viewBox: VB, defaultColor: "#9333ea", defaultMaterial: "cotton",
    groups: [
      { id: "strapL", d: "M120,74 L116,44 L128,42 L132,74 Z", role: "sleeve" },
      { id: "strapR", d: "M180,74 L184,44 L172,42 L168,74 Z", role: "sleeve" },
      { id: "body", d: "M120,74 L112,80 L104,90 L100,300 Q100,316 116,316 L184,316 Q200,316 200,300 L196,90 L188,80 L180,74 Q168,92 150,92 Q132,92 120,74 Z", role: "body" },
    ],
    measurements: {
      bodyLength: { label: "Body Length", group: "body", axis: "y", pivot: [150, 82], default: 240, min: 160, max: 300 },
      chestWidth:  { label: "Chest Width", group: "body", axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
      strapWidth:  { label: "Strap Width", group: "sleeve", axis: "x", pivot: [124, 60], default: 1, min: 0.5, max: 1.6 },
    },
    features: [],
  },
  {
    id: "polo", name: "Polo Shirt", category: "Tops", viewBox: VB, defaultColor: "#8b5cf6", defaultMaterial: "cotton",
    groups: [
      { id: "sleeveL", d: "M100,82 L66,98 L58,148 L78,156 L98,140 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,82 L234,98 L242,148 L222,156 L202,140 Z", role: "sleeve" },
      { id: "body", d: "M122,74 L100,82 L96,144 L100,300 Q100,316 116,316 L184,316 Q200,316 200,300 L204,144 L200,82 L178,74 Q150,90 122,74 Z", role: "body" },
      { id: "collar", d: "M122,74 L118,86 L150,100 L182,86 L178,74 Q150,90 122,74 Z", role: "collar" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 82], default: 16, min: 8, max: 50 },
      bodyLength:   { label: "Body Length",  group: "body",   axis: "y", pivot: [150, 82], default: 240, min: 160, max: 300 },
      chestWidth:   { label: "Chest Width",  group: "body",   axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "buttons", label: "Collar Buttons", defaultOn: true, paths: [{ d: "M150,110 a2.5,2.5 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,130 a2.5,2.5 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,150 a2.5,2.5 0 1,0 0.1,0 Z", role: "detail" }] },
    ],
  },
  {
    id: "jeans", name: "Jeans", category: "Bottoms", viewBox: VB, defaultColor: "#3b82f6", defaultMaterial: "denim",
    groups: [
      { id: "waist", d: "M104,58 L196,58 L200,74 L100,74 Z", role: "collar" },
      { id: "legL", d: "M100,74 L96,150 L106,340 L140,340 L144,150 L150,74 Z", role: "body" },
      { id: "legR", d: "M200,74 L204,150 L194,340 L160,340 L156,150 L150,74 Z", role: "body" },
    ],
    measurements: {
      legLength: { label: "Leg Length", group: "body", axis: "y", pivot: [150, 74], default: 266, min: 160, max: 320 },
      waistWidth: { label: "Waist Width", group: "collar", axis: "x", pivot: [150, 66], default: 1, min: 0.7, max: 1.3 },
      hipWidth:  { label: "Hip Width",  group: "body",   axis: "x", pivot: [150, 90], default: 1, min: 0.7, max: 1.3 },
    },
    features: [
      { id: "pockets", label: "Front Pockets", defaultOn: true, paths: [{ d: "M104,80 L120,120 L108,120 Z", role: "detail" }, { d: "M196,80 L180,120 L192,120 Z", role: "detail" }] },
      { id: "fly", label: "Zipper Fly", defaultOn: true, paths: [{ d: "M150,74 L150,150", role: "detail" }] },
    ],
  },
  {
    id: "shorts", name: "Shorts", category: "Bottoms", viewBox: VB, defaultColor: "#ec4899", defaultMaterial: "cotton",
    groups: [
      { id: "waist", d: "M104,58 L196,58 L200,74 L100,74 Z", role: "collar" },
      { id: "legL", d: "M100,74 L96,150 L120,150 L124,74 Z", role: "body" },
      { id: "legR", d: "M200,74 L204,150 L180,150 L176,74 Z", role: "body" },
    ],
    measurements: {
      legLength: { label: "Leg Length", group: "body", axis: "y", pivot: [150, 74], default: 80, min: 40, max: 180 },
      waistWidth: { label: "Waist Width", group: "collar", axis: "x", pivot: [150, 66], default: 1, min: 0.7, max: 1.3 },
    },
    features: [],
  },
  {
    id: "jacket", name: "Jacket", category: "Outerwear", viewBox: VB, defaultColor: "#1f2937", defaultMaterial: "leather",
    groups: [
      { id: "sleeveL", d: "M100,86 L62,104 L48,150 L44,260 L64,266 L80,160 L98,148 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,86 L238,104 L252,150 L256,260 L236,266 L220,160 L202,148 Z", role: "sleeve" },
      { id: "body", d: "M122,80 L100,86 L96,150 L100,300 Q100,316 116,316 L184,316 Q200,316 200,300 L204,150 L200,86 L178,80 Q150,96 122,80 Z", role: "body" },
      { id: "lapelL", d: "M122,80 L150,150 L140,300 L120,300 L116,150 Z", role: "detail" },
      { id: "lapelR", d: "M178,80 L150,150 L160,300 L180,300 L184,150 Z", role: "detail" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 86], default: 60, min: 30, max: 90 },
      bodyLength:   { label: "Body Length",  group: "body",   axis: "y", pivot: [150, 86], default: 240, min: 160, max: 320 },
      chestWidth:   { label: "Chest Width",  group: "body",   axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "zipper", label: "Center Zipper", defaultOn: true, paths: [{ d: "M150,96 L150,300", role: "detail" }] },
      { id: "pockets", label: "Side Pockets", defaultOn: true, paths: [{ d: "M104,200 L140,200 L138,240 L106,240 Z", role: "detail" }, { d: "M196,200 L160,200 L162,240 L194,240 Z", role: "detail" }] },
      { id: "buttons", label: "Buttons", defaultOn: false, paths: [{ d: "M150,130 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,180 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,230 a3,3 0 1,0 0.1,0 Z", role: "detail" }] },
    ],
  },
  {
    id: "dress", name: "Dress", category: "Full Body", viewBox: VB, defaultColor: "#f43f5e", defaultMaterial: "satin",
    groups: [
      { id: "strapL", d: "M124,72 L120,46 L132,44 L136,72 Z", role: "sleeve" },
      { id: "strapR", d: "M176,72 L180,46 L168,44 L164,72 Z", role: "sleeve" },
      { id: "bodice", d: "M124,72 L116,84 L108,170 L150,178 L192,170 L184,84 L176,72 Q150,92 124,72 Z", role: "body" },
      { id: "skirt", d: "M108,170 L150,178 L192,170 L210,330 L90,330 Z", role: "body" },
    ],
    measurements: {
      bodyLength: { label: "Dress Length", group: "body", axis: "y", pivot: [150, 72], default: 260, min: 180, max: 320 },
      waistWidth: { label: "Waist Width",  group: "body", axis: "x", pivot: [150, 170], default: 1, min: 0.7, max: 1.3 },
      hemWidth:   { label: "Hem Width",    group: "body", axis: "x", pivot: [150, 320], default: 1, min: 0.8, max: 1.6 },
    },
    features: [
      { id: "belt", label: "Waist Belt", defaultOn: false, paths: [{ d: "M112,166 L188,166 L186,182 L114,182 Z", role: "detail" }] },
    ],
  },
  {
    id: "sneaker", name: "Sneaker", category: "Footwear", viewBox: "0 0 300 280", defaultColor: "#f8fafc", defaultMaterial: "leather",
    groups: [
      { id: "sole", d: "M30,200 L40,190 L260,190 L272,200 L272,214 L30,214 Z", role: "body" },
      { id: "upper", d: "M40,190 L70,120 Q90,90 140,96 L230,150 L260,190 Z", role: "body" },
      { id: "tongue", d: "M70,120 L90,96 L120,110 L110,150 Z", role: "detail" },
    ],
    measurements: {
      bodyLength: { label: "Length", group: "body", axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.3 },
      shoeHeight: { label: "Height", group: "body", axis: "y", pivot: [150, 200], default: 1, min: 0.6, max: 1.4 },
    },
    features: [
      { id: "laces", label: "Laces", defaultOn: true, paths: [{ d: "M80,130 L150,160", role: "detail" }, { d: "M90,118 L150,148", role: "detail" }, { d: "M100,108 L150,138", role: "detail" }] },
      { id: "logo", label: "Side Logo", defaultOn: false, paths: [{ d: "M150,170 a14,8 0 1,0 0.1,0 Z", fill: "#ffffff66" }] },
    ],
  },
  {
    id: "cap", name: "Cap", category: "Accessories", viewBox: "0 0 300 240", defaultColor: "#0f172a", defaultMaterial: "cotton",
    groups: [
      { id: "crown", d: "M120,120 Q88,120 88,152 L88,168 Q88,178 100,178 L168,178 Q168,120 120,120 Z", role: "body" },
      { id: "brim", d: "M168,168 L246,170 L256,188 L180,186 Z", role: "detail" },
    ],
    measurements: {
      bodyLength: { label: "Crown Size", group: "body", axis: "x", pivot: [130, 150], default: 1, min: 0.7, max: 1.3 },
    },
    features: [
      { id: "logo", label: "Front Logo", defaultOn: false, paths: [{ d: "M120,140 a10,10 0 1,0 0.1,0 Z", fill: "#ffffff55" }] },
    ],
  },
];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export const CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories", "Full Body"];

export function defaultMeasurements(tpl) {
  const m = {};
  Object.entries(tpl.measurements).forEach(([k, v]) => (m[k] = v.default));
  return m;
}

export function defaultFeatures(tpl) {
  return (tpl.features || []).filter((f) => f.defaultOn).map((f) => f.id);
}

export function defaultState(tpl) {
  return {
    color: tpl.defaultColor,
    color2: "",
    gradient: false,
    finish: "matte",
    material: tpl.defaultMaterial,
    materialProps: {},
    measurements: defaultMeasurements(tpl),
    features: defaultFeatures(tpl),
    patternUrl: "",
  };
}
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
  {
    id: "skirt", name: "Skirt", category: "Bottoms", viewBox: VB, defaultColor: "#ec4899", defaultMaterial: "satin",
    groups: [
      { id: "waist", d: "M104,70 L196,70 L196,92 L104,92 Z", role: "collar" },
      { id: "skirt", d: "M104,92 L196,92 L224,300 L76,300 Z", role: "body" },
    ],
    measurements: {
      skirtLength: { label: "Length", group: "body", axis: "y", pivot: [150, 92], default: 208, min: 110, max: 300 },
      waistWidth: { label: "Waist", group: "collar", axis: "x", pivot: [150, 80], default: 1, min: 0.7, max: 1.3 },
    },
    features: [
      { id: "slit", label: "Side Slit", defaultOn: false, paths: [{ d: "M210,180 L224,300", role: "detail" }] },
      { id: "pleats", label: "Pleats", defaultOn: false, paths: [{ d: "M130,92 L118,300", role: "detail" }, { d: "M170,92 L182,300", role: "detail" }] },
    ],
  },
  {
    id: "blouse", name: "Blouse", category: "Tops", viewBox: VB, defaultColor: "#f9fafb", defaultMaterial: "silk",
    groups: [
      { id: "sleeveL", d: "M122,82 L80,96 L70,150 L92,158 L110,140 Z", role: "sleeve" },
      { id: "sleeveR", d: "M178,82 L220,96 L230,150 L208,158 L190,140 Z", role: "sleeve" },
      { id: "body", d: "M122,74 L100,82 L94,150 L100,310 Q100,322 114,322 L186,322 Q200,322 200,310 L206,150 L200,82 L178,74 Q150,92 122,74 Z", role: "body" },
      { id: "collar", d: "M122,74 Q150,96 178,74 L172,64 Q150,84 128,64 Z", role: "collar" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 82], default: 22, min: 10, max: 60 },
      bodyLength: { label: "Body Length", group: "body", axis: "y", pivot: [150, 82], default: 248, min: 170, max: 320 },
      chestWidth: { label: "Chest Width", group: "body", axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "bow", label: "Bow Tie", defaultOn: true, paths: [{ d: "M140,86 L150,96 L160,86 L160,104 L150,96 L140,104 Z", role: "detail" }] },
      { id: "cuffs", label: "Cuffed Sleeves", defaultOn: false, paths: [{ d: "M70,146 L92,154 L92,158 L70,150 Z", role: "detail" }, { d: "M230,146 L208,154 L208,158 L230,150 Z", role: "detail" }] },
    ],
  },
  {
    id: "coat", name: "Coat", category: "Outerwear", viewBox: VB, defaultColor: "#1e293b", defaultMaterial: "wool",
    groups: [
      { id: "sleeveL", d: "M100,86 L58,104 L44,150 L40,270 L62,276 L80,160 L98,148 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,86 L242,104 L256,150 L260,270 L238,276 L220,160 L202,148 Z", role: "sleeve" },
      { id: "body", d: "M122,80 L100,86 L94,150 L98,330 Q98,344 114,344 L186,344 Q202,344 202,330 L206,150 L200,86 L178,80 Q150,96 122,80 Z", role: "body" },
      { id: "lapelL", d: "M122,80 L150,160 L138,330 L116,330 L112,150 Z", role: "detail" },
      { id: "lapelR", d: "M178,80 L150,160 L162,330 L184,330 L188,150 Z", role: "detail" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 86], default: 70, min: 40, max: 100 },
      bodyLength: { label: "Length", group: "body", axis: "y", pivot: [150, 86], default: 264, min: 180, max: 340 },
      chestWidth: { label: "Chest Width", group: "body", axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "belt", label: "Belt", defaultOn: true, paths: [{ d: "M96,210 L204,210 L200,230 L100,230 Z", role: "detail" }] },
      { id: "buttons", label: "Buttons", defaultOn: true, paths: [{ d: "M150,160 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,200 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,240 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,280 a3,3 0 1,0 0.1,0 Z", role: "detail" }] },
      { id: "collar", label: "Fur Collar", defaultOn: false, paths: [{ d: "M120,80 Q150,108 180,80 Q180,98 150,98 Q120,98 120,80 Z", role: "detail" }] },
    ],
  },
  {
    id: "overalls", name: "Overalls", category: "Full Body", viewBox: VB, defaultColor: "#7c3aed", defaultMaterial: "denim",
    groups: [
      { id: "bib", d: "M120,72 L180,72 L180,150 L120,150 Z", role: "body" },
      { id: "strapL", d: "M120,72 L116,40 L130,40 L130,72 Z", role: "sleeve" },
      { id: "strapR", d: "M180,72 L184,40 L170,40 L170,72 Z", role: "sleeve" },
      { id: "legL", d: "M120,150 L100,150 L96,330 L138,330 L142,150 Z", role: "body" },
      { id: "legR", d: "M180,150 L200,150 L204,330 L162,330 L158,150 Z", role: "body" },
    ],
    measurements: {
      bodyLength: { label: "Length", group: "body", axis: "y", pivot: [150, 150], default: 180, min: 120, max: 260 },
      chestWidth: { label: "Width", group: "body", axis: "x", pivot: [150, 150], default: 1, min: 0.7, max: 1.3 },
    },
    features: [
      { id: "pocket", label: "Front Pocket", defaultOn: true, paths: [{ d: "M126,90 L174,90 L174,130 L126,130 Z", role: "detail" }] },
      { id: "buckles", label: "Buckles", defaultOn: true, paths: [{ d: "M118,44 a6,4 0 1,0 0.1,0 Z", role: "detail" }, { d: "M182,44 a6,4 0 1,0 0.1,0 Z", role: "detail" }] },
    ],
  },
  {
    id: "cardigan", name: "Cardigan", category: "Tops", viewBox: VB, defaultColor: "#9333ea", defaultMaterial: "knit",
    groups: [
      { id: "sleeveL", d: "M100,86 L60,104 L46,150 L42,250 L62,256 L78,160 L98,146 Z", role: "sleeve" },
      { id: "sleeveR", d: "M200,86 L240,104 L254,150 L258,250 L238,256 L222,160 L202,146 Z", role: "sleeve" },
      { id: "bodyL", d: "M122,80 L100,86 L96,150 L100,300 Q100,316 116,316 L150,316 L150,80 Q136,96 122,80 Z", role: "body" },
      { id: "bodyR", d: "M178,80 L200,86 L204,150 L200,300 Q200,316 184,316 L150,316 L150,80 Q164,96 178,80 Z", role: "body" },
    ],
    measurements: {
      sleeveLength: { label: "Sleeve Length", group: "sleeve", axis: "y", pivot: [150, 86], default: 50, min: 30, max: 90 },
      bodyLength: { label: "Body Length", group: "body", axis: "y", pivot: [150, 86], default: 236, min: 160, max: 320 },
      chestWidth: { label: "Chest Width", group: "body", axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "buttons", label: "Buttons", defaultOn: true, paths: [{ d: "M150,120 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,160 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,200 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,240 a3,3 0 1,0 0.1,0 Z", role: "detail" }] },
      { id: "pockets", label: "Patch Pockets", defaultOn: false, paths: [{ d: "M104,220 L140,220 L138,250 L106,250 Z", role: "detail" }, { d: "M196,220 L160,220 L162,250 L194,250 Z", role: "detail" }] },
    ],
  },
  {
    id: "gown", name: "Gown", category: "Full Body", viewBox: VB, defaultColor: "#1e3a8a", defaultMaterial: "satin",
    groups: [
      { id: "strapL", d: "M126,72 L122,46 L134,44 L138,72 Z", role: "sleeve" },
      { id: "strapR", d: "M174,72 L178,46 L166,44 L162,72 Z", role: "sleeve" },
      { id: "bodice", d: "M126,72 L118,84 L106,170 L150,178 L194,170 L182,84 L174,72 Q150,94 126,72 Z", role: "body" },
      { id: "skirt", d: "M106,170 L150,178 L194,170 L226,340 L74,340 Z", role: "body" },
    ],
    measurements: {
      bodyLength: { label: "Length", group: "body", axis: "y", pivot: [150, 72], default: 268, min: 180, max: 340 },
      waistWidth: { label: "Waist", group: "body", axis: "x", pivot: [150, 170], default: 1, min: 0.7, max: 1.3 },
      hemWidth: { label: "Hem", group: "body", axis: "x", pivot: [150, 320], default: 1, min: 0.8, max: 1.6 },
    },
    features: [
      { id: "train", label: "Train", defaultOn: false, paths: [{ d: "M74,340 L226,340 L240,356 L60,356 Z", role: "detail" }] },
      { id: "slit", label: "Leg Slit", defaultOn: false, paths: [{ d: "M150,250 L150,340", role: "detail" }] },
    ],
  },
  {
    id: "vest", name: "Vest", category: "Outerwear", viewBox: VB, defaultColor: "#92400e", defaultMaterial: "leather",
    groups: [
      { id: "bodyL", d: "M118,76 L96,86 L92,150 L96,300 Q96,316 112,316 L150,316 L150,76 Q134,92 118,76 Z", role: "body" },
      { id: "bodyR", d: "M182,76 L204,86 L208,150 L204,300 Q204,316 188,316 L150,316 L150,76 Q166,92 182,76 Z", role: "body" },
      { id: "collar", d: "M118,76 L150,100 L182,76 L172,66 Q150,86 128,66 Z", role: "collar" },
    ],
    measurements: {
      bodyLength: { label: "Length", group: "body", axis: "y", pivot: [150, 80], default: 240, min: 160, max: 320 },
      chestWidth: { label: "Chest", group: "body", axis: "x", pivot: [150, 200], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "buttons", label: "Buttons", defaultOn: true, paths: [{ d: "M150,120 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,160 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,200 a3,3 0 1,0 0.1,0 Z", role: "detail" }, { d: "M150,240 a3,3 0 1,0 0.1,0 Z", role: "detail" }] },
      { id: "pockets", label: "Welt Pockets", defaultOn: false, paths: [{ d: "M104,220 L138,220", role: "detail" }, { d: "M196,220 L162,220", role: "detail" }] },
    ],
  },
  {
    id: "scarf", name: "Scarf", category: "Accessories", viewBox: VB, defaultColor: "#dc2626", defaultMaterial: "silk",
    groups: [
      { id: "scarf", d: "M90,80 L210,80 L210,120 L150,140 L90,120 Z", role: "body" },
      { id: "tailL", d: "M90,120 L70,300 L96,300 L112,140 Z", role: "detail" },
      { id: "tailR", d: "M210,120 L230,300 L204,300 L188,140 Z", role: "detail" },
    ],
    measurements: {
      bodyLength: { label: "Length", group: "body", axis: "y", pivot: [150, 80], default: 60, min: 40, max: 120 },
      bodyWidth: { label: "Width", group: "body", axis: "x", pivot: [150, 100], default: 1, min: 0.7, max: 1.4 },
    },
    features: [
      { id: "fringe", label: "Fringe", defaultOn: true, paths: [{ d: "M70,296 L70,310", role: "detail" }, { d: "M78,296 L78,312", role: "detail" }, { d: "M86,296 L86,310", role: "detail" }, { d: "M224,296 L224,310", role: "detail" }, { d: "M216,296 L216,312", role: "detail" }, { d: "M208,296 L208,310", role: "detail" }] },
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
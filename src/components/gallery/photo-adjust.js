// Pure pixel pipeline + presets for the Lightroom-style photo editor.

export const DEFAULT_ADJ = {
  exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  temperature: 0, tint: 0, vibrance: 0, saturation: 0,
  clarity: 0, vignette: 0, grain: 0,
  straighten: 0, rot: 0, flipH: false, flipV: false,
};

export function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0 || 1e-6)));
  return t * t * (3 - 2 * t);
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

export function rotatedSize(w, h, deg) {
  const r = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  return { w: w * c + h * s, h: w * s + h * c };
}

export function rotSteps(rot) {
  return ((((rot || 0) % 4) + 4) % 4);
}

// Mutates ImageData in place with the full develop pipeline.
export function processPixels(imgData, adj) {
  const d = imgData.data;
  const w = imgData.width, h = imgData.height;
  const exposure = 1 + (adj.exposure || 0) / 100;
  const contrastF = 1 + (adj.contrast || 0) / 100;
  const satF = 1 + (adj.saturation || 0) / 100;
  const vibF = 1 + (adj.vibrance || 0) / 100;
  const temp = ((adj.temperature || 0) / 100) * 28;
  const tint = ((adj.tint || 0) / 100) * 28;
  const highlights = ((adj.highlights || 0) / 100) * 55;
  const shadows = ((adj.shadows || 0) / 100) * 55;
  const whites = ((adj.whites || 0) / 100) * 45;
  const blacks = ((adj.blacks || 0) / 100) * 45;
  const clarity = (adj.clarity || 0) / 100;
  const vignette = Math.max(0, (adj.vignette || 0) / 100);
  const grain = ((adj.grain || 0) / 100) * 38;
  const cx = w / 2, cy = h / 2;

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    // exposure + contrast
    r *= exposure; g *= exposure; b *= exposure;
    r = (r - 128) * contrastF + 128; g = (g - 128) * contrastF + 128; b = (b - 128) * contrastF + 128;
    // tonal ranges by luminance
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const hw = smoothstep(0.5, 1.0, lum);
    const sw = 1 - smoothstep(0.0, 0.5, lum);
    const ww = smoothstep(0.75, 1.0, lum);
    const bw = 1 - smoothstep(0.0, 0.25, lum);
    const midW = smoothstep(0.25, 0.5, lum) * (1 - smoothstep(0.5, 0.75, lum));
    const tone = highlights * hw + shadows * sw + whites * ww + blacks * bw;
    r += tone; g += tone; b += tone;
    // clarity (midtone contrast)
    const cf = 1 + clarity * midW;
    r = (r - 128) * cf + 128; g = (g - 128) * cf + 128; b = (b - 128) * cf + 128;
    // white balance
    r += temp; b -= temp; g -= tint;
    // saturation + vibrance (vibrance weighted toward less-saturated pixels)
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const pxSat = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    const factor = 1 + (satF - 1) + (vibF - 1) * (1 - pxSat);
    r = gray + (r - gray) * factor;
    g = gray + (g - gray) * factor;
    b = gray + (b - gray) * factor;
    // vignette
    if (vignette) {
      const x = p % w, y = (p / w) | 0;
      const dx = (x - cx) / cx, dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const v = Math.max(0, dist - 0.6) / 0.4;
      const vf = 1 - vignette * v;
      r *= vf; g *= vf; b *= vf;
    }
    // grain
    if (grain) {
      const n = (Math.random() - 0.5) * grain;
      r += n; g += n; b += n;
    }
    d[i] = clamp255(r); d[i + 1] = clamp255(g); d[i + 2] = clamp255(b);
  }
  return imgData;
}

export function computeHistogram(imgData) {
  const d = imgData.data;
  const r = new Uint32Array(256), g = new Uint32Array(256), b = new Uint32Array(256), lum = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    r[d[i]]++; g[d[i + 1]]++; b[d[i + 2]]++;
    lum[(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0]++;
  }
  return { r, g, b, lum };
}

export const PRESETS = [
  { name: "Original", adj: {} },
  { name: "B&W", adj: { saturation: -100 } },
  { name: "Vivid", adj: { vibrance: 45, saturation: 12, contrast: 18 } },
  { name: "Matte", adj: { contrast: -18, blacks: 35, highlights: -25, clarity: -15 } },
  { name: "Vintage", adj: { temperature: 28, tint: 12, saturation: -16, contrast: -8, vignette: 35, grain: 22 } },
  { name: "Cool", adj: { temperature: -30, vibrance: 18, clarity: 10 } },
  { name: "Warm", adj: { temperature: 32, vibrance: 12 } },
  { name: "Dramatic", adj: { contrast: 30, clarity: 35, highlights: -40, shadows: 25, vignette: 25 } },
];
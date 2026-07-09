import { base44 } from "@/api/base44Client";

const GEOMETRIES = ["box", "octahedron", "icosahedron", "tetrahedron", "dodecahedron", "torus", "sphere", "cone"];

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    image_prompt: { type: "string" },
    geometry: { type: "string", enum: GEOMETRIES },
    color: { type: "string" },
    scale: { type: "number" },
    rotX: { type: "number" },
    rotY: { type: "number" },
    rotZ: { type: "number" },
    metalness: { type: "number" },
    roughness: { type: "number" },
  },
  required: ["name", "image_prompt", "geometry", "color", "scale", "rotX", "rotY", "rotZ", "metalness", "roughness"],
};

const clamp = (v, min, max, fallback) =>
  typeof v === "number" && !Number.isNaN(v) ? Math.max(min, Math.min(max, v)) : fallback;

const sanitizeColor = (c) => {
  if (typeof c === "string" && /^#?[0-9a-fA-F]{6}$/.test(c)) {
    return c.startsWith("#") ? c : "#" + c;
  }
  return "#3B82F6";
};

export async function generateModel(text, mode) {
  const is3D = mode === "3d";
  const designPrompt = `You are Jabber, a model designer in an ambient intelligence app. The user wants a ${is3D ? "3D" : "2D"} model: "${text}".
Return JSON with:
- name: a short evocative title (max 4 words)
- image_prompt: a detailed visual description for an AI image generator depicting this exact object. Style: clean studio render, centered, dark background, no text, no watermark.${is3D ? " Suitable for wrapping onto a 3D surface." : ""}
${is3D ? `- geometry: best fit from [${GEOMETRIES.join(", ")}]
- color: hex color (e.g. #3B82F6)
- scale: 0.5 to 2.0
- rotX, rotY, rotZ: radians between -3.14 and 3.14
- metalness: 0 to 1
- roughness: 0 to 1` : `- geometry: "box"
- color: "#FFFFFF"
- scale: 1
- rotX: 0, rotY: 0, rotZ: 0
- metalness: 0, roughness: 1`}
Return only the JSON.`;

  const params = await base44.integrations.Core.InvokeLLM({
    prompt: designPrompt,
    response_json_schema: SCHEMA,
  });

  const img = await base44.integrations.Core.GenerateImage({ prompt: params.image_prompt });
  const imgUrl = img?.url || img;

  const geometry = is3D ? (GEOMETRIES.includes(params.geometry) ? params.geometry : "box") : "plane";
  return base44.entities.Model.create({
    name: (params.name || text.slice(0, 24)).slice(0, 48),
    prompt: text,
    mode,
    image_url: imgUrl,
    geometry,
    color: sanitizeColor(params.color),
    scale: clamp(params.scale, 0.4, 2.2, 1),
    rotX: clamp(params.rotX, -Math.PI, Math.PI, 0),
    rotY: clamp(params.rotY, -Math.PI, Math.PI, 0),
    rotZ: clamp(params.rotZ, -Math.PI, Math.PI, 0),
    metalness: clamp(params.metalness, 0, 1, 0.65),
    roughness: clamp(params.roughness, 0, 1, 0.22),
    brightness: 1,
    coolness: 0.5,
    sharpness: 0.5,
    bgColor: "#080B14",
    markup: [],
  });
}
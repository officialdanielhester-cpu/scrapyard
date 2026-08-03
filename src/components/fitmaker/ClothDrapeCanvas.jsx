import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { X, Wind, RotateCcw, Play, Pause, Shirt } from "lucide-react";

// ---- Cloth grid configuration ----
const COLS = 26;                 // horizontal subdivisions + 1
const ROWS = 34;                 // vertical subdivisions + 1
const CLOTH_W = 1.35;            // garment width (shoulders → sides)
const CLOTH_H = 2.05;            // garment length (shoulders → thighs)
const TOP_Y = 2.72;              // where the shoulders / pinned edge sits
const FRONT_Z = 0.34;            // initial offset in front of the body

const DAMPING = 0.03;
const GRAVITY = -9.4;
const ITER = 7;                  // constraint relaxation passes per frame

const STEP_X = CLOTH_W / (COLS - 1);
const STEP_Y = CLOTH_H / (ROWS - 1);
const SHEAR = Math.hypot(STEP_X, STEP_Y);
const BEND_X = STEP_X * 2;
const BEND_Y = STEP_Y * 2;

// ---- Mannequin body colliders (spheres) ----
// Each entry is both a collision sphere and a visual mesh spec.
const BODY = [
  { c: [0, 3.26, 0], r: 0.4, g: () => new THREE.SphereGeometry(0.4, 24, 18) },           // head
  { c: [0, 2.92, 0], r: 0.2, g: () => new THREE.CylinderGeometry(0.2, 0.2, 0.32, 18) },  // neck
  { c: [-0.42, 2.64, 0], r: 0.24, g: () => new THREE.SphereGeometry(0.24, 18, 14) },     // shoulder L
  { c: [0.42, 2.64, 0], r: 0.24, g: () => new THREE.SphereGeometry(0.24, 18, 14) },      // shoulder R
  { c: [0, 2.36, 0.14], r: 0.46, g: () => new THREE.SphereGeometry(0.46, 26, 18) },     // chest
  { c: [0, 1.78, 0.1], r: 0.43, g: () => new THREE.SphereGeometry(0.43, 24, 18) },      // abdomen
  { c: [0, 1.3, 0], r: 0.45, g: () => new THREE.SphereGeometry(0.45, 24, 18) },         // hips
  { c: [-0.72, 2.2, 0], r: 0.17, g: () => new THREE.CapsuleGeometry(0.15, 0.95, 8, 14) },// arm L
  { c: [0.72, 2.2, 0], r: 0.17, g: () => new THREE.CapsuleGeometry(0.15, 0.95, 8, 14) },// arm R
  { c: [-0.2, 0.78, 0], r: 0.26, g: () => new THREE.CapsuleGeometry(0.22, 1.15, 8, 14) },// leg L
  { c: [0.2, 0.78, 0], r: 0.26, g: () => new THREE.CapsuleGeometry(0.22, 1.15, 8, 14) }, // leg R
];

export default function ClothDrapeCanvas({ garmentImage, onClose }) {
  const mountRef = useRef(null);
  const [wind, setWind] = useState(0.3);
  const [running, setRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const windRef = useRef(0.3);
  const runningRef = useRef(true);

  useEffect(() => { windRef.current = wind; }, [wind]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600;
    const H = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.Fog(0x070b14, 7, 18);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    const target = new THREE.Vector3(0, 1.95, 0);
    let theta = 0.0, phi = 1.05, radius = 5.4;
    const placeCamera = () => {
      camera.position.x = target.x + radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(target);
    };
    placeCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x5566aa, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(3.5, 6.5, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3.5; key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 5.5; key.shadow.camera.bottom = -0.5;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x4477ff, 0.45);
    fill.position.set(-4, 3, -3);
    scene.add(fill);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(7, 56),
      new THREE.MeshStandardMaterial({ color: 0x0e1320, roughness: 0.96, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Mannequin meshes
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd8c0a0, roughness: 0.85, metalness: 0.04 });
    const colliders = BODY.map((b) => {
      const mesh = new THREE.Mesh(b.g(), skinMat);
      mesh.position.set(b.c[0], b.c[1], b.c[2]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      scene.add(mesh);
      return { center: new THREE.Vector3(b.c[0], b.c[1], b.c[2]), r: b.r };
    });

    // Cloth texture
    let texture = null;
    if (garmentImage) {
      texture = new THREE.TextureLoader().load(garmentImage);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    }
    const clothMat = new THREE.MeshStandardMaterial({
      map: texture || null,
      color: texture ? 0xffffff : 0x3b82f6,
      roughness: 0.68,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });

    // Build cloth grid geometry manually (row 0 = top/shoulders).
    const positions = new Float32Array(COLS * ROWS * 3);
    const uvs = new Float32Array(COLS * ROWS * 2);
    const indices = [];
    const idx = (r, c) => r * COLS + c;
    const particles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = -CLOTH_W / 2 + c * STEP_X;
        const y = TOP_Y - r * STEP_Y;
        const z = FRONT_Z;
        const p = idx(r, c);
        positions[p * 3] = x; positions[p * 3 + 1] = y; positions[p * 3 + 2] = z;
        uvs[p * 2] = c / (COLS - 1);
        uvs[p * 2 + 1] = 1 - r / (ROWS - 1);
        particles.push({ x, y, z, px: x, py: y, pz: z, pinned: false, ax: x, ay: y, az: z });
      }
    }
    // Pin the top row (shoulders) — every other point keeps it stable yet soft.
    for (let c = 0; c < COLS; c++) particles[idx(0, c)].pinned = (c % 2 === 0);
    // Also pin the two top corners firmly.
    particles[idx(0, 0)].pinned = true;
    particles[idx(0, COLS - 1)].pinned = true;

    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const a = idx(r, c), b = idx(r, c + 1), d = idx(r + 1, c), e = idx(r + 1, c + 1);
        indices.push(a, d, b, b, d, e);
      }
    }
    const clothGeo = new THREE.BufferGeometry();
    clothGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    clothGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    clothGeo.setIndex(indices);
    clothGeo.computeVertexNormals();
    const clothMesh = new THREE.Mesh(clothGeo, clothMat);
    clothMesh.castShadow = true; clothMesh.receiveShadow = true;
    clothMesh.frustumCulled = false;
    scene.add(clothMesh);

    // ---- Constraints ----
    const constraints = [];
    const add = (r1, c1, r2, c2, rest) => constraints.push([idx(r1, c1), idx(r2, c2), rest]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1) add(r, c, r, c + 1, STEP_X);          // structural (horizontal)
        if (r < ROWS - 1) add(r, c, r + 1, c, STEP_Y);          // structural (vertical)
        if (r < ROWS - 1 && c < COLS - 1) add(r, c, r + 1, c + 1, SHEAR); // shear
        if (r < ROWS - 1 && c > 0) add(r, c, r + 1, c - 1, SHEAR);       // shear
        if (c < COLS - 2) add(r, c, r, c + 2, BEND_X);          // bend (horizontal)
        if (r < ROWS - 2) add(r, c, r + 2, c, BEND_Y);          // bend (vertical)
      }
    }

    const solve = () => {
      for (let k = 0; k < ITER; k++) {
        for (let n = 0; n < constraints.length; n++) {
          const [ai, bi, rest] = constraints[n];
          const a = particles[ai], b = particles[bi];
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
          let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist === 0) continue;
          const diff = (dist - rest) / dist;
          const mx = dx * 0.5 * diff, my = dy * 0.5 * diff, mz = dz * 0.5 * diff;
          if (!a.pinned) { a.x += mx; a.y += my; a.z += mz; }
          if (!b.pinned) { b.x -= mx; b.y -= my; b.z -= mz; }
          if (a.pinned && !b.pinned) { b.x -= dx * diff; b.y -= dy * diff; b.z -= dz * diff; }
          if (b.pinned && !a.pinned) { a.x += dx * diff; a.y += dy * diff; a.z += dz * diff; }
        }
      }
    };

    const collide = () => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.pinned) continue;
        for (let s = 0; s < colliders.length; s++) {
          const col = colliders[s];
          const dx = p.x - col.center.x, dy = p.y - col.center.y, dz = p.z - col.center.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          const r = col.r + 0.03;
          if (d2 < r * r) {
            const d = Math.sqrt(d2) || 0.0001;
            const push = (r - d) / d;
            p.x += dx * push; p.y += dy * push; p.z += dz * push;
          }
        }
        if (p.y < 0.04) p.y = 0.04;          // ground
        if (p.x < -3) p.x = -3; else if (p.x > 3) p.x = 3;
      }
    };

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (runningRef.current) {
        const t = clock.getElapsedTime();
        const w = windRef.current;
        const wx = Math.sin(t * 1.3) * w * 2.2;
        const wz = (Math.cos(t * 0.7) * 0.5 + 0.5) * w * 1.6;
        const dt2 = (1 / 60) * (1 / 60);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.pinned) { p.x = p.ax; p.y = p.ay; p.z = p.az; p.px = p.ax; p.py = p.ay; p.pz = p.az; continue; }
          const vx = (p.x - p.px) * (1 - DAMPING);
          const vy = (p.y - p.py) * (1 - DAMPING);
          const vz = (p.z - p.pz) * (1 - DAMPING);
          p.px = p.x; p.py = p.y; p.pz = p.z;
          p.x += vx + wx * dt2;
          p.y += vy + GRAVITY * dt2;
          p.z += vz + wz * dt2;
        }
        solve();
        collide();
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
        }
        clothGeo.attributes.position.needsUpdate = true;
        clothGeo.computeVertexNormals();
      }
      renderer.render(scene, camera);
    };
    tick();

    // ---- Minimal orbit camera ----
    const canvas = renderer.domElement;
    let dragging = false, lastX = 0, lastY = 0;
    const onDown = (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      theta -= dx * 0.01;
      phi -= dy * 0.01;
      phi = Math.max(0.25, Math.min(1.45, phi));
      placeCamera();
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e) => { e.preventDefault(); radius = Math.max(3, Math.min(10, radius + e.deltaY * 0.005)); placeCamera(); };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      ro.disconnect();
      renderer.dispose();
      clothGeo.dispose(); clothMat.dispose(); skinMat.dispose();
      ground.geometry.dispose(); ground.material.dispose();
      colliders.forEach((_, s) => { BODY[s].g; });
      if (texture) texture.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentImage, resetKey]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <Shirt className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="font-heading text-sm font-bold tracking-tight">Drape Simulation</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Fabric physics · drag to orbit · scroll to zoom</span>
        <button onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={mountRef} className="relative flex-1 overflow-hidden" style={{ touchAction: "none" }} />

      {/* Control dock */}
      <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2.5">
        <button onClick={() => setRunning((r) => !r)} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary">
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {running ? "Pause" : "Play"}
        </button>
        <button onClick={() => setResetKey((k) => k + 1)} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <div className="flex items-center gap-2">
          <Wind className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Wind</span>
          <input type="range" min="0" max="1" step="0.05" value={wind} onChange={(e) => setWind(Number(e.target.value))} className="w-32 accent-primary" />
          <span className="w-8 font-mono text-[10px] text-muted-foreground">{Math.round(wind * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
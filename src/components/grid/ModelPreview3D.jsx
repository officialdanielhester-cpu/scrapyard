import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGeometry } from "@/components/grid/three-helpers";
import { styleFor, drawStroke, eraseNear } from "@/components/grid/markup-helpers";

const SIZE = 512;

function coverRect(iw, ih, W, H) {
  const s = Math.max(W / iw, H / ih);
  const w = iw * s;
  const h = ih * s;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

export default function ModelPreview3D({
  model,
  bgColor = "#080B14",
  adjust,
  paintMode = true,
  tool,
  color,
  size,
  onMarkupChange,
  onOrient,
}) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const imgLoadedRef = useRef(false);

  const paintModeRef = useRef(paintMode);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const onMarkupChangeRef = useRef(onMarkupChange);
  const onOrientRef = useRef(onOrient);
  const modelRef = useRef(model);
  const adjustRef = useRef(adjust);
  paintModeRef.current = paintMode;
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;
  onMarkupChangeRef.current = onMarkupChange;
  onOrientRef.current = onOrient;
  modelRef.current = model;
  adjustRef.current = adjust;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(4, 6, 5);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(-4, 2, -3);
    scene.add(ambient, key, fill);

    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.65,
      roughness: 0.22,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(createGeometry(modelRef.current.geometry || "box"), material);
    mesh.scale.setScalar(modelRef.current.scale || 1);
    mesh.rotation.set(modelRef.current.rotX || 0, modelRef.current.rotY || 0, modelRef.current.rotZ || 0);
    scene.add(mesh);

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";

    const drawBase = () => {
      const m = modelRef.current;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, SIZE, SIZE);
      if (imgLoadedRef.current && baseImg.naturalWidth) {
        const ir = coverRect(baseImg.naturalWidth, baseImg.naturalHeight, SIZE, SIZE);
        ctx.drawImage(baseImg, ir.x, ir.y, ir.w, ir.h);
      } else {
        ctx.fillStyle = m.color || "#3B82F6";
        ctx.fillRect(0, 0, SIZE, SIZE);
      }
      (m.markup || []).forEach((s) => drawStroke(ctx, s, SIZE, SIZE));
      texture.needsUpdate = true;
    };
    baseImg.onload = () => {
      imgLoadedRef.current = true;
      drawBase();
    };
    if (modelRef.current.image_url) baseImg.src = modelRef.current.image_url;
    else drawBase();

    const applyAdjust = (a) => {
      const b = a?.brightness ?? 1;
      const c = a?.coolness ?? 0.5;
      const s = a?.sharpness ?? 0.5;
      ambient.intensity = 0.5 * b;
      key.intensity = 1.2 * b;
      fill.intensity = 0.55 * b;
      const warm = Math.max(0, 0.5 - c);
      const cool = Math.max(0, c - 0.5);
      const target = new THREE.Color();
      if (cool > 0) target.setHex(0x6699ff);
      else if (warm > 0) target.setHex(0xffaa66);
      const t = Math.min(1, Math.max(cool, warm) * 2);
      key.color.copy(new THREE.Color(0xffffff).lerp(target, t));
      const maxA = renderer.capabilities.getMaxAnisotropy();
      texture.anisotropy = Math.max(1, Math.round(maxA * s));
      texture.needsUpdate = true;
    };
    applyAdjust(adjustRef.current);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let curStroke = null;
    let lastPt = null;
    let orbiting = false;
    let orbitRot = null;
    let lastOrbit = null;
    let erasing = false;

    const toUV = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(mesh, false);
      if (!hits.length || !hits[0].uv) return null;
      return [hits[0].uv.x, 1 - hits[0].uv.y];
    };

    const eraseAtUV = (e) => {
      const p = toUV(e);
      if (!p) return;
      const before = modelRef.current.markup || [];
      const after = eraseNear(before, [p], 0.05);
      if (after.length !== before.length) onMarkupChangeRef.current && onMarkupChangeRef.current(after);
    };

    const paintDown = (e) => {
      if (toolRef.current === "eraser") {
        erasing = true;
        eraseAtUV(e);
        return;
      }
      const p = toUV(e);
      if (!p) return;
      e.preventDefault();
      curStroke = { tool: toolRef.current, color: colorRef.current, width: sizeRef.current, points: [p] };
      lastPt = p;
      styleFor(ctx, curStroke.tool, curStroke.color, curStroke.width);
      ctx.beginPath();
      ctx.moveTo(p[0] * SIZE, p[1] * SIZE);
      ctx.lineTo(p[0] * SIZE + 0.01, p[1] * SIZE);
      ctx.stroke();
      texture.needsUpdate = true;
    };

    const paintMove = (e) => {
      if (toolRef.current === "eraser") {
        if (erasing) eraseAtUV(e);
        return;
      }
      if (!curStroke) return;
      const p = toUV(e);
      if (!p) return;
      e.preventDefault();
      styleFor(ctx, curStroke.tool, curStroke.color, curStroke.width);
      ctx.beginPath();
      ctx.moveTo(lastPt[0] * SIZE, lastPt[1] * SIZE);
      ctx.lineTo(p[0] * SIZE, p[1] * SIZE);
      ctx.stroke();
      texture.needsUpdate = true;
      curStroke.points.push(p);
      lastPt = p;
    };

    const onDown = (e) => {
      if (paintModeRef.current) {
        paintDown(e);
      } else {
        orbiting = true;
        orbitRot = { x: modelRef.current.rotX || 0, y: modelRef.current.rotY || 0 };
        lastOrbit = { x: e.clientX, y: e.clientY };
      }
    };
    const onMove = (e) => {
      if (paintModeRef.current) {
        paintMove(e);
        return;
      }
      if (!orbiting || !orbitRot) return;
      const dx = e.clientX - lastOrbit.x;
      const dy = e.clientY - lastOrbit.y;
      lastOrbit = { x: e.clientX, y: e.clientY };
      orbitRot.y += dx * 0.01;
      orbitRot.x += dy * 0.01;
      mesh.rotation.set(orbitRot.x, orbitRot.y, modelRef.current.rotZ || 0);
      onOrientRef.current && onOrientRef.current({ rotX: orbitRot.x, rotY: orbitRot.y });
    };
    const onUp = () => {
      if (curStroke) {
        const s = curStroke;
        curStroke = null;
        lastPt = null;
        onMarkupChangeRef.current && onMarkupChangeRef.current([...(modelRef.current.markup || []), s]);
      }
      orbiting = false;
      orbitRot = null;
      erasing = false;
    };
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    stateRef.current = { scene, mesh, renderer, camera, material, texture, drawBase, baseImg, applyAdjust };

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      mesh.geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.scene.background = new THREE.Color(bgColor);
  }, [bgColor]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.mesh.geometry.dispose();
    s.mesh.geometry = createGeometry(model.geometry || "box");
  }, [model.geometry]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    imgLoadedRef.current = false;
    if (model.image_url) s.baseImg.src = model.image_url;
    else s.drawBase();
  }, [model.image_url]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.material.metalness = typeof model.metalness === "number" ? model.metalness : 0.65;
    s.material.roughness = typeof model.roughness === "number" ? model.roughness : 0.22;
    if (!imgLoadedRef.current) s.drawBase();
    s.material.needsUpdate = true;
  }, [model.color, model.metalness, model.roughness]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.mesh.scale.setScalar(model.scale || 1);
  }, [model.scale]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.mesh.rotation.set(model.rotX || 0, model.rotY || 0, model.rotZ || 0);
  }, [model.rotX, model.rotY, model.rotZ]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.drawBase();
  }, [model.markup]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.applyAdjust(adjust);
  }, [adjust]);

  return <div ref={containerRef} className="h-full w-full" />;
}
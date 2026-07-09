import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGeometry } from "@/components/grid/three-helpers";
import { styleFor, drawStroke } from "@/components/grid/markup-helpers";

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
  paintingActive,
  tool,
  color,
  size,
  onMarkupChange,
}) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const imgLoadedRef = useRef(false);

  const paintingActiveRef = useRef(paintingActive);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const onMarkupChangeRef = useRef(onMarkupChange);
  const modelRef = useRef(model);
  paintingActiveRef.current = paintingActive;
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;
  onMarkupChangeRef.current = onMarkupChange;
  modelRef.current = model;

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

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0x3b82f6, 1.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

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
    scene.add(mesh);

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";

    const drawBase = () => {
      const m = modelRef.current;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
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
    if (modelRef.current.image_url) {
      baseImg.src = modelRef.current.image_url;
    } else {
      drawBase();
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let curStroke = null;
    let lastPt = null;

    const toUV = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(mesh, false);
      if (!hits.length || !hits[0].uv) return null;
      return [hits[0].uv.x, 1 - hits[0].uv.y];
    };

    const onDown = (e) => {
      if (!paintingActiveRef.current) return;
      const p = toUV(e);
      if (!p) return;
      e.preventDefault();
      curStroke = {
        tool: toolRef.current,
        color: colorRef.current,
        width: sizeRef.current,
        points: [p],
      };
      lastPt = p;
      styleFor(ctx, curStroke.tool, curStroke.color, curStroke.width);
      ctx.beginPath();
      ctx.moveTo(p[0] * SIZE, p[1] * SIZE);
      ctx.lineTo(p[0] * SIZE + 0.01, p[1] * SIZE);
      ctx.stroke();
      texture.needsUpdate = true;
    };
    const onMove = (e) => {
      if (!paintingActiveRef.current || !curStroke) return;
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
    const onUp = () => {
      if (!curStroke) return;
      const s = curStroke;
      curStroke = null;
      lastPt = null;
      onMarkupChangeRef.current && onMarkupChangeRef.current([...(modelRef.current.markup || []), s]);
    };
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    stateRef.current = { scene, mesh, renderer, camera, material, texture, drawBase, baseImg };

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const m = modelRef.current;
      mesh.rotation.x = m.rotX || 0;
      mesh.rotation.z = m.rotZ || 0;
      if (!paintingActiveRef.current && m.geometry !== "plane") {
        mesh.rotation.y = (m.rotY || 0) + t * 0.35;
      } else {
        mesh.rotation.y = m.rotY || 0;
      }
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
    if (model.image_url) {
      s.baseImg.src = model.image_url;
    } else {
      s.drawBase();
    }
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
    s.drawBase();
  }, [model.markup]);

  return <div ref={containerRef} className="h-full w-full" />;
}
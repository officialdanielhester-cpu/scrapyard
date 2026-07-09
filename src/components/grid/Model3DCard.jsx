import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGeometry, createMaterial } from "@/components/grid/three-helpers";

export default function Model3DCard({ model, onOpen }) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(model.bgColor || "#080B14");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0x3b82f6, 1.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    const mesh = new THREE.Mesh(createGeometry(model.geometry), createMaterial(model));
    mesh.scale.setScalar(model.scale || 1);
    mesh.rotation.set(model.rotX || 0, model.rotY || 0, model.rotZ || 0);
    scene.add(mesh);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (model.geometry !== "plane") {
        mesh.rotation.y = (model.rotY || 0) + t * 0.4;
      }
      mesh.position.y = Math.sin(t + (model.id ? 0 : 1)) * 0.1;
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
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [model]);

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50 text-left transition-transform duration-300 hover:scale-[1.02]"
      style={{ backgroundColor: model.bgColor || "#080B14" }}
    >
      <div ref={ref} className="h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
        <p className="truncate text-xs font-medium text-white">{model.name}</p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">{model.geometry}</span>
      </div>
    </button>
  );
}
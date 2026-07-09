import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGeometry, createMaterial } from "@/components/grid/three-helpers";

export default function ModelPreview3D({ model, bgColor = "#080B14" }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);

  // Build scene once
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

    const mesh = new THREE.Mesh(createGeometry("box"), createMaterial({ geometry: "box", color: "#3B82F6" }));
    scene.add(mesh);

    stateRef.current = { scene, mesh, renderer, camera };

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (model && model.geometry !== "plane") {
        mesh.rotation.y = (model.rotY || 0) + t * 0.35;
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
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  // Background color
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.scene.background = new THREE.Color(bgColor);
  }, [bgColor]);

  // Geometry / image change → replace geometry + material
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const oldGeo = s.mesh.geometry;
    const oldMat = s.mesh.material;
    s.mesh.geometry = createGeometry(model.geometry);
    s.mesh.material = createMaterial(model);
    oldGeo.dispose();
    oldMat.dispose();
  }, [model.geometry, model.image_url]);

  // Material params (procedural only)
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const mat = s.mesh.material;
    if (mat.map) return;
    mat.color = new THREE.Color(model.color || "#3B82F6");
    mat.metalness = model.metalness;
    mat.roughness = model.roughness;
    mat.needsUpdate = true;
  }, [model.color, model.metalness, model.roughness]);

  // Scale
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.mesh.scale.setScalar(model.scale || 1);
  }, [model.scale]);

  // Orientation
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.mesh.rotation.set(model.rotX || 0, model.rotY || 0, model.rotZ || 0);
  }, [model.rotX, model.rotY, model.rotZ]);

  return <div ref={containerRef} className="h-full w-full" />;
}
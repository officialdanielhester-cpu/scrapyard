import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGeometry, createMaterial } from "@/components/grid/three-helpers";

export default function Grid3D({ models, bgColor = "#080B14", onSelectModel }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const onSelectRef = useRef(onSelectModel);
  onSelectRef.current = onSelectModel;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 16, 34);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0x3b82f6, 1.4);
    key.position.set(6, 9, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 3, -3);
    scene.add(fill);

    const grid = new THREE.GridHelper(28, 28, 0x3b82f6, 0x1b2436);
    grid.position.y = -3.5;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    const textureLoader = new THREE.TextureLoader();
    const pivot = new THREE.Group();
    const group = new THREE.Group();
    pivot.add(group);
    scene.add(pivot);

    const meshes = [];
    const cols = 4;
    const count = Math.max(models.length, 1);
    const rows = Math.ceil(count / cols);
    const spacing = 3;

    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      const mesh = new THREE.Mesh(createGeometry(m.geometry), createMaterial(m, textureLoader));
      const c = i % cols;
      const r = Math.floor(i / cols);
      mesh.position.set(
        (c - (cols - 1) / 2) * spacing,
        ((rows - 1) / 2 - r) * spacing,
        0
      );
      mesh.scale.setScalar(m.scale || 1);
      mesh.rotation.set(m.rotX || 0, m.rotY || 0, m.rotZ || 0);
      mesh.userData = {
        modelId: m.id,
        speed: 0.3 + (i % 3) * 0.18,
        offset: i * 0.7,
        baseY: mesh.position.y,
        baseRotY: m.rotY || 0,
        spin: m.geometry !== "plane",
      };
      group.add(mesh);
      meshes.push(mesh);
    }

    stateRef.current = { scene, renderer, camera };

    let mouseX = 0;
    let mouseY = 0;
    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener("mousemove", onMove);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length && onSelectRef.current) {
        onSelectRef.current(hits[0].object.userData.modelId);
      }
    };
    container.addEventListener("click", onClick);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      meshes.forEach((m) => {
        if (m.userData.spin) {
          m.rotation.y = m.userData.baseRotY + t * m.userData.speed;
        }
        m.position.y = m.userData.baseY + Math.sin(t + m.userData.offset) * 0.18;
      });
      pivot.rotation.y += (mouseX * 0.5 - pivot.rotation.y) * 0.04;
      pivot.rotation.x += (mouseY * 0.25 - pivot.rotation.x) * 0.04;
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
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("click", onClick);
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, [models]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const c = new THREE.Color(bgColor);
    s.scene.background = c;
    if (s.scene.fog) s.scene.fog.color = c;
  }, [bgColor]);

  return <div ref={containerRef} className="h-full w-full" />;
}
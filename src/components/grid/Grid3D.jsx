import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Grid3D({
  items,
  bgColor = "#080B14",
  modelColor = "#3B82F6",
  scale = 1,
  rotation = { x: 0, y: 0, z: 0 },
}) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);

  // Build scene once and when the item count changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 14, 28);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0x3b82f6, 1.5);
    key.position.set(6, 9, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 3, -3);
    scene.add(fill);

    // Floor grid (blue accent lines)
    const grid = new THREE.GridHelper(24, 24, 0x3b82f6, 0x1b2436);
    grid.position.y = -3.2;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // Object palette
    const geometries = [
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.OctahedronGeometry(1),
      new THREE.IcosahedronGeometry(1),
      new THREE.TetrahedronGeometry(1.3),
      new THREE.DodecahedronGeometry(0.9),
      new THREE.TorusGeometry(0.8, 0.3, 16, 40),
      new THREE.SphereGeometry(0.9, 24, 24),
      new THREE.ConeGeometry(0.9, 1.6, 6),
    ];

    // pivot = mouse parallax, group = user transform (scale + orientation)
    const pivot = new THREE.Group();
    const group = new THREE.Group();
    pivot.add(group);
    scene.add(pivot);

    const meshes = [];
    const cols = 4;
    const count = Math.max(items.length, 4);
    const rows = Math.ceil(count / cols);
    const spacing = 2.6;

    for (let i = 0; i < count; i++) {
      const geo = geometries[i % geometries.length];
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(modelColor),
        metalness: 0.65,
        roughness: 0.22,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const c = i % cols;
      const r = Math.floor(i / cols);
      mesh.position.set(
        (c - (cols - 1) / 2) * spacing,
        ((rows - 1) / 2 - r) * spacing,
        0
      );
      mesh.userData = { speed: 0.3 + (i % 3) * 0.18, offset: i * 0.7, baseY: mesh.position.y };
      group.add(mesh);
      meshes.push(mesh);
    }

    group.scale.setScalar(scale);
    group.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);

    stateRef.current = { scene, pivot, group, meshes, renderer, camera };

    // Mouse parallax (drives pivot only — never fights user orientation)
    let mouseX = 0;
    let mouseY = 0;
    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener("mousemove", onMove);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      meshes.forEach((m) => {
        m.rotation.x = t * m.userData.speed * 0.5;
        m.rotation.y = t * m.userData.speed;
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
  }, [items.length]);

  // Live background color
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const c = new THREE.Color(bgColor);
    s.scene.background = c;
    if (s.scene.fog) s.scene.fog.color = c;
  }, [bgColor]);

  // Live model color
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const c = new THREE.Color(modelColor);
    s.meshes.forEach((m) => {
      m.material.color = c;
    });
  }, [modelColor]);

  // Live size
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.group.scale.setScalar(scale);
  }, [scale]);

  // Live orientation
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.group.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  }, [rotation.x, rotation.y, rotation.z]);

  return <div ref={containerRef} className="h-full w-full" />;
}
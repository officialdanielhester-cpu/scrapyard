import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const BOUND = 4;
const CEILING = 6;
const MAX_SPECIMENS = 8;

function tempColor(t, target) {
  const norm = THREE.MathUtils.clamp((t + 50) / 250, 0, 1);
  target.setHSL((1 - norm) * 0.66, 0.8, 0.55);
  return target;
}

export default function SimulationCanvas({ variables, running, resetSignal, onMetrics }) {
  const mountRef = useRef(null);
  const varsRef = useRef(variables);
  const runningRef = useRef(running);
  const onMetricsRef = useRef(onMetrics);
  const resetRef = useRef(resetSignal);

  useEffect(() => { varsRef.current = variables; }, [variables]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { onMetricsRef.current = onMetrics; }, [onMetrics]);
  useEffect(() => { resetRef.current = resetSignal; }, [resetSignal]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    const bg = varsRef.current.bgColor || "#080B14";
    scene.background = new THREE.Color(bg);
    scene.fog = new THREE.Fog(bg, 14, 28);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 5, 11.5);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(6, 12, 8);
    scene.add(dir);
    const rim = new THREE.PointLight(0x3b82f6, 0.7, 32);
    rim.position.set(-7, 5, -7);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(BOUND * 2, BOUND * 2),
      new THREE.MeshStandardMaterial({ color: 0x0f1422, roughness: 0.9, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(BOUND * 2, 16, 0x2a3550, 0x1a2238);
    grid.position.y = 0.01;
    scene.add(grid);

    const wallMat = new THREE.LineBasicMaterial({ color: 0x2a3550, transparent: true, opacity: 0.55 });
    const wallGeo = new THREE.BufferGeometry();
    const b = BOUND;
    const pts = [
      -b, 0, -b, b, 0, -b, b, 0, -b, b, 0, b, b, 0, b, -b, 0, b, -b, 0, b, -b, 0, -b,
      -b, CEILING, -b, b, CEILING, -b, b, CEILING, -b, b, CEILING, b, b, CEILING, b, -b, CEILING, b, -b, CEILING, b, -b, CEILING, -b,
      -b, 0, -b, -b, CEILING, -b, b, 0, -b, b, CEILING, -b, b, 0, b, b, CEILING, b, -b, 0, b, -b, CEILING, b,
    ];
    wallGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(wallGeo, wallMat));

    const palette = [0x3b82f6, 0x60a5fa, 0x93c5fd, 0xa78bfa, 0x22d3ee, 0x34d399, 0xfbbf24, 0xf472b6];
    const spheres = [];
    for (let i = 0; i < MAX_SPECIMENS; i++) {
      const r = 0.35 + Math.random() * 0.4;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 24),
        new THREE.MeshStandardMaterial({ color: palette[i], roughness: 0.35, metalness: 0.5, emissive: 0x000000, emissiveIntensity: 0 })
      );
      const pos = new THREE.Vector3((Math.random() - 0.5) * (BOUND * 1.6), 2 + Math.random() * 3, (Math.random() - 0.5) * (BOUND * 1.6));
      const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 2, (Math.random() - 0.5) * 4);
      mesh.position.copy(pos);
      scene.add(mesh);
      spheres.push({ mesh, pos, vel, r });
    }

    let collisionCount = 0;
    let maxHeight = 0;
    let frame = 0;
    let speedAccum = 0;
    let lastReset = resetRef.current;
    const tmpColor = new THREE.Color();
    const bgTarget = new THREE.Color();

    const resetSpheres = () => {
      for (const s of spheres) {
        s.pos.set((Math.random() - 0.5) * (BOUND * 1.6), 2 + Math.random() * 3, (Math.random() - 0.5) * (BOUND * 1.6));
        s.vel.set((Math.random() - 0.5) * 4, Math.random() * 2, (Math.random() - 0.5) * 4);
        s.mesh.position.copy(s.pos);
      }
      collisionCount = 0;
      maxHeight = 0;
    };

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (resetRef.current !== lastReset) { resetSpheres(); lastReset = resetRef.current; }

      const v = varsRef.current;
      const rawDt = Math.min(clock.getDelta(), 0.05);
      const dt = runningRef.current ? rawDt * (v.timeScale || 1) : 0;
      const count = Math.min(MAX_SPECIMENS, Math.max(1, Math.round(v.specimens || 6)));

      bgTarget.set(v.bgColor || "#080B14");
      scene.background.lerp(bgTarget, 0.05);

      const g = v.gravity ?? 9.8;
      const wind = v.wind ?? 0;
      const dragCoeff = (v.atmosphere ?? 1) * 0.45;
      const fric = THREE.MathUtils.clamp(v.friction ?? 0.3, 0, 0.95);
      const restitution = 1 - fric;
      const temp = v.temperature ?? 20;
      const thermal = Math.max(0, temp - 20) / 90;

      let speedSum = 0;
      for (let i = 0; i < spheres.length; i++) {
        const s = spheres[i];
        const active = i < count;
        s.mesh.visible = active;
        if (!active) continue;

        if (dt > 0) {
          s.vel.y -= g * dt * 0.5;
          s.vel.x += wind * dt * 0.6;
          if (thermal > 0) {
            s.vel.x += (Math.random() - 0.5) * thermal * dt * 12;
            s.vel.z += (Math.random() - 0.5) * thermal * dt * 12;
            s.vel.y += (Math.random() - 0.5) * thermal * dt * 6;
          }
          s.vel.multiplyScalar(Math.max(0, 1 - dragCoeff * dt));
          s.pos.addScaledVector(s.vel, dt);

          if (s.pos.y < s.r) {
            s.pos.y = s.r;
            if (s.vel.y < 0) {
              s.vel.y = -s.vel.y * restitution;
              s.vel.x *= (1 - fric);
              s.vel.z *= (1 - fric);
              if (Math.abs(s.vel.y) > 0.3) collisionCount++;
            }
          }
          if (s.pos.x > BOUND - s.r) { s.pos.x = BOUND - s.r; s.vel.x = -Math.abs(s.vel.x) * restitution; collisionCount++; }
          if (s.pos.x < -BOUND + s.r) { s.pos.x = -BOUND + s.r; s.vel.x = Math.abs(s.vel.x) * restitution; collisionCount++; }
          if (s.pos.z > BOUND - s.r) { s.pos.z = BOUND - s.r; s.vel.z = -Math.abs(s.vel.z) * restitution; collisionCount++; }
          if (s.pos.z < -BOUND + s.r) { s.pos.z = -BOUND + s.r; s.vel.z = Math.abs(s.vel.z) * restitution; collisionCount++; }
          if (s.pos.y > CEILING - s.r) { s.pos.y = CEILING - s.r; if (s.vel.y > 0) s.vel.y = -s.vel.y * restitution; }

          if (s.pos.y > maxHeight) maxHeight = s.pos.y;
        }

        s.mesh.position.copy(s.pos);
        tempColor(temp, tmpColor);
        s.mesh.material.color.copy(tmpColor);
        s.mesh.material.emissive.copy(tmpColor).multiplyScalar(thermal);
        s.mesh.material.emissiveIntensity = thermal * 0.9;

        speedSum += s.vel.length();
      }

      speedAccum += speedSum / count;
      frame++;
      if (frame % 10 === 0) {
        onMetricsRef.current?.({ avgSpeed: speedAccum / 10, maxHeight, collisions: collisionCount });
        speedAccum = 0;
      }

      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material && obj.material.dispose) obj.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { VEHICLES } from "@/components/environment/presets";

const SCALE = 0.22; // scene units per meter
const ARENA_M = 160; // half-width in meters
const CEILING_M = 320;
const GOAL_X = 120;
const TRAIL_MAX = 400;

function buildVehicle(type) {
  const g = new THREE.Group();
  const mat = (c, m = 0.6, r = 0.3) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
  let rotor = null;

  if (type === "rocket") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3, 20), mat(0xe5e7eb));
    body.position.y = 1.5; g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 20), mat(0xef4444));
    nose.position.y = 3.6; g.add(nose);
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.5), mat(0x3b82f6, 0.4, 0.5));
      fin.position.set(Math.cos(i * Math.PI / 2) * 0.55, 0.2, Math.sin(i * Math.PI / 2) * 0.55);
      fin.rotation.y = (i * Math.PI) / 2; g.add(fin);
    }
  } else if (type === "missile") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 16), mat(0x9ca3af));
    body.position.y = 1; g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 16), mat(0xef4444));
    nose.position.y = 1.9; g.add(nose);
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.3), mat(0x6b7280));
      fin.position.set(Math.cos(i * Math.PI / 2) * 0.32, 0.2, Math.sin(i * Math.PI / 2) * 0.32);
      fin.rotation.y = (i * Math.PI) / 2; g.add(fin);
    }
  } else if (type === "jet") {
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 16), mat(0x93c5fd, 0.7, 0.25));
    fus.rotation.z = Math.PI / 2; fus.position.y = 0.5; g.add(fus);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16), mat(0x60a5fa));
    nose.rotation.z = -Math.PI / 2; nose.position.set(2, 0.5, 0); g.add(nose);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.6), mat(0x3b82f6, 0.5, 0.4));
    wing.position.y = 0.4; g.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.4), mat(0x3b82f6));
    tail.position.set(-1.4, 0.6, 0); g.add(tail);
  } else if (type === "plane") {
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 3.2, 16), mat(0xe5e7eb, 0.5, 0.4));
    fus.rotation.z = Math.PI / 2; fus.position.y = 0.5; g.add(fus);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 16), mat(0xdbeafe));
    nose.rotation.z = -Math.PI / 2; nose.position.set(2.05, 0.5, 0); g.add(nose);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2.4), mat(0xe5e7eb));
    wing.position.y = 0.4; g.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.6), mat(0xe5e7eb));
    tail.position.set(-1.5, 0.7, 0); g.add(tail);
  } else if (type === "helicopter") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 1.8, 16), mat(0x111827, 0.5, 0.4));
    body.rotation.z = Math.PI / 2; body.position.y = 0.8; g.add(body);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2, 12), mat(0x111827));
    tail.rotation.z = Math.PI / 2; tail.position.set(-1.6, 1, 0); g.add(tail);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), mat(0x111827));
    fin.position.set(-2.4, 1.1, 0); g.add(fin);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), mat(0x374151));
    mast.position.y = 1.9; g.add(mast);
    rotor = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.04, 0.12), mat(0x111827, 0.7, 0.3));
    rotor.position.y = 2.2; g.add(rotor);
  } else if (type === "car") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1), mat(0x3b82f6, 0.5, 0.4));
    body.position.y = 0.8; g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.9), mat(0x1e3a8a, 0.3, 0.5));
    cabin.position.set(-0.2, 1.3, 0); g.add(cabin);
    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
    const wMat = mat(0x111827, 0.2, 0.8);
    [[0.9, 0.35, 0.55], [0.9, 0.35, -0.55], [-0.9, 0.35, 0.55], [-0.9, 0.35, -0.55]].forEach(([x, y, z]) => {
      const w = new THREE.Mesh(wGeo, wMat); w.rotation.x = Math.PI / 2; w.position.set(x, y, z); g.add(w);
    });
  } else if (type === "tank") {
    const tracks = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 1.8), mat(0x1a1a1a, 0.2, 0.9));
    tracks.position.y = 0.45; g.add(tracks);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 0.7, 1.6), mat(0x3f4d2a, 0.4, 0.6));
    hull.position.y = 0.9; g.add(hull);
    const turret = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), mat(0x4a5a2f, 0.4, 0.6));
    turret.position.set(-0.2, 1.5, 0); g.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2, 12), mat(0x222222));
    barrel.rotation.z = Math.PI / 2; barrel.position.set(1.2, 1.5, 0); g.add(barrel);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), mat(0x3b82f6));
    body.position.y = 0.75; g.add(body);
  }

  return { group: g, rotor };
}

export default function SimulationCanvas({ vehicleType, params, variables, running, launched, resetSignal, onMetrics, zoom = 1, onZoom, steerRef = { current: { steer: 0 } } }) {
  const mountRef = useRef(null);
  const vehicleTypeRef = useRef(vehicleType);
  const paramsRef = useRef(params);
  const varsRef = useRef(variables);
  const runningRef = useRef(running);
  const launchedRef = useRef(launched);
  const onMetricsRef = useRef(onMetrics);
  const resetRef = useRef(resetSignal);
  const zoomRef = useRef(zoom);
  const onZoomRef = useRef(onZoom);

  useEffect(() => { vehicleTypeRef.current = vehicleType; }, [vehicleType]);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { varsRef.current = variables; }, [variables]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { launchedRef.current = launched; }, [launched]);
  useEffect(() => { onMetricsRef.current = onMetrics; }, [onMetrics]);
  useEffect(() => { resetRef.current = resetSignal; }, [resetSignal]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { onZoomRef.current = onZoom; }, [onZoom]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(varsRef.current.bgColor || "#080B14");
    scene.fog = new THREE.Fog(varsRef.current.bgColor || "#080B14", 60, 140);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
    const camTarget = new THREE.Vector3(0, 12, 0);
    const camDirN = new THREE.Vector3(0, 12, 52).normalize();
    const camBaseDist = Math.hypot(0, 12, 52);
    camera.position.copy(camTarget).addScaledVector(camDirN, camBaseDist * (zoomRef.current || 1));
    camera.lookAt(camTarget);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 20, 12);
    scene.add(dir);
    const rim = new THREE.PointLight(0x3b82f6, 0.8, 120);
    rim.position.set(-12, 10, -10);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: varsRef.current.groundColor || "#1a2238", roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(120, 30, 0x2a3550, 0x1a2238);
    grid.position.y = 0.02;
    scene.add(grid);

    // launch pad marker
    const pad = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.03;
    scene.add(pad);

    // finish-line gate for ground-vehicle goals
    const gate = new THREE.Group();
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.35 });
    [-1.3, 1.3].forEach((z) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), gateMat);
      post.position.set(0, 1.3, z); gate.add(post);
    });
    const gateBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 2.7), gateMat);
    gateBar.position.set(0, 2.6, 0); gate.add(gateBar);
    gate.position.set(GOAL_X * SCALE, 0, 0);
    gate.visible = false;
    scene.add(gate);

    // starfield
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 220;
      starPos[i * 3 + 1] = Math.random() * 120;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.6 }));
    scene.add(stars);

    // trail
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(TRAIL_MAX * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.75 }));
    scene.add(trail);

    const bgTarget = new THREE.Color();
    const groundTarget = new THREE.Color();

    // sim state
    let vehicle = { group: new THREE.Group(), rotor: null };
    let pos = new THREE.Vector3(0, 0, 0);
    let vel = new THREE.Vector3(0, 0, 0);
    let fuel = 0;
    let initialFuel = 0;
    let pitch = 0;
    let goalReached = false;
    let flightTime = 0;
    let landed = false;
    let maxSpeed = 0;
    let maxAlt = 0;
    let lastAccel = 0;
    let trailCount = 0;
    let lastType = null;
    let lastReset = resetRef.current;
    let lastLaunched = false;
    let frame = 0;

    const clearTrail = () => { trailCount = 0; trailGeo.setDrawRange(0, 0); };

    const disposeVehicle = () => {
      scene.remove(vehicle.group);
      vehicle.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.dispose) o.material.dispose();
      });
    };

    const buildVehicleInto = (type) => {
      disposeVehicle();
      vehicle = buildVehicle(type);
      scene.add(vehicle.group);
      pos.set(0, 0, 0); vel.set(0, 0, 0);
      fuel = paramsRef.current.fuel;
      initialFuel = paramsRef.current.fuel;
      pitch = 0; goalReached = false;
      flightTime = 0; landed = false; maxSpeed = 0; maxAlt = 0; lastAccel = 0;
      clearTrail();
      vehicle.group.position.set(0, 0, 0);
    };

    const resetSim = () => {
      pos.set(0, 0, 0); vel.set(0, 0, 0);
      fuel = paramsRef.current.fuel;
      initialFuel = paramsRef.current.fuel;
      pitch = 0; goalReached = false;
      flightTime = 0; landed = false; maxSpeed = 0; maxAlt = 0; lastAccel = 0;
      clearTrail();
    };

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);

      if (vehicleTypeRef.current !== lastType) { buildVehicleInto(vehicleTypeRef.current); lastType = vehicleTypeRef.current; lastLaunched = false; }
      if (resetRef.current !== lastReset) { resetSim(); lastReset = resetRef.current; lastLaunched = false; }

      const launchedNow = launchedRef.current;
      if (launchedNow && !lastLaunched) {
        const cat = VEHICLES[vehicleTypeRef.current]?.category;
        vel.set(cat === "winged" ? 8 : 0, 0, 0);
        landed = false; fuel = paramsRef.current.fuel; initialFuel = paramsRef.current.fuel; pitch = 0; goalReached = false; flightTime = 0; maxSpeed = 0; maxAlt = 0; clearTrail();
      }
      lastLaunched = launchedNow;

      const v = varsRef.current;
      const p = paramsRef.current;
      const rawDt = Math.min(clock.getDelta(), 0.05);
      const dt = runningRef.current && launchedNow && !landed ? rawDt * (v.timeScale || 1) : 0;

      bgTarget.set(v.bgColor || "#080B14");
      groundTarget.set(v.groundColor || "#1a2238");
      scene.background.lerp(bgTarget, 0.06);
      ground.material.color.lerp(groundTarget, 0.06);
      stars.material.opacity = (v.atmosphere || 0) < 0.1 ? 0.8 : 0.25;

      const cat = VEHICLES[vehicleTypeRef.current]?.category;
      const g = v.gravity ?? 9.8;
      const atm = v.atmosphere ?? 1;
      const wind = v.wind ?? 0;
      const accel = new THREE.Vector3();

      if (dt > 0) {
        const thrustMag = fuel > 0 ? p.thrust : 0;
        const speed = vel.length();

        // Variable mass: the vehicle lightens as fuel burns (rocket-equation feel).
        const fuelRatio = initialFuel > 0 ? Math.max(0, fuel / initialFuel) : 0;
        const fuelFrac = cat === "launch" ? 0.6 : cat === "winged" ? 0.35 : cat === "rotor" ? 0.3 : 0.12;
        const mass = p.mass * (1 - fuelFrac * (1 - fuelRatio));

        // Atmospheric density falls off with altitude (exponential atmosphere).
        const density = atm * Math.exp(-Math.max(0, pos.y) / 8500);

        // Quadratic aerodynamic drag opposing velocity: a = -(0.5 * rho * CdA * v^2 / m) * v_hat
        const vHat = speed > 0.0001 ? vel.clone().multiplyScalar(1 / speed) : new THREE.Vector3();
        const dragMag = (0.5 * density * p.drag * speed * speed) / mass;

        // Pilot steering: pitch the thrust/lift vector to alter the trajectory.
        const isFlyer = cat === "launch" || cat === "winged" || cat === "rotor";
        if (isFlyer) {
          pitch += (steerRef.current?.steer || 0) * 1.2 * dt;
          pitch = Math.max(-1.05, Math.min(1.05, pitch));
        }
        const sp = Math.sin(pitch), cp = Math.cos(pitch);

        if (cat === "launch") {
          const tdir = new THREE.Vector3(-sp + (vehicleTypeRef.current === "missile" ? 0.12 : 0), cp, 0).normalize();
          accel.addScaledVector(tdir, thrustMag / mass);
          accel.y -= g;
          accel.x += wind * 0.04;
          accel.addScaledVector(vHat, -dragMag);
        } else if (cat === "winged") {
          const fwd = Math.abs(vel.x * cp + vel.y * sp);
          // Quadratic lift: a = 0.5 * rho * CL * A * v^2 / m, opposing gravity.
          const liftMag = (0.5 * density * p.lift * fwd * fwd) / mass;
          const forward = new THREE.Vector3(cp, sp, 0);
          const up = new THREE.Vector3(-sp, cp, 0);
          accel.addScaledVector(forward, thrustMag / mass);
          accel.addScaledVector(up, liftMag);
          accel.y -= g;
          accel.x += wind * 0.03;
          accel.addScaledVector(vHat, -dragMag);
        } else if (cat === "rotor") {
          const tdir = new THREE.Vector3(-sp, cp, 0);
          accel.addScaledVector(tdir, thrustMag / mass);
          accel.y -= g;
          accel.x += wind * 0.05;
          accel.addScaledVector(vHat, -dragMag);
        } else {
          // ground
          accel.x = thrustMag / mass;
          accel.x -= 0.02 * g * Math.sign(vel.x || 1);
          accel.x -= (0.5 * density * p.drag * vel.x * Math.abs(vel.x)) / mass;
          accel.x += wind * 0.02;
        }

        vel.addScaledVector(accel, dt);
        pos.addScaledVector(vel, dt);
        if (fuel > 0) fuel = Math.max(0, fuel - dt);
        flightTime += dt;
        lastAccel = accel.length();

        // bounds
        if (cat !== "ground" && pos.y <= 0 && vel.y < 0) {
          pos.y = 0;
          if (cat === "winged" || cat === "launch") { vel.set(0, 0, 0); landed = true; }
          else { vel.y = 0; }
        }
        if (cat === "ground") {
          pos.y = 0;
          if (pos.x >= GOAL_X) { pos.x = GOAL_X; vel.x = 0; goalReached = true; landed = true; }
          if (Math.abs(vel.x) < 0.2 && thrustMag === 0) landed = true;
        }
        if (pos.x > ARENA_M) { pos.x = ARENA_M; vel.x = 0; landed = true; }
        if (pos.x < -ARENA_M) { pos.x = -ARENA_M; vel.x = 0; landed = true; }
        if (pos.y > CEILING_M) { pos.y = CEILING_M; if (vel.y > 0) vel.y = 0; }

        if (landed) pitch = 0;
        if (speed > maxSpeed) maxSpeed = speed;
        if (pos.y > maxAlt) maxAlt = pos.y;
      }

      // place vehicle
      vehicle.group.position.set(pos.x * SCALE, pos.y * SCALE, pos.z * SCALE);
      if (vehicle.rotor) vehicle.rotor.rotation.y += rawDt * 25;
      vehicle.group.rotation.z = cat === "launch" || cat === "winged" || cat === "rotor" ? pitch : 0;
      if ((cat === "winged" || cat === "ground") && vel.x !== 0) {
        vehicle.group.rotation.y = vel.x < 0 ? Math.PI : 0;
      }
      if (gate) gate.visible = cat === "ground";

      // trail
      if (launchedNow && !landed && frame % 3 === 0 && trailCount < TRAIL_MAX) {
        trailPositions[trailCount * 3] = vehicle.group.position.x;
        trailPositions[trailCount * 3 + 1] = vehicle.group.position.y;
        trailPositions[trailCount * 3 + 2] = vehicle.group.position.z;
        trailCount++;
        trailGeo.setDrawRange(0, trailCount);
        trailGeo.attributes.position.needsUpdate = true;
      }

      frame++;
      if (frame % 6 === 0) {
        onMetricsRef.current?.({
          altitude: pos.y,
          velocity: vel.length(),
          maxSpeed,
          maxAltitude: maxAlt,
          distance: Math.hypot(pos.x, pos.z),
          flightTime,
          acceleration: lastAccel,
          fuel,
          landed,
          pitch,
          goalReached,
          goalX: GOAL_X,
        });
      }

      const camDist = camBaseDist * (zoomRef.current || 1);
      camera.position.copy(camTarget).addScaledVector(camDirN, camDist);
      camera.lookAt(camTarget);

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

    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      onZoomRef.current?.((z) => Math.max(0.4, Math.min(3, (z || 1) * factor)));
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("wheel", onWheel);
      disposeVehicle();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.dispose) o.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
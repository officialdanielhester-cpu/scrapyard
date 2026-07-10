import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { VEHICLES, TERRAINS, CLIMATES, GROUND_GOALS, terrainHeight } from "@/components/environment/presets";
import { buildInstances3D } from "@/components/workshop/part-3d";

const SCALE = 0.22; // scene units per meter
const ARENA_M = 160;
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

// Free-flight camera: drag to orbit, shift-drag / two-finger to pan,
// wheel / pinch to zoom, optional follow mode, recenter signal.
// Ground vehicles honor terrain (height + friction), climate (fog/wind/grip),
// and goal checkpoints.
export default function SimulationCanvas({
  vehicleType,
  params,
  variables,
  running,
  launched,
  resetSignal,
  onMetrics,
  zoom = 1,
  onZoom,
  steerRef = { current: { steer: 0, yaw: 0, turn: 0, throttle: 0 } },
  build,
  launchAngle = 0,
  cameraMode = "free",
  recenterSignal = 0,
  terrain = "flat",
  climate = "clear",
  goal = "slalom",
}) {
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
  const buildRef = useRef(build);
  const launchAngleRef = useRef(launchAngle);
  const camModeRef = useRef(cameraMode);
  const recenterSigRef = useRef(recenterSignal);
  const terrainRef = useRef(terrain);
  const climateRef = useRef(climate);
  const goalRef = useRef(goal);

  useEffect(() => { vehicleTypeRef.current = vehicleType; }, [vehicleType]);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { varsRef.current = variables; }, [variables]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { launchedRef.current = launched; }, [launched]);
  useEffect(() => { onMetricsRef.current = onMetrics; }, [onMetrics]);
  useEffect(() => { resetRef.current = resetSignal; }, [resetSignal]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { onZoomRef.current = onZoom; }, [onZoom]);
  useEffect(() => { buildRef.current = build; }, [build]);
  useEffect(() => { launchAngleRef.current = launchAngle; }, [launchAngle]);
  useEffect(() => { camModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { recenterSigRef.current = recenterSignal; }, [recenterSignal]);
  useEffect(() => { terrainRef.current = terrain; }, [terrain]);
  useEffect(() => { climateRef.current = climate; }, [climate]);
  useEffect(() => { goalRef.current = goal; }, [goal]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(varsRef.current.bgColor || "#080B14");
    scene.fog = new THREE.Fog(varsRef.current.bgColor || "#080B14", 60, 160);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 600);
    let camTheta = 0.6, camPhi = 1.15;
    const camTarget = new THREE.Vector3(0, 10, 0);
    const camRight = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    const updateCam = () => {
      const r = 60 * (zoomRef.current || 1);
      camera.position.set(
        camTarget.x + r * Math.sin(camPhi) * Math.sin(camTheta),
        camTarget.y + r * Math.cos(camPhi),
        camTarget.z + r * Math.sin(camPhi) * Math.cos(camTheta)
      );
      camera.lookAt(camTarget);
    };
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 20, 12);
    scene.add(dir);
    const rim = new THREE.PointLight(0x3b82f6, 0.8, 120);
    rim.position.set(-12, 10, -10);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120, 48, 48),
      new THREE.MeshStandardMaterial({ color: varsRef.current.groundColor || "#1a2238", roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(120, 30, 0x2a3550, 0x1a2238);
    grid.position.y = 0.02;
    scene.add(grid);

    const pad = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.03;
    scene.add(pad);

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

    // checkpoint gates for ground-vehicle goals (slalom)
    const checkpointGroup = new THREE.Group();
    scene.add(checkpointGroup);
    let checkpointGates = [];

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

    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(TRAIL_MAX * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.75 }));
    scene.add(trail);

    const bgTarget = new THREE.Color();
    const groundTarget = new THREE.Color();
    const fogColorTarget = new THREE.Color();

    // sim state
    let vehicle = { group: new THREE.Group(), rotor: null };
    let pos = new THREE.Vector3(0, 0, 0);
    let vel = new THREE.Vector3(0, 0, 0);
    let fuel = 0;
    let initialFuel = 0;
    let pitch = 0;
    let yaw = 0;
    let heading = 0;
    let goalReached = false;
    let flightTime = 0;
    let landed = false;
    let maxSpeed = 0;
    let maxAlt = 0;
    let lastAccel = 0;
    let trailCount = 0;
    let lastType = null;
    let lastBuild = null;
    let lastReset = resetRef.current;
    let lastLaunched = false;
    let lastRecenter = recenterSigRef.current;
    let lastTerrain = null;
    let lastGoal = null;
    let frame = 0;

    const clearTrail = () => { trailCount = 0; trailGeo.setDrawRange(0, 0); };

    const disposeVehicle = () => {
      scene.remove(vehicle.group);
      vehicle.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.dispose) o.material.dispose();
      });
    };

    const resetCheckpoints = () => {
      checkpointGates.forEach((g) => { g.passed = false; g.mat.color.setHex(0xfbbf24); g.mat.emissive.setHex(0xfbbf24); });
    };

    const buildVehicleInto = (type) => {
      disposeVehicle();
      const built = buildRef.current && buildRef.current.length ? buildInstances3D(buildRef.current) : buildVehicle(type);
      vehicle = { group: built.group, rotor: built.rotor || null, rotorMeshes: built.rotorMeshes || [] };
      scene.add(vehicle.group);
      pos.set(0, 0, 0); vel.set(0, 0, 0);
      fuel = paramsRef.current.fuel;
      initialFuel = paramsRef.current.fuel;
      pitch = 0; yaw = 0; heading = 0; goalReached = false;
      flightTime = 0; landed = false; maxSpeed = 0; maxAlt = 0; lastAccel = 0;
      clearTrail();
      resetCheckpoints();
      vehicle.group.position.set(0, 0, 0);
    };

    const resetSim = () => {
      pos.set(0, 0, 0); vel.set(0, 0, 0);
      fuel = paramsRef.current.fuel;
      initialFuel = paramsRef.current.fuel;
      pitch = 0; yaw = 0; heading = 0; goalReached = false;
      flightTime = 0; landed = false; maxSpeed = 0; maxAlt = 0; lastAccel = 0;
      clearTrail();
      resetCheckpoints();
    };

    // terrain height displacement on the ground mesh
    const applyTerrain = (key) => {
      const attr = ground.geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        const lx = attr.getX(i), ly = attr.getY(i);
        attr.setZ(i, terrainHeight(lx / SCALE, -ly / SCALE, key) * SCALE);
      }
      attr.needsUpdate = true;
      ground.geometry.computeVertexNormals();
    };

    // rebuild checkpoint gates for a goal
    const rebuildCheckpoints = (goalKey) => {
      while (checkpointGroup.children.length) {
        const c = checkpointGroup.children[0];
        checkpointGroup.remove(c);
        c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      }
      checkpointGates = [];
      const cfg = GROUND_GOALS[goalKey] || GROUND_GOALS.slalom;
      (cfg.checkpoints || []).forEach((cp) => {
        const m = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.3 });
        const grp = new THREE.Group();
        [-1, 1].forEach((z) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), m);
          post.position.set(0, 1.1, z); grp.add(post);
        });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 2.1), m);
        bar.position.set(0, 2.2, 0); grp.add(bar);
        grp.position.set(cp.x * SCALE, 0, cp.z * SCALE);
        checkpointGroup.add(grp);
        checkpointGates.push({ mat: m, cp, passed: false });
      });
    };

    // camera pointer navigation
    const pointers = new Map();
    let panMode = false;
    let lastOrbit = { x: 0, y: 0 };
    let lastPan = { x: 0, y: 0 };
    let pinchDist = 0;

    const panBy = (dx, dy) => {
      camera.updateMatrixWorld();
      camRight.setFromMatrixColumn(camera.matrixWorld, 0);
      camUp.setFromMatrixColumn(camera.matrixWorld, 1);
      const k = 60 * (zoomRef.current || 1) * 0.0016;
      camTarget.addScaledVector(camRight, -dx * k);
      camTarget.addScaledVector(camUp, dy * k);
    };

    const onPointerDown = (e) => {
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      renderer.domElement.style.cursor = "grabbing";
      if (pointers.size === 1) {
        panMode = e.shiftKey || e.button === 2;
        lastOrbit = { x: e.clientX, y: e.clientY };
        lastPan = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        lastPan = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      }
    };
    const onPointerMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDist) {
          const ratio = pinchDist / d;
          onZoomRef.current?.((z) => Math.max(0.4, Math.min(3, (z || 1) * ratio)));
        }
        pinchDist = d;
        const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
        panBy(mx - lastPan.x, my - lastPan.y);
        lastPan = { x: mx, y: my };
      } else if (pointers.size === 1) {
        const dx = e.clientX - lastOrbit.x, dy = e.clientY - lastOrbit.y;
        lastOrbit = { x: e.clientX, y: e.clientY };
        if (panMode) panBy(dx, dy);
        else {
          camTheta -= dx * 0.005;
          camPhi = Math.max(0.15, Math.min(Math.PI - 0.15, camPhi - dy * 0.005));
        }
      }
    };
    const onPointerUp = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 1) {
        const p = [...pointers.values()][0];
        lastOrbit = { x: p.x, y: p.y };
        panMode = false;
      }
      renderer.domElement.style.cursor = "grab";
    };
    const onContext = (e) => e.preventDefault();
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      onZoomRef.current?.((z) => Math.max(0.4, Math.min(3, (z || 1) * factor)));
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("contextmenu", onContext);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);

      if (vehicleTypeRef.current !== lastType || buildRef.current !== lastBuild) { buildVehicleInto(vehicleTypeRef.current); lastType = vehicleTypeRef.current; lastBuild = buildRef.current; lastLaunched = false; }
      if (resetRef.current !== lastReset) { resetSim(); lastReset = resetRef.current; lastLaunched = false; }
      if (terrainRef.current !== lastTerrain) { applyTerrain(terrainRef.current); lastTerrain = terrainRef.current; }
      if (goalRef.current !== lastGoal) { rebuildCheckpoints(goalRef.current); resetCheckpoints(); lastGoal = goalRef.current; }

      const launchedNow = launchedRef.current;
      if (launchedNow && !lastLaunched) {
        const cat0 = VEHICLES[vehicleTypeRef.current]?.category;
        const la = (launchAngleRef.current || 0) * Math.PI / 180;
        if (cat0 === "winged") vel.set(Math.cos(la) * 8, Math.sin(la) * 8, 0);
        else vel.set(0, 0, 0);
        landed = false; fuel = paramsRef.current.fuel; initialFuel = paramsRef.current.fuel;
        pitch = cat0 === "ground" ? 0 : la;
        yaw = 0; heading = cat0 === "ground" ? la : 0;
        goalReached = false; flightTime = 0; maxSpeed = 0; maxAlt = 0; clearTrail(); resetCheckpoints();
      }
      lastLaunched = launchedNow;

      const v = varsRef.current;
      const p = paramsRef.current;
      const rawDt = Math.min(clock.getDelta(), 0.05);
      const cat = VEHICLES[vehicleTypeRef.current]?.category;
      const isFlyer = cat === "launch" || cat === "winged" || cat === "rotor";
      const throttle = steerRef.current?.throttle || 0;
      const dt = runningRef.current && launchedNow && !landed ? rawDt * (v.timeScale || 1) : 0;

      bgTarget.set(v.bgColor || "#080B14");
      scene.background.lerp(bgTarget, 0.06);
      stars.material.opacity = (v.atmosphere || 0) < 0.1 ? 0.8 : 0.25;

      // ground color + climate fog
      const tCfg = TERRAINS[terrainRef.current] || TERRAINS.flat;
      const cCfg = CLIMATES[climateRef.current] || CLIMATES.clear;
      groundTarget.set(cat === "ground" ? tCfg.color : (v.groundColor || "#1a2238"));
      ground.material.color.lerp(groundTarget, 0.06);
      if (cat === "ground") {
        fogColorTarget.set(cCfg.fogColor);
        scene.fog.color.lerp(fogColorTarget, 0.08);
        scene.fog.near += (cCfg.fogNear - scene.fog.near) * 0.1;
        scene.fog.far += (cCfg.fogFar - scene.fog.far) * 0.1;
      } else {
        fogColorTarget.set(v.bgColor || "#080B14");
        scene.fog.color.lerp(fogColorTarget, 0.08);
        scene.fog.near += (60 - scene.fog.near) * 0.1;
        scene.fog.far += (160 - scene.fog.far) * 0.1;
      }

      const g = v.gravity ?? 9.8;
      const atm = v.atmosphere ?? 1;
      const wind = v.wind ?? 0;
      const accel = new THREE.Vector3();

      if (dt > 0) {
        const thrustMag = fuel > 0 ? p.thrust : 0;
        const speed = vel.length();

        const fuelRatio = initialFuel > 0 ? Math.max(0, fuel / initialFuel) : 0;
        const fuelFrac = cat === "launch" ? 0.6 : cat === "winged" ? 0.35 : cat === "rotor" ? 0.3 : 0.12;
        const mass = p.mass * (1 - fuelFrac * (1 - fuelRatio));

        const density = atm * Math.exp(-Math.max(0, pos.y) / 8500);

        const vHat = speed > 0.0001 ? vel.clone().multiplyScalar(1 / speed) : new THREE.Vector3();
        const dragMag = (0.5 * density * p.drag * speed * speed) / mass;

        if (isFlyer) {
          pitch += (steerRef.current?.steer || 0) * 1.2 * dt;
          pitch = Math.max(-1.05, Math.min(1.05, pitch));
          yaw += (steerRef.current?.yaw || 0) * 1.0 * dt;
          yaw = Math.max(-1.4, Math.min(1.4, yaw));
        }
        const sp = Math.sin(pitch), cp = Math.cos(pitch);
        const sy = Math.sin(yaw), cy = Math.cos(yaw);

        if (cat === "launch") {
          const tdir = new THREE.Vector3(-sp * cy + (vehicleTypeRef.current === "missile" ? 0.12 : 0), cp, sp * sy).normalize();
          accel.addScaledVector(tdir, thrustMag / mass);
          accel.y -= g;
          accel.x += wind * 0.04;
          accel.addScaledVector(vHat, -dragMag);
        } else if (cat === "winged") {
          const forward = new THREE.Vector3(cp * cy, sp, -cp * sy);
          const fwd = Math.abs(vel.dot(forward));
          const liftMag = (0.5 * density * p.lift * fwd * fwd) / mass;
          const up = new THREE.Vector3(-sp * cy, cp, sp * sy);
          accel.addScaledVector(forward, thrustMag / mass);
          accel.addScaledVector(up, liftMag);
          accel.y -= g;
          accel.x += wind * 0.03;
          accel.addScaledVector(vHat, -dragMag);
        } else if (cat === "rotor") {
          const tdir = new THREE.Vector3(-sp * cy, cp, sp * sy);
          accel.addScaledVector(tdir, thrustMag / mass);
          accel.y -= g;
          accel.x += wind * 0.05;
          accel.addScaledVector(vHat, -dragMag);
        } else {
          // ground — 2D on xz plane with heading + throttle, terrain + climate surface grip
          const surfaceGrip = tCfg.friction * cCfg.grip;
          const windEff = wind + cCfg.wind;
          const turn = steerRef.current?.turn || 0;
          heading += turn * 1.1 * dt * surfaceGrip;
          const thrustEff = (fuel > 0 && throttle > 0) ? p.thrust : 0;
          const brake = throttle < 0 ? 1 : 0;
          const hx = Math.cos(heading), hz = -Math.sin(heading);
          accel.x = (thrustEff / mass) * hx;
          accel.z = (thrustEff / mass) * hz;
          const speed2 = Math.hypot(vel.x, vel.z);
          const fric = (0.02 * g + (brake ? 0.5 * g : 0)) * surfaceGrip;
          if (speed2 > 0.001) {
            accel.x -= fric * (vel.x / speed2);
            accel.z -= fric * (vel.z / speed2);
            const dragMag2 = (0.5 * density * p.drag * speed2 * speed2) / mass;
            accel.x -= dragMag2 * (vel.x / speed2);
            accel.z -= dragMag2 * (vel.z / speed2);
          }
          accel.x += windEff * 0.02;
        }

        vel.addScaledVector(accel, dt);
        pos.addScaledVector(vel, dt);
        if (fuel > 0) {
          if (cat === "ground") { if (throttle > 0) fuel = Math.max(0, fuel - dt); }
          else fuel = Math.max(0, fuel - dt);
        }
        flightTime += dt;
        lastAccel = accel.length();

        if (cat !== "ground" && pos.y <= 0 && vel.y < 0) {
          pos.y = 0;
          if (cat === "winged" || cat === "launch") { vel.set(0, 0, 0); landed = true; }
          else { vel.y = 0; }
        }
        if (cat === "ground") {
          pos.y = terrainHeight(pos.x, pos.z, terrainRef.current);
          const toGoal = Math.hypot(GOAL_X - pos.x, -pos.z);
          if (toGoal < 6) { vel.x = 0; vel.z = 0; goalReached = true; landed = true; }
          const sp2 = Math.hypot(vel.x, vel.z);
          if (sp2 < 0.3 && throttle <= 0) landed = true;
          // checkpoint passage
          for (const cg of checkpointGates) {
            if (!cg.passed && Math.hypot(pos.x - cg.cp.x, pos.z - cg.cp.z) < 8) {
              cg.passed = true;
              cg.mat.color.setHex(0x10b981);
              cg.mat.emissive.setHex(0x10b981);
            }
          }
        }
        if (Math.abs(pos.x) > ARENA_M) { pos.x = Math.sign(pos.x) * ARENA_M; vel.x = 0; }
        if (Math.abs(pos.z) > ARENA_M) { pos.z = Math.sign(pos.z) * ARENA_M; vel.z = 0; }
        if (pos.y > CEILING_M) { pos.y = CEILING_M; if (vel.y > 0) vel.y = 0; }

        if (landed) pitch = 0;
        const speedNow = cat === "ground" ? Math.hypot(vel.x, vel.z) : vel.length();
        if (speedNow > maxSpeed) maxSpeed = speedNow;
        if (pos.y > maxAlt) maxAlt = pos.y;
      }

      const passedCount = checkpointGates.filter((g) => g.passed).length;
      const goalComplete = goalReached && passedCount === checkpointGates.length;

      // place vehicle
      vehicle.group.position.set(pos.x * SCALE, pos.y * SCALE, pos.z * SCALE);
      if (vehicle.rotor) vehicle.rotor.rotation.y += rawDt * 25;
      (vehicle.rotorMeshes || []).forEach((r) => { r.rotation.y += rawDt * 25; });
      if (cat === "ground") { vehicle.group.rotation.y = heading; vehicle.group.rotation.z = 0; }
      else if (isFlyer) { vehicle.group.rotation.z = pitch; vehicle.group.rotation.y = yaw; }
      else { vehicle.group.rotation.z = 0; vehicle.group.rotation.y = 0; }
      gate.visible = cat === "ground";
      checkpointGroup.visible = cat === "ground";

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
          velocity: cat === "ground" ? Math.hypot(vel.x, vel.z) : vel.length(),
          maxSpeed,
          maxAltitude: maxAlt,
          distance: Math.hypot(pos.x, pos.z),
          flightTime,
          acceleration: lastAccel,
          fuel,
          landed,
          pitch,
          yaw,
          heading,
          throttle,
          goalReached,
          goalComplete,
          checkpointsPassed: passedCount,
          checkpointsTotal: checkpointGates.length,
          goalX: GOAL_X,
        });
      }

      // camera: recenter / follow / free
      if (recenterSigRef.current !== lastRecenter) {
        camTheta = 0.6; camPhi = 1.15; camTarget.set(0, 10, 0); lastRecenter = recenterSigRef.current;
      }
      if (camModeRef.current === "follow") {
        camTarget.lerp(vehicle.group.position, 0.08);
      }
      updateCam();

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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("contextmenu", onContext);
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
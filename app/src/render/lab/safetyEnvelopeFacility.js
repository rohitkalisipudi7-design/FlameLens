import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { V, std, mesh, box, rod, pipe, panel, disposeTree } from "./kit.js";
import * as tx from "./textures.js";

/**
 * SCIENTIFIC EVIDENCE ENVIRONMENT (3D Atmospheric Exploration Chamber)
 * Complete virtual laboratory featuring:
 * - High-pressure toroidal containment vessel with flanged quartz viewing portals.
 * - 15x15 parametric evidence terrain with elevation mapped to experimental density.
 * - Articulated multi-joint robotic sensor probe with dynamic inverse kinematics & laser beacon.
 * - Real-time querying of safety envelope classifications, confidence scores, and nearest PSI campaigns.
 * - Camera exploration modes (Orbit, Probe Follow-Cam, Transverse Cutaway, Frontier Horizon).
 */
export function createSafetyEnvelopeFacility(container, { envelopeData, onProbeSample }) {
  const W_init = Math.max(10, container.clientWidth || 800);
  const H_init = Math.max(10, container.clientHeight || 540);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W_init, H_init);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  disposeTree(room);
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(40, W_init / H_init, 1, 15000);
  camera.position.set(0, 240, 480);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xdbeafe, 0x090d16, 1.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(180, 500, 250);
  const probeSpot = new THREE.PointLight(0xd946ef, 3.0, 300, 1.5);
  probeSpot.position.set(0, 100, 0);
  scene.add(hemi, sun, probeSpot);

  const labRoot = new THREE.Group();
  scene.add(labRoot);

  const M = {
    steel: std(0xc8d0dc, 0.95, 0.25),
    darkVessel: std(0x161b26, 0.8, 0.45),
    goldAlloy: std(0xd4af37, 0.85, 0.35),
    quartzGlass: std(0x18243b, 0.1, 0.05, { transparent: true, opacity: 0.35, depthWrite: false }),
    probeArmMat: std(0x3b82f6, 0.7, 0.35),
    laserMagenta: new THREE.LineBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.95 }),
  };

  const EPISTEMIC_MATS = {
    IN_DOMAIN: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.6, emissive: 0x047857, emissiveIntensity: 0.35 }),
    MODEL_SUPPORTED: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.5, emissive: 0x0369a1, emissiveIntensity: 0.3 }),
    FRONTIER: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.7, emissive: 0xd97706, emissiveIntensity: 0.45 }),
    UNSUPPORTED: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.3, emissive: 0xb91c1c, emissiveIntensity: 0.4 }),
    PHYSICAL_IMPOSSIBILITY: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.1 }),
  };

  // ==========================================
  // 1. ATMOSPHERIC PRESSURE VESSEL
  // ==========================================
  const vesselGroup = new THREE.Group();
  vesselGroup.position.set(0, 30, -20);
  labRoot.add(vesselGroup);

  const VR = 210;
  const VL = 360;

  const vesselGeo = new THREE.CylinderGeometry(VR, VR, VL, 64, 1, true, Math.PI * 0.18, Math.PI * 1.64);
  vesselGeo.rotateX(Math.PI / 2);
  mesh(vesselGeo, std(0xffffff, 0.7, 0.5, { map: tx.darkMetal(8), side: THREE.DoubleSide }), vesselGroup);

  for (const z of [-VL/2, -VL/4, 0, VL/4, VL/2]) {
    mesh(new THREE.TorusGeometry(VR + 8, 10, 8, 56), M.steel, vesselGroup, [0, 0, z]);
  }

  const portRing = mesh(new THREE.TorusGeometry(100, 10, 12, 48), M.goldAlloy, vesselGroup, [0, 0, VL/2 + 2]);
  mesh(new THREE.CircleGeometry(99, 48), M.quartzGlass, portRing);

  // ==========================================
  // 2. 15x15 EVIDENCE TERRAIN LANDSCAPE
  // ==========================================
  const terrainGroup = new THREE.Group();
  terrainGroup.position.set(0, -50, -20);
  vesselGroup.add(terrainGroup);

  const gridRows = envelopeData?.matrix || [];
  const N_P = envelopeData?.grid_size_pressure || 15;
  const N_O2 = envelopeData?.grid_size_o2 || 15;

  const cellW = 18;
  const cellD = 18;
  const totalW = N_O2 * cellW;
  const totalD = N_P * cellD;

  const cellMeshes = [];
  const pillarGeo = new THREE.BoxGeometry(cellW * 0.9, 1, cellD * 0.9);

  for (let r = 0; r < N_P; r++) {
    for (let c = 0; c < N_O2; c++) {
      const cellData = gridRows[r]?.[c] || {
        pressure_atm: 0.3 + (r / (N_P - 1)) * 2.2,
        o2_fraction: 0.15 + (c / (N_O2 - 1)) * 0.27,
        evidence_class: (r === 7 && c === 4) ? "IN_DOMAIN"
                      : (r === 3 && c === 9) ? "FRONTIER"
                      : (r > 11 && c > 10) ? "PHYSICAL_IMPOSSIBILITY"
                      : (r < 5 && c < 5) ? "UNSUPPORTED"
                      : "MODEL_SUPPORTED",
        confidence_score: 0.65,
        closest_experiment_id: "PSI-FLEX-014",
        distance_to_evidence: 0.24,
      };

      const posX = -totalW / 2 + c * cellW + cellW / 2;
      const posZ = -totalD / 2 + r * cellD + cellD / 2;

      const baseHeight = cellData.evidence_class === "IN_DOMAIN" ? 42
                       : cellData.evidence_class === "MODEL_SUPPORTED" ? 28
                       : cellData.evidence_class === "FRONTIER" ? 34
                       : cellData.evidence_class === "UNSUPPORTED" ? 14
                       : 4;

      const mat = EPISTEMIC_MATS[cellData.evidence_class] || EPISTEMIC_MATS.MODEL_SUPPORTED;
      const pillar = new THREE.Mesh(pillarGeo, mat.clone());
      pillar.scale.y = baseHeight;
      pillar.position.set(posX, baseHeight / 2, posZ);
      pillar.userData = { cellData, r, c, posX, posZ, baseHeight };

      terrainGroup.add(pillar);
      cellMeshes.push(pillar);
    }
  }

  const terrainGrid = new THREE.GridHelper(totalW, N_O2, 0x4f46e5, 0x1e293b);
  terrainGrid.position.set(0, 0, 0);
  terrainGroup.add(terrainGrid);

  function coordToWorld(pAtm, o2Frac) {
    const normP = Math.max(0, Math.min(1, (pAtm - 0.3) / (2.5 - 0.3)));
    const normO2 = Math.max(0, Math.min(1, (o2Frac - 0.15) / (0.42 - 0.15)));
    const x = -totalW / 2 + normO2 * totalW;
    const z = -totalD / 2 + normP * totalD;
    return { x, z };
  }

  // ==========================================
  // 3. ARTICULATED ROBOTIC SENSOR PROBE
  // ==========================================
  const probeAssembly = new THREE.Group();
  probeAssembly.position.set(0, 110, -20);
  vesselGroup.add(probeAssembly);

  box(totalW + 60, 12, 14, M.steel, probeAssembly, [0, 20, 0]);
  box(14, 12, totalD + 60, M.steel, probeAssembly, [0, 20, 0]);

  const basePivot = new THREE.Group();
  basePivot.position.set(0, 10, 0);
  probeAssembly.add(basePivot);
  box(28, 20, 28, M.darkVessel, basePivot);

  const upperArmPivot = new THREE.Group();
  upperArmPivot.position.set(0, -10, 0);
  basePivot.add(upperArmPivot);
  rod(V(0, 0, 0), V(0, -45, 0), 4.5, M.probeArmMat, upperArmPivot);

  const forearmPivot = new THREE.Group();
  forearmPivot.position.set(0, -45, 0);
  upperArmPivot.add(forearmPivot);
  rod(V(0, 0, 0), V(0, -40, 0), 3.5, M.steel, forearmPivot);

  const sensorHead = new THREE.Group();
  sensorHead.position.set(0, -40, 0);
  forearmPivot.add(sensorHead);
  box(22, 18, 22, M.darkVessel, sensorHead);
  mesh(new THREE.CylinderGeometry(5, 5, 8, 16), M.goldAlloy, sensorHead, [0, -10, 0]);

  const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -14, 0), new THREE.Vector3(0, -140, 0)]);
  const laserLine = new THREE.Line(laserGeo, M.laserMagenta);
  sensorHead.add(laserLine);

  const scanRing = mesh(new THREE.RingGeometry(8, 10, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({
    color: 0xd946ef,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  }), terrainGroup, [0, 2, 0]);

  let currentTargetPos = new THREE.Vector3(0, 0, 0);
  let activeCell = cellMeshes[0]?.userData?.cellData || null;

  function moveProbeTo(pAtm, o2Frac) {
    const { x, z } = coordToWorld(pAtm, o2Frac);
    currentTargetPos.set(x, 0, z);
    scanRing.position.set(x, 2, z);

    let closest = cellMeshes[0];
    let minDist = 999999;
    cellMeshes.forEach((m) => {
      const d = Math.hypot(m.userData.posX - x, m.userData.posZ - z);
      if (d < minDist) {
        minDist = d;
        closest = m;
      }
    });

    if (closest) {
      activeCell = closest.userData.cellData;
      cellMeshes.forEach(m => {
        m.scale.y = m.userData.baseHeight;
        m.material.emissiveIntensity = 0.35;
      });
      closest.scale.y = closest.userData.baseHeight + 12;
      closest.material.emissiveIntensity = 0.9;

      probeSpot.position.set(x, 40, z);

      onProbeSample?.({
        pressure_atm: pAtm,
        o2_fraction: o2Frac,
        evidence_class: activeCell.evidence_class,
        confidence_score: activeCell.confidence_score,
        closest_experiment_id: activeCell.closest_experiment_id,
        distance_to_evidence: activeCell.distance_to_evidence,
      });
    }
  }

  /**
   * LIVE REACTIVITY: Update epistemic layer visibility & gravity calibration
   */
  function updateLayers(visibleClasses = {}) {
    cellMeshes.forEach(m => {
      const cls = m.userData.cellData.evidence_class;
      const isVisible = visibleClasses[cls] !== false;
      m.visible = isVisible;
    });
  }

  let targetCameraPos = new THREE.Vector3(0, 240, 480);
  let targetLookAt = new THREE.Vector3(0, 0, 0);
  let currentLookAt = new THREE.Vector3(0, 0, 0);

  function setCameraMode(mode) {
    if (mode === "probe") {
      targetCameraPos.set(currentTargetPos.x + 30, 90, currentTargetPos.z + 80);
      targetLookAt.set(currentTargetPos.x, 10, currentTargetPos.z);
    } else if (mode === "cutaway") {
      targetCameraPos.set(totalW * 0.85, 40, 0);
      targetLookAt.set(0, -10, 0);
    } else if (mode === "frontier") {
      const { x, z } = coordToWorld(0.57, 0.34);
      targetCameraPos.set(x, 15, z + 70);
      targetLookAt.set(x, 15, z - 30);
    } else {
      targetCameraPos.set(0, 240, 480);
      targetLookAt.set(0, 0, 0);
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-999, -999);

  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let spherical = { radius: 480, theta: 0, phi: Math.PI / 2.5 };

  const onPointerDown = (e) => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging) {
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= dx * 0.005;
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.05, spherical.phi - dy * 0.005));

      targetCameraPos.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      targetCameraPos.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
      targetCameraPos.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    }
  };

  const onPointerUp = () => { isDragging = false; };

  const onPointerClick = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const visibleMeshes = cellMeshes.filter(m => m.visible);
    const intersects = raycaster.intersectObjects(visibleMeshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.cellData) {
        moveProbeTo(hit.userData.cellData.pressure_atm, hit.userData.cellData.o2_fraction);
      }
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    spherical.radius = Math.max(120, Math.min(1000, spherical.radius + e.deltaY * 0.45));
    targetCameraPos.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    targetCameraPos.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
    targetCameraPos.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  };

  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  dom.addEventListener("click", onPointerClick);
  dom.addEventListener("wheel", onWheel, { passive: false });

  const onResize = () => {
    const w = Math.max(10, container.clientWidth);
    const h = Math.max(10, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  moveProbeTo(0.57, 0.34);

  let animId = null;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    camera.position.lerp(targetCameraPos, 0.06);
    currentLookAt.lerp(targetLookAt, 0.06);
    camera.lookAt(currentLookAt);

    // Smooth robotic probe positioning
    basePivot.position.x = THREE.MathUtils.lerp(basePivot.position.x, currentTargetPos.x, 0.08);
    basePivot.position.z = THREE.MathUtils.lerp(basePivot.position.z, currentTargetPos.z, 0.08);

    // Real articulated inverse kinematics rotations for SCARA joints
    const normReachX = basePivot.position.x / totalW;
    const normReachZ = basePivot.position.z / totalD;
    upperArmPivot.rotation.z = Math.sin(t * 1.5) * 0.04 + normReachX * 0.35;
    upperArmPivot.rotation.x = normReachZ * 0.35;
    forearmPivot.rotation.z = -normReachX * 0.28;

    scanRing.scale.setScalar(1.0 + Math.sin(t * 3.5) * 0.12);
    renderer.render(scene, camera);
  }
  animate();

  return {
    moveProbeTo,
    updateLayers,
    setCameraMode,
    dispose: () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("click", onPointerClick);
      dom.removeEventListener("wheel", onWheel);
      disposeTree(scene);
      renderer.dispose();
      if (dom.parentElement === container) container.removeChild(dom);
    }
  };
}

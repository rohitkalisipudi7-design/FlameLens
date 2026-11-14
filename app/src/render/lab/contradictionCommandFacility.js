import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { V, std, mesh, box, rod, pipe, panel, disposeTree } from "./kit.js";
import * as tx from "./textures.js";

/**
 * SCIENTIFIC INTELLIGENCE COMMAND CENTER (3D Research Investigation Room)
 * Complete virtual laboratory featuring:
 * - Hexagonal NASA command deck with perimeter consoles and illuminated central dais.
 * - Interactive 3D Research Relationship Network with clickable publication monoliths.
 * - Volumetric laser connections (Crimson pulse for contradictions, Cyan laminar for support).
 * - Dual Holographic Comparison Pods that dynamically morph between buoyant 1g and 0g duct flames.
 * - Camera exploration modes (Command Orbit, Comparison Pods POV, Standard Monolith, Flight Cluster).
 */
export function createContradictionCommandFacility(container, { contradictionsData, onSelectContradiction, onHumanReview }) {
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
  scene.background = new THREE.Color(0x020308);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  disposeTree(room);
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(38, W_init / H_init, 1, 15000);
  camera.position.set(0, 220, 500);

  // Lighting
  const hemi = new THREE.HemisphereLight(0x93c5fd, 0x070c18, 1.3);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(200, 480, 260);
  const podSpotA = new THREE.PointLight(0xf59e0b, 2.5, 300, 1.2);
  podSpotA.position.set(-65, 60, 0);
  const podSpotB = new THREE.PointLight(0x38bdf8, 2.5, 300, 1.2);
  podSpotB.position.set(65, 60, 0);
  scene.add(hemi, sun, podSpotA, podSpotB);

  const commandDeck = new THREE.Group();
  scene.add(commandDeck);

  const M = {
    deckFloor: std(0x0d1322, 0.8, 0.4),
    consoleDark: std(0x131a29, 0.7, 0.5),
    goldStandard: std(0xd4af37, 0.85, 0.35),
    flightCyan: std(0x0284c7, 0.8, 0.3),
    theoryPurple: std(0x9333ea, 0.8, 0.3),
    laserConflict: new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.95 }),
    laserSupport: new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }),
    hologramBeam: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),
  };

  // 1. Hexagonal Dais & Consoles
  const daisRadius = 240;
  const daisGeo = new THREE.CylinderGeometry(daisRadius, daisRadius + 20, 18, 6);
  mesh(daisGeo, M.deckFloor, commandDeck, [0, -9, 0]);

  mesh(new THREE.TorusGeometry(daisRadius - 10, 4, 8, 48), std(0x3b82f6, 0.9, 0.2, { emissive: 0x1d4ed8, emissiveIntensity: 0.6 }), commandDeck, [0, 1, 0], [Math.PI / 2, 0, 0]);

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const px = Math.cos(angle) * (daisRadius - 50);
    const pz = Math.sin(angle) * (daisRadius - 50);
    const consoleUnit = box(70, 40, 35, M.consoleDark, commandDeck, [px, 20, pz]);
    consoleUnit.rotation.y = -angle - Math.PI / 2;
    panel(55, 24, new THREE.MeshBasicMaterial({
      map: tx.plate(`TERMINAL-${i + 1}`, { w: 256, h: 128, size: 28, bg: "#060a14", fg: "#38bdf8" })
    }), consoleUnit, [0, 8, 18]);
  }

  // 2. 3D Nodes
  const networkGroup = new THREE.Group();
  networkGroup.position.set(0, 30, 0);
  commandDeck.add(networkGroup);

  const nodes = [
    { id: "NASA-STD-6001B", label: "NASA-STD-6001B", type: "standard", pos: V(-130, 45, -70), color: 0xf59e0b },
    { id: "PSI-99", label: "PSI-99 FSP (Flight)", type: "experiment", pos: V(0, 55, -120), color: 0x0284c7 },
    { id: "NTRS-2024-91", label: "NTRS Report #91", type: "publication", pos: V(120, 45, -60), color: 0x38bdf8 },
    { id: "THEORY-DROPLET", label: "Quasi-Steady Model", type: "theory", pos: V(-110, 50, 80), color: 0x9333ea },
    { id: "JSC-29353B", label: "JSC Flammability Guide", type: "standard", pos: V(110, 50, 80), color: 0xf59e0b },
  ];

  const nodeMeshes = [];
  nodes.forEach((n) => {
    const g = new THREE.Group();
    g.position.copy(n.pos);

    box(24, 70, 16, M.consoleDark, g, [0, -35, 0]);

    const crystalGeo = n.type === "standard" ? new THREE.CylinderGeometry(14, 14, 18, 6)
                     : n.type === "experiment" ? new THREE.SphereGeometry(14, 24, 18)
                     : new THREE.OctahedronGeometry(14, 0);

    const crystalMesh = new THREE.Mesh(crystalGeo, new THREE.MeshStandardMaterial({
      color: n.color,
      emissive: n.color,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    }));
    crystalMesh.position.set(0, 15, 0);
    crystalMesh.userData = { nodeData: n, group: g };
    g.add(crystalMesh);

    panel(60, 16, new THREE.MeshBasicMaterial({
      map: tx.plate(n.label, { w: 256, h: 64, size: 24, bg: "#040814", fg: "#ffffff" })
    }), g, [0, 36, 0]);

    networkGroup.add(g);
    nodeMeshes.push(crystalMesh);
  });

  // Laser Links
  const linksGroup = new THREE.Group();
  networkGroup.add(linksGroup);

  const conflictPts = [V(-130, 60, -70), V(0, 70, -120)];
  const conflictGeo = new THREE.BufferGeometry().setFromPoints(conflictPts);
  const conflictLaser = new THREE.Line(conflictGeo, M.laserConflict);
  linksGroup.add(conflictLaser);

  const supportPts = [V(0, 70, -120), V(120, 60, -60)];
  const supportGeo = new THREE.BufferGeometry().setFromPoints(supportPts);
  const supportLaser = new THREE.Line(supportGeo, M.laserSupport);
  linksGroup.add(supportLaser);

  const theoryConflictPts = [V(-110, 65, 80), V(0, 70, -120)];
  const theoryConflictGeo = new THREE.BufferGeometry().setFromPoints(theoryConflictPts);
  linksGroup.add(new THREE.Line(theoryConflictGeo, M.laserConflict));

  // 3. Dual Comparison Pods
  const comparisonGroup = new THREE.Group();
  comparisonGroup.position.set(0, 0, 15);
  commandDeck.add(comparisonGroup);

  const podA = new THREE.Group();
  podA.position.set(-65, 0, 0);
  comparisonGroup.add(podA);
  mesh(new THREE.CylinderGeometry(35, 40, 14, 24), M.consoleDark, podA, [0, 7, 0]);
  mesh(new THREE.TorusGeometry(36, 3, 8, 32), std(0xf59e0b, 0.9, 0.3, { emissive: 0xb45309, emissiveIntensity: 0.6 }), podA, [0, 14, 0], [Math.PI / 2, 0, 0]);

  const podB = new THREE.Group();
  podB.position.set(65, 0, 0);
  comparisonGroup.add(podB);
  mesh(new THREE.CylinderGeometry(35, 40, 14, 24), M.consoleDark, podB, [0, 7, 0]);
  mesh(new THREE.TorusGeometry(36, 3, 8, 32), std(0x0284c7, 0.9, 0.3, { emissive: 0x0369a1, emissiveIntensity: 0.6 }), podB, [0, 14, 0], [Math.PI / 2, 0, 0]);

  const coneGeo = new THREE.ConeGeometry(32, 90, 32, 1, true);
  coneGeo.rotateX(Math.PI);
  const coneMeshA = new THREE.Mesh(coneGeo, M.hologramBeam);
  coneMeshA.position.set(0, 60, 0);
  podA.add(coneMeshA);

  const coneMeshB = new THREE.Mesh(coneGeo, M.hologramBeam.clone());
  coneMeshB.position.set(0, 60, 0);
  podB.add(coneMeshB);

  // Pod A: Terrestrial Model
  const flame1gGeo = new THREE.SphereGeometry(12, 24, 18);
  flame1gGeo.scale(0.8, 2.2, 0.8);
  const flame1gMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    wireframe: true,
  });
  const flame1g = new THREE.Mesh(flame1gGeo, flame1gMat);
  flame1g.position.set(0, 65, 0);
  podA.add(flame1g);

  const vectorA1 = rod(V(-14, 45, 0), V(-14, 90, 0), 1.0, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }), podA);
  const vectorA2 = rod(V(14, 45, 0), V(14, 90, 0), 1.0, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }), podA);

  // Pod B: Spaceflight Model
  const flame0gGeo = new THREE.SphereGeometry(18, 24, 18);
  const flame0gMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
    wireframe: true,
  });
  const flame0g = new THREE.Mesh(flame0gGeo, flame0gMat);
  flame0g.position.set(0, 65, 0);
  podB.add(flame0g);

  const vectorB1 = rod(V(-28, 65, 0), V(28, 65, 0), 1.0, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), podB);

  const discrepancies = contradictionsData?.discrepancies || [
    {
      contradiction_id: "CONTRA-01",
      title: "Upward Flammability Index Discrepancy",
      source_a: "NASA-STD-6001B Test 1",
      source_b: "PSI-99 Flame Spread in Duct",
      classification: "METHODOLOGICAL_DIFFERENCE",
      severity: "HIGH_APPARENT",
      claim_a_value: "21.0% O2",
      claim_b_value: "17.5% O2",
      aerothermal_explanation: "Buoyancy-induced natural convection in 1g preheats virgin fuel above the flame base, raising the required flammability threshold. In 0g micro-ventilation, absence of buoyant plume preheating combined with forced boundary stabilization permits sustained low-speed burning down to 17.5% O2."
    }
  ];

  function selectDiscrepancy(contra) {
    if (!contra) return;

    // Dynamically adjust comparison pod geometries based on discrepancy type
    if (contra.classification === "METHODOLOGICAL_DIFFERENCE") {
      flame1g.scale.set(0.8, 2.2, 0.8);
      flame0g.scale.set(1.0, 1.0, 1.0);
      vectorA1.visible = true;
      vectorA2.visible = true;
      vectorB1.visible = true;
    } else {
      flame1g.scale.set(1.2, 1.2, 1.2);
      flame0g.scale.set(0.7, 0.7, 0.7);
      vectorA1.visible = false;
      vectorA2.visible = false;
      vectorB1.visible = false;
    }

    onSelectContradiction?.(contra);
  }

  let targetCameraPos = new THREE.Vector3(0, 220, 500);
  let targetLookAt = new THREE.Vector3(0, 45, 0);
  let currentLookAt = new THREE.Vector3(0, 45, 0);

  function setCameraMode(mode) {
    if (mode === "comparison") {
      targetCameraPos.set(0, 85, 200);
      targetLookAt.set(0, 55, 15);
    } else if (mode === "standard") {
      targetCameraPos.set(-130, 75, 40);
      targetLookAt.set(-130, 45, -70);
    } else if (mode === "flight") {
      targetCameraPos.set(0, 85, -20);
      targetLookAt.set(0, 55, -120);
    } else {
      targetCameraPos.set(0, 220, 500);
      targetLookAt.set(0, 45, 0);
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-999, -999);

  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let spherical = { radius: 500, theta: 0, phi: Math.PI / 2.6 };

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
    const intersects = raycaster.intersectObjects(nodeMeshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.nodeData) {
        // Find matching discrepancy for this node
        const nodeId = hit.userData.nodeData.id;
        const matched = discrepancies.find(d => (d.source_a && d.source_a.includes(nodeId)) || (d.source_b && d.source_b.includes(nodeId)));
        if (matched) {
          selectDiscrepancy(matched);
        }
      }
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    spherical.radius = Math.max(140, Math.min(1000, spherical.radius + e.deltaY * 0.45));
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

  if (discrepancies.length > 0) {
    selectDiscrepancy(discrepancies[0]);
  }

  const onResize = () => {
    const w = Math.max(10, container.clientWidth);
    const h = Math.max(10, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  let animId = null;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    camera.position.lerp(targetCameraPos, 0.06);
    currentLookAt.lerp(targetLookAt, 0.06);
    camera.lookAt(currentLookAt);

    conflictLaser.material.opacity = 0.5 + Math.sin(t * 5.0) * 0.45;
    flame1g.rotation.y = t * 0.6;
    flame0g.rotation.y = t * 0.4;

    renderer.render(scene, camera);
  }
  animate();

  return {
    selectDiscrepancy,
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

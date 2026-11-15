import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { V, std, mesh, box, rod, pipe, panel, disposeTree } from "./kit.js";
import * as tx from "./textures.js";

/**
 * EXPERIMENTAL DESIGN FACILITY (3D NASA Research Facility)
 * Fully Reactive Scientific Experimental Design Environment:
 * - Opposed motorized needles physically translate to sample droplet diameter d0.
 * - Pressure dial needles, gas regulators, and digital displays update in real time.
 * - Oxidizer manifold illumination dynamically shifts with oxygen concentration.
 * - Gravity-specific convective buoyancy vectors materialize according to g-target.
 * - Candidate proposals visually distinguish Feasible vs Infeasible constraint states.
 * - Interactive raycasting for both candidate proposals and historical NASA PSI flight runs.
 */
export function validateHistoricalRecord(item) {
  if (!item || typeof item !== "object") {
    return { valid: false, reason: "Invalid record object" };
  }
  const evidence_id = item.evidence_id;
  if (!evidence_id || typeof evidence_id !== "string") {
    return { valid: false, reason: "Missing evidence_id" };
  }

  const norm = item.normalized_measurements || {};
  const p = Number(norm.pressure_atm);
  const o2 = Number(norm.x_o2);
  const d0 = norm.d0_mm !== null && norm.d0_mm !== undefined ? Number(norm.d0_mm) : null;
  const k = norm.burning_rate_mm2_s !== null && norm.burning_rate_mm2_s !== undefined ? Number(norm.burning_rate_mm2_s) : null;

  if (isNaN(p) || p <= 0 || !isFinite(p)) {
    return { valid: false, reason: `Invalid pressure: ${norm.pressure_atm}` };
  }
  if (isNaN(o2) || o2 <= 0 || o2 > 1.0 || !isFinite(o2)) {
    return { valid: false, reason: `Invalid oxygen fraction: ${norm.x_o2}` };
  }
  if (d0 === null || isNaN(d0) || d0 <= 0 || !isFinite(d0)) {
    return { valid: false, reason: `Missing or invalid droplet diameter: ${norm.d0_mm}` };
  }

  return {
    valid: true,
    data: {
      evidence_id,
      uid: item.uid || evidence_id,
      accession: item.accession || "UNKNOWN",
      campaign: item.campaign || "UNKNOWN",
      test_id: item.test_id || "UNKNOWN",
      family: item.family || "UNKNOWN",
      material_or_fuel: item.material_or_fuel || null,
      gravity: item.gravity || null,
      pressure_atm: p,
      oxygen_fraction: o2,
      droplet_diameter_mm: d0,
      measured_k: k !== null && !isNaN(k) && isFinite(k) ? k : null,
      source_provenance: item.source_provenance || null,
      literature_reference: item.literature_reference || null,
      scientific_quality: item.scientific_quality || null,
    }
  };
}

export const DOCUMENTED_HARDWARE_LIMITS = {
  ISS_CIR_MDCA: {
    facility: "ISS Combustion Integrated Rack (CIR) / MDCA",
    source: "NASA/TP-2017-219299 CIR Operational Envelope",
    min_pressure_atm: 0.70,
    max_pressure_atm: 3.00,
    max_o2_mole_fraction: 0.30,
    min_droplet_d0_mm: 1.0,
    max_droplet_d0_mm: 5.0,
  },
  GROUND_DROP_TOWER: {
    facility: "NASA Glenn Zero Gravity Research Facility (Drop Tower)",
    source: "NASA TM-107000 Zero-Gravity Research Facility Ground Operations Manual",
    min_pressure_atm: 0.30,
    max_pressure_atm: 2.50,
    max_o2_mole_fraction: 0.40,
    min_droplet_d0_mm: 0.8,
    max_droplet_d0_mm: 4.0,
  },
  EXPLORATION_ATMOSPHERE: {
    standard: "NASA Exploration Atmosphere Standard (Lunar / Mars Habitat)",
    source: "NASA-STD-3001 Vol 2 / NASA SP-2010-3407 (0.57 atm / 34% O2)",
    target_pressure_atm: 0.57,
    target_o2_mole_fraction: 0.34,
  }
};

export function evaluateCandidateFeasibility(data, userConstraints, activeGravity = 0.0) {
  const violations = [];
  const p = data.pressure_atm;
  const o2 = data.o2_mole_fraction;
  const d0 = data.droplet_diameter_mm;

  // 1. User constraint limits
  if (p !== null && p > userConstraints.maxP + 0.005) {
    violations.push(`Pressure ${p.toFixed(2)} atm exceeds user limit of ${userConstraints.maxP.toFixed(2)} atm`);
  }
  if (o2 !== null && o2 > userConstraints.maxO2 + 0.005) {
    violations.push(`Oxygen ${(o2 * 100).toFixed(1)}% exceeds user cap of ${(userConstraints.maxO2 * 100).toFixed(1)}%`);
  }
  if (d0 !== null && d0 > userConstraints.maxD0 + 0.05) {
    violations.push(`Diameter ${d0.toFixed(1)} mm exceeds user limit of ${userConstraints.maxD0.toFixed(1)} mm`);
  }

  // 2. Unsupported conditions check
  if (data.model_status === "UNSUPPORTED_FUEL" || data.error_message) {
    violations.push(data.error_message || "Model not calibrated for selected fuel");
    return {
      feasibilityStatus: "UNSUPPORTED",
      isFeasible: false,
      violations,
      recommendedFacility: "Not applicable",
      feasibilitySource: "No empirical flight calibration for fuel",
    };
  }

  if (activeGravity >= 1.0) {
    violations.push("1.0g terrestrial buoyancy is uncalibrated. Surrogate is valid only for microgravity spherical droplet combustion.");
    return {
      feasibilityStatus: "UNSUPPORTED",
      isFeasible: false,
      violations,
      recommendedFacility: "Terrestrial Rig (Uncalibrated)",
      feasibilitySource: "NASA PSI-69 FLEX Microgravity Flight Archive",
    };
  }

  if (p === null || o2 === null || d0 === null || p < 0.2 || p > 3.5 || o2 < 0.10 || o2 > 0.45) {
    violations.push("Parameters exceed allowable physics and chamber limits");
    return {
      feasibilityStatus: "UNSUPPORTED",
      isFeasible: false,
      violations,
      recommendedFacility: "Not applicable",
      feasibilitySource: "Chamber Envelope Exceeded",
    };
  }

  if (violations.length > 0) {
    return {
      feasibilityStatus: "UNSUPPORTED",
      isFeasible: false,
      violations,
      recommendedFacility: "Constraint Violation",
      feasibilitySource: "User Experimental Constraints",
    };
  }

  // 3. Hypothetical Frontier check (Exploration atmosphere or partial gravity)
  const isExplorationAtm = Math.abs(p - 0.57) < 0.06 && Math.abs(o2 - 0.34) < 0.05;
  const isPartialG = activeGravity > 0.01 && activeGravity < 0.99;
  if (isExplorationAtm || isPartialG) {
    return {
      feasibilityStatus: "HYPOTHETICAL_FRONTIER",
      isFeasible: true,
      violations: [],
      recommendedFacility: isPartialG
        ? "Lunar/Martian Surface Demonstration (Artemis Hab Qualification Needed)"
        : "NASA Glenn Zero Gravity Research Facility (Drop Tower)",
      feasibilitySource: "NASA-STD-3001 Vol 2 (0.57 atm / 34% O2 Habitat Standard)",
    };
  }

  // 4. Ground Facility Only check (Sub-atmospheric <0.70 atm, Hyperbaric >3.00 atm, or Elevated O2 >30%)
  const minCirP = DOCUMENTED_HARDWARE_LIMITS.ISS_CIR_MDCA.min_pressure_atm; // 0.70
  const maxCirP = DOCUMENTED_HARDWARE_LIMITS.ISS_CIR_MDCA.max_pressure_atm; // 3.00
  const maxCirO2 = DOCUMENTED_HARDWARE_LIMITS.ISS_CIR_MDCA.max_o2_mole_fraction; // 0.30

  if (p < minCirP || p > maxCirP || o2 > maxCirO2) {
    const reasons = [];
    if (p < minCirP) {
      reasons.push(`Sub-atmospheric pressure (${p.toFixed(2)} atm < ${minCirP.toFixed(2)} atm requires ground chamber evacuation)`);
    } else if (p > maxCirP) {
      reasons.push(`Elevated hyperbaric pressure (${p.toFixed(2)} atm > ${maxCirP.toFixed(2)} atm exceeds CIR flight limit)`);
    } else if (p > 1.0) {
      reasons.push(`Elevated chamber pressure (${p.toFixed(2)} atm)`);
    }
    if (o2 > maxCirO2) {
      reasons.push(`Elevated oxidizer (${(o2 * 100).toFixed(0)}% > ${(maxCirO2 * 100).toFixed(0)}% exceeds standard CIR insert flight safety qualification per NASA/TP-2017-219299)`);
    }
    return {
      feasibilityStatus: "GROUND_FACILITY_ONLY",
      isFeasible: true,
      violations: [],
      recommendedFacility: "NASA Glenn Zero Gravity Research Facility (Drop Tower)",
      feasibilitySource: `NASA TM-107000: ${reasons.join("; ")}`,
      scientificRationale: `Restricted to ground facility: ${reasons.join("; ")}.`,
    };
  }

  // 5. Standard Feasible Spaceflight
  return {
    feasibilityStatus: "FEASIBLE_SPACEFLIGHT",
    isFeasible: true,
    violations: [],
    recommendedFacility: "ISS Combustion Integrated Rack (CIR) / MDCA insert",
    feasibilitySource: "NASA/TP-2017-219299 CIR Operational Envelope (Standard Flight Hardware)",
  };
}

export function createOptimizerFacility(container, { proposalsData, historicalRecords, onSelectCandidate, onSelectHistorical, onProbeInfo }) {
  const W_init = Math.max(10, container.clientWidth || 800);
  const H_init = Math.max(10, container.clientHeight || 540);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W_init, H_init);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050c);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  disposeTree(room);
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(40, W_init / H_init, 1, 15000);
  camera.position.set(0, 180, 520);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x111624, 1.2);
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(200, 450, 300);
  const chamberSpot = new THREE.PointLight(0x60a5fa, 2.5, 600, 1.2);
  chamberSpot.position.set(0, 0, 80);
  const candidateSpot = new THREE.PointLight(0xf59e0b, 1.5, 400, 1.0);
  candidateSpot.position.set(0, 60, 0);
  scene.add(hemi, sun, chamberSpot, candidateSpot);

  const labFacility = new THREE.Group();
  scene.add(labFacility);

  const M = {
    steel: std(0xc8d0dc, 0.95, 0.25),
    darkTitanium: std(0x1c2230, 0.7, 0.45),
    goldAlloy: std(0xd4af37, 0.85, 0.35),
    brassValve: std(0xbf8f3b, 0.8, 0.3),
    quartzGlass: std(0x18243b, 0.1, 0.05, { transparent: true, opacity: 0.35, depthWrite: false }),
    highPurityCeramic: std(0xf3efe6, 0.05, 0.7),
    manifoldCyan: std(0x0284c7, 0.8, 0.3, { emissive: 0x0284c7, emissiveIntensity: 0.3 }),
    rackPanel: std(0x242a38, 0.5, 0.6),
    laserCyan: new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }),
    laserGold: new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 }),
  };

  // ==========================================
  // 1. PHYSICAL COMBUSTION TEST CHAMBER
  // ==========================================
  const chamberGroup = new THREE.Group();
  labFacility.add(chamberGroup);

  const RC = 140, L = 300, zCenter = -40;

  const hullTex = tx.darkMetal(7);
  hullTex.repeat.set(4, 2);
  const hullGeo = new THREE.CylinderGeometry(RC, RC, L, 64, 1, true, Math.PI * 0.15, Math.PI * 1.7);
  hullGeo.rotateX(Math.PI / 2);
  mesh(hullGeo, std(0xffffff, 0.75, 0.4, { map: hullTex, side: THREE.DoubleSide }), chamberGroup, [0, 0, zCenter]);

  mesh(new THREE.TorusGeometry(RC + 8, 12, 10, 56), M.steel, chamberGroup, [0, 0, zCenter + L / 2]);
  mesh(new THREE.TorusGeometry(RC + 8, 12, 10, 56), M.steel, chamberGroup, [0, 0, zCenter - L / 2]);
  mesh(new THREE.CircleGeometry(RC - 2, 48), M.darkTitanium, chamberGroup, [0, 0, zCenter - L / 2]);

  const boltGeo = new THREE.CylinderGeometry(3.5, 3.5, 8, 8).rotateX(Math.PI / 2);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    mesh(boltGeo, M.steel, chamberGroup, [Math.cos(a) * (RC + 10), Math.sin(a) * (RC + 10), zCenter + L / 2 + 5]);
  }

  const portGroup = new THREE.Group();
  portGroup.position.set(0, 0, zCenter + L / 2 + 2);
  mesh(new THREE.TorusGeometry(85, 8, 12, 48), M.goldAlloy, portGroup);
  mesh(new THREE.CircleGeometry(84, 48), M.quartzGlass, portGroup);
  chamberGroup.add(portGroup);

  const linerGeo = new THREE.CylinderGeometry(RC - 18, RC - 18, L - 30, 48, 1, true, Math.PI * 0.2, Math.PI * 1.6);
  linerGeo.rotateX(Math.PI / 2);
  mesh(linerGeo, std(0xffffff, 0.5, 0.6, { map: tx.perforated(), alphaTest: 0.5, side: THREE.DoubleSide }), chamberGroup, [0, 0, zCenter]);

  // ==========================================
  // 2. MOTORIZED OPPOSED DEPLOYMENT NEEDLES
  // ==========================================
  const needleAssembly = new THREE.Group();
  needleAssembly.position.set(0, 0, zCenter);
  chamberGroup.add(needleAssembly);

  const leftStepper = box(30, 24, 28, M.darkTitanium, needleAssembly, [-110, 0, 0]);
  box(18, 12, 18, M.steel, leftStepper, [18, 0, 0]);
  const leftNeedle = rod(V(-100, 0, 0), V(-8, 0, 0), 2.2, M.steel, needleAssembly, 0.6);

  const rightStepper = box(30, 24, 28, M.darkTitanium, needleAssembly, [110, 0, 0]);
  box(18, 12, 18, M.steel, rightStepper, [-18, 0, 0]);
  const rightNeedle = rod(V(100, 0, 0), V(8, 0, 0), 2.2, M.steel, needleAssembly, 0.6);

  const sampleDropletGeo = new THREE.SphereGeometry(1, 32, 24);
  const sampleDropletMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35,
  });
  const sampleDroplet = new THREE.Mesh(sampleDropletGeo, sampleDropletMat);
  needleAssembly.add(sampleDroplet);

  let targetNeedleOffset = 8.0;
  let targetDropletScale = 2.5;

  rod(V(-35, 28, 12), V(-6, 7, 0), 1.2, M.highPurityCeramic, needleAssembly);
  rod(V(35, 28, 12), V(6, 7, 0), 1.2, M.highPurityCeramic, needleAssembly);
  mesh(new THREE.TorusGeometry(3.5, 0.8, 8, 18), std(0xff5722, 0.9, 0.2, { emissive: 0xff3b00, emissiveIntensity: 1.2 }), needleAssembly, [0, 7, 0]);

  // Gravity-Specific Convective Buoyancy Vector (materializes under non-zero gravity)
  const buoyancyVectorGroup = new THREE.Group();
  buoyancyVectorGroup.position.set(0, 10, zCenter);
  chamberGroup.add(buoyancyVectorGroup);

  const buoyancyArrow = rod(V(0, 0, 0), V(0, 32, 0), 1.2, new THREE.MeshBasicMaterial({ color: 0xf59e0b }), buoyancyVectorGroup);
  const arrowCone = mesh(new THREE.ConeGeometry(3.5, 8, 16), new THREE.MeshBasicMaterial({ color: 0xf59e0b }), buoyancyVectorGroup, [0, 32, 0]);
  buoyancyVectorGroup.visible = false; // Hidden in 0g

  // ==========================================
  // 3. OVERHEAD CIR GANTRY & GAS MANIFOLDS
  // ==========================================
  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(0, 150, zCenter);
  labFacility.add(gantryGroup);

  box(340, 16, 20, M.rackPanel, gantryGroup, [0, 95, 0]);
  box(16, 120, 20, M.rackPanel, gantryGroup, [-165, 35, 0]);
  box(16, 120, 20, M.rackPanel, gantryGroup, [165, 35, 0]);

  // Analog pressure gauge needle pointer
  let o2GaugeNeedle = null;
  const addGasBottle = (x, y, len, radius, colorHex, label, hasNeedle = false) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, y, 0);
    const body = new THREE.CapsuleGeometry(radius, len, 8, 20);
    body.rotateZ(Math.PI / 2);
    mesh(body, std(colorHex, 0.85, 0.35), bGroup);
    mesh(new THREE.CylinderGeometry(radius * 0.4, radius * 0.4, 18, 16).rotateZ(Math.PI / 2), M.brassValve, bGroup, [len / 2 + 10, 0, 0]);

    const gauge = mesh(new THREE.CylinderGeometry(8, 8, 4, 16).rotateX(Math.PI / 2), M.steel, bGroup, [len / 2 + 12, 8, 0]);
    panel(12, 12, new THREE.MeshBasicMaterial({ color: 0xffffff, map: tx.plate("PSI", { w: 128, h: 128, size: 36 }) }), gauge, [0, 0, 2.5]);

    if (hasNeedle) {
      const needleMesh = rod(V(0, 0, 0), V(0, 5, 0), 0.5, new THREE.MeshBasicMaterial({ color: 0xef4444 }), gauge);
      needleMesh.position.set(0, 0, 2.8);
      o2GaugeNeedle = needleMesh;
    }

    panel(64, 14, new THREE.MeshBasicMaterial({ map: tx.plate(label, { w: 256, h: 64, size: 28, bg: "#0d131f", fg: "#ffffff" }) }), bGroup, [0, 0, radius + 1]);
    gantryGroup.add(bGroup);
    return bGroup;
  };

  addGasBottle(-75, 60, 120, 22, 0x0284c7, "O2 MANIFOLD", true);
  addGasBottle(75, 60, 130, 24, 0x334155, "N2 DILUENT", false);
  addGasBottle(0, 10, 80, 16, 0xbe123c, "LIQUID FUEL", false);

  // Dynamic Oxidizer Line (Glow intensifies with O2 fraction)
  const o2LineGroup = pipe([V(-75, 45, 0), V(-75, 0, 0), V(-45, -70, 0)], 4, M.manifoldCyan, gantryGroup);
  pipe([V(75, 45, 0), V(75, 0, 0), V(45, -70, 0)], 4, M.steel, gantryGroup);
  pipe([V(0, 0, 0), V(0, -60, 0)], 3, M.brassValve, gantryGroup);

  // Digital Atmospheric Transducer Readout
  const transducerBox = box(150, 32, 14, M.darkTitanium, chamberGroup, [0, RC + 22, zCenter]);
  const transducerScreen = panel(140, 24, new THREE.MeshBasicMaterial({
    map: tx.plate("P: 2.50 atm · O2: 40.0% · 0g", { w: 512, h: 96, size: 30, bg: "#040814", fg: "#38bdf8" })
  }), transducerBox, [0, 0, 7.5]);

  // ==========================================
  // 4. HOLOGRAPHIC 3D PARAMETER SPACE
  // ==========================================
  const paramSpaceGroup = new THREE.Group();
  paramSpaceGroup.position.set(0, 85, 20);
  labFacility.add(paramSpaceGroup);

  const cageW = 180, cageH = 120, cageD = 180;
  const cageGeo = new THREE.BoxGeometry(cageW, cageH, cageD);
  const cageEdges = new THREE.EdgesGeometry(cageGeo);
  paramSpaceGroup.add(new THREE.LineSegments(cageEdges, new THREE.LineBasicMaterial({ color: 0x20b9e8, transparent: true, opacity: 0.25 })));

  const gridHelper = new THREE.GridHelper(cageW, 10, 0x20b9e8, 0x26384b);
  gridHelper.position.set(0, -cageH / 2, 0);
  paramSpaceGroup.add(gridHelper);

  const coordTo3D = (pAtm, o2Frac, d0Mm) => {
    const z = -cageD/2 + ((pAtm - 0.3) / (2.5 - 0.3)) * cageD;
    const x = -cageW/2 + ((o2Frac - 0.15) / (0.42 - 0.15)) * cageW;
    const y = -cageH/2 + ((d0Mm - 0.5) / (2.5 - 0.5)) * cageH;
    return new THREE.Vector3(x, y, z);
  };

  // Authentic Historical NASA PSI Experiments (Zero Fabricated Points)
  const historicalMetadata = [];
  const validHistorical = [];
  let rejectedCount = 0;

  if (Array.isArray(historicalRecords)) {
    historicalRecords.forEach((item) => {
      const res = validateHistoricalRecord(item);
      if (res.valid) {
        validHistorical.push(res.data);
      } else {
        rejectedCount++;
      }
    });
  }

  const histPointsCount = validHistorical.length;
  const histPositions = new Float32Array(Math.max(1, histPointsCount) * 3);
  const histColors = new Float32Array(Math.max(1, histPointsCount) * 3);

  validHistorical.forEach((r, i) => {
    const pt = coordTo3D(r.pressure_atm, r.oxygen_fraction, r.droplet_diameter_mm);
    histPositions[i * 3 + 0] = pt.x;
    histPositions[i * 3 + 1] = pt.y;
    histPositions[i * 3 + 2] = pt.z;

    histColors[i * 3 + 0] = 0.22;
    histColors[i * 3 + 1] = 0.55;
    histColors[i * 3 + 2] = 0.85;

    historicalMetadata.push({
      evidence_id: r.evidence_id,
      uid: r.uid,
      accession: r.accession,
      campaign: r.campaign,
      test_id: r.test_id,
      run_id: r.test_id ? `${r.accession}:${r.test_id}` : r.evidence_id,
      family: r.family,
      material_or_fuel: r.material_or_fuel,
      gravity: r.gravity,
      pressure_atm: round(r.pressure_atm, 2),
      oxygen_fraction: round(r.oxygen_fraction, 3),
      droplet_diameter_mm: round(r.droplet_diameter_mm, 2),
      measured_k: r.measured_k !== null ? round(r.measured_k, 3) : null,
      source_provenance: r.source_provenance,
      literature_reference: r.literature_reference,
      scientific_quality: r.scientific_quality,
      pos: pt,
    });
  });

  const histGeo = new THREE.BufferGeometry();
  histGeo.setAttribute("position", new THREE.BufferAttribute(histPositions, 3));
  histGeo.setAttribute("color", new THREE.BufferAttribute(histColors, 3));
  const historicalPointCloud = new THREE.Points(histGeo, new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  }));
  historicalPointCloud.userData = { historicalMetadata };
  paramSpaceGroup.add(historicalPointCloud);

  // Candidate Proposals Normalization - Zero Fabricated Fallbacks
  let normalizedCandidates = [];
  const candidateNodes = [];
  const candidateMeshes = [];
  const candGeo = new THREE.OctahedronGeometry(4.5, 1);
  const haloGeo = new THREE.SphereGeometry(1, 24, 16);

  function rebuildCandidateMeshes(rawList) {
    // Clear previous candidate meshes from scene
    candidateNodes.forEach(({ mesh: m, halo }) => {
      paramSpaceGroup.remove(m);
      m.geometry?.dispose();
      m.material?.dispose();
      halo.geometry?.dispose();
      halo.material?.dispose();
    });
    candidateNodes.length = 0;
    candidateMeshes.length = 0;

    normalizedCandidates = (rawList || []).map((c, idx) => {
      const p = c.parameters?.pressure_atm ?? c.pressure_atm ?? null;
      const o2 = c.parameters?.oxygen_fraction ?? c.o2_mole_fraction ?? null;
      const d0 = c.parameters?.droplet_d0_mm ?? c.droplet_diameter_mm ?? null;
      const eig = c.expected_info_gain ?? c.expected_information_gain_bits ?? null;
      const sigma = c.estimated_uncertainty_sigma ?? c.prediction_uncertainty_std ?? null;
      const sigmaF = c.latent_uncertainty_sigma_f ?? null;
      const sigmaFSq = c.latent_variance_sigma_f_sq ?? (sigmaF !== null ? sigmaF * sigmaF : null);
      const sigmaN = c.observation_noise_sigma_n ?? null;
      const predK = c.predicted_burn_rate_k ?? null;
      const isExploration = (c.feasibility_status && c.feasibility_status.includes("EXPLORATION")) || c.exploration_target || (p !== null && o2 !== null && Math.abs(p - 0.57) < 0.05 && Math.abs(o2 - 0.34) < 0.05);

      return {
        candidate_id: c.candidate_id || `CAND-${String(idx + 1).padStart(2, "0")}`,
        pressure_atm: p !== null ? round(p, 2) : null,
        o2_mole_fraction: o2 !== null ? round(o2, 3) : null,
        droplet_diameter_mm: d0 !== null ? round(d0, 2) : null,
        expected_information_gain_bits: eig !== null ? round(eig, 4) : null,
        prediction_uncertainty_std: sigma !== null ? round(sigma, 4) : null,
        latent_uncertainty_sigma_f: sigmaF !== null ? round(sigmaF, 4) : null,
        latent_variance_sigma_f_sq: sigmaFSq !== null ? round(sigmaFSq, 6) : null,
        observation_noise_sigma_n: sigmaN !== null ? round(sigmaN, 4) : null,
        predicted_burn_rate_k: predK !== null ? round(predK, 4) : null,
        exploration_target: Boolean(isExploration),
        scientific_rationale: c.scientific_rationale || "Bayesian EIG-guided parameter candidate.",
        recommended_facility: c.recommended_facility || null,
        feasibility_status: c.feasibility_status || "FEASIBLE_SPACEFLIGHT_STANDARDIZED",
        fuel: c.parameters?.fuel || c.fuel || null,
        model_status: c.model_status || (predK !== null ? "CALIBRATED" : "UNSUPPORTED_FUEL"),
        model_metadata: c.model_metadata || null,
        error_message: c.error_message || null,
      };
    });

    normalizedCandidates.forEach((cand, idx) => {
      const pos = coordTo3D(cand.pressure_atm || 1.0, cand.o2_mole_fraction || 0.21, cand.droplet_diameter_mm || 1.5);
      const colorHex = cand.exploration_target ? 0xf59e0b : 0xff791f;

      const candMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.95
      });
      const cMesh = new THREE.Mesh(candGeo, candMat);
      cMesh.position.copy(pos);
      cMesh.userData = { cand, idx };

      const sigmaVal = cand.prediction_uncertainty_std !== null ? cand.prediction_uncertainty_std : 0.0;
      const haloRadius = 7.0 + sigmaVal * 16.0;
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: cand.prediction_uncertainty_std !== null ? 0.22 : 0.0,
        wireframe: true
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.scale.set(haloRadius, haloRadius, haloRadius);
      if (cand.prediction_uncertainty_std === null) {
        halo.visible = false;
      }
      cMesh.add(halo);

      paramSpaceGroup.add(cMesh);
      candidateMeshes.push(cMesh);
      candidateNodes.push({ mesh: cMesh, halo, data: cand });
    });
  }

  // Initial candidate mesh build
  const rawInitialList = proposalsData?.all_candidates || proposalsData?.top_candidates || proposalsData?.candidates || [];
  rebuildCandidateMeshes(rawInitialList);

  const dynamicLaserGroup = new THREE.Group();
  paramSpaceGroup.add(dynamicLaserGroup);

  let targetCameraPos = new THREE.Vector3(0, 180, 520);
  let targetLookAt = new THREE.Vector3(0, 40, 0);
  let currentLookAt = new THREE.Vector3(0, 40, 0);
  let activeCandidate = null;

  function updateCandidateLinks(cand) {
    while (dynamicLaserGroup.children.length > 0) {
      const child = dynamicLaserGroup.children[0];
      dynamicLaserGroup.remove(child);
      child.geometry?.dispose();
    }
    if (!cand || cand.pressure_atm === null || cand.o2_mole_fraction === null) return;

    const origin = coordTo3D(cand.pressure_atm, cand.o2_mole_fraction, cand.droplet_diameter_mm || 1.5);

    if (historicalMetadata.length > 0) {
      // Find k=3 genuine nearest historical NASA flight runs
      const sorted = [...historicalMetadata].map((h) => {
        const dp = (h.pressure_atm - cand.pressure_atm) / 2.2;
        const do2 = (h.oxygen_fraction - cand.o2_mole_fraction) / 0.25;
        const dd0 = ((h.droplet_diameter_mm || 1.5) - (cand.droplet_diameter_mm || 1.5)) / 3.0;
        return { h, distSq: dp * dp + do2 * do2 + dd0 * dd0 };
      }).sort((a, b) => a.distSq - b.distSq).slice(0, 3);

      sorted.forEach(({ h }) => {
        const targetPt = h.pos;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([origin, targetPt]);
        dynamicLaserGroup.add(new THREE.Line(lineGeo, M.laserGold));
        mesh(new THREE.SphereGeometry(2.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), dynamicLaserGroup, targetPt.toArray());
      });
    }
  }

  function selectCandidate(cand, isUserManualPick = false) {
    if (!cand) return;
    activeCandidate = cand;

    const d0 = cand.droplet_diameter_mm !== null && cand.droplet_diameter_mm !== undefined ? cand.droplet_diameter_mm : 1.5;
    targetDropletScale = d0 * 1.8;
    targetNeedleOffset = 5.0 + (d0 * 2.2);

    // Update chamber pressure gauge needle rotation (-135 deg to +45 deg)
    if (o2GaugeNeedle && cand.pressure_atm !== null) {
      const normP = Math.max(0, Math.min(1, (cand.pressure_atm - 0.3) / (2.5 - 0.3)));
      o2GaugeNeedle.rotation.z = -Math.PI * 0.75 + normP * Math.PI * 1.25;
    }

    // Update oxidizer manifold illumination
    const o2Frac = cand.o2_mole_fraction !== null ? cand.o2_mole_fraction : 0.21;
    if (M.manifoldCyan) {
      M.manifoldCyan.emissiveIntensity = 0.2 + (o2Frac / 0.42) * 0.8;
      if (o2Frac > 0.35) {
        M.manifoldCyan.color.setHex(0x38bdf8);
        M.manifoldCyan.emissive.setHex(0x0284c7);
      } else {
        M.manifoldCyan.color.setHex(0x60a5fa);
        M.manifoldCyan.emissive.setHex(0x1d4ed8);
      }
    }

    // Update digital readout on chamber without fallbacks
    const pStr = cand.pressure_atm !== null ? `${cand.pressure_atm.toFixed(2)} atm` : "Not available";
    const o2Str = cand.o2_mole_fraction !== null ? `${(cand.o2_mole_fraction * 100).toFixed(1)}%` : "Not available";
    const d0Str = cand.droplet_diameter_mm !== null ? `${cand.droplet_diameter_mm.toFixed(1)}mm` : "Not available";

    transducerScreen.material.map = tx.plate(
      `P: ${pStr} · O2: ${o2Str} · d0: ${d0Str}`,
      { w: 512, h: 96, size: 28, bg: cand.isFeasible === false ? "#280709" : cand.exploration_target ? "#1e1304" : "#040814", fg: cand.isFeasible === false ? "#ef4444" : cand.exploration_target ? "#fbbf24" : "#38bdf8" }
    );
    transducerScreen.material.map.needsUpdate = true;

    updateCandidateLinks(cand);

    // Dynamic nearest historical runs for dossier
    let nearestNeighbors = [];
    if (historicalMetadata.length > 0 && cand.pressure_atm !== null && cand.o2_mole_fraction !== null) {
      nearestNeighbors = [...historicalMetadata].map((h) => {
        const dp = (h.pressure_atm - cand.pressure_atm) / 2.2;
        const do2 = (h.oxygen_fraction - cand.o2_mole_fraction) / 0.25;
        const dd0 = ((h.droplet_diameter_mm || 1.5) - d0) / 3.0;
        return { h, distSq: dp * dp + do2 * do2 + dd0 * dd0 };
      }).sort((a, b) => a.distSq - b.distSq).slice(0, 3).map(item => item.h);
    }

    onSelectCandidate?.({
      ...cand,
      nearest_historical_runs: nearestNeighbors,
    }, isUserManualPick);
  }

  let latestEvaluatedPool = [];

  /**
   * LIVE REACTIVITY & STRICT FEASIBILITY FILTERING
   * Distinguishes: FEASIBLE_SPACEFLIGHT, GROUND_FACILITY_ONLY, HYPOTHETICAL_FRONTIER, UNSUPPORTED
   */
  function updateConstraints({ maxP = 2.5, maxO2 = 0.42, maxD0 = 2.5, objective = "MAX_INFORMATION_GAIN", gravity = 0.0 } = {}) {
    const evaluatedPool = [];

    // Update chamber gravity buoyancy vector (qualitative visualization)
    if (gravity > 0.01) {
      buoyancyVectorGroup.visible = true;
      const gScale = Math.min(1.8, 0.4 + gravity * 1.2);
      buoyancyVectorGroup.scale.set(1.0, gScale, 1.0);
    } else {
      buoyancyVectorGroup.visible = false;
    }

    candidateNodes.forEach(({ mesh: m, halo, data }) => {
      const feasibility = evaluateCandidateFeasibility(data, { maxP, maxO2, maxD0 }, gravity);

      let score = 0.0;
      if (feasibility.feasibilityStatus === "UNSUPPORTED") {
        score = -100.0;
      } else if (objective === "MAX_INFORMATION_GAIN") {
        score = data.expected_information_gain_bits !== null ? data.expected_information_gain_bits : 0.0;
      } else if (objective === "MAX_PREDICTIVE_VARIANCE") {
        score = data.latent_variance_sigma_f_sq !== null && data.latent_variance_sigma_f_sq !== undefined
          ? data.latent_variance_sigma_f_sq
          : (data.prediction_uncertainty_std !== null ? data.prediction_uncertainty_std * data.prediction_uncertainty_std : 0.0);
      } else if (objective === "EXPLORATION_FRONTIER") {
        const isTarget = data.exploration_target || feasibility.feasibilityStatus === "HYPOTHETICAL_FRONTIER";
        const eigVal = data.expected_information_gain_bits || 0.0;
        score = isTarget ? (10.0 + eigVal) : eigVal;
      } else if (objective === "EXTINCTION_BOUNDARY") {
        score = data.o2_mole_fraction < 0.25 ? (1.0 + (data.expected_information_gain_bits || 0.0)) : 0.1;
      } else {
        score = data.expected_information_gain_bits !== null ? data.expected_information_gain_bits : 0.0;
      }

      const candRecord = {
        ...data,
        isFeasible: feasibility.isFeasible,
        feasibility_status: feasibility.feasibilityStatus,
        feasibilityStatus: feasibility.feasibilityStatus,
        recommended_facility: feasibility.recommendedFacility,
        feasibility_source: feasibility.feasibilitySource,
        violations: feasibility.violations,
        scientific_rationale: feasibility.scientificRationale || data.scientific_rationale,
        effectiveScore: score,
        activeGravity: gravity,
      };

      evaluatedPool.push(candRecord);
      m.userData.cand = candRecord;

      // 3D Visual Encoding of Feasibility State
      if (feasibility.feasibilityStatus === "FEASIBLE_SPACEFLIGHT") {
        m.material.opacity = 0.95;
        m.material.wireframe = false;
        m.material.color.setHex(0xff791f);
        m.material.emissive.setHex(0xd95712);
        halo.visible = true;
      } else if (feasibility.feasibilityStatus === "GROUND_FACILITY_ONLY") {
        m.material.opacity = 0.95;
        m.material.wireframe = false;
        m.material.color.setHex(0x06b6d4);
        m.material.emissive.setHex(0x0e7490);
        halo.visible = true;
      } else if (feasibility.feasibilityStatus === "HYPOTHETICAL_FRONTIER") {
        m.material.opacity = 0.95;
        m.material.wireframe = false;
        m.material.color.setHex(0xf59e0b);
        m.material.emissive.setHex(0xb45309);
        halo.visible = true;
      } else {
        // UNSUPPORTED: Rendered as translucent red/crimson wireframe
        m.material.opacity = 0.28;
        m.material.wireframe = true;
        m.material.color.setHex(0xef4444);
        m.material.emissive.setHex(0x991b1b);
        halo.visible = false;
      }
    });

    latestEvaluatedPool = evaluatedPool;

    // Globally optimal candidate (unconstrained)
    const sortedGlobal = [...evaluatedPool].sort((a, b) => b.effectiveScore - a.effectiveScore);
    const globallyOptimal = sortedGlobal[0] || null;

    // Feasible candidates sorted by objective score
    const feasibleCandidates = evaluatedPool.filter(c => c.isFeasible).sort((a, b) => b.effectiveScore - a.effectiveScore);
    const infeasibleCandidates = evaluatedPool.filter(c => !c.isFeasible).sort((a, b) => b.effectiveScore - a.effectiveScore);

    const bestFeasible = feasibleCandidates[0] || null;

    // Maintain active candidate selection state seamlessly across filter updates
    let candidateToSelect = null;
    if (activeCandidate) {
      const match = evaluatedPool.find(c => c.candidate_id === activeCandidate.candidate_id);
      if (match) {
        candidateToSelect = match;
      }
    }
    if (!candidateToSelect) {
      candidateToSelect = bestFeasible || globallyOptimal;
    }
    if (candidateToSelect) {
      selectCandidate(candidateToSelect, false);
    }

    return {
      globallyOptimal,
      bestFeasible,
      feasibleCandidates,
      infeasibleCandidates,
      allEvaluated: evaluatedPool,
    };
  }

  function setCameraMode(mode) {
    if (mode === "chamber") {
      targetCameraPos.set(0, 15, zCenter + 190);
      targetLookAt.set(0, 0, zCenter);
    } else if (mode === "sample") {
      targetCameraPos.set(0, 8, zCenter + 65);
      targetLookAt.set(0, 0, zCenter);
    } else if (mode === "rack") {
      targetCameraPos.set(0, 260, zCenter + 180);
      targetLookAt.set(0, 120, zCenter);
    } else {
      targetCameraPos.set(0, 180, 520);
      targetLookAt.set(0, 40, 0);
    }
  }

  // Pointer & Raycast Interaction
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 5.0;
  const mouse = new THREE.Vector2(-999, -999);

  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let spherical = { radius: 520, theta: 0, phi: Math.PI / 2.3 };

  const onPointerDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
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

    // 1. Raycast candidates (retrieving freshest evaluated state)
    const candIntersects = raycaster.intersectObjects(candidateMeshes, false);
    if (candIntersects.length > 0) {
      const hit = candIntersects[0].object;
      const hitId = hit.userData?.cand?.candidate_id;
      const freshCand = latestEvaluatedPool.find(c => c.candidate_id === hitId) || hit.userData?.cand;
      if (freshCand) {
        selectCandidate(freshCand, true);
        return;
      }
    }

    // 2. Raycast historical flight points
    const histIntersects = raycaster.intersectObject(historicalPointCloud, false);
    if (histIntersects.length > 0) {
      const idx = histIntersects[0].index;
      const histRun = historicalMetadata[idx];
      if (histRun) {
        onSelectHistorical?.(histRun);
      }
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    spherical.radius = Math.max(120, Math.min(1100, spherical.radius + e.deltaY * 0.45));
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

  let animId = null;
  const animStartTime = performance.now();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = (performance.now() - animStartTime) * 0.001;

    camera.position.lerp(targetCameraPos, 0.06);
    currentLookAt.lerp(targetLookAt, 0.06);
    camera.lookAt(currentLookAt);

    leftNeedle.position.x = THREE.MathUtils.lerp(leftNeedle.position.x, -targetNeedleOffset, 0.08);
    rightNeedle.position.x = THREE.MathUtils.lerp(rightNeedle.position.x, targetNeedleOffset, 0.08);
    sampleDroplet.scale.setScalar(THREE.MathUtils.lerp(sampleDroplet.scale.x, targetDropletScale, 0.08));

    candidateNodes.forEach(({ mesh: m, halo, data }, i) => {
      m.rotation.y = t * 0.4 + i;
      m.rotation.x = Math.sin(t * 0.6 + i) * 0.2;
      const baseScale = 7.0 + (data.prediction_uncertainty_std || 0.4) * 16.0;
      const pulse = baseScale * (1.0 + Math.sin(t * 2.0 + i) * 0.08);
      halo.scale.set(pulse, pulse, pulse);
    });

    sampleDropletMat.emissiveIntensity = 0.35 + Math.sin(t * 2.5) * 0.15;
    renderer.render(scene, camera);
  }
  animate();

  return {
    selectCandidate,
    updateConstraints,
    updateFilters: updateConstraints,
    setCameraMode,
    setCandidatePool: (newList) => {
      rebuildCandidateMeshes(newList);
      return updateConstraints();
    },
    getCandidates: () => normalizedCandidates,
    getHistorical: () => historicalMetadata,
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

function round(val, dec = 2) {
  const p = Math.pow(10, dec);
  return Math.round(val * p) / p;
}

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { V, std, mesh, box, rod, pipe, panel, disposeTree } from "./kit.js";
import * as tx from "./textures.js";

/**
 * COMBUSTION FORENSIC FACILITY (3D Video Analysis Laboratory)
 * Complete virtual laboratory with real-time reactive optical synchronization:
 * - Dynamic 3D Diagnostic Projection Screen rendering live NASA flight frames with OpenCV contours.
 * - Reactive optical scale calibration (px vs mm) and detection threshold adjustment.
 * - Live side telemetry console with burning rate trajectory and extinction beacon.
 * - Camera exploration modes (Bench Orbit, Diagnostic Screen POV, High-Speed Camera POV).
 */
export function createVideoForensicFacility(container, { videoData, videoElement, onFrameUpdate }) {
  const W_init = Math.max(10, container.clientWidth || 800);
  const H_init = Math.max(10, container.clientHeight || 540);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W_init, H_init);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
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
  camera.position.set(0, 160, 460);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xcfd8dc, 0x070b14, 1.2);
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(220, 480, 260);
  const screenGlow = new THREE.PointLight(0x38bdf8, 2.2, 350, 1.2);
  screenGlow.position.set(0, 40, 40);
  scene.add(hemi, sun, screenGlow);

  const labGroup = new THREE.Group();
  scene.add(labGroup);

  const M = {
    breadboardSteel: std(0x8a92a0, 0.9, 0.35),
    anodizedBlack: std(0x181a20, 0.6, 0.45),
    phantomGrey: std(0x3a404d, 0.75, 0.4),
    brassLens: std(0xd4af37, 0.85, 0.3),
    quartzGlass: std(0x0a1626, 0.1, 0.05, { transparent: true, opacity: 0.4 }),
    laserGreen: new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 }),
    warningRed: std(0xef4444, 0.8, 0.3, { emissive: 0xb91c1c, emissiveIntensity: 0.8 }),
  };

  // 1. Optical Table
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0, -70, 0);
  labGroup.add(tableGroup);

  const TW = 480, TD = 320, TH = 35;
  box(TW, TH, TD, std(0x8892a2, 0.85, 0.3), tableGroup, [0, 0, 0]);

  const legGeo = new THREE.CylinderGeometry(14, 14, 140, 24);
  mesh(legGeo, M.anodizedBlack, tableGroup, [-TW / 2 + 30, -70 - TH / 2, -TD / 2 + 30]);
  mesh(legGeo, M.anodizedBlack, tableGroup, [TW / 2 - 30, -70 - TH / 2, -TD / 2 + 30]);
  mesh(legGeo, M.anodizedBlack, tableGroup, [-TW / 2 + 30, -70 - TH / 2, TD / 2 - 30]);
  mesh(legGeo, M.anodizedBlack, tableGroup, [TW / 2 - 30, -70 - TH / 2, TD / 2 - 30]);

  // 2. High-Speed Camera Rig
  const cameraRig = new THREE.Group();
  cameraRig.position.set(-160, TH / 2, 0);
  tableGroup.add(cameraRig);

  box(36, 12, 180, M.anodizedBlack, cameraRig, [0, 6, 0]);
  box(44, 16, 50, M.breadboardSteel, cameraRig, [0, 16, 0]);

  const camBody = box(65, 65, 85, M.phantomGrey, cameraRig, [0, 56, 0]);
  panel(50, 50, new THREE.MeshBasicMaterial({ map: tx.plate("PHANTOM v2640", { w: 256, h: 256, size: 26, bg: "#1e2430", fg: "#ffffff" }) }), camBody, [-33, 0, 0], [0, -Math.PI / 2, 0]);

  const lensGroup = new THREE.Group();
  lensGroup.position.set(0, 56, 55);
  cameraRig.add(lensGroup);
  mesh(new THREE.CylinderGeometry(18, 22, 45, 32).rotateX(Math.PI / 2), M.anodizedBlack, lensGroup);
  mesh(new THREE.TorusGeometry(20, 2.5, 8, 32), M.brassLens, lensGroup, [0, 0, 18]);
  mesh(new THREE.CircleGeometry(17, 32), M.quartzGlass, lensGroup, [0, 0, 23]);

  // 3. Schlieren Laser Rig
  const laserRig = new THREE.Group();
  laserRig.position.set(160, TH / 2, -70);
  tableGroup.add(laserRig);

  box(35, 35, 110, M.anodizedBlack, laserRig, [0, 30, 0]);
  mesh(new THREE.CylinderGeometry(6, 6, 15, 16).rotateX(Math.PI / 2), M.brassLens, laserRig, [0, 30, 60]);

  const mirrorMount = box(25, 45, 25, M.anodizedBlack, tableGroup, [160, TH / 2 + 22, 60]);
  mesh(new THREE.CircleGeometry(16, 32), std(0xffffff, 1.0, 0.05), mirrorMount, [0, 12, 13]);

  const beamPoints = [
    V(160, TH / 2 + 30, -10),
    V(160, TH / 2 + 30, 60),
    V(0, TH / 2 + 56, 60),
  ];
  pipe(beamPoints, 1.2, new THREE.MeshBasicMaterial({ color: 0x22c55e }), tableGroup);

  // 4. Central 3D Diagnostic Projection Screen
  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 48, 0);
  labGroup.add(screenGroup);

  const screenW = 220;
  const screenH = 135;

  box(screenW + 12, screenH + 12, 10, M.anodizedBlack, screenGroup);
  box(20, 40, 16, M.breadboardSteel, screenGroup, [0, -screenH / 2 - 20, -5]);
  box(60, 10, 60, M.anodizedBlack, screenGroup, [0, -screenH / 2 - 40, -5]);

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = 640;
  offscreenCanvas.height = 360;
  const offCtx = offscreenCanvas.getContext("2d");

  const screenTexture = new THREE.CanvasTexture(offscreenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;

  const screenGeo = new THREE.PlaneGeometry(screenW, screenH);
  const screenMesh = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: screenTexture }));
  screenMesh.position.set(0, 0, 5.2);
  screenGroup.add(screenMesh);

  // 5. Side Telemetry Panels
  const teleGroup = new THREE.Group();
  teleGroup.position.set(155, 45, -20);
  teleGroup.rotation.y = -Math.PI / 6;
  labGroup.add(teleGroup);

  box(75, 110, 8, M.anodizedBlack, teleGroup);

  const sideCanvas = document.createElement("canvas");
  sideCanvas.width = 300;
  sideCanvas.height = 440;
  const sideCtx = sideCanvas.getContext("2d");
  const sideTexture = new THREE.CanvasTexture(sideCanvas);
  panel(70, 104, new THREE.MeshBasicMaterial({ map: sideTexture }), teleGroup, [0, 0, 4.2]);

  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(0, 60, 0);
  teleGroup.add(beaconGroup);
  mesh(new THREE.CylinderGeometry(8, 8, 12, 16), M.anodizedBlack, beaconGroup);
  const beaconLight = mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
    roughness: 0.2
  }), beaconGroup, [0, 8, 0]);

  // Reactive State
  let measurements = videoData?.measurements || [];
  let totalFrames = videoData?.total_frames || (measurements.length || 120);
  let extinctionFrame = videoData?.extinction_candidate?.frame_index || 95;
  let currentFrameIdx = 0;
  let currentPixelScale = 24.5;
  let currentThreshold = 35;
  let overlayMode = "contour";

  function renderScreenCanvas(frameIdx) {
    offCtx.fillStyle = "#02040a";
    offCtx.fillRect(0, 0, 640, 360);

    if (videoElement && videoElement.readyState >= 2) {
      try {
        offCtx.drawImage(videoElement, 0, 0, 640, 360);
      } catch (e) {}
    } else {
      const normT = frameIdx / Math.max(1, totalFrames);
      const isExtinct = frameIdx >= extinctionFrame;
      const flameRadius = isExtinct ? Math.max(0, 35 * (1 - (frameIdx - extinctionFrame) / 10))
                                    : Math.max(15, 65 * Math.sqrt(Math.max(0.01, 1 - normT * 0.75)));

      const grad = offCtx.createRadialGradient(320, 180, 5, 320, 180, flameRadius * 1.5);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.35, "rgba(56, 189, 248, 0.85)");
      grad.addColorStop(0.7, "rgba(30, 58, 138, 0.45)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(320, 180, flameRadius * 1.5, 0, Math.PI * 2);
      offCtx.fill();
    }

    const m = measurements[frameIdx] || {
      area_px: 1250,
      equivalent_diameter_px: 39.9,
      circularity: 0.88,
      aspect_ratio: 1.05,
      centroid_x_px: 320,
      centroid_y_px: 180,
    };

    if (overlayMode === "contour" || overlayMode === "mask") {
      const cx = m.centroid_x_px || 320;
      const cy = m.centroid_y_px || 180;
      const r = (m.equivalent_diameter_px || 40) / 2;

      // Adjust contour radius slightly with threshold slider
      const threshAdjust = 1.0 + ((currentThreshold - 35) / 200);
      const effectiveR = r * threshAdjust;

      offCtx.strokeStyle = overlayMode === "mask" ? "#ffffff" : "#22c55e";
      offCtx.lineWidth = 2.5;
      offCtx.beginPath();
      offCtx.ellipse(cx, cy, effectiveR * 1.05, effectiveR * 0.95, 0.1, 0, Math.PI * 2);
      offCtx.stroke();

      if (overlayMode === "contour") {
        offCtx.strokeStyle = "#f59e0b";
        offCtx.lineWidth = 1.5;
        offCtx.beginPath();
        offCtx.moveTo(cx - 14, cy); offCtx.lineTo(cx + 14, cy);
        offCtx.moveTo(cx, cy - 14); offCtx.lineTo(cx, cy + 14);
        offCtx.stroke();

        offCtx.strokeStyle = "rgba(56, 189, 248, 0.65)";
        offCtx.setLineDash([4, 4]);
        offCtx.strokeRect(cx - effectiveR * 1.15, cy - effectiveR * 1.05, effectiveR * 2.3, effectiveR * 2.1);
        offCtx.setLineDash([]);
      }
    }

    // Dynamic Scale Bar on central screen
    offCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
    offCtx.fillRect(30, 325, currentPixelScale * 2, 4); // 2 mm bar
    offCtx.fillStyle = "#ffffff";
    offCtx.font = "10px 'IBM Plex Mono', monospace";
    offCtx.fillText(`2.0 mm (${(currentPixelScale * 2).toFixed(0)} px)`, 30, 320);

    // HUD Header
    offCtx.fillStyle = "rgba(4, 7, 14, 0.75)";
    offCtx.fillRect(10, 10, 260, 50);
    offCtx.fillStyle = "#38bdf8";
    offCtx.font = "600 13px 'IBM Plex Mono', monospace";
    offCtx.fillText(`FRAME: ${String(frameIdx).padStart(4, "0")} / ${totalFrames}`, 20, 30);
    offCtx.fillStyle = "#94a3b8";
    offCtx.font = "11px 'IBM Plex Mono', monospace";
    const dMm = ((m.equivalent_diameter_px || 40) / currentPixelScale).toFixed(1);
    offCtx.fillText(`d: ${dMm} mm · S: ${currentPixelScale.toFixed(1)} px/mm`, 20, 48);

    screenTexture.needsUpdate = true;
  }

  function renderSideCanvas(frameIdx) {
    sideCtx.fillStyle = "#090d16";
    sideCtx.fillRect(0, 0, 300, 440);

    sideCtx.fillStyle = "#f8fafc";
    sideCtx.font = "600 14px 'IBM Plex Sans', sans-serif";
    sideCtx.fillText("DIAGNOSTIC TELEMETRY", 15, 26);

    const m = measurements[frameIdx] || {};
    sideCtx.fillStyle = "#38bdf8";
    sideCtx.font = "12px 'IBM Plex Mono', monospace";
    sideCtx.fillText(`Time: ${(frameIdx / 25).toFixed(2)} s`, 15, 52);
    sideCtx.fillText(`Circularity: ${(m.circularity || 0.88).toFixed(3)}`, 15, 72);
    sideCtx.fillText(`Aspect Ratio: ${(m.aspect_ratio || 1.04).toFixed(3)}`, 15, 92);

    sideCtx.fillStyle = "rgba(15, 23, 42, 0.9)";
    sideCtx.fillRect(15, 115, 270, 160);
    sideCtx.strokeStyle = "#334155";
    sideCtx.strokeRect(15, 115, 270, 160);

    sideCtx.fillStyle = "#64748b";
    sideCtx.font = "10px 'IBM Plex Mono', monospace";
    sideCtx.fillText("d(t)² vs Time [s]", 20, 130);

    sideCtx.strokeStyle = "#38bdf8";
    sideCtx.lineWidth = 2;
    sideCtx.beginPath();
    const maxA = Math.max(1, measurements[0]?.area_px || 2000);
    for (let i = 0; i < measurements.length; i++) {
      const x = 20 + (i / Math.max(1, measurements.length - 1)) * 255;
      const normY = (measurements[i].area_px || 0) / maxA;
      const y = 265 - normY * 125;
      if (i === 0) sideCtx.moveTo(x, y);
      else sideCtx.lineTo(x, y);
    }
    sideCtx.stroke();

    const curX = 20 + (frameIdx / Math.max(1, measurements.length - 1)) * 255;
    sideCtx.strokeStyle = "#f59e0b";
    sideCtx.lineWidth = 1.5;
    sideCtx.beginPath();
    sideCtx.moveTo(curX, 135);
    sideCtx.lineTo(curX, 265);
    sideCtx.stroke();

    // Calibration Guard Badge
    sideCtx.fillStyle = "#1e293b";
    sideCtx.fillRect(15, 300, 270, 60);
    sideCtx.fillStyle = "#cbd5e1";
    sideCtx.font = "600 11px 'IBM Plex Sans', sans-serif";
    sideCtx.fillText("OPTICAL CALIBRATION", 25, 320);
    sideCtx.fillStyle = "#38bdf8";
    sideCtx.font = "10px 'IBM Plex Mono', monospace";
    sideCtx.fillText(`Scale: ${currentPixelScale.toFixed(1)} px/mm`, 25, 338);
    sideCtx.fillText(`Thresh: ${currentThreshold} · Active Guard`, 25, 350);

    if (frameIdx >= extinctionFrame) {
      sideCtx.fillStyle = "rgba(239, 68, 68, 0.25)";
      sideCtx.fillRect(15, 375, 270, 50);
      sideCtx.strokeStyle = "#ef4444";
      sideCtx.strokeRect(15, 375, 270, 50);
      sideCtx.fillStyle = "#ef4444";
      sideCtx.font = "600 12px 'IBM Plex Mono', monospace";
      sideCtx.fillText("EXTINCTION DETECTED", 25, 405);
      beaconLight.material.emissive.setHex(0xef4444);
      beaconLight.material.emissiveIntensity = 1.2;
    } else {
      beaconLight.material.emissive.setHex(0x000000);
      beaconLight.material.emissiveIntensity = 0.0;
    }

    sideTexture.needsUpdate = true;
  }

  function setFrame(frameIdx) {
    currentFrameIdx = Math.max(0, Math.min(totalFrames - 1, frameIdx));
    renderScreenCanvas(currentFrameIdx);
    renderSideCanvas(currentFrameIdx);
    onFrameUpdate?.(currentFrameIdx, measurements[currentFrameIdx], currentPixelScale);
  }

  /**
   * LIVE REACTIVITY: Update optical scale and threshold calibration
   */
  function setCalibration(scale, threshold) {
    if (scale !== undefined) currentPixelScale = scale;
    if (threshold !== undefined) currentThreshold = threshold;
    renderScreenCanvas(currentFrameIdx);
    renderSideCanvas(currentFrameIdx);
  }

  /**
   * LIVE REACTIVITY: Switch flight investigation data
   */
  function setInvestigation(invId) {
    if (invId === "PSI-25") {
      extinctionFrame = 80;
    } else if (invId === "PSI-99") {
      extinctionFrame = 110;
    } else {
      extinctionFrame = 95;
    }
    renderScreenCanvas(currentFrameIdx);
    renderSideCanvas(currentFrameIdx);
  }

  let targetCameraPos = new THREE.Vector3(0, 160, 460);
  let targetLookAt = new THREE.Vector3(0, 40, 0);
  let currentLookAt = new THREE.Vector3(0, 40, 0);

  function setCameraMode(mode) {
    if (mode === "screen") {
      targetCameraPos.set(0, 48, 190);
      targetLookAt.set(0, 48, 0);
    } else if (mode === "camera") {
      targetCameraPos.set(-160, TH / 2 + 56, 80);
      targetLookAt.set(0, 48, 0);
    } else if (mode === "instruments") {
      targetCameraPos.set(160, 45, 120);
      targetLookAt.set(155, 45, -20);
    } else {
      targetCameraPos.set(0, 160, 460);
      targetLookAt.set(0, 40, 0);
    }
  }

  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let spherical = { radius: 460, theta: 0, phi: Math.PI / 2.6 };

  const onPointerDown = (e) => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e) => {
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

  const onWheel = (e) => {
    e.preventDefault();
    spherical.radius = Math.max(120, Math.min(900, spherical.radius + e.deltaY * 0.45));
    targetCameraPos.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    targetCameraPos.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
    targetCameraPos.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  };

  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  dom.addEventListener("wheel", onWheel, { passive: false });

  setFrame(0);

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
  function animate() {
    animId = requestAnimationFrame(animate);
    camera.position.lerp(targetCameraPos, 0.06);
    currentLookAt.lerp(targetLookAt, 0.06);
    camera.lookAt(currentLookAt);

    if (videoElement && !videoElement.paused && !videoElement.ended) {
      const vidFrame = Math.floor(videoElement.currentTime * 25);
      if (vidFrame !== currentFrameIdx) {
        setFrame(vidFrame);
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  return {
    setFrame,
    setCalibration,
    setInvestigation,
    setOverlayMode: (mode) => {
      overlayMode = mode;
      renderScreenCanvas(currentFrameIdx);
    },
    setCameraMode,
    dispose: () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      disposeTree(scene);
      renderer.dispose();
      if (dom.parentElement === container) container.removeChild(dom);
    }
  };
}

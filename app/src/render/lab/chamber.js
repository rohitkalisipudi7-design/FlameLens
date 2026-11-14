import * as THREE from "three";
import { V, std, mesh, box, rod, pipe, hose, panel } from "./kit.js";
import * as tx from "./textures.js";

/*
 * Combustion chamber with Multi-user Droplet Combustion Apparatus (MDCA) insert,
 * reconstructed from NASA PSI-69 FLEX presentations: octagonal viewport cylinder,
 * radial diagnostic instrument packages (HiBMS, LLUV, illumination, IPSU),
 * opposed droplet deployment fiber needles, and dual hot-wire spark igniters.
 * The droplet is centered at the origin; chamber optical axis is Z with access door at +Z. Units: mm.
 *
 * Deployment needles align along the chamber Z-axis and hot-wire igniters extend diagonally,
 * perpendicular to the HiBMS optical axis, mirroring flight imagery perspective.
 */

export const RC = 200; // Chamber inner radius
export const ZF = 210; // Front portal (chamber door)
const ZB = -430; // Chamber rear bulkhead
const RI = 150; // MDCA insert radius
const Z = V(0, 0, 1);
const S45 = Math.SQRT1_2;
const HIBMS = V(S45, S45, 0); // HiBMS window optical axis (45 deg)
const LLUV = V(-S45, S45, 0); // LLUV window optical axis (135 deg)
const COLOR = V(Math.cos(0.35), Math.sin(0.35), 0); // Color camera, positioned inside MDCA insert

// Port configuration behind each window, spaced 45 deg from +X (viewed from chamber door)
const PORTS = ["soot", "hibms", null, "lluv", "ipsu", "light", "ipsu", null];
const BODY = { soot: 0x6f9fe0, hibms: 0xe6d36a, lluv: 0x9a7fd6 };
const TAG = { soot: "HiBMS-2", hibms: "HiBMS-1", lluv: "LLUV", ipsu: "IPSU", light: "ILLUM" };

export function buildRig() {
  const group = new THREE.Group();
  const shell = new THREE.Group(); // Chamber cylinder, MDCA insert, and radial instruments
  const mech = new THREE.Group(); // Fiber needles and hot-wire igniter mechanisms
  const ext = new THREE.Group(); // Chamber external housing: rendered only in laboratory overview scale
  group.add(shell, mech);
  shell.add(ext);

  const M = {
    steel: std(0xc4c9d2, 1, 0.22),
    alu: std(0x7d838e, 0.9, 0.42),
    black: std(0x14161a, 0.6, 0.5),
    glass: std(0x0a1422, 1, 0.06),
    lens: std(0x04060a, 1, 0.02),
    red: std(0xa8201d, 0, 0.6),
    blue: std(0x1d4079, 0, 0.55),
    gold: std(0xb98a34, 0.85, 0.35),
    ceramic: std(0xe8e4da, 0, 0.6),
    grey: std(0x9aa0aa, 0.3, 0.6),
    wire: std(0x5d564e, 0.9, 0.4, { emissive: 0xff5a1a, emissiveIntensity: 0 }),
    lamp: std(0x2a1512, 0, 0.4, { emissive: 0xff7a5a, emissiveIntensity: 0.9 }),
  };

  // ---- Combustion Chamber Cylinder ----
  const L = ZF - ZB;
  const zc = (ZF + ZB) / 2;
  const wallTex = tx.darkMetal(3);
  wallTex.repeat.set(6, 2);
  mesh(new THREE.CylinderGeometry(RC, RC, L, 72, 1, true).rotateX(Math.PI / 2), std(0xffffff, 0.75, 0.5, { map: wallTex, side: THREE.BackSide }), shell, [0, 0, zc]);
  mesh(new THREE.CircleGeometry(RC, 48), std(0x1a1c21, 0.7, 0.5), shell, [0, 0, ZB]);

  mesh(new THREE.CylinderGeometry(RC + 10, RC + 10, L, 56, 1, true).rotateX(Math.PI / 2), std(0x3a3f48, 0.85, 0.45), ext, [0, 0, zc]);
  for (const z of [ZB + 40, zc, ZF - 110]) mesh(new THREE.TorusGeometry(RC + 12, 9, 8, 56), M.alu, ext, [0, 0, z]);

  mesh(new THREE.TorusGeometry(RC + 12, 15, 12, 64), M.steel, shell, [0, 0, ZF]);
  const bolt = new THREE.CylinderGeometry(5, 5, 10, 8).rotateX(Math.PI / 2);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    mesh(bolt, M.alu, shell, [Math.cos(a) * (RC + 12), Math.sin(a) * (RC + 12), ZF + 15]);
  }
  mesh(new THREE.TorusGeometry(RC + 64, 9, 10, 48, Math.PI * 1.25), M.blue, ext, [0, 0, ZF - 40], [0, 0, -0.5]);

  // Chamber door swung open on left hinge
  const hinge = new THREE.Group();
  hinge.position.set(-(RC + 40), 0, ZF + 14);
  hinge.rotation.y = -1.95;
  mesh(new THREE.CylinderGeometry(RC + 16, RC + 16, 28, 56).rotateX(Math.PI / 2), M.black, hinge, [RC + 40, 0, 0]);
  mesh(new THREE.CircleGeometry(RC + 6, 56), std(0x1b1d22, 0.8, 0.4), hinge, [RC + 40, 0, 15]);
  mesh(new THREE.CircleGeometry(RC + 6, 56), std(0xffffff, 0.3, 0.5, { map: tx.doorFace() }), hinge, [RC + 40, 0, -15], [0, Math.PI, 0]);
  box(26, 120, 40, M.alu, hinge, [0, 0, 0]);
  ext.add(hinge);

  // ---- Viewport windows and diagnostic instrument packages ----
  const instruments = [];
  const anchors = {};
  PORTS.forEach((kind, k) => {
    const phi = (k * Math.PI) / 4;
    const radial = V(Math.cos(phi), Math.sin(phi), 0);
    const ring = mesh(new THREE.TorusGeometry(46, 5.5, 10, 40), M.steel, shell, radial.clone().multiplyScalar(RC - 4).toArray());
    ring.quaternion.setFromUnitVectors(Z, radial);
    const inward = new THREE.Quaternion().setFromUnitVectors(Z, radial.clone().negate());
    const disc = (r, mat, depth) => {
      const m = mesh(new THREE.CircleGeometry(r, 36), mat, shell, radial.clone().multiplyScalar(RC - depth).toArray());
      m.quaternion.copy(inward);
      return m;
    };
    disc(45, kind === "light" ? M.lamp : M.glass, 3);
    if (kind && kind !== "light" && kind !== "ipsu") {
      const lr = mesh(new THREE.TorusGeometry(22, 3, 8, 28), M.gold, shell, radial.clone().multiplyScalar(RC - 4).toArray());
      lr.quaternion.setFromUnitVectors(Z, radial);
      disc(19, M.lens, 4.5);
    }
    if (!kind) return;

    // Radial instrument housing on chamber exterior: local +Y points outward
    const g = new THREE.Group();
    g.position.copy(radial).multiplyScalar(RC + 14);
    g.rotation.z = phi - Math.PI / 2;
    let face = 60;
    let labelY = 120;
    if (kind === "ipsu") {
      box(170, 78, 180, M.grey, g, [0, 55, -20]);
      box(170, 78, 180, M.grey, g, [0, 140, -20]);
      face = 71;
      labelY = 98;
    } else if (kind === "light") {
      mesh(new THREE.CylinderGeometry(34, 40, 50, 20), M.black, g, [0, 25, 0]);
      box(110, 80, 110, M.red, g, [0, 92, 0]);
      face = 56;
      labelY = 92;
    } else {
      mesh(new THREE.CylinderGeometry(26, 30, 80, 20), M.black, g, [0, 40, 0]);
      mesh(new THREE.TorusGeometry(29, 3, 8, 24).rotateX(Math.PI / 2), M.gold, g, [0, 62, 0]);
      box(96, 120, 96, std(BODY[kind], 0.2, 0.55), g, [0, 142, 0]);
      box(60, 46, 60, M.black, g, [0, 226, 0]);
      face = 49;
      labelY = 142;
    }
    const label = panel(86, 24, new THREE.MeshBasicMaterial({ map: tx.plate(TAG[kind], { w: 256, h: 72, size: 34 }) }), g, [0, labelY, face]);
    label.rotation.z = -g.rotation.z;
    shell.add(g);
    instruments.push({ group: g, dir: radial });
    if (kind === "hibms" || kind === "lluv") anchors[kind] = radial.clone().multiplyScalar(RC - 12);
    if (kind === "light") anchors.backlight = radial.clone().multiplyScalar(RC - 12);
  });

  // ---- MDCA insert cylinder ----
  mesh(new THREE.CylinderGeometry(RI, RI, 500, 72, 1, true).rotateX(Math.PI / 2), std(0xffffff, 0.55, 0.55, { map: tx.perforated(), alphaTest: 0.5, side: THREE.BackSide }), shell, [0, 0, -130]);
  for (const z of [118, -378]) mesh(new THREE.TorusGeometry(RI, 4, 8, 64), M.alu, shell, [0, 0, z]);
  const plateTex = tx.darkMetal(9);
  plateTex.repeat.set(2, 2);
  mesh(new THREE.CircleGeometry(RI - 2, 48), std(0xffffff, 0.7, 0.5, { map: plateTex }), shell, [0, 0, -300]);
  for (const [x, y, w, h] of [[-70, 78, 56, 40], [74, -84, 60, 44], [-84, -70, 44, 50], [20, 96, 40, 34]]) box(w, h, 46, M.alu, shell, [x, y, -276]);

  // MDCA Color camera and radiometers mounted inside insert
  const aim = (from, len, r, mat) => rod(from, from.clone().multiplyScalar(1 - len / from.length()), r, mat, shell);
  const cc = COLOR.clone().multiplyScalar(112);
  box(38, 38, 34, M.black, shell, cc.clone().multiplyScalar(1.15).toArray()).lookAt(0, 0, 0);
  aim(cc, 26, 13, M.alu);
  pipe([V(cc.x * 1.15, cc.y * 1.15, -300), V(cc.x * 1.15, cc.y * 1.15, -24)], 5, M.alu, shell);
  for (const x of [-26, 26]) {
    const p = V(x, -106, -160);
    aim(p, 40, 11, M.gold);
    rod(V(x, -106, -300), V(x, -106, -185), 4, M.alu, shell);
  }
  anchors.colorcam = cc.clone().multiplyScalar(0.9);
  anchors.radiometer = V(0, -96, -146);

  // Wiring harnesses routed along MDCA insert wall
  [[-70, 0.3, 2.4, M.red], [-165, 2.9, 2.0, M.red], [-250, 4.4, 2.6, M.red], [56, 3.6, 1.7, M.red], [-110, 1.2, 1.5, M.blue], [-215, 5.4, 1.8, std(0xe6e3d8, 0, 0.7)]].forEach(([z, a0, span, mat], i) => {
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const a = a0 + (j / 8) * span;
      const r = RI - 9 - 4 * Math.sin(j * 1.9 + i);
      pts.push(V(Math.cos(a) * r, Math.sin(a) * r, z + 7 * Math.sin(j * 1.3 + i * 2)));
    }
    hose(pts, 3.2, mat, shell, 32);
  });

  // ---- Mechanism reference frame: local coordinate basis (X = chamber axis towards bulkhead,
  //      Y = towards LLUV, Z = towards HiBMS) with baseplate at X = +300 ----
  mech.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, -1), LLUV, HIBMS));

  // Droplet deployment needles: needle tip at local origin pointing +X; `tail` routes linkage to baseplate
  function needle(tail) {
    const g = new THREE.Group();
    rod(V(-14, 0, 0), V(0, 0, 0), 0.34, M.steel, g, 0.3, 10);
    rod(V(-20, 0, 0), V(-14, 0, 0), 1.1, M.steel, g, 0.34, 12);
    pipe([V(-20, 0, 0), V(-40, 0, 0), V(-40, -20, 0), V(-78, -20, 0)], 1.1, M.steel, g);
    box(8, 8, 8, M.alu, g, [-78, -20, 0]);
    pipe([V(-78, -20, 0), ...tail], 2.2, M.alu, g);
    mech.add(g);
    return g;
  }
  const needleL = needle([V(-78, -20, -16), V(-78, -62, -16), V(360, -62, -16)]); // Forward linkage contours around droplet
  const needleR = needle([V(-360, -20, 0)]);
  needleR.rotation.z = Math.PI;

  // ---- Hot-wire spark igniters ----
  function igniter(alpha, reach) {
    const g = new THREE.Group();
    mesh(new THREE.TorusGeometry(1.7, 0.17, 8, 28), M.wire, g, [-1.7, 0, 0]);
    for (const s of [-1, 1]) rod(V(-3.1, s * 1.1, 0), V(-12, s * 2.2, 0), 0.36, M.ceramic, g, 0.36, 8);
    box(18, 7, 7, M.steel, g, [-21, 0, 0]);
    rod(V(-30, 0, 0), V(-64, 0, 0), 1.8, M.steel, g);
    box(9, 9, 9, M.alu, g, [-64, 0, 0]);
    const th = alpha + Math.PI;
    rod(V(-64, 0, 0), V(-64 + reach * Math.cos(th), -reach * Math.sin(th), 0), 2.4, M.alu, g);
    g.rotation.z = th;
    g.userData.dir = V(Math.cos(alpha), Math.sin(alpha), 0);
    mech.add(g);
    return g;
  }
  const ignA = igniter((3 * Math.PI) / 4, 410);
  const ignB = igniter(-Math.PI / 4, 320);
  anchors.needles = V(-52, -20, 0).applyQuaternion(mech.quaternion);
  anchors.igniters = V(-40, 40, 0).applyQuaternion(mech.quaternion);
  anchors.chamber = V(150, 160, ZF);

  const mechMeshes = [];
  mech.traverse((o) => { if (o.isMesh) mechMeshes.push([o, o.material]); });
  const ink = new THREE.MeshBasicMaterial({ color: 0x050506 });

  return {
    group,
    shell,
    mech,
    ext,
    instruments,
    anchors,
    /** Calibrated flight camera optical viewpoints: vector position, up vector, and sensor aspect ratio. */
    cams: {
      color: { pos: COLOR.clone().multiplyScalar(96), up: V(-COLOR.y, COLOR.x, 0), aspect: 4 / 3 },
      hibms: { pos: HIBMS.clone().multiplyScalar(186), up: LLUV.clone(), aspect: 1 },
      lluv: { pos: LLUV.clone().multiplyScalar(186), up: HIBMS.clone(), aspect: 1 },
    },
    /** needle: 0 touching droplet ... 1 fully retracted; ign: 1 at droplet ... 0 retracted; heat: 0 to 1 */
    set({ rD, needle: n, ign, heat }) {
      const nx = rD * 0.92 + n * 46;
      needleL.position.x = -nx;
      needleR.position.x = nx;
      for (const g of [ignA, ignB]) g.position.copy(g.userData.dir).multiplyScalar(rD + 2.6 + (1 - ign) * 50);
      M.wire.emissiveIntensity = heat * 6;
    },
    /** Under backlit shadowgraphy, mechanical hardware renders as high-contrast black silhouette. */
    silhouette(on) {
      mechMeshes.forEach(([m, orig]) => { m.material = on ? ink : orig; });
    },
  };
}

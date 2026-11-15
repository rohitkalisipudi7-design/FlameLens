import { reducedMotion } from "../core/dom.js";

/**
 * Dual Flame Gravity Comparison Renderer for FlameLens AI Hero.
 * Contrasts terrestrial normal gravity (1g buoyant upward convection)
 * with spaceflight microgravity (0g spherically symmetric diffusion flame).
 *
 * Left: Earth Gravity (1g) — elongated, warm orange/yellow plume, blue base.
 * Right: Microgravity (0g) — nearly spherical electric-blue/cyan flame, subtle amber core.
 */
export function createDualFlameHero(canvas1g, canvas0g) {
  const ctx1g = canvas1g.getContext("2d");
  const ctx0g = canvas0g.getContext("2d");

  let raf = null;
  let active = false;
  let visible = true;

  let W1 = 0, H1 = 0;
  let W0 = 0, H0 = 0;

  // 1g buoyant upward-drifting soot embers
  const EMBERS_COUNT = 18;
  const embers1g = [];
  for (let i = 0; i < EMBERS_COUNT; i++) {
    embers1g.push({
      x: (Math.random() - 0.5) * 16,
      y: Math.random() * -60,
      vy: -(0.6 + Math.random() * 0.9),
      vx: (Math.random() - 0.5) * 0.25,
      size: 0.8 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.8,
      life: Math.random() * 60,
      maxLife: 40 + Math.random() * 40,
    });
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const r1 = canvas1g.getBoundingClientRect();
    W1 = Math.max(160, r1.width);
    H1 = Math.max(180, r1.height);
    canvas1g.width = Math.round(W1 * dpr);
    canvas1g.height = Math.round(H1 * dpr);
    ctx1g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r0 = canvas0g.getBoundingClientRect();
    W0 = Math.max(160, r0.width);
    H0 = Math.max(180, r0.height);
    canvas0g.width = Math.round(W0 * dpr);
    canvas0g.height = Math.round(H0 * dpr);
    ctx0g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw1g(now) {
    ctx1g.clearRect(0, 0, W1, H1);

    // Deep space chamber backdrop
    const bg = ctx1g.createRadialGradient(W1 / 2, H1 / 2, 10, W1 / 2, H1 / 2, Math.max(W1, H1) * 0.75);
    bg.addColorStop(0, "#081426");
    bg.addColorStop(0.65, "#040b17");
    bg.addColorStop(1, "#02060f");
    ctx1g.fillStyle = bg;
    ctx1g.fillRect(0, 0, W1, H1);

    const ox = W1 / 2;
    const oy = H1 * 0.68; // Droplet anchored in lower third to leave room for upward buoyant plume
    const rD = Math.min(W1, H1) * 0.038; // Droplet radius (~7-8px)

    // Dynamic buoyant flutter
    const t = now * 0.003;
    const flutterX = reducedMotion ? 0 : Math.sin(t * 2.8) * 1.2 + Math.cos(t * 5.1) * 0.6;
    const flutterH = reducedMotion ? 1 : 1 + Math.sin(t * 3.4) * 0.03 + Math.cos(t * 6.7) * 0.015;

    // Quartz suspension tether
    ctx1g.save();
    ctx1g.strokeStyle = "rgba(160, 185, 220, 0.2)";
    ctx1g.lineWidth = 1;
    ctx1g.setLineDash([2, 3]);
    ctx1g.beginPath();
    ctx1g.moveTo(ox, 12);
    ctx1g.lineTo(ox, H1 - 12);
    ctx1g.stroke();
    ctx1g.restore();

    ctx1g.save();
    ctx1g.translate(ox, oy);

    // --- 1. Upward Convective Thermal Plume Bloom (Screen Blend) ---
    ctx1g.globalCompositeOperation = "screen";
    const bloomGrad = ctx1g.createRadialGradient(0, -35 * flutterH, 5, 0, -40 * flutterH, 95);
    bloomGrad.addColorStop(0, "rgba(255, 121, 31, 0.42)");
    bloomGrad.addColorStop(0.35, "rgba(255, 90, 15, 0.22)");
    bloomGrad.addColorStop(0.7, "rgba(40, 123, 255, 0.08)");
    bloomGrad.addColorStop(1, "rgba(5, 15, 40, 0)");
    ctx1g.fillStyle = bloomGrad;
    ctx1g.beginPath();
    ctx1g.ellipse(0, -35 * flutterH, 46, 85 * flutterH, 0, 0, Math.PI * 2);
    ctx1g.fill();

    // --- 2. Blue Chemiluminescent Base (Premixed Anchor Region) ---
    const baseGrad = ctx1g.createRadialGradient(0, rD * 0.5, rD * 0.8, 0, rD * 0.5, rD * 4.2);
    baseGrad.addColorStop(0, "rgba(32, 185, 232, 0.85)");
    baseGrad.addColorStop(0.4, "rgba(40, 123, 255, 0.75)");
    baseGrad.addColorStop(0.75, "rgba(30, 70, 220, 0.35)");
    baseGrad.addColorStop(1, "rgba(10, 30, 140, 0)");
    ctx1g.fillStyle = baseGrad;
    ctx1g.beginPath();
    ctx1g.ellipse(0, rD * 0.6, rD * 3.6, rD * 2.2, 0, 0, Math.PI * 2);
    ctx1g.fill();

    // --- 3. Elongated Teardrop Buoyant Soot Shell (Warm Orange/Yellow) ---
    ctx1g.globalCompositeOperation = "screen";
    const flameH = 92 * flutterH;
    const flameW = 26;

    ctx1g.beginPath();
    // Base curves around droplet and tapers to sharp upward buoyant plume
    ctx1g.moveTo(-flameW * 0.85, 4);
    ctx1g.bezierCurveTo(
      -flameW * 1.15, -flameH * 0.25,
      -flameW * 0.65 + flutterX, -flameH * 0.7,
      0 + flutterX, -flameH
    );
    ctx1g.bezierCurveTo(
      flameW * 0.65 + flutterX, -flameH * 0.7,
      flameW * 1.15, -flameH * 0.25,
      flameW * 0.85, 4
    );
    ctx1g.quadraticCurveTo(0, 8, -flameW * 0.85, 4);
    ctx1g.closePath();

    const sootGrad = ctx1g.createLinearGradient(0, 6, 0, -flameH);
    sootGrad.addColorStop(0, "rgba(40, 123, 255, 0.65)");    // Blue base anchor
    sootGrad.addColorStop(0.12, "rgba(255, 121, 31, 0.85)"); // Rapid transition to orange
    sootGrad.addColorStop(0.45, "rgba(255, 170, 40, 0.95)"); // Luminous incandescent soot
    sootGrad.addColorStop(0.75, "rgba(255, 220, 90, 0.92)"); // Radiant bright yellow
    sootGrad.addColorStop(0.92, "rgba(255, 150, 30, 0.7)");  // Soot cooling at plume tip
    sootGrad.addColorStop(1.0, "rgba(217, 87, 18, 0)");
    ctx1g.fillStyle = sootGrad;
    ctx1g.fill();

    // --- 4. Radiant Inner White-Hot Reaction Core ---
    const coreH = flameH * 0.58;
    const coreW = flameW * 0.52;
    ctx1g.beginPath();
    ctx1g.moveTo(-coreW * 0.8, 2);
    ctx1g.bezierCurveTo(
      -coreW * 1.1, -coreH * 0.3,
      -coreW * 0.5 + flutterX * 0.5, -coreH * 0.7,
      flutterX * 0.5, -coreH
    );
    ctx1g.bezierCurveTo(
      coreW * 0.5 + flutterX * 0.5, -coreH * 0.7,
      coreW * 1.1, -coreH * 0.3,
      coreW * 0.8, 2
    );
    ctx1g.closePath();

    const coreGrad = ctx1g.createLinearGradient(0, 2, 0, -coreH);
    coreGrad.addColorStop(0, "rgba(255, 210, 120, 0.7)");
    coreGrad.addColorStop(0.5, "rgba(255, 250, 220, 0.95)"); // White-hot core
    coreGrad.addColorStop(0.85, "rgba(255, 215, 100, 0.75)");
    coreGrad.addColorStop(1.0, "rgba(255, 160, 40, 0)");
    ctx1g.fillStyle = coreGrad;
    ctx1g.fill();

    // --- 5. Rising Thermophoretic Soot Micro-Embers ---
    if (!reducedMotion) {
      embers1g.forEach((e) => {
        e.y += e.vy;
        e.x += e.vx;
        e.life++;
        if (e.life > e.maxLife || e.y < -flameH * 1.25) {
          e.x = (Math.random() - 0.5) * (flameW * 0.6);
          e.y = -10 - Math.random() * 20;
          e.life = 0;
          e.alpha = 0.3 + Math.random() * 0.7;
        }
        const fade = 1 - e.life / e.maxLife;
        ctx1g.fillStyle = `rgba(255, ${160 + Math.random() * 60}, 50, ${e.alpha * fade})`;
        ctx1g.beginPath();
        ctx1g.arc(e.x + flutterX * (Math.abs(e.y) / flameH), e.y, e.size, 0, Math.PI * 2);
        ctx1g.fill();
      });
    }

    // --- 6. Liquid Fuel Droplet Anchor ---
    ctx1g.globalCompositeOperation = "source-over";
    const dropGrad = ctx1g.createRadialGradient(-rD * 0.3, -rD * 0.3, rD * 0.1, 0, 0, rD);
    dropGrad.addColorStop(0, "#FFF9E6");
    dropGrad.addColorStop(0.4, "#E2C99D");
    dropGrad.addColorStop(0.85, "#8C6A3C");
    dropGrad.addColorStop(1.0, "#3D2B14");
    ctx1g.fillStyle = dropGrad;
    ctx1g.beginPath();
    ctx1g.arc(0, 0, rD, 0, Math.PI * 2);
    ctx1g.fill();

    ctx1g.restore();
  }

  function draw0g(now) {
    ctx0g.clearRect(0, 0, W0, H0);

    // Deep space chamber backdrop
    const bg = ctx0g.createRadialGradient(W0 / 2, H0 / 2, 10, W0 / 2, H0 / 2, Math.max(W0, H0) * 0.75);
    bg.addColorStop(0, "#081426");
    bg.addColorStop(0.65, "#040b17");
    bg.addColorStop(1, "#02060f");
    ctx0g.fillStyle = bg;
    ctx0g.fillRect(0, 0, W0, H0);

    const ox = W0 / 2;
    const oy = H0 / 2; // Exact geometric center for microgravity spherical symmetry
    const rD = Math.min(W0, H0) * 0.038;

    // Organic microgravity breathing pulse (calm and symmetric)
    const t = now * 0.0018;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(t) * 0.015 + Math.cos(t * 1.8) * 0.008;

    // Quartz suspension tether
    ctx0g.save();
    ctx0g.strokeStyle = "rgba(160, 185, 220, 0.2)";
    ctx0g.lineWidth = 1;
    ctx0g.setLineDash([2, 3]);
    ctx0g.beginPath();
    ctx0g.moveTo(ox, 12);
    ctx0g.lineTo(ox, H0 - 12);
    ctx0g.stroke();
    ctx0g.restore();

    ctx0g.save();
    ctx0g.translate(ox, oy);

    // --- 1. Spherically Symmetric Volumetric Chemiluminescent Halo (Screen Blend) ---
    ctx0g.globalCompositeOperation = "screen";
    const rHalo = 74 * pulse;
    const haloGrad = ctx0g.createRadialGradient(0, 0, rD * 1.5, 0, 0, rHalo);
    haloGrad.addColorStop(0, "rgba(32, 185, 232, 0.12)");
    haloGrad.addColorStop(0.4, "rgba(40, 123, 255, 0.22)");
    haloGrad.addColorStop(0.72, "rgba(32, 185, 232, 0.18)");
    haloGrad.addColorStop(0.9, "rgba(20, 60, 190, 0.06)");
    haloGrad.addColorStop(1.0, "rgba(5, 15, 60, 0)");
    ctx0g.fillStyle = haloGrad;
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rHalo, 0, Math.PI * 2);
    ctx0g.fill();

    // --- 2. Prominent Electric-Blue / Cyan Chemiluminescent Reaction Shell ---
    // In microgravity diffusion flames, line-of-sight Abel projection produces a distinct,
    // intense luminous limb/ring at the flame radius where the chord through the shell is deepest.
    const rFlame = 48 * pulse;
    const shellGrad = ctx0g.createRadialGradient(0, 0, rFlame * 0.65, 0, 0, rFlame * 1.15);
    shellGrad.addColorStop(0, "rgba(10, 40, 140, 0)");
    shellGrad.addColorStop(0.55, "rgba(32, 185, 232, 0.28)");
    shellGrad.addColorStop(0.78, "rgba(40, 130, 255, 0.85)"); // Deep blue
    shellGrad.addColorStop(0.90, "rgba(70, 200, 255, 0.98)"); // Vibrant cyan reaction ring
    shellGrad.addColorStop(0.96, "rgba(140, 225, 255, 0.95)"); // Luminous limb
    shellGrad.addColorStop(1.0, "rgba(30, 80, 220, 0)");
    ctx0g.fillStyle = shellGrad;
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rFlame * 1.15, 0, Math.PI * 2);
    ctx0g.fill();

    // --- 3. Subtle Warm Orange/Yellow Combustion Core ---
    // Stagnant diffusion keeps a thin, calm, golden-amber soot precursor zone near the droplet
    const rCore = 22 * pulse;
    const coreGrad = ctx0g.createRadialGradient(0, 0, rD * 1.1, 0, 0, rCore);
    coreGrad.addColorStop(0, "rgba(255, 200, 110, 0.38)");
    coreGrad.addColorStop(0.45, "rgba(255, 140, 35, 0.28)");
    coreGrad.addColorStop(0.8, "rgba(217, 87, 18, 0.12)");
    coreGrad.addColorStop(1.0, "rgba(255, 121, 31, 0)");
    ctx0g.fillStyle = coreGrad;
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rCore, 0, Math.PI * 2);
    ctx0g.fill();

    // Faint golden ignition ring just outside fuel vapor boundary
    ctx0g.strokeStyle = "rgba(255, 170, 50, 0.35)";
    ctx0g.lineWidth = 1.2;
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rD * 1.85 * pulse, 0, Math.PI * 2);
    ctx0g.stroke();

    // --- 4. Symmetrical Concentric Diffusion Contours ---
    ctx0g.strokeStyle = "rgba(32, 185, 232, 0.12)";
    ctx0g.lineWidth = 1;
    ctx0g.setLineDash([3, 4]);
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rFlame * 0.72, 0, Math.PI * 2);
    ctx0g.stroke();
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rFlame * 1.3, 0, Math.PI * 2);
    ctx0g.stroke();
    ctx0g.setLineDash([]);

    // --- 5. Liquid Fuel Droplet (Centered & Spherical) ---
    ctx0g.globalCompositeOperation = "source-over";
    const dropGrad = ctx0g.createRadialGradient(-rD * 0.3, -rD * 0.3, rD * 0.1, 0, 0, rD);
    dropGrad.addColorStop(0, "#FFF9E6");
    dropGrad.addColorStop(0.4, "#E2C99D");
    dropGrad.addColorStop(0.85, "#8C6A3C");
    dropGrad.addColorStop(1.0, "#3D2B14");
    ctx0g.fillStyle = dropGrad;
    ctx0g.beginPath();
    ctx0g.arc(0, 0, rD, 0, Math.PI * 2);
    ctx0g.fill();

    // Droplet optical limb refraction
    ctx0g.strokeStyle = "rgba(140, 205, 255, 0.4)";
    ctx0g.lineWidth = 1;
    ctx0g.stroke();

    ctx0g.restore();
  }

  function loop(now) {
    if (!active) return;
    if (visible) {
      draw1g(now);
      draw0g(now);
    }
    raf = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);

  return {
    start() {
      if (active) return;
      active = true;
      resize();
      raf = requestAnimationFrame(loop);
    },
    stop() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
    setVisible(v) {
      visible = v;
    },
    destroy() {
      this.stop();
      window.removeEventListener("resize", resize);
    },
  };
}


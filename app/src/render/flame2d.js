import { reducedMotion } from "../core/dom.js";
import { timeline, flameParams, PHASE, phaseNote } from "../model/flame.js";

/**
 * High-Fidelity 2D Combustion Canvas Renderer.
 * Simulates microgravity spherical diffusion flames with line-of-sight volumetric glow,
 * chemiluminescent envelopes (CH / C2 radicals), luminous incandescent soot shells,
 * floating soot micro-embers, and realistic droplet optical refraction.
 *
 * getSim(): active scenario state · getG(): 0 microgravity / 1 terrestrial gravity
 * onHud({t, d, phase, label, note}): optional HUD telemetry overlay callback.
 */
export function createFlame2D(canvas, { getSim, getG = () => 0, onHud, scale = 1, bg = "#030811", frac = 1 }) {
  const ctx = canvas.getContext("2d");
  let raf = null;
  let W = 0;
  let H = 0;

  // Particle pool for subtle microgravity thermophoretic soot embers
  const MAX_PARTICLES = 28;
  const particles = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push({
      angle: Math.random() * Math.PI * 2,
      distRatio: 0.3 + Math.random() * 0.7,
      speed: 0.0003 + Math.random() * 0.0006,
      size: 0.8 + Math.random() * 1.6,
      opacity: Math.random() * 0.8,
      fadeRate: 0.008 + Math.random() * 0.015,
      hueShift: Math.random() * 20 - 10,
    });
  }

  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(200, r.width);
    H = Math.max(200, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    const sim = getSim();
    if (!sim) return;
    const g = getG();
    const { q, cool } = sim;
    const { t, d, phase } = timeline(sim, now, sim.t0, reducedMotion, frac);
    const { fsr, o2i, soot } = flameParams(q);

    // Deep space chamber background with subtle radial vignette
    ctx.globalCompositeOperation = "source-over";
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, "#060d1a");
    bgGrad.addColorStop(0.6, "#030712");
    bgGrad.addColorStop(1, bg);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const pxmm = Math.min(32, Math.min(W, H) / 30) * scale;
    const ox = W / 2;
    const oy = H / 2 + (g ? H * 0.14 : 0);
    const rD = (d / 2) * pxmm;

    // Organic micro-pulsation and thermal waviness
    const flick = reducedMotion
      ? 1
      : 1 + 0.022 * Math.sin(now / 95) + 0.012 * Math.cos(now / 47);

    // Hairline SiC / Quartz Droplet Suspension Tether (as on NASA FLEX / CIR hardware)
    if (d > 0.02) {
      ctx.save();
      ctx.strokeStyle = "rgba(160, 185, 220, 0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(ox, 12);
      ctx.lineTo(ox, H - 12);
      ctx.stroke();
      ctx.restore();
    }

    if (phase === "hot" && d > 0.02) {
      const isMethanol = q.fuel === "Methanol" || soot <= 0.01;
      const rF = Math.max(rD * fsr, rD + 10) * (g ? 0.82 : 1) * flick;
      const intensity = Math.min(1.0, 0.4 + o2i * 0.5);

      ctx.save();
      ctx.translate(ox, oy);

      // If terrestrial gravity (g = 1), apply vertical buoyancy buoyant elongation
      if (g > 0.1) {
        ctx.translate(0, -rF * 0.45 * g);
        ctx.scale(1.0 - g * 0.28, 1.0 + g * 0.95);
      }

      // --- 1. Ambient Volumetric Radiant Heat Bloom (Additive Screen Blend) ---
      ctx.globalCompositeOperation = "screen";
      const bloomRad = rF * 2.2;
      const bloomGrad = ctx.createRadialGradient(0, 0, rD, 0, 0, bloomRad);
      if (isMethanol) {
        bloomGrad.addColorStop(0, `rgba(32, 185, 232, ${0.35 * intensity})`);
        bloomGrad.addColorStop(0.35, `rgba(40, 123, 255, ${0.18 * intensity})`);
        bloomGrad.addColorStop(0.7, `rgba(20, 60, 180, ${0.05 * intensity})`);
        bloomGrad.addColorStop(1.0, "rgba(5, 15, 60, 0)");
      } else {
        bloomGrad.addColorStop(0, `rgba(255, 170, 50, ${0.38 * intensity})`);
        bloomGrad.addColorStop(0.35, `rgba(255, 121, 31, ${0.22 * intensity})`);
        bloomGrad.addColorStop(0.65, `rgba(217, 87, 18, ${0.09 * intensity})`);
        bloomGrad.addColorStop(0.85, `rgba(40, 123, 255, ${0.04 * intensity})`);
        bloomGrad.addColorStop(1.0, "rgba(10, 20, 60, 0)");
      }
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(0, 0, bloomRad, 0, Math.PI * 2);
      ctx.fill();

      // --- 2. Outer Chemiluminescent Envelope (CH* at 431nm & C2* at 516nm) ---
      // Real microgravity flames exhibit a distinct electric-blue/cyan outer boundary
      const chemRad = rF * 1.15;
      const chemGrad = ctx.createRadialGradient(0, 0, rF * 0.65, 0, 0, chemRad);
      chemGrad.addColorStop(0, "rgba(30, 80, 220, 0)");
      chemGrad.addColorStop(0.68, `rgba(32, 185, 232, ${0.3 * intensity})`);
      chemGrad.addColorStop(0.84, `rgba(70, 160, 255, ${0.75 * intensity})`);
      chemGrad.addColorStop(0.92, `rgba(130, 205, 255, ${0.9 * intensity})`);
      chemGrad.addColorStop(0.97, `rgba(40, 110, 240, ${0.45 * intensity})`);
      chemGrad.addColorStop(1.0, "rgba(20, 50, 160, 0)");

      ctx.fillStyle = chemGrad;
      ctx.beginPath();
      ctx.arc(0, 0, chemRad, 0, Math.PI * 2);
      ctx.fill();

      // --- 3. Inner Luminous Incandescent Soot Shell (for Hydrocarbons like Heptane) ---
      if (!isMethanol && soot > 0.02) {
        const sootRad = rF * 0.94;
        const sootGrad = ctx.createRadialGradient(0, 0, rD * 1.1, 0, 0, sootRad);
        const sootAlpha = Math.min(1.0, 0.45 + soot * 0.55);

        sootGrad.addColorStop(0, `rgba(255, 120, 30, 0)`);
        sootGrad.addColorStop(0.35, `rgba(255, 110, 25, ${0.2 * sootAlpha})`);
        sootGrad.addColorStop(0.6, `rgba(255, 140, 35, ${0.55 * sootAlpha})`);
        sootGrad.addColorStop(0.78, `rgba(255, 175, 45, ${0.88 * sootAlpha})`);
        sootGrad.addColorStop(0.88, `rgba(255, 220, 110, ${0.98 * sootAlpha})`);
        sootGrad.addColorStop(0.93, `rgba(255, 145, 35, ${0.65 * sootAlpha})`);
        sootGrad.addColorStop(1.0, "rgba(217, 87, 18, 0)");

        ctx.fillStyle = sootGrad;
        ctx.beginPath();
        // Subtle organic boundary contouring
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const wav = reducedMotion
            ? 1
            : 1 + 0.012 * Math.sin(theta * 5 + now * 0.003) + 0.008 * Math.cos(theta * 7 - now * 0.004);
          const px = Math.cos(theta) * sootRad * wav;
          const py = Math.sin(theta) * sootRad * wav;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Intense inner incandescent reaction core
        const coreRad = sootRad * 0.82;
        const coreGrad = ctx.createRadialGradient(0, 0, rD * 1.2, 0, 0, coreRad);
        coreGrad.addColorStop(0, `rgba(255, 200, 120, ${0.22 * sootAlpha})`);
        coreGrad.addColorStop(0.7, `rgba(255, 150, 40, ${0.65 * sootAlpha})`);
        coreGrad.addColorStop(0.92, `rgba(255, 245, 210, ${0.95 * sootAlpha})`);
        coreGrad.addColorStop(1.0, "rgba(255, 160, 45, 0)");

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, coreRad, 0, Math.PI * 2);
        ctx.fill();

        // --- 4. Micro-embers & Drifting Soot Particulates ---
        if (!reducedMotion) {
          particles.forEach((p) => {
            p.angle += p.speed;
            p.opacity -= p.fadeRate;
            if (p.opacity <= 0) {
              p.opacity = 0.5 + Math.random() * 0.5;
              p.angle = Math.random() * Math.PI * 2;
              p.distRatio = 0.4 + Math.random() * 0.55;
            }
            const pr = sootRad * p.distRatio;
            const px = Math.cos(p.angle) * pr;
            const py = Math.sin(p.angle) * pr;
            ctx.fillStyle = `rgba(255, ${200 + p.hueShift}, 120, ${p.opacity * sootAlpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      ctx.restore();
    }

    // --- 5. Cool Flame (Low-Temperature Regime discovered in FLEX) ---
    if (phase === "cool" || (phase === "out" && cool)) {
      const rF = rD * 3.4;
      const al = phase === "cool" ? 0.38 : 0.16;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.globalCompositeOperation = "screen";

      // Ghostly pale cyan / ultraviolet invisible flame aura
      const gr = ctx.createRadialGradient(0, 0, rD, 0, 0, rF);
      gr.addColorStop(0, `rgba(140, 200, 255, ${al * 0.15})`);
      gr.addColorStop(0.65, `rgba(160, 215, 255, ${al * 0.8})`);
      gr.addColorStop(0.85, `rgba(190, 160, 255, ${al * 0.95})`);
      gr.addColorStop(1.0, "rgba(120, 160, 255, 0)");

      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(0, 0, rF, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- 6. Liquid Fuel Droplet High-Fidelity Rendering ---
    if (d > 0.02) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.globalCompositeOperation = "source-over";

      const rad = Math.max(1.8, rD);
      const isMeth = q.fuel === "Methanol";

      // Base liquid refractive body
      const dropGrad = ctx.createRadialGradient(
        -rad * 0.35,
        -rad * 0.35,
        rad * 0.08,
        0,
        0,
        rad
      );
      if (isMeth) {
        dropGrad.addColorStop(0, "#E8F4FA");
        dropGrad.addColorStop(0.4, "#A4C8E0");
        dropGrad.addColorStop(0.85, "#3E6585");
        dropGrad.addColorStop(1.0, "#192B3D");
      } else {
        dropGrad.addColorStop(0, "#FFF9E6");
        dropGrad.addColorStop(0.35, "#E2C99D");
        dropGrad.addColorStop(0.75, "#7A5A32");
        dropGrad.addColorStop(1.0, "#2B1F13");
      }

      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();

      // Specular Flame Reflection Ring around Droplet Rim
      ctx.strokeStyle = isMeth
        ? "rgba(100, 200, 255, 0.45)"
        : "rgba(255, 170, 70, 0.55)";
      ctx.lineWidth = Math.max(0.75, rad * 0.12);
      ctx.beginPath();
      ctx.arc(0, 0, rad - ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Primary Specular Pinpoint Highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(-rad * 0.36, -rad * 0.36, Math.max(0.8, rad * 0.22), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Diagnostic Scale HUD Bar
    if (onHud) {
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, H - 36);
      ctx.lineTo(20 + pxmm * 5, H - 36);
      ctx.stroke();

      // End ticks
      ctx.beginPath();
      ctx.moveTo(20, H - 40);
      ctx.lineTo(20, H - 32);
      ctx.moveTo(20 + pxmm * 5, H - 40);
      ctx.lineTo(20 + pxmm * 5, H - 32);
      ctx.stroke();

      ctx.fillStyle = "#AAB7C6";
      ctx.font = "10px ui-monospace, SF Mono, Menlo, monospace";
      ctx.fillText("5.0 mm reference", 20, H - 44);
      ctx.restore();

      onHud({ t, d, phase, label: PHASE[phase], note: phaseNote(sim, phase, g) });
    }
  }

  function loop(now) {
    draw(now);
    raf = reducedMotion ? null : requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    fit();
    if (!raf) draw(performance.now());
  });

  return {
    start() {
      if (raf) return;
      fit();
      ro.observe(canvas);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ro.disconnect();
    },
    redraw: () => draw(performance.now()),
  };
}

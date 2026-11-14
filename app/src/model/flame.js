import { predict, coverage } from "./knn.js";

/** Converts conditions into a full scenario: prediction, d² law, and flame phases. */
export function simulate(flex, q) {
  const pr = predict(flex, q);
  const cov = coverage(pr, q, flex);
  const ext = pr.pExt >= 0.5;
  const dEnd = ext && pr.dext ? Math.min(pr.dext, q.d0 * 0.95) : 0;
  const tBurn = (q.d0 ** 2 - dEnd ** 2) / pr.K;
  // FLEX observed cool flames in heptane following radiative extinction of large droplets.
  const cool = q.fuel === "Heptane" && ext && dEnd > 1.2;
  return { q, pr, cov, ext, dEnd, tBurn, cool, t0: performance.now() };
}

/** Playback loop duration: speedup, cool flame phase, and total (in model seconds). */
export function span(sim) {
  const coolDur = sim.cool ? sim.tBurn * 0.6 : 0;
  return { speed: Math.max(1, sim.tBurn / 6), coolDur, total: sim.tBurn + coolDur + 1.5 };
}

/**
 * Droplet diameter and phase at instant `now` (accelerated looping playback).
 * `frac` < 1 repeats only the first part of burning (useful for decorative loops).
 */
export function timeline(sim, now, t0, reduce = false, frac = 1) {
  const { q, pr, ext, dEnd, tBurn, cool } = sim;
  const { speed, coolDur, total: full } = span(sim);
  const total = frac < 1 ? tBurn * frac : full;
  const t = reduce ? tBurn * 0.3 : (((now - t0) / 1000) * speed * (frac < 1 ? 0.5 : 1)) % total;
  let d;
  let phase;
  if (t <= tBurn) {
    d = Math.sqrt(Math.max(0, q.d0 ** 2 - pr.K * t));
    phase = "hot";
  } else if (t <= tBurn + coolDur) {
    d = Math.sqrt(Math.max(0.05, dEnd ** 2 - pr.K * 0.35 * (t - tBurn)));
    phase = "cool";
  } else {
    d = ext ? (cool ? Math.sqrt(Math.max(0.05, dEnd ** 2 - pr.K * 0.35 * coolDur)) : dEnd) : 0;
    phase = ext ? "out" : "gone";
  }
  return { t: Math.min(t, tBurn + coolDur), d, phase };
}

/**
 * Visual parameters (qualitative): relative flame standoff ratio, intensity, and soot.
 * In microgravity, the flame is typically 5 to 12 times the droplet diameter.
 */
export function flameParams(q) {
  return {
    fsr: Math.max(3.5, Math.min(12, 7 + (0.21 - q.o2) * 35 - q.he * 4 + q.co2 * 3)),
    o2i: Math.max(0.15, Math.min(1.3, (q.o2 - 0.1) / 0.2)) * (1 - q.co2 * 0.6),
    soot: q.fuel === "Heptane" ? Math.max(0, Math.min(1, (q.o2 - 0.14) / 0.2 + (q.P - 1) * 0.3)) : 0,
  };
}

export const PHASE = {
  hot: "Visible flame",
  cool: "Cool flame · invisible to naked eye",
  out: "Flame extinguished",
  gone: "Droplet consumed",
};

export function phaseNote(sim, phase, g) {
  const gNorm = Math.max(0, Math.min(1, Number(g) || 0));
  if (gNorm >= 0.8) return "With Earth gravity, hot air rises: the flame elongates upward and draws in more oxygen.";
  if (gNorm > 0.05) return "In partial gravity, reduced buoyancy creates mild upward draft; flame shape and soot drift are intermediate qualitative visual illustrations.";
  if (sim.cool && phase !== "hot") return "FLEX observed that heptane continues burning with a cool flame after visible flame extinction.";
  return "Without gravity there is no buoyant draft: the flame is spherical and oxygen is supplied solely by diffusion.";
}

export const PRESETS = [
  { id: "iss", label: "ISS Cabin", q: { fuel: "Heptane", o2: 0.21, P: 1.0, co2: 0, he: 0, d0: 3.0 } },
  { id: "explore", label: "Exploration Atmosphere", q: { fuel: "Heptane", o2: 0.34, P: 0.57, co2: 0, he: 0, d0: 3.0 } },
  { id: "co2", label: "CO₂ Extinguisher Discharge", q: { fuel: "Methanol", o2: 0.17, P: 1.0, co2: 0.4, he: 0, d0: 3.0 } },
  { id: "lowo2", label: "Low Oxygen", q: { fuel: "Methanol", o2: 0.14, P: 1.0, co2: 0, he: 0, d0: 3.0 } },
];

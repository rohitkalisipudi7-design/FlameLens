import { fmt } from "../core/dom.js";

const rate = (a) => (a.length ? a.filter((r) => r.end === "Extinction").length / a.length : NaN);
const count = (a) => a.filter((r) => r.end === "Extinction").length;
const mean = (a, k) => {
  const v = a.filter((r) => r[k] != null);
  return v.reduce((s, r) => s + r[k], 0) / v.length;
};
const pct = (x) => `${Math.round(x * 100)}%`;

/** Findings dynamically calculated from the FLEX empirical table. */
export function flexFindings(F) {
  const sel = (f) => F.filter(f);
  const mLow = sel((r) => r.fuel === "Methanol" && r.o2 <= 0.15);
  const hLow = sel((r) => r.fuel === "Heptane" && r.o2 <= 0.15);
  const minO2 = (fuel) => Math.min(...sel((r) => r.fuel === fuel && r.end !== "Extinction").map((r) => r.o2));
  const co2 = (fuel, hi) => sel((r) => r.fuel === fuel && (hi ? r.co2 > 0.3 : r.co2 === 0));
  const heHi = sel((r) => r.fuel === "Heptane" && r.he > 0.2);
  const heNo = sel((r) => r.fuel === "Heptane" && r.he === 0);
  const dx = sel((r) => r.fuel === "Heptane" && r.end === "Extinction" && r.dext != null).map((r) => r.dext).sort((a, b) => a - b);
  const med = dx[Math.floor(dx.length / 2)];

  return [
    {
      big: `${pct(rate(mLow))} vs ${pct(rate(hLow))}`,
      text: `At 15% O₂ or below, methanol extinguished in ${count(mLow)} of ${mLow.length} runs; heptane extinguished in ${count(hLow)} of ${hLow.length}.`,
      src: `Heptane continued burning down to ${Math.round(minO2("Heptane") * 100)}% O₂; methanol required at least ${Math.round(minO2("Methanol") * 100)}% O₂.`,
    },
    {
      big: pct(rate(co2("Methanol", true))),
      text: `of methanol droplets extinguished when ambient CO₂ exceeded 30%, compared to ${pct(rate(co2("Methanol", false)))} without CO₂.`,
      src: `Heptane: ${pct(rate(co2("Heptane", true)))} vs ${pct(rate(co2("Heptane", false)))}. CO₂ is the active fire suppression agent aboard the ISS.`,
    },
    {
      big: `+${Math.round((mean(heHi, "K") / mean(heNo, "K") - 1) * 100)}%`,
      text: `faster consumption rate for heptane when helium exceeds 20% (${fmt(mean(heHi, "K"))} vs ${fmt(mean(heNo, "K"))} mm²/s).`,
      src: "Helium exhibits high thermal conductivity: it is not a neutral diluent in spacecraft atmospheres.",
    },
    {
      big: `${fmt(med, 1)} mm`,
      text: "median droplet diameter at which visible heptane flame extinguished: large droplets suffer excessive radiative heat loss.",
      src: "Following visible extinction, FLEX observed invisible cool flames that continued consuming the droplet (Nayagam et al., 2012).",
    },
  ];
}

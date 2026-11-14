import { PRESETS } from "./flame.js";

/**
 * 3D Laboratory content: environments per scenario, instruments, and hotspots.
 * Hardware details derived from NASA PSI-69 FLEX documentation (CIR, MDCA, HiBMS, LLUV, ZGF).
 * Text is provided in `plain` (intuitive) and `tech` (scientific) levels.
 */

export const ENVS = {
  iss: {
    id: "iss",
    name: "ISS Cabin",
    place: "CIR · Destiny Laboratory · 400 km Orbit",
    plain: "Standard station atmosphere: 21% oxygen at 1 atm. This is where FLEX droplets burned inside the Combustion Integrated Rack.",
    tech: "FLEX baseline: air at 1 atm in the CIR chamber with MDCA insert. 3–4 mm heptane exhibits radiative extinction followed by cool flame burning.",
  },
  explore: {
    id: "explore",
    name: "Exploration Atmosphere",
    place: "Exploration Habitat · Lunar Orbit",
    plain: "Reduced pressure and elevated oxygen for rapid space suit egress without hours of pre-breathing. The trade-off: at 34% oxygen everything burns much faster.",
    tech: "NASA-proposed Exploration Atmosphere: ≈ 8.2 psia (56.5 kPa) and 34% O₂. Higher XO₂ raises adiabatic flame temperature, burning rate K, and soot yield.",
  },
  co2: {
    id: "co2",
    name: "CO₂ Extinguisher Discharge",
    place: "CIR · ISS Fire Alarm Condition",
    plain: "Fire extinguishers on the US segment of the ISS utilize CO₂. FLEX quantified the concentration required to extinguish flames in microgravity.",
    tech: "40% CO₂ with 17% O₂: radiative diluent accelerates heat loss and lowers flame temperature; methanol extinguishes at large droplet diameters.",
  },
  lowo2: {
    id: "lowo2",
    name: "Low Oxygen",
    place: "Drop Tower · NASA Glenn (ZGF)",
    plain: "Near the extinction limit: at 14% oxygen the flame is large, faint, and extinguishes quickly. On Earth this is tested by dropping the rig 132 m.",
    tech: "Methanol oxygen flammability limit. Zero Gravity Research Facility provides 5.18 s of microgravity: sufficient for 1–2 mm droplets; larger FLEX droplets required the ISS.",
  },
};

/** Preset scenario matching exact conditions, or null if customized. */
export function matchPreset(q) {
  const hit = PRESETS.find((p) => Object.entries(p.q).every(([k, v]) => (typeof v === "number" ? Math.abs(v - q[k]) < 1e-6 : v === q[k])));
  return hit ? hit.id : null;
}

/**
 * Camera viewpoints: 3D orbit or fixed scientific camera view.
 * `bar` is the overlay scale bar length in mm.
 */
export const VIEWS = [
  { id: "free", label: "Free", name: "3D Orbit View" },
  { id: "color", label: "Color", name: "MDCA Color Camera", spec: "0.3 MP · 30 fps", bar: 10 },
  { id: "hibms", label: "HiBMS", name: "HiBMS-1 · Backlit Droplet", spec: "1 MP · 30 fps · IR laser backlight", bar: 5 },
  { id: "lluv", label: "LLUV", name: "LLUV · OH* Chemiluminescence", spec: "Low-light UV · ~310 nm", bar: 10 },
];

export const LEVELS = [
  { id: "drop", label: "Droplet" },
  { id: "chamber", label: "Chamber" },
  { id: "lab", label: "Laboratory" },
];

/** Hotspot points of interest. `level` specifies at which camera zoom level they are displayed. */
export const HOTSPOTS = {
  drop: {
    level: "drop", title: "Fuel Droplet",
    plain: "A lentil-sized droplet floating untouched. As it burns it shrinks with remarkable regularity: its squared diameter decreases linearly with time.",
    tech: "d² Law: d² = d₀² − K·t. K predicted using 7 nearest FLEX flight runs.",
  },
  flame: {
    level: "drop", title: "Spherical Flame",
    plain: "Without gravity, hot air does not rise, so the flame has no 'upward' direction: it forms a sphere. Oxygen diffuses slowly from all directions, keeping the flame far from the droplet.",
    tech: "Spherically symmetric diffusion flame. Standoff ratio (FSR = D_f/D) typically 5 to 12; rendered radius is qualitative.",
  },
  plume: {
    level: "drop", title: "Flame with Gravity (1g)",
    plain: "On Earth hot gases are buoyant and rush upward. This updraft stretches the flame into a teardrop shape and feeds fresh oxygen from below.",
    tech: "Natural convection (buoyancy): induced flow thins reaction zone and accelerates burning rate compared to spherical 0g.",
  },
  soot: {
    level: "drop", title: "Soot Shell",
    plain: "Heptane combustion produces soot that becomes trapped in a spherical shell between the droplet and flame zone. This glows bright yellow-orange.",
    tech: "Soot accumulates where thermophoresis (inward toward droplet) balances outward Stefan vapor flux. Methanol produces negligible soot.",
  },
  needles: {
    level: "chamber", title: "Deployment Needles",
    plain: "Two opposed hollow needles inject liquid fuel, stretch the droplet between their tips, and rapidly retract to leave it floating freely.",
    tech: "MDCA: opposed needles form liquid bridge to target diameter and retract quickly. Droplet can optionally be tethered on 80 µm SiC fiber.",
  },
  igniters: {
    level: "chamber", title: "Hot-Wire Igniters",
    plain: "Two glowing-hot wire loops ignite the droplet simultaneously from opposite sides and quickly swing away so as not to disturb the spherical flame.",
    tech: "Symmetric hot wires energized and retracted upon ignition detection to preserve spherical symmetry.",
  },
  hibms: {
    level: "chamber", title: "HiBMS Camera · Droplet View",
    plain: "Views the droplet backlit. Frame-by-frame analysis of these silhouette images yields the diameter-versus-time burn curves.",
    tech: "High Bit-depth Multi-Spectral, ~1 MP @ 30 fps, backlit with infrared diode laser. Second tunable HiBMS measures soot temperature.",
  },
  lluv: {
    level: "chamber", title: "LLUV Camera",
    plain: "Captures ultraviolet light invisible to human eyes. Used to measure the true flame boundary, even when burning invisibly.",
    tech: "Low Light Level UV: OH* chemiluminescence (~310 nm). Determines flame diameter and marks hot flame extinction.",
  },
  backlight: {
    level: "chamber", title: "Backlight Illuminator",
    plain: "Collimated illumination behind the droplet allowing the HiBMS camera to capture crisp silhouettes.",
    tech: "Illumination package opposed to HiBMS; collimated infrared background.",
  },
  radiometer: {
    level: "chamber", title: "Radiometers",
    plain: "Measure radiative heat loss from the flame. In large droplets, radiative loss is what triggers flame extinction.",
    tech: "Broadband and narrowband radiometers. Radiative loss scales with flame volume and drives radiative extinction.",
  },
  colorcam: {
    level: "chamber", title: "Color Camera",
    plain: "The real-time visible feed ground operators at NASA Glenn used to monitor tests live.",
    tech: "MDCA color camera: 0.3 MP @ 30 fps, real-time ground control from NASA Glenn Telescience Center.",
  },
  chamber: {
    level: "lab", title: "CIR Combustion Chamber",
    plain: "A sealed pressure vessel where the exact atmosphere of each trial is prepared: oxygen fraction, pressure, and diluent.",
    tech: "~100 L chamber with eight optical windows; MDCA insert slides inside and diagnostic packages view through windows.",
  },
  testchamber: {
    level: "lab", title: "Drop Test Chamber",
    plain: "Compact drop-tower version: a sealed vessel prepped with test atmosphere, ready for drop.",
    tech: "Sealed drop-vehicle chamber with dispenser needle, igniter, support fiber, and video diagnostics.",
  },
  bottles: {
    level: "lab", title: "Gas Supply Bottles",
    plain: "Supply oxygen, nitrogen, and diluents (CO₂, helium, xenon) blended to fill the chamber.",
    tech: "CIR manifolds for O₂, N₂, diluents, and fuel gases. Scavenger cart cleans atmosphere between burns.",
  },
  earth: {
    level: "lab", title: "Earth, 400 km Below",
    plain: "The station is in continuous freefall around Earth. Everything inside floats weightless, causing flames to burn spherically.",
    tech: "Destiny nadir window. Residual microgravity on the order of 10⁻⁶ g at the CIR.",
  },
  moon: {
    level: "lab", title: "Moon Outside the Window",
    plain: "Exploration habitats plan lower pressure and higher oxygen for rapid suit donning, but materials become significantly more flammable.",
    tech: "≈ 8.2 psia and 34% O₂: reduced pre-breathe time for EVAs; requires recalibrating material flammability.",
  },
  pfe: {
    level: "lab", title: "Portable CO₂ Fire Extinguisher",
    plain: "First line of defense aboard the US segment. CO₂ displaces oxygen and chills the reaction zone.",
    tech: "CO₂ diluent promotes extinction at higher oxygen concentrations than N₂ due to higher heat capacity and gas radiation.",
  },
  alarm: {
    level: "lab", title: "Fire Alarm",
    plain: "Flashing beacons and auditory warnings: crew immediately secures ventilation and discharges extinguishers.",
    tech: "ISS Caution & Warning 'Fire' emergency class.",
  },
  shaft: {
    level: "lab", title: "143 m Vacuum Drop Shaft",
    plain: "The experiment drops 132 meters down an evacuated shaft. For 5.18 seconds, gravity virtually disappears.",
    tech: "Zero Gravity Research Facility (NASA Glenn): freefall in ~10⁻² torr vacuum, decelerated in polystyrene bead pit.",
  },
  vehicle: {
    level: "lab", title: "Drop Vehicle",
    plain: "Autonomous rig carrying the experiment: chamber, high-speed cameras, batteries, and data acquisition.",
    tech: "Self-contained drag-shielded drop vehicle with test chamber, LED backlight, and instrumentation.",
  },
};

export const STEPS = [
  { id: "deploy", label: "Deployment" },
  { id: "ignite", label: "Ignition" },
  { id: "hot", label: "Hot Flame" },
  { id: "cool", label: "Cool Flame" },
  { id: "end", label: "Burnout" },
];

/** Active sequence step based on physical model phase and pre-ignition stage. */
export function stepOf(phase, stage) {
  if (stage === "deploy" || stage === "retract") return "deploy";
  if (stage === "ignite") return "ignite";
  if (phase === "hot") return "hot";
  if (phase === "cool") return "cool";
  return "end";
}

/** Plain English narration of current physical event. */
export function narrate(sim, { phase, stage, g, inst }) {
  const fuel = sim.q.fuel.toLowerCase();
  if (stage === "deploy") return `Opposed needles inject ${fuel} and dispense a ${sim.q.d0.toFixed(1)} mm droplet.`;
  if (stage === "retract") return "Needles retract rapidly: the droplet floats free and undisturbed.";
  if (stage === "ignite") return "Two glowing hot-wires ignite the droplet simultaneously and swing clear.";
  if (inst === "color" && phase === "hot" && !g) return "Ground control perspective: the flame burns between retracted needle tips inside the dark chamber.";
  if (inst === "hibms") return phase === "cool" ? "No visible flame, yet the droplet shadow continues shrinking: low-temperature cool flame combustion." : "Backlit silhouette highlights droplet shadow and soot shell. Used for precise diameter tracking.";
  if (inst === "lluv") return phase === "hot" ? "Bright ring represents UV emission from excited OH*: marking the hot flame boundary." : "Absence of OH* chemiluminescence: hot flame is extinguished.";
  if (g) return "Under gravity, buoyant thermal convection stretches the flame upward into a teardrop shape and feeds fresh oxygen from below.";
  if (phase === "hot") return sim.q.fuel === "Heptane"
    ? "Spherical diffusion flame: outer blue reaction zone enclosing an incandescent soot shell."
    : "Faint spherical blue flame: methanol produces negligible soot.";
  if (phase === "cool") return "Visible flame extinguished, but droplet consumption continues: a cool flame reaction at ~430 °C, invisible to human eyes.";
  if (phase === "out") return sim.cool ? "Cool flame extinguished. An unburned droplet core remains surrounded by flammable vapor." : "Flame extinguished before droplet burnout: radiative heat loss exceeded reaction heat release.";
  return "Droplet completely consumed.";
}

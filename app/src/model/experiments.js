/**
 * Cleaned NASA PSI test data (data/experiments.json generated from data/clean).
 * Metadata per experimental family: conditions, outcomes, labels, and formatters.
 */

export const FAMILIES = {
  droplet: {
    label: "Droplets",
    about: "A liquid fuel droplet ignited in microgravity; the flame envelops it as a sphere.",
    conditions: ["fuel", "fuel_blend", "pressure_atm", "x_o2", "d0_mm", "fiber_supported"],
    results: ["end_mode", "burning_rate_mm2_s", "burn_time_s", "d_ext_mm"],
  },
  gas_flame: {
    label: "Gas Flames",
    about: "A jet of gaseous fuel (or oxidizer in inverse flames) burning inside the combustion chamber.",
    conditions: ["flame_type", "fuel", "x_fuel", "x_o2", "pressure_atm", "fuel_rate_mg_s", "o2_rate_mg_s",
      "air_velocity_cm_s", "nozzle_mm", "t_ad_K", "z_st"],
    results: ["ignition", "end_mode", "burn_time_s", "duration_s", "peak_burner_T_K", "flame_color", "cool_flame"],
  },
  solid: {
    label: "Solids",
    about: "A solid material sample ignited with forced air flow, observing flame spread.",
    conditions: ["material", "geometry", "thickness_mm", "width_cm", "length_cm", "diameter_mm", "flow_cm_s",
      "flow_direction", "x_o2"],
    results: ["ignited", "extinguished", "blowoff", "burn_time_s", "ug_burn_length_cm", "ug_spread_rate_mm_s",
      "g1_spread_rate_mm_s", "flow_min_cm_s", "x_o2_final", "co_final_ppm"],
  },
  aerosol: {
    label: "Aerosols",
    about: "Materials heated (unburned) to characterize particulate generation and smoke aging.",
    conditions: ["material", "flow_cm_s", "aging_s", "description"],
    results: ["weight_loss_mg_min", "rt_r0", "duration_s"],
  },
  session: {
    label: "Test Logs",
    about: "Daily test session logs summarizing ignited flames and conditions without individual run details.",
    conditions: ["test_type", "fuel", "fuel_bottle", "x_fuel_values", "x_o2_values", "atmosphere", "burner_mm",
      "mesh_polarity"],
    results: ["flames_ignited", "notes"],
  },
};

/** English labels for each column. */
export const LABELS = {
  fuel: "Fuel", fuel_blend: "Blend", fuel_bottle: "Bottle", material: "Material", geometry: "Geometry",
  pressure_atm: "Pressure", x_o2: "Oxygen", x_o2_final: "Final O₂", x_fuel: "Fuel Fraction",
  d0_mm: "Initial Diameter", d_ext_mm: "Extinction Diameter", burning_rate_mm2_s: "Burning Rate K",
  burn_time_s: "Burn Time", end_mode: "Termination Mode", fiber_supported: "Fiber Supported",
  flame_type: "Flame Type", fuel_rate_mg_s: "Fuel Flow", o2_rate_mg_s: "O₂ Flow",
  air_velocity_cm_s: "Air Velocity", nozzle_mm: "Nozzle", t_ad_K: "Adiabatic Flame Temp",
  z_st: "Stoichiometric Mixture", ignition: "Ignition", ignited: "Ignited", duration_s: "Duration",
  peak_burner_T_K: "Peak Burner Temp", flame_color: "Flame Color", cool_flame: "Cool Flame",
  thickness_mm: "Thickness", width_cm: "Width", length_cm: "Length", diameter_mm: "Diameter",
  flow_cm_s: "Air Flow", flow_min_cm_s: "Min Flow", flow_direction: "Flow Direction",
  extinguished: "Self-extinguished", blowoff: "Blowoff", ug_burn_length_cm: "Burn Length (µg)",
  ug_spread_rate_mm_s: "Spread Rate (µg)", g1_spread_rate_mm_s: "Spread Rate (1g)", co_final_ppm: "Final CO",
  aging_s: "Aging", description: "Description", weight_loss_mg_min: "Mass Loss", rt_r0: "Rt/R0",
  test_type: "Series", x_fuel_values: "Tested Fuel", x_o2_values: "Tested O₂", atmosphere: "Atmosphere",
  burner_mm: "Burner", mesh_polarity: "Mesh Polarity", flames_ignited: "Flames Ignited", notes: "Notes",
  test_id: "Run ID", date: "Date", test_number: "Run Number", time_gmt: "GMT Time", time_local: "Local Time",
  day_of_year: "Day of Year", test_day: "Test Day", x_n2: "Nitrogen", x_co2: "CO₂", x_he: "Helium",
  diluent: "Diluent", fuel_raw: "Fuel (original)", material_raw: "Material (original)", sample_id: "Sample ID",
  ramped: "Ramped Flow", n2_rate_mg_s: "N₂ Flow", total_rate_mg_s: "Total Flow", x_fuel_final: "Final Fuel",
  fuel_rate_sccm: "Fuel Flow (sccm)", hc_fuel_rate_mg_s: "HC Fuel Flow", tfp: "TFP Probe",
  comments: "Comments", pi: "Principal Investigator", planned_test: "Planned Run", rod_color: "Rod Color",
  sides_burning: "Burning Faces", ignition_note: "Ignition Note", ignition_power_W: "Igniter Power",
  ignition_time_s: "Igniter Duration", g1_burn_length_cm: "Burn Length (1g)", g1_spread_mode: "Spread Mode (1g)",
  flow_max_cm_s: "Max Flow", flow_history_raw: "Flow Log", fan_history_raw: "Fan Log",
  flow_restrictor: "Restrictor", co2_initial_pct: "Initial CO₂", co2_final_pct: "Final CO₂", co_initial_ppm: "Initial CO",
  frames_shot: "Video Frames", video_ids: "Videos", thickness_raw: "Thickness (original)", date_raw: "Date (original)",
  primary_aging_s: "Primary Aging", primary_mixing_s: "Primary Mixing", x_fuel_bottle: "Bottle Fuel",
  fuel_diluent: "Bottle Diluent", ambient_diluent: "Ambient Diluent", fuel_mfc: "Fuel MFC", n2_mfc: "N₂ MFC",
};

const ENUMS = {
  end_mode: { extinction: "Extinction", disruption: "Disruption", completion: "Completion", self_extinction: "Self-extinction", flow_termination: "Flow Cutoff" },
  ignition: { yes: "Yes", no: "No", flash: "Flash" },
  flame_type: { normal: "Normal", inverse: "Inverse", coflow: "Coflow" },
  flow_direction: { concurrent: "Concurrent", opposed: "Opposed" },
  geometry: { film: "Film", slab: "Slab", rod: "Rod", sphere: "Sphere", spherical_section: "Spherical Section", candle: "Candle", fabric: "Fabric" },
  flame_color: { yellow: "Yellow", blue: "Blue", "yellow-blue": "Yellow-blue", limit: "Limit" },
};

/** Columns formatted as percentages. */
const isFraction = (k) => /^x_(o2|n2|co2|he|fuel)(_final)?$/.test(k);

export const label = (k, cols) => LABELS[k] || cols?.[k]?.[1]?.replace(/\.$/, "") || k;

/** Formats value and unit. */
export function display(k, v, cols) {
  if (v == null || v === "") return { v: "—", u: "" };
  if (typeof v === "boolean") return { v: v ? "Yes" : "No", u: "" };
  if (ENUMS[k]) return { v: ENUMS[k][v] || v, u: "" };
  if (isFraction(k) && typeof v === "number") return { v: (v * 100).toFixed(1), u: "%" };
  const u = cols?.[k]?.[0] || "";
  if (typeof v === "number") {
    if (Math.abs(v) >= 100) return { v: v.toFixed(0), u };
    if (Math.abs(v) >= 10) return { v: v.toFixed(1), u };
    return { v: v.toFixed(2), u };
  }
  return { v: String(v), u };
}

export const isNumeric = (k, cols) => {
  const t = cols?.[k]?.[2];
  return t === "float" || t === "int";
};

export function outcome(r) {
  if (r.end_mode) return ENUMS.end_mode[r.end_mode] || r.end_mode;
  if (r.extinguished) return "Self-extinguished";
  if (r.blowoff) return "Blowoff";
  if (r.ignited === false || r.ignition === "no") return "Did not ignite";
  if (r.ignited || r.ignition === "yes") return "Ignited";
  return null;
}

export function subject(r) {
  return r.fuel || r.material || r.sample_id || r.description || "Sample";
}

export function percentile(val, peers, k) {
  const vals = peers.map((p) => p[k]).filter((x) => x != null).sort((a, b) => a - b);
  if (!vals.length) return null;
  const count = vals.filter((x) => x < val).length;
  return Math.round((count / vals.length) * 100);
}

export function simQuery(r) {
  if (r.family !== "droplet") return null;
  const fuel = /heptane/i.test(r.fuel) ? "Heptane" : /methanol/i.test(r.fuel) ? "Methanol" : null;
  if (!fuel) return null;
  return {
    fuel,
    o2: r.x_o2 ?? 0.21,
    P: r.pressure_atm ?? 1.0,
    co2: r.x_co2 ?? 0,
    he: r.x_he ?? 0,
    d0: r.d0_mm ?? 3.0,
  };
}

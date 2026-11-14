/**
 * Scientific Experiment Comparison Studio — Analytical Model
 * Aligns parameters, calculates quantitative deltas, identifies methodology
 * differences (0g vs 1g, fiber-supported vs free, fuel types), and formats for comparison.
 */

export const COMPARISON_FIELDS = [
  { key: "family", label: "Physical Family", group: "General" },
  { key: "campaign", label: "Campaign / Experiment", group: "General" },
  { key: "gravity", label: "Gravitational Regime", group: "General" },
  { key: "material_or_fuel", label: "Fuel / Material", group: "Sample" },
  { key: "pressure_atm", label: "Ambient Pressure", unit: "atm", group: "Atmosphere", numeric: true },
  { key: "x_o2", label: "Oxygen Fraction (O₂)", unit: "%", group: "Atmosphere", numeric: true, pct: true },
  { key: "d0_mm", label: "Initial Diameter (d₀)", unit: "mm", group: "Geometry", numeric: true },
  { key: "d_ext_mm", label: "Extinction Diameter (d_ext)", unit: "mm", group: "Results", numeric: true },
  { key: "burning_rate_mm2_s", label: "Burning Rate (K)", unit: "mm²/s", group: "Results", numeric: true },
  { key: "burn_time_s", label: "Burn Duration", unit: "s", group: "Results", numeric: true },
  { key: "flow_cm_s", label: "Convective Flow Speed", unit: "cm/s", group: "Flow", numeric: true },
  { key: "end_mode", label: "Termination Mode", group: "Results" },
  { key: "quality_score", label: "Scientific Quality Score", unit: "/100", group: "Quality", numeric: true },
  { key: "primary_status", label: "Validation Status", group: "Quality" },
];

/**
 * Normalizes experiment record from either evidence ledger format or raw experiments format.
 */
export function normalizeExperimentForCompare(exp) {
  if (!exp) return null;
  const isLedger = Boolean(exp.evidence_id);
  const norm = isLedger ? exp.normalized_measurements || {} : exp;
  const qual = isLedger ? exp.scientific_quality || {} : {};

  return {
    uid: exp.uid || exp.test_id,
    evidence_id: exp.evidence_id || `EVID-${exp.uid}`,
    test_id: exp.test_id || exp.uid,
    campaign: exp.campaign || exp.accession,
    accession: exp.accession,
    family: exp.family || "droplet",
    gravity: exp.gravity || (exp.g === 1 ? "1g (Terrestrial)" : "0g (Microgravity)"),
    material_or_fuel: exp.material_or_fuel || exp.fuel || exp.material || "Unspecified",
    pressure_atm: norm.pressure_atm ?? exp.pressure_atm,
    x_o2: norm.x_o2 ?? exp.x_o2,
    d0_mm: norm.d0_mm ?? exp.d0_mm,
    d_ext_mm: norm.d_ext_mm ?? exp.d_ext_mm,
    burning_rate_mm2_s: norm.burning_rate_mm2_s ?? exp.burning_rate_mm2_s,
    burn_time_s: norm.burn_time_s ?? exp.burn_time_s,
    flow_cm_s: norm.flow_cm_s ?? exp.flow_cm_s,
    end_mode: exp.outcome?.end_mode || exp.end_mode || "Unspecified",
    quality_score: qual.quality_score ?? 85.0,
    primary_status: qual.primary_status ?? "VALIDATED",
    source_file: exp.source_provenance?.source_file || exp.source_file,
    source_line: exp.source_provenance?.source_line || exp.source_line,
    doi_url: exp.source_provenance?.doi_url || exp.doi_url,
    publication_title: exp.literature_reference?.publication_title || "NASA Technical Publication",
  };
}

/**
 * Evaluates methodology differences between two experiments.
 */
export function detectMethodologyDifferences(expA, expB) {
  const diffs = [];
  if (!expA || !expB) return diffs;

  if (expA.family !== expB.family) {
    diffs.push({
      type: "FAMILY_MISMATCH",
      severity: "CRITICAL",
      message: `Physical regime mismatch: ${expA.family} vs ${expB.family}. Direct numerical comparison may not be physically equivalent.`,
    });
  }

  if (expA.gravity !== expB.gravity) {
    diffs.push({
      type: "GRAVITY_DISCREPANCY",
      severity: "HIGH",
      message: `Gravitational discrepancy: comparing ${expA.gravity} against ${expB.gravity}. Buoyant convection is present in 1g but suppressed in 0g.`,
    });
  }

  if (expA.material_or_fuel.toLowerCase() !== expB.material_or_fuel.toLowerCase()) {
    diffs.push({
      type: "FUEL_DIFFERENCE",
      severity: "MEDIUM",
      message: `Different fuels / materials: ${expA.material_or_fuel} vs ${expB.material_or_fuel}. Thermophysical properties, soot yields, and kinetics differ.`,
    });
  }

  return diffs;
}

/**
 * Calculates quantitative parameter deltas between two experiments.
 */
export function calculateComparisonDeltas(expA, expB) {
  const deltas = {};
  if (!expA || !expB) return deltas;

  for (const field of COMPARISON_FIELDS) {
    if (!field.numeric) continue;
    const valA = expA[field.key];
    const valB = expB[field.key];

    if (valA !== null && valA !== undefined && valB !== null && valB !== undefined) {
      const diff = Number(valB) - Number(valA);
      const pctChange = valA !== 0 ? (diff / valA) * 100 : null;
      deltas[field.key] = {
        diff: Number(diff.toFixed(3)),
        pctChange: pctChange !== null ? Number(pctChange.toFixed(1)) : null,
      };
    } else {
      deltas[field.key] = {
        missing: true,
        reason: valA === null ? `Missing in ${expA.test_id}` : `Missing in ${expB.test_id}`,
      };
    }
  }

  return deltas;
}

/**
 * Exports comparison data to JSON or CSV format.
 */
export function exportComparison(expA, expB, format = "json") {
  const deltas = calculateComparisonDeltas(expA, expB);
  const methodology = detectMethodologyDifferences(expA, expB);

  const payload = {
    metadata: {
      generated_at: new Date().toISOString(),
      platform: "FlameLens AI — Microgravity Scientific Intelligence Platform",
    },
    experiment_a: expA,
    experiment_b: expB,
    quantitative_deltas: deltas,
    methodological_differences: methodology,
  };

  if (format === "json") {
    return JSON.stringify(payload, null, 2);
  }

  // CSV format
  const rows = [
    ["Field", "Group", `${expA.test_id} (${expA.campaign})`, `${expB.test_id} (${expB.campaign})`, "Absolute Delta", "Percent Delta"],
  ];
  for (const field of COMPARISON_FIELDS) {
    const valA = expA[field.key] ?? "N/A";
    const valB = expB[field.key] ?? "N/A";
    const d = deltas[field.key];
    const diffStr = d && !d.missing ? `${d.diff} ${field.unit || ""}` : (d?.reason || "—");
    const pctStr = d && d.pctChange !== null ? `${d.pctChange}%` : "—";
    rows.push([`"${field.label}"`, `"${field.group}"`, `"${valA}"`, `"${valB}"`, `"${diffStr}"`, `"${pctStr}"`]);
  }

  return rows.map((r) => r.join(",")).join("\n");
}


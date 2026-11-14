import { ICON } from "../core/dom.js";

const FLOW = [
  { step: "01", h: "Sources", p: "PSI, NTRS, and Task Book: data tables, PDFs, and mission briefs.", who: "Data" },
  { step: "02", h: "Triage", p: "Does the passage discuss an experiment and report quantitative measurements?", who: "Jev", jev: true },
  { step: "03", h: "Extraction", p: "LLM populates a typed schema with value, units, and verbatim text citation.", who: "LLM" },
  { step: "04", h: "Verification", p: "Does the citation substantiate the value? Calibrated confidence gates acceptance or review.", who: "Jev", jev: true },
  { step: "05", h: "Model", p: "Empirical nearest-neighbors today; Gaussian Process augmented with Cantera kinetics tomorrow.", who: "ML + Physics" },
  { step: "06", h: "Dashboard", p: "A typed decision router directs user queries to SQL, RAG, or physical simulation.", who: "Jev", jev: true },
];

export function mountPipeline(root) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Proposed Architecture</div>
      <h2>From 30 Years of PDFs to Evidence-Backed Recommendations</h2>
      <p class="lede">Each stage utilizes the tool best suited for the task. Jev (from TypeSafe AI) returns typed decisions (discrete choice, boolean, scoring) with calibrated probabilities: ideal for classification and verification, rather than predicting combustion physics or generating freeform text.</p>
    </div>
    <div class="flow">
      ${FLOW.map((n) => `
        <div class="flow-node ${n.jev ? "jev" : ""}">
          <span class="step">${n.step}</span>
          <h3>${n.h}</h3>
          <p>${n.p}</p>
          <span class="who ${n.jev ? "jev" : ""}">${n.who}</span>
        </div>`).join("")}
    </div>
    <div class="grid-2">
      <div class="panel stack">
        <h3>Atomic Triage Questions</h3>
        <p class="dim small">Every text chunk from the 277 documents passes through these typed evaluations. Only verified relevant passages advance to the extraction stage, which is the expensive step.</p>
<pre class="code"><span class="k">state</span>    text_chunk + document_title
<span class="k">choice</span>   experiment = FLEX | FLEX-2 | BASS | Saffire | SoFIE |
                      ACME | SAME | other | none
<span class="k">bool</span>     reports_quantitative_measurement
<span class="k">choice</span>   metric = spread_rate | extinction_limit |
                  burning_rate | ignition_delay |
                  smoke_particle_size | other</pre>
      </div>
      <div class="panel stack">
        <h3>Confidence-Directed Verification</h3>
        <p class="dim small">Boolean decision: «Does the verbatim citation support the extracted value with those specific units?». Instead of random spot-checking, human domain experts review only uncertain edge cases.</p>
        <div class="policy">
          <div><span class="status st-good">${ICON.good}Accept</span><span><b>≥ 0.90</b> · committed to database</span></div>
          <div><span class="status st-warn">${ICON.warn}Review</span><span><b>0.60–0.90</b> · human review queue</span></div>
          <div><span class="status st-crit">${ICON.crit}Discard</span><span><b>&lt; 0.60</b> · logged with rejection reason</span></div>
        </div>
        <p class="dim small">Initial calibration thresholds; tuned using ~100 hand-labeled expert samples.</p>
      </div>
    </div>
    <div class="grid-2">
      <div class="panel stack">
        <h3>What We Do Not Ask of Jev</h3>
        <ul class="tight">
          <li>Predicting material flammability: that is governed by physical models trained on microgravity test data and kinetics.</li>
          <li>Extracting raw numbers or drafting prose: Jev does not generate arbitrary freeform text.</li>
          <li>Uncited recommendations: all outputs are strictly tethered to verified citations.</li>
        </ul>
      </div>
      <div class="panel stack">
        <h3>Prior to Production Deployment</h3>
        <ul class="tight">
          <li>Currently in early access: access requests must be planned via console.typesafe.ai.</li>
          <li>Throughput and cost benchmarks originate from vendor claims: measure against our custom benchmark dataset and contrast with a small local LLM.</li>
          <li>If timeline requires, the identical pipeline operates reliably with an LLM in structured classification mode.</li>
        </ul>
      </div>
    </div>`;
  return {};
}

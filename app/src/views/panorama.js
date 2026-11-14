import { esc, fmt } from "../core/dom.js";
import { flexFindings } from "../model/findings.js";
import { simulate } from "../model/flame.js";
import { createFlame2D } from "../render/flame2d.js";

const HERO_Q = { fuel: "Heptane", o2: 0.21, P: 1.0, co2: 0, he: 0, d0: 3.0 };

export function mountPanorama(root, data, { go }) {
  const inv = data.inventory;
  const flex = data.flex;
  const rows = inv.reduce((s, r) => s + r.rows, 0);
  const tb = inv.reduce((s, r) => s + r.gb, 0) / 1000;
  const got = inv.reduce((s, r) => s + r.mb, 0) / 1000;
  const tables = inv.filter((r) => r.rows > 0).length;
  const videoShare = 1 - got / (tb * 1000);
  const lowP = flex.filter((r) => r.P < 0.65).length;
  const minP = Math.min(...flex.map((r) => r.P));
  const hiO2lowP = flex.filter((r) => r.o2 >= 0.3 && r.P < 0.9).length;

  root.innerHTML = `
    <!-- 6. Hero Landing Section -->
    <div class="hero">
      <div>
        <div class="eyebrow">NASA Space Apps 2026 · Challenge #08</div>
        <h1>Understand combustion <span class="flame" style="color:var(--color-flame)">beyond Earth.</span></h1>
        <p class="lede">Explore microgravity flame behavior, connect experimental evidence, and investigate data-informed directions for future combustion research.</p>
        <div class="hero-cta" style="margin-top:20px; display:flex; gap:12px; flex-wrap:wrap;">
          <button type="button" class="btn primary" data-go="lab3d">Explore the Laboratory</button>
          <button type="button" class="btn secondary" data-go="data">Explore the Evidence</button>
          <button type="button" class="btn secondary" data-go="optimizer">Design Optimizer</button>
        </div>
        <div class="hero-meta" style="margin-top:24px;">
          <span><b>${inv.length}</b> flight campaigns</span>
          <span><b>${rows.toLocaleString("en-US")}</b> tabulated test runs</span>
          <span><b>${data.totals.ntrs}</b> technical reports</span>
        </div>
      </div>
      <figure class="porthole-wrap" style="margin:0">
        <div class="porthole" id="porthole"><canvas id="hero-flame" aria-label="Heptane droplet burning in microgravity"></canvas></div>
        <figcaption class="porthole-caption">3 mm <b>heptane</b> droplet · 21% O₂ · 1 atm<br><span class="dim">prediction derived from empirical FLEX flight data</span></figcaption>
      </figure>
    </div>

    <!-- Core Research Pillars Spotlight -->
    <div class="grid-3" style="margin-block:10px 14px;">
      <article class="panel feature" style="cursor:pointer;" data-go="lab3d">
        <div class="eyebrow" style="color:var(--color-flame); margin-bottom:8px;">Virtual Instrument</div>
        <h3 style="margin-bottom:8px;">3D Combustion Laboratory</h3>
        <p class="small dim" style="margin-bottom:16px;">Situates droplet burning within the ISS Combustion Integrated Rack (CIR). Features continuous partial-gravity responses (0g, 0.16g, 0.38g, 1.0g) and scientific diagnostic cameras (Color, HiBMS shadowgraphy, LLUV chemiluminescence).</p>
        <span class="btn small primary" style="align-self:start;">Launch 3D Lab →</span>
      </article>

      <article class="panel feature" style="cursor:pointer;" data-go="data">
        <div class="eyebrow" style="color:var(--color-cyan); margin-bottom:8px;">Traceable Flight Data</div>
        <h3 style="margin-bottom:8px;">Evidence Explorer</h3>
        <p class="small dim" style="margin-bottom:16px;">Inspect 2,009 microgravity test runs and 277 indexed NTRS scientific papers across 24 flight investigations. Complete provenance with source-line pointers, quality verification, and zero silent data alterations.</p>
        <span class="btn small secondary" style="align-self:start;">Explore Records →</span>
      </article>

      <article class="panel feature" style="cursor:pointer;" data-go="optimizer">
        <div class="eyebrow" style="color:var(--color-blue); margin-bottom:8px;">Bayesian Active Learning</div>
        <h3 style="margin-bottom:8px;">Design Optimizer</h3>
        <p class="small dim" style="margin-bottom:16px;">Pointwise Expected Information Gain (EIG) over fuel-stratified Gaussian Process Regression models. Identifies high-value experimental targets that maximize scientific discovery while enforcing spacecraft safety envelopes.</p>
        <span class="btn small secondary" style="align-self:start;">Optimize Design →</span>
      </article>
    </div>

    <!-- Quantitative Data Totals -->
    <div class="kpis">
      ${[
      [inv.length, "combustion investigations in the NASA PSI repository"],
      [rows.toLocaleString("en-US"), "tabulated test runs with full conditions"],
      [data.totals.ntrs, "NTRS full-text research papers and reports"],
      [data.totals.taskbook, "funded projects in NASA Task Book"],
      [`${tb.toFixed(1)} TB`, `published on PSI; ${got.toFixed(1)} GB parsed as tabular data`],
    ].map(([b, s]) => `<div class="panel kpi"><b>${b}</b><span>${s}</span></div>`).join("")}
    </div>

    <!-- The Research Problem -->
    <div class="section-head" style="margin-top:14px;">
      <div class="eyebrow">The Real Problem</div>
      <h2>Where Scientists Get Stuck Today</h2>
      <p class="lede">What we discovered when downloading and linking the data. Each card presents the underlying evidence and where visual analytics makes a difference.</p>
    </div>
    <div class="problems">
      ${[
      {
        tag: "Fragmented Data",
        h: "Every Experiment Speaks Its Own Dialect",
        p: `${tables} experimental tables, each with inconsistent columns, units, and headers. Values like "~21.5" or "20 cm/s" were stored as unparsed text strings.`,
        ev: `During download: ~2,600 broken links on NASA's PSI server; we recovered 978 by extracting archive files.`,
        at: "Unified database preserving full source file and line traceability.",
      },
      {
        tag: "Trapped Knowledge",
        h: "Findings Locked in PDFs and Raw Video",
        p: `${(videoShare * 100).toFixed(2)}% of PSI storage consists of video and raw image arrays. Key conclusions remain locked in ${data.totals.ntrs} unstructured technical documents.`,
        ev: `${tb.toFixed(1)} TB published vs ${got.toFixed(1)} GB of tabular data and documents.`,
        at: "AI extraction and verified grounding with exact text citations.",
      },
      {
        tag: "Coverage Gaps",
        h: "No Empirical Data Where It Matters Most",
        p: `Exploration architectures propose 0.57 atm and 34% O₂. In FLEX, only ${lowP} test runs ever dropped below 0.65 atm; the minimum measured pressure is ${fmt(minP)} atm.`,
        ev: `Test runs with ≥30% O₂ and <0.9 atm: ${hiO2lowP}.`,
        at: "Coverage maps and predictive models that explicitly warn of extrapolation.",
      },
      {
        tag: "Earth vs. Orbit",
        h: "Certified in 1g, Flown in 0g",
        p: "Standard material screening (NASA-STD-6001, Test 1) burns samples vertically upward on Earth. In orbit, flames behave completely differently, often defying 1g assumptions.",
        ev: "Saffire-II: silicone burned completely in 1g tests on Earth, but self-extinguished in orbit; SIBAL fabric propagated 29 cm in space.",
        at: "Direct 1g vs. microgravity comparison across materials and atmospheres.",
      },
    ].map((x) => `
        <article class="panel problem">
          <span class="tag" style="border-color:var(--color-border-strong); background:var(--color-panel-raised); color:var(--color-cyan);">${x.tag}</span>
          <h3>${x.h}</h3>
          <p>${x.p}</p>
          <div class="evidence" style="border-left:2px solid var(--color-cyan);">${x.ev}</div>
          <div class="attack" style="border-left:2px solid var(--color-flame);">${x.at}</div>
        </article>`).join("")}
    </div>

    <!-- Empirical Insights -->
    <div class="section-head" style="margin-top:14px;">
      <div class="eyebrow">What the Data Already Tells Us</div>
      <h2>Insights Across 273 Droplets Ignited in Orbit</h2>
      <p class="lede">Calculated in real time from the empirical FLEX dataset. These represent empirical correlations across trials to be corroborated with physical kinetics and literature.</p>
    </div>
    <div class="findings">
      ${flexFindings(flex).map((f) => `<article class="panel finding"><div class="big">${f.big}</div><p>${f.text}</p><div class="src">${f.src}</div></article>`).join("")}
    </div>

    <!-- Investigation Inventory -->
    <div class="section-head" style="margin-top:14px;">
      <div class="eyebrow">Inventory</div>
      <h2>The 24 Research Campaigns</h2>
      <p class="lede">Runs = rows in each investigation's experimental table. Total PSI size = all published files (predominantly video); Downloaded = tables, documents, and reduced telemetry.</p>
    </div>
    <div class="panel" style="padding:0">
      <div class="tablewrap" style="border:0"><table class="inv" id="inv"></table></div>
    </div>`;

  root.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));

  // Porthole screws
  const port = root.querySelector("#porthole");
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bolt = document.createElement("span");
    bolt.className = "bolt";
    bolt.style.left = `calc(50% + ${Math.cos(a) * 46.2}% - 4.5px)`;
    bolt.style.top = `calc(50% + ${Math.sin(a) * 46.2}% - 4.5px)`;
    port.appendChild(bolt);
  }

  const maxGb = Math.max(...inv.map((r) => r.gb));
  root.querySelector("#inv").innerHTML =
    `<thead><tr><th>Investigation</th><th>Area</th><th>Period</th><th class="num">Runs</th><th class="num">Total PSI Size</th><th class="num">Downloaded</th><th>DOI</th></tr></thead><tbody>` +
    [...inv].sort((a, b) => b.rows - a.rows).map((r) => `
      <tr>
        <td><div class="acr">${esc(r.acr || r.acc)}</div><div class="dim small">${esc(r.title)}</div></td>
        <td class="small">${esc(r.area)}</td>
        <td class="dim small" style="white-space:nowrap">${esc((r.start || "").slice(-4))}–${esc((r.end || "").slice(-4))}</td>
        <td class="num">${r.rows || "—"}</td>
        <td class="num">${r.gb >= 1 ? `${r.gb.toFixed(0)} GB` : `${(r.gb * 1000).toFixed(0)} MB`}<div class="sizebar"><i style="width:${Math.max(2, Math.sqrt(r.gb / maxGb) * 100)}%"></i></div></td>
        <td class="num">${r.mb >= 1000 ? `${(r.mb / 1000).toFixed(1)} GB` : `${r.mb.toFixed(0)} MB`}</td>
        <td style="white-space:nowrap">${r.doi ? `<a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener">${esc(r.acc)}</a>` : esc(r.acc)}</td>
      </tr>`).join("") + "</tbody>";

  const heroSim = simulate(flex, HERO_Q);
  const flame = createFlame2D(root.querySelector("#hero-flame"), { getSim: () => heroSim, scale: 1.5, bg: "#020309", frac: 0.45 });
  let active = false;
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (active && visible) flame.start();
    else flame.stop();
  });
  io.observe(port);

  return {
    enter() { active = true; if (visible) flame.start(); },
    leave() { active = false; flame.stop(); },
  };
}

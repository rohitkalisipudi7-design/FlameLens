import { esc, fmt } from "../core/dom.js";
import { flexFindings } from "../model/findings.js";
import { simulate } from "../model/flame.js";
import { createFlame2D } from "../render/flame2d.js";

const HERO_PRESETS = {
  heptane: {
    q: { fuel: "Heptane", o2: 0.21, P: 1.0, co2: 0, he: 0, d0: 3.0 },
    caption: `3.0 mm <b>n-heptane</b> droplet · 21% O₂ · 1.0 atm<br><span class="dim">Incandescent soot shell & outer blue chemiluminescent envelope (ISS FLEX)</span>`,
    glowColor: "rgba(255, 121, 31, 0.28)",
  },
  methanol: {
    q: { fuel: "Methanol", o2: 0.21, P: 1.0, co2: 0, he: 0, d0: 3.0 },
    caption: `3.0 mm <b>methanol</b> droplet · 21% O₂ · 1.0 atm<br><span class="dim">Pure non-sooting blue chemiluminescent diffusion flame (ISS FLEX)</span>`,
    glowColor: "rgba(32, 185, 232, 0.28)",
  },
  coolflame: {
    q: { fuel: "Heptane", o2: 0.18, P: 1.0, co2: 0, he: 0, d0: 3.6 },
    caption: `Radiative extinction transition into <b>cool flame</b> (~600 K)<br><span class="dim">Low-temperature combustion regime discovered aboard ISS</span>`,
    glowColor: "rgba(168, 85, 247, 0.28)",
  },
};

export function mountOverview(root, data, { go }) {
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
    <!-- 1. Hero Landing Section -->
    <div class="hero">
      <div>
        <div class="hero-mission-badge">
          <span class="pulse-dot"></span> NASA Physical Sciences Informatics · Challenge #08
        </div>
        <h1>Understand combustion <span class="hero-flame-text">beyond Earth.</span></h1>
        <p class="lede">Explore microgravity flame behavior, connect experimental evidence, and investigate data-informed directions for future combustion research.</p>
        
        <div class="hero-cta">
          <button type="button" class="btn primary" data-go="lab3d">Explore the Laboratory →</button>
          <button type="button" class="btn secondary" data-go="data">Explore the Evidence</button>
          <button type="button" class="btn secondary" data-go="optimizer">Design Optimizer</button>
        </div>

        <div class="hero-stat-grid">
          <div class="hero-stat-box">
            <b>${inv.length}</b>
            <span>Flight Campaigns</span>
          </div>
          <div class="hero-stat-box">
            <b>${rows.toLocaleString("en-US")}</b>
            <span>Tabulated Space Runs</span>
          </div>
          <div class="hero-stat-box">
            <b>${data.totals.ntrs}</b>
            <span>Technical Reports</span>
          </div>
        </div>
      </div>

      <div class="chamber-viewport-wrap">
        <div class="chamber-viewport porthole" id="porthole">
          <div class="viewport-hud-top">
            <span class="viewport-hud-pill"><span class="pulse-dot"></span> 0g Microgravity</span>
            <span class="viewport-hud-pill">ISS CIR / MDCA</span>
          </div>
          <div class="viewport-reticle">
            <span class="reticle-tick t-top"></span>
            <span class="reticle-tick t-bottom"></span>
            <span class="reticle-tick t-left"></span>
            <span class="reticle-tick t-right"></span>
          </div>
          <canvas id="hero-flame" aria-label="Microgravity spherical flame simulation"></canvas>
          <div class="viewport-hud-bottom" id="hero-hud-bottom">
            <span id="hero-hud-telemetry">d: <b>3.00 mm</b> · <b>Spherical 0g Diffusion Flame</b></span>
          </div>
        </div>

        <!-- Interactive Flame Mode Selector -->
        <div class="hero-flame-controls" role="group" aria-label="Combustion Mode Selector">
          <button type="button" class="flame-mode-chip active" data-preset="heptane">🔥 Heptane (Soot Shell)</button>
          <button type="button" class="flame-mode-chip" data-preset="methanol">🔷 Methanol (Blue Flame)</button>
          <button type="button" class="flame-mode-chip" data-preset="coolflame">❄️ Cool Flame</button>
          <button type="button" class="flame-mode-chip" id="hero-reignite" title="Re-ignite droplet">↻ Re-ignite</button>
        </div>

        <figcaption class="porthole-caption" id="hero-caption" style="max-width:380px;">
          3 mm <b>heptane</b> droplet · 21% O₂ · 1 atm<br>
          <span class="dim">Incandescent soot shell & blue chemiluminescent envelope (ISS FLEX)</span>
        </figcaption>
      </div>
    </div>

    <!-- 2. Core Research Facilities (The 3 Gateways) -->
    <div class="section-head" style="margin-top:20px;">
      <div class="eyebrow">Platform Modules</div>
      <h2>Core Research Capabilities</h2>
      <p class="lede">FlameLens AI bridges empirical spaceflight data, physical kinetic models, and machine learning to illuminate combustion in freefall.</p>
    </div>

    <div class="grid-3" style="margin-block:10px 18px;">
      <article class="panel feature" style="cursor:pointer;" data-go="lab3d">
        <div class="eyebrow" style="color:var(--color-flame); margin-bottom:8px;">Virtual Instrument</div>
        <h3 style="margin-bottom:8px;">3D Combustion Laboratory</h3>
        <p class="small dim" style="margin-bottom:16px;">Situates droplet burning within the authentic ISS Combustion Integrated Rack (CIR). Features continuous partial-gravity responses (0g, 0.16g, 0.38g, 1.0g) and scientific diagnostic cameras (Color, HiBMS shadowgraphy, LLUV chemiluminescence).</p>
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

    <!-- 3. Scientific Data Volume KPIs -->
    <div class="kpis">
      ${[
        [inv.length, "combustion investigations in the NASA PSI repository"],
        [rows.toLocaleString("en-US"), "tabulated test runs with full conditions"],
        [data.totals.ntrs, "NTRS full-text research papers and reports"],
        [data.totals.taskbook, "funded projects in NASA Task Book"],
        [`${tb.toFixed(1)} TB`, `published on PSI; ${got.toFixed(1)} GB parsed as tabular data`],
      ].map(([b, s]) => `<div class="panel kpi"><b>${b}</b><span>${s}</span></div>`).join("")}
    </div>

    <!-- 4. Key Scientific Findings Across Flight Data -->
    <div class="section-head" style="margin-top:18px;">
      <div class="eyebrow">Empirical Evidence</div>
      <h2>Insights Across 273 Droplets Ignited in Orbit</h2>
      <p class="lede">Calculated in real time from the empirical FLEX flight dataset. These represent empirical correlations across space trials to be corroborated with physical kinetics and literature.</p>
    </div>
    <div class="findings">
      ${flexFindings(flex).map((f) => `<article class="panel finding"><div class="big">${f.big}</div><p>${f.text}</p><div class="src">${f.src}</div></article>`).join("")}
    </div>

    <!-- 5. The Research Problem: Where Scientists Get Stuck Today -->
    <div class="section-head" style="margin-top:18px;">
      <div class="eyebrow">The Spaceflight Challenge</div>
      <h2>Where Scientists Get Stuck Today</h2>
      <p class="lede">What we discovered when downloading and linking the data. Each card presents the underlying empirical evidence and where visual analytics makes a difference.</p>
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

    <!-- 6. NASA Flight Investigation Directory -->
    <div class="section-head" style="margin-top:18px;">
      <div class="panel-title" style="flex-wrap:wrap; gap:12px;">
        <div>
          <div class="eyebrow">Research Campaigns</div>
          <h2 style="margin:0;">The 24 Spaceflight Investigations</h2>
        </div>
        <input type="search" class="search" id="inv-search" placeholder="Search campaign (FLEX, BASS, Saffire)..." style="width:260px; font-size:12px; padding:6px 12px 6px 36px;" />
      </div>
      <p class="lede">Runs = rows in each investigation's experimental table. Total PSI size = published files (predominantly video); Downloaded = tables, documents, and reduced telemetry.</p>
    </div>

    <div class="panel" style="padding:0">
      <div class="tablewrap" style="border:0; max-height:480px; overflow-y:auto;">
        <table class="inv" id="inv"></table>
      </div>
    </div>`;

  root.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));

  const maxGb = Math.max(...inv.map((r) => r.gb));
  const invTable = root.querySelector("#inv");
  const invSearch = root.querySelector("#inv-search");

  function renderInventory(filterText = "") {
    const qLower = filterText.trim().toLowerCase();
    const filtered = inv.filter((r) => {
      if (!qLower) return true;
      return (
        (r.acr || "").toLowerCase().includes(qLower) ||
        (r.acc || "").toLowerCase().includes(qLower) ||
        (r.title || "").toLowerCase().includes(qLower) ||
        (r.area || "").toLowerCase().includes(qLower)
      );
    });

    invTable.innerHTML =
      `<thead><tr><th>Investigation</th><th>Area</th><th>Period</th><th class="num">Runs</th><th class="num">Total PSI Size</th><th class="num">Downloaded</th><th>DOI</th></tr></thead><tbody>` +
      [...filtered].sort((a, b) => b.rows - a.rows).map((r) => `
        <tr>
          <td><div class="acr" style="color:var(--color-text); font-weight:600;">${esc(r.acr || r.acc)}</div><div class="dim small">${esc(r.title)}</div></td>
          <td class="small" style="color:var(--color-cyan);">${esc(r.area)}</td>
          <td class="dim small" style="white-space:nowrap">${esc((r.start || "").slice(-4))}–${esc((r.end || "").slice(-4))}</td>
          <td class="num">${r.rows || "—"}</td>
          <td class="num">${r.gb >= 1 ? `${r.gb.toFixed(0)} GB` : `${(r.gb * 1000).toFixed(0)} MB`}<div class="sizebar"><i style="width:${Math.max(2, Math.sqrt(r.gb / maxGb) * 100)}%"></i></div></td>
          <td class="num">${r.mb >= 1000 ? `${(r.mb / 1000).toFixed(1)} GB` : `${r.mb.toFixed(0)} MB`}</td>
          <td style="white-space:nowrap">${r.doi ? `<a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener" style="color:var(--color-cyan);">${esc(r.acc)}</a>` : esc(r.acc)}</td>
        </tr>`).join("") + "</tbody>";
  }

  renderInventory();
  invSearch?.addEventListener("input", (e) => renderInventory(e.target.value));

  // Chamber Viewport Flame Initialization
  let activePresetKey = "heptane";
  let activeSim = simulate(flex, HERO_PRESETS[activePresetKey].q);

  const flame = createFlame2D(root.querySelector("#hero-flame"), {
    getSim: () => activeSim,
    scale: 1.5,
    bg: "#030811",
    frac: 0.55,
    onHud: ({ t, d, label }) => {
      const hudEl = root.querySelector("#hero-hud-telemetry");
      if (hudEl) {
        hudEl.innerHTML = `t = <b>${t.toFixed(1)} s</b> · d = <b>${d.toFixed(2)} mm</b> · <b>${esc(label)}</b>`;
      }
    },
  });

  const chamberEl = root.querySelector("#porthole");
  const captionEl = root.querySelector("#hero-caption");

  const chips = root.querySelectorAll(".flame-mode-chip[data-preset]");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("active");
        c.classList.remove("blue");
      });
      chip.classList.add("active");
      activePresetKey = chip.dataset.preset;
      if (activePresetKey === "methanol") chip.classList.add("blue");

      const preset = HERO_PRESETS[activePresetKey];
      activeSim = simulate(flex, preset.q);
      activeSim.t0 = performance.now();
      if (captionEl) captionEl.innerHTML = preset.caption;
      if (chamberEl) {
        chamberEl.style.boxShadow = `0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 60px -12px rgba(0, 0, 0, 0.85), 0 0 70px -15px ${preset.glowColor}`;
      }
      flame.redraw();
    });
  });

  const reigniteBtn = root.querySelector("#hero-reignite");
  reigniteBtn?.addEventListener("click", () => {
    const preset = HERO_PRESETS[activePresetKey];
    activeSim = simulate(flex, preset.q);
    activeSim.t0 = performance.now();
    flame.redraw();
  });

  let active = false;
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (active && visible) flame.start();
    else flame.stop();
  });
  if (chamberEl) io.observe(chamberEl);

  return {
    enter() {
      active = true;
      if (visible) flame.start();
    },
    leave() {
      active = false;
      flame.stop();
    },
  };
}

export const mountPanorama = mountOverview;

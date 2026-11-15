import { esc, fmt } from "../core/dom.js";
import { flexFindings } from "../model/findings.js";
import { createDualFlameHero } from "../render/dualFlameHero.js";

const HERO_Q = { fuel: "Heptane", o2: 0.21, P: 1.0, co2: 0, he: 0, d0: 3.0 };

const DISCOVERY_TOPICS = [
  "Oxygen Extinction Threshold",
  "CO₂ Suppression Efficacy",
  "Helium Thermal Conduction",
  "Cool Flame Transition Boundary",
];

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

  const findings = flexFindings(flex);

  root.innerHTML = `
    <!-- =====================================================================
         SECTION 1: HERO (Two-Column Desktop Composition)
         ===================================================================== -->
    <section class="hero-dashboard" aria-label="FlameLens AI Hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-pulse" aria-hidden="true"></span>
          <span class="hero-badge-text">NASA Space Apps 2026 · Challenge #08</span>
          <span class="hero-badge-challenge">Flame in Freefall</span>
        </div>
        
        <h1 class="hero-title">
          Understand combustion <span class="flame-gradient">beyond Earth.</span>
        </h1>
        
        <p class="hero-lede">
          Explore microgravity flame behavior, connect experimental evidence, and investigate data-informed directions for future combustion research.
        </p>

        <div class="hero-actions">
          <button type="button" class="btn primary hero-btn hero-btn-primary" data-go="lab3d">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>
            Explore the Laboratory
          </button>
          <button type="button" class="btn secondary hero-btn" data-go="data">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
            Explore the Evidence
          </button>
          <button type="button" class="btn secondary hero-btn" data-go="optimizer">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg>
            Design Optimizer
          </button>
        </div>
      </div>

      <div class="hero-visual">
        <div class="dual-flame-card" id="hero-dual-flame" aria-label="Conceptual Comparison: 1g Earth Gravity vs 0g Microgravity Combustion">
          <div class="dual-flame-header">
            <span class="dual-flame-tag">GRAVITY REGIME COMPARISON</span>
            <span class="dual-flame-legend">
              <span class="legend-dot dot-1g"></span> 1g Convection
              <span class="legend-sep">⟷</span>
              <span class="legend-dot dot-0g"></span> 0g Diffusion
            </span>
          </div>

          <div class="dual-flame-stage">
            <!-- LEFT: Earth Gravity (1g) -->
            <div class="flame-pane pane-1g">
              <div class="flame-viewport viewport-1g">
                <canvas id="flame-1g-canvas" aria-label="Earth gravity 1g flame showing buoyancy-driven upward plume"></canvas>
              </div>
              <div class="flame-label-block">
                <div class="flame-title flame-title-1g">EARTH GRAVITY — 1g</div>
                <div class="flame-desc">Buoyancy-Driven Convection</div>
                <div class="flame-sub">Elongated upward thermal plume</div>
              </div>
            </div>

            <!-- Central Comparison Divider -->
            <div class="dual-divider" aria-hidden="true">
              <span class="divider-line"></span>
              <span class="divider-badge font-mono">VS</span>
              <span class="divider-line"></span>
            </div>

            <!-- RIGHT: Microgravity (0g) -->
            <div class="flame-pane pane-0g">
              <div class="flame-viewport viewport-0g">
                <canvas id="flame-0g-canvas" aria-label="Microgravity 0g flame showing spherically symmetric blue combustion zone"></canvas>
              </div>
              <div class="flame-label-block">
                <div class="flame-title flame-title-0g">MICROGRAVITY — 0g</div>
                <div class="flame-desc">Diffusion-Dominated Regime</div>
                <div class="flame-sub">Spherically symmetric blue shell</div>
              </div>
            </div>
          </div>

          <!-- Conceptual Integrity Disclosure -->
          <div class="dual-disclosure">
            <span class="disc-icon">ℹ️</span>
            <span>Conceptual Comparison · Contrasts buoyancy-driven upward convection (1g) with spherical diffusion symmetry (0g). Qualitative visualization, not an uncalibrated CFD simulation output.</span>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 2: RESEARCH SNAPSHOT (Unified Statistics Dashboard)
         ===================================================================== -->
    <section class="research-snapshot" aria-label="Research Snapshot">
      <div class="section-head-compact">
        <div class="eyebrow-accent">
          <span class="eyebrow-icon">📊</span>
          <span>RESEARCH SNAPSHOT · REPOSITORY SCALE</span>
        </div>
        <div class="snapshot-header-row">
          <h2 class="snapshot-title">Unified NASA Combustion Corpus</h2>
          <span class="snapshot-badge">Physical Sciences Informatics (PSI)</span>
        </div>
      </div>

      <div class="snapshot-kpi-grid">
        <div class="snapshot-card">
          <div class="kpi-num">${inv.length}</div>
          <div class="kpi-label">Investigations</div>
          <div class="kpi-desc">Spaceflight & ground combustion campaigns</div>
          <div class="kpi-accent-bar cyan"></div>
        </div>

        <div class="snapshot-card">
          <div class="kpi-num">${rows.toLocaleString("en-US")}</div>
          <div class="kpi-label">Test Runs</div>
          <div class="kpi-desc">Tabulated trials with complete ambient physics</div>
          <div class="kpi-accent-bar flame"></div>
        </div>

        <div class="snapshot-card">
          <div class="kpi-num">${data.totals.ntrs}</div>
          <div class="kpi-label">Technical Reports</div>
          <div class="kpi-desc">NTRS full-text research papers and flight reports</div>
          <div class="kpi-accent-bar cyan"></div>
        </div>

        <div class="snapshot-card">
          <div class="kpi-num">${data.totals.taskbook}</div>
          <div class="kpi-label">Task Book Projects</div>
          <div class="kpi-desc">Funded projects in NASA Task Book database</div>
          <div class="kpi-accent-bar blue"></div>
        </div>

        <div class="snapshot-card">
          <div class="kpi-num">${tb.toFixed(1)} <small>TB</small></div>
          <div class="kpi-label">Published PSI Data</div>
          <div class="kpi-desc">${got.toFixed(1)} GB parsed into normalized tables</div>
          <div class="kpi-accent-bar flame"></div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 3: PLATFORM CAPABILITIES (3 Core Features)
         ===================================================================== -->
    <section class="capabilities-section" aria-label="Platform Capabilities">
      <div class="section-head">
        <div class="eyebrow">Platform Capabilities</div>
        <h2>Core Scientific Research Instruments</h2>
        <p class="lede">Three unified investigation environments bridging raw flight telemetry, physics-grounded 3D visualization, and Bayesian active experimental design.</p>
      </div>

      <div class="capabilities-grid">
        <!-- 1. 3D Combustion Laboratory -->
        <article class="panel capability-card card-lab" data-go="lab3d">
          <div class="card-top">
            <span class="card-badge flame">Virtual Instrument</span>
            <span class="card-status-dot flame"></span>
          </div>
          <div class="card-body">
            <div class="card-icon-wrap flame">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>
            </div>
            <h3>3D Combustion Laboratory</h3>
            <p>Situates droplet burning within the ISS Combustion Integrated Rack (CIR). Features continuous partial-gravity responses (0g, 0.16g, 0.38g, 1.0g) and scientific diagnostic cameras (Color, HiBMS shadowgraphy, LLUV chemiluminescence).</p>
          </div>
          <div class="card-footer">
            <span class="btn primary small card-action-btn">Launch 3D Lab →</span>
            <span class="card-meta">ISS CIR / MDCA Chamber</span>
          </div>
        </article>

        <!-- 2. Evidence Explorer -->
        <article class="panel capability-card card-data" data-go="data">
          <div class="card-top">
            <span class="card-badge cyan">Traceable Flight Data</span>
            <span class="card-status-dot cyan"></span>
          </div>
          <div class="card-body">
            <div class="card-icon-wrap cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 16l4-7 4 5 5-9"/></svg>
            </div>
            <h3>Evidence Explorer</h3>
            <p>Inspect 2,009 microgravity test runs and 277 indexed NTRS scientific papers across 24 flight investigations. Complete provenance with source-line pointers, quality verification, and zero silent data alterations.</p>
          </div>
          <div class="card-footer">
            <span class="btn secondary small card-action-btn">Explore Records →</span>
            <span class="card-meta">2,009 Validated Runs</span>
          </div>
        </article>

        <!-- 3. Design Optimizer -->
        <article class="panel capability-card card-opt" data-go="optimizer">
          <div class="card-top">
            <span class="card-badge blue">Bayesian Active Learning</span>
            <span class="card-status-dot blue"></span>
          </div>
          <div class="card-body">
            <div class="card-icon-wrap blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>
            </div>
            <h3>Design Optimizer</h3>
            <p>Pointwise Expected Information Gain (EIG) over fuel-stratified Gaussian Process Regression models. Identifies high-value experimental targets that maximize scientific discovery while enforcing spacecraft safety envelopes.</p>
          </div>
          <div class="card-footer">
            <span class="btn secondary small card-action-btn">Optimize Design →</span>
            <span class="card-meta">GPR Matérn 5/2 Surrogate</span>
          </div>
        </article>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 4: SCIENTIFIC DISCOVERIES (Editorial Varied Layout)
         ===================================================================== -->
    <section class="discoveries-section" aria-label="Scientific Discoveries">
      <div class="section-head">
        <div class="eyebrow">Empirical Evidence</div>
        <h2>What the Data Already Tells Us</h2>
        <p class="lede">Insights across 273 droplets ignited in orbit, calculated in real time from the empirical FLEX dataset. These represent empirical correlations across spaceflight trials to be corroborated with physical kinetics and literature.</p>
      </div>

      <div class="discoveries-editorial-grid">
        ${findings.map((f, idx) => `
          <article class="panel discovery-card disc-card-${idx + 1}">
            <div class="disc-top">
              <span class="disc-index font-mono">INSIGHT 0${idx + 1}</span>
              <span class="disc-topic-badge">${DISCOVERY_TOPICS[idx] || "Empirical Observation"}</span>
            </div>
            <div class="disc-big font-mono">${f.big}</div>
            <p class="disc-text">${f.text}</p>
            <div class="disc-src font-mono">
              <span class="disc-src-label">Literature & Observation:</span>
              <span>${f.src}</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <!-- =====================================================================
         SECTION 5: THE RESEARCH PROBLEM (Where Scientists Get Stuck Today)
         ===================================================================== -->
    <section class="problems-section" aria-label="The Research Problem">
      <div class="section-head">
        <div class="eyebrow">Research Gaps</div>
        <h2>Where Scientists Get Stuck Today</h2>
        <p class="lede">What we discovered when downloading and linking the NASA repository data. Each card presents the underlying empirical evidence and where visual analytics makes a definitive difference.</p>
      </div>

      <div class="problems-grid">
        <!-- Problem 1 -->
        <article class="panel problem-card">
          <div class="problem-header">
            <span class="problem-tag">Fragmented Data</span>
            <span class="problem-num font-mono">GAP-01</span>
          </div>
          <h3>Every Experiment Speaks Its Own Dialect</h3>
          <p class="problem-desc">${tables} experimental tables, each with inconsistent columns, units, and headers. Values like "~21.5" or "20 cm/s" were stored as unparsed text strings.</p>
          <div class="problem-evidence">
            <span class="evidence-icon">🔍</span>
            <div>
              <b>Underlying Evidence:</b> During download: ~2,600 broken links on NASA's PSI server; we recovered 978 by extracting archive files.
            </div>
          </div>
          <div class="problem-solution">
            <span class="solution-arrow">→</span>
            <div>
              <b>FlameLens Resolution:</b> Unified database preserving full source file and line traceability.
            </div>
          </div>
        </article>

        <!-- Problem 2 -->
        <article class="panel problem-card">
          <div class="problem-header">
            <span class="problem-tag">Trapped Knowledge</span>
            <span class="problem-num font-mono">GAP-02</span>
          </div>
          <h3>Findings Locked in PDFs and Raw Video</h3>
          <p class="problem-desc">${(videoShare * 100).toFixed(2)}% of PSI storage consists of video and raw image arrays. Key conclusions remain locked in ${data.totals.ntrs} unstructured technical documents.</p>
          <div class="problem-evidence">
            <span class="evidence-icon">🔍</span>
            <div>
              <b>Underlying Evidence:</b> ${tb.toFixed(1)} TB published vs ${got.toFixed(1)} GB of tabular data and documents.
            </div>
          </div>
          <div class="problem-solution">
            <span class="solution-arrow">→</span>
            <div>
              <b>FlameLens Resolution:</b> AI extraction and verified grounding with exact text citations.
            </div>
          </div>
        </article>

        <!-- Problem 3 -->
        <article class="panel problem-card">
          <div class="problem-header">
            <span class="problem-tag">Coverage Gaps</span>
            <span class="problem-num font-mono">GAP-03</span>
          </div>
          <h3>No Empirical Data Where It Matters Most</h3>
          <p class="problem-desc">Exploration architectures propose 0.57 atm and 34% O₂. In FLEX, only ${lowP} test runs ever dropped below 0.65 atm; the minimum measured pressure is ${fmt(minP)} atm.</p>
          <div class="problem-evidence">
            <span class="evidence-icon">🔍</span>
            <div>
              <b>Underlying Evidence:</b> Test runs with ≥30% O₂ and &lt;0.9 atm: ${hiO2lowP}.
            </div>
          </div>
          <div class="problem-solution">
            <span class="solution-arrow">→</span>
            <div>
              <b>FlameLens Resolution:</b> Coverage maps and predictive models that explicitly warn of extrapolation.
            </div>
          </div>
        </article>

        <!-- Problem 4 -->
        <article class="panel problem-card">
          <div class="problem-header">
            <span class="problem-tag">Earth vs. Orbit</span>
            <span class="problem-num font-mono">GAP-04</span>
          </div>
          <h3>Certified in 1g, Flown in 0g</h3>
          <p class="problem-desc">Standard material screening (NASA-STD-6001, Test 1) burns samples vertically upward on Earth. In orbit, flames behave completely differently, often defying 1g assumptions.</p>
          <div class="problem-evidence">
            <span class="evidence-icon">🔍</span>
            <div>
              <b>Underlying Evidence:</b> Saffire-II: silicone burned completely in 1g tests on Earth, but self-extinguished in orbit; SIBAL fabric propagated 29 cm in space.
            </div>
          </div>
          <div class="problem-solution">
            <span class="solution-arrow">→</span>
            <div>
              <b>FlameLens Resolution:</b> Direct 1g vs. microgravity comparison across materials and atmospheres.
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- =====================================================================
         SECTION 6: RESEARCH LANDSCAPE (Campaign Inventory Table)
         ===================================================================== -->
    <section class="landscape-section" aria-label="Research Landscape">
      <div class="section-head">
        <div class="eyebrow">Campaign Inventory</div>
        <h2>The 24 Research Campaigns</h2>
        <p class="lede">Runs = rows in each investigation's experimental table. Total PSI size = all published files (predominantly video); Downloaded = tables, documents, and reduced telemetry.</p>
      </div>

      <div class="panel table-panel">
        <div class="tablewrap table-scroll-container">
          <table class="inv" id="inv"></table>
        </div>
      </div>
    </section>
  `;

  // Attach navigation listeners
  root.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));

  // Populate 24 Campaigns Table
  const maxGb = Math.max(...inv.map((r) => r.gb));
  const invTable = root.querySelector("#inv");
  if (invTable) {
    invTable.innerHTML =
      `<thead><tr><th>Investigation</th><th>Area</th><th>Period</th><th class="num">Runs</th><th class="num">Total PSI Size</th><th class="num">Downloaded</th><th>DOI</th></tr></thead><tbody>` +
      [...inv].sort((a, b) => b.rows - a.rows).map((r) => `
        <tr>
          <td><div class="acr">${esc(r.acr || r.acc)}</div><div class="dim small">${esc(r.title)}</div></td>
          <td class="small">${esc(r.area)}</td>
          <td class="dim small" style="white-space:nowrap">${esc((r.start || "").slice(-4))}–${esc((r.end || "").slice(-4))}</td>
          <td class="num">${r.rows ? r.rows.toLocaleString("en-US") : "—"}</td>
          <td class="num">${r.gb >= 1 ? `${r.gb.toFixed(0)} GB` : `${(r.gb * 1000).toFixed(0)} MB`}<div class="sizebar"><i style="width:${Math.max(2, Math.sqrt(r.gb / maxGb) * 100)}%"></i></div></td>
          <td class="num">${r.mb >= 1000 ? `${(r.mb / 1000).toFixed(1)} GB` : `${r.mb.toFixed(0)} MB`}</td>
          <td style="white-space:nowrap">${r.doi ? `<a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener" class="doi-link">${esc(r.acc)}</a>` : esc(r.acc)}</td>
        </tr>`).join("") + "</tbody>";
  }

  // Dual flame gravity comparison visualization (1g vs 0g)
  const canvas1g = root.querySelector("#flame-1g-canvas");
  const canvas0g = root.querySelector("#flame-0g-canvas");
  const dualHero = createDualFlameHero(canvas1g, canvas0g);

  const heroContainer = root.querySelector("#hero-dual-flame");
  let active = false;
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    dualHero.setVisible(visible);
    if (active && visible) dualHero.start();
    else dualHero.stop();
  });
  if (heroContainer) io.observe(heroContainer);

  return {
    enter() {
      active = true;
      if (visible) dualHero.start();
    },
    leave() {
      active = false;
      dualHero.stop();
    },
  };
}

import "../styles/experiments.css";
import { esc, ICON } from "../core/dom.js";
import { el } from "../core/svg.js";
import { bindTip, hideTip } from "../core/tooltip.js";
import { conditions } from "../state.js";
import { SLIDERS } from "../ui/controls.js";
import { FAMILIES, LABELS, display, isNumeric, label, outcome, percentile, simQuery, subject } from "../model/experiments.js";

const PAGE = 80;
// Same colors as gas mix bar in 3D lab
const GAS = [["x_o2", "O₂", "#6da7ec"], ["x_n2", "N₂", "#4a5878"], ["x_co2", "CO₂", "#d5d9e2"], ["x_he", "He", "#b58ae6"]];
const HIDDEN = new Set(["uid", "accession", "family", "qc_flags", "source_file", "source_line", "excluded"]);
const ARROW = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

const fmtVal = (k, v, cols) => {
  const d = display(k, v, cols);
  return `${esc(d.v)}${d.u ? `<small>${esc(d.u)}</small>` : ""}`;
};

/** Distribution strip: all campaign runs as muted dots, selected run in accent color. */
function strip(svg, peers, k, current, cols, onPick) {
  svg.innerHTML = "";
  const W = 320, H = 34, pad = 8;
  const vals = peers.map((r) => r[k]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const x = (v) => pad + ((v - lo) / (hi - lo)) * (W - 2 * pad);
  el("line", { x1: pad, x2: W - pad, y1: H / 2, y2: H / 2, class: "strip-axis" }, svg);
  peers.forEach((r, i) => {
    if (r === current) return;
    const c = el("circle", { cx: x(r[k]), cy: H / 2 + (((i * 37) % 7) - 3) * 2.2, r: 3, class: "strip-dot" }, svg);
    bindTip(c, () => `<b>${esc(r.test_id)}</b> · ${fmtVal(k, r[k], cols)}<br><span class="dim">click to open</span>`);
    c.addEventListener("click", () => onPick(r.uid));
  });
  el("circle", { cx: x(current[k]), cy: H / 2, r: 6, class: "strip-me" }, svg);
}

export function mountExperiments(root, base, { go, gravity }) {
  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Single Experiment · Cleaned NASA PSI Tables</div>
      <h2>Every Run, with its Source</h2>
      <p class="lede">Select a test run to inspect its ambient conditions, final outcome, and position relative to the rest of its campaign. Every value links directly to its source NASA table, and droplet runs can be re-executed inside the 3D laboratory.</p>
    </div>
    <div class="exp-grid">
      <aside class="panel exp-list" aria-label="Experiment list">
        <input class="search exp-search" id="ex-q" type="search" placeholder="Search: FLEX, PMMA, 20CAL08…" aria-label="Search experiments">
        <div class="chips" id="ex-fam" role="group" aria-label="Family"></div>
        <select id="ex-camp" aria-label="Campaign"></select>
        <div class="dim small" id="ex-count" aria-live="polite"></div>
        <div class="exp-items" id="ex-items"></div>
      </aside>
      <article class="exp-detail" id="ex-detail" tabindex="-1"><div class="panel dim">Loading runs…</div></article>
    </div>`;

  const q = (s) => root.querySelector(s);
  let db = null;
  let pending = null;
  const st = { fam: "all", camp: "all", text: "", shown: PAGE, sel: null };

  async function load() {
    const res = await fetch(`${import.meta.env.BASE_URL}data/experiments.json`);
    if (!res.ok) throw new Error(`experiments.json (${res.status})`);
    const data = await res.json();
    data.byUid = new Map(data.rows.map((r) => [r.uid, r]));
    data.camp = Object.fromEntries(data.campaigns.map((c) => [c.accession, c]));
    data.peers = {};
    for (const r of data.rows) if (!r.excluded) (data.peers[r.accession] ||= []).push(r);
    return data;
  }

  // ---------------------------------------------------------------- List

  const famBox = q("#ex-fam");
  famBox.innerHTML = [["all", "All"], ...Object.entries(FAMILIES).map(([k, f]) => [k, f.label])]
    .map(([k, t]) => `<button type="button" class="chip" data-v="${k}">${t}</button>`).join("");
  famBox.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    st.fam = b.dataset.v;
    st.camp = "all";
    st.shown = PAGE;
    paintFilters();
    paintList();
  });
  q("#ex-camp").addEventListener("change", (e) => { st.camp = e.target.value; st.shown = PAGE; paintList(); });
  q("#ex-q").addEventListener("input", (e) => { st.text = e.target.value.trim().toLowerCase(); st.shown = PAGE; paintList(); });

  function paintFilters() {
    famBox.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === st.fam));
    const camps = db.campaigns.filter((c) => st.fam === "all" || c.family === st.fam);
    q("#ex-camp").innerHTML = `<option value="all">All Campaigns</option>` +
      camps.map((c) => `<option value="${c.accession}">${esc(c.campaign)} · ${c.n_rows}</option>`).join("");
    q("#ex-camp").value = st.camp;
  }

  const haystack = (r) => [r.uid, r.test_id, db.camp[r.accession]?.campaign, subject(r), r.fuel_raw, r.material_raw, r.date]
    .filter(Boolean).join(" ").toLowerCase();

  function filtered() {
    return db.rows.filter((r) =>
      (st.fam === "all" || r.family === st.fam) &&
      (st.camp === "all" || r.accession === st.camp) &&
      (!st.text || haystack(r).includes(st.text)));
  }

  function paintList() {
    const rows = filtered();
    q("#ex-count").textContent = `${rows.length.toLocaleString("en-US")} of ${db.rows.length.toLocaleString("en-US")} runs`;
    const box = q("#ex-items");
    box.innerHTML = rows.slice(0, st.shown).map((r) => {
      const n = r.qc_flags.length;
      return `<button type="button" class="exp-item" data-uid="${esc(r.uid)}" aria-current="${r.uid === st.sel}">
        <span class="exp-item-top"><span class="exp-camp">${esc(db.camp[r.accession]?.campaign)}</span><b>${esc(r.test_id)}</b>
          ${r.excluded ? `<span class="exp-mark crit" title="Excluded: duplicate entry">${ICON.crit}</span>` : n ? `<span class="exp-mark warn" title="${n} quality flags">${ICON.warn}${n}</span>` : ""}</span>
        <span class="exp-item-sub">${esc(subject(r))}${r.date ? ` · ${r.date}` : ""}</span>
        <span class="exp-item-out">${esc(outcome(r))}</span>
      </button>`;
    }).join("") + (rows.length > st.shown
      ? `<button type="button" class="btn small exp-more" id="ex-more">Show ${Math.min(PAGE, rows.length - st.shown)} more</button>` : "")
      + (rows.length ? "" : `<p class="dim small">No runs match your search criteria.</p>`);
  }

  q("#ex-items").addEventListener("click", (e) => {
    if (e.target.closest("#ex-more")) {
      st.shown += PAGE;
      paintList();
      return;
    }
    const b = e.target.closest(".exp-item");
    if (b) select(b.dataset.uid, { scroll: true });
  });

  // ---------------------------------------------------------------- Detail

  function select(uid, { scroll = false } = {}) {
    const r = db.byUid.get(uid);
    if (!r) return;
    st.sel = uid;
    hideTip();
    const i = filtered().indexOf(r);
    if (i < 0 || i >= st.shown) {
      Object.assign(st, { fam: r.family, camp: r.accession, text: "" });
      q("#ex-q").value = "";
      paintFilters();
      st.shown = Math.max(PAGE, Math.ceil((filtered().indexOf(r) + 1) / PAGE) * PAGE);
    }
    paintList();
    const item = [...q("#ex-items").querySelectorAll(".exp-item")].find((b) => b.dataset.uid === uid);
    if (item && !scroll) {
      const box = q("#ex-items");
      const a = item.getBoundingClientRect(), b = box.getBoundingClientRect();
      box.scrollTop += a.top - b.top - box.clientHeight / 2 + a.height / 2;
    }
    history.replaceState(null, "", `#data/runs/${encodeURIComponent(uid)}`);
    paintDetail(r);
    if (scroll && matchMedia("(max-width: 900px)").matches) q("#ex-detail").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function tile(r, k, peers, withStrip) {
    const cols = db.cols;
    const help = cols[k]?.[1] || "";
    let extra = "";
    if (withStrip && isNumeric(peers, k)) {
      const pts = peers.filter((p) => typeof p[k] === "number");
      if (pts.length >= 5) {
        const camp = db.camp[r.accession].campaign;
        extra = `<svg class="strip" viewBox="0 0 320 34" data-k="${k}" role="img" aria-label="Position among ${pts.length} runs of ${esc(camp)}"></svg>
          <span class="exp-tile-foot">percentile ${percentile(pts.map((p) => p[k]), r[k])} of ${pts.length} runs of ${esc(camp)}</span>`;
      }
    } else if (withStrip) {
      const pts = peers.filter((p) => p[k] != null);
      if (pts.length >= 5) {
        const same = pts.filter((p) => p[k] === r[k]).length;
        extra = `<span class="exp-tile-foot">same as ${Math.round((same / pts.length) * 100)}% of ${pts.length} campaign runs</span>`;
      }
    }
    return `<div class="exp-tile${withStrip ? "" : " compact"}" title="${esc(help)}">
      <span class="lbl">${esc(label(k, cols))}</span><b>${fmtVal(k, r[k], cols)}</b>${extra}</div>`;
  }

  function mixBar(r) {
    if (r.x_n2 == null && r.x_co2 == null && r.x_he == null) return "";
    const parts = GAS.filter(([k]) => r[k] > 0);
    return `<div class="exp-mix-wrap"><span class="lbl">Chamber Atmosphere</span>
      <div class="exp-mix" role="img" aria-label="${parts.map(([k, n]) => `${n} ${Math.round(r[k] * 100)}%`).join(", ")}">
        ${parts.map(([k, , c]) => `<i style="flex:${r[k]};background:${c}"></i>`).join("")}</div>
      <div class="legend small">${parts.map(([k, n, c]) => `<span><i class="sw" style="background:${c}"></i>${n} ${+(r[k] * 100).toFixed(1)}%</span>`).join("")}</div></div>`;
  }

  function paintDetail(r) {
    const camp = db.camp[r.accession];
    const fam = FAMILIES[r.family];
    const peers = db.peers[r.accession] || [];
    const sim = simQuery(r, SLIDERS);
    const pubs = db.pubs[r.accession] || [];
    const paper = pubs.find((p) => p.ntrs) || pubs.find((p) => p.url);
    const related = base.library.filter((x) => x.src === "NTRS" && x.topic === camp.ntrs_topic)
      .sort((a, b) => b.y.localeCompare(a.y)).slice(0, 6);
    const flags = r.qc_flags;
    const status = r.excluded
      ? `<span class="status st-crit">${ICON.crit}Excluded from training: duplicate entry</span>`
      : flags.length
        ? `<span class="status st-warn">${ICON.warn}${flags.length} quality ${flags.length === 1 ? "flag" : "flags"}</span>`
        : `<span class="status st-good">${ICON.good}No quality flags</span>`;
    const results = fam.results.filter((k) => r[k] != null);
    const conds = fam.conditions.filter((k) => r[k] != null);
    const rest = Object.keys(r).filter((k) => !HIDDEN.has(k));

    q("#ex-detail").innerHTML = `
      <div class="panel stack exp-head">
        <div class="exp-head-top">
          <div>
            <div class="exp-kicker"><span class="badge psi">${esc(fam.label)}</span><span class="mono dim small">${esc(r.accession)}${r.date ? ` · ${r.date}` : ""}${r.time_gmt ? ` · ${esc(r.time_gmt)} GMT` : ""}</span></div>
            <h3 class="exp-title">${esc(camp.campaign)} <span>·</span> ${esc(r.test_id)}</h3>
            <p class="dim small">${esc(camp.title)}</p>
          </div>
          ${status}
        </div>
        <div class="exp-actions">
          ${sim.q
        ? `<button type="button" class="btn primary" id="ex-sim">Open in 3D Laboratory</button>`
        : `<button type="button" class="btn" disabled aria-describedby="ex-sim-why">Open in 3D Laboratory</button>`}
          <a class="btn" href="${esc(camp.psi_url)}" target="_blank" rel="noopener">Data on NASA PSI ${ARROW}</a>
          ${paper ? `<a class="btn" href="${esc(paper.url)}" target="_blank" rel="noopener" title="${esc(paper.t)}">Reference Paper ${ARROW}</a>` : ""}
          <button type="button" class="btn" id="ex-dl">Download Data</button>
        </div>
        ${sim.q
        ? `<p class="dim small">The laboratory loads these conditions and renders the <b>model's prediction</b>; the actual historical flight outcome is recorded in this card.${sim.clipped.length ? ` Beyond simulator slider range: ${esc(sim.clipped.join("; "))}.` : ""}</p>`
        : `<p class="dim small" id="ex-sim-why">${esc(sim.why)}</p>`}
      </div>

      ${results.length ? `<section class="panel stack">
        <div class="panel-title"><h3>Outcome</h3><span class="dim small">blue point represents this run; gray points represent the rest of ${esc(camp.campaign)}</span></div>
        <div class="exp-tiles">${results.map((k) => tile(r, k, peers, true)).join("")}</div>
      </section>` : `<section class="panel stack"><h3>Outcome</h3>
        <p class="dim small">The table for ${esc(camp.campaign)} only records initial conditions without end modes. Detailed outcomes reside in raw video and data files on PSI.</p></section>`}

      <section class="panel stack">
        <h3>Conditions</h3>
        <p class="dim small">${esc(fam.about)}</p>
        <div class="exp-tiles">${conds.map((k) => tile(r, k, peers, false)).join("")}</div>
        ${mixBar(r)}
      </section>

      <div class="grid-2">
        <section class="panel stack">
          <h3>Data Quality</h3>
          ${flags.length ? `<ul class="exp-flags">${flags.map((f) => {
          const [k, why] = f.split(":");
          return `<li><b>${esc(label(k, db.cols))}</b><span>${esc(db.flags[why] || why)}</span></li>`;
        }).join("")}</ul>` : `<p class="dim small">Cleaning pipeline did not need to interpret or modify any values in this row.</p>`}
          <p class="mono dim small">Source: ${esc(db.files[r.source_file])}, line ${r.source_line}</p>
        </section>
        <section class="panel stack">
          <h3>Source</h3>
          <dl class="exp-src">
            <dt>Investigation</dt><dd>${esc(camp.title)}</dd>
            ${camp.start ? `<dt>Period</dt><dd>${camp.start.slice(0, 4)}–${(camp.end || "").slice(0, 4)}</dd>` : ""}
            <dt>Dataset</dt><dd><a href="${esc(camp.doi_url)}" target="_blank" rel="noopener">doi:${esc(camp.doi)}</a> · CC0 license</dd>
          </dl>
          ${pubs.length ? `<h4 class="exp-h4">Research Team Publications (${pubs.length})</h4><ul class="exp-pubs">${pubs.slice(0, 5).map((p) =>
          `<li>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.t)}</a>` : esc(p.t)}${p.ntrs ? ` <span class="badge">NTRS</span>` : ""}</li>`).join("")}</ul>` : ""}
          ${related.length ? `<h4 class="exp-h4">Related Reports in NTRS</h4><ul class="exp-pubs">${related.map((p) =>
            `<li><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.t)}</a> <span class="dim small">${esc(p.y)}</span></li>`).join("")}</ul>` : ""}
        </section>
      </div>

      <details class="panel exp-all">
        <summary><h3>All Fields (${rest.length})</h3></summary>
        <div class="tablewrap"><table>
          <thead><tr><th>Field</th><th class="num">Value</th><th>Description</th></tr></thead>
          <tbody>${rest.map((k) => `<tr><td>${LABELS[k] ? `${esc(LABELS[k])}<br>` : ""}<span class="mono dim small">${esc(k)}</span></td>
            <td class="num">${fmtVal(k, r[k], db.cols)}</td><td class="dim small">${esc(db.cols[k]?.[1] || "")}</td></tr>`).join("")}</tbody>
        </table></div>
      </details>`;

    q("#ex-detail").querySelectorAll("svg.strip").forEach((svg) => {
      const k = svg.dataset.k;
      strip(svg, peers.filter((p) => typeof p[k] === "number"), k, r, db.cols, (uid) => select(uid));
    });
    q("#ex-sim")?.addEventListener("click", () => {
      gravity.set({ g: 0 });
      conditions.set(sim.q);
      go("simulator", "3d");
    });
    q("#ex-dl").addEventListener("click", () => {
      const out = { ...r, source_file: db.files[r.source_file], campaign: camp };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
      a.download = `${r.uid.replace(/[^\w.-]+/g, "_")}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  function route(sub) {
    if (!db) { pending = sub; return; }
    const uid = sub && db.byUid.has(sub) ? sub : st.sel || filtered()[0]?.uid;
    if (uid) select(uid);
  }

  return {
    async enter(sub) {
      if (!db) {
        try {
          db = await load();
        } catch (err) {
          console.error(err);
          q("#ex-detail").innerHTML = `<div class="panel">Could not load test runs (${esc(err.message)}). Generate data with <code>scripts/build_dashboard_data.py</code>.</div>`;
          return;
        }
        paintFilters();
        paintList();
        sub = sub ?? pending;
      }
      route(sub);
    },
    route,
  };
}

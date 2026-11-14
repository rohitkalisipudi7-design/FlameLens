import { FLEX_DOI } from "../core/dom.js";
import { chipGroup } from "../ui/chips.js";
import { drawScatter, legendHTML } from "../charts/scatter.js";
import { drawExtinction } from "../charts/extinction.js";
import { drawCoverage } from "../charts/coverage.js";

export function mountExplorer(root, data, { open }) {
  const flex = data.flex;
  const f = { fuel: new Set(["Methanol", "Heptane"]), co2: "all", he: "all" };
  const pass = (r) =>
    f.fuel.has(r.fuel) &&
    (f.co2 === "all" || (f.co2 === "none") === (r.co2 === 0)) &&
    (f.he === "all" || (f.he === "none") === (r.he === 0));

  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">FLEX · Flame Extinguishment Experiment · ISS 2009–2011</div>
      <h2>Burning Rate vs. Oxygen</h2>
      <p class="lede">Each point represents a fuel droplet ignited aboard the International Space Station. The burning rate K quantifies how rapidly the droplet is consumed (d² law: d² = d₀² − K·t). Marker fill indicates test termination mode; click any point to view its complete record.</p>
    </div>
    <div class="panel stack">
      <div class="filters">
        <div class="chips" id="f-fuel"></div>
        <div class="chips" id="f-co2"></div>
        <div class="chips" id="f-he"></div>
      </div>
      <div class="legend" id="lg-scatter"></div>
      <svg class="chart" id="scatter" viewBox="0 0 820 420" role="img" aria-label="Burning rate vs oxygen mole fraction scatter plot"></svg>
      <div class="dim small" id="scatter-count"></div>
    </div>
    <div class="grid-2">
      <div class="panel stack">
        <div class="panel-title"><h3>Where is there data and where is there not?</h3><span class="dim small">runs per cell</span></div>
        <div class="cov-legend" id="cov-legend"></div>
        <svg class="chart" id="coverage" viewBox="0 0 560 330" role="img" aria-label="Test run coverage map by oxygen and pressure"></svg>
        <p class="dim small">Dashed cells = parameter combinations with zero historical test runs. The proposed exploration atmosphere lies outside measured flight data: here, predictions must rely on physical kinetics and warn of extrapolation.</p>
      </div>
      <div class="panel stack">
        <h3>Extinction Probability by O₂ Level</h3>
        <div class="legend" id="lg-bars"></div>
        <svg class="chart" id="bars" viewBox="0 0 500 320" role="img" aria-label="Percentage of runs terminating in extinction by oxygen range"></svg>
        <p class="dim small">Above each bar: total runs in that bin. Reflects active filter settings.</p>
      </div>
    </div>
    <div class="panel stack">
      <h3>How to Read This</h3>
      <ul class="tight">
        <li><b>Methanol</b> produces virtually no soot and burns with a faint blue flame. <b>Heptane</b> mirrors typical liquid hydrocarbon fuels and forms an incandescent soot shell.</li>
        <li>In microgravity, flames burn as spheres around the droplet: without buoyancy, oxygen arrives solely via diffusion.</li>
        <li><b>Extinction</b>: flame quenched before complete droplet consumption. <b>Complete</b>: burned to completion. <b>Disruption</b>: droplet fragmented or displaced.</li>
        <li>FLEX introduced CO₂ and helium to quantify their efficacy as fire suppressants. ISS fire extinguishers use CO₂.</li>
      </ul>
      <p class="dim small">Source: PSI-69 FLEX, experimental table (CC0 license). <a href="${FLEX_DOI}" target="_blank" rel="noopener">doi:10.60555/mbq8-0451</a></p>
    </div>`;

  const q = (s) => root.querySelector(s);
  const draw = () => {
    const rows = flex.filter(pass);
    const pts = rows.filter((r) => r.K != null && r.o2 != null);
    drawScatter(q("#scatter"), pts, (r) => open(`PSI-69:${r.id}`));
    q("#scatter-count").textContent = `${pts.length} runs displayed out of ${flex.length}. Hover over a point to inspect conditions; click to open its full record.`;
    drawExtinction(q("#bars"), rows, ["Methanol", "Heptane"].filter((x) => f.fuel.has(x)));
    const seq = drawCoverage(q("#coverage"), rows);
    q("#cov-legend").innerHTML =
      `<span>0</span><i style="border:1px dashed var(--line-2)"></i>` +
      ["1", "2–3", "4–6", "7–12", "13–24", "25+"].map((l, i) => `<i style="background:${seq[i]}"></i><span>${l}</span>`).join("");
  };

  chipGroup(q("#f-fuel"), "Fuel", [["Methanol", "Methanol"], ["Heptane", "Heptane"]], (v) => f.fuel.has(v), (v) => {
    if (f.fuel.has(v) && f.fuel.size > 1) f.fuel.delete(v);
    else f.fuel.add(v);
    draw();
  });
  chipGroup(q("#f-co2"), "CO₂", [["all", "All"], ["none", "Without CO₂"], ["some", "With CO₂"]], (v) => f.co2 === v, (v) => { f.co2 = v; draw(); });
  chipGroup(q("#f-he"), "Helium", [["all", "All"], ["none", "Without He"], ["some", "With He"]], (v) => f.he === v, (v) => { f.he = v; draw(); });
  q("#lg-scatter").innerHTML = legendHTML(true);
  q("#lg-bars").innerHTML = legendHTML(false);
  draw();
  return {};
}

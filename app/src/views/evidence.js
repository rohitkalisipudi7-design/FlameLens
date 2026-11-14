import { esc } from "../core/dom.js";
import { chipGroup } from "../ui/chips.js";

const KIND = {
  CONFERENCE_PAPER: "conference paper", PRESENTATION: "presentation", TECHNICAL_MEMORANDUM: "technical memo", POSTER: "poster",
  OTHER: "other", CONFERENCE_PROCEEDINGS: "proceedings", ACCEPTED_MANUSCRIPT: "journal article", JOURNAL_ARTICLE: "journal article",
  CONTRACTOR_REPORT: "contractor report", TECHNICAL_PUBLICATION: "technical publication", PROJECT: "project", DATASET: "dataset",
};
const LIMIT = 150;

export function mountEvidence(root, data) {
  const lib = [
    ...data.inventory.map((r) => ({
      src: "PSI", t: `${r.acr ? `${r.acr} — ` : ""}${r.title}`, y: (r.end || "").slice(-4), topic: r.area, kind: "DATASET",
      url: r.doi ? `https://doi.org/${r.doi}` : "https://psi.nasa.gov/physci/repo/",
    })),
    ...data.library,
  ];
  const on = new Set(["PSI", "NTRS", "Task Book"]);

  root.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Corpus for Extraction and RAG</div>
      <h2>Evidence Library</h2>
      <p class="lede">All downloaded documents, searchable by title and topic. The 277 NTRS technical reports form the indexed knowledge base queried by the scientific assistant above.</p>
    </div>
    <input class="search" id="q" type="search" placeholder="Search: cool flame, Saffire, smoke, flame spread, PMMA…" aria-label="Search evidence library">
    <div class="stage-bar"><div class="chips" id="f-src"></div><span class="dim small" id="lib-count"></span></div>
    <div class="panel" style="padding:0"><div class="lib" id="lib"></div></div>`;

  const input = root.querySelector("#q");
  const draw = () => {
    const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const res = lib.filter((r) => on.has(r.src) && words.every((w) => `${r.t} ${r.topic}`.toLowerCase().includes(w)));
    root.querySelector("#lib-count").textContent = `${res.length} of ${lib.length} documents`;
    root.querySelector("#lib").innerHTML =
      res.slice(0, LIMIT).map((r) => `
        <div class="lib-item">
          <span class="badge ${r.src === "PSI" ? "psi" : ""}">${esc(r.src)}</span>
          <div><a class="t" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.t)}</a>
            <div class="meta">${esc(KIND[r.kind] || String(r.kind || "").toLowerCase())} · ${esc(String(r.topic).replace(/_/g, " "))}</div></div>
          <span class="meta">${esc(r.y)}</span>
        </div>`).join("") +
      (res.length > LIMIT ? `<div class="lib-item"><span></span><span class="dim">Showing ${LIMIT}. Refine search to view more.</span><span></span></div>` : "") +
      (res.length === 0 ? `<div class="lib-item"><span></span><span class="dim">No results found. Try another term or enable additional sources.</span><span></span></div>` : "");
  };
  chipGroup(root.querySelector("#f-src"), "Source", [["PSI", "PSI · Data"], ["NTRS", "NTRS · Reports"], ["Task Book", "Task Book · Projects"]],
    (v) => on.has(v), (v) => { if (on.has(v) && on.size > 1) on.delete(v); else on.add(v); draw(); });
  input.addEventListener("input", draw);
  draw();
  return {};
}

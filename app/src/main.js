import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/views.css";
import "./styles/immersive_labs.css";

import { $ } from "./core/dom.js";
import { createRouter } from "./core/router.js";
import { createSpace } from "./background/space.js";
import { conditions, gravity, scenario, initScenario } from "./state.js";
import { createControls } from "./ui/controls.js";
import { mountPanorama } from "./views/panorama.js";
import { mountExplorer } from "./views/explorer.js";
import { mountExperiments } from "./views/experiments.js";
import { mountFlame3D } from "./views/flame3dView.js";
import { mountCompare } from "./views/compare.js";
import { mountEvidenceLedger } from "./views/evidenceLedgerView.js";
import { mountOptimizer } from "./views/optimizerView.js";
import { mountParts } from "./views/parts.js";

const TABS = [
  { id: "panorama", label: "Overview" },
  { id: "lab3d", label: "3D Laboratory" },
  { id: "data", label: "Evidence Explorer" },
  { id: "optimizer", label: "Design Optimizer" },
  { id: "compare", label: "Comparison Studio" },
];

const ALIASES = {
  overview: "panorama",
  portada: "panorama",
  inicio: "panorama",
  lab: "lab3d",
  llama3d: "lab3d",
  "simulator/3d": "lab3d",
  "simulador/3d": "lab3d",
  simulator: "lab3d",
  simulador: "lab3d",
  "simulator/2d": "lab3d",
  datos: "data",
  evidence: "data/ledger",
  evidencia: "data/ledger",
  ledger: "data/ledger",
  explorador: "data/charts",
  experimentos: "data/runs",
  "data/graficas": "data/charts",
  "data/ensayos": "data/runs",
  "datos/graficas": "data/charts",
  "datos/ensayos": "data/runs",
  charts: "data/charts",
  runs: "data/runs",
  optimizer: "optimizer",
  optimizador: "optimizer",
  compare: "compare",
  comparador: "compare",
  comparacion: "compare",
  assistant: "data/ledger",
  asistente: "data/ledger",
  rag: "data/ledger",
  ai: "data/ledger",
  // Graceful redirects for removed secondary modules:
  envelope: "panorama",
  safety: "panorama",
  "video-lab": "panorama",
  video: "panorama",
  contradiction: "panorama",
  contradiccion: "panorama",
};

async function boot() {
  createSpace($("#space"));

  const res = await fetch(`${import.meta.env.BASE_URL}data/dashboard.json`);
  if (!res.ok) throw new Error(`Could not load data (${res.status})`);
  const data = await res.json();
  $("#loading").remove();

  initScenario(data.flex);
  const controls = createControls(conditions);
  const shared = { controls, scenario, gravity };

  let router;
  const go = (id, sub) => router.go(id, sub);
  const views = {
    panorama: mountPanorama($("#view-panorama"), data, { go }),
    lab3d: mountFlame3D($("#view-lab3d"), data, shared),
    data: mountParts($("#view-data"), "data", [
      { id: "ledger", label: "Evidence Ledger (1,872)", mount: (el) => mountEvidenceLedger(el, data, { go }) },
      { id: "charts", label: "FLEX Charts", mount: (el) => mountExplorer(el, data, { open: (uid) => go("data", `runs/${uid}`) }) },
      { id: "runs", label: "Run by Run", mount: (el) => mountExperiments(el, data, { go, gravity }) },
    ], { label: "Evidence Explorer Subviews" }),
    optimizer: mountOptimizer($("#view-optimizer"), data, { go }),
    compare: mountCompare($("#view-compare"), data, { go }),
  };
  router = createRouter({ tabs: TABS, views, initial: "panorama", aliases: ALIASES });
  $(".brand").addEventListener("click", (e) => { e.preventDefault(); go("panorama"); });
}

boot().catch((err) => {
  console.error(err);
  const box = $("#loading");
  if (box) box.textContent = `Error starting up: ${err.message}. Did you run "npm run dev" inside the app folder?`;
});

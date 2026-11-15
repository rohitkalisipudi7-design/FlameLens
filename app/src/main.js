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
import { mountOverview } from "./views/overview.js";
import { mountExplorer } from "./views/explorer.js";
import { mountExperiments } from "./views/experiments.js";
import { mountSimulator } from "./views/simulator.js";
import { mountFlame3D } from "./views/flame3dView.js";
import { mountCompare } from "./views/compare.js";
import { mountEvidenceLedger } from "./views/evidenceLedgerView.js";
import { mountOptimizer } from "./views/optimizerView.js";
import { mountSafetyEnvelope } from "./views/safetyEnvelopeView.js";
import { mountVideoIntelligence } from "./views/videoIntelligenceView.js";
import { mountContradiction } from "./views/contradictionView.js";
import { mountEvidence } from "./views/evidence.js";
import { mountPipeline } from "./views/pipeline.js";
import { mountRag } from "./views/rag.js";
import { mountParts, mountStack } from "./views/parts.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lab3d", label: "3D Laboratory" },
  { id: "data", label: "Evidence Explorer" },
  { id: "optimizer", label: "Design Optimizer" },
  { id: "compare", label: "Comparison Studio" },
  { id: "simulator", label: "Simulator" },
  { id: "evidence", label: "Evidence Center" },
  { id: "envelope", label: "Safety Envelope" },
  { id: "video-lab", label: "Video Intelligence" },
  { id: "contradiction", label: "Contradiction Detector" },
  { id: "assistant", label: "Research AI" },
];

const ALIASES = {
  panorama: "overview",
  portada: "overview",
  inicio: "overview",
  datos: "data",
  simulador: "simulator",
  asistente: "assistant",
  explorador: "data/charts",
  experimentos: "data/runs",
  "data/graficas": "data/charts",
  "data/ensayos": "data/runs",
  "datos/graficas": "data/charts",
  "datos/ensayos": "data/runs",
  charts: "data/charts",
  runs: "data/runs",
  comparador: "compare",
  comparacion: "compare",
  "simulator/2d": "simulator",
  "simulator/3d": "lab3d",
  "simulador/2d": "simulator",
  "simulador/3d": "lab3d",
  llama3d: "lab3d",
  evidencia: "evidence",
  ledger: "evidence",
  rag: "assistant",
  ai: "assistant",
  optimizador: "optimizer",
  safety: "envelope",
  video: "video-lab",
  contradiccion: "contradiction",
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
    overview: mountOverview($("#view-overview") || $("#view-panorama"), data, { go }),
    data: mountParts($("#view-data"), "data", [
      { id: "charts", label: "FLEX Charts", mount: (el) => mountExplorer(el, data, { open: (uid) => go("data", `runs/${uid}`) }) },
      { id: "runs", label: "Run by Run", mount: (el) => mountExperiments(el, data, { go, gravity }) },
    ], { label: "Data View" }),
    compare: mountCompare($("#view-compare"), data, { go }),
    simulator: mountSimulator($("#view-simulator"), data, shared),
    lab3d: mountFlame3D($("#view-lab3d"), data, shared),
    assistant: mountStack($("#view-assistant"), [
      (el) => mountRag(el, data, shared),
      (el) => mountEvidence(el, data),
    ]),
    evidence: mountEvidenceLedger($("#view-evidence"), data, { go }),
    optimizer: mountOptimizer($("#view-optimizer"), data, { go }),
    envelope: mountSafetyEnvelope($("#view-envelope"), data, { go }),
    "video-lab": mountVideoIntelligence($("#view-video-lab"), data, { go }),
    contradiction: mountContradiction($("#view-contradiction"), data, { go }),
    pipeline: mountPipeline($("#view-pipeline")),
  };
  router = createRouter({ tabs: TABS, views, initial: "overview", aliases: ALIASES });
  $(".brand").addEventListener("click", (e) => { e.preventDefault(); go("overview"); });
}

boot().catch((err) => {
  console.error(err);
  const box = $("#loading");
  if (box) box.textContent = `Error starting up: ${err.message}. Did you run "npm run dev" inside the app folder?`;
});

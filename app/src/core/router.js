import { $, $$ } from "./dom.js";
import { hideTip } from "./tooltip.js";

/**
 * Lifecycle-aware navigation tabs: each view declares enter() and leave() hooks
 * to start or release intensive resources (animations, WebGL loops) exclusively while active.
 */
export function createRouter({ tabs, views, initial, aliases = {} }) {
  const nav = $("#tabs");
  const pill = $(".tab-pill", nav);
  let current = null;

  tabs.forEach(({ id, label }) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.id = `tab-${id}`;
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", `view-${id}`);
    b.dataset.tab = id;
    b.textContent = label;
    b.addEventListener("click", () => go(id));
    nav.appendChild(b);
  });

  function movePill() {
    const b = $(`#tab-${current}`);
    if (!b) return;
    pill.style.width = `${b.offsetWidth}px`;
    pill.style.transform = `translateX(${b.offsetLeft}px)`;
  }
  addEventListener("resize", movePill);
  document.fonts?.ready.then(movePill);

  function go(id, { scroll = true, sub = null } = {}) {
    if (!views[id]) return;
    if (id === current) return sub && views[id].route?.(sub);
    hideTip();
    if (current) views[current].leave?.();
    const prev = current;
    current = id;
    $$(".tab", nav).forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === id));
    $$(".view").forEach((v) => {
      const on = v.id === `view-${id}`;
      v.hidden = !on;
      v.classList.toggle("enter", on);
    });
    movePill();
    history.replaceState(null, "", `#${id}`);
    try { localStorage.setItem("fif-tab", id); } catch { /* storage disabled or unavailable */ }
    if (scroll && prev) scrollTo({ top: 0, behavior: "smooth" });
    views[id].enter?.(sub);
  }

  // Resolves alias paths (e.g. 'simulator/3d' -> tab 'simulator' with sub-route '3d')
  const resolve = (id, sub) => {
    if (!aliases[id]) return { id, sub };
    const [to, ...pre] = aliases[id].split("/");
    return { id: to, sub: [...pre, sub].filter(Boolean).join("/") || null };
  };

  // Parses '#data/runs/PSI-69%3A20CAL08' -> tab 'data' and sub-route 'runs/PSI-69:20CAL08'
  const parse = () => {
    const [id, ...rest] = location.hash.slice(1).split("/");
    return resolve(id, rest.length ? decodeURIComponent(rest.join("/")) : null);
  };

  addEventListener("hashchange", () => {
    const { id, sub } = parse();
    if (views[id]) go(id, { sub });
  });

  let start = { id: initial, sub: null };
  try { start = resolve(localStorage.getItem("fif-tab") || initial, null); } catch { /* sin almacenamiento */ }
  const hash = parse();
  if (views[hash.id]) start = hash;
  if (!views[start.id]) start = { id: initial, sub: null };
  go(start.id, { scroll: false, sub: start.sub });

  return { go: (id, sub) => go(id, { sub }) };
}

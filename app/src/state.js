import { createStore } from "./core/store.js";
import { simulate } from "./model/flame.js";

/** Environmental parameters selected by UI controls; shared across simulator and 3D views. */
export const conditions = createStore({ fuel: "Heptane", o2: 0.21, P: 1.0, co2: 0, he: 0, d0: 3.0 });

/** Shared gravity state: 0 microgravity (0g), 0.16 lunar, 0.38 martian, 1.0 terrestrial (1g). */
export const gravity = createStore({ g: 0 });

/** Active simulated scenario computed from current experimental conditions. */
export const scenario = createStore({ sim: null });

export function initScenario(flex) {
  const run = (q) => scenario.set({ sim: simulate(flex, q) });
  conditions.subscribe(run);
  gravity.subscribe(() => {
    const { sim } = scenario.get();
    if (sim) scenario.set({ sim: { ...sim, t0: performance.now() } });
  });
  run(conditions.get());
}

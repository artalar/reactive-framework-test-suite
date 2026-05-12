import { describe, expect, test } from "vitest";
import type { ReactiveFramework } from "./framework.js";

import { alienSignalsFramework } from "./frameworks/alienSignals.js";
import { preactSignalsFramework } from "./frameworks/preactSignals.js";
import { reactivelyFramework } from "./frameworks/reactively.js";
import { tansuFramework } from "./frameworks/tansu.js";
import { tc39SignalsFramework } from "./frameworks/tc39Signals.js";
import { vueReactivityFramework } from "./frameworks/vueReactivity.js";
import { mobxFramework } from "./frameworks/mobx.js";

const frameworks: ReactiveFramework[] = [
  alienSignalsFramework,
  preactSignalsFramework,
  reactivelyFramework,
  tansuFramework,
  tc39SignalsFramework,
  vueReactivityFramework,
  mobxFramework,
];

try {
  const { svelteFramework } = await import("./frameworks/svelte.js");
  frameworks.push(svelteFramework);
} catch {}

try {
  const { solidFramework } = await import("./frameworks/solid.js");
  frameworks.push(solidFramework);
} catch {}

try {
  const { xReactivityFramework } = await import("./frameworks/xReactivity.js");
  frameworks.push(xReactivityFramework);
} catch {}

try {
  const { sjsFramework } = await import("./frameworks/sjs.js");
  frameworks.push(sjsFramework);
} catch {}

try {
  const { potaFramework } = await import("./frameworks/pota.js");
  frameworks.push(potaFramework);
} catch {}

try {
  const { angularSignalsFramework } = await import("./frameworks/angularSignals.js");
  frameworks.push(angularSignalsFramework);
} catch {}

for (const fw of frameworks) {
  describe(fw.name, () => {
    test("consecutive inner resets", () => {
      fw.run(() => {
        const s = fw.signal(0);
        const c = fw.computed(() => s.read());
        let runs = 0;

        fw.effect(() => {
          runs++;
          if (c.read() > 0) {
            s.write(0);
          }
        });

        expect(runs).toBe(1);
        s.write(1);
        expect(s.read()).toBe(0);
        s.write(2);
        expect(s.read()).toBe(0);
        s.write(3);
        expect(s.read()).toBe(0);

        console.log(`[${fw.name}] effect runs: ${runs} (optimal: 4)`);
      });
    });
  });
}

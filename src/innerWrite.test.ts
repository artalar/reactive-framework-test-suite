import { describe, expect, test } from "vitest";
import { frameworks } from "./frameworks/index.js";

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

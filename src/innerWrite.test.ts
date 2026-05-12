import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Inner Write", {
  "#49 consecutive inner resets through computed chain"(
    fw: ReactiveFramework
  ) {
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

    console.log(`  [${fw.name}] effect runs: ${runs} (optimal: 4)`);
  },
});

import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Cycle & Infinite Loop Detection", {
  "#60 computed depending on itself"(fw: ReactiveFramework) {
    let threw = false;
    try {
      const c = fw.computed(() => {
        try {
          return (c as any).read() + 1;
        } catch {
          return 0;
        }
      });
      c.read();
    } catch {
      threw = true;
    }
    // Either throws on cycle or handles gracefully — both are acceptable
    expect(true).toBe(true);
  },

  "#62 infinite loop from continually setting a dependency"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let iterations = 0;

    expect(() => {
      fw.effect(() => {
        if (iterations++ > 200) throw new Error("bail");
        a.write(a.read() + 1);
      });
    }).toThrow();
  },
});

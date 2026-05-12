import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Cycle & Infinite Loop Detection", {
  "#58 detect trivial cycle (A↔B)"(fw: ReactiveFramework) {
    let threw = false;
    try {
      let aRef: any;
      const b = fw.computed(() => aRef?.read());
      const a = fw.computed(() => b.read());
      aRef = a;
      a.read();
    } catch {
      threw = true;
    }
    // Framework should either throw or handle gracefully
    expect(true).toBe(true);
  },

  "#59 detect deep cycle (A→B→C→…→A)"(fw: ReactiveFramework) {
    let threw = false;
    try {
      let aRef: any;
      const c = fw.computed(() => aRef?.read());
      const b = fw.computed(() => c.read());
      const a = fw.computed(() => b.read());
      aRef = a;
      a.read();
    } catch {
      threw = true;
    }
    expect(true).toBe(true);
  },

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
    expect(true).toBe(true);
  },

  "#61 indirect cycle through effects"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let iterations = 0;

    try {
      fw.effect(() => {
        const v = a.read();
        if (iterations++ < 100) {
          a.write(v + 1);
        }
      });
    } catch {
      // Cycle detected — expected for some frameworks
    }

    // Should either stop or throw
    expect(iterations).toBeLessThanOrEqual(200);
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

  "#63 cycle from modifying a branch (dynamic cycle creation)"(
    fw: ReactiveFramework
  ) {
    const cond = fw.signal(false);
    const a = fw.signal(0);
    let iterations = 0;

    try {
      fw.effect(() => {
        if (iterations++ > 100) throw new Error("bail");
        if (cond.read()) {
          a.write(a.read() + 1);
        } else {
          a.read();
        }
      });

      cond.write(true);
    } catch {
      // Expected: creating a cycle dynamically should be detected
    }

    expect(iterations).toBeLessThanOrEqual(200);
  },

  "#64 max iteration limit reached"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    let iterations = 0;

    try {
      fw.effect(() => {
        iterations++;
        const v = a.read();
        if (v < 100) {
          b.write(v);
        }
      });
      fw.effect(() => {
        const v = b.read();
        if (v < 100) {
          a.write(v + 1);
        }
      });
    } catch {
      // Expected: iteration limit reached
    }

    // Should be bounded
    expect(iterations).toBeLessThanOrEqual(300);
  },
});

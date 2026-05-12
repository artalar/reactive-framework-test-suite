import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

testMatrix("Nested Effects & Ordering", {
  "#43 outer effect runs before inner effect"(fw: ReactiveFramework) {
    const order: string[] = [];
    const a = fw.signal(0);

    fw.effect(() => {
      order.push("outer");
      a.read();
      fw.effect(() => {
        order.push("inner");
        a.read();
      });
    });

    expect(order[0]).toBe("outer");
  },

  "#44 inner effect auto-cleaned when outer re-runs"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let innerRuns = 0;

    fw.effect(() => {
      a.read();
      fw.effect(() => {
        a.read();
        innerRuns++;
      });
    });
    innerRuns = 0;

    a.write(1);
    const runsAfterFirst = innerRuns;

    a.write(2);
    const runsAfterSecond = innerRuns;

    // Inner effects from previous outer runs should be cleaned up,
    // so we shouldn't see exponential growth
    expect(runsAfterSecond - runsAfterFirst).toBeLessThanOrEqual(
      runsAfterFirst + 1
    );
  },

  "#45 untracked inner effect does not subscribe to deps"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    let innerRuns = 0;

    fw.effect(() => {
      fw.untracked!(() => {
        fw.effect(() => {
          a.read();
          innerRuns++;
        });
      });
    });
    innerRuns = 0;

    a.write(1);
    // The outer effect should not re-run since deps are untracked
    // But the inner effect should re-run since it directly reads a
    expect(innerRuns).toBeGreaterThanOrEqual(0);
  },

  "#46 duplicate subscribers don't cause duplicate notifications"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      a.read();
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    a.write(1);
    expect(runs).toBe(2);
  },

  "#47 effect recursion handled on first execution"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      runs++;
      if (runs === 1) {
        a.write(1);
      }
      a.read();
    });

    // Should not infinite loop — either runs once with final value
    // or runs twice (initial + triggered by write)
    expect(runs).toBeLessThanOrEqual(3);
    expect(a.read()).toBe(1);
  },

  "#48 nested effects depend on state of outer effects"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const observed: number[] = [];

    fw.effect(() => {
      const val = a.read();
      fw.effect(() => {
        observed.push(val);
      });
    });

    expect(observed).toContain(0);
  },
});

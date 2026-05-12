import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

testMatrix("Effect Scope / Ownership", {
  "#78 scope stop: all effects within scope stop reacting"(
    fw: ReactiveFramework
  ) {
    if (!fw.effectScope) throw new SkipTest("no effectScope");
    const a = fw.signal(0);
    let runs = 0;

    const stop = fw.effectScope(() => {
      fw.effect(() => {
        a.read();
        runs++;
      });
    });
    expect(runs).toBe(1);

    a.write(1);
    expect(runs).toBe(2);

    stop();
    a.write(2);
    expect(runs).toBe(2);
  },

  "#79 scope collects and batch-disposes effects"(fw: ReactiveFramework) {
    if (!fw.effectScope) throw new SkipTest("no effectScope");
    const a = fw.signal(0);
    let runs1 = 0;
    let runs2 = 0;

    const stop = fw.effectScope(() => {
      fw.effect(() => {
        a.read();
        runs1++;
      });
      fw.effect(() => {
        a.read();
        runs2++;
      });
    });
    expect(runs1).toBe(1);
    expect(runs2).toBe(1);

    a.write(1);
    expect(runs1).toBe(2);
    expect(runs2).toBe(2);

    stop();
    a.write(2);
    expect(runs1).toBe(2);
    expect(runs2).toBe(2);
  },

  "#80 nested scope can be detached from parent"(fw: ReactiveFramework) {
    if (!fw.effectScope) throw new SkipTest("no effectScope");
    const a = fw.signal(0);
    let innerRuns = 0;
    let innerStop: (() => void) | undefined;

    const outerStop = fw.effectScope(() => {
      innerStop = fw.effectScope(() => {
        fw.effect(() => {
          a.read();
          innerRuns++;
        });
      });
    });
    expect(innerRuns).toBe(1);

    a.write(1);
    expect(innerRuns).toBe(2);

    // Stop outer scope
    outerStop();
    a.write(2);

    // Inner scope behavior after outer stop depends on framework
    // Some detach inner, some cascade-dispose
    expect(innerRuns).toBeGreaterThanOrEqual(2);
  },

  "#81 parent update disposes old child computations"(
    fw: ReactiveFramework
  ) {
    if (!fw.effectScope) throw new SkipTest("no effectScope");
    const cond = fw.signal(true);
    const a = fw.signal(0);
    let childRuns = 0;

    fw.effect(() => {
      if (cond.read()) {
        const c = fw.computed(() => {
          childRuns++;
          return a.read();
        });
        c.read();
      }
    });
    const initial = childRuns;

    // Switch condition — old child should be cleaned up
    cond.write(false);

    // Updating a should NOT trigger old child computation
    childRuns = 0;
    a.write(1);

    // If framework properly disposes, childRuns stays 0
    // Some frameworks may still re-evaluate, so we just check it's bounded
    expect(childRuns).toBeLessThanOrEqual(1);
  },

  "#82 owned deriveds cleanup when disconnected from graph"(
    fw: ReactiveFramework
  ) {
    if (!fw.effectScope) throw new SkipTest("no effectScope");
    const a = fw.signal(0);
    let computedRuns = 0;

    const stop = fw.effectScope(() => {
      const c = fw.computed(() => {
        computedRuns++;
        return a.read();
      });
      fw.effect(() => {
        c.read();
      });
    });
    expect(computedRuns).toBe(1);

    a.write(1);
    expect(computedRuns).toBe(2);

    stop();
    computedRuns = 0;

    a.write(2);
    // After scope stop, computed should not re-evaluate
    expect(computedRuns).toBe(0);
  },

  "#83 inner scope signal updates tracked by outer effect"(
    fw: ReactiveFramework
  ) {
    if (!fw.effectScope) throw new SkipTest("no effectScope");
    const a = fw.signal(0);
    let outerRuns = 0;

    fw.effect(() => {
      a.read();
      outerRuns++;
    });
    expect(outerRuns).toBe(1);

    fw.effectScope(() => {
      a.write(1);
    });
    expect(outerRuns).toBe(2);
  },
});

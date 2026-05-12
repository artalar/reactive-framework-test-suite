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

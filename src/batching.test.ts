import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

testMatrix("Batching / Transaction", {
  "#65 writes delayed until batch completes"(fw: ReactiveFramework) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;
    fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      a.write(2);
      a.write(3);
    });
    // Effect should run only once for the batch, not 3 times
    expect(runs).toBe(2);
    expect(a.read()).toBe(3);
  },

  "#66 nested batches: outer completion triggers propagation"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;
    fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      fw.batch(() => {
        a.write(2);
      });
      // Inner batch complete but outer still open
      expect(runs).toBe(1);
      a.write(3);
    });
    expect(runs).toBe(2);
    expect(a.read()).toBe(3);
  },

  "#67 signals readable with updated value inside batch"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    fw.batch(() => {
      a.write(1);
      expect(a.read()).toBe(1);
      a.write(2);
      expect(a.read()).toBe(2);
    });
  },

  "#68 computed readable with updated sources inside batch"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);
    fw.batch(() => {
      a.write(5);
      expect(b.read()).toBe(10);
    });
  },

  "#69 pending effects run even if batch callback throws"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;
    fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    try {
      fw.batch(() => {
        a.write(1);
        throw new Error("batch error");
      });
    } catch {}

    // Effect should still have run with the updated value
    expect(runs).toBe(2);
    expect(a.read()).toBe(1);
  },

  "#70 effect first run is immediate even inside batch"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;

    fw.batch(() => {
      fw.effect(() => {
        a.read();
        runs++;
      });
      expect(runs).toBe(1);
    });
  },

  "#71 no duplicate listener notifications within batch"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const b = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      a.read();
      b.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      b.write(1);
    });
    // Should notify once, not twice
    expect(runs).toBe(2);
  },

  "#72 intermediate values skipped (only final value observed)"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const values: number[] = [];
    fw.effect(() => {
      values.push(a.read());
    });
    expect(values).toEqual([0]);

    fw.batch(() => {
      a.write(1);
      a.write(2);
      a.write(3);
    });
    expect(values).toEqual([0, 3]);
  },

  "#73 batch write returns to original: no notification"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;
    fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      a.write(0);
    });
    expect(runs).toBe(1);
  },

  "#74 multiple signals grouped in single update"(fw: ReactiveFramework) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const b = fw.signal(0);
    let runs = 0;
    fw.effect(() => {
      a.read();
      b.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      b.write(1);
    });
    expect(runs).toBe(2);
    expect(a.read()).toBe(1);
    expect(b.read()).toBe(1);
  },
});

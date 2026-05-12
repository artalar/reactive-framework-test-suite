import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Batching / Transaction";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
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
      fw.batch!(() => {
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

  "#119 batch: computed same result despite source change — no effect run"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const b = fw.signal(0);
    const c = fw.computed(() => a.read() + b.read());
    let runs = 0;
    fw.effect(() => {
      c.read();
      runs++;
    });
    expect(runs).toBe(1);
    expect(c.read()).toBe(0);

    fw.batch(() => {
      a.write(1);
      b.write(-1);
    });

    expect(c.read()).toBe(0);
    expect(runs).toBe(1);
  },

  "#120 cleanup writes inside effect are implicitly batched"(
    fw: ReactiveFramework
  ) {
    if (!fw.effectCleanup) throw new SkipTest("no effectCleanup");
    const a = fw.signal(0);
    const b = fw.signal(0);
    const log: string[] = [];

    fw.effect(() => {
      a.read();
      return () => {
        b.write(a.read());
      };
    });

    fw.effect(() => {
      log.push("b:" + b.read());
    });

    log.length = 0;
    a.write(1);

    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[log.length - 1]).toBe("b:1");
  },

  "#121 pending effects run even if some effects throw during batch"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let goodRuns = 0;

    fw.effect(() => {
      a.read();
      goodRuns++;
    });

    try {
      fw.effect(() => {
        if (a.read() > 0) throw new Error("bad effect");
      });
    } catch {}

    expect(goodRuns).toBe(1);

    try {
      fw.batch(() => {
        a.write(1);
      });
    } catch {}

    expect(goodRuns).toBeGreaterThanOrEqual(2);
  },

  "#122 post-batch writes work normally"(fw: ReactiveFramework) {
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
    });
    expect(runs).toBe(2);

    a.write(2);
    expect(runs).toBe(3);
    expect(a.read()).toBe(2);
  },

  "#123 repeated no-op batches don't re-trigger effects"(
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

    fw.batch(() => {
      a.write(2);
      a.write(0);
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(3);
      a.write(0);
    });
    expect(runs).toBe(1);
  },

  "#124 trigger+dispose+retrigger in batch = no run"(fw: ReactiveFramework) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;
    const dispose = fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      dispose();
      a.write(2);
    });
    expect(runs).toBe(1);
  },

  "#125 batch: source reverts → computed not notified"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const c = fw.computed(() => a.read() * 2);
    let runs = 0;
    fw.effect(() => {
      c.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(5);
      a.write(0);
    });
    expect(runs).toBe(1);
    expect(c.read()).toBe(0);
  },

  "#126 new effect inside batch after write sees updated value"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let seen = -1;

    fw.batch(() => {
      a.write(42);
      fw.effect(() => {
        seen = a.read();
      });
    });

    expect(seen).toBe(42);
  },

  "#127 unsubscribe inside batch: not called at end"(fw: ReactiveFramework) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let runs = 0;
    const dispose = fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(1);
      dispose();
    });
    expect(runs).toBe(1);
  },

  "#128 reading computed in batch forces upstream evaluation"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() + 1);
    const c = fw.computed(() => b.read() * 2);

    fw.batch(() => {
      a.write(5);
      expect(c.read()).toBe(12);
      expect(b.read()).toBe(6);
    });
  },

  "#129 reading one computed doesn't notify sibling effect early"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const c1 = fw.computed(() => a.read() + 1);
    const c2 = fw.computed(() => a.read() * 2);
    let c2Runs = 0;

    fw.effect(() => {
      c2.read();
      c2Runs++;
    });
    expect(c2Runs).toBe(1);

    fw.batch(() => {
      a.write(5);
      c1.read();
      expect(c2Runs).toBe(1);
    });
    expect(c2Runs).toBe(2);
  },

  "#130 effect inner writes are implicitly batched"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    const c = fw.signal(0);
    const log: string[] = [];

    fw.effect(() => {
      const v = a.read();
      b.write(v + 1);
      c.write(v + 2);
    });

    fw.effect(() => {
      log.push(b.read() + "," + c.read());
    });

    log.length = 0;
    a.write(10);

    expect(log[log.length - 1]).toBe("11,12");
  },

  "#131 derived-of-derived: source reverts in batch"(fw: ReactiveFramework) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    const b = fw.signal(10);
    const c1 = fw.computed(() => a.read() * 2);
    const c2 = fw.computed(() => c1.read() + b.read());
    let runs = 0;
    fw.effect(() => {
      c2.read();
      runs++;
    });
    expect(runs).toBe(1);

    fw.batch(() => {
      a.write(5);
      a.write(0);
      b.write(20);
    });

    expect(c2.read()).toBe(20);
    expect(runs).toBe(2);
  },

  "#132 batch: computed not recomputed if dep reverts"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const a = fw.signal(0);
    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read() * 2;
    });

    fw.effect(() => {
      c.read();
    });
    cCalls = 0;

    fw.batch(() => {
      a.write(5);
      a.write(0);
    });

    c.read();
    expect(cCalls).toBe(0);
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
};

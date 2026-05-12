import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Error Handling";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
  "#84 graph stays consistent after error in initial computed"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(0);
    const b = fw.computed(() => {
      if (a.read() === 0) throw new Error("initial error");
      return a.read();
    });

    expect(() => b.read()).toThrow("initial error");

    a.write(1);
    expect(b.read()).toBe(1);
  },

  "#85 graph stays consistent after error in computed re-evaluation"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(1);
    const b = fw.computed(() => {
      if (a.read() === 2) throw new Error("re-eval error");
      return a.read();
    });

    expect(b.read()).toBe(1);

    a.write(2);
    expect(() => b.read()).toThrow("re-eval error");

    a.write(3);
    expect(b.read()).toBe(3);
  },

  "#87 errors in one computed don't leak to unrelated dependents"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(0);
    const b = fw.signal(10);

    const bad = fw.computed(() => {
      if (a.read() > 0) throw new Error("bad");
      return a.read();
    });

    const good = fw.computed(() => b.read() * 2);

    expect(good.read()).toBe(20);
    a.write(1);

    expect(() => bad.read()).toThrow("bad");
    expect(good.read()).toBe(20);

    b.write(20);
    expect(good.read()).toBe(40);
  },

  "#89 effect cleanup reset when effect throws"(fw: ReactiveFramework) {
    if (!fw.effectCleanup) throw new SkipTest("no effectCleanup");
    const a = fw.signal(0);
    let cleanupCalled = false;

    try {
      fw.effect(() => {
        a.read();
        if (a.read() === 1) {
          throw new Error("effect error");
        }
        return () => {
          cleanupCalled = true;
        };
      });
    } catch {}

    try {
      a.write(1);
    } catch {}

    // Cleanup from previous successful run should have been called
    expect(cleanupCalled).toBe(true);
  },

  "#90 effect disposed when cleanup throws"(fw: ReactiveFramework) {
    if (!fw.effectCleanup) throw new SkipTest("no effectCleanup");
    const a = fw.signal(0);
    let effectRuns = 0;

    try {
      fw.effect(() => {
        effectRuns++;
        a.read();
        return () => {
          throw new Error("cleanup error");
        };
      });
    } catch {}

    try {
      a.write(1);
    } catch {}

    const runsAfterError = effectRuns;

    try {
      a.write(2);
    } catch {}

    // Effect should be bounded — not infinite loop due to cleanup error
    expect(effectRuns).toBeLessThanOrEqual(runsAfterError + 1);
  },

  "#91 exception halts propagation but other branches remain intact"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(0);
    const b = fw.signal(10);

    const bad = fw.computed(() => {
      if (a.read() > 0) throw new Error("branch error");
      return a.read();
    });

    let goodCalls = 0;
    const good = fw.computed(() => {
      goodCalls++;
      return b.read() * 2;
    });

    expect(good.read()).toBe(20);

    a.write(1);
    try {
      bad.read();
    } catch {}

    // Good branch should still work
    goodCalls = 0;
    b.write(20);
    expect(good.read()).toBe(40);
    expect(goodCalls).toBe(1);
  },

  "#92 no stale scheduled updates left after exception"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(0);
    const b = fw.computed(() => {
      if (a.read() === 1) throw new Error("stale error");
      return a.read() * 2;
    });

    expect(b.read()).toBe(0);

    a.write(1);
    expect(() => b.read()).toThrow("stale error");

    // After recovery, no stale state should remain
    a.write(2);
    expect(b.read()).toBe(4);

    a.write(3);
    expect(b.read()).toBe(6);
  },

  "#154 batch throw: effects survive, graph consistent"(
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
        throw new Error("batch boom");
      });
    } catch {}

    expect(runs).toBeGreaterThanOrEqual(2);

    a.write(2);
    expect(runs).toBeGreaterThanOrEqual(3);
    expect(a.read()).toBe(2);
  },

  "#155 errors cached when watched by effect (live caching)"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(0);
    let computeCalls = 0;
    const c = fw.computed(() => {
      computeCalls++;
      if (a.read() === 0) throw new Error("live error");
      return a.read();
    });

    let effectError: any = null;
    try {
      fw.effect(() => {
        try {
          c.read();
        } catch (e) {
          effectError = e;
        }
      });
    } catch {}

    const callsAfter = computeCalls;

    try {
      c.read();
    } catch {}

    expect(computeCalls).toBeLessThanOrEqual(callsAfter + 1);

    a.write(1);
    expect(c.read()).toBe(1);
  },

  "#177 skipped effects from failed flush not re-triggered by unrelated signal"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    const c = fw.signal(0);
    const d = fw.computed(() => c.read());

    fw.effect(() => {
      a.read();
    });

    try {
      fw.effect(() => {
        if (a.read() === 2) throw new Error("effect2 error");
      });
    } catch {}

    let effect3Runs = 0;
    fw.effect(() => {
      a.read();
      d.read();
      effect3Runs++;
    });
    effect3Runs = 0;

    try {
      a.write(2);
    } catch {}
    effect3Runs = 0;

    b.write(1);
    expect(effect3Runs).toBe(0);
  },

  "#211 computed error chain: downstream computed also throws"(
    fw: ReactiveFramework
  ) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(0);
    const b = fw.computed(() => {
      if (a.read() === 1) throw new Error("source error");
      return a.read();
    });
    const c = fw.computed(() => b.read() * 2);

    expect(c.read()).toBe(0);

    a.write(1);
    expect(() => c.read()).toThrow();

    // Recovery: both b and c return to normal
    a.write(2);
    expect(b.read()).toBe(2);
    expect(c.read()).toBe(4);
  },

  "#93 exception recovery in computed"(fw: ReactiveFramework) {
    if (!fw.computedThrows) throw new SkipTest("no computedThrows");
    const a = fw.signal(true);
    const b = fw.computed(() => {
      if (a.read()) throw new Error("fail");
      return "ok";
    });

    expect(() => b.read()).toThrow("fail");

    a.write(false);
    expect(b.read()).toBe("ok");

    a.write(true);
    expect(() => b.read()).toThrow("fail");
  },
};

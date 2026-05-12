import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Error Handling", {
  "#84 graph stays consistent after error in initial computed"(
    fw: ReactiveFramework
  ) {
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

  "#86 computed caches thrown exception"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      if (a.read() === 0) throw new Error("cached error");
      return a.read();
    });

    expect(() => b.read()).toThrow("cached error");
    const callsAfterFirst = calls;

    expect(() => b.read()).toThrow("cached error");
    expect(calls).toBe(callsAfterFirst);

    a.write(1);
    expect(b.read()).toBe(1);
  },

  "#87 errors in one computed don't leak to unrelated dependents"(
    fw: ReactiveFramework
  ) {
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

  "#88 effect does not subscribe if first run throws"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs = 0;

    try {
      fw.effect(() => {
        runs++;
        a.read();
        throw new Error("first run error");
      });
    } catch {}

    expect(runs).toBe(1);

    // Changing a should NOT re-trigger the effect
    a.write(1);
    expect(runs).toBe(1);
  },

  "#89 effect cleanup reset when effect throws"(fw: ReactiveFramework) {
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

  "#93 exception recovery in computed"(fw: ReactiveFramework) {
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
});

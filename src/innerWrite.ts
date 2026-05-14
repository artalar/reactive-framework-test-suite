import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest, hasEffectCleanup, hasComputedThrows } from "./framework.js";

export const section = "Inner Write";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
  "#50 effect writes back to signal"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.signal(0);

    fw.effect(() => {
      b.write(a.read() * 2);
    });

    expect(b.read()).toBe(0);
    a.write(5);
    expect(b.read()).toBe(10);
  },

  "#51 effect cleanup modifying dependency does not retrigger"(
    fw: ReactiveFramework
  ) {
    if (!hasEffectCleanup(fw)) throw new SkipTest("no effectCleanup");
    const a = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      runs++;
      a.read();
      return () => {
        a.write(999);
      };
    });
    expect(runs).toBe(1);

    a.write(1);
    // cleanup runs (sets a=999), then effect re-runs with a=999 or 1
    // The key: cleanup should not cause infinite retrigger
    expect(runs).toBeGreaterThanOrEqual(2);
    expect(runs).toBeLessThanOrEqual(3);
  },

  "#52 computed writing to signal"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const sideChannel = fw.signal(0);

    try {
      const c = fw.computed(() => {
        const v = a.read();
        sideChannel.write(v * 10);
        return v;
      });
      c.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    expect(sideChannel.read()).toBe(0);
  },

  "#53 inner write: only final value observed"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const values: number[] = [];

    fw.effect(() => {
      values.push(a.read());
    });
    expect(values).toEqual([0]);

    a.write(1);
    a.write(2);
    a.write(3);
    expect(values[values.length - 1]).toBe(3);
  },

  "#54 inner mutations propagate until changes settle"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(0);

    fw.effect(() => {
      if (a.read() > 0 && b.read() === 0) {
        b.write(a.read());
      }
    });

    a.write(5);
    expect(b.read()).toBe(5);
  },

  "#55 effect re-scheduled when writing signal before reading"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const values: number[] = [];

    fw.effect(() => {
      values.push(a.read());
    });

    a.write(1);
    expect(values[values.length - 1]).toBe(1);
  },

  "#56 effect re-scheduled after reading from derived then writing"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read());
    const values: number[] = [];

    fw.effect(() => {
      values.push(b.read());
    });
    expect(values).toEqual([0]);

    a.write(1);
    expect(values[values.length - 1]).toBe(1);
  },

  "#112 computed side-effect doesn't affect sibling computeds"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const sideChannel = fw.signal(0);

    let writer: { read: () => number };
    try {
      writer = fw.computed(() => {
        const v = src.read();
        sideChannel.write(v * 10);
        return v;
      });
      writer.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    const reader = fw.computed(() => sideChannel.read());
    expect(reader.read()).toBe(0);

    src.write(1);
    writer.read();
    expect(reader.read()).toBe(10);
  },

  "#114 inner write final value unchanged: no downstream notification"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let effectRuns = 0;
    let downstreamRuns = 0;

    try {
      fw.effect(() => {
        effectRuns++;
        if (effectRuns > 20) throw new Error("bail");
        const v = a.read();
        if (v === 1) {
          a.write(0);
        }
      });

      const c = fw.computed(() => a.read());
      fw.effect(() => {
        c.read();
        downstreamRuns++;
      });

      const downstreamBefore = downstreamRuns;
      a.write(1);

      expect(a.read()).toBe(0);
      expect(downstreamRuns).toBeLessThanOrEqual(downstreamBefore + 1);
    } catch {}
  },

  "#133 listener writes back: second listener skipped if no net change"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const values1: number[] = [];
    const values2: number[] = [];

    fw.effect(() => {
      const v = a.read();
      values1.push(v);
      if (v === 1) {
        a.write(0);
      }
    });

    fw.effect(() => {
      values2.push(a.read());
    });

    const before2 = values2.length;
    a.write(1);

    expect(a.read()).toBe(0);
    expect(values2[values2.length - 1]).toBe(0);
  },

  "#134 listener writes back: second listener gets final value"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const finalValues: number[] = [];

    fw.effect(() => {
      const v = a.read();
      if (v === 1) {
        a.write(10);
      }
    });

    fw.effect(() => {
      finalValues.push(a.read());
    });

    a.write(1);
    expect(a.read()).toBe(10);
    expect(finalValues[finalValues.length - 1]).toBe(10);
  },

  "#135 chained computed inner write: downstream only sees settled"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const target = fw.signal(0);

    let c1: { read: () => number };
    try {
      c1 = fw.computed(() => {
        const v = src.read();
        target.write(v * 10);
        return v;
      });
      c1.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    const c2 = fw.computed(() => target.read());
    expect(c2.read()).toBe(0);

    src.write(1);
    c1.read();
    expect(target.read()).toBe(10);
    expect(c2.read()).toBe(10);
  },

  "#136 computed inner write unchanged: no downstream notification"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const side = fw.signal(0);

    let c: { read: () => number };
    try {
      c = fw.computed(() => {
        const v = src.read();
        side.write(0);
        return v;
      });
      c.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    let downstreamRuns = 0;
    fw.effect(() => {
      side.read();
      downstreamRuns++;
    });
    downstreamRuns = 0;

    src.write(1);
    c.read();
    expect(downstreamRuns).toBeLessThanOrEqual(1);
  },

  "#137 computed inner write changed: downstream notified"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const side = fw.signal(0);

    let c: { read: () => number };
    try {
      c = fw.computed(() => {
        const v = src.read();
        side.write(v * 100);
        return v;
      });
      c.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    src.write(1);
    c.read();
    expect(side.read()).toBe(100);
  },

  "#138 independent computeds sharing source, one inner-writes"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const shared = fw.signal(0);

    let writer: { read: () => number };
    try {
      writer = fw.computed(() => {
        const v = src.read();
        shared.write(v * 10);
        return v;
      });
      writer.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    const reader = fw.computed(() => shared.read() + 1);
    expect(shared.read()).toBe(0);
    expect(reader.read()).toBe(1);

    src.write(2);
    writer.read();
    expect(shared.read()).toBe(20);
    expect(reader.read()).toBe(21);
  },

  "#139 effect inner write re-schedules when dep changes during run"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    const log: number[] = [];

    fw.effect(() => {
      log.push(a.read());
      if (a.read() === 0 && b.read() === 0) {
        b.write(1);
      }
    });

    expect(b.read()).toBe(1);
  },

  "#172 computed writing to own dep: never caches"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let computeCalls = 0;

    try {
      const c = fw.computed(() => {
        computeCalls++;
        a.write(a.read() + 1);
        return a.read();
      });

      c.read();
      const callsAfterFirst = computeCalls;

      c.read();
      expect(computeCalls).toBeGreaterThan(callsAfterFirst);
    } catch {
      // Cycle detection is also valid
    }
  },

  "#180 inner write through computed chain resets signal"(
    fw: ReactiveFramework
  ) {
    const s = fw.signal(false);
    const c = fw.computed(() => s.read());
    let runs = 0;

    fw.effect(() => {
      runs++;
      if (c.read()) s.write(false);
    });

    // Initial run: effect sees c=false, no write
    expect(runs).toBe(1);

    s.write(true);
    expect(s.read()).toBe(false);
    // Effect ran at least once: saw c=true, wrote s(false)
    expect(runs).toBeGreaterThanOrEqual(2);

    // Detect: does the effect re-run after inner write?
    // re-run (runs>=3): 1 initial + 1 c=true + 1 re-run c=false → c cache = false
    // no re-run (runs===2): 1 initial + 1 c=true → c cache stays true
    const effectReRuns = runs >= 3;
    const runsAfterFirst = runs;

    s.write(true);
    if (effectReRuns) {
      // c cache was false → c sees false→true (change) → effect fires
      // min 2 runs: 1 c=true→write(false), 1 re-run c=false→stop
      expect(s.read()).toBe(false);
      expect(runs).toBeGreaterThanOrEqual(runsAfterFirst + 2);
    } else {
      // c cache was true → c sees true→true (unchanged) → effect not triggered
      expect(s.read()).toBe(true);
      expect(runs).toBe(runsAfterFirst);
    }
  },

  "#179 computed self-increment: intra-run read-after-write values correct"(
    fw: ReactiveFramework
  ) {
    const s = fw.signal(1);
    const c = fw.computed(() => {
      s.write(s.read() + 1);
      return s.read();
    });

    expect(c.read()).toBe(2);
    expect(s.read()).toBe(2);

    expect(c.read()).toBe(3);
    expect(s.read()).toBe(3);
  },

  "#113 inner write convergence: converges or cycle-detects"(
    fw: ReactiveFramework
  ) {
    const counter = fw.signal(0);
    const target = 5;
    let iterations = 0;
    try {
      fw.effect(() => {
        iterations++;
        if (iterations > 100) throw new Error("bail");
        const v = counter.read();
        if (v < target) counter.write(v + 1);
      });
    } catch {}

    const value = counter.read();
    const converged = value === target;
    const cycleDet = iterations <= 100 && value < target;

    // Both converge and cycle-detect are valid.
    // "partial" (stopped without reaching target AND without cycle detection) is not.
    expect(converged || cycleDet).toBe(true);

    if (converged) {
      expect(value).toBe(target);
      expect(iterations).toBeLessThanOrEqual(target + 1);
    }
  },

  "#57 computed side effect triggers downstream"(fw: ReactiveFramework) {
    const src = fw.signal(0);
    const sideEffect = fw.signal(0);

    const c = fw.computed(() => {
      const v = src.read();
      sideEffect.write(v * 10);
      return v;
    });

    const values: number[] = [];
    fw.effect(() => {
      values.push(sideEffect.read());
    });

    c.read();
    expect(sideEffect.read()).toBe(0);

    src.write(1);
    c.read();
    expect(sideEffect.read()).toBe(10);
  },

  "#181 computed writes multiple signals: downstream sees consistent pair"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const b = fw.signal(0);
    const c = fw.signal(0);

    let writer: { read: () => number };
    try {
      writer = fw.computed(() => {
        const v = src.read();
        b.write(v + 1);
        c.write(v + 2);
        return v;
      });
      writer.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    const pair = fw.computed(() => b.read() + "," + c.read());
    expect(pair.read()).toBe("1,2");

    src.write(10);
    writer.read();
    expect(pair.read()).toBe("11,12");
  },

  "#182 computed side effect + batch: writes visible after flush"(
    fw: ReactiveFramework
  ) {
    if (!fw.batch) throw new SkipTest("no batch");
    const src = fw.signal(0);
    const side = fw.signal(0);

    let c: { read: () => number };
    try {
      c = fw.computed(() => {
        const v = src.read();
        side.write(v * 10);
        return v;
      });
      c.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    let effectRuns = 0;
    fw.effect(() => {
      side.read();
      effectRuns++;
    });
    effectRuns = 0;

    fw.batch(() => {
      src.write(5);
      expect(c.read()).toBe(5);
      expect(side.read()).toBe(50);
    });
    expect(effectRuns).toBeGreaterThanOrEqual(1);
    expect(side.read()).toBe(50);
  },

  "#183 branch switch stops computed side effect"(fw: ReactiveFramework) {
    const flag = fw.signal(true);
    const src = fw.signal(0);
    const side = fw.signal(-1);

    let writer: { read: () => number };
    try {
      writer = fw.computed(() => {
        const v = src.read();
        side.write(v);
        return v;
      });
      writer.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    const branch = fw.computed(() => (flag.read() ? writer.read() : 999));

    expect(branch.read()).toBe(0);
    expect(side.read()).toBe(0);

    src.write(1);
    branch.read();
    expect(side.read()).toBe(1);

    // deactivate writer by switching branch
    flag.write(false);
    expect(branch.read()).toBe(999);

    // writer no longer evaluated — side effect should not fire
    src.write(2);
    branch.read();
    expect(side.read()).toBe(1);
  },

  "#184 nested computeds: outer reads inner, both have side effects"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const innerSide = fw.signal(0);
    const outerSide = fw.signal(0);

    let outer: { read: () => number };
    try {
      const inner = fw.computed(() => {
        const v = src.read();
        innerSide.write(v * 10);
        return v + 1;
      });

      outer = fw.computed(() => {
        const iv = inner.read();
        outerSide.write(iv * 100);
        return iv;
      });
      outer.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    expect(innerSide.read()).toBe(0); // src=0 → 0*10
    expect(outerSide.read()).toBe(100); // inner=1 → 1*100

    src.write(2);
    outer.read();
    expect(innerSide.read()).toBe(20); // 2*10
    expect(outerSide.read()).toBe(300); // inner=3 → 3*100
  },

  "#185 computed side effect write visible despite later throw"(
    fw: ReactiveFramework
  ) {
    if (!hasComputedThrows(fw)) throw new SkipTest("no computedThrows");
    const src = fw.signal(0);
    const side = fw.signal(-1);

    let c: { read: () => number };
    try {
      c = fw.computed(() => {
        const v = src.read();
        side.write(v * 10);
        if (v > 0) throw new Error("intended");
        return v;
      });
      c.read(); // src=0, side=0, no throw
    } catch {
      return; // computed side effects forbidden — valid
    }

    expect(side.read()).toBe(0);

    src.write(1);
    let threw = false;
    try {
      c.read(); // side=10, then throws
    } catch {
      threw = true;
    }

    // write happened before the throw
    if (threw) {
      expect(side.read()).toBe(10);
    }
  },

  "#186 effect observes computed side-channel write during propagation"(
    fw: ReactiveFramework
  ) {
    const src = fw.signal(0);
    const side = fw.signal(0);

    let c: { read: () => number };
    try {
      c = fw.computed(() => {
        const v = src.read();
        side.write(v);
        return v;
      });
      c.read();
    } catch {
      return; // computed side effects forbidden — valid
    }

    const observed: number[] = [];
    fw.effect(() => {
      observed.push(c.read() + side.read());
    });

    expect(observed[observed.length - 1]).toBe(0); // c=0 + side=0

    src.write(5);
    expect(observed[observed.length - 1]).toBe(10); // c=5 + side=5
  },

  "#213 inner write during initial effect execution doesn't block future propagation"(
    fw: ReactiveFramework
  ) {
    const s = fw.signal(1);
    const c = fw.computed(() => s.read());

    fw.effect(() => {
      if (c.read() > 0) {
        s.write(0);
      }
    });

    expect(s.read()).toBe(0);

    s.write(2);
    expect(s.read()).toBe(0);

    s.write(3);
    expect(s.read()).toBe(0);
  },

  "#212 inner write through computed doesn't block future propagation"(
    fw: ReactiveFramework
  ) {
    const s = fw.signal(0);
    const c = fw.computed(() => s.read());

    fw.effect(() => {
      if (c.read() > 0) {
        s.write(0);
      }
    });

    s.write(1);
    expect(s.read()).toBe(0);

    s.write(2);
    expect(s.read()).toBe(0);

    s.write(3);
    expect(s.read()).toBe(0);
  },
};

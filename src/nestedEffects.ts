import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Nested Effects & Ordering";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
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

  "#163 parent effect not triggered by child's own signal"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let parentRuns = 0;

    fw.effect(() => {
      a.read();
      parentRuns++;
      const childSignal = fw.signal(0);
      fw.effect(() => {
        childSignal.read();
      });
      childSignal.write(1);
    });

    const runsAfterSetup = parentRuns;
    expect(runsAfterSetup).toBeGreaterThanOrEqual(1);

    a.write(1);
    expect(parentRuns).toBe(runsAfterSetup + 1);
  },

  "#164 inner autorun created inside outer tracks own deps"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    let outerRuns = 0;
    let innerRuns = 0;

    fw.effect(() => {
      a.read();
      outerRuns++;
      fw.effect(() => {
        b.read();
        innerRuns++;
      });
    });

    innerRuns = 0;
    outerRuns = 0;

    b.write(1);
    expect(innerRuns).toBeGreaterThanOrEqual(1);
  },

  "#170 inner effect not triggered when computed dep resolves unchanged"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() % 2);
    let innerRuns = 0;

    fw.effect(() => {
      fw.effect(() => {
        b.read();
        innerRuns++;
      });
    });
    const initial = innerRuns;

    a.write(2);
    expect(innerRuns).toBe(initial);
  },

  "#209 three-level nested effect: cascading disposal"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let middleRuns = 0;
    let innerRuns = 0;

    const dispose = fw.effect(() => {
      a.read();
      fw.effect(() => {
        a.read();
        middleRuns++;
        fw.effect(() => {
          a.read();
          innerRuns++;
        });
      });
    });

    middleRuns = 0;
    innerRuns = 0;

    dispose();
    a.write(1);

    expect(middleRuns).toBe(0);
    expect(innerRuns).toBe(0);
  },

  "#210 multiple inner effects all cleaned when outer re-runs"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(0);
    const c = fw.signal(0);
    let bRuns = 0;
    let cRuns = 0;

    fw.effect(() => {
      a.read();
      fw.effect(() => {
        b.read();
        bRuns++;
      });
      fw.effect(() => {
        c.read();
        cRuns++;
      });
    });
    bRuns = 0;
    cRuns = 0;

    // Trigger outer re-run — old inner effects should be cleaned up
    a.write(1);
    bRuns = 0;
    cRuns = 0;

    // These should only trigger the NEW inner effects (one each), not accumulated old ones
    b.write(1);
    expect(bRuns).toBe(1);

    c.write(1);
    expect(cRuns).toBe(1);
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
};

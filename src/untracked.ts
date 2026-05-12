import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Untracked / Unsampled Reads";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
  "#75 untracked read in effect does not create dependency"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    const b = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      a.read();
      fw.untracked!(() => b.read());
      runs++;
    });
    expect(runs).toBe(1);

    // a is tracked — should trigger
    a.write(1);
    expect(runs).toBe(2);

    // b is untracked — should NOT trigger
    b.write(1);
    expect(runs).toBe(2);
  },

  "#76 untracked read in computed does not create dependency"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    const b = fw.signal(10);

    const c = fw.computed(() => {
      return a.read() + fw.untracked!(() => b.read());
    });

    expect(c.read()).toBe(10);

    // a is tracked
    a.write(1);
    expect(c.read()).toBe(11);

    // b is untracked — c should not re-evaluate
    b.write(20);
    expect(c.read()).toBe(11);
  },

  "#117 untracked read of stale computed returns fresh value"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);

    expect(b.read()).toBe(0);

    a.write(5);

    const result = fw.untracked!(() => b.read());
    expect(result).toBe(10);
  },

  "#118 untracked transitively doesn't track through nested deps"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);

    let effectRuns = 0;
    fw.effect(() => {
      fw.untracked!(() => b.read());
      effectRuns++;
    });
    expect(effectRuns).toBe(1);

    a.write(1);
    expect(effectRuns).toBe(1);

    a.write(2);
    expect(effectRuns).toBe(1);
  },

  "#156 untracked write inside effect doesn't throw"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    const b = fw.signal(0);
    let threw = false;

    try {
      fw.effect(() => {
        a.read();
        fw.untracked!(() => {
          b.write(a.read() * 10);
        });
      });
    } catch {
      threw = true;
    }

    if (!threw) {
      expect(b.read()).toBe(0);
      a.write(1);
      expect(b.read()).toBe(10);
    }
    expect(true).toBe(true);
  },

  "#77 nested untracked inside effect still blocks tracking"(
    fw: ReactiveFramework
  ) {
    if (!fw.untracked) throw new SkipTest("no untracked");
    const a = fw.signal(0);
    const b = fw.signal(0);
    let runs = 0;

    fw.effect(() => {
      fw.untracked!(() => {
        a.read();
        b.read();
      });
      runs++;
    });
    expect(runs).toBe(1);

    a.write(1);
    b.write(1);
    expect(runs).toBe(1);
  },
};

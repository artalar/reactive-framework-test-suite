import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

testMatrix("Untracked / Unsampled Reads", {
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
});

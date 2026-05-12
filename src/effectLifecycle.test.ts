import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

testMatrix("Effect Lifecycle", {
  "#35 effect runs callback immediately on creation"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs = 0;
    fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);
  },

  "#36 effect re-runs when dependency changes"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const values: string[] = [];
    fw.effect(() => {
      values.push(a.read());
    });
    expect(values).toEqual(["a"]);

    a.write("b");
    expect(values).toEqual(["a", "b"]);

    a.write("c");
    expect(values).toEqual(["a", "b", "c"]);
  },

  "#37 effect disposal stops re-runs"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs = 0;
    const dispose = fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    dispose();
    a.write(1);
    expect(runs).toBe(1);
  },

  "#38 effect cleanup fn called before each re-run"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const log: string[] = [];
    fw.effect(() => {
      const v = a.read();
      log.push("run:" + v);
      return () => {
        log.push("cleanup:" + v);
      };
    });
    expect(log).toEqual(["run:0"]);

    a.write(1);
    expect(log).toEqual(["run:0", "cleanup:0", "run:1"]);

    a.write(2);
    expect(log).toEqual(["run:0", "cleanup:0", "run:1", "cleanup:1", "run:2"]);
  },

  "#39 effect cleanup fn called on disposal"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let cleanupCalled = false;
    const dispose = fw.effect(() => {
      a.read();
      return () => {
        cleanupCalled = true;
      };
    });
    expect(cleanupCalled).toBe(false);

    dispose();
    expect(cleanupCalled).toBe(true);
  },

  "#40 effect cleanup runs outside reactive evaluation context"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(100);
    let effectRuns = 0;

    fw.effect(() => {
      a.read();
      effectRuns++;
      return () => {
        // Reading b in cleanup should NOT create a dependency
        b.read();
      };
    });
    expect(effectRuns).toBe(1);

    a.write(1);
    expect(effectRuns).toBe(2);

    // b is only read in cleanup — should not trigger re-run
    b.write(200);
    expect(effectRuns).toBe(2);
  },

  "#42 effect not executed if disposed during pending batch"(
    fw: ReactiveFramework
  ) {
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

  "#41 disposed effect never re-notified"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let runs = 0;
    const dispose = fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    dispose();

    a.write(1);
    a.write(2);
    a.write(3);
    expect(runs).toBe(1);
  },
});

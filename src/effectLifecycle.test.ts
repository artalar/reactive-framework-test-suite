import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

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

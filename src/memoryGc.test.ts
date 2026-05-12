import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Memory & GC", {
  "#98 subscriptions cleared when all subscribers removed"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let runs = 0;

    const dispose = fw.effect(() => {
      a.read();
      runs++;
    });
    expect(runs).toBe(1);

    a.write(1);
    expect(runs).toBe(2);

    dispose();

    a.write(2);
    a.write(3);
    expect(runs).toBe(2);
  },

  "#101 disposed effect graph links fully cleaned up"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);
    let runs = 0;

    const dispose = fw.effect(() => {
      b.read();
      runs++;
    });
    expect(runs).toBe(1);

    dispose();

    a.write(1);
    a.write(2);
    expect(runs).toBe(1);

    // Verify the computed still works independently
    expect(b.read()).toBe(4);
  },
});

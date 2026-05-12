import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Inner Write", {
  "#49 consecutive inner resets through computed chain"(
    fw: ReactiveFramework
  ) {
    const s = fw.signal(0);
    const c = fw.computed(() => s.read());
    let runs = 0;

    fw.effect(() => {
      runs++;
      if (c.read() > 0) {
        s.write(0);
      }
    });

    expect(runs).toBe(1);
    s.write(1);
    expect(s.read()).toBe(0);
    s.write(2);
    expect(s.read()).toBe(0);
    s.write(3);
    expect(s.read()).toBe(0);
  },

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
});

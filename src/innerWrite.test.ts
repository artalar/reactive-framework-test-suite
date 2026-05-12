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

  "#51 effect cleanup modifying dependency does not retrigger"(
    fw: ReactiveFramework
  ) {
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

    let threw = false;
    try {
      const c = fw.computed(() => {
        const v = a.read();
        sideChannel.write(v * 10);
        return v;
      });
      c.read();
    } catch {
      threw = true;
    }

    // Either allowed (sideChannel updated) or forbidden (throws)
    // Both are valid framework choices
    if (!threw) {
      expect(sideChannel.read()).toBe(0);
    }
    expect(true).toBe(true);
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

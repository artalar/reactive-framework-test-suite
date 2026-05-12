import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Computed Evaluation", {
  "#17 lazy — not evaluated until first read"(fw: ReactiveFramework) {
    const a = fw.signal(0);

    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      return a.read();
    });

    expect(calls).toBe(0);
    expect(b.read()).toBe(0);
    expect(calls).toBe(1);
  },

  "#18 cached — not re-evaluated if deps unchanged"(fw: ReactiveFramework) {
    const a = fw.signal(0);

    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      return a.read();
    });

    expect(b.read()).toBe(0);
    expect(calls).toBe(1);

    // Read again without changing dep
    expect(b.read()).toBe(0);
    expect(calls).toBe(1);
  },

  "#19 returns updated value after dep change"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);

    expect(b.read()).toBe(0);
    a.write(1);
    expect(b.read()).toBe(2);
    a.write(5);
    expect(b.read()).toBe(10);
  },

  "#20 chained computed"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() + 1);
    const c = fw.computed(() => b.read() + 1);
    const d = fw.computed(() => c.read() + 1);

    expect(d.read()).toBe(3);
    a.write(10);
    expect(d.read()).toBe(13);
  },

  "#22 chained computed avoids redundant re-compute"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let bCalls = 0;
    const b = fw.computed(() => {
      bCalls++;
      return a.read();
    });
    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return b.read();
    });
    let dCalls = 0;
    const d = fw.computed(() => {
      dCalls++;
      return c.read();
    });

    expect(d.read()).toBe(0);
    bCalls = 0;
    cCalls = 0;
    dCalls = 0;

    a.write(1);
    expect(d.read()).toBe(1);
    expect(bCalls).toBe(1);
    expect(cCalls).toBe(1);
    expect(dCalls).toBe(1);
  },

  "#25 no re-compute if zero dependencies"(fw: ReactiveFramework) {
    let calls = 0;
    const a = fw.computed(() => {
      calls++;
      return 42;
    });

    expect(a.read()).toBe(42);
    expect(calls).toBe(1);

    // Read again — no deps means no reason to re-compute
    expect(a.read()).toBe(42);
    expect(calls).toBe(1);
  },

  "#27 downstream not re-evaluated unless value changed"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    // b clamps to [0, 10]
    const b = fw.computed(() => Math.min(10, Math.max(0, a.read())));

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return b.read();
    });

    expect(c.read()).toBe(0);
    cCalls = 0;

    // a goes negative but b stays 0
    a.write(-1);
    expect(c.read()).toBe(0);
    expect(cCalls).toBe(0);

    // a changes b
    a.write(5);
    expect(c.read()).toBe(5);
    expect(cCalls).toBe(1);

    cCalls = 0;

    // a goes over 10 but b stays 10
    a.write(11);
    expect(c.read()).toBe(10);
    cCalls = 0;

    a.write(20);
    expect(c.read()).toBe(10);
    expect(cCalls).toBe(0);
  },
});

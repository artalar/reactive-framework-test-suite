import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Equality & Same-Value Optimization", {
  "#28 same primitive value — no propagation"(fw: ReactiveFramework) {
    const a = fw.signal(1);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read();
    });

    expect(c.read()).toBe(1);
    expect(cCalls).toBe(1);

    // Write same value
    a.write(1);
    expect(c.read()).toBe(1);
    expect(cCalls).toBe(1);
  },

  "#29 NaN is treated as no-change"(fw: ReactiveFramework) {
    const a = fw.signal(NaN);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read();
    });

    expect(c.read()).toBeNaN();
    expect(cCalls).toBe(1);

    // NaN === NaN should be treated as no change
    a.write(NaN);
    expect(c.read()).toBeNaN();
    expect(cCalls).toBe(1);
  },

  "#32 computed same result — no downstream propagation"(
    fw: ReactiveFramework
  ) {
    // A → B → C, B always returns "foo"
    const a = fw.signal("a");
    const b = fw.computed(() => {
      a.read();
      return "foo";
    });

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return b.read();
    });

    expect(c.read()).toBe("foo");
    expect(cCalls).toBe(1);

    a.write("aa");
    expect(c.read()).toBe("foo");
    expect(cCalls).toBe(1);
  },

  "#34 pruning stops at first unchanged node"(fw: ReactiveFramework) {
    // A → B → C → D
    // B always returns constant after first change
    const a = fw.signal(0);
    const b = fw.computed(() => (a.read() > 0 ? 1 : 0));

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
    cCalls = 0;
    dCalls = 0;

    a.write(1);
    expect(d.read()).toBe(1);
    cCalls = 0;
    dCalls = 0;

    // a changes but b still returns 1
    a.write(2);
    expect(d.read()).toBe(1);
    expect(cCalls).toBe(0);
    expect(dCalls).toBe(0);
  },

  "#30 signal object identity"(fw: ReactiveFramework) {
    const obj = { x: 1 };
    const a = fw.signal(obj);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read();
    });

    expect(c.read()).toBe(obj);
    expect(cCalls).toBe(1);

    // Write same reference — no propagation
    a.write(obj);
    expect(c.read()).toBe(obj);
    expect(cCalls).toBe(1);

    // Write different object with same shape — should propagate
    a.write({ x: 1 });
    expect(c.read()).toEqual({ x: 1 });
    expect(cCalls).toBe(2);
  },
});

import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Equality & Same-Value Optimization";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
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

  "#169 live pruning: effect not re-run when intermediate computed returns same"(
    fw: ReactiveFramework
  ) {
    const s = fw.signal(0);
    const c1 = fw.computed(() => s.read());
    const c2 = fw.computed(() => {
      c1.read();
      return 5;
    });

    let runs = 0;
    fw.effect(() => {
      c2.read();
      runs++;
    });
    expect(runs).toBe(1);

    s.write(1);
    expect(runs).toBe(1);

    s.write(2);
    expect(runs).toBe(1);
  },

};

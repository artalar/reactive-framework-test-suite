import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";

export const section = "Stale Evaluation Order";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
  "#94 stale invocation does not trigger pending computations"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let bCalls = 0;
    const b = fw.computed(() => {
      bCalls++;
      return a.read();
    });
    const c = fw.computed(() => {
      a.read();
      return "c";
    });
    let dCalls = 0;
    const d = fw.computed(() => {
      dCalls++;
      return b.read() + " " + c.read();
    });

    expect(d.read()).toBe("0 c");
    bCalls = 0;
    dCalls = 0;

    a.write(1);
    expect(d.read()).toBe("1 c");
    expect(bCalls).toBe(1);
    expect(dCalls).toBe(1);
  },

  "#95 stale computations evaluated before their dependees"(
    fw: ReactiveFramework
  ) {
    const order: string[] = [];
    const a = fw.signal(0);
    const b = fw.computed(() => {
      order.push("b");
      return a.read();
    });
    const c = fw.computed(() => {
      order.push("c");
      return b.read();
    });

    expect(c.read()).toBe(0);
    order.length = 0;

    a.write(1);
    expect(c.read()).toBe(1);
    expect(order.indexOf("b")).toBeLessThan(order.indexOf("c"));
  },

  "#96 downstream correctly marked stale on dep change"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal("a");
    const b = fw.computed(() => a.read());
    const c = fw.computed(() => b.read());
    const d = fw.computed(() => c.read());

    expect(d.read()).toBe("a");
    a.write("b");
    expect(d.read()).toBe("b");
    a.write("c");
    expect(d.read()).toBe("c");
  },

  "#158 stale chained computed accessed after update: values fresh"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() + 1);
    const c = fw.computed(() => b.read() + 1);
    const d = fw.computed(() => c.read() + 1);

    expect(d.read()).toBe(3);

    a.write(10);

    expect(b.read()).toBe(11);
    expect(c.read()).toBe(12);
    expect(d.read()).toBe(13);
  },

  "#159 pending computation created after dirty signal still updates"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);

    a.write(5);

    const c = fw.computed(() => b.read() + 1);
    expect(c.read()).toBe(11);

    a.write(10);
    expect(c.read()).toBe(21);
  },

  "#97 flags indirectly updated during dirty-checking"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read());
    const c = fw.computed(() => b.read());
    const d = fw.computed(() => {
      // d depends on both a and c
      return a.read() + c.read();
    });

    expect(d.read()).toBe(0);
    a.write(1);
    // a=1, b=1, c=1, d=1+1=2
    expect(d.read()).toBe(2);
  },
};

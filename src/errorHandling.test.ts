import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Error Handling", {
  "#84 graph stays consistent after error in initial computed"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => {
      if (a.read() === 0) throw new Error("initial error");
      return a.read();
    });

    expect(() => b.read()).toThrow("initial error");

    a.write(1);
    expect(b.read()).toBe(1);
  },

  "#85 graph stays consistent after error in computed re-evaluation"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(1);
    const b = fw.computed(() => {
      if (a.read() === 2) throw new Error("re-eval error");
      return a.read();
    });

    expect(b.read()).toBe(1);

    a.write(2);
    expect(() => b.read()).toThrow("re-eval error");

    a.write(3);
    expect(b.read()).toBe(3);
  },

  "#86 computed caches thrown exception"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    let calls = 0;
    const b = fw.computed(() => {
      calls++;
      if (a.read() === 0) throw new Error("cached error");
      return a.read();
    });

    expect(() => b.read()).toThrow("cached error");
    const callsAfterFirst = calls;

    expect(() => b.read()).toThrow("cached error");
    expect(calls).toBe(callsAfterFirst);

    a.write(1);
    expect(b.read()).toBe(1);
  },

  "#87 errors in one computed don't leak to unrelated dependents"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.signal(10);

    const bad = fw.computed(() => {
      if (a.read() > 0) throw new Error("bad");
      return a.read();
    });

    const good = fw.computed(() => b.read() * 2);

    expect(good.read()).toBe(20);
    a.write(1);

    expect(() => bad.read()).toThrow("bad");
    expect(good.read()).toBe(20);

    b.write(20);
    expect(good.read()).toBe(40);
  },

  "#93 exception recovery in computed"(fw: ReactiveFramework) {
    const a = fw.signal(true);
    const b = fw.computed(() => {
      if (a.read()) throw new Error("fail");
      return "ok";
    });

    expect(() => b.read()).toThrow("fail");

    a.write(false);
    expect(b.read()).toBe("ok");

    a.write(true);
    expect(() => b.read()).toThrow("fail");
  },
});

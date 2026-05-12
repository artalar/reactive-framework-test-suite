import { expect } from "vitest";
import { testMatrix } from "./testMatrix.js";
import type { ReactiveFramework } from "./framework.js";

testMatrix("Dynamic Dependencies", {
  "#12 active dep triggers, inactive dep does not"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const b = fw.signal("b");
    const cond = fw.signal(true);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return cond.read() ? a.read() : b.read();
    });

    expect(c.read()).toBe("a");
    expect(cCalls).toBe(1);

    // b is inactive, changing it should not trigger c
    b.write("bb");
    expect(c.read()).toBe("a");
    expect(cCalls).toBe(1);

    // a is active, changing it should trigger c
    a.write("aa");
    expect(c.read()).toBe("aa");
    expect(cCalls).toBe(2);
  },

  "#13 switching branches deactivates old deps"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const b = fw.signal("b");
    const cond = fw.signal(true);

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return cond.read() ? a.read() : b.read();
    });

    expect(c.read()).toBe("a");
    cCalls = 0;

    // Switch to b branch
    cond.write(false);
    expect(c.read()).toBe("b");
    cCalls = 0;

    // a is now inactive
    a.write("aa");
    expect(c.read()).toBe("b");
    expect(cCalls).toBe(0);

    // b is now active
    b.write("bb");
    expect(c.read()).toBe("bb");
    expect(cCalls).toBe(1);
  },

  "#14 new deps updated before dependee"(fw: ReactiveFramework) {
    const a = fw.signal(1);
    const b = fw.signal(10);
    const cond = fw.signal(false);

    const c = fw.computed(() => a.read());
    const d = fw.computed(() => (cond.read() ? c.read() : b.read()));

    expect(d.read()).toBe(10);

    // Switch to c branch, and change a at the same time
    cond.write(true);
    a.write(2);
    // d should see the updated a through c
    expect(d.read()).toBe(2);
  },

  "#15 only subscribes to signals actually read"(fw: ReactiveFramework) {
    const a = fw.signal("a");
    const b = fw.computed(() => a.read());

    let cCalls = 0;
    const c = fw.computed(() => {
      cCalls++;
      return a.read();
    });
    // c is never read — should never be evaluated

    expect(b.read()).toBe("a");
    expect(cCalls).toBe(0);

    a.write("aa");
    expect(b.read()).toBe("aa");
    expect(cCalls).toBe(0);
  },

  "#16 lazy branch"(fw: ReactiveFramework) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read());
    const c = fw.computed(() => (a.read() > 0 ? a.read() : b.read()));

    expect(c.read()).toBe(0);
    a.write(1);
    expect(c.read()).toBe(1);
    a.write(0);
    expect(c.read()).toBe(0);
  },
});

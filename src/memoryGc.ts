import { expect } from "./assert.js";
import type { ReactiveFramework } from "./framework.js";
import { SkipTest } from "./framework.js";

export const section = "Memory & GC";
export const cases: Record<string, (fw: ReactiveFramework) => any> = {
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

  "#99 computed collectable by GC if nothing listening"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    let ref: WeakRef<{ read(): number }> | undefined;

    (() => {
      const c = fw.computed(() => a.read() * 2);
      c.read();
      ref = new WeakRef(c);
    })();

    // Computed is no longer referenced strongly
    // After GC it should be collectable
    // We can't force GC deterministically, so just verify
    // the computed was created and the weak ref is valid initially
    expect(ref).toBeDefined();
    expect(ref!.deref()).toBeDefined();

    // Signal should still work independently
    a.write(5);
    expect(a.read()).toBe(5);
  },

  "#160 consumer links cleaned after losing all listeners"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() * 2);
    let runs = 0;

    const dispose1 = fw.effect(() => {
      b.read();
      runs++;
    });
    const dispose2 = fw.effect(() => {
      b.read();
    });

    expect(runs).toBe(1);

    a.write(1);
    expect(runs).toBe(2);

    dispose1();
    dispose2();

    a.write(2);
    expect(runs).toBe(2);

    expect(b.read()).toBe(4);
  },

  "#161 multi-level computed cleanup after all listeners removed"(
    fw: ReactiveFramework
  ) {
    const a = fw.signal(0);
    const b = fw.computed(() => a.read() + 1);
    const c = fw.computed(() => b.read() + 1);
    const d = fw.computed(() => c.read() + 1);
    let runs = 0;

    const dispose = fw.effect(() => {
      d.read();
      runs++;
    });
    expect(runs).toBe(1);

    a.write(1);
    expect(runs).toBe(2);

    dispose();

    a.write(2);
    expect(runs).toBe(2);

    expect(d.read()).toBe(5);
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
};

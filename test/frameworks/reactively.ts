import type { ReactiveFramework } from "../../src/framework.js";
import { reactive, stabilize } from "@reactively/core";

let tracked: any[] = [];

export const reactivelyFramework: ReactiveFramework = {
  name: "@reactively/core",
  signal(initialValue) {
    const r = reactive(initialValue);
    tracked.push(r);
    return {
      read: () => r.value,
      write: (v) => {
        r.value = v;
        stabilize();
      },
    };
  },
  computed(fn) {
    const r = reactive(fn);
    tracked.push(r);
    return { read: () => r.value };
  },
  effect(fn) {
    const r = reactive(fn, { effect: true });
    tracked.push(r);
    stabilize();
    return () => {
      (r as any).effect = false;
      (r as any).removeParentObservers();
    };
  },
  run(fn) {
    return fn();
  },
  afterEach() {
    for (const r of tracked) {
      (r as any).effect = false;
      (r as any).state = 0; // CacheClean — prevents re-evaluation during stabilize
      try {
        (r as any).removeParentObservers();
      } catch {}
    }
    tracked = [];
    // Flush EffectQueue — stabilize() clears it at the end if no throw
    try {
      stabilize();
    } catch {}
  },
  computedThrows: true,
};

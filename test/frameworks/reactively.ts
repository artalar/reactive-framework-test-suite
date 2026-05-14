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
    try {
      fn();
    } finally {
      for (const r of tracked) {
        (r as any).effect = false;
        (r as any).state = 0;
        try { (r as any).removeParentObservers(); } catch {}
      }
      tracked = [];
      try { stabilize(); } catch {}
    }
  },
};

import type { ReactiveFramework } from "../framework.js";
import { writable, computed, derived, get, batch } from "@amadeus-it-group/tansu";

export const tansuFramework: ReactiveFramework = {
  name: "tansu",
  signal(initialValue) {
    const w = writable(initialValue);
    return {
      read: () => get(w),
      write: (v) => w.set(v),
    };
  },
  computed(fn) {
    const d = computed(fn);
    return { read: () => get(d) };
  },
  effect(fn) {
    const d = computed(fn);
    const unsub = d.subscribe(() => {});
    return unsub;
  },
  run(fn) {
    return fn();
  },
  batch(fn) {
    batch(fn);
  },
  signalWithEquals(initialValue, equals) {
    const w = writable(initialValue, { equal: equals });
    return {
      read: () => get(w),
      write: (v) => w.set(v),
    };
  },
  computedWithEquals(fn, equals) {
    const d = computed(fn, { equal: equals });
    return { read: () => get(d) };
  },
};

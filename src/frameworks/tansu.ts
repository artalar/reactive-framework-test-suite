import type { ReactiveFramework } from "../framework.js";
import { writable, computed, derived, get } from "@amadeus-it-group/tansu";

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
    d.subscribe(() => {});
  },
  run(fn) {
    return fn();
  },
};

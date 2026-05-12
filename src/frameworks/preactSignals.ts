import type { ReactiveFramework } from "../framework.js";
import {
  signal,
  computed,
  effect,
} from "@preact/signals-core";

export const preactSignalsFramework: ReactiveFramework = {
  name: "@preact/signals-core",
  signal(initialValue) {
    const s = signal(initialValue);
    return {
      read: () => s.value,
      write: (v) => (s.value = v),
    };
  },
  computed(fn) {
    const c = computed(fn);
    return { read: () => c.value };
  },
  effect(fn) {
    effect(fn);
  },
  run(fn) {
    return fn();
  },
};

import type { ReactiveFramework } from "../framework.js";
import { signal, computed, effect } from "@angular/core";

export const angularSignalsFramework: ReactiveFramework = {
  name: "@angular/core",
  signal(initialValue) {
    const s = signal(initialValue);
    return {
      read: () => s(),
      write: (v) => s.set(v),
    };
  },
  computed(fn) {
    const c = computed(fn);
    return { read: () => c() };
  },
  effect(fn) {
    const ref = effect(fn);
    return () => ref.destroy();
  },
  run(fn) {
    return fn();
  },
  signalWithEquals(initialValue, equals) {
    const s = signal(initialValue, { equal: equals });
    return {
      read: () => s(),
      write: (v) => s.set(v),
    };
  },
  computedWithEquals(fn, equals) {
    const c = computed(fn, { equal: equals });
    return { read: () => c() };
  },
};

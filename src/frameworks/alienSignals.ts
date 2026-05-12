import type { ReactiveFramework } from "../framework.js";
import {
  signal,
  computed,
  effect,
  effectScope,
} from "alien-signals";

export const alienSignalsFramework: ReactiveFramework = {
  name: "alien-signals",
  signal(initialValue) {
    const s = signal(initialValue);
    return {
      read: () => s(),
      write: (v) => s(v),
    };
  },
  computed(fn) {
    const c = computed(fn);
    return { read: () => c() };
  },
  effect(fn) {
    effect(fn);
  },
  run(fn) {
    const dispose = effectScope(fn);
    return dispose as any;
  },
};

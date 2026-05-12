import type { ReactiveFramework } from "../framework.js";
import {
  signal,
  computed,
  effect,
  effectScope,
  startBatch,
  endBatch,
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
    return effect(fn) as unknown as () => void;
  },
  run(fn) {
    const dispose = effectScope(fn);
    return dispose as any;
  },
  batch(fn) {
    startBatch();
    try {
      fn();
    } finally {
      endBatch();
    }
  },
  effectScope(fn) {
    return effectScope(fn) as unknown as () => void;
  },
};

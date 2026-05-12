import type { ReactiveFramework } from "../../src/framework.js";
import {
  signal,
  computed,
  effect,
  effectScope,
  startBatch,
  endBatch,
  setActiveSub,
  // @ts-ignore — local dev path
} from "/Users/johnsonchu/Desktop/GitHub/alien-signals/esm/index.mjs";
// effectScope is still imported for run() but removed from framework interface

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
  untracked(fn) {
    const prev = setActiveSub(undefined);
    try {
      return fn();
    } finally {
      setActiveSub(prev);
    }
  },
  effectCleanup: true,
  computedThrows: true,
};

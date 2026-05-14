import type { ReactiveFramework } from "../../src/framework.js";
// @ts-ignore — import from dist to access unexported startBatch/endBatch
import {
  ref,
  computed,
  ReactiveEffect,
  pauseTracking,
  resetTracking,
  onEffectCleanup,
  startBatch,
  endBatch,
} from "@vue/reactivity/dist/reactivity.esm-bundler.js";

export const vueReactivityFramework: ReactiveFramework = {
  name: "@vue/reactivity",
  signal(initialValue) {
    const r = ref(initialValue);
    return {
      read: () => r.value as typeof initialValue,
      write: (v) => {
        r.value = v as any;
      },
    };
  },
  computed(fn) {
    const c = computed(fn);
    return { read: () => c.value };
  },
  effect(fn) {
    const e = new ReactiveEffect(() => {
      const cleanup = fn();
      if (typeof cleanup === "function") {
        onEffectCleanup(cleanup);
      }
    });
    e.run();
    return () => e.stop();
  },
  run(fn) {
    fn();
  },
  untracked(fn) {
    pauseTracking();
    try {
      return fn();
    } finally {
      resetTracking();
    }
  },
  batch(fn) {
    startBatch();
    try {
      fn();
    } finally {
      endBatch();
    }
  },
};

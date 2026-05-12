import type { ReactiveFramework } from "../framework.js";
import {
  ref,
  computed,
  ReactiveEffect,
  effectScope,
  pauseTracking,
  resetTracking,
} from "@vue/reactivity";

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
    const e = new ReactiveEffect(fn);
    e.run();
    return () => e.stop();
  },
  run(fn) {
    return fn();
  },
  untracked(fn) {
    pauseTracking();
    try {
      return fn();
    } finally {
      resetTracking();
    }
  },
  effectScope(fn) {
    const scope = effectScope();
    scope.run(fn);
    return () => scope.stop();
  },
};

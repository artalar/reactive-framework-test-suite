import type { ReactiveFramework } from "../framework.js";
import {
  ref,
  computed,
  effect,
  ReactiveEffect,
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
  },
  run(fn) {
    return fn();
  },
};

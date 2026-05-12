import type { ReactiveFramework } from "../framework.js";
import { reactive, stabilize } from "@reactively/core";

export const reactivelyFramework: ReactiveFramework = {
  name: "@reactively/core",
  signal(initialValue) {
    const r = reactive(initialValue);
    return {
      read: () => r.value,
      write: (v) => (r.value = v),
    };
  },
  computed(fn) {
    const r = reactive(fn);
    return { read: () => r.value };
  },
  effect(fn) {
    reactive(fn, true);
    stabilize();
    return () => {};
  },
  run(fn) {
    return fn();
  },
  signalWithEquals(initialValue, equals) {
    const r = reactive(initialValue, { equals });
    return {
      read: () => r.value,
      write: (v) => (r.value = v),
    };
  },
};

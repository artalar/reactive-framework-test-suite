import type { ReactiveFramework } from "../framework.js";
import {
  createSignal,
  memo,
  effect,
  batch,
  root,
  cleanup,
  untrack,
  // @ts-ignore — pota types incomplete in Node
} from "pota";

export const potaFramework: ReactiveFramework = {
  name: "pota",
  signal(initialValue) {
    const [read, write] = createSignal(initialValue);
    return { read, write };
  },
  computed(fn) {
    return { read: memo(fn) };
  },
  effect(fn) {
    effect(() => {
      const cl = fn();
      if (typeof cl === "function") {
        cleanup(cl);
      }
    });
    return () => {};
  },
  run(fn) {
    let result: any;
    root((dispose: () => void) => {
      result = fn();
    });
    return result;
  },
  batch(fn) {
    batch(fn);
  },
  untracked(fn) {
    return untrack(fn);
  },
  effectCleanup: true,
  computedThrows: true,
};

import type { ReactiveFramework } from "../framework.js";
import {
  createSignal,
  createMemo,
  createEffect,
  createRoot,
  batch,
  untrack,
} from "solid-js";

export const solidFramework: ReactiveFramework = {
  name: "solid-js",
  signal(initialValue) {
    const [read, write] = createSignal(initialValue);
    return {
      read: read as () => typeof initialValue,
      write,
    };
  },
  computed(fn) {
    return { read: createMemo(fn) };
  },
  effect(fn) {
    createEffect(fn);
    return () => {};
  },
  run(fn) {
    let result: any;
    createRoot((dispose) => {
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
};

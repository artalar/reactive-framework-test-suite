import type { ReactiveFramework } from "../framework.js";
import {
  createSignal,
  createMemo,
  createEffect,
  createRoot,
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
  },
  run(fn) {
    let result: any;
    createRoot((dispose) => {
      result = fn();
    });
    return result;
  },
};

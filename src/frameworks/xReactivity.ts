import type { ReactiveFramework } from "../framework.js";
import {
  createSignal,
  createMemo,
  createEffect,
  createRoot,
  flushSync,
} from "@solidjs/signals";

export const xReactivityFramework: ReactiveFramework = {
  name: "@solidjs/signals",
  signal(initialValue) {
    const [read, write] = createSignal(initialValue);
    return {
      read: read as () => typeof initialValue,
      write,
    };
  },
  computed(fn) {
    return { read: createMemo(fn) as () => ReturnType<typeof fn> };
  },
  effect(fn) {
    createEffect(fn);
    flushSync();
    return () => {};
  },
  run(fn) {
    let result: any;
    createRoot((dispose) => {
      result = fn();
    });
    return result;
  },
};

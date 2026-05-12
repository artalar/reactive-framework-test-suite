import type { ReactiveFramework } from "../framework.js";
import {
  createSignal,
  createMemo,
  createEffect,
  createRoot,
  flushSync,
} from "@solidjs/signals";

function safeFlush() {
  try {
    flushSync();
  } catch {}
}

export const xReactivityFramework: ReactiveFramework = {
  name: "@solidjs/signals",
  signal(initialValue) {
    const [read, write] = createSignal(initialValue);
    return {
      read: read as () => typeof initialValue,
      write: (v) => {
        write(v);
        safeFlush();
      },
    };
  },
  computed(fn) {
    return { read: createMemo(fn) as () => ReturnType<typeof fn> };
  },
  effect(fn) {
    createEffect(fn);
    safeFlush();
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

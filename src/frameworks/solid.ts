import type { ReactiveFramework } from "../framework.js";
// Must import from dist/solid.cjs to get the client reactive runtime.
// The default "solid-js" resolves to server build under Node condition,
// which lacks the reactive runtime.
// @ts-ignore
import {
  createSignal,
  createMemo,
  createComputed,
  createRoot,
  batch,
  untrack,
  onCleanup,
} from "solid-js/dist/solid.cjs";

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
    let dispose!: () => void;
    createRoot((d: () => void) => {
      dispose = d;
      createComputed(() => {
        const cleanup = fn();
        if (typeof cleanup === "function") {
          onCleanup(cleanup);
        }
      });
    });
    return dispose;
  },
  run(fn) {
    let result: any;
    createRoot((dispose: () => void) => {
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
};

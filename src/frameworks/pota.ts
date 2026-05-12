import type { ReactiveFramework } from "../framework.js";
import {
  createSignal,
  memo,
  effect,
  batch,
  root,
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
    effect(fn);
  },
  run(fn) {
    let result: any;
    root((dispose) => {
      result = fn();
    });
    return result;
  },
};

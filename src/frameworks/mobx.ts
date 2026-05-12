import type { ReactiveFramework } from "../framework.js";
import {
  observable,
  computed,
  autorun,
  runInAction,
} from "mobx";

export const mobxFramework: ReactiveFramework = {
  name: "mobx",
  signal(initialValue) {
    const o = observable.box(initialValue);
    return {
      read: () => o.get(),
      write: (v) => runInAction(() => o.set(v)),
    };
  },
  computed(fn) {
    const c = computed(fn);
    return { read: () => c.get() };
  },
  effect(fn) {
    autorun(fn);
  },
  run(fn) {
    return fn();
  },
};

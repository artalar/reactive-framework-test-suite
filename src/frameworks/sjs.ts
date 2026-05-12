import type { ReactiveFramework } from "../framework.js";
import S from "s-js";

export const sjsFramework: ReactiveFramework = {
  name: "S.js",
  signal(initialValue) {
    const s = S.data(initialValue);
    return {
      read: () => s(),
      write: (v) => s(v),
    };
  },
  computed(fn) {
    const c = S(fn);
    return { read: () => c() };
  },
  effect(fn) {
    let dispose!: () => void;
    S.root((d: () => void) => {
      dispose = d;
      S(() => {
        const cleanup = fn();
        if (typeof cleanup === "function") {
          S.cleanup(cleanup);
        }
      });
    });
    return dispose;
  },
  run(fn) {
    let result: any;
    S.root(() => {
      result = fn();
    });
    return result;
  },
  batch(fn) {
    S.freeze(fn);
  },
  untracked(fn) {
    return S.sample(fn);
  },
  effectCleanup: true,
};

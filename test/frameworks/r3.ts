import type { ReactiveFramework } from "../../src/framework.js";
import {
  signal as createSignal,
  computed as createComputed,
  read,
  setSignal,
  stabilize,
  onCleanup,
  type Computed,
  type Signal,
} from "r3/src/index.js";

export const r3Framework: ReactiveFramework = {
  name: "r3",
  signal(initialValue) {
    const s = createSignal(initialValue);
    return {
      read: () => read(s),
      write: (v) => {
        setSignal(s as Signal<typeof v>, v);
        stabilize();
      },
    };
  },
  computed(fn) {
    const c = createComputed(fn);
    return { read: () => read(c) };
  },
  effect(fn) {
    const c = createComputed(() => {
      const cleanup = fn();
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    });
    return () => {
      // Unlink from all deps to stop reacting
      let dep = c.deps;
      while (dep !== null) {
        const nextDep = dep.nextDep;
        const nextSub = dep.nextSub;
        const prevSub = dep.prevSub;
        if (nextSub !== null) {
          nextSub.prevSub = prevSub;
        } else {
          dep.dep.subsTail = prevSub;
        }
        if (prevSub !== null) {
          prevSub.nextSub = nextSub;
        } else {
          dep.dep.subs = nextSub;
        }
        dep = nextDep;
      }
      c.deps = null;
      c.depsTail = null;
      c.fn = () => undefined as any;
    };
  },
  run(fn) {
    return fn();
  },
  computedThrows: true,
};

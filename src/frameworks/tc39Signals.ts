import type { ReactiveFramework } from "../framework.js";
import { Signal } from "signal-polyfill";

let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;
    queueMicrotask(processPending);
  }
});

function processPending() {
  needsEnqueue = true;
  for (const s of w.getPending()) {
    try {
      s.get();
    } catch {}
  }
  w.watch();
}

export const tc39SignalsFramework: ReactiveFramework = {
  name: "signal-polyfill (TC39)",
  signal(initialValue) {
    const s = new Signal.State(initialValue);
    return {
      read: () => s.get(),
      write: (v) => s.set(v),
    };
  },
  computed(fn) {
    const c = new Signal.Computed(fn);
    return { read: () => c.get() };
  },
  effect(fn) {
    const c = new Signal.Computed(() => fn());
    w.watch(c);
    c.get();
    return () => w.unwatch(c);
  },
  run(fn) {
    return fn();
  },
  untracked(fn) {
    return Signal.subtle.untrack(fn);
  },
  signalWithEquals(initialValue, equals) {
    const s = new Signal.State(initialValue, { equals });
    return {
      read: () => s.get(),
      write: (v) => s.set(v),
    };
  },
  computedWithEquals(fn, equals) {
    const c = new Signal.Computed(fn, { equals });
    return { read: () => c.get() };
  },
};

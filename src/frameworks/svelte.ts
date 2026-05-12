import type { ReactiveFramework } from "../framework.js";
import * as $ from "svelte/internal/client";

export const svelteFramework: ReactiveFramework = {
  name: "svelte",
  signal(initialValue) {
    const s = $.state(initialValue);
    return {
      read: () => $.get(s),
      write: (v) => $.set(s, v),
    };
  },
  computed(fn) {
    const c = $.derived(() => fn());
    return { read: () => $.get(c) };
  },
  effect(fn) {
    $.render_effect(fn);
    return () => {};
  },
  run(fn) {
    let result: any;
    const destroy = $.effect_root(() => {
      result = fn();
    });
    $.flush();
    return result;
  },
};
